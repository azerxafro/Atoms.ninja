#!/bin/bash
# Quick VM creation - No billing setup, just the VM
set -e

PROJECT_ID="gen-lang-client-0528385692"
ZONE="us-central1-a"
VM_NAME="atoms-kali-security"
MACHINE_TYPE="e2-standard-4"

echo "🔐 Authenticating..."
gcloud auth activate-service-account --key-file=service-account.json
gcloud config set project $PROJECT_ID

echo "⏭️  Skipping API enablement (assuming already enabled)..."

echo "🔥 Creating firewall rules..."
gcloud compute firewall-rules create atoms-ssh --allow=tcp:22 --source-ranges=0.0.0.0/0 2>/dev/null || echo "SSH rule exists"
gcloud compute firewall-rules create atoms-http --allow=tcp:80,tcp:443,tcp:3001 --source-ranges=0.0.0.0/0 2>/dev/null || echo "HTTP rule exists"

echo "🖥️  Creating VM: $VM_NAME (e2-standard-4: 4vCPU, 16GB RAM, 100GB SSD)"
echo "💰 Estimated cost: ~$120/month (within your $150 budget)"

gcloud compute instances create $VM_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=debian-11 \
    --image-project=debian-cloud \
    --boot-disk-size=100GB \
    --boot-disk-type=pd-balanced \
    --metadata=startup-script='#!/bin/bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git vim python3 python3-pip nodejs npm docker.io
apt-get install -y nmap nikto wireshark tcpdump sqlmap metasploit-framework hydra john hashcat aircrack-ng burpsuite dirb gobuster wfuzz zaproxy netcat-openbsd
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh && bash add-google-cloud-ops-agent-repo.sh --also-install
echo "✅ Setup complete!" > /var/log/startup-complete.log
' \
    --tags=http-server,https-server \
    --scopes=cloud-platform

echo ""
echo "✅ VM CREATED!"
echo ""
gcloud compute instances describe $VM_NAME --zone=$ZONE --format="value(networkInterfaces[0].accessConfigs[0].natIP)" | xargs -I {} echo "🌐 IP Address: {}"
echo ""
echo "🔗 SSH into VM:"
echo "   gcloud compute ssh $VM_NAME --zone=$ZONE"
echo ""
echo "📊 Monitor: https://console.cloud.google.com/compute/instances?project=$PROJECT_ID"
