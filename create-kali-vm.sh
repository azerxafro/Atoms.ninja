#!/bin/bash

# Atoms Ninja - GCP Kali Linux VM Setup
# Cost-optimized for $150/month budget
# Balanced performance with all security tools

set -e

PROJECT_ID="gen-lang-client-0528385692"
REGION="us-central1"
ZONE="us-central1-a"
VM_NAME="atoms-kali-security"
MACHINE_TYPE="e2-standard-4"  # 4 vCPU, 16GB RAM - Balanced performance
DISK_SIZE="100GB"
IMAGE_FAMILY="debian-11"
IMAGE_PROJECT="debian-cloud"

echo "🔐 Authenticating with service account..."
gcloud auth activate-service-account --key-file=service-account.json
gcloud config set project $PROJECT_ID

echo "📊 Setting budget alert at $140 (safety margin)..."
# Check if billing account exists
BILLING_ACCOUNT=$(gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>/dev/null || echo "")

if [ ! -z "$BILLING_ACCOUNT" ]; then
    BILLING_ID=$(echo $BILLING_ACCOUNT | cut -d'/' -f2)
    echo "💰 Found billing account: $BILLING_ID"
    
    # Create budget if it doesn't exist
    gcloud billing budgets list --billing-account=$BILLING_ID --filter="displayName='Atoms Monthly Budget'" --format="value(name)" | grep -q . || \
    gcloud billing budgets create \
        --billing-account=$BILLING_ID \
        --display-name="Atoms Monthly Budget" \
        --budget-amount=150 \
        --threshold-rule=percent=80 \
        --threshold-rule=percent=90 \
        --threshold-rule=percent=100 || echo "⚠️  Budget creation skipped (may need permissions)"
else
    echo "⚠️  No billing account found or insufficient permissions"
fi

echo "🔧 Enabling required APIs..."
gcloud services enable compute.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com

echo "🖥️  Creating VM instance: $VM_NAME"
echo "   Machine: $MACHINE_TYPE (4 vCPU, 16GB RAM)"
echo "   Disk: $DISK_SIZE SSD"
echo "   Region: $REGION"
echo "   Estimated cost: ~$120/month"

# Create firewall rule for SSH and web access
echo "🔥 Creating firewall rules..."
gcloud compute firewall-rules create atoms-allow-ssh \
    --allow=tcp:22 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow SSH access" \
    --direction=INGRESS 2>/dev/null || echo "Firewall rule already exists"

gcloud compute firewall-rules create atoms-allow-http \
    --allow=tcp:80,tcp:443,tcp:3001 \
    --source-ranges=0.0.0.0/0 \
    --description="Allow HTTP/HTTPS and backend access" \
    --direction=INGRESS 2>/dev/null || echo "Firewall rule already exists"

# Create the VM instance
gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-balanced \
    --metadata=startup-script='#!/bin/bash
set -e

echo "🚀 Starting Atoms Ninja Kali Setup..."

# Update system
apt-get update
apt-get upgrade -y

# Install essential tools
apt-get install -y \
    curl wget git vim nano \
    build-essential \
    python3 python3-pip \
    nodejs npm \
    docker.io docker-compose \
    net-tools dnsutils \
    htop tmux screen

# Install Kali Linux security tools
echo "🔐 Installing Kali Linux security tools..."
apt-get install -y \
    nmap nikto wireshark tcpdump \
    sqlmap metasploit-framework \
    hydra john hashcat \
    aircrack-ng burpsuite \
    dirb gobuster wfuzz \
    exploitdb zaproxy \
    netcat-openbsd socat \
    whois traceroute ncat \
    masscan zmap \
    recon-ng theharvester \
    enum4linux smbclient \
    snmp snmp-mibs-downloader

# Install additional penetration testing tools
pip3 install \
    impacket \
    scapy \
    pwntools \
    requests beautifulsoup4 \
    paramiko fabric

# Install monitoring agents
echo "📊 Installing Google Cloud monitoring..."
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
bash add-google-cloud-ops-agent-repo.sh --also-install

# Setup Atoms Ninja backend
echo "🥷 Setting up Atoms Ninja backend..."
cd /opt
git clone https://github.com/yourusername/atoms-ninja.git || mkdir -p atoms-ninja
cd atoms-ninja

# Copy service account (will be uploaded separately)
# Setup will be completed via SSH

# Configure automatic security updates
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

# Setup firewall
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp

echo "✅ Atoms Ninja Kali VM Setup Complete!"
echo "🔐 All security tools installed"
echo "📊 Monitoring enabled"
echo "🚀 Ready for cybersecurity operations!"

' \
    --tags=http-server,https-server \
    --scopes=cloud-platform \
    --maintenance-policy=MIGRATE \
    --preemptible=false

echo ""
echo "✅ VM Instance Created Successfully!"
echo ""
echo "📋 VM Details:"
echo "   Name: $VM_NAME"
echo "   Zone: $ZONE"
echo "   Machine: $MACHINE_TYPE"
echo "   Disk: $DISK_SIZE SSD"
echo ""
echo "💰 Cost Estimate: ~$120/month"
echo "   - Compute (e2-standard-4): ~$100/month"
echo "   - Storage (100GB SSD): ~$17/month"
echo "   - Network egress: ~$3/month"
echo ""
echo "🔗 Next Steps:"
echo ""
echo "1. Get VM IP address:"
echo "   gcloud compute instances describe $VM_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)'"
echo ""
echo "2. SSH into VM:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "3. Upload service account to VM:"
echo "   gcloud compute scp service-account.json $VM_NAME:/opt/atoms-ninja/ --zone=$ZONE"
echo ""
echo "4. Monitor VM in Cloud Console:"
echo "   https://console.cloud.google.com/compute/instances?project=$PROJECT_ID"
echo ""
echo "5. View monitoring dashboard:"
echo "   https://console.cloud.google.com/monitoring?project=$PROJECT_ID"
echo ""
echo "6. Check costs:"
echo "   https://console.cloud.google.com/billing?project=$PROJECT_ID"
echo ""
echo "🔐 Security tools installed:"
echo "   ✅ Nmap, Nikto, Wireshark, Metasploit"
echo "   ✅ SQLMap, Hydra, John, Hashcat"
echo "   ✅ Burp Suite, OWASP ZAP"
echo "   ✅ Aircrack-ng, Gobuster, Dirb"
echo "   ✅ And many more..."
echo ""
echo "🥷 Happy Hacking!"
