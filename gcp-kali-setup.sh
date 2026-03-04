#!/bin/bash
# Google Cloud VM Setup Script for Kali Linux MCP Server
# This script sets up a Kali Linux environment with cybersecurity tools

set -e

echo "🚀 Starting Kali Linux MCP Server Setup on Google Cloud VM..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Kali Linux tools repository
echo "📦 Adding Kali Linux repository..."
echo "deb http://http.kali.org/kali kali-rolling main non-free contrib" | sudo tee /etc/apt/sources.list.d/kali.list
wget -q -O - https://archive.kali.org/archive-key.asc | sudo apt-key add -
sudo apt-get update

# Install essential Kali tools
echo "🛠️  Installing Kali Linux security tools..."

# Network scanning
sudo apt-get install -y nmap masscan

# Vulnerability scanning
sudo apt-get install -y nikto wapiti

# Web application testing
sudo apt-get install -y sqlmap dirb gobuster

# Password cracking
sudo apt-get install -y john hydra medusa

# Wireless tools
sudo apt-get install -y aircrack-ng reaver

# Exploitation frameworks
sudo apt-get install -y metasploit-framework

# Network analysis
sudo apt-get install -y wireshark tshark tcpdump

# Information gathering
sudo apt-get install -y whois dnsutils theharvester

# Additional tools
sudo apt-get install -y netcat socat curl wget git

# Install project dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create systemd service
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/kali-mcp.service > /dev/null <<EOF
[Unit]
Description=Kali Linux MCP Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="NODE_ENV=production"
Environment="KALI_MCP_PORT=3001"
ExecStart=/usr/bin/node $(pwd)/kali-mcp-server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable kali-mcp.service

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 3001/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cat > .env <<EOF
KALI_MCP_PORT=3001
NODE_ENV=production
LOG_LEVEL=info
EOF
fi

echo "✅ Kali MCP Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start the service: sudo systemctl start kali-mcp"
echo "2. Check status: sudo systemctl status kali-mcp"
echo "3. View logs: sudo journalctl -u kali-mcp -f"
echo "4. Access API: http://YOUR_VM_IP:3001"
echo ""
echo "🔒 Security reminders:"
echo "- Ensure your GCP firewall allows port 3001"
echo "- Use strong authentication in production"
echo "- Only use these tools on authorized systems"
