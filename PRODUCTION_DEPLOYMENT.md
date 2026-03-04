# Atoms Ninja - Production Deployment on Vercel

## 🌐 Live URLs

### Frontend (Main Application)
- **Production URL**: https://atoms-ninja.vercel.app
- **Latest Deployment**: https://atoms-ninja-frontend-evo19ud1d-achuashwin98-4594s-projects.vercel.app
- **Deployed**: 2025-11-03 01:17 UTC

### Backend (Gemini API Proxy)
- **Production URL**: https://atoms-dun.vercel.app
- **Endpoints**:
  - Health: https://atoms-dun.vercel.app/health
  - Gemini: https://atoms-dun.vercel.app/api/gemini

## 🎯 Architecture

```
User Browser
    ↓
[atoms-ninja.vercel.app]
    ↓
    ├─→ AI Questions → https://atoms-dun.vercel.app/api/gemini → Google Gemini API
    └─→ Security Scans → http://136.113.58.241:3001 → GCP Kali Linux VM
```

## ✅ Configuration

### Frontend (script.js)
```javascript
const CONFIG = {
    BACKEND_API_URL: 'https://atoms-dun.vercel.app',  // Gemini proxy
    KALI_MCP_ENDPOINT: 'http://136.113.58.241:3001'   // GCP Kali VM
};
```

### Backend (gemini-proxy.js)
- Environment Variable: `GEMINI_API_KEY` (set in Vercel dashboard)
- CORS: Allows all origins (production configuration)

## 🚀 How Users Interact

1. **Visit**: https://atoms-ninja.vercel.app
2. **Run Commands**:
   - `scan 8.8.8.8` → Real nmap scan via GCP Kali VM
   - `What is SQL injection?` → AI response via Gemini
3. **All processing happens server-side** - no API keys in browser

## 🔧 Deployment Process

### Deploy Frontend
```bash
cd /Users/admin/atoms/frontend
vercel --prod
```

### Deploy Backend
```bash
cd /Users/admin/atoms
vercel --prod --config vercel.json
```

### Environment Variables (Vercel Dashboard)
- Backend project needs: `GEMINI_API_KEY`
- Set at: https://vercel.com/dashboard → Project Settings → Environment Variables

## 🌍 Production vs Local

| Feature | Local Development | Production |
|---------|------------------|------------|
| Frontend | http://localhost:8000 | https://atoms-ninja.vercel.app |
| Gemini Backend | http://localhost:3001 | https://atoms-dun.vercel.app |
| Kali MCP | http://136.113.58.241:3001 | http://136.113.58.241:3001 |

## ⚠️ Important Notes

1. **GCP VM must be running** - If scans fail, check GCP Console
2. **API key is secure** - Only in Vercel environment variables, never in code
3. **CORS enabled** - Backend accepts requests from any origin (configured for public use)
4. **HTTP for MCP** - GCP VM uses HTTP (not HTTPS) on port 3001

## 🧪 Testing Production

```bash
# Test frontend
curl https://atoms-ninja.vercel.app

# Test Gemini backend
curl -X POST https://atoms-dun.vercel.app/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "temperature": 0.7, "maxTokens": 20}'

# Test Kali MCP
curl http://136.113.58.241:3001/health
```

## 📊 Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs**: View in Vercel Functions logs
- **Analytics**: Built-in Vercel Analytics

