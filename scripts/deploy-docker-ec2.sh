#!/bin/bash
# ═══════════════════════════════════════════════════════
# Atoms Ninja — Deploy Docker Arsenal to EC2
# Builds and runs the mega-container on the EC2 instance
# ═══════════════════════════════════════════════════════
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ─── Load EC2 Config ─────────────────────────────
if [ -f "$PROJECT_DIR/.aws-instance.env" ]; then
    source "$PROJECT_DIR/.aws-instance.env"
else
    echo "❌ .aws-instance.env not found. Run create-aws-instance.sh first."
    exit 1
fi

KEY_FILE="${KEY_FILE:-$HOME/.ssh/${KEY_NAME}.pem}"
EC2_USER="${EC2_USER:-ec2-user}"
CONTAINER_NAME="atoms-ninja-arsenal"
IMAGE_NAME="atoms-ninja:latest"

echo "═══════════════════════════════════════════════"
echo "  Atoms Ninja — Docker Arsenal Deployment"
echo "═══════════════════════════════════════════════"
echo "  Target:    ${EC2_USER}@${ELASTIC_IP}"
echo "  Key:       ${KEY_FILE}"
echo "  Container: ${CONTAINER_NAME}"
echo "═══════════════════════════════════════════════"
echo ""

# ─── Validate SSH Key ─────────────────────────────
if [ ! -f "$KEY_FILE" ]; then
    echo "❌ SSH key not found: $KEY_FILE"
    echo "   Set KEY_FILE env var or ensure ~/.ssh/${KEY_NAME}.pem exists"
    exit 1
fi

SSH_CMD="ssh -i $KEY_FILE -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${EC2_USER}@${ELASTIC_IP}"
SCP_CMD="scp -i $KEY_FILE -o StrictHostKeyChecking=no"

# ─── Test SSH Connection ─────────────────────────
echo "🔐 Testing SSH connection..."
if ! $SSH_CMD "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ Cannot SSH to ${ELASTIC_IP}. Check key and security group."
    exit 1
fi
echo "  ✅ SSH connected"

# ─── Install Docker on EC2 ───────────────────────
echo ""
echo "══ [1/6] Installing Docker on EC2 ══"
$SSH_CMD << 'DOCKER_INSTALL'
if command -v docker &>/dev/null; then
    echo "  ✅ Docker already installed: $(docker --version)"
else
    echo "  📥 Installing Docker..."
    # Amazon Linux 2023
    if command -v dnf &>/dev/null; then
        sudo dnf install -y docker 2>&1 | tail -3
    # Amazon Linux 2
    elif command -v yum &>/dev/null; then
        sudo yum install -y docker 2>&1 | tail -3
    # Debian/Ubuntu
    else
        sudo apt-get update && sudo apt-get install -y docker.io 2>&1 | tail -3
    fi
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "  ✅ Docker installed: $(docker --version)"
fi

# Ensure Docker is running
if ! sudo systemctl is-active --quiet docker; then
    sudo systemctl start docker
fi
DOCKER_INSTALL

# ─── Add Swap Space ──────────────────────────────
echo ""
echo "══ [2/6] Ensuring swap space (for Docker build) ══"
$SSH_CMD << 'SWAP_SETUP'
if [ "$(sudo swapon --show | wc -l)" -gt 0 ]; then
    echo "  ✅ Swap already active: $(free -h | grep Swap | awk '{print $2}')"
else
    echo "  📥 Creating 2GB swap..."
    sudo dd if=/dev/zero of=/swapfile bs=1M count=2048 2>/dev/null
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile 2>/dev/null
    sudo swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab > /dev/null
    echo "  ✅ 2GB swap created"
fi
SWAP_SETUP

# ─── Sync Project Files ──────────────────────────
echo ""
echo "══ [3/6] Syncing project files to EC2 ══"

# Create remote directory
$SSH_CMD "mkdir -p /opt/atoms-ninja"

# Use rsync if available, otherwise scp
if command -v rsync &>/dev/null; then
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'frontend' \
        --exclude 'docs' \
        --exclude 'examples' \
        --exclude 'tests' \
        --exclude 'public' \
        --exclude '*.md' \
        --exclude '.env' \
        --exclude '.aws-instance.env' \
        -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" \
        "$PROJECT_DIR/" "${EC2_USER}@${ELASTIC_IP}:/opt/atoms-ninja/"
else
    # Fallback: tar + scp
    echo "  Using tar+scp (rsync not available)..."
    cd "$PROJECT_DIR"
    tar czf /tmp/atoms-ninja-deploy.tar.gz \
        --exclude='node_modules' --exclude='.git' --exclude='frontend' \
        --exclude='docs' --exclude='examples' --exclude='tests' \
        --exclude='public' --exclude='*.md' --exclude='.env' \
        --exclude='.aws-instance.env' .
    $SCP_CMD /tmp/atoms-ninja-deploy.tar.gz "${EC2_USER}@${ELASTIC_IP}:/tmp/"
    $SSH_CMD "cd /opt/atoms-ninja && tar xzf /tmp/atoms-ninja-deploy.tar.gz && rm /tmp/atoms-ninja-deploy.tar.gz"
    rm -f /tmp/atoms-ninja-deploy.tar.gz
