# API Key and MCP Server Verification Guide

This guide explains how to verify that your Atoms Ninja installation is properly configured with a working API key and MCP server.

## Quick Validation

Run the configuration validator to check all components:

```bash
npm run validate
```

This will check:
- ✅ API Key configuration
- ✅ MCP Server setup
- ✅ User task handling capability
- ✅ All required files and dependencies

## Detailed Testing

### 1. Validate Configuration

```bash
node validate-config.js
```

Expected output:
```
✅ System is properly configured!

🔑 API Key Configuration:      4/4
🛡️  MCP Server Configuration:   3/3
👤 User Task Handling:         3/3
📈 Overall Score: 10/10 (100%)
```

### 2. Test API and MCP Server (Requires Running Servers)

Start the backend server first:

```bash
npm start
```

In another terminal, run the comprehensive tests:

```bash
npm run test:api
```

This tests:
- API Key presence and format
- Backend health check
- Gemini API proxy functionality
- MCP Server health
- Command execution capability
- User task processing

### 3. Manual Testing

#### Test Backend Server

```bash
# Start the backend
npm start

# In another terminal, test health endpoint
curl http://localhost:3001/health

# Expected: {"status":"ok","service":"Atoms Ninja Gemini Proxy"}
```

#### Test Gemini API Endpoint

```bash
curl -X POST http://localhost:3001/api/gemini \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello",
    "temperature": 0.7,
    "maxTokens": 50
  }'
```

#### Test MCP Server

```bash
# Start MCP server (if running separately)
node kali-mcp-server.js

# Test health endpoint
curl http://localhost:3001/health

# Test tools listing
curl http://localhost:3001/api/tools
```

## Configuration Files

### API Key Configuration

The API key is configured in multiple places for redundancy:

1. **`.env.example`** (template)
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

2. **`config.js`** (default key)
   ```javascript
   GEMINI_API_KEY: 'd654e256baead3eaad49d56fded4718c3b4be7a9'
   ```

3. **Environment Variables** (runtime)
   ```bash
   export GEMINI_API_KEY=your-api-key-here
   ```

### MCP Server Configuration

The MCP server can be configured in two ways:

1. **Standalone Server** - Run `kali-mcp-server.js` separately
2. **Proxied** - Backend proxies requests to remote MCP server

Configuration in `config.js`:
```javascript
KALI_MCP_ENDPOINT: 'https://www.atoms.ninja/api/kali'
```

## Troubleshooting

### Issue: "API Key not found"

**Solution:**
1. Check `.env.example` file exists
2. Verify API key is set in environment or config.js
3. Run `npm run validate` to verify configuration

### Issue: "Backend not reachable"

**Solution:**
1. Ensure backend is running: `npm start`
2. Check port 3001 is not in use: `lsof -i :3001`
3. Verify no firewall blocking localhost connections

### Issue: "MCP Server not reachable"

**Solution:**
1. Start MCP server: `node kali-mcp-server.js`
2. Or ensure backend proxy is configured correctly
3. Check MCP endpoint in config.js

### Issue: "Gemini API returns error"

**Solution:**
1. Verify API key is valid: Visit https://aistudio.google.com/app/apikey
2. Check API quota and billing
3. Ensure network connectivity to Google APIs
4. Try updating to a newer API key

## User Task Examples

Once validated, you can test with these commands:

### AI Security Consultant
```
→ What are the OWASP Top 10 vulnerabilities?
→ Design a security architecture for my web app
→ How should I secure my API endpoints?
```

### Network Scanning
```
→ scan example.com
→ nmap -sV 192.168.1.1
→ Check open ports on my server
```

### Information Gathering
```
→ whois example.com
→ What tools can I use for reconnaissance?
→ Analyze security headers for example.com
```

## Verification Checklist

Before deploying, ensure:

- [x] ✅ API key is configured and valid
- [x] ✅ Backend server starts without errors
- [x] ✅ Health endpoint returns 200 OK
- [x] ✅ Gemini API proxy works correctly
- [x] ✅ MCP server is accessible
- [x] ✅ User commands can be processed
- [x] ✅ All dependencies installed
- [x] ✅ Configuration validation passes 100%

## Automated Validation

Add this to your CI/CD pipeline:

```yaml
# .github/workflows/validate.yml
name: Validate Configuration

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run validate
```

## Security Notes

- 🔒 Never commit API keys to version control
- 🔒 Use environment variables in production
- 🔒 Rotate API keys regularly
- 🔒 Monitor API usage and set billing alerts
- 🔒 Restrict CORS to specific domains
- 🔒 Enable rate limiting on all endpoints

## Support

If validation fails:
1. Review error messages from `npm run validate`
2. Check the troubleshooting section above
3. Verify all prerequisites are installed
4. Consult the main README.md for setup instructions

---

**Made with 💜 by Atoms Ninja Team**
