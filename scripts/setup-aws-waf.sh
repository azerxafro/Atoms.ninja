#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Atoms Ninja — AWS WAF v2 Setup
# Creates a REGIONAL Web ACL with:
#   - Vercel IP allowlist (port 3001 / API endpoints)
#   - Rate-based rule (2000 req/5 min per IP)
#   - Default block action for unapproved sources on /api/kali and /api/execute
#
# ⚠️  BUDGET WARNING: AWS WAF costs ~$5-10/month (web ACL + rules + requests).
#     Current budget is $33/month ($100 over 3 months).
#     Only enable WAF if you have headroom in the budget.
#     Run: bash scripts/check-aws-costs.sh to check current spend.
#
# Usage:
#   bash scripts/setup-aws-waf.sh              # dry-run (preview only)
#   bash scripts/setup-aws-waf.sh --dry-run    # explicit dry-run
#   bash scripts/setup-aws-waf.sh --apply      # LIVE — creates WAF resources
#
# Prerequisites:
#   - AWS CLI configured with wafv2 permissions
#   - ip-attribution.json populated (run: npm run fetch-ips first)
#   - jq installed
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG_FILE="$REPO_ROOT/ip-attribution.json"
DRY_RUN=true
REGION="us-east-1"
WAF_NAME="atoms-ninja-waf"
IP_SET_NAME="atoms-ninja-vercel-ips"
SCOPE="REGIONAL"

# ── Parse flags ──────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --apply)    DRY_RUN=false ;;
    --dry-run)  DRY_RUN=true  ;;
  esac
done

echo "🛡️  Atoms Ninja — AWS WAF v2 Setup"
echo "   WAF Name: $WAF_NAME"
echo "   Scope:    $SCOPE"
echo "   Region:   $REGION"
echo "   Mode:     $([ "$DRY_RUN" = true ] && echo 'DRY-RUN (no changes)' || echo '⚡ LIVE APPLY')"
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

# Load Vercel ranges — WAF IP sets require /16 or /32 (no arbitrary CIDRs)
# Filter to valid IPv4 CIDR ranges only
mapfile -t VERCEL_RANGES < <(jq -r '.vercel.ipv4_ranges[]' "$CONFIG_FILE" 2>/dev/null || true)
mapfile -t GOVT_RANGES < <(jq -r '.government.ipv4_ranges[]' "$CONFIG_FILE" 2>/dev/null | grep -v '^#' | grep -v PLACEHOLDER || true)

# Combine Vercel + Government IPs for the allowlist
ALL_ALLOWED_IPS=("${VERCEL_RANGES[@]:-}" "${GOVT_RANGES[@]:-}")
# Deduplicate
mapfile -t ALL_ALLOWED_IPS < <(printf '%s\n' "${ALL_ALLOWED_IPS[@]}" | sort -u | grep -v '^$' || true)

echo "📋 IP Set to configure:"
echo "   Vercel ranges:   ${#VERCEL_RANGES[@]}"
echo "   Govt ranges:     ${#GOVT_RANGES[@]}"
echo "   Total allowlist: ${#ALL_ALLOWED_IPS[@]} CIDRs"
echo ""

