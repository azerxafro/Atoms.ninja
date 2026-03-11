# Atoms.ninja - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Clone & Setup
git clone https://github.com/azerxafro/Atoms.ninja.git
cd Atoms.ninja
npm install
cp .env.example .env
# Edit .env with your API keys

# Start Development
npm start                 # Start backend (port 3001)
python3 -m http.server 8000  # Start frontend (port 8000)

# Testing
npm test                  # Basic tests
npm run test:full         # Full integration tests
npm run validate          # Validate configuration
npm run demo              # System demo

# Deployment
vercel --prod             # Deploy to Vercel
docker build -t atoms .   # Build Docker image
```

---

## 📂 File Structure Overview

```
Atoms.ninja/
├── index.html              ← Main UI
├── script.js               ← Frontend logic (1,599 lines)
├── styles.css              ← Cyberpunk theme
├── config.js               ← Configuration
│
├── api/
│   ├── index.js           ← Main API router
│   ├── multi-ai.js        ← AI orchestration
│   ├── multi-ai.js          ← Multi-AI Engine
│   ├── openai.js          ← OpenAI GPT
│   ├── kali.js            ← Kali MCP proxy
│   ├── cve-lookup.js      ← Vulnerability DB
│   └── ai-health.js       ← Health checks
│
├── atoms-server.js         ← Standalone backend
├── kali-mcp-server.js      ← Kali MCP server
├── package.json            ← Dependencies
├── Dockerfile              ← Docker config
├── vercel.json             ← Vercel config
└── .env.example            ← Environment template
```

---

## 🔑 Environment Variables

```env
# Required
OPENROUTER_API_KEY=AIza...              # Get from: openrouter.ai/keys
OPENAI_API_KEY=sk-...               # Optional
ANTHROPIC_API_KEY=sk-ant-...        # Optional

# Server
PORT=3001
NODE_ENV=production

# Security
ALLOWED_ORIGINS=https://atoms.ninja,https://www.atoms.ninja
RATE_LIMIT_MAX_REQUESTS=60

# Kali MCP
KALI_MCP_ENDPOINT=http://136.113.58.241:3001
```

---

## 📡 API Endpoints

### **Health**
```bash
GET /health
GET /api/ai-health
```

### **AI**
```bash
POST /api/multi-ai          # Primary AI interface
POST /api/multi-ai            # Multi-AI Engine direct
POST /api/openai            # OpenAI GPT direct
```

### **Security Tools**
```bash
POST /api/kali              # Execute Kali tools
POST /api/cve-lookup        # Lookup CVE details
POST /api/attack-chain      # Analyze attack chain
```

---

## 🤖 AI Request Example

```javascript
// POST /api/multi-ai
{
  "message": "scan 8.8.8.8 for open ports",
  "chatHistory": [
    { "role": "user", "content": "hello" },
    { "role": "assistant", "content": "Hello, Chief!" }
  ],
  "sessionData": {
    "targets": ["8.8.8.8"],
    "findings": []
  },
  "mode": "fast"
}

// Response
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "response": "I'll scan that target, Chief.",
  "autoExecute": {
    "action": "execute",
    "command": "nmap -sV 8.8.8.8",
    "explanation": "Service version detection scan"
  }
}
```

---

## 🔧 Kali Tool Request Example

```javascript
// POST /api/kali
{
  "tool": "nmap",
  "target": "192.168.1.1",
  "options": "-sV -p-"
}

