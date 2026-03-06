#!/bin/bash

echo "🥷 Atoms Ninja - Production Setup Script"
echo "========================================"
echo ""

# Check if service account JSON exists
if [ ! -f "service-account.json" ]; then
    echo "❌ Error: service-account.json not found!"
    echo ""
    echo "Please download your service account JSON file from:"
    echo "https://console.cloud.google.com/iam-admin/serviceaccounts"
    echo ""
    echo "Then place it in this directory as 'service-account.json'"
    exit 1
fi

echo "✅ Service account JSON found"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created - please edit it with your settings"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🚀 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and update ALLOWED_ORIGINS with your domain"
echo "2. Run 'npm start' to start the backend server"
echo "3. Open index.html in your browser or deploy it"
echo ""
echo "For deployment instructions, see DEPLOYMENT.md"
