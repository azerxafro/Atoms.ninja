#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Atoms Ninja — IP Range Fetcher
# Fetches live Vercel serverless IPs + AWS EC2 ranges for us-east-1
# and writes the combined result to ip-attribution.json at the repo root.
#
# Usage:
#   bash scripts/fetch-ip-ranges.sh              # fetch and update
#   bash scripts/fetch-ip-ranges.sh --dry-run    # print only, no write
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_FILE="$REPO_ROOT/ip-attribution.json"
DRY_RUN=false
AWS_REGION="us-east-1"

# ── Parse flags ──────────────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

echo "🌐 Atoms Ninja — IP Range Fetcher"
echo "   Region:  $AWS_REGION"
echo "   Output:  $OUTPUT_FILE"
echo "   Dry-run: $DRY_RUN"
echo ""

# ── Dependency check ─────────────────────────────────────────────────
for cmd in curl python3; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ Required command '$cmd' not found. Please install it."
    exit 1
  fi
done

# ── Fetch Vercel IP Ranges ────────────────────────────────────────────
echo "📡 Fetching Vercel serverless IP ranges..."
VERCEL_RESPONSE=$(curl -sf "https://ipx.vercel.sh/" 2>/dev/null || echo "")

if [ -z "$VERCEL_RESPONSE" ]; then
  echo "⚠️  Could not reach ipx.vercel.sh — using cached ranges if available"
  # Fallback to existing file if present
  if [ -f "$OUTPUT_FILE" ]; then
    VERCEL_RANGES=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    d = json.load(f)
print(json.dumps(d.get('vercel', {}).get('ipv4_ranges', [])))
" 2>/dev/null || echo "[]")
  else
    VERCEL_RANGES="[]"
  fi
else
  # ipx.vercel.sh returns newline-separated CIDRs
  VERCEL_RANGES=$(echo "$VERCEL_RESPONSE" | python3 -c "
import sys, json
lines = [l.strip() for l in sys.stdin.read().splitlines() if l.strip()]
print(json.dumps(lines))
")
  echo "   ✅ Got $(echo "$VERCEL_RANGES" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))") Vercel CIDR ranges"
fi

# ── Fetch AWS EC2 IP Ranges for us-east-1 ────────────────────────────
echo "☁️  Fetching AWS IP ranges (EC2, $AWS_REGION)..."
AWS_RANGES_URL="https://ip-ranges.amazonaws.com/ip-ranges.json"
AWS_FULL=$(curl -sf "$AWS_RANGES_URL" 2>/dev/null || echo "")

if [ -z "$AWS_FULL" ]; then
  echo "⚠️  Could not reach ip-ranges.amazonaws.com — using cached ranges if available"
  if [ -f "$OUTPUT_FILE" ]; then
    AWS_EC2_IPV4=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    d = json.load(f)
print(json.dumps(d.get('aws_ec2_us_east_1', {}).get('ipv4_ranges', [])))
" 2>/dev/null || echo "[]")
    AWS_EC2_IPV6=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    d = json.load(f)
print(json.dumps(d.get('aws_ec2_us_east_1', {}).get('ipv6_ranges', [])))
" 2>/dev/null || echo "[]")
  else
    AWS_EC2_IPV4="[]"
    AWS_EC2_IPV6="[]"
  fi
