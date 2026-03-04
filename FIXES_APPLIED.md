# MCP Server and Deployment Fixes

## Issues Fixed

### 1. **Kali MCP Server (kali-mcp-server.js)**
- ✅ Removed duplicate route definitions for `/api/tools/john` and `/api/tools/hydra`
- ✅ Fixed `process.on('error')` → `childProcess.on('error')` in executeTool function
- ✅ Cleaned up duplicate wireless and password cracking endpoints
- ✅ Ensured consistent port usage (3001)

### 2. **Gemini Proxy Server (gemini-proxy.js)**
- ✅ Added AbortController for Kali MCP proxy timeouts
- ✅ Improved error handling with proper timeout detection
- ✅ Fixed fetch timeout issue (removed invalid `timeout` option, using AbortController instead)
- ✅ Added proper error catching for JSON parsing failures

### 3. **Deployment Scripts**
- ✅ Updated `deploy-mcp.sh` to use correct port (3001)
- ✅ Created `deploy-vercel.sh` for backend deployment
- ✅ Created `deploy-all.sh` for complete deployment automation
- ✅ Made all deployment scripts executable

### 4. **Vercel Configuration**
- ✅ Updated `vercel.json` with proper routing for API endpoints
- ✅ Created `.vercelignore` to exclude unnecessary files
- ✅ Fixed route patterns for better routing

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend  │────────>│  Gemini Proxy    │────────>│  Gemini API     │
│  (Vercel)   │         │  (Vercel)        │         │  (Google Cloud) │
└─────────────┘         └──────────────────┘         └─────────────────┘
                               │
                               │ Proxy
                               ▼
                        ┌──────────────────┐
                        │  Kali MCP Server │
                        │  (GCP VM)        │
                        └──────────────────┘
```

## Deployment Commands

### Quick Deploy Backend
```bash
cd /Users/admin/atoms
./deploy-vercel.sh
```

### Deploy Kali MCP to GCP
```bash
cd /Users/admin/atoms
./deploy-mcp.sh
```

### Complete Deployment (All Services)
```bash
cd /Users/admin/atoms
./deploy-all.sh
```

### Manual Vercel Deploy
```bash
# Backend
cd /Users/admin/atoms
vercel --prod

# Frontend
cd /Users/admin/atoms/frontend
vercel --prod
```

## Environment Variables Required

### Backend (Vercel)
```env
GEMINI_API_KEY=AIzaSy...
ALLOWED_ORIGINS=https://atoms.ninja,https://www.atoms.ninja
NODE_ENV=production
```

### Kali MCP Server (GCP)
```env
KALI_MCP_PORT=3001
NODE_ENV=production
LOG_LEVEL=info
```

## Testing Endpoints

### Backend Health Check
```bash
curl https://atoms-ninja-backend.vercel.app/health
```

### Kali MCP Health Check
```bash
curl http://136.113.58.241:3001/health
```

### Test Gemini API
```bash
curl -X POST https://atoms-ninja-backend.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Say hello","temperature":0.7,"maxTokens":50}'
```

### Test Kali Tool (via proxy)
```bash
curl -X POST https://atoms-ninja-backend.vercel.app/api/kali/tools/nmap \
  -H "Content-Type: application/json" \
  -d '{"target":"scanme.nmap.org","options":"-F"}'
```

## Server Ports

- **Gemini Proxy**: Port 3001 (local), HTTPS on Vercel
- **Kali MCP Server**: Port 3001 (GCP VM)
- **Frontend**: Static hosting on Vercel

## Files Modified

1. `/Users/admin/atoms/kali-mcp-server.js` - Fixed duplicate routes and error handling
2. `/Users/admin/atoms/gemini-proxy.js` - Fixed timeout handling and error catching
3. `/Users/admin/atoms/vercel.json` - Updated routing configuration
4. `/Users/admin/atoms/deploy-mcp.sh` - Fixed port configuration
5. Created `/Users/admin/atoms/.vercelignore` - Exclude unnecessary files
6. Created `/Users/admin/atoms/deploy-vercel.sh` - Backend deployment script
7. Created `/Users/admin/atoms/deploy-all.sh` - Complete deployment automation

## Next Steps

1. **Deploy Backend**: Run `./deploy-vercel.sh`
2. **Set Vercel Env Vars**: Add `GEMINI_API_KEY` in Vercel dashboard
3. **Deploy Frontend**: Navigate to `/frontend` and run `vercel --prod`
4. **Update Frontend Config**: Point frontend to new backend URL
5. **Optional: Deploy Kali MCP**: Run `./deploy-mcp.sh` if using GCP VM

## Troubleshooting

### Backend not responding
- Check Vercel deployment logs: `vercel logs`
- Verify environment variables are set
- Test health endpoint

### Kali MCP not accessible
- Check VM is running: `gcloud compute instances list`
- Check firewall rules allow port 3001
- SSH to VM and check logs: `pm2 logs kali-mcp`

### CORS errors
- Add frontend domain to `ALLOWED_ORIGINS` in Vercel env vars
- Redeploy backend after updating env vars

## Security Notes

- ✅ Rate limiting enabled (60 req/min)
- ✅ Command whitelist for Kali tools
- ✅ CORS properly configured
- ✅ Environment variables for secrets
- ⚠️  Remember to rotate API keys regularly
- ⚠️  Keep GCP VM updated with security patches
