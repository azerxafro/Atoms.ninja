# Atoms Ninja - Service Account Setup Guide

## 🚀 Production Deployment with Service Account

This guide will help you deploy Atoms Ninja globally with your Google Cloud Service Account.

---

## 📋 Step 1: Prepare Service Account JSON

You mentioned you have the key: `e7b5cdd4430c80cd017cbe3fa19611214077c645`

You need the **full service account JSON file** which looks like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@project-id.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**To get this file:**
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Find your service account
3. Click ⋮ (three dots) → "Manage keys"
4. Click "Add Key" → "Create new key" → Choose "JSON"
5. Download the JSON file

---

## 🔧 Step 2: Backend Setup (Node.js Proxy Server)

### Local Development:

```bash
cd /Users/admin/atoms

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and configure
nano .env
```

**Add to `.env`:**
```env
PORT=3001
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
ALLOWED_ORIGINS=http://localhost:8000,https://your-production-domain.com
```

**Save your service account JSON:**
```bash
# Place your downloaded JSON file here
cp ~/Downloads/your-service-account.json ./service-account.json
```

**Start the backend:**
```bash
npm start
```

---

## 🌐 Step 3: Update Frontend to Use Proxy

The frontend will now call your backend instead of directly calling Google APIs.

---

## ☁️ Step 4: Deploy Backend (Choose One)

### Option A: Deploy to Vercel (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Create `vercel.json`:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "gemini-proxy.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "gemini-proxy.js"
    }
  ],
  "env": {
    "SERVICE_ACCOUNT_JSON": "@service-account-json"
  }
}
```

3. **Add service account as secret:**
```bash
vercel secrets add service-account-json "$(cat service-account.json)"
```

4. **Deploy:**
```bash
vercel --prod
```

### Option B: Deploy to Google Cloud Run

```bash
# Build and deploy
gcloud run deploy atoms-ninja-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account your-service-account@project.iam.gserviceaccount.com
```

### Option C: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Add environment variable: `GOOGLE_APPLICATION_CREDENTIALS` = (paste JSON content)
4. Deploy

### Option D: Deploy to Heroku

```bash
heroku create atoms-ninja-backend
heroku config:set SERVICE_ACCOUNT_JSON="$(cat service-account.json)"
git push heroku main
```

---

## 🌍 Step 5: Deploy Frontend (Static Site)

### Option A: Vercel
```bash
cd /Users/admin/atoms
vercel --prod
```

### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=.
```

### Option C: GitHub Pages
```bash
# Push to GitHub, enable Pages in repo settings
```

### Option D: Cloudflare Pages
- Connect your GitHub repo
- Deploy automatically

---

## 🔐 Security Checklist

- ✅ Never commit `service-account.json` to git (add to `.gitignore`)
- ✅ Set CORS to your specific domain (not `*`)
- ✅ Enable rate limiting
- ✅ Use HTTPS only in production
- ✅ Monitor API usage in Google Cloud Console
- ✅ Set up billing alerts
- ✅ Restrict service account permissions to minimum needed

---

## 🧪 Testing

**Test backend locally:**
```bash
curl -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"What is penetration testing?"}'
```

**Test health endpoint:**
```bash
curl http://localhost:3001/health
```

---

## 📊 Monitoring

- **Google Cloud Console:** https://console.cloud.google.com/apis/dashboard
- **Check API usage and quotas**
- **Set up alerts for high usage**

---

## 🆘 Troubleshooting

**Error: "Service account not found"**
- Verify service account exists in Google Cloud Console
- Check `GOOGLE_APPLICATION_CREDENTIALS` path

**Error: "Permission denied"**
- Ensure service account has "Generative Language API" enabled
- Grant role: `roles/ml.developer` or `roles/aiplatform.user`

**CORS errors:**
- Update `ALLOWED_ORIGINS` in `.env`
- Restart backend server

---

## 💰 Cost Estimation

With your service account:
- Gemini Pro API: ~$0.00025 per request
- Backend hosting: $0-$20/month (depending on platform)
- Global CDN: Free on most platforms

**Expected monthly cost for 10K users:** ~$5-30

---

Ready to deploy? Let me know which platform you prefer!