# ── Build IP Set addresses JSON ──────────────────────────────────────
if [ ${#ALL_ALLOWED_IPS[@]} -gt 0 ]; then
  IP_ADDRESSES_JSON=$(printf '%s\n' "${ALL_ALLOWED_IPS[@]}" | python3 -c "
import sys, json
ips = [l.strip() for l in sys.stdin if l.strip()]
print(json.dumps(ips))
")
else
  IP_ADDRESSES_JSON='["0.0.0.0/32"]'  # Placeholder to avoid empty set error
  echo "⚠️  No valid IP ranges found — using placeholder. Run 'npm run fetch-ips' first."
fi

# ── Helper ────────────────────────────────────────────────────────────
run_or_preview() {
  local description="$1"
  local cmd="$2"
  if [ "$DRY_RUN" = true ]; then
    echo "   [DRY-RUN] $description"
  else
    echo "   [APPLYING] $description"
    eval "$cmd"
  fi
}

# ── Step 1: Create or update Vercel IP Set ───────────────────────────
echo "📡 Step 1: Create IP Set '$IP_SET_NAME'..."

if [ "$DRY_RUN" = false ]; then
  # Check if IP set already exists
  EXISTING_IPSET=$(aws wafv2 list-ip-sets \
    --scope "$SCOPE" \
    --region "$REGION" \
    --query "IPSets[?Name=='$IP_SET_NAME'].[Id,LockToken]" \
    --output text 2>/dev/null || echo "")

  if [ -z "$EXISTING_IPSET" ]; then
    echo "   Creating new IP Set..."
    IPSET_RESULT=$(aws wafv2 create-ip-set \
      --name "$IP_SET_NAME" \
      --scope "$SCOPE" \
      --region "$REGION" \
      --ip-address-version IPV4 \
      --addresses $IP_ADDRESSES_JSON \
      --description "Atoms Ninja — Vercel serverless + Government IPs" \
      --tags Key=Project,Value=atoms-ninja Key=ManagedBy,Value=atoms-ninja-ip-config)
    IPSET_ID=$(echo "$IPSET_RESULT" | jq -r '.Summary.Id')
    echo "   ✅ IP Set created: $IPSET_ID"
  else
    IPSET_ID=$(echo "$EXISTING_IPSET" | awk '{print $1}')
    LOCK_TOKEN=$(echo "$EXISTING_IPSET" | awk '{print $2}')
    echo "   Updating existing IP Set ($IPSET_ID)..."
    aws wafv2 update-ip-set \
      --name "$IP_SET_NAME" \
      --scope "$SCOPE" \
      --region "$REGION" \
      --id "$IPSET_ID" \
      --lock-token "$LOCK_TOKEN" \
      --addresses $IP_ADDRESSES_JSON
    echo "   ✅ IP Set updated"
  fi
else
  echo "   [DRY-RUN] Create/update IP Set '$IP_SET_NAME' with ${#ALL_ALLOWED_IPS[@]} addresses"
  IPSET_ID="<ip-set-id-placeholder>"
fi

echo ""

# ── Step 2: Create Web ACL ────────────────────────────────────────────
echo "🧱 Step 2: Create Web ACL '$WAF_NAME'..."

# Build WebACL rules JSON
WEBACL_RULES=$(python3 -c "
import json

ipset_id = '$IPSET_ID'
ip_set_name = '$IP_SET_NAME'
region = '$REGION'
scope = '$SCOPE'

# Construct IP Set ARN (REGIONAL)
ipset_arn = f'arn:aws:wafv2:{region}:ACCOUNT_ID:regional/ipset/{ip_set_name}/{ipset_id}'

rules = [
  {
    'Name': 'AllowVercelAndGovtIPs',
    'Priority': 1,
    'Statement': {
      'IPSetReferenceStatement': {
        'ARN': ipset_arn
      }
    },
    'Action': {'Allow': {}},
    'VisibilityConfig': {
      'SampledRequestsEnabled': True,
      'CloudWatchMetricsEnabled': True,
      'MetricName': 'AtomsNinjaAllowedIPs'
    }
  },
  {
    'Name': 'RateLimitPerIP',
    'Priority': 2,
    'Statement': {
      'RateBasedStatement': {
        'Limit': 2000,
        'AggregateKeyType': 'IP'
      }
    },
    'Action': {'Block': {}},
    'VisibilityConfig': {
      'SampledRequestsEnabled': True,
      'CloudWatchMetricsEnabled': True,
      'MetricName': 'AtomsNinjaRateLimit'
    }
  }
]

print(json.dumps(rules, indent=2))
")

if [ "$DRY_RUN" = false ]; then
  # Check if WebACL already exists
  EXISTING_ACL=$(aws wafv2 list-web-acls \
    --scope "$SCOPE" \
    --region "$REGION" \
    --query "WebACLs[?Name=='$WAF_NAME'].[Id,ARN]" \
    --output text 2>/dev/null || echo "")

  if [ -z "$EXISTING_ACL" ]; then
    echo "   Creating Web ACL..."
    ACL_RESULT=$(aws wafv2 create-web-acl \
      --name "$WAF_NAME" \
      --scope "$SCOPE" \
      --region "$REGION" \
      --default-action '{"Allow":{}}' \
      --rules "$WEBACL_RULES" \
      --visibility-config "SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=AtomsNinjaWAF" \
      --description "Atoms Ninja WAF — Vercel IP allowlist + rate limiting" \
      --tags Key=Project,Value=atoms-ninja Key=ManagedBy,Value=atoms-ninja-ip-config)

    ACL_ARN=$(echo "$ACL_RESULT" | jq -r '.Summary.ARN')
    ACL_ID=$(echo "$ACL_RESULT" | jq -r '.Summary.Id')
    echo "   ✅ Web ACL created: $ACL_ID"
    echo "   ARN: $ACL_ARN"
  else
    ACL_ARN=$(echo "$EXISTING_ACL" | awk '{print $2}')
    echo "   ⚠️  Web ACL already exists: $ACL_ARN"
    echo "   To update rules, use: aws wafv2 update-web-acl ..."
  fi
else
  echo "   [DRY-RUN] Create Web ACL '$WAF_NAME' with rules:"
  echo "     Rule 1: Allow Vercel + Govt IPs (Priority 1)"
  echo "     Rule 2: Rate-limit 2000 req/5min per IP (Priority 2)"
  ACL_ARN="<web-acl-arn-placeholder>"
fi

echo ""

# ── Step 3: Association instructions ─────────────────────────────────
echo "🔗 Step 3: Associate WAF with your resource..."
if [ "$DRY_RUN" = false ] && [ -n "${ACL_ARN:-}" ]; then
  echo ""
  echo "   Web ACL ARN: $ACL_ARN"
  echo ""
  echo "   To associate with an ALB:"
  echo "   aws wafv2 associate-web-acl \\"
  echo "     --web-acl-arn '$ACL_ARN' \\"
  echo "     --resource-arn '<YOUR_ALB_ARN>' \\"
  echo "     --region $REGION"
  echo ""
  echo "   To associate with an API Gateway stage:"
  echo "   aws wafv2 associate-web-acl \\"
  echo "     --web-acl-arn '$ACL_ARN' \\"
  echo "     --resource-arn 'arn:aws:apigateway:$REGION::/restapis/<API_ID>/stages/<STAGE>' \\"
  echo "     --region $REGION"
  echo ""
  echo "   Note: EC2 instances without ALB cannot be directly associated with WAF."
  echo "   Consider putting EC2 behind an ALB for WAF protection."
  # Save ARN to ip-attribution.json
  python3 -c "
import json
with open('$CONFIG_FILE') as f:
    d = json.load(f)
if 'waf' not in d:
    d['waf'] = {}
d['waf']['web_acl_arn'] = '$ACL_ARN'
d['waf']['web_acl_name'] = '$WAF_NAME'
d['waf']['scope'] = '$SCOPE'
d['waf']['region'] = '$REGION'
with open('$CONFIG_FILE', 'w') as f:
    json.dump(d, f, indent=2)
print('   💾 WAF ARN saved to ip-attribution.json')
"
else
  echo "   [DRY-RUN] After creation, associate with ALB or API Gateway using the Web ACL ARN"
fi

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
if [ "$DRY_RUN" = true ]; then
  echo "✅ Dry-run complete — no WAF resources created."
  echo ""
  echo "   Run with --apply to create resources:"
  echo "   npm run setup-waf -- --apply"
else
  echo "✅ WAF setup complete."
  echo ""
  echo "   Monitor with:"
  echo "   aws wafv2 get-web-acl --name '$WAF_NAME' --scope $SCOPE --region $REGION --id <ID>"
fi
echo "═══════════════════════════════════════════════════════"
