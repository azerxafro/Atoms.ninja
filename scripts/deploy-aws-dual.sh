#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Atoms Ninja — AWS Dual Environment Setup (Production + Beta)
# Deploys main branch to www.atoms.ninja
# Deploys beta branch to beta.atoms.ninja
# ═══════════════════════════════════════════════════════════

set -e

# ─── Configuration ────────────────────────────────
REGION="us-east-1"
INSTANCE_TYPE="${1:-t3.small}"

# GitHub Repository URL
REPO_URL="https://github.com/azerxafro/Atoms.ninja.git"

# Production (main branch)
PROD_NAME="atoms-prod"
PROD_SG_NAME="atoms-prod-sg"
PROD_PORT=3000

# Beta (beta branch)
BETA_NAME="atoms-beta"
BETA_SG_NAME="atoms-beta-sg"
BETA_PORT=3001

# ALB
ALB_NAME="atoms-ninja-alb"
TG_PROD_NAME="atoms-prod-tg"
TG_BETA_NAME="atoms-beta-tg"

echo "══════════════════════════════════════════════════════"
echo "  Atoms Ninja — AWS Dual Environment Setup"
echo "══════════════════════════════════════════════════════"
echo "  Production: www.atoms.ninja (main branch)"
echo "  Beta:       beta.atoms.ninja (beta branch)"
echo "══════════════════════════════════════════════════════"

# ─── Check AWS CLI ────────────────────────────────
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found."
    exit 1
fi

# Verify credentials
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity || {
    echo "❌ AWS credentials not configured."
    exit 1
}

