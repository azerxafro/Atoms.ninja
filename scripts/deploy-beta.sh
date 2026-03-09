#!/bin/bash

# Deploy beta.atoms.ninja to Vercel in preview environment

set -e

echo "=========================================="
echo "Deploying beta.atoms.ninja to Vercel"
echo "=========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (skip if already logged in)
echo "Checking Vercel authentication..."
vercel link --yes 2>/dev/null || true

# Deploy to preview with custom domain
echo "Deploying to preview environment..."

# Use the beta.vercel.json configuration
vercel deploy --config=beta.vercel.json --yes --preview

# Get the deployment URL
DEPLOYMENT_URL=$(vercel --config=beta.vercel.json ls 2>/dev/null | grep "preview" | head -1 | awk '{print $NF}')

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo "Preview URL: $DEPLOYMENT_URL"
echo "Custom Domain: beta.atoms.ninja"
echo ""
echo "To assign the custom domain:"
echo "1. Go to Vercel Dashboard"
echo "2. Select the project"
echo "3. Go to Settings > Domains"
echo "4. Add 'beta.atoms.ninja'"
echo ""
echo "API Endpoints available:"
echo "  - /api/beta/mcp - MCP Server management"
echo "  - /api/beta/lab - Lab Sandbox management"
echo "  - /api/beta/train - Training session management"
echo "=========================================="
