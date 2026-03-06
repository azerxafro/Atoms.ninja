# 🐛 Debugging Guide - Command Execution Issue

## Issue Observed
The frontend shows AI responses but nmap commands aren't returning results to the UI.

## Root Cause
Backend has **Vercel deployment protection** enabled, blocking API requests.

## ✅ Solution: Disable Deployment Protection

### Step 1: Access Vercel Dashboard
1. Go to: https://vercel.com/achuashwin98-4594s-projects/atoms
2. Click on **Settings** (left sidebar)
3. Click on **Deployment Protection**

### Step 2: Disable Protection
Choose one of these options:

**Option A: Disable Completely (Recommended for testing)**
- Set "Deployment Protection" to **OFF**
- This allows public access to your API

**Option B: Add Vercel Authentication Bypass**
- Keep protection ON
- Add bypass token to frontend requests
- More secure but requires configuration

### Step 3: Test After Disabling
Open browser console (F12) and check for:
```
✅ Should see: 200 OK responses
❌ Currently seeing: 401/403 Authentication errors
```

## Alternative: Test Locally

While you configure Vercel, you can test locally:

### Start Local Backend
```bash
cd /Users/admin/atoms
npm start
```

### Open Frontend with Local Backend
The frontend automatically uses `localhost:3001` when running locally.

## Verify Backend Status

### Test Backend Health (will show auth page if protected)
```bash
curl https://atoms-gefv7hacq-achuashwin98-4594s-projects.vercel.app/health
```

### Test Kali MCP Direct (should work)
```bash
curl http://136.113.58.241:3001/api/tools/nmap \
  -H "Content-Type: application/json" \
  -d '{"target":"scanme.nmap.org","options":"-F"}'
```

## Quick Fix Commands

### Check Vercel Project Protection Status
```bash
vercel inspect atoms --prod
```

## Browser Console Debugging

Press **F12** in your browser, then check:

### Network Tab
Look for failed requests to:
- `/api/gemini` 
- `/api/kali/*`

### Console Tab
Look for errors like:
- `401 Unauthorized`
- `403 Forbidden`
- `CORS error`
- `Failed to fetch`

## Expected Flow

```
Frontend Request
    ↓
Backend (atoms-gefv7hacq...vercel.app)
    ↓
Kali MCP (136.113.58.241:3001)
    ↓
nmap execution
    ↓
Results back to frontend
```

## Current Status

✅ Frontend: Deployed and loading
✅ Kali MCP: Working (tested directly)
❌ Backend: Protected (needs auth bypass)
⚠️  Frontend → Backend: **BLOCKED**

## Next Steps

1. **Immediate**: Disable deployment protection on backend
2. **Verify**: Refresh frontend and try command again
3. **Monitor**: Watch browser console for errors
4. **Alternative**: Run backend locally for testing

## Support

If issues persist after disabling protection:

1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check `vercel logs` for backend errors
3. Verify environment variables are set
4. Check CORS configuration includes your frontend URL

---

**Quick Command Test (Direct to Kali MCP)**:
```bash
# This bypasses the backend completely
curl -X POST http://136.113.58.241:3001/api/execute \
  -H "Content-Type: application/json" \
  -d '{"command":"nmap","args":["-sV","scanme.nmap.org"]}'
```

This proves the infrastructure works - just need to disable backend protection!
