# Kali Linux MCP Server - AWS EC2 Setup Guide

## Overview
This guide helps you set up a complete Kali Linux cybersecurity tools MCP server on AWS EC2.

## Prerequisites
- AWS account with EC2 access
- AWS CLI installed and configured (`aws configure`)
- SSH key pair created in your target region
- Basic understanding of Linux and security tools

## Quick Start

### 1. Create EC2 Instance

```bash
# Launch a Kali-based EC2 instance (t3.large recommended)
aws ec2 run-instances \
  --image-id ami-XXXXXXXXX \
  --instance-type t3.large \
  --key-name your-keypair \
  --security-group-ids sg-XXXXXXXXX \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":50,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=atoms-kali-mcp}]' \
  --user-data file://ec2-kali-setup.sh

# Or use the AWS Console to launch a Kali Linux AMI from the Marketplace
```

### 2. Configure Security Group

```bash
# Allow MCP server traffic (port 3001)
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  --description "Allow Kali MCP Server traffic"

# Allow SSH access
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP/32 \
  --description "SSH access"
```

### 3. SSH into Instance and Complete Setup

```bash
# SSH into your instance
ssh -i your-keypair.pem ec2-user@<EC2_IP>

# Navigate to your project directory
cd /path/to/atoms

# Run the setup script
chmod +x ec2-kali-setup.sh
./ec2-kali-setup.sh
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
Update security group to allow only specific IPs:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id sg-XXXXXXXXX \
  --protocol tcp \
  --port 3001 \
  --cidr YOUR_IP/32 \
  --description "Restricted MCP access"
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

1. **Use Spot Instances**: Save up to 90%
2. **Stop instance when not in use**: `aws ec2 stop-instances --instance-ids i-XXXXXXXXX`
3. **Use smaller instance types** for light workloads
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
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [MCP Protocol](https://modelcontextprotocol.io/)

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-02