else
  AWS_EC2_IPV4=$(echo "$AWS_FULL" | python3 -c "
import json, sys
data = json.load(sys.stdin)
ranges = [p['ip_prefix'] for p in data.get('prefixes', [])
          if p.get('service') == 'EC2' and p.get('region') == '$AWS_REGION']
print(json.dumps(sorted(set(ranges))))
")
  AWS_EC2_IPV6=$(echo "$AWS_FULL" | python3 -c "
import json, sys
data = json.load(sys.stdin)
ranges = [p['ipv6_prefix'] for p in data.get('ipv6_prefixes', [])
          if p.get('service') == 'EC2' and p.get('region') == '$AWS_REGION']
print(json.dumps(sorted(set(ranges))))
")
  V4_COUNT=$(echo "$AWS_EC2_IPV4" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  V6_COUNT=$(echo "$AWS_EC2_IPV6" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  echo "   ✅ Got $V4_COUNT IPv4 and $V6_COUNT IPv6 ranges for EC2 in $AWS_REGION"
fi

# ── Preserve admin + government IPs from existing file (if any) ──────
ADMIN_IP="YOUR_ADMIN_IP/32"
GOVT_IPS="[]"

if [ -f "$OUTPUT_FILE" ]; then
  EXISTING_ADMIN=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    d = json.load(f)
print(d.get('admin', {}).get('ssh_source_ip', 'YOUR_ADMIN_IP/32'))
" 2>/dev/null || echo "YOUR_ADMIN_IP/32")
  # Only preserve if it's been set (not the placeholder)
  if [ "$EXISTING_ADMIN" != "YOUR_ADMIN_IP/32" ]; then
    ADMIN_IP="$EXISTING_ADMIN"
  fi

  EXISTING_GOVT=$(python3 -c "
import json, sys
with open('$OUTPUT_FILE') as f:
    d = json.load(f)
print(json.dumps(d.get('government', {}).get('ipv4_ranges', [])))
" 2>/dev/null || echo "[]")
  if [ "$EXISTING_GOVT" != "[]" ]; then
    GOVT_IPS="$EXISTING_GOVT"
  fi
fi

# ── Build JSON output ────────────────────────────────────────────────
TIMESTAMP=$(date -u "+%Y-%m-%dT%H:%M:%SZ")

OUTPUT=$(python3 -c "
import json, sys

vercel_ranges  = $VERCEL_RANGES
aws_ipv4       = $AWS_EC2_IPV4
aws_ipv6       = $AWS_EC2_IPV6
govt_ips       = $GOVT_IPS

data = {
  '_metadata': {
    'description': 'Atoms Ninja IP Attribution Configuration',
    'last_updated': '$TIMESTAMP',
    'update_command': 'npm run fetch-ips',
    'apply_command': 'npm run secure-sg -- --apply',
    'sources': {
      'vercel': 'https://ipx.vercel.sh/',
      'aws': 'https://ip-ranges.amazonaws.com/ip-ranges.json'
    }
  },
  'vercel': {
    'description': 'Vercel serverless function egress IPs (dynamic — update weekly)',
    'update_frequency': 'weekly',
    'ipv4_ranges': vercel_ranges
  },
  'aws_ec2_us_east_1': {
    'description': 'AWS EC2 public IP ranges in us-east-1',
    'update_frequency': 'weekly',
    'ipv4_ranges': aws_ipv4,
    'ipv6_ranges': aws_ipv6
  },
  'static_infrastructure': {
    'ec2_elastic_ip': '34.202.47.138/32',
    'gcp_kali_vm_ip': '136.113.58.241/32',
    'note': 'These are static IPs — update only if instances are replaced'
  },
  'admin': {
    'description': 'Admin operator IP — SSH access to EC2',
    'ssh_source_ip': '$ADMIN_IP',
    'note': 'REQUIRED: Replace YOUR_ADMIN_IP/32 with your actual admin CIDR before running secure-sg'
  },
  'government': {
    'description': 'Tamil Nadu Government / Police network CIDRs',
    'note': 'Add Tamil Nadu Police and authorized government network CIDRs here',
    'ipv4_ranges': govt_ips if govt_ips else [
      '# PLACEHOLDER — Add Tamil Nadu Police network CIDRs here',
      '# Example: 203.0.113.0/24'
    ]
  },
  'security_group': {
    'sg_id': 'sg-0047128872be65558',
    'region': 'us-east-1',
    'rules': {
      'ssh_22': 'admin.ssh_source_ip only',
      'http_80': '0.0.0.0/0 (redirect to HTTPS)',
      'https_443': '0.0.0.0/0 (public API)',
      'api_3001': 'vercel.ipv4_ranges + government.ipv4_ranges only'
    }
  }
}

print(json.dumps(data, indent=2))
")

# ── Output ────────────────────────────────────────────────────────────
if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "🔍 Dry-run output (not written to file):"
  echo "$OUTPUT"
else
  echo "$OUTPUT" > "$OUTPUT_FILE"
  echo ""
  echo "✅ Written to: $OUTPUT_FILE"
  echo ""
  echo "📋 Next steps:"
  echo "   1. Edit ip-attribution.json → set admin.ssh_source_ip to your IP"
  echo "   2. Edit ip-attribution.json → add Tamil Nadu govt CIDRs to government.ipv4_ranges"
  echo "   3. Run: npm run secure-sg -- --dry-run   (preview changes)"
  echo "   4. Run: npm run secure-sg -- --apply     (apply changes)"
fi
