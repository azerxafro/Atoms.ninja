#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Atoms Ninja — AWS Cost Checker
# Shows current month-to-date spend and remaining budget.
#
# Budget: $33/month ($100 over 3 months)
#
# Usage:
#   bash scripts/check-aws-costs.sh
#
# Prerequisites:
#   - AWS CLI configured with ce:GetCostAndUsage permission
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

MONTHLY_BUDGET="33.00"
TOTAL_BUDGET="100.00"

# ── Check AWS CLI ────────────────────────────────────────────────────
if ! command -v aws &>/dev/null; then
  echo "❌ AWS CLI not found."
  exit 1
fi

# ── Date range for current month ─────────────────────────────────────
START_DATE=$(date -u +"%Y-%m-01")
# End date = first day of next month
if command -v gdate &>/dev/null; then
  END_DATE=$(gdate -u -d "$START_DATE +1 month" +"%Y-%m-%d")
else
  # macOS date fallback
  YEAR=$(date -u +"%Y")
  MONTH=$(date -u +"%m")
  NEXT_MONTH=$((10#$MONTH + 1))
  NEXT_YEAR=$YEAR
  if [ "$NEXT_MONTH" -gt 12 ]; then
    NEXT_MONTH=1
    NEXT_YEAR=$((YEAR + 1))
  fi
  END_DATE=$(printf "%04d-%02d-01" "$NEXT_YEAR" "$NEXT_MONTH")
fi

TODAY=$(date -u +"%Y-%m-%d")

echo "═══════════════════════════════════════════════════════════════"
echo "  Atoms Ninja — AWS Cost Report"
echo "  Budget: \$${MONTHLY_BUDGET}/month (\$${TOTAL_BUDGET} over 3 months)"
echo "  Period: $START_DATE → $END_DATE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ── Current month costs ──────────────────────────────────────────────
MTD_COST=$(aws ce get-cost-and-usage \
  --time-period "Start=${START_DATE},End=${END_DATE}" \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
  --output text 2>/dev/null || echo "N/A")

if [ "$MTD_COST" = "N/A" ] || [ -z "$MTD_COST" ]; then
  echo "⚠️  Could not retrieve costs. Ensure ce:GetCostAndUsage permission is granted."
  echo "   Also, Cost Explorer may take 24h to activate on new accounts."
  exit 1
fi

# Format to 2 decimal places
MTD_COST=$(printf "%.2f" "$MTD_COST")
REMAINING=$(echo "$MONTHLY_BUDGET - $MTD_COST" | bc 2>/dev/null || echo "?")

echo "  📊 Month-to-Date Spend:  \$$MTD_COST"
echo "  💰 Monthly Budget:       \$$MONTHLY_BUDGET"
echo "  📉 Remaining This Month: \$$REMAINING"
echo ""

# ── Budget percentage ────────────────────────────────────────────────
if command -v bc &>/dev/null; then
  PCT=$(echo "scale=0; ($MTD_COST / $MONTHLY_BUDGET) * 100" | bc 2>/dev/null || echo "?")
  echo "  📈 Budget Used: ${PCT}%"

  # Visual bar
  BAR_LEN=30
  FILLED=$(echo "scale=0; $BAR_LEN * $MTD_COST / $MONTHLY_BUDGET" | bc 2>/dev/null || echo "0")
  [ "$FILLED" -gt "$BAR_LEN" ] 2>/dev/null && FILLED=$BAR_LEN
  EMPTY=$((BAR_LEN - FILLED))
  BAR=$(printf '█%.0s' $(seq 1 "$FILLED" 2>/dev/null) 2>/dev/null || echo "")
  BAR="${BAR}$(printf '░%.0s' $(seq 1 "$EMPTY" 2>/dev/null) 2>/dev/null || echo "")"
  echo "     [${BAR}]"
  echo ""

  # Warnings
  if [ "$(echo "$MTD_COST >= $MONTHLY_BUDGET" | bc)" = "1" ]; then
    echo "  🔴 BUDGET EXCEEDED! Spend is over \$$MONTHLY_BUDGET"
  elif [ "$(echo "$MTD_COST >= 30" | bc)" = "1" ]; then
    echo "  🟡 WARNING: Approaching budget limit (\$30+)"
  elif [ "$(echo "$MTD_COST >= 25" | bc)" = "1" ]; then
    echo "  🟠 NOTICE: Past 75% of monthly budget"
  else
    echo "  🟢 Budget healthy"
  fi
fi

# ── Cost breakdown by service ────────────────────────────────────────
echo ""
echo "  📋 Cost Breakdown by Service:"
echo "  ─────────────────────────────────────────"

aws ce get-cost-and-usage \
  --time-period "Start=${START_DATE},End=${END_DATE}" \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[*].[Keys[0],Metrics.BlendedCost.Amount]' \
  --output text 2>/dev/null | sort -t$'\t' -k2 -rn | head -10 | while IFS=$'\t' read -r service cost; do
    cost_fmt=$(printf "%.2f" "$cost" 2>/dev/null || echo "$cost")
    if [ "$(echo "$cost_fmt > 0.01" | bc 2>/dev/null)" = "1" ]; then
      printf "  %-45s \$%s\n" "$service" "$cost_fmt"
    fi
  done

# ── 3-month tracking ────────────────────────────────────────────────
echo ""
echo "  ─────────────────────────────────────────"
echo "  📅 3-Month Budget Tracking (\$${TOTAL_BUDGET} total):"

# Get last 3 months
THREE_MONTHS_AGO=$(date -u -v-2m +"%Y-%m-01" 2>/dev/null || date -u -d "2 months ago" +"%Y-%m-01" 2>/dev/null || echo "$START_DATE")

TOTAL_3MO=$(aws ce get-cost-and-usage \
  --time-period "Start=${THREE_MONTHS_AGO},End=${END_DATE}" \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[*].Total.BlendedCost.Amount' \
  --output text 2>/dev/null | tr '\t' '\n' | awk '{s+=$1} END {printf "%.2f", s}' || echo "N/A")

if [ "$TOTAL_3MO" != "N/A" ]; then
  REMAINING_TOTAL=$(echo "$TOTAL_BUDGET - $TOTAL_3MO" | bc 2>/dev/null || echo "?")
  echo "     Total 3-month spend: \$$TOTAL_3MO / \$$TOTAL_BUDGET"
  echo "     Remaining:           \$$REMAINING_TOTAL"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