// Response
{
  "success": true,
  "output": "Starting Nmap 7.94...\nNmap scan report for 192.168.1.1\nPORT   STATE SERVICE\n22/tcp open  ssh\n80/tcp open  http\n...",
  "exitCode": 0,
  "duration": 12500
}
```

---

## 💻 Frontend Key Functions

### **Session Management**
```javascript
startNewSession()           // Initialize new session
saveSession()               // Save to localStorage
loadCurrentSession()        // Restore session
exportSession()             // Download as JSON
```

### **Command Processing**
```javascript
processCommand(cmd)         // Main command handler
executeKaliTool(tool, args) // Execute security tool
autoExecuteCommand(cmdObj)  // Auto-execute AI suggestion
```

### **AI Integration**
```javascript
callMultiAI(prompt)         // Call AI with context
callAI(prompt)          // Direct Multi-AI call
callOpenAI(prompt)          // Direct OpenAI call
```

### **Terminal UI**
```javascript
displayOutput(text, type)   // Display formatted output
displayTypingEffect(text)   // Typewriter animation
clearTerminal()             // Clear output
addToHistory(command)       // Add to command history
```

### **Session Data Tracking**
```javascript
trackTarget(command)        // Extract IPs/domains
logFinding(data)           // Log vulnerability
logVulnerability(vuln)     // Log CVE/exploit
```

---

## 🎨 CSS Classes Reference

### **Colors**
```css
--color-purple: #8B5CF6      /* Primary accent */
--color-pink: #EC4899        /* Secondary accent */
--color-green: #10B981       /* Success/Matrix green */
--color-red: #EF4444         /* Error */
--color-yellow: #F59E0B      /* Warning */
--bg-dark: #0F0F0F           /* Background */
--bg-card: #1A1A1A           /* Card background */
```

### **Key Classes**
```css
.terminal                    /* Terminal container */
.terminal-output             /* Output area */
.terminal-input-line         /* Input line */
.output-success              /* Success message (green) */
.output-error                /* Error message (red) */
.output-info                 /* Info message (blue) */
.output-warning              /* Warning message (yellow) */
.feature-card                /* Feature card */
.glass-effect                /* Glassmorphism */
.neon-glow                   /* Neon glow animation */
```

---

## 🔐 Security Checklist

### **Before Production**
- [ ] Set strong API keys
- [ ] Configure ALLOWED_ORIGINS (no `*`)
- [ ] Enable rate limiting
- [ ] Set up billing alerts
- [ ] Restrict service account permissions
- [ ] Review firewall rules
- [ ] Enable HTTPS
- [ ] Test error handling

### **Regular Maintenance**
- [ ] Rotate API keys monthly
- [ ] Monitor API usage
- [ ] Check for CVE updates
- [ ] Review access logs
- [ ] Update dependencies
- [ ] Test disaster recovery
- [ ] Backup configuration

---

## 🐛 Common Issues & Solutions

### **Backend won't start**
```bash
# Check Node.js version
node --version  # Must be 16+

# Check port 3001 availability
lsof -i :3001
kill -9 <PID>   # If port is in use

# Check environment variables
cat .env
echo $OPENROUTER_API_KEY

# Run with debug
DEBUG=* node atoms-server.js
```

### **CORS errors**
```javascript
// Update .env
ALLOWED_ORIGINS=http://localhost:8000,https://atoms.ninja

// Or in atoms-server.js
const allowedOrigins = ['http://localhost:8000', 'https://atoms.ninja'];
```

### **Kali MCP connection fails**
```bash
# Test GCP VM connectivity
curl http://136.113.58.241:3001/health

# Check GCP VM status
gcloud compute instances list

# SSH into VM and check service
gcloud compute ssh atoms-kali-security
systemctl status atoms-kali-mcp
journalctl -u atoms-kali-mcp -f
```

### **AI not responding**
```bash
# Test API key
curl -H "Content-Type: application/json" \
  -d '{"prompt":"test"}' \
  http://localhost:3001/api/multi-ai

# Check API health
curl http://localhost:3001/api/ai-health

# Check quota limits
# Visit: console.cloud.google.com/apis/dashboard
```

### **Frontend can't connect**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check browser console for errors (F12)
3. Verify `CONFIG.BACKEND_API_URL` in script.js
4. Check CORS settings
5. Try incognito mode (rule out extensions)

---

## 🧪 Testing

### **Manual API Testing**
```bash
# Health check
curl http://localhost:3001/health

# Test AI Engine
curl -X POST http://localhost:3001/api/multi-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is SQL injection?"}'

# Test Multi-AI
curl -X POST http://localhost:3001/api/multi-ai \
  -H "Content-Type: application/json" \
  -d '{
    "message": "scan 8.8.8.8",
    "chatHistory": [],
    "sessionData": {"targets": []},
    "mode": "fast"
  }'

# Test Kali MCP
curl -X POST http://136.113.58.241:3001/api/tools/nmap \
  -H "Content-Type: application/json" \
  -d '{"target": "8.8.8.8", "options": "-sV"}'
