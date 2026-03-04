# Atoms Ninja - Current Production Setup

## ✅ Configuration Status (Updated: 2025-11-03)

### 1. Google Gemini API Backend
- **Status**: ✅ Running on port 3001
- **Endpoint**: http://localhost:3001/api/gemini
- **API Key**: Configured in .env file
- **Process**: Running (PID: 13502)
- **Test**: Working - responds to AI queries

### 2. Kali Linux MCP Server (GCP VM)
- **Status**: ✅ Running on GCP VM
- **Endpoint**: http://136.113.58.241:3001
- **Location**: Google Cloud Platform Virtual Machine
- **Features**: 
  - Nmap scanning
  - Network reconnaissance tools
  - Real Kali Linux environment
- **Test**: Working - successfully scans targets

### 3. Frontend Configuration
- **File**: script.js
- **Gemini Backend**: http://localhost:3001 (local dev) / https://atoms-dun.vercel.app (production)
- **MCP Endpoint**: http://136.113.58.241:3001 (GCP VM - ONLY)
- **Local MCP**: ❌ Disabled (not using localhost:3000)

## 🎯 How It Works

1. **User runs a scan command** (e.g., `scan 8.8.8.8`)
   - Frontend → GCP MCP Server (136.113.58.241:3001)
   - MCP runs real nmap on Kali Linux
   - Results → Frontend

2. **User asks an AI question** (e.g., "What is SQL injection?")
   - Frontend → Local Gemini Proxy (localhost:3001)
   - Proxy → Google Gemini API (with API key)
   - Response → Frontend

## 🚀 Running the Stack

```bash
# Start Gemini API Backend (localhost only)
cd /Users/admin/atoms
node gemini-proxy.js &

# GCP MCP Server runs automatically on the VM
# No local MCP server needed
```

## 📝 Configuration Files

- `.env` - Contains GEMINI_API_KEY
- `script.js` - Frontend configuration (KALI_MCP_ENDPOINT set to GCP)
- `config.js` - Legacy config (endpoint: 136.113.58.241:3001)

## 🔧 Maintenance

### Check Status
```bash
# Check Gemini backend
curl http://localhost:3001/health

# Check GCP MCP
curl http://136.113.58.241:3001/health
```

### Restart Backend
```bash
pkill -f gemini-proxy
cd /Users/admin/atoms && node gemini-proxy.js &
```

## ⚠️ Important Notes

1. **Never start local kali-mcp-server.js** - Only use GCP VM
2. **API Key is secret** - Never commit .env to git
3. **GCP VM must be running** - Check GCP console if scans fail
4. **Backend needed for AI** - Gemini proxy must run for AI features

