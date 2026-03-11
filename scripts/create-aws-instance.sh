#!/bin/bash
# ═══════════════════════════════════════════════════════
# Atoms Ninja — AWS EC2 Kali + OpenRouter Setup
# Creates a cost-efficient EC2 instance with Kali Linux
# ═══════════════════════════════════════════════════════

set -e

# ─── Configuration ────────────────────────────────
REGION="us-east-1"
INSTANCE_TYPE="${1:-t3.small}"   # t3.small fits $33/mo budget; pass t2.micro for free tier
KEY_NAME="atoms-ninja-key"
SG_NAME="atoms-ninja-sg"
INSTANCE_NAME="atoms-ninja-kali"

echo "🛡️  Atoms Ninja — AWS EC2 Setup"
echo "   Instance: $INSTANCE_TYPE"
echo "   Region:   $REGION"
echo ""

# ─── Check AWS CLI ────────────────────────────────
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Install it first:"
    echo "   curl 'https://awscli.amazonaws.com/AWSCLIV2.pkg' -o /tmp/AWSCLIV2.pkg"
    echo "   sudo installer -pkg /tmp/AWSCLIV2.pkg -target /"
    exit 1
fi

# ─── Verify credentials ──────────────────────────
echo "🔐 Verifying AWS credentials..."
aws sts get-caller-identity || {
    echo "❌ AWS credentials not configured. Run: aws configure"
    exit 1
}

# ─── Find Kali Linux AMI ─────────────────────────
echo "🔍 Finding Kali Linux AMI..."
KALI_AMI=$(aws ec2 describe-images \
    --region $REGION \
    --owners aws-marketplace \
    --filters "Name=name,Values=*kali-linux*" "Name=state,Values=available" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text 2>/dev/null)

# Fallback to Amazon Linux 2023 if Kali not found
if [ "$KALI_AMI" = "None" ] || [ -z "$KALI_AMI" ]; then
    echo "⚠️  Kali AMI not found in marketplace, using Amazon Linux 2023 + manual tool install"
    KALI_AMI=$(aws ec2 describe-images \
        --region $REGION \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
        --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
        --output text)
    INSTALL_KALI_TOOLS=true
else
    echo "✅ Found Kali AMI: $KALI_AMI"
    INSTALL_KALI_TOOLS=false
fi

# ─── Create Security Group ───────────────────────
echo "🔥 Creating security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --region $REGION \
    --group-names "$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || true)

if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
    SG_ID=$(aws ec2 create-security-group \
        --region $REGION \
        --group-name "$SG_NAME" \
        --description "Atoms Ninja - SSH + API access" \
        --query 'GroupId' \
        --output text)
    echo "   Created SG: $SG_ID"

    # Allow SSH
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id "$SG_ID" \
        --protocol tcp --port 22 --cidr 0.0.0.0/0

    # Allow API port 3001
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id "$SG_ID" \
        --protocol tcp --port 3001 --cidr 0.0.0.0/0

    echo "   ✅ Firewall rules: SSH (22) + API (3001)"
else
    echo "   ✅ Security group exists: $SG_ID"
fi

# ─── Create Key Pair ─────────────────────────────
echo "🔑 Setting up SSH key pair..."
if ! aws ec2 describe-key-pairs --region $REGION --key-names "$KEY_NAME" &>/dev/null; then
    aws ec2 create-key-pair \
        --region $REGION \
        --key-name "$KEY_NAME" \
        --query 'KeyMaterial' \
        --output text > ~/.ssh/${KEY_NAME}.pem
    chmod 400 ~/.ssh/${KEY_NAME}.pem
    echo "   ✅ Key pair created: ~/.ssh/${KEY_NAME}.pem"
else
    echo "   ✅ Key pair exists: $KEY_NAME"
fi

