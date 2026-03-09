#!/bin/bash
# ═══════════════════════════════════════════════════════
# Atoms Ninja — Empire Defense (ALB + WAF Setup)
# Automates the creation of a secure Load Balancer and WAF
# ═══════════════════════════════════════════════════════

set -e

# ─── Configuration ────────────────────────────────
REGION="us-east-1"
VPC_ID="vpc-0ff685f33e28cc2b3"
INSTANCE_ID="i-097f38ed6d99a22b3"
SG_ID="sg-0047128872be65558"
# Subnets in us-east-1a, us-east-1b, us-east-1f
SUBNETS="subnet-0972461123608435f subnet-0c8c2a53bd65e459e subnet-010848a20467abb40"

echo "🏛️  Atoms Ninja — Empire Defense Setup"
echo "   Target Instance: $INSTANCE_ID"
echo ""

# ─── 1. Create Target Group ──────────────────────
echo "🎯 Creating Target Group..."
TG_ARN=$(aws elbv2 create-target-group \
    --name atoms-ninja-tg \
    --protocol HTTP \
    --port 3001 \
    --vpc-id $VPC_ID \
    --target-type instance \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
echo "   ✅ Target Group: $TG_ARN"

# ─── 2. Register Instance ────────────────────────
echo "🔗 Registering EC2 instance with Target Group..."
aws elbv2 register-targets --target-group-arn "$TG_ARN" --targets Id="$INSTANCE_ID"
echo "   ✅ Instance $INSTANCE_ID registered."

# ─── 3. Create Load Balancer ─────────────────────
echo "🚀 Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name atoms-ninja-alb \
    --subnets $SUBNETS \
    --security-groups "$SG_ID" \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)
echo "   ✅ ALB created: $ALB_ARN"

# ─── 4. Create Listener ──────────────────────────
echo "🎧 Creating HTTP Listener (Port 80)..."
aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN"
echo "   ✅ Listener created."

# ─── 5. Create WAF Web ACL ───────────────────────
echo "🛡️ Creating WAF Web ACL (Common Rule Set)..."
WAF_ARN=$(aws wafv2 create-web-acl \
    --name atoms-ninja-waf \
    --scope REGIONAL \
    --default-action Allow={} \
    --rules '[{"Name":"CommonRuleSet","Priority":0,"Statement":{"ManagedRuleGroupStatement":{"VendorName":"AWS","Name":"AWSManagedRulesCommonRuleSet"}},"OverrideAction":{"None":{}},"VisibilityConfig":{"SampledRequestsEnabled":true,"CloudWatchMetricsEnabled":true,"MetricName":"CommonRuleSet"}}]' \
    --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=atoms-ninja-waf \
    --query 'Summary.ARN' \
    --output text)
echo "   ✅ WAF Web ACL created: $WAF_ARN"

# ─── 6. Associate WAF with ALB ───────────────────
echo "⏳ Waiting for ALB to provision..."
aws elbv2 wait load-balancer-available --load-balancer-arns "$ALB_ARN"
echo "   ✅ ALB is ACTIVE."

echo "🔗 Associating WAF with ALB..."
aws wafv2 associate-web-acl --web-acl-arn "$WAF_ARN" --resource-arn "$ALB_ARN"
echo "   ✅ Shield Activated!"

# ─── Summary ─────────────────────────────────────
DNS_NAME=$(aws elbv2 describe-load-balancers --load-balancer-arns "$ALB_ARN" --query 'LoadBalancers[0].DNSName' --output text)
echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Empire Defense is ONLINE!"
echo "   DNS: http://$DNS_NAME"
echo "═══════════════════════════════════════════════"
