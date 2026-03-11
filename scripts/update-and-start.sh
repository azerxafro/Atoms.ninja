#!/bin/bash
# ═══════════════════════════════════════════════════════════
# Atoms Ninja — Deployment Fix & Restart
# ═══════════════════════════════════════════════════════════

KEY_PATH="$HOME/.ssh/atoms-ninja-key.pem"
BETA_IP="3.236.114.26"
PROD_IP="34.202.47.138"

echo "🚀 Applying fixes to EC2 instances..."

# Fix Beta
echo "🧪 Updating Beta ($BETA_IP)..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$BETA_IP << 'EOF'
  cd /home/ec2-user/atoms-beta
  git pull origin beta
  npm install --production
  # Kill existing npx serve or node process
  pkill -f "serve -s" || true
  pkill -f "node atoms-server.js" || true
  # Install tools
  bash scripts/install-kali-tools.sh
  # Start properly
  PORT=3001 nohup node atoms-server.js > /var/log/atoms-beta.log 2>&1 &
  echo "✅ Beta updated and restarted on port 3001"
EOF

# Fix Prod
echo "🌍 Updating Production ($PROD_IP)..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$PROD_IP << 'EOF'
  cd /home/ec2-user/atoms
  git pull origin main
  npm install --production
  # Kill existing npx serve or node process
  pkill -f "serve -s" || true
  pkill -f "node atoms-server.js" || true
  # Install tools
  bash scripts/install-kali-tools.sh
  # Start properly
  PORT=3000 nohup node atoms-server.js > /var/log/atoms.log 2>&1 &
  echo "✅ Production updated and restarted on port 3000"
EOF

echo "✨ All instances updated!"
