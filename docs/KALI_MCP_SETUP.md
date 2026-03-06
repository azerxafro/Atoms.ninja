# Kali Linux MCP Server - Google Cloud Setup Guide

## Overview
This guide helps you set up a complete Kali Linux cybersecurity tools MCP server on Google Cloud Platform.

## Prerequisites
- Google Cloud Platform account
- `gcloud` CLI installed and configured
- Basic understanding of Linux and security tools

## Quick Start

### 1. Create GCP VM Instance

```bash
# Set your project
gcloud config set project YOUR_PROJECT_ID

# Create a VM instance with sufficient resources
gcloud compute instances create kali-mcp-server \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-standard \
  --image-family=debian-11 \
  --image-project=debian-cloud \
  --tags=http-server,https-server,kali-mcp \
  --metadata-from-file startup-script=gcp-kali-setup.sh
```

### 2. Configure Firewall Rules

```bash
# Allow MCP server traffic
gcloud compute firewall-rules create allow-kali-mcp \
  --allow=tcp:3001 \
  --target-tags=kali-mcp \
  --source-ranges=0.0.0.0/0 \
  --description="Allow Kali MCP Server traffic"

# Allow main app traffic
gcloud compute firewall-rules create allow-app \
  --allow=tcp:3000 \
  --target-tags=http-server \
  --source-ranges=0.0.0.0/0
```

### 3. SSH into VM and Complete Setup

```bash
# SSH into your instance
gcloud compute ssh kali-mcp-server --zone=us-central1-a

# Navigate to your project directory
cd /path/to/atoms

# Run the setup script
chmod +x gcp-kali-setup.sh
./gcp-kali-setup.sh
```

### 4. Start the Service

```bash
# Start the Kali MCP server
sudo systemctl start kali-mcp

# Enable auto-start on boot
sudo systemctl enable kali-mcp

# Check status
sudo systemctl status kali-mcp

# View logs
sudo journalctl -u kali-mcp -f
```

## Available Tools & API Endpoints

### Network Scanning
- **Nmap**: `POST /api/tools/nmap`
  ```json
  { "target": "192.168.1.1", "options": "-sV -sC" }
  ```

- **Masscan**: `POST /api/tools/masscan`
  ```json
  { "target": "192.168.1.0/24", "ports": "1-1000", "rate": "10000" }
  ```

### Vulnerability Scanning
- **Nikto**: `POST /api/tools/nikto`
  ```json
  { "target": "http://example.com" }
  ```

### Web Application Testing
- **SQLMap**: `POST /api/tools/sqlmap`
  ```json
  { "url": "http://example.com/page?id=1", "options": "--batch --dbs" }
  ```

- **Dirb**: `POST /api/tools/dirb`
  ```json
  { "url": "http://example.com", "wordlist": "/usr/share/wordlists/dirb/common.txt" }
  ```

### Password Cracking
- **John the Ripper**: `POST /api/tools/john`
  ```json
  { "hashFile": "/path/to/hashes.txt", "wordlist": "/usr/share/wordlists/rockyou.txt" }
  ```

- **Hydra**: `POST /api/tools/hydra`
  ```json
  { "target": "192.168.1.1", "service": "ssh", "username": "admin", "passwordList": "/path/to/passwords.txt" }
  ```

### Wireless Tools
- **Aircrack-ng**: `POST /api/tools/aircrack`
  ```json
  { "capFile": "/path/to/capture.cap", "wordlist": "/usr/share/wordlists/rockyou.txt" }
  ```

### Network Analysis
- **Wireshark/Tshark**: `POST /api/tools/wireshark`
  ```json
  { "pcapFile": "/path/to/capture.pcap", "filter": "tcp.port==80" }
  ```

### Information Gathering
- **Whois**: `POST /api/tools/whois`
  ```json
  { "domain": "example.com" }
  ```

- **Dig**: `POST /api/tools/dig`
  ```json
  { "domain": "example.com", "type": "ANY" }
  ```

- **theHarvester**: `POST /api/tools/theHarvester`
  ```json
  { "domain": "example.com", "source": "google" }
  ```

### Exploitation
- **Metasploit**: `POST /api/tools/metasploit`
  ```json
  { "command": "use auxiliary/scanner/portscan/tcp; set RHOSTS 192.168.1.1; run" }
  ```

## Integration with Your App

Update your `script.js` to integrate with the Kali MCP server:

```javascript
// Add to your existing code
const KALI_MCP_URL = 'http://YOUR_VM_IP:3001';

async function runSecurityScan(tool, params) {
  try {
    const response = await fetch(`${KALI_MCP_URL}/api/tools/${tool}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Security scan error:', error);
    throw error;
  }
}

// Usage example
async function scanNetwork(target) {
  const result = await runSecurityScan('nmap', {
    target: target,
    options: '-sV -sC'
  });
  console.log('Scan results:', result);
}
```

## Security Best Practices

### 1. Authentication & Authorization
Add authentication to the MCP server:
```bash
npm install express-jwt jsonwebtoken
```

### 2. Use HTTPS
Set up SSL/TLS certificates:
```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### 3. Restrict Access
Update firewall rules to allow only specific IPs:
```bash
gcloud compute firewall-rules update allow-kali-mcp \
  --source-ranges=YOUR_IP/32
```

### 4. Enable Logging
Monitor all security tool usage:
```javascript
// Add to kali-mcp-server.js
const fs = require('fs');
const logStream = fs.createWriteStream('/var/log/kali-mcp.log', { flags: 'a' });

app.use((req, res, next) => {
  logStream.write(`${new Date().toISOString()} ${req.method} ${req.path}\n`);
  next();
});
```

### 5. Rate Limiting
Already implemented in the server code with express-rate-limit.

## Monitoring & Maintenance

### Check Service Status
```bash
sudo systemctl status kali-mcp
```

### View Logs
```bash
sudo journalctl -u kali-mcp -f --lines=100
```

### Update Tools
```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### Restart Service
```bash
sudo systemctl restart kali-mcp
```

## Troubleshooting

### Service won't start
```bash
# Check logs
sudo journalctl -u kali-mcp -n 50

# Test manually
node kali-mcp-server.js
```

### Tools not found
```bash
# Verify tool installation
which nmap
which sqlmap

# Reinstall if needed
sudo apt-get install --reinstall nmap
```

### Port conflicts
```bash
# Check what's using port 3001
sudo lsof -i :3001

# Change port in .env file
echo "KALI_MCP_PORT=3002" >> .env
sudo systemctl restart kali-mcp
```

## Cost Optimization

1. **Use Preemptible VMs**: Save up to 80%
2. **Stop VM when not in use**: `gcloud compute instances stop kali-mcp-server`
3. **Use smaller machine types** for light workloads
4. **Set up auto-shutdown scripts** for non-business hours

## Legal & Ethical Considerations

⚠️ **IMPORTANT**: 
- Only use these tools on systems you own or have explicit permission to test
- Unauthorized access to computer systems is illegal
- Follow responsible disclosure practices
- Comply with all applicable laws and regulations

## Next Steps

1. ✅ VM created and configured
2. ✅ Kali tools installed
3. ✅ MCP server running
4. 🔲 Integrate with your frontend
5. 🔲 Set up authentication
6. 🔲 Configure SSL/TLS
7. 🔲 Set up monitoring and alerts

## Support & Resources

- [Kali Linux Documentation](https://www.kali.org/docs/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-02
