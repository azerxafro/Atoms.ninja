# Update GCP Kali MCP Server

## ⚠️ Important: Your GCP VM needs updated code!

The frontend now supports all tools, but the GCP Kali MCP server needs to be updated with the new whitelist.

---

## 🔧 How to Update GCP Server

### Option 1: SSH and Update (Recommended)

```bash
# 1. SSH into your GCP VM
gcloud compute ssh YOUR-VM-NAME --zone=YOUR-ZONE

# 2. Navigate to kali-mcp directory
cd /path/to/kali-mcp-server

# 3. Backup current file
cp kali-mcp-server.js kali-mcp-server.js.backup

# 4. Update the whitelist in kali-mcp-server.js
nano kali-mcp-server.js

# Find this section (around line 320):
const allowedCommands = [
  'nmap', 'masscan', 'nikto', 'sqlmap', 'dirb', 
  'john', 'hydra', 'aircrack-ng', 'tcpdump',
  'whois', 'dig', 'host', 'nslookup',
  'curl', 'wget', 'netcat', 'nc', 'hping3'
];

# Replace with:
const allowedCommands = [
  'nmap', 'masscan', 'nikto', 'sqlmap', 'dirb', 'gobuster',
  'john', 'hydra', 'hashcat', 'medusa',
  'aircrack-ng', 'tcpdump', 'wireshark',
  'whois', 'dig', 'host', 'nslookup',
  'whatweb', 'wpscan', 'searchsploit',
  'curl', 'wget', 'netcat', 'nc', 'hping3',
  'wfuzz', 'ffuf', 'dirsearch'
];

# 5. Restart the server
pm2 restart kali-mcp
# OR
systemctl restart kali-mcp
# OR
killall node && node kali-mcp-server.js &
```

### Option 2: Upload Updated File

```bash
# 1. Copy updated file to GCP
gcloud compute scp /Users/admin/atoms/kali-mcp-server.js YOUR-VM-NAME:~/kali-mcp-server.js --zone=YOUR-ZONE

# 2. SSH and restart
gcloud compute ssh YOUR-VM-NAME --zone=YOUR-ZONE
pm2 restart kali-mcp
```

---

## ✅ Verify Update

After updating, test it:

```bash
# Test from local machine
curl -X POST http://136.113.58.241:3001/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command": "dirb", "args": ["http://example.com"]}'

# Should return dirb output, not "Command not allowed"
```

---

## 🎯 New Tools Now Available

After update, these tools will work:
- ✅ dirb, gobuster (directory enumeration)
- ✅ whatweb, wpscan (web fingerprinting)
- ✅ searchsploit (exploit database)
- ✅ hashcat, medusa (password cracking)
- ✅ wfuzz, ffuf, dirsearch (fuzzing)

---

## 🚀 Quick Update Script

Save this as `update-mcp.sh` on GCP:

```bash
#!/bin/bash
echo "Updating Kali MCP Server whitelist..."

# Backup
cp kali-mcp-server.js kali-mcp-server.js.backup

# Update whitelist
sed -i "s/'nmap', 'masscan', 'nikto', 'sqlmap', 'dirb',/'nmap', 'masscan', 'nikto', 'sqlmap', 'dirb', 'gobuster',/" kali-mcp-server.js
sed -i "s/'john', 'hydra', 'aircrack-ng', 'tcpdump',/'john', 'hydra', 'hashcat', 'medusa',\n      'aircrack-ng', 'tcpdump', 'wireshark',/" kali-mcp-server.js

# Restart
pm2 restart kali-mcp || systemctl restart kali-mcp

echo "✅ Update complete!"
```

---

## 📝 Current Status

**Frontend**: ✅ Updated (deployed to Vercel)
**GCP MCP**: ⏳ Needs manual update

Once GCP is updated, all tools will work seamlessly!