# ─── User Data Script (runs on first boot) ───────
USER_DATA=$(cat <<'USERDATA'
#!/bin/bash
set -e

# Update system
yum update -y 2>/dev/null || apt-get update -y 2>/dev/null

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - 2>/dev/null || \
curl -fsSL https://deb.nodesource.com/setup_18.x | bash - 2>/dev/null
yum install -y nodejs 2>/dev/null || apt-get install -y nodejs 2>/dev/null

# Install PM2
npm install -g pm2

# Install security tools (if not Kali)
if ! command -v nmap &> /dev/null; then
    echo "Installing security tools..."
    yum install -y nmap whois bind-utils curl wget git 2>/dev/null || \
    apt-get install -y nmap nikto sqlmap hydra whois dnsutils curl wget git dirb gobuster 2>/dev/null
fi

# Install additional tools via pip
pip3 install theHarvester 2>/dev/null || true

# Create app directory
mkdir -p /opt/atoms-ninja
cd /opt/atoms-ninja

# Create a placeholder until the real server is deployed
echo '{"status": "pending deployment"}' > /opt/atoms-ninja/status.json

echo "✅ EC2 bootstrap complete — ready for deployment"
USERDATA
)

# ─── Launch Instance ─────────────────────────────
echo "🚀 Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --region $REGION \
    --image-id "$KALI_AMI" \
    --instance-type "$INSTANCE_TYPE" \
    --key-name "$KEY_NAME" \
    --security-group-ids "$SG_ID" \
    --block-device-mappings "DeviceName=/dev/xvda,Ebs={VolumeSize=20,VolumeType=gp2}" \
    --user-data "$USER_DATA" \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "   ✅ Instance launched: $INSTANCE_ID"

# ─── Wait for instance to be running ─────────────
echo "⏳ Waiting for instance to start..."
aws ec2 wait instance-running --region $REGION --instance-ids "$INSTANCE_ID"
echo "   ✅ Instance is running"

# ─── Allocate Elastic IP ─────────────────────────
echo "🌐 Allocating Elastic IP..."
ALLOC_ID=$(aws ec2 allocate-address \
    --region $REGION \
    --domain vpc \
    --query 'AllocationId' \
    --output text)

ELASTIC_IP=$(aws ec2 describe-addresses \
    --region $REGION \
    --allocation-ids "$ALLOC_ID" \
    --query 'Addresses[0].PublicIp' \
    --output text)

aws ec2 associate-address \
    --region $REGION \
    --instance-id "$INSTANCE_ID" \
    --allocation-id "$ALLOC_ID"

echo "   ✅ Elastic IP: $ELASTIC_IP"

# ─── Summary ─────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "✅ Atoms Ninja EC2 Instance Ready!"
echo "═══════════════════════════════════════════════"
echo ""
echo "📋 Instance Details:"
echo "   ID:       $INSTANCE_ID"
echo "   Type:     $INSTANCE_TYPE"
echo "   IP:       $ELASTIC_IP"
echo "   Key:      ~/.ssh/${KEY_NAME}.pem"
echo "   Region:   $REGION"
echo ""
echo "🔗 Next Steps:"
echo ""
echo "1. SSH into instance (wait ~2 min for bootstrap):"
echo "   ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$ELASTIC_IP"
echo "   # or for Kali: ssh -i ~/.ssh/${KEY_NAME}.pem kali@$ELASTIC_IP"
echo ""
echo "2. Deploy atoms-server.js:"
echo "   scp -i ~/.ssh/${KEY_NAME}.pem atoms-server.js ec2-user@$ELASTIC_IP:/opt/atoms-ninja/"
echo "   scp -i ~/.ssh/${KEY_NAME}.pem package.json ec2-user@$ELASTIC_IP:/opt/atoms-ninja/"
echo ""
echo "3. Start server on EC2:"
echo "   ssh -i ~/.ssh/${KEY_NAME}.pem ec2-user@$ELASTIC_IP"
echo "   cd /opt/atoms-ninja && npm install && pm2 start atoms-server.js"
echo ""
echo "4. Set OPENROUTER_API_KEY:"
echo "   echo 'OPENROUTER_API_KEY=sk-or-...' >> /opt/atoms-ninja/.env"
echo "   pm2 restart atoms-server"
echo ""
echo "5. Test:"
echo "   curl http://$ELASTIC_IP:3001/health"
echo ""

# Save config for later use
cat > .aws-instance.env <<EOF
INSTANCE_ID=$INSTANCE_ID
ELASTIC_IP=$ELASTIC_IP
REGION=$REGION
KEY_NAME=$KEY_NAME
SG_ID=$SG_ID
ALLOC_ID=$ALLOC_ID
EOF

echo "💾 Config saved to .aws-instance.env"
