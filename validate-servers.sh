#!/bin/bash
# Server Validation and Health Check Script

echo "🔍 Atoms Ninja - Server Health Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Checking $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected)"
        return 1
    fi
}

# Test local gemini-proxy
echo "📡 Testing Local Services"
echo "-------------------------"
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    check_endpoint "Local Backend (3001)" "http://localhost:3001/health" "200"
else
    echo -e "${YELLOW}⚠ Local backend not running on port 3001${NC}"
fi

echo ""

# Test Kali MCP on GCP
echo "🛡️  Testing Kali MCP Server"
echo "-------------------------"
check_endpoint "Kali MCP Health" "http://136.113.58.241:3001/health" "200"
check_endpoint "Kali MCP Tools List" "http://136.113.58.241:3001/api/tools" "200"

echo ""

# Test Vercel deployments (if provided)
if [ ! -z "$BACKEND_URL" ]; then
    echo "🌐 Testing Vercel Backend"
    echo "-------------------------"
    check_endpoint "Backend Health" "$BACKEND_URL/health" "200"
    echo ""
fi

if [ ! -z "$FRONTEND_URL" ]; then
    echo "🎨 Testing Vercel Frontend"
    echo "-------------------------"
    check_endpoint "Frontend" "$FRONTEND_URL" "200"
    echo ""
fi

# Syntax validation
echo "📝 Syntax Validation"
echo "-------------------"
echo -n "Validating kali-mcp-server.js... "
if node -c kali-mcp-server.js 2>/dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ SYNTAX ERROR${NC}"
fi

echo -n "Validating gemini-proxy.js... "
if node -c gemini-proxy.js 2>/dev/null; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ SYNTAX ERROR${NC}"
fi

echo ""
echo "✅ Health check complete!"
echo ""
echo "Usage for Vercel checks:"
echo "  BACKEND_URL=https://your-backend.vercel.app FRONTEND_URL=https://your-frontend.vercel.app ./validate-servers.sh"
