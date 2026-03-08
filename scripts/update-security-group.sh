#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Atoms Ninja — EC2 Security Group Hardener
# Applies least-privilege inbound rules to sg-0047128872be65558 using
# the IP ranges defined in ip-attribution.json.
#
# Usage:
#   bash scripts/update-security-group.sh              # dry-run (safe preview)
#   bash scripts/update-security-group.sh --dry-run    # explicit dry-run
#   bash scripts/update-security-group.sh --apply      # LIVE — applies changes
#
# Prerequisites:
#   - AWS CLI configured with EC2 permissions
#   - ip-attribution.json populated (run: npm run fetch-ips first)
#   - admin.ssh_source_ip set to your actual IP in ip-attribution.json
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/ip-attribution.json"
DRY_RUN=true  # Safe default — must pass --apply to make live changes

# ── Parse flags ──────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --apply)    DRY_RUN=false ;;
    --dry-run)  DRY_RUN=true  ;;
  esac
done

echo "🔥 Atoms Ninja — Security Group Hardener"
echo "   Config:  $CONFIG_FILE"
echo "   Mode:    $([ "$DRY_RUN" = true ] && echo 'DRY-RUN (no changes will be made)' || echo '⚡ LIVE APPLY')"
echo ""

# ── Dependency check ─────────────────────────────────────────────────
for cmd in aws python3 jq; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Required command '$cmd' not found."
    exit 1
  fi
done

# ── Load config ──────────────────────────────────────────────────────
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ $CONFIG_FILE not found. Run 'npm run fetch-ips' first."
  exit 1
fi

SG_ID=$(jq -r '.security_group.sg_id' "$CONFIG_FILE")
REGION=$(jq -r '.security_group.region' "$CONFIG_FILE")
ADMIN_IP=$(jq -r '.admin.ssh_source_ip' "$CONFIG_FILE")

# Validate admin IP is set
if [ "$ADMIN_IP" = "YOUR_ADMIN_IP/32" ] || [ -z "$ADMIN_IP" ]; then
  echo "❌ Admin IP not configured. Edit ip-attribution.json and set admin.ssh_source_ip"
  exit 1
fi

# Load Vercel ranges as bash array
mapfile -t VERCEL_RANGES < <(jq -r '.vercel.ipv4_ranges[]' "$CONFIG_FILE" 2>/dev/null || true)
# Load government ranges (skip comment/placeholder lines)
mapfile -t GOVT_RANGES < <(jq -r '.government.ipv4_ranges[]' "$CONFIG_FILE" 2>/dev/null | grep -v '^#' | grep -v PLACEHOLDER || true)

echo "📋 Configuration:"
echo "   Security Group:  $SG_ID ($REGION)"
echo "   Admin SSH IP:    $ADMIN_IP"
echo "   Vercel ranges:   ${#VERCEL_RANGES[@]}"
echo "   Govt ranges:     ${#GOVT_RANGES[@]}"
echo ""

# ── Verify AWS credentials ────────────────────────────────────────────
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity --region "$REGION" --query 'Account' --output text || {
  echo "❌ AWS credentials not configured. Run: aws configure"
  exit 1
}

# ── Helper: apply or preview rule ────────────────────────────────────
apply_rule() {
  local description="$1"
  local cmd="$2"
  if [ "$DRY_RUN" = true ]; then
    echo "   [DRY-RUN] $description"
  else
    echo "   [APPLYING] $description"
    eval "$cmd" 2>/dev/null || echo "   ⚠️  Rule may already exist or overlaps — skipping"
  fi
}

revoke_rule() {
  local description="$1"
  local cmd="$2"
  if [ "$DRY_RUN" = true ]; then
    echo "   [DRY-RUN] REVOKE: $description"
  else
    echo "   [REVOKING] $description"
    eval "$cmd" 2>/dev/null || echo "   ⚠️  Rule not found or already removed — skipping"
  fi
}

# ── Step 1: Revoke overly-broad rules ────────────────────────────────
echo "🧹 Step 1: Revoking overly-broad rules..."

