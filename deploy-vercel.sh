#!/bin/bash
set -e

echo "🚀 Deploying to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy backend
echo "📦 Deploying backend (gemini-proxy.js)..."
vercel --prod --yes

# Get the deployment URL
BACKEND_URL=$(vercel ls --prod | grep atoms-ninja-backend | head -1 | awk '{print $2}')

echo ""
echo "✅ Deployment complete!"
echo "🌐 Backend URL: https://$BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Update frontend to use backend URL: https://$BACKEND_URL"
echo "2. Deploy frontend from /frontend directory"
echo "3. Set environment variables in Vercel dashboard:"
echo "   - GEMINI_API_KEY"
echo "   - ALLOWED_ORIGINS"