# ─── Create Security Groups ────────────────────────
create_security_group() {
    local SG_NAME=$1
    local SG_DESC=$2
    
    SG_ID=$(aws ec2 describe-security-groups \
        --region $REGION \
        --group-names "$SG_NAME" \
        --query 'SecurityGroups[0].GroupId' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$SG_ID" ]; then
        SG_ID=$(aws ec2 create-security-group \
            --region $REGION \
            --group-name "$SG_NAME" \
            --description "$SG_DESC" \
            --query 'GroupId' \
            --output text)
        echo "   ✅ Created SG: $SG_NAME ($SG_ID)"
        
        # Allow HTTP/HTTPS
        aws ec2 authorize-security-group-ingress \
            --region $REGION \
            --group-id "$SG_ID" \
            --ip-permissions '[{"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}, {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]' \
            2>/dev/null || true
            
        # Allow custom ports for app
        aws ec2 authorize-security-group-ingress \
            --region $REGION \
            --group-id "$SG_ID" \
            --ip-permissions '[{"IpProtocol": "tcp", "FromPort": 3000, "ToPort": 3001, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]}]' \
            2>/dev/null || true
            
        # Allow SSH from your IP
        MY_IP=$(curl -s https://checkip.amazonaws.com)
        aws ec2 authorize-security-group-ingress \
            --region $REGION \
            --group-id "$SG_ID" \
            --ip-permissions '[{"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "'${MY_IP}'/32"}]}]' \
            2>/dev/null || true
    else
        echo "   ✓ Using existing SG: $SG_NAME ($SG_ID)"
    fi
    
    echo "$SG_ID"
}

echo "🔥 Creating security groups..."
PROD_SG_ID=$(create_security_group "$PROD_SG_NAME" "Atoms Production - HTTP + SSH")
BETA_SG_ID=$(create_security_group "$BETA_SG_NAME" "Atoms Beta - HTTP + SSH")

# ─── Find Latest Amazon Linux AMI ─────────────────────────
echo "🔍 Finding Amazon Linux 2023 AMI..."
AMI_ID=$(aws ec2 describe-images \
    --region $REGION \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text)

echo "   AMI: $AMI_ID"

# ─── Create Key Pair ────────────────────────────────
KEY_NAME="atoms-ninja-key"
if ! aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region $REGION 2>/dev/null; then
    echo "🔑 Creating key pair..."
    aws ec2 create-key-pair \
        --key-name "$KEY_NAME" \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo "   ✅ Key saved to ~/.ssh/${KEY_NAME}.pem"
else
    echo "   ✓ Using existing key pair"
fi

# ─── User Data Scripts ────────────────────────────────
PROD_USER_DATA="#!/bin/bash
cd /home/ec2-user
sudo yum update -y
sudo yum install -y git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR=\"\$HOME/.nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
nvm install 18
nvm use 18
git clone $REPO_URL /home/ec2-user/atoms
cd /home/ec2-user/atoms
npm install --production
# Install Kali Arsenal
bash scripts/install-kali-tools.sh
# Start Backend Server
PORT=3000 nohup node atoms-server.js > /var/log/atoms.log 2>&1 &
echo \"Production started on port 3000\""

BETA_USER_DATA="#!/bin/bash
cd /home/ec2-user
sudo yum update -y
sudo yum install -y git
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR=\"\$HOME/.nvm\"
[ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\"
nvm install 18
nvm use 18
git clone -b beta $REPO_URL /home/ec2-user/atoms-beta
cd /home/ec2-user/atoms-beta
npm install --production
# Install Kali Arsenal
bash scripts/install-kali-tools.sh
# Start Backend Server
PORT=3001 nohup node atoms-server.js > /var/log/atoms-beta.log 2>&1 &
echo \"Beta started on port 3001\""

# ─── Launch Production Instance ───────────────────────────
echo "🚀 Launching Production Instance (www.atoms.ninja)..."

PROD_INSTANCE=$(aws ec2 run-instances \
    --region $REGION \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$PROD_SG_ID" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROD_NAME},{Key=Environment,Value=production}]" \
    --user-data "$PROD_USER_DATA" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "   Production Instance ID: $PROD_INSTANCE"

# Wait for production instance to be running
aws ec2 wait instance-running --region $REGION --instance-ids $PROD_INSTANCE

PROD_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids "$PROD_INSTANCE" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "   Production IP: $PROD_IP"

# ─── Launch Beta Instance ───────────────────────────
echo "🚀 Launching Beta Instance (beta.atoms.ninja)..."

BETA_INSTANCE=$(aws ec2 run-instances \
    --region $REGION \
    --image-id "$AMI_ID" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$BETA_SG_ID" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$BETA_NAME},{Key=Environment,Value=beta}]" \
    --user-data "$BETA_USER_DATA" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "   Beta Instance ID: $BETA_INSTANCE"

# Wait for beta instance to be running
aws ec2 wait instance-running --region $REGION --instance-ids $BETA_INSTANCE

BETA_IP=$(aws ec2 describe-instances \
    --region $REGION \
    --instance-ids "$BETA_INSTANCE" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "   Beta IP: $BETA_IP"

# ─── Wait for instances to be ready ────────────────────
echo "⏳ Waiting for instances to initialize (60s)..."
sleep 60

# ─── Create Application Load Balancer ───────────────────
echo "⚖️  Creating Application Load Balancer..."

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs \
    --region $REGION \
    --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text)

# Get subnet IDs
SUBNETS=$(aws ec2 describe-subnets \
    --region $REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[0:2].SubnetId' \
    --output text | tr '\t' ',')

# Create target groups
echo "   Creating target groups..."

# Production target group
aws elbv2 create-target-group \
    --region $REGION \
    --name "$TG_PROD_NAME" \
    --protocol HTTP \
    --port $PROD_PORT \
    --vpc-id "$VPC_ID" \
    --target-type instance \
    --output text 2>/dev/null || true

# Beta target group  
aws elbv2 create-target-group \
    --region $REGION \
    --name "$TG_BETA_NAME" \
    --protocol HTTP \
    --port $BETA_PORT \
    --vpc-id "$VPC_ID" \
    --target-type instance \
    --output text 2>/dev/null || true

# Register targets
aws elbv2 register-targets \
    --region $REGION \
    --target-group-arn "arn:aws:elasticloadbalancing:${REGION}:$(aws sts get-caller-identity --query Account --output text):targetgroup/${TG_PROD_NAME}/*" \
    --targets Id=$PROD_INSTANCE,Port=$PROD_PORT \
    2>/dev/null || true

aws elbv2 register-targets \
    --region $REGION \
    --target-group-arn "arn:aws:elasticloadbalancing:${REGION}:$(aws sts get-caller-identity --query Account --output text):targetgroup/${TG_BETA_NAME}/*" \
    --targets Id=$BETA_INSTANCE,Port=$BETA_PORT \
    2>/dev/null || true

# Create ALB
echo "   Creating ALB..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --region $REGION \
    --name "$ALB_NAME" \
    --subnets $SUBNETS \
    --security-groups "$PROD_SG_ID" \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || true)

echo "   ALB ARN: $ALB_ARN"

# Create listeners
echo "   Creating listeners..."

# Production listener (80 -> 3000)
aws elbv2 create-listener \
    --region $REGION \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn="arn:aws:elasticloadbalancing:${REGION}:$(aws sts get-caller-identity --query Account --output text):targetgroup/${TG_PROD_NAME}/*" \
    --output text 2>/dev/null || true

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --region $REGION \
    --load-balancer-arns "$ALB_ARN" \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

echo "   ALB DNS: $ALB_DNS"

# ─── Summary ────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════"
echo "  ✅ AWS Setup Complete!"
echo "══════════════════════════════════════════════════════"
echo ""
echo "Production (www.atoms.ninja):"
echo "  Instance: $PROD_INSTANCE"
echo "  IP:       $PROD_IP"
echo "  Branch:   main"
echo "  Port:     $PROD_PORT"
echo ""
echo "Beta (beta.atoms.ninja):"
echo "  Instance: $BETA_INSTANCE"
echo "  IP:       $BETA_IP"
echo "  Branch:   beta"
echo "  Port:     $BETA_PORT"
echo ""
echo "Load Balancer:"
echo "  DNS: $ALB_DNS"
echo ""
echo "📝 Next Steps:"
echo "  1. Update DNS records (A records or CNAME to ALB):"
echo "     - www.atoms.ninja → $PROD_IP"
echo "     - beta.atoms.ninja → $BETA_IP"
echo "     - Or use ALB DNS: $ALB_DNS"
echo ""
echo "  2. SSH to instances:"
echo "     ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$PROD_IP"
echo "     ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$BETA_IP"
echo "══════════════════════════════════════════════════════"

# Save IPs to file for reference
echo "PROD_IP=$PROD_IP" > .aws-ips.env
echo "BETA_IP=$BETA_IP" >> .aws-ips.env