```

### **Automated Tests**
```bash
# Run all tests
npm test

# Run integration tests
npm run test:full

# Validate config
npm run validate

# System demo
npm run demo
```

---

## 🚀 Deployment Quick Commands

### **Vercel**
```bash
# Install CLI
npm i -g vercel

# Login
vercel login

# Set secrets
vercel env add OPENROUTER_API_KEY production
vercel env add OPENAI_API_KEY production

# Deploy
vercel --prod

# Check status
vercel ls
vercel logs <deployment-url>
```

### **Docker**
```bash
# Build
docker build -t atoms-ninja-backend .

# Run
docker run -d -p 3001:3001 \
  -e OPENROUTER_API_KEY=$OPENROUTER_API_KEY \
  --name atoms-backend \
  atoms-ninja-backend

# Logs
docker logs -f atoms-backend

# Stop
docker stop atoms-backend
docker rm atoms-backend

# Push to registry
docker tag atoms-ninja-backend user/atoms-ninja:latest
docker push user/atoms-ninja:latest
```

### **GCP Kali VM**
```bash
# SSH
gcloud compute ssh atoms-kali-security --zone=us-central1-a

# Start MCP server
cd Atoms.ninja
node kali-mcp-server.js &

# Or with systemd
sudo systemctl start atoms-kali-mcp
sudo systemctl status atoms-kali-mcp

# View logs
journalctl -u atoms-kali-mcp -f

# Restart
sudo systemctl restart atoms-kali-mcp
```

---

## 📊 Performance Monitoring

### **Key Metrics**
```bash
# API latency
curl -w "@curl-format.txt" http://localhost:3001/health

# Request rate
watch -n 1 'journalctl -u atoms-kali-mcp --since "1 minute ago" | wc -l'

# Memory usage
free -h
docker stats atoms-backend

# CPU usage
top -p $(pgrep -f openrouter-multi-modelxy)
```

### **Vercel Analytics**
- Dashboard: vercel.com/dashboard/analytics
- Real-time metrics
- Performance insights
- User geography
- Error tracking

---

## 🎯 Example Commands for Terminal

```bash
# Network Scanning
nmap -sV 192.168.1.1
scan 8.8.8.8 for vulnerabilities

# Exploitation
metasploit
use exploit/multi/handler

# Web Testing
nikto -h http://target.com
sqlmap -u "http://target.com/page?id=1"

# Forensics
volatility
autopsy

# Natural Language
What tools can scan for SQL injection?
How do I test for XSS vulnerabilities?
Analyze the scan results from 192.168.1.1
```

---

## 📚 Resources

- **API Docs**: See INFRASTRUCTURE_DOCUMENTATION.md
- **Architecture**: See ARCHITECTURE_DIAGRAM.md
- **Deployment**: See DEPLOYMENT.md
- **GitHub**: github.com/azerxafro/Atoms.ninja
- **AI API**: openrouter.ai/keys
- **Kali Tools**: kali.org/tools
- **Vercel Docs**: vercel.com/docs

---

## 💡 Pro Tips

1. **Use Auto-Execute Mode**: Let AI suggest and execute commands automatically
2. **Track Targets**: System automatically extracts IPs/domains from commands
3. **Export Sessions**: Download complete session data as JSON
4. **Keyboard Shortcuts**: Use ↑/↓ for command history
5. **Natural Language**: Ask questions in plain English
6. **Context Awareness**: AI remembers past 20 messages
7. **Parallel Scans**: Queue multiple scans, execute sequentially
8. **CVE Integration**: Automatically lookup vulnerabilities
9. **Report Generation**: Export findings with recommendations
10. **Dark Theme**: Built-in Matrix/cyberpunk aesthetic

---

## 🆘 Get Help

- **Documentation**: Check `/docs` folder
- **Issues**: github.com/azerxafro/Atoms.ninja/issues
- **Logs**: `journalctl -f` (systemd) or `docker logs -f` (Docker)
- **Debug Mode**: Set `DEBUG=*` environment variable
- **Community**: Join discussions on GitHub

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-23  
**Quick Reference for**: Developers, DevOps, Security Teams
