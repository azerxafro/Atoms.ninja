# 🥷 Atoms Ninja - AI-Powered Cybersecurity Platform

**Production-ready cybersecurity platform** with Google Gemini AI Security Architect and Kali Linux tools integration.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🌟 Features

- **🤖 AI Security Architect** - Interactive cybersecurity consultant powered by Google Gemini
- **🐧 Kali Linux Tools** - 500+ penetration testing tools (nmap, metasploit, burp suite, wireshark)
- **🔒 Service Account Auth** - Production-ready with Google Cloud service accounts
- **💬 Interactive Terminal** - Real-time command execution with AI guidance
- **🌐 Global Deployment** - Ready for worldwide distribution
- **📊 Security Arsenal** - Vulnerability scanning, digital forensics, threat analysis

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Google Cloud Service Account with Generative Language API enabled
- Service account JSON key file

### 1. Get Your Service Account

1. Go to [Google Cloud Console - Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Select your project
3. Create or select a service account
4. Click ⋮ → "Manage keys" → "Add Key" → "Create new key" → "JSON"
5. Download the JSON file and save it as `service-account.json` in this directory

### 2. Enable Required APIs

```bash
gcloud services enable generativelanguage.googleapis.com
```

Or enable manually: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com

### 3. Setup & Run

```bash
# Run setup script
./setup.sh

# Or manual setup:
npm install
cp .env.example .env
# Edit .env with your settings

# Start backend server
npm start

# Open frontend
open index.html
```

The backend will run on `http://localhost:3001` and the frontend can be opened directly in your browser.

### 4. Verify Installation

```bash
# Validate configuration
npm run validate

# View system capabilities
npm run demo

# Run comprehensive tests (requires backend running)
npm run test:api
```

See [API_MCP_VERIFICATION.md](./API_MCP_VERIFICATION.md) for detailed verification guide.

---

## 📁 Project Structure

```
atoms/
├── index.html              # Frontend application
├── styles.css              # UI styling
├── script.js               # Frontend logic
├── config.js               # Configuration
├── gemini-proxy.js         # Backend proxy server (Node.js)
├── package.json            # Node.js dependencies
├── service-account.json    # Your service account key (DO NOT COMMIT)
├── .env                    # Environment variables (DO NOT COMMIT)
├── Dockerfile              # Docker configuration
├── DEPLOYMENT.md           # Deployment guide
└── README.md               # This file
```

---

## 🌐 Production Deployment

### Backend Deployment Options

#### Option 1: Vercel (Recommended)

```bash
npm i -g vercel
vercel secrets add service-account-json "$(cat service-account.json)"
vercel --prod
```

#### Option 2: Google Cloud Run

```bash
gcloud run deploy atoms-ninja-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option 3: Docker

```bash
docker build -t atoms-ninja-backend .
docker run -p 3001:3001 \
  -v $(pwd)/service-account.json:/app/service-account.json \
  atoms-ninja-backend
```

#### Option 4: Railway / Render / Fly.io

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Frontend Deployment

Deploy the static files (`index.html`, `styles.css`, `script.js`, `config.js`) to:

- **Vercel**: `vercel --prod`
- **Netlify**: `netlify deploy --prod`
- **Cloudflare Pages**: Connect GitHub repo
- **GitHub Pages**: Push to `gh-pages` branch
- **AWS S3 + CloudFront**: Upload to S3 bucket

**Important:** Update `CONFIG.BACKEND_API_URL` in `script.js` with your deployed backend URL.

---

## 💻 Usage Examples

### AI Security Consultant

```
→ Design a security architecture for a financial web application
→ What's the best approach for penetration testing?
→ Explain the OWASP Top 10 vulnerabilities
→ How should I secure a microservices infrastructure?
```

### Direct Commands

```bash
nmap -sV 192.168.1.1                    # Network scanning
scan target.com                         # Vulnerability scanning
metasploit                              # Exploitation framework
wireshark                               # Packet analysis
help                                    # Show all commands
```

---

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
PORT=3001
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
ALLOWED_ORIGINS=https://your-domain.com
RATE_LIMIT_MAX_REQUESTS=60
```

### Frontend Config (`script.js`)

```javascript
const CONFIG = {
    BACKEND_API_URL: 'https://your-backend-domain.com',
    KALI_MCP_ENDPOINT: 'http://localhost:3000'
};
```

---

## 🔐 Security Best Practices

- ✅ Never commit `service-account.json` or `.env` to version control
- ✅ Use environment variables for sensitive data
- ✅ Set CORS to your specific domains (not `*`)
- ✅ Enable rate limiting
- ✅ Use HTTPS in production
- ✅ Monitor API usage and set billing alerts
- ✅ Restrict service account permissions to minimum required
- ✅ Rotate service account keys regularly

---

## 📊 API Endpoints

### Backend Server

**POST** `/api/gemini`
```json
{
  "prompt": "Your security question or command",
  "temperature": 0.8,
  "maxTokens": 300
}
```

**GET** `/health`
```json
{
  "status": "ok",
  "service": "Atoms Ninja Gemini Proxy"
}
```

---

## 🐛 Troubleshooting

### Backend won't start

```bash
# Check Node.js version
node --version  # Should be 16+

# Check service account file
cat service-account.json | jq .

# Test manually
node gemini-proxy.js
```

### CORS errors

Update `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8000,https://your-domain.com
```

### Service account auth fails

```bash
# Verify API is enabled
gcloud services list --enabled | grep generativelanguage

# Test service account
gcloud auth activate-service-account --key-file=service-account.json
```

---

## 💰 Cost Estimation

- **Gemini Pro API**: ~$0.00025 per request
- **Backend hosting**: $0-20/month (Vercel free tier available)
- **Frontend hosting**: Free (most platforms)

**Estimated cost for 10,000 users/month**: $5-30

---

## 🧪 Development

```bash
# Install dev dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Validate configuration
npm run validate

# View system demonstration
npm run demo

# Run tests
npm test                # Basic tests
npm run test:full       # Full integration tests
npm run test:api        # API & MCP server tests

# Run frontend locally
python3 -m http.server 8000
# Open http://localhost:8000
```

---

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Step-by-step deployment instructions
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Kali Linux Tools](https://www.kali.org/tools/)
- [Service Account Guide](https://cloud.google.com/iam/docs/service-accounts)

---

## ⚖️ Legal & Ethics

**⚠️ IMPORTANT**: This tool is for **authorized security testing only**.

- Only test systems you own or have explicit written permission to test
- Unauthorized access to computer systems is illegal
- Users are responsible for compliance with all applicable laws
- Always follow responsible disclosure practices
- The developers assume no liability for misuse

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 🆘 Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: Open a GitHub issue
- **Security**: Report vulnerabilities privately

---

**Made with 💜 by Atoms Ninja Team**

*Defend. Analyze. Secure. Protect.*


## 🚀 Features

- **Kali Linux MCP Integration**: Access to 500+ penetration testing tools
- **AI-Powered Analysis**: Google Gemini AI for intelligent security insights
- **Interactive Terminal**: Real-time command execution and results
- **Digital Forensics**: Advanced tools for incident response
- **Automated Scanning**: Vulnerability detection and CVE identification
- **Professional Reports**: Comprehensive security assessment reports

## 📋 Prerequisites

1. **Google Gemini API Key (FREE)**
   - Visit: **https://aistudio.google.com/app/apikey**
   - Sign in with your Google account
   - Click "Create API Key"
   - Select your Google Cloud project (or create a new one)
   - Copy the API key (starts with "AIza...")
   - **Note**: The free tier includes generous limits for testing

2. **Kali Linux MCP Server** (optional for full functionality)
   - Install and run Kali Linux MCP server
   - Configure endpoint in `config.js`

## 🔧 Setup

### Step 1: Configure API Key

**Option A: Browser Console**
```javascript
configureGeminiAPI('your-api-key-here');
```

**Option B: Edit config.js**
```javascript
gemini: {
    apiKey: 'your-api-key-here',
    // ...
}
```

### Step 2: Open the Application

Simply open `index.html` in your browser or serve it with a local server:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

## 💻 Usage

### Available Commands

**Network Scanning:**
```bash
nmap -sV 192.168.1.1
scan 192.168.1.0/24
```

**Vulnerability Assessment:**
```bash
scan target.com for vulnerabilities
exploit CVE-2023-1234
```

**Penetration Testing:**
```bash
metasploit
msfconsole
use exploit/multi/handler
```

**Network Analysis:**
```bash
wireshark
burp suite
```

**Digital Forensics:**
```bash
forensic analysis
autopsy
volatility
```

**Natural Language (AI):**
```
Scan 192.168.1.1 for open ports and vulnerabilities
What are the best tools for web application testing?
How do I analyze a memory dump?
```

### Keyboard Shortcuts

- **Enter**: Execute command
- **↑/↓**: Navigate command history
- **Shift+Enter**: New line in input

## 🛡️ Security & Ethics

⚠️ **IMPORTANT**: This tool is for **authorized security testing only**.

- Only test systems you own or have explicit permission to test
- Unauthorized access to computer systems is illegal
- Use responsibly and ethically
- Follow responsible disclosure practices
- Comply with local laws and regulations

## 🔌 API Integration

### Google Gemini AI

The platform uses Google Gemini for:
- Natural language command interpretation
- Security analysis and insights
- Vulnerability remediation suggestions
- Report generation

### Kali Linux MCP Server

Configure your MCP server endpoint in `config.js`:
```javascript
kaliMCP: {
    endpoint: 'http://localhost:3000',
    // ...
}
```

## 🎨 Customization

### Theme
Edit `styles.css` to customize colors and appearance:
```css
:root {
    --color-purple: #8B5CF6;
    --color-pink: #EC4899;
    /* ... */
}
```

### Commands
Add custom commands in `script.js`:
```javascript
async function processCommand(command) {
    // Add your custom command logic
}
```

## 📚 Tools Included

- **nmap**: Network scanner
- **Metasploit**: Exploitation framework
- **Wireshark**: Network protocol analyzer
- **Burp Suite**: Web security testing
- **SQLMap**: SQL injection tool
- **Nikto**: Web server scanner
- **Aircrack-ng**: WiFi security
- **John the Ripper**: Password cracker
- **Hashcat**: Advanced password recovery
- **Autopsy**: Digital forensics
- **Volatility**: Memory forensics

## 🐛 Troubleshooting

**API Key Issues:**
- Verify your API key is correct
- Check API quota and billing
- Ensure network connectivity

**MCP Server Connection:**
- Verify server is running
- Check endpoint configuration
- Review CORS settings

**Terminal Not Responding:**
- Refresh the page
- Check browser console for errors
- Clear browser cache

## 📖 Resources

- [Kali Linux Documentation](https://www.kali.org/docs/)
- [Google Gemini AI](https://ai.google.dev/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Penetration Testing Execution Standard](http://www.pentest-standard.org/)

## ⚖️ Legal Disclaimer

This software is provided for educational and authorized testing purposes only. Users are responsible for compliance with all applicable laws. The developers assume no liability for misuse.

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and code of conduct.

---

**Made with 💜 by Atoms Ninja Team**

*Defend. Analyze. Secure. Protect.*
