# Atoms Ninja - Production Deployment on Vercel

## 🌐 Live URLs

### Frontend (Main Application)
- **Production URL**: https://atoms-ninja.vercel.app
- **Latest Deployment**: https://atoms-ninja-frontend-evo19ud1d-achuashwin98-4594s-projects.vercel.app
- **Deployed**: 2025-11-03 01:17 UTC

### Backend (AI API Proxy)
- **Production URL**: https://atoms-dun.vercel.app
- **Endpoints**:
  - Health: https://atoms-dun.vercel.app/health
  - Multi-AI: https://atoms-dun.vercel.app/api/multi-ai

## 🎯 Architecture

```
User Browser
    ↓
[atoms-ninja.vercel.app]
    ↓
    ├─→ AI Questions → https://atoms-dun.vercel.app/api/multi-ai → Multi-AI Engine API
    └─→ Security Scans → http://<EC2_IP>:3001 → AWS EC2 Kali Instance
```

## ✅ Configuration

### Frontend (script.js)
```javascript
const CONFIG = {
    BACKEND_API_URL: 'https://atoms-dun.vercel.app',  // AI proxy
    KALI_MCP_ENDPOINT: 'http://<EC2_IP>:3001'   // AWS EC2 Kali Instance
};
```

### Backend (atoms-server.js)
- Environment Variable: `OPENROUTER_API_KEY` (set in Vercel dashboard)
- CORS: Allows all origins (production configuration)

## 🚀 How Users Interact

1. **Visit**: https://atoms-ninja.vercel.app
2. **Run Commands**:
   - `scan 8.8.8.8` → Real nmap scan via AWS EC2 Kali Instance
   - `What is SQL injection?` → AI response via Multi-AI
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
- Backend project needs: `OPENROUTER_API_KEY`
- Set at: https://vercel.com/dashboard → Project Settings → Environment Variables

## 🌍 Production vs Local

| Feature | Local Development | Production |
|---------|------------------|------------|
| Frontend | http://localhost:8000 | https://atoms-ninja.vercel.app |
| AI Backend | http://localhost:3001 | https://atoms-dun.vercel.app |
| Kali MCP | http://<EC2_IP>:3001 | http://<EC2_IP>:3001 |

## ⚠️ Important Notes

1. **EC2 instance must be running** - If scans fail, check AWS Console
2. **API key is secure** - Only in Vercel environment variables, never in code
3. **CORS enabled** - Backend accepts requests from any origin (configured for public use)
4. **HTTP for MCP** - EC2 instance uses HTTP (not HTTPS) on port 3001

## 🧪 Testing Production

```bash
# Test frontend
curl https://atoms-ninja.vercel.app

# Test AI backend
curl -X POST https://atoms-dun.vercel.app/api/multi-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "temperature": 0.7, "maxTokens": 20}'

# Test Kali MCP
curl http://<EC2_IP>:3001/health
```

## 📊 Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Logs**: View in Vercel Functions logs
- **Analytics**: Built-in Vercel Analytics

## 💰 Budget Policy

**Total Budget**: $100 over 3 months ($33/month)

| Resource | Instance | Monthly Cost |
|----------|----------|-------------|
| EC2 (Kali) | t3.small | ~$15-18 |
| EBS Volume | 20GB gp2 | ~$0 (free tier) |
| Elastic IP | 1 (attached) | $0 |
| Vercel | Free tier | $0 |
| AI APIs | Pay-per-use | ~$3-5 |
| **Total** | | **~$18-23** |

### Budget Alerts
```bash
# Set up budget alerts (run once)
bash scripts/setup-aws-budget.sh your-email@example.com

# Check current month spend
bash scripts/check-aws-costs.sh
```

**Alert thresholds**: $25 (75%), $30 (90%), $33 (100%), + forecast alert

⚠️ **Do NOT deploy** ALB, WAF, or dual instances without increasing the budget — they cost $25-55/mo alone.

