#!/bin/bash
set -e

echo "🚀 Deploying Kali MCP Server to GCP VM..."

# Upload files
echo "📦 Uploading files..."
gcloud compute scp kali-mcp-server.js atoms-kali-security:~/kali-mcp-server.js --zone=us-central1-a
gcloud compute scp package.json atoms-kali-security:~/package.json --zone=us-central1-a

# Create .env file
gcloud compute ssh atoms-kali-security --zone=us-central1-a --command="cat > .env << 'EOF'
KALI_MCP_PORT=3001
NODE_ENV=production
LOG_LEVEL=info
EOF"

# Install and setup
echo "📥 Installing dependencies on VM..."
gcloud compute ssh atoms-kali-security --zone=us-central1-a --command="
sudo apt-get update -qq
sudo apt-get install -y nodejs npm nmap metasploit-framework wireshark sqlmap nikto aircrack-ng john hashcat
npm install express cors dotenv express-rate-limit
"

# Start server with PM2
echo "🔧 Starting MCP server..."
gcloud compute ssh atoms-kali-security --zone=us-central1-a --command="
sudo npm install -g pm2
pm2 stop kali-mcp || true
pm2 delete kali-mcp || true
pm2 start kali-mcp-server.js --name kali-mcp
pm2 save
pm2 startup
"

echo "✅ Deployment complete!"
echo "🌐 MCP Server: http://136.113.58.241:3001"
echo "🔍 Test health: curl http://136.113.58.241:3001/health"

