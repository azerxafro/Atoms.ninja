# Atoms.ninja - Infrastructure & Architecture Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Component Details](#component-details)
5. [API Endpoints](#api-endpoints)
6. [Deployment Infrastructure](#deployment-infrastructure)
7. [Security & Configuration](#security--configuration)
8. [Development Workflow](#development-workflow)

---

## 🎯 System Overview

**Atoms.ninja** is a production-ready, AI-powered cybersecurity platform that provides:
- Interactive AI security consultant powered by multiple AI providers (Multi-AI Engine, OpenAI, Anthropic Claude, Groq)
- Access to 500+ Kali Linux penetration testing tools via MCP (Model Context Protocol) server
- Natural language command interface for security operations
- Real-time vulnerability scanning and analysis
- Session persistence and report generation

**Key Statistics:**
- **Total Lines of Code**: ~2,400+ lines (core application)
- **Frontend**: 1,599 lines (script.js) + HTML/CSS
- **Backend APIs**: 210 lines (main handler) + 14 specialized endpoints
- **Kali MCP Server**: 372 lines
- **Proxy Server**: 250 lines

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Frontend (Static HTML/CSS/JS)                          │  │
│  │  - index.html (Landing Page)                            │  │
│  │  - script.js (Terminal Logic, Session Management)      │  │
│  │  - styles.css (Cyberpunk Matrix Theme)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↓                                     │
│                      HTTPS/API Calls                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   VERCEL SERVERLESS FUNCTIONS                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /api/index.js (Unified API Handler)                    │  │
│  │  ├── /api/multi-ai    → AI Orchestration Layer          │  │
│  │  ├── /api/multi-ai      → Multi-AI Engine Proxy             │  │
│  │  ├── /api/openai      → OpenAI GPT Proxy                │  │
│  │  ├── /api/kali        → Kali MCP Proxy                  │  │
│  │  ├── /api/ai-health   → Health Checks                   │  │
│  │  ├── /api/cve-lookup  → Vulnerability Database          │  │
│  │  └── /api/attack-chain → Attack Analysis                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          ↓                           ↓                     ↓
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  AI PROVIDERS    │   │  GCP KALI VM     │   │ CVE DATABASES    │
│                  │   │                  │   │                  │
│ • Multi-AI Engine  │   │ Kali MCP Server  │   │ • NVD            │
│ • OpenAI GPT-4   │   │ 136.113.58.241   │   │ • MITRE          │
│ • Anthropic      │   │ Port: 3001       │   │ • CVE Details    │
│   Claude         │   │                  │   │                  │
│ • Groq           │   │ 500+ Security    │   │                  │
│                  │   │ Tools:           │   │                  │
│                  │   │ • nmap           │   │                  │
│                  │   │ • metasploit     │   │                  │
│                  │   │ • wireshark      │   │                  │
│                  │   │ • burp suite     │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 🔧 Technology Stack

### **Frontend**
| Technology | Purpose | Version |
|------------|---------|---------|
| HTML5 | Structure | - |
| CSS3 | Cyberpunk Matrix Styling | - |
| Vanilla JavaScript | Terminal Logic, API Calls | ES6+ |
| LocalStorage API | Session Persistence | - |
| Vercel Analytics | Performance Monitoring | 1.5.0 |
| Vercel Speed Insights | Real-time metrics | 1.2.0 |

### **Backend**
| Technology | Purpose | Version |
|------------|---------|---------|
| Node.js | Runtime Environment | 18+ |
| Express.js | Web Framework | 4.18.2 |
| CORS | Cross-Origin Resource Sharing | 2.8.5 |
| dotenv | Environment Variables | 16.3.1 |
| express-rate-limit | API Rate Limiting | 7.1.5 |
| node-fetch | HTTP Client | 2.7.0 |

### **AI/ML Services**
| Provider | SDK | Purpose | Model |
|----------|-----|---------|-------|
| Multi-AI Engine | openrouter/venice/bedrock | Primary AI | multi-model |
| OpenAI | openai 6.8.1 | Fallback AI | gpt-4o-mini |
| Anthropic | @anthropic-ai/sdk 0.68.0 | Advanced reasoning | claude-3-opus |
| Groq | groq-sdk 0.34.0 | Fast inference | mixtral-8x7b |

### **Cloud Infrastructure**
| Service | Purpose | Configuration |
|---------|---------|---------------|
| Vercel | Serverless Functions + Frontend | vercel.json |
| Google Cloud Platform | Kali MCP Server VM | Compute Engine |
| Docker | Containerization | node:18-alpine |
| GitHub | Version Control | Repository |

---

## 📦 Component Details

### **1. Frontend (Client-Side)**

#### **index.html** (Main Entry Point)
- **Purpose**: Landing page and terminal interface
- **Sections**:
  - Hero section with animated gradient
  - Features showcase (AI, Tools, Security)
  - Pricing tiers (Free, Professional, Enterprise)
  - Interactive terminal emulator
- **Key Features**:
  - Smooth scrolling navigation
  - Responsive design
  - Terminal command interface
  - Real-time output display

#### **script.js** (1,599 lines)
- **Core Classes/Functions**:
  - `CONFIG`: API endpoint configuration
  - `currentSession`: Session state management
  - `chatHistory`: AI conversation history (max 20 messages)
  - `commandHistory`: Terminal command history
  
- **Key Functions**:
  ```javascript
  // AI Integration
  callMultiAI(prompt)          // Calls multi-AI endpoint
  callAI(prompt)           // Direct Multi-AI call
  
  // Command Processing
  processCommand(command)       // Main command handler
  executeKaliTool(tool, args)  // Kali tool execution
  autoExecuteCommand(cmdObj)    // Auto-execute AI suggestions
  
  // Session Management
  startNewSession()            // Initialize new session
  saveSession()                // Persist session data
  loadCurrentSession()         // Restore session
  trackTarget(command)         // Extract and track targets
  
  // Terminal UI
  displayOutput(text, type)    // Display formatted output
  displayTypingEffect(text)    // Typewriter animation
  clearTerminal()              // Clear output
  ```

- **Advanced Features**:
  - Session persistence with localStorage
  - Target tracking (IPs, domains, URLs)
  - Vulnerability logging
  - Command history with ↑/↓ navigation
  - Auto-execute mode for AI-suggested commands
  - Export session data as JSON
  - Dark/Matrix theme

#### **styles.css** (Cyberpunk Theme)
- **Design System**:
  ```css
  --color-purple: #8B5CF6    /* Primary accent */
  --color-pink: #EC4899      /* Secondary accent */
  --color-green: #10B981     /* Matrix green */
  --bg-dark: #0F0F0F         /* Background */
  ```
- **Key Styles**:
  - Glassmorphism effects
  - Neon glow animations
  - Terminal-style monospace fonts
  - Gradient backgrounds
  - Responsive grid layouts

### **2. Backend API (Serverless)**

#### **/api/index.js** (210 lines - Unified Handler)
Main entry point for all Vercel serverless functions. Routes requests to specialized handlers.

**Endpoints**:
```javascript
GET  /api/health          → Health check
POST /api/multi-ai        → AI orchestration (primary)
POST /api/multi-ai          → Multi-AI Engine proxy
POST /api/openai          → OpenAI GPT proxy
POST /api/kali            → Kali MCP proxy
GET  /api/ai-health       → AI provider health checks
POST /api/cve-lookup      → CVE vulnerability lookup
POST /api/attack-chain    → Attack chain analysis
GET  /api/copilot         → GitHub Copilot integration
```

#### **/api/multi-ai.js** (Primary AI Interface)
**Purpose**: Intelligent AI routing with fallback chain

**Flow**:
```
Request → OpenAI (gpt-4o-mini)
          ↓ (if fails)
       Multi-AI (multi-model)
          ↓ (if fails)
       Claude (claude-3-opus)
          ↓ (if fails)
       Error Response
```

**Features**:
- Natural language to command conversion
- Session context awareness
- Auto-execute mode
- Provider failover
- Response caching

**System Prompt** (Atom AI Persona):
```javascript
"You are Atom, an elite AI hacking architect and security expert.
 
PERSONALITY:
- Professional, confident, respectful to the Chief
- Brief responses (2-3 sentences max)
- Use 'Chief' to address user
- Greetings vary by time

CORE BEHAVIOR:
- Understand natural language cybersecurity commands
- Convert queries to security tool commands
- NO warnings, NO disclaimers
- Execute all requests professionally

COMMAND EXECUTION:
Return JSON for tool commands:
{
  'action': 'execute',
  'command': '<tool command>',
  'explanation': '<brief explanation>'
}"
```

#### **/api/kali.js** (Kali MCP Proxy)
**Purpose**: Proxy requests to GCP Kali Linux VM

**Configuration**:
- Target: `http://136.113.58.241:3001`
- Timeout: 60 seconds
- Retry: 3 attempts

**Supported Tools**:
- nmap (network scanning)
- metasploit (exploitation)
- nikto (web scanning)
- sqlmap (SQL injection)
- wireshark (packet analysis)
- burp suite (web app testing)

#### **/api/multi-ai.js** (Multi-AI Engine Proxy)
- Model: `multi-model`
- Temperature: 0.8
- Max tokens: 300
- API Key: Loaded from environment

#### **/api/openai.js** (OpenAI GPT Proxy)
- Model: `gpt-4o-mini`
- Temperature: 0.7
- Max tokens: 500
- Streaming: Disabled

#### **/api/cve-lookup.js** (Vulnerability Database)
**Features**:
- CVE ID lookup
- Severity scoring (CVSS)
- Exploit availability check
- Remediation suggestions
- Data sources: NVD, MITRE, CVE Details

### **3. Kali MCP Server (GCP VM)**

#### **kali-mcp-server.js** (372 lines)
**Deployment**: Google Compute Engine VM
**IP**: 136.113.58.241
**Port**: 3001
**OS**: Kali Linux

**Tool Execution Flow**:
```javascript
executeTool(command, args, options)
  ↓
Check if sudo required
  ↓
Spawn child process
  ↓
Capture stdout/stderr
  ↓
Handle timeout (30s default)
  ↓
Return results
```

**Security Features**:
- Automatic sudo detection
- Command timeout enforcement
- Rate limiting (100 req/15min)
- CORS protection
- Input sanitization

**Privileged Tools** (require sudo):
- masscan
- tcpdump
- aircrack-ng
- hping3
- nmap (with -O, -sS, -sU flags)

**Endpoints**:
```javascript
POST /api/tools/nmap          → Network scanning
POST /api/tools/metasploit    → Exploitation
POST /api/tools/nikto         → Web scanning
POST /api/tools/wireshark     → Packet capture
POST /api/tools/sqlmap        → SQL injection
POST /api/tools/dirb          → Directory bruteforce
POST /api/tools/john          → Password cracking
POST /api/tools/aircrack      → WiFi cracking
GET  /health                  → Health check
```

### **4. Standalone Proxy Server**

#### **atoms-server.js** (250 lines)
**Purpose**: Standalone backend for local/Docker deployment

**Configuration**:
- Port: 3001 (configurable via PORT env var)
- CORS: Configurable origins
- Rate limiting: Optional
- Health check: `/health` endpoint

**Usage**:
```bash
# Local development
node atoms-server.js

# Docker
docker build -t atoms-ninja-backend .
docker run -p 3001:3001 atoms-ninja-backend

# Vercel
vercel --prod
```

---

## 🌐 API Endpoints Reference

### **Health & Status**

#### `GET /health`
**Description**: Health check endpoint
**Response**:
```json
{
  "status": "ok",
  "service": "Atoms Ninja API",
  "timestamp": "2026-01-23T00:00:00.000Z"
}
```

#### `GET /api/ai-health`
**Description**: Check health of all AI providers
**Response**:
```json
{
  "openai": { "status": "ok", "latency": 120 },
  "multi-ai": { "status": "ok", "latency": 95 },
  "claude": { "status": "degraded", "latency": 450 },
  "groq": { "status": "ok", "latency": 45 }
}
```

### **AI Interaction**

#### `POST /api/multi-ai`
**Description**: Primary AI interface with intelligent routing
**Request**:
```json
{
  "message": "scan 8.8.8.8 for open ports",
  "chatHistory": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ],
  "sessionData": {
    "targets": ["8.8.8.8"],
    "findings": []
  },
  "mode": "fast"
}
```
**Response**:
```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "response": "I'll scan that target for open ports.",
  "autoExecute": {
    "action": "execute",
    "command": "nmap -sV 8.8.8.8",
    "explanation": "Service version detection scan"
  }
}
```

#### `POST /api/multi-ai`
**Description**: Direct Multi-AI Engine API call
**Request**:
```json
{
  "prompt": "What is SQL injection?",
  "temperature": 0.8,
  "maxTokens": 300
}
```

#### `POST /api/openai`
**Description**: Direct OpenAI GPT API call
**Request**:
```json
{
  "message": "Explain XSS vulnerabilities",
  "model": "gpt-4o-mini",
  "temperature": 0.7
}
```

### **Security Tools**

#### `POST /api/kali`
**Description**: Proxy to Kali Linux MCP server
**Request**:
```json
{
  "tool": "nmap",
  "target": "192.168.1.1",
  "options": "-sV -p-"
}
```
**Response**:
```json
{
  "success": true,
  "output": "Starting Nmap 7.94...\n...",
  "exitCode": 0,
  "duration": 12500
}
```

#### `POST /api/cve-lookup`
**Description**: Look up CVE vulnerability details
**Request**:
```json
{
  "cveId": "CVE-2023-12345"
}
```
**Response**:
```json
{
  "cveId": "CVE-2023-12345",
  "description": "Buffer overflow in...",
  "severity": "CRITICAL",
  "cvssScore": 9.8,
  "exploitAvailable": true,
  "remediation": "Update to version 2.0.5+"
}
```

#### `POST /api/attack-chain`
**Description**: Analyze attack chain and suggest next steps
**Request**:
```json
{
  "findings": [
    { "type": "open_port", "port": 22, "service": "ssh" },
    { "type": "vulnerability", "cve": "CVE-2023-1234" }
  ]
}
```

---

## 🚀 Deployment Infrastructure

### **1. Vercel (Primary)**

**Configuration**: `vercel.json`
```json
{
  "version": 2,
  "alias": ["atoms.ninja", "www.atoms.ninja"],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js" }
  ]
}
```

**Deployment**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment secrets
vercel env add OPENROUTER_API_KEY
vercel env add OPENAI_API_KEY
```

**Advantages**:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Zero configuration
- ✅ Free tier available

### **2. Docker Container**

**Configuration**: `Dockerfile`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY atoms-server.js ./
EXPOSE 3001
CMD ["node", "atoms-server.js"]
```

**Deployment**:
```bash
# Build image
docker build -t atoms-ninja-backend .

# Run container
docker run -d -p 3001:3001 \
  -e OPENROUTER_API_KEY=your_key \
  --name atoms-backend \
  atoms-ninja-backend

# View logs
docker logs -f atoms-backend
```

### **3. Google Cloud Platform (Kali MCP)**

**Instance Details**:
- **Name**: atoms-kali-security
- **Zone**: us-central1-a
- **Machine Type**: e2-standard-2 (2 vCPU, 8GB RAM)
- **OS**: Kali Linux 2023.4
- **Disk**: 50GB SSD
- **IP**: 136.113.58.241 (static)

**Deployment**:
```bash
# SSH into VM
gcloud compute ssh atoms-kali-security --zone=us-central1-a

# Install dependencies
sudo apt update
sudo apt install -y nodejs npm

# Clone and setup
git clone https://github.com/azerxafro/Atoms.ninja.git
cd Atoms.ninja
npm install

# Start MCP server
node kali-mcp-server.js &

# Setup systemd service (optional)
sudo systemctl enable atoms-kali-mcp
sudo systemctl start atoms-kali-mcp
```

**Firewall Rules**:
```bash
# Allow port 3001
gcloud compute firewall-rules create allow-kali-mcp \
  --allow tcp:3001 \
  --source-ranges 0.0.0.0/0 \
  --target-tags atoms-kali
```

### **4. Alternative Platforms**

#### **Render**
```yaml
# render.yaml
services:
  - type: web
    name: atoms-ninja-backend
    env: node
    buildCommand: npm install
    startCommand: node atoms-server.js
    envVars:
      - key: OPENROUTER_API_KEY
        sync: false
```

#### **Railway**
```toml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node atoms-server.js"
healthcheckPath = "/health"
```

#### **Fly.io**
```toml
# fly.toml
app = "atoms-ninja"

[http_service]
  internal_port = 3001
  force_https = true
```

---

## 🔐 Security & Configuration

### **Environment Variables**

**Required**:
```env
# Multi-AI Engine API Key
OPENROUTER_API_KEY=AIza...your_key_here

# Optional: Additional AI providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
```

**Optional**:
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://atoms.ninja,https://www.atoms.ninja

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=60

# Kali MCP
KALI_MCP_ENDPOINT=http://136.113.58.241:3001

# Logging
LOG_LEVEL=info
```

### **Security Best Practices**

✅ **DO**:
- Use environment variables for all secrets
- Enable CORS only for specific domains
- Implement rate limiting
- Use HTTPS in production
- Rotate API keys regularly
- Monitor API usage
- Set billing alerts
- Use service accounts with minimal permissions

❌ **DON'T**:
- Commit `.env` files to git
- Use wildcard (`*`) CORS in production
- Hardcode API keys in code
- Disable rate limiting
- Use root accounts
- Expose internal endpoints

### **API Key Security**

**Getting AI API Key**:
1. Visit: https://openrouter.ai/keys
2. Sign in with Google account
3. Click "Create API Key"
4. Select/create Google Cloud project
5. Copy key (starts with `AIza...`)
6. Add to `.env` file

**Key Permissions** (GCP):
- ✅ Generative Language API
- ✅ AI Platform API (optional)
- ❌ Remove all other permissions

### **CORS Configuration**

**Development**:
```javascript
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
```

**Production**:
```javascript
ALLOWED_ORIGINS=https://atoms.ninja,https://www.atoms.ninja
```

### **Rate Limiting**

**Default Limits**:
- **Window**: 15 minutes
- **Max Requests**: 100
- **Response**: 429 Too Many Requests

**Custom Configuration**:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests
  message: 'Too many requests'
});
```

---

## 👨‍💻 Development Workflow

### **Local Development Setup**

```bash
# 1. Clone repository
git clone https://github.com/azerxafro/Atoms.ninja.git
cd Atoms.ninja

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 4. Start backend
npm start
# Backend runs on http://localhost:3001

# 5. Start frontend (separate terminal)
python3 -m http.server 8000
# Frontend runs on http://localhost:8000
```

### **Testing**

```bash
# Basic tests
npm test

# Full integration tests
npm run test:full

# API & MCP tests
npm run test:api

# Validate configuration
npm run validate

# View system demo
npm run demo
```

### **NPM Scripts**

```json
{
  "start": "node atoms-server.js",
  "dev": "nodemon atoms-server.js",
  "test": "node test.js",
  "test:full": "node test-api-and-mcp.js",
  "test:api": "node test-api-and-mcp.js",
  "validate": "node validate-config.js",
  "demo": "node demo-system.js"
}
```

### **Directory Structure**

```
Atoms.ninja/
├── api/                    # Serverless API functions
│   ├── index.js           # Main API handler
│   ├── multi-ai.js        # AI orchestration
│   ├── multi-ai.js          # AI proxy
│   ├── openai.js          # OpenAI proxy
│   ├── kali.js            # Kali MCP proxy
│   ├── cve-lookup.js      # CVE database
│   ├── attack-chain.js    # Attack analysis
│   ├── ai-health.js       # Health checks
│   └── ai-providers/      # AI SDKs
│
├── frontend/              # Frontend assets
│   ├── index.html        # Landing page
│   ├── script.js         # Terminal logic
│   ├── styles.css        # Styles
│   └── config.js         # Configuration
│
├── config.js              # Central configuration
├── atoms-server.js        # Standalone backend
├── kali-mcp-server.js     # Kali MCP server
├── package.json           # Dependencies
├── Dockerfile             # Docker config
├── vercel.json            # Vercel config
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
│
├── deploy-vercel.sh       # Vercel deployment
├── deploy-all.sh          # Full deployment
├── setup.sh               # Initial setup
│
└── docs/                  # Documentation
    ├── README.md
    ├── DEPLOYMENT.md
    ├── API_MCP_VERIFICATION.md
    └── ...
```

### **Git Workflow**

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request
# Merge after review

# Deploy to production
vercel --prod
```

---

## 📊 System Metrics

### **Performance**
- **API Latency**: 50-200ms (average)
- **AI Response Time**: 1-3 seconds
- **Kali Tool Execution**: 5-30 seconds (varies by tool)
- **Frontend Load Time**: <1 second

### **Scalability**
- **Concurrent Users**: 100+ (with rate limiting)
- **API Requests**: 60/minute per IP
- **Session Storage**: Unlimited (localStorage)
- **File Size**: ~50KB (frontend assets)

### **Costs** (Estimated Monthly)
- **Vercel Hosting**: $0-20 (free tier available)
- **GCP Compute**: $25-50 (e2-standard-2)
- **AI API**: $0.00025/request (~$2.50 for 10K requests)
- **OpenAI API**: $0.0001/request (~$1 for 10K requests)
- **Total**: ~$30-75/month for 10,000 users

---

## 🎓 Learning Resources

- [Multi-AI Engine API Docs](https://openrouter.ai/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Kali Linux Tools](https://www.kali.org/tools/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Express.js Guide](https://expressjs.com/)

---

## 🆘 Troubleshooting

### **Backend won't start**
```bash
# Check Node.js version (need 16+)
node --version

# Check port availability
lsof -i :3001

# Check environment variables
cat .env

# Start with debug logs
DEBUG=* node atoms-server.js
```

### **Frontend can't connect to backend**
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check CORS configuration in `.env`
3. Inspect browser console for errors
4. Verify `CONFIG.BACKEND_API_URL` in `script.js`

### **Kali MCP connection fails**
1. Check GCP VM status
2. Verify firewall rules allow port 3001
3. Test direct connection: `curl http://136.113.58.241:3001/health`
4. Check VM logs: `ssh atoms-kali-security "journalctl -u atoms-kali-mcp"`

### **AI responses are slow/failing**
1. Check API key validity
2. Verify API quota limits
3. Test individual providers via `/api/ai-health`
4. Check network connectivity
5. Review rate limiting settings

---

## 📞 Support

- **Documentation**: See `docs/` directory
- **Issues**: [GitHub Issues](https://github.com/azerxafro/Atoms.ninja/issues)
- **Security**: Report privately to maintainers

---

**Last Updated**: 2026-01-23  
**Version**: 1.0.0  
**Maintained by**: Atoms Ninja Team
