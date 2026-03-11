# Technology Stack

## Programming Languages

### JavaScript/Node.js
- **Version**: Node.js 18.0.0+
- **Usage**: Backend server, API endpoints, frontend logic
- **Runtime**: Node.js for server, browser for frontend

### HTML5/CSS3
- **Usage**: Web interface, terminal UI, responsive design
- **Frameworks**: Vanilla HTML/CSS with custom neumorphic design

### Shell/Bash
- **Usage**: Deployment scripts, VM provisioning, tool installation
- **Environment**: Linux (Kali, Ubuntu)

## Core Dependencies

### Backend Framework
```json
"express": "^4.21.0"           // Web server framework
"cors": "^2.8.5"               // Cross-origin resource sharing
"express-rate-limit": "^7.5.0" // Rate limiting middleware
"dotenv": "^16.3.1"            // Environment variable management
```

### AI & Cloud Services
```json
"@aws-sdk/client-bedrock-runtime": "^3.600.0"  // AWS Bedrock integration
"googleapis": "^171.4.0"                       // Google APIs (Admin SDK)
"node-fetch": "^2.7.0"                         // HTTP client for AI APIs
```

### Analytics & Monitoring
```json
"@vercel/analytics": "^1.5.0"        // Vercel Analytics
"@vercel/speed-insights": "^1.2.0"   // Performance monitoring
```

### Development Tools
```json
"nodemon": "^3.0.2"  // Development auto-reload
```

## AI Providers

### Primary: Venice AI
- **Model**: Latest Venice models
- **Usage**: Primary AI inference
- **Endpoint**: Venice API
- **Authentication**: API key via environment variable

### Secondary: OpenRouter
- **Models**: DeepSeek, Llama, Qwen, Mistral
- **Usage**: Fallback AI provider
- **Endpoint**: OpenRouter API
- **Authentication**: API key via environment variable

### Google Gemini
- **Model**: Gemini 2.0 Flash
- **Usage**: Natural language processing
- **Integration**: Direct API calls
- **Authentication**: GEMINI_API_KEY

## Infrastructure

### Cloud Platforms

#### Vercel
- **Purpose**: Frontend hosting and serverless API
- **Features**: 
  - Automatic deployments from Git
  - Edge network CDN
  - Serverless functions
  - Environment variable management

#### Google Cloud Platform (GCP)
- **Service**: Compute Engine
- **Instance**: atoms-kali-security
- **Region**: us-central1
- **IP**: 136.113.58.241
- **OS**: Kali Linux
- **Purpose**: Security tool execution environment

### Service Accounts
- `gen-lang-client-0528385692-a54ea848daea.json` - Vertex AI
- `gen-lang-client-0528385692-8f8d2551426e.json` - Owner

## Security Tools (500+)

### Categories
- Network Scanning: nmap, masscan, hping3, zmap
- Vulnerability Assessment: nikto, openvas, lynis, nuclei
- Web Testing: sqlmap, dirb, gobuster, wfuzz, ffuf
- Password Cracking: john, hydra, hashcat, medusa
- Exploitation: metasploit, msfvenom, searchsploit
- Wireless: aircrack-ng, wifite, reaver, kismet
- Sniffing: tcpdump, wireshark, ettercap, bettercap
- OSINT: whois, dig, theHarvester, amass, subfinder
- Forensics: autopsy, volatility, foremost, binwalk
- Reverse Engineering: gdb, radare2, ghidra, objdump

## Development Commands

### Local Development
```bash
npm install              # Install dependencies
npm run start           # Start production server
npm run start:arsenal   # Start arsenal server
npm run dev             # Development mode with nodemon
npm run dev:arsenal     # Development arsenal mode
```

### Testing
```bash
npm test               # Basic API test
npm run test:full      # Full API and MCP test
npm run test:api       # API-only test
npm run validate       # Configuration validation
```

### Deployment
```bash
npm run fetch-ips      # Fetch IP ranges
npm run secure-sg      # Update security groups
npm run setup-waf      # Configure AWS WAF
npm run audit-ips      # Audit IP attribution
```

### Utility Scripts
```bash
bash scripts/deploy-vercel.sh      # Deploy to Vercel
bash scripts/deploy-mcp.sh         # Deploy MCP server
bash scripts/create-kali-vm.sh     # Create Kali VM
bash scripts/gcp-kali-setup.sh     # Setup Kali environment
bash scripts/install-kali-tools.sh # Install security tools
```

## Build System

### Vercel Build Configuration
- **Static Assets**: HTML, CSS, JS, images
- **Serverless Functions**: Node.js API endpoints
- **Build Command**: Automatic via vercel.json
- **Output**: Optimized static files + serverless functions

### Environment Variables Required
```
GEMINI_API_KEY          # Google Gemini API key
OPENROUTER_API_KEY      # OpenRouter API key
VENICE_API_KEY          # Venice AI API key
KALI_MCP_ENDPOINT       # Kali MCP server endpoint
PORT                    # Server port (default: 3001)
```

## API Endpoints

### Main Routes
- `POST /api/multi-ai` - AI chat with auto-execution
- `POST /api/openrouter` - Direct AI proxy
- `POST /api/kali` - Generic tool execution
- `POST /api/execute` - Whitelisted command execution
- `POST /api/execute-shell` - Chained command execution
- `GET /api/tools` - List available tools
- `GET /health` - Health check

### Tool-Specific Routes
- `POST /api/tools/nmap` - Nmap scanning
- `POST /api/tools/nikto` - Nikto web scanning
- `POST /api/tools/sqlmap` - SQL injection testing
- `POST /api/tools/hydra` - Password cracking
- `POST /api/tools/whois` - Domain lookup
- `POST /api/tools/dig` - DNS queries
- `POST /api/tools/searchsploit` - Exploit search
- `POST /api/tools/metasploit` - Metasploit commands

## Performance Optimizations

- Rate limiting: 200 requests per 15 minutes
- Request timeout: 120-600 seconds (tool-dependent)
- JSON payload limit: 10MB
- CORS caching: 86400 seconds
- Static asset caching via Vercel CDN
