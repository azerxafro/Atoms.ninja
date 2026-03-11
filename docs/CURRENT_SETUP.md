# Atoms Ninja - Current Production Setup

## ✅ Configuration Status

### 1. Multi-AI Engine API Backend
- **Status**: ✅ Running on port 3001
- **Endpoint**: http://localhost:3001/api/multi-ai
- **API Key**: Configured in .env file
- **Test**: Working - responds to AI queries

### 2. Kali Linux MCP Server (AWS EC2)
- **Status**: ✅ Running on AWS EC2 Instance
- **Endpoint**: Set via `ATOMS_EC2_ENDPOINT` env var
- **Location**: AWS EC2 (Kali Linux)
- **Features**: 
  - Nmap scanning
  - Network reconnaissance tools
  - Real Kali Linux environment
- **Test**: Working - successfully scans targets

### 3. Frontend Configuration
- **File**: script.js
- **AI Backend**: http://localhost:3001 (local dev) / Vercel proxy (production)
- **MCP Endpoint**: Vercel proxy → EC2 (production) / localhost:3001 tunnel (local dev)
- **Local MCP**: ❌ Disabled (all execution routed to EC2)

## 🎯 How It Works

1. **User runs a scan command** (e.g., `scan 8.8.8.8`)
   - Frontend → Vercel API → EC2 Kali Instance
   - EC2 runs real nmap on Kali Linux
   - Results → Frontend

2. **User asks an AI question** (e.g., "What is SQL injection?")
   - Frontend → Vercel API / OpenRouter multi-modelxy
   - Proxy → Multi-AI Engine API (with API key)
   - Response → Frontend

## 🚀 Running the Stack

```bash
# Start AI API Backend (localhost only)
cd /Users/admin/atoms
node atoms-server.js &

# EC2 Kali MCP Server runs on the EC2 instance
# Set ATOMS_EC2_ENDPOINT in your environment
```

## 📝 Configuration Files

- `.env` - Contains OPENROUTER_API_KEY and ATOMS_EC2_ENDPOINT
- `script.js` - Frontend configuration (routes through Vercel proxy to EC2)
- `config.js` - Frontend config (dynamic, uses current origin)

## 🔧 Maintenance

### Check Status
```bash
# Check AI backend
curl http://localhost:3001/health

# Check EC2 MCP (replace with your EC2 IP)
curl http://<EC2_IP>:3001/health
```

### Restart Backend
```bash
cd /Users/admin/atoms && node atoms-server.js &
```

## ⚠️ Important Notes

1. **All tool execution runs on EC2** - Never execute locally
2. **API Key is secret** - Never commit .env to git
3. **EC2 instance must be running** - Check AWS Console if scans fail
4. **Backend needed for AI** - AI proxy must run for AI features