fi
echo "  ✅ Files synced"

# ─── Copy .env if exists ─────────────────────────
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "  📥 Uploading .env..."
    $SCP_CMD "$PROJECT_DIR/.env" "${EC2_USER}@${ELASTIC_IP}:/opt/atoms-ninja/.env"
    echo "  ✅ .env uploaded"
fi

# ─── Build Docker Image ──────────────────────────
echo ""
echo "══ [4/6] Building Docker image on EC2 (this takes 10-20 min first time) ══"
$SSH_CMD << 'DOCKER_BUILD'
cd /opt/atoms-ninja
sudo docker build -t atoms-ninja:latest . 2>&1 | tail -20
echo ""
echo "  ✅ Image built: $(sudo docker images atoms-ninja:latest --format '{{.Size}}')"
DOCKER_BUILD

# ─── Stop Old Container & Start New ──────────────
echo ""
echo "══ [5/6] Starting container ══"
$SSH_CMD << 'DOCKER_RUN'
CONTAINER_NAME="atoms-ninja-arsenal"

# Stop and remove old container if exists
if sudo docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  🛑 Stopping old container..."
    sudo docker stop "$CONTAINER_NAME" 2>/dev/null || true
    sudo docker rm "$CONTAINER_NAME" 2>/dev/null || true
fi

# Run new container
echo "  🚀 Starting new container..."
sudo docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 3001:3001 \
    -p 3002:3002 \
    -p 8080:8080 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /opt/atoms-ninja/.env:/app/.env:ro \
    --memory 1800m \
    --cpus 1.8 \
    atoms-ninja:latest

echo "  ✅ Container started: $(sudo docker ps --filter name=$CONTAINER_NAME --format '{{.Status}}')"

# Clean up old images
sudo docker image prune -f 2>/dev/null || true
DOCKER_RUN

# ─── Verify Health ────────────────────────────────
echo ""
echo "══ [6/6] Verifying health ══"
echo "  ⏳ Waiting for services to boot..."
sleep 10

for i in $(seq 1 12); do
    if curl -sf "http://${ELASTIC_IP}:3001/health" > /dev/null 2>&1; then
        HEALTH=$(curl -s "http://${ELASTIC_IP}:3001/health")
        echo "  ✅ atoms-server (3001): $HEALTH"
        break
    fi
    if [ "$i" -eq 12 ]; then
        echo "  ⚠️  atoms-server not responding. Check logs:"
        echo "      ssh -i $KEY_FILE ${EC2_USER}@${ELASTIC_IP} 'sudo docker logs atoms-ninja-arsenal --tail 50'"
    fi
    sleep 5
done

for i in $(seq 1 6); do
    if curl -sf "http://${ELASTIC_IP}:3002/health" > /dev/null 2>&1; then
        HEALTH=$(curl -s "http://${ELASTIC_IP}:3002/health")
        echo "  ✅ kali-mcp-server (3002): $HEALTH"
        break
    fi
    if [ "$i" -eq 6 ]; then
        echo "  ⚠️  kali-mcp-server not responding yet"
    fi
    sleep 3
done

# ─── Summary ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "🛡️  Atoms Ninja Arsenal — DEPLOYED"
echo "═══════════════════════════════════════════════"
echo ""
echo "  🌐 Main API:      http://${ELASTIC_IP}:3001"
echo "  🔧 Kali MCP:      http://${ELASTIC_IP}:3002"
echo "  🔬 ZAP (on-demand): http://${ELASTIC_IP}:8080"
echo ""
echo "  📋 Useful commands:"
echo "     # View logs"
echo "     ssh -i $KEY_FILE ${EC2_USER}@${ELASTIC_IP} 'sudo docker logs -f atoms-ninja-arsenal'"
echo ""
echo "     # Shell into container"
echo "     ssh -i $KEY_FILE ${EC2_USER}@${ELASTIC_IP} 'sudo docker exec -it atoms-ninja-arsenal bash'"
echo ""
echo "     # Restart"
echo "     ssh -i $KEY_FILE ${EC2_USER}@${ELASTIC_IP} 'sudo docker restart atoms-ninja-arsenal'"
echo ""
echo "     # Test nmap"
echo "     curl -X POST http://${ELASTIC_IP}:3002/api/tools/nmap -H 'Content-Type: application/json' -d '{\"target\":\"scanme.nmap.org\",\"options\":\"-sV\"}'"
echo ""
