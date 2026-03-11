#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Atoms Ninja — AWS Budget & Billing Alarm Setup
# Sets a $33/month budget (total $100 over 3 months) with email alerts.
#
# Creates:
#   1. AWS Budget   — $33/mo with alerts at 75%, 90%, 100%
#   2. CloudWatch   — Billing alarm at $30 (backup)
#
# Usage:
#   bash scripts/setup-aws-budget.sh <email>
#   bash scripts/setup-aws-budget.sh chief@atoms.ninja
#
# Prerequisites:
#   - AWS CLI configured with budgets + cloudwatch permissions
#   - Billing alerts enabled in AWS Console (Billing → Preferences)
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

BUDGET_NAME="atoms-ninja-monthly"
MONTHLY_LIMIT="33.0"
REGION="us-east-1"
EMAIL="${1:-}"

if [ -z "$EMAIL" ]; then
  echo "❌ Usage: bash scripts/setup-aws-budget.sh <alert-email>"
  echo "   Example: bash scripts/setup-aws-budget.sh chief@atoms.ninja"
  exit 1
fi

echo "🛡️  Atoms Ninja — AWS Budget Setup"
echo "   Budget:  \$${MONTHLY_LIMIT}/month (\$100 over 3 months)"
echo "   Alerts:  $EMAIL"
echo "   Region:  $REGION"
echo ""

# ── Check AWS CLI ────────────────────────────────────────────────────
if ! command -v aws &>/dev/null; then
  echo "❌ AWS CLI not found. Install it first."
  exit 1
fi

echo "🔐 Verifying AWS credentials..."
ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text) || {
  echo "❌ AWS credentials not configured. Run: aws configure"
  exit 1
}
echo "   Account: $ACCOUNT_ID"

# ═══════════════════════════════════════════════════════════════════════
# 1. AWS Budget — $33/month with threshold alerts
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "📊 Creating AWS Budget (\$${MONTHLY_LIMIT}/month)..."

# Check if budget already exists
EXISTING=$(aws budgets describe-budgets \
  --account-id "$ACCOUNT_ID" \
  --query "Budgets[?BudgetName=='${BUDGET_NAME}'].BudgetName" \
  --output text 2>/dev/null || echo "")

if [ "$EXISTING" = "$BUDGET_NAME" ]; then
  echo "   ⚠️  Budget '$BUDGET_NAME' already exists — updating..."
  aws budgets delete-budget \
    --account-id "$ACCOUNT_ID" \
    --budget-name "$BUDGET_NAME" 2>/dev/null || true
fi

# Create the budget with alerts at 75%, 90%, 100%
aws budgets create-budget \
  --account-id "$ACCOUNT_ID" \
  --budget "{
    \"BudgetName\": \"${BUDGET_NAME}\",
    \"BudgetType\": \"COST\",
    \"TimeUnit\": \"MONTHLY\",
    \"BudgetLimit\": {
      \"Amount\": \"${MONTHLY_LIMIT}\",
      \"Unit\": \"USD\"
    }
  }" \
  --notifications-with-subscribers "[
    {
      \"Notification\": {
        \"NotificationType\": \"ACTUAL\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 75,
        \"ThresholdType\": \"PERCENTAGE\"
      },
      \"Subscribers\": [{
        \"SubscriptionType\": \"EMAIL\",
        \"Address\": \"${EMAIL}\"
      }]
    },
    {
      \"Notification\": {
        \"NotificationType\": \"ACTUAL\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 90,
        \"ThresholdType\": \"PERCENTAGE\"
      },
      \"Subscribers\": [{
        \"SubscriptionType\": \"EMAIL\",
        \"Address\": \"${EMAIL}\"
      }]
    },
    {
      \"Notification\": {
        \"NotificationType\": \"ACTUAL\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 100,
        \"ThresholdType\": \"PERCENTAGE\"
      },
      \"Subscribers\": [{
        \"SubscriptionType\": \"EMAIL\",
        \"Address\": \"${EMAIL}\"
      }]
    },
    {
      \"Notification\": {
        \"NotificationType\": \"FORECASTED\",
        \"ComparisonOperator\": \"GREATER_THAN\",
        \"Threshold\": 100,
        \"ThresholdType\": \"PERCENTAGE\"
      },
      \"Subscribers\": [{
        \"SubscriptionType\": \"EMAIL\",
        \"Address\": \"${EMAIL}\"
      }]
    }
  ]"

echo "   ✅ Budget created: \$${MONTHLY_LIMIT}/month"
echo "      → Alert at 75% (\$25)"
echo "      → Alert at 90% (\$30)"
echo "      → Alert at 100% (\$33)"
echo "      → Forecast alert if projected to exceed"

# ═══════════════════════════════════════════════════════════════════════
# 2. CloudWatch Billing Alarm — backup at $30
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "🔔 Creating CloudWatch billing alarm (\$30 threshold)..."

# Create SNS topic for billing alerts (must be in us-east-1)
TOPIC_ARN=$(aws sns create-topic \
  --name "atoms-ninja-billing-alarm" \
  --region us-east-1 \
  --query 'TopicArn' \
  --output text)

# Subscribe email
aws sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$EMAIL" \
  --region us-east-1 > /dev/null

echo "   📧 SNS topic created — check $EMAIL to confirm subscription"

# Create the billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "atoms-ninja-billing-30usd" \
  --alarm-description "Atoms Ninja: Monthly charges exceed \$30 (budget limit \$33/mo, \$100/3mo)" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 30 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions "$TOPIC_ARN" \
  --dimensions "Name=Currency,Value=USD" \
  --region us-east-1

echo "   ✅ CloudWatch alarm set at \$30"

# ═══════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Budget Protection Active!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  💰 Budget:     \$${MONTHLY_LIMIT}/month (\$100 total over 3 months)"
echo "  📧 Alerts to:  $EMAIL"
echo "  🔔 Thresholds:"
echo "     • \$25/mo  (75%) — Warning email"
echo "     • \$30/mo  (90%) — Critical email + CloudWatch alarm"
echo "     • \$33/mo (100%) — Budget exceeded email"
echo "     • Forecast — Email if projected to exceed"
echo ""
echo "  ⚠️  IMPORTANT: Confirm the SNS subscription email!"
echo "     Check $EMAIL inbox for AWS Notification confirmation."
echo ""
echo "  📊 Check costs anytime:"
echo "     bash scripts/check-aws-costs.sh"
echo ""
