# Atoms.ninja - System Architecture Diagram

## 📐 High-Level Architecture

```
                                    ATOMS.NINJA
                            AI-Powered Cybersecurity Platform
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐              ┌───────────────┐              ┌───────────────┐
│   FRONTEND    │              │   BACKEND     │              │   SECURITY    │
│   (Client)    │              │   (APIs)      │              │   (Tools)     │
└───────────────┘              └───────────────┘              └───────────────┘
```

---

## 🔷 Detailed Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 CLIENT LAYER                                │
│                            (User's Web Browser)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  INDEX.HTML - Landing Page & Terminal Interface                     │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐    │  │
│  │  │ Hero Section   │  │ Features       │  │ Interactive        │    │  │
│  │  │ • Animated     │  │ • AI Architect │  │ Terminal           │    │  │
│  │  │   Gradient     │  │ • Kali Tools   │  │ • Command Input    │    │  │
│  │  │ • CTA Buttons  │  │ • Security     │  │ • Output Display   │    │  │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  SCRIPT.JS - Application Logic (1,599 lines)                        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │  Core Systems                                               │   │  │
│  │  │  ├─ Session Management  → Track targets, findings, tools   │   │  │
│  │  │  ├─ Chat History       → Max 20 messages for context       │   │  │
│  │  │  ├─ Command History    → Terminal command recall           │   │  │
│  │  │  ├─ Auto-Execute       → AI command suggestions            │   │  │
│  │  │  └─ LocalStorage       → Persist session data              │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐   │  │
│  │  │  API Integration                                            │   │  │
│  │  │  ├─ callMultiAI()      → Primary AI endpoint               │   │  │
│  │  │  ├─ executeKaliTool()  → Security tool execution           │   │  │
│  │  │  ├─ lookupCVE()        → Vulnerability database            │   │  │
│  │  │  └─ analyzeAttackChain() → Attack path analysis            │   │  │
│  │  └─────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  STYLES.CSS - Cyberpunk Matrix Theme                                │  │
│  │  • Purple/Pink/Green color scheme                                   │  │
│  │  • Glassmorphism effects                                            │  │
│  │  • Neon glow animations                                             │  │
│  │  • Responsive grid layouts                                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                  HTTPS/TLS
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APPLICATION LAYER                                │
│                    (Vercel Serverless Functions - Edge Network)             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  /api/index.js - Unified API Router (210 lines)                     │  │
│  │                                                                      │  │
│  │  Request → CORS Check → Authentication → Rate Limit → Route         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                       │
│              ┌─────────────────────┼─────────────────────┐                 │
│              │                     │                     │                 │
│              ▼                     ▼                     ▼                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│  │  AI ENDPOINTS    │  │  TOOL ENDPOINTS  │  │ UTILITY ENDPOINTS│        │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘        │
│           │                     │                     │                    │
└───────────┼─────────────────────┼─────────────────────┼────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ AI LAYER          │   │ SECURITY LAYER    │   │ DATA LAYER        │
│                   │   │                   │   │                   │
│ ┌───────────────┐ │   │ ┌───────────────┐ │   │ ┌───────────────┐ │
│ │ /api/multi-ai │ │   │ │ /api/kali     │ │   │ │/api/cve-lookup│ │
│ │ ┌───────────┐ │ │   │ │               │ │   │ │               │ │
│ │ │ Try:      │ │ │   │ │  Proxy to:    │ │   │ │ Queries:      │ │
│ │ │ 1. OpenAI │ │ │   │ │  GCP Kali VM  │ │   │ │ • NVD DB      │ │
│ │ │ 2. Multi-AI │ │ │   │ │  136.113.     │ │   │ │ • MITRE       │ │
│ │ │ 3. Claude │ │ │   │ │   58.241:3001 │ │   │ │ • CVE Details │ │
│ │ │ 4. Groq   │ │ │   │ │               │ │   │ │               │ │
│ │ └───────────┘ │ │   │ │  Timeout: 60s │ │   │ │ Cache: 1hr    │ │
│ └───────────────┘ │   │ │  Retry: 3x    │ │   │ │               │ │
│                   │   │ └───────────────┘ │   │ └───────────────┘ │
│ ┌───────────────┐ │   │                   │   │                   │
│ │ /api/multi-ai   │ │   │ ┌───────────────┐ │   │ ┌───────────────┐ │
│ │ Model:        │ │   │ │/api/attack-   │ │   │ │/api/ai-health │ │
│ │ multi-model-   │ │   │ │  chain        │ │   │ │               │ │
│ │ flash         │ │   │ │               │ │   │ │ Monitors:     │ │
│ │ Temp: 0.8     │ │   │ │ Analyzes:     │ │   │ │ • OpenAI      │ │
│ └───────────────┘ │   │ │ • Findings    │ │   │ │ • Multi-AI      │ │
│                   │   │ │ • Vulnerabi-  │ │   │ │ • Claude      │ │
│ ┌───────────────┐ │   │ │   lities      │ │   │ │ • Groq        │ │
│ │ /api/openai   │ │   │ │ • Attack      │ │   │ │               │ │
│ │ Model:        │ │   │ │   vectors     │ │   │ │ Returns:      │ │
│ │ gpt-4o-mini   │ │   │ │               │ │   │ │ Status &      │ │
│ │ Temp: 0.7     │ │   │ │ Suggests:     │ │   │ │ Latency       │ │
│ └───────────────┘ │   │ │ • Next steps  │ │   │ └───────────────┘ │
└───────────────────┘   │ │ • Remediation │ │   └───────────────────┘
                        │ └───────────────┘ │
                        └───────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐│
│  │  AI PROVIDERS       │  │  SECURITY INFRA     │  │  DATABASES          ││
│  │                     │  │                     │  │                     ││
│  │  Multi-AI Engine      │  │  GCP Compute Engine │  │  NVD (CVE)          ││
│  │  • API Key Auth     │  │  VM Instance        │  │  MITRE ATT&CK       ││
│  │  • 60 req/min       │  │                     │  │  ExploitDB          ││
│  │  • $0.00025/req     │  │  atoms-kali-        │  │  CVE Details        ││
│  │                     │  │  security           │  │                     ││
│  │  OpenAI GPT         │  │                     │  │  GitHub Advisories  ││
│  │  • API Key Auth     │  │  IP: 136.113.58.241 │  │                     ││
│  │  • $0.0001/req      │  │  Port: 3001         │  │                     ││
│  │                     │  │  OS: Kali Linux     │  │                     ││
│  │  Anthropic Claude   │  │  CPU: 2 vCPU        │  │                     ││
│  │  • API Key Auth     │  │  RAM: 8GB           │  │                     ││
│  │  • $0.015/req       │  │  Disk: 50GB SSD     │  │                     ││
│  │                     │  │                     │  │                     ││
│  │  Groq               │  │  Tools Installed:   │  │                     ││
│  │  • API Key Auth     │  │  ├─ nmap            │  │                     ││
│  │  • Fast inference   │  │  ├─ metasploit      │  │                     ││
│  │                     │  │  ├─ nikto           │  │                     ││
│  └─────────────────────┘  │  ├─ sqlmap          │  └─────────────────────┘│
│                           │  ├─ wireshark       │                         │
│                           │  ├─ burp suite      │                         │
│                           │  ├─ john the ripper │                         │
│                           │  ├─ aircrack-ng     │                         │
│                           │  ├─ hashcat         │                         │
│                           │  └─ 490+ more tools │                         │
│                           │                     │                         │
│                           │  Systemd Service:   │                         │
│                           │  kali-mcp-server.js │                         │
│                           │  Auto-restart: yes  │                         │
│                           └─────────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

### **Scenario 1: AI Chat (No Tool Execution)**

```
User Types: "What is SQL injection?"
     │
     ▼
┌──────────────────────────┐
│  Frontend (script.js)    │
│  • Capture input         │
│  • Add to chat history   │
└──────────────────────────┘
     │
     │ POST /api/multi-ai
     │ {
     │   "message": "What is SQL injection?",
     │   "chatHistory": [...],
     │   "sessionData": {...}
     │ }
     ▼
┌──────────────────────────┐
│  Vercel Serverless       │
│  /api/index.js           │
│  • CORS check            │
│  • Route to multi-ai     │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  /api/multi-ai.js        │
│  • Build system prompt   │
│  • Add session context   │
└──────────────────────────┘
     │
     │ Try OpenAI first
     ▼
┌──────────────────────────┐
│  OpenAI GPT-4o-mini      │
│  • Process query         │
│  • Generate response     │
└──────────────────────────┘
     │
     │ Success!
     ▼
┌──────────────────────────┐
│  Response:               │
│  {                       │
│    "provider": "openai", │
│    "response": "SQL..."  │
│  }                       │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Frontend displays       │
│  • Typewriter effect     │
│  • Save to history       │
│  • Update session        │
└──────────────────────────┘
```

---

### **Scenario 2: Security Tool Execution**

```
User Types: "scan 8.8.8.8 for open ports"
     │
     ▼
┌──────────────────────────┐
│  Frontend (script.js)    │
│  • Track target 8.8.8.8  │
│  • Send to AI            │
└──────────────────────────┘
     │
     │ POST /api/multi-ai
     ▼
┌──────────────────────────┐
│  /api/multi-ai.js        │
│  • AI interprets command │
│  • Detects tool needed   │
└──────────────────────────┘
     │
     │ OpenAI returns:
     │ {
     │   "action": "execute",
     │   "command": "nmap -sV 8.8.8.8",
     │   "explanation": "Port scan"
     │ }
     ▼
┌──────────────────────────┐
│  Frontend receives       │
│  • Shows AI suggestion   │
│  • Auto-execute enabled? │
└──────────────────────────┘
     │
     │ User confirms / Auto-executes
     │ POST /api/kali
     │ {
     │   "tool": "nmap",
     │   "target": "8.8.8.8",
     │   "options": "-sV"
     │ }
     ▼
┌──────────────────────────┐
│  /api/kali.js (Proxy)    │
│  • Forward to GCP VM     │
│  • Timeout: 60s          │
│  • Retry: 3x             │
└──────────────────────────┘
     │
     │ HTTP POST to 136.113.58.241:3001
     ▼
┌──────────────────────────────────┐
│  GCP VM: kali-mcp-server.js      │
│  • Validate request              │
│  • Check if sudo needed          │
│  • Execute: sudo nmap -sV 8.8.8.8│
│  • Capture output                │
│  • Return results                │
└──────────────────────────────────┘
     │
     │ {
     │   "success": true,
     │   "output": "Starting Nmap...\n
     │              PORT   STATE SERVICE\n
     │              53/tcp open  domain\n
     │              ...",
     │   "exitCode": 0,
     │   "duration": 12500
     │ }
     ▼
┌──────────────────────────┐
│  /api/kali.js            │
│  • Receive results       │
│  • Format response       │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Frontend displays       │
│  • Terminal output       │
│  • Syntax highlighting   │
│  • Log to findings       │
│  • Update session        │
└──────────────────────────┘
     │
     │ User: "analyze these results"
     ▼
┌──────────────────────────┐
│  AI re-engages           │
│  • Receives scan output  │
│  • Analyzes findings     │
│  • Suggests next steps   │
└──────────────────────────┘
```

---

### **Scenario 3: CVE Vulnerability Lookup**

```
User Types: "lookup CVE-2023-12345"
     │
     ▼
Frontend → /api/multi-ai
     │
     ▼
AI detects CVE → Returns:
{
  "action": "lookup_cve",
  "cveId": "CVE-2023-12345"
}
     │
     ▼
Frontend → POST /api/cve-lookup
{
  "cveId": "CVE-2023-12345"
}
     │
     ▼
┌─────────────────────────────────┐
│  /api/cve-lookup.js             │
│  • Query NVD database           │
│  • Fetch CVSS score             │
│  • Check ExploitDB              │
│  • Get remediation info         │
└─────────────────────────────────┘
     │
     ▼
{
  "cveId": "CVE-2023-12345",
  "description": "Buffer overflow...",
  "cvssScore": 9.8,
  "severity": "CRITICAL",
  "exploitAvailable": true,
  "affectedVersions": "< 2.0.5",
  "remediation": "Update to 2.0.5+"
}
     │
     ▼
Frontend displays formatted CVE card
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: TRANSPORT SECURITY                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • TLS 1.3 (HTTPS)                                      │  │
│  │  • Certificate: Let's Encrypt (Auto-renew via Vercel)  │  │
│  │  • HSTS Enabled                                         │  │
│  │  • Secure Cookies (httpOnly, secure, sameSite)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 2: NETWORK SECURITY                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • CORS: Restricted origins only                        │  │
│  │  • Rate Limiting: 100 req/15min                         │  │
│  │  • DDoS Protection: Vercel Edge Network                 │  │
│  │  • Firewall: GCP VPC rules                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 3: AUTHENTICATION                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • API Keys: Environment variables                      │  │
│  │  • Service Accounts: Google Cloud IAM                   │  │
│  │  • No user authentication (public platform)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 4: INPUT VALIDATION                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Command sanitization                                 │  │
│  │  • IP/Domain validation                                 │  │
│  │  • Request size limits (10MB)                           │  │
│  │  • Timeout enforcement (60s)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 5: EXECUTION SECURITY                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Non-root execution (where possible)                  │  │
│  │  • Sudo only for specific tools                         │  │
│  │  • Process isolation                                    │  │
│  │  • Resource limits (CPU, memory, time)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Layer 6: DATA SECURITY                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • No persistent user data                              │  │
│  │  • LocalStorage only (client-side)                      │  │
│  │  • No database (stateless)                              │  │
│  │  • Logs: Sanitized, no sensitive data                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    SESSION DATA FLOW                           │
└────────────────────────────────────────────────────────────────┘

User Session Start
     │
     ▼
┌─────────────────────────┐
│  Initialize Session     │
│  • ID: timestamp        │
│  • Targets: Set()       │
│  • Findings: []         │
│  • Tools Used: Set()    │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Save to localStorage   │
│  Key: atomsNinjaSession │
└─────────────────────────┘
     │
     │ User executes commands
     ▼
┌─────────────────────────────────────────┐
│  Extract Data from Commands & Responses │
│  • IPs: regex match                     │
│  • Domains: regex match                 │
│  • Vulnerabilities: parse output        │
│  • Findings: log discoveries            │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Update Session Object  │
│  • Add targets          │
│  • Add findings         │
│  • Track tools          │
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  Persist to Storage     │
│  • Auto-save on change  │
│  • Serialize Sets       │
└─────────────────────────┘
     │
     │ User: "export session"
     ▼
┌─────────────────────────┐
│  Generate JSON Report   │
│  • Session metadata     │
│  • All targets          │
│  • All findings         │
│  • Recommendations      │
└─────────────────────────┘
     │
     ▼
Download session.json
```

---

## 🚀 Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT TOPOLOGY                           │
└────────────────────────────────────────────────────────────────┘

GitHub Repository
     │
     │ git push
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel CI/CD                                               │
│  • Detect push to main                                      │
│  • Build frontend (static assets)                           │
│  • Bundle /api functions                                    │
│  • Run tests                                                │
│  • Deploy to edge network                                   │
└─────────────────────────────────────────────────────────────┘
     │
     │ Deployed to:
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Vercel Edge Network (Global CDN)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  US East     │  │  EU West     │  │  Asia Pacific│     │
│  │  (Primary)   │  │  (Replica)   │  │  (Replica)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Static Assets: Cached at edge locations                   │
│  API Functions: Deployed to all regions                    │
│  Domain: atoms.ninja, www.atoms.ninja                      │
└─────────────────────────────────────────────────────────────┘
     │
     │ API calls to Kali tools
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Google Cloud Platform                                      │
│  Region: us-central1-a                                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Compute Engine VM                                    │ │
│  │  Name: atoms-kali-security                            │ │
│  │  IP: 136.113.58.241 (static)                          │ │
│  │  Machine: e2-standard-2                               │ │
│  │  OS: Kali Linux 2023.4                                │ │
│  │                                                       │ │
│  │  Running:                                             │ │
│  │  • node kali-mcp-server.js (systemd service)         │ │
│  │  • Port 3001 (open to internet)                      │ │
│  │  • Health check: /health endpoint                    │ │
│  │  • Auto-restart on failure                           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Alternative Deployment: Docker
     │
     │ docker build
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Docker Container                                           │
│  Image: node:18-alpine                                      │
│  Port: 3001                                                 │
│  Volume: /app                                               │
│                                                             │
│  Can deploy to:                                             │
│  • Docker Hub                                               │
│  • Google Cloud Run                                         │
│  • AWS ECS/Fargate                                          │
│  • Azure Container Instances                                │
│  • Railway, Render, Fly.io                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Scalability Model

```
Current Capacity:        Target Capacity:        Future Capacity:
                                
  100 users/day          1,000 users/day         10,000 users/day
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ Vercel Free │          │ Vercel Pro  │          │ Enterprise  │
│ • 100GB BW  │          │ • 1TB BW    │          │ • Custom    │
│ • 100 func  │          │ • 1000 func │          │ • Multi-CDN │
│   invokes/s │          │   invokes/s │          │ • 10K+ req/s│
└─────────────┘          └─────────────┘          └─────────────┘
       │                        │                        │
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│ GCP e2-std2 │          │ GCP e2-std4 │          │ GCP cluster │
│ • 2 vCPU    │          │ • 4 vCPU    │          │ • Auto-scale│
│ • 8GB RAM   │          │ • 16GB RAM  │          │ • Load bal  │
│ • 1 instance│          │ • 2-3 inst  │          │ • 10+ nodes │
└─────────────┘          └─────────────┘          └─────────────┘

Cost: $30-50/mo          Cost: $100-200/mo        Cost: $500+/mo
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-23  
**Maintained by**: Atoms Ninja Team
