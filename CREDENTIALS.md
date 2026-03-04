# Atoms Ninja - Credentials & Configuration

## GCP VM Instance
- **Name**: atoms-kali-security
- **IP Address**: 136.113.58.241
- **Region**: us-central1
- **Purpose**: Kali Linux MCP Server
- **Endpoint**: http://136.113.58.241:3001

## Service Accounts

### Owner Level (Full Access)
- **File**: gen-lang-client-0528385692-8f8d2551426e.json
- **Location**: /Users/admin/Downloads/
- **Project**: gen-lang-client-0528385692
- **Usage**: Primary service account for Atoms Ninja

### Vertex AI Express
- **File**: gen-lang-client-0528385692-a54ea848daea.json
- **Location**: /Users/admin/Downloads/
- **Project**: gen-lang-client-0528385692
- **Usage**: AI/ML operations

## API Keys

### Generative Language API
- **Key**: AIzaSyDzGlemhn-AEP5G8F0UrHuD6gWr97RV0YQ
- **Type**: Unrestricted
- **Purpose**: Google Gemini API access

## Configuration Files

### .env (Backend)
```env
PORT=3001
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
GEMINI_API_KEY=AIzaSyDzGlemhn-AEP5G8F0UrHuD6gWr97RV0YQ
KALI_MCP_ENDPOINT=http://136.113.58.241:3001
ALLOWED_ORIGINS=http://localhost:8000,https://atoms-ninja.vercel.app
RATE_LIMIT_MAX_REQUESTS=60
```

### config.js (Frontend)
- Backend API: http://localhost:3001 (dev) / https://atoms-dun.vercel.app (prod)
- Kali MCP: http://136.113.58.241:3001 (dev) / proxied (prod)

## Quick Start

```bash
# Copy service account
cp /Users/admin/Downloads/gen-lang-client-0528385692-8f8d2551426e.json ./service-account.json

# Install dependencies
npm install

# Start backend
npm start

# Open frontend
open index.html
```

## Testing Connections

```bash
# Test Gemini API
curl -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello"}'

# Test Kali MCP Server
curl http://136.113.58.241:3001/health
```

## Security Notes
- ⚠️ Never commit service-account.json or .env to Git
- ✅ Files are already in .gitignore
- 🔒 Rotate API keys regularly
- 🛡️ Use least privilege for service accounts in production

---
**Last Updated**: 2025-11-03