revoke_rule "SSH (22) from 0.0.0.0/0" \
  "aws ec2 revoke-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
   --protocol tcp --port 22 --cidr 0.0.0.0/0"

revoke_rule "Port 3001 from 0.0.0.0/0" \
  "aws ec2 revoke-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
   --protocol tcp --port 3001 --cidr 0.0.0.0/0"

revoke_rule "SSH (22) from ::/0 (IPv6)" \
  "aws ec2 revoke-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
   --ip-permissions '[{\"IpProtocol\":\"tcp\",\"FromPort\":22,\"ToPort\":22,\"Ipv6Ranges\":[{\"CidrIpv6\":\"::/0\"}]}]'"

revoke_rule "Port 3001 from ::/0 (IPv6)" \
  "aws ec2 revoke-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
   --ip-permissions '[{\"IpProtocol\":\"tcp\",\"FromPort\":3001,\"ToPort\":3001,\"Ipv6Ranges\":[{\"CidrIpv6\":\"::/0\"}]}]'"

echo ""

# ── Step 2: Allow SSH from admin IP only ─────────────────────────────
echo "🔑 Step 2: SSH access — admin IP only ($ADMIN_IP)..."
apply_rule "SSH (22) from $ADMIN_IP" \
  "aws ec2 authorize-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
   --protocol tcp --port 22 --cidr '$ADMIN_IP' \
   --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=atoms-ninja-admin-ssh},{Key=ManagedBy,Value=atoms-ninja-ip-config}]'"
echo ""

# ── Step 3: Allow port 3001 from Vercel ranges ───────────────────────
echo "🌐 Step 3: Port 3001 — Vercel serverless ranges (${#VERCEL_RANGES[@]} CIDRs)..."
if [ ${#VERCEL_RANGES[@]} -eq 0 ]; then
  echo "   ⚠️  No Vercel ranges found. Run 'npm run fetch-ips' to populate ip-attribution.json"
else
  for cidr in "${VERCEL_RANGES[@]}"; do
    apply_rule "Port 3001 from Vercel $cidr" \
      "aws ec2 authorize-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
       --protocol tcp --port 3001 --cidr '$cidr' \
       --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=atoms-ninja-vercel-api},{Key=Source,Value=vercel},{Key=ManagedBy,Value=atoms-ninja-ip-config}]'"
  done
fi
echo ""

# ── Step 4: Allow port 3001 from government IPs ──────────────────────
if [ ${#GOVT_RANGES[@]} -gt 0 ]; then
  echo "🏛️  Step 4: Port 3001 — Government / Police network ranges (${#GOVT_RANGES[@]} CIDRs)..."
  for cidr in "${GOVT_RANGES[@]}"; do
    apply_rule "Port 3001 from Govt $cidr" \
      "aws ec2 authorize-security-group-ingress --region '$REGION' --group-id '$SG_ID' \
       --protocol tcp --port 3001 --cidr '$cidr' \
       --tag-specifications 'ResourceType=security-group-rule,Tags=[{Key=Name,Value=atoms-ninja-govt},{Key=Source,Value=government},{Key=ManagedBy,Value=atoms-ninja-ip-config}]'"
  done
  echo ""
else
  echo "ℹ️  Step 4: No government IPs configured (add to ip-attribution.json when available)"
  echo ""
fi

# ── Step 5: HTTPS (443) stays open ───────────────────────────────────
echo "🔒 Step 5: HTTPS (443) — leaving open to 0.0.0.0/0 (public API)"
echo "   [OK] No changes needed for 443"
echo ""

# ── Summary ──────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
  echo "✅ Dry-run complete — no changes were made."
  echo ""
  echo "   Review the output above, then run:"
  echo "   npm run secure-sg -- --apply"
else
  echo "✅ Security group $SG_ID updated successfully."
  echo ""
  echo "   Verify with:"
  echo "   aws ec2 describe-security-groups --group-ids $SG_ID --region $REGION"
fi
echo "═══════════════════════════════════════════════════════"
