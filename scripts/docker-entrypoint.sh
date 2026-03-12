#!/bin/bash
# ═══════════════════════════════════════════════════════
# Atoms Ninja — Docker Container Entrypoint
# Starts all services via PM2 inside the mega-container
# ═══════════════════════════════════════════════════════
set -e

echo "🛡️  Atoms Ninja Arsenal — Container Starting"
echo "   Node.js: $(node --version)"
echo "   PM2: $(pm2 --version 2>/dev/null || echo 'loading...')"
echo ""

# ─── Environment Setup ────────────────────────────
export PATH="/usr/local/go/bin:/root/.local/bin:/opt/go-tools:$PATH"
export ATOMS_DOCKER=true

# Create log directory
mkdir -p /var/log/atoms

# Create lab sandbox directory
mkdir -p /tmp/atoms-lab

# ─── Start PM2 Services ──────────────────────────
echo "══ Starting services via PM2 ══"
cd /app

# Load .env if mounted
if [ -f /app/.env ]; then
    echo "  ✅ Loading .env file"
    set -a && source /app/.env && set +a
fi

# Start all processes defined in ecosystem.config.js
pm2 start ecosystem.config.js --no-daemon &
PM2_PID=$!

# Wait for servers to boot
echo "  ⏳ Waiting for servers to initialize..."
sleep 3

# ─── Health Verification ─────────────────────────
echo ""
echo "══ Health Check ══"

# Check atoms-server
for i in $(seq 1 10); do
    if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
        echo "  ✅ atoms-server (port 3001) — ONLINE"
        break
    fi
    if [ "$i" -eq 10 ]; then
        echo "  ⚠️  atoms-server not responding yet (may still be starting)"
    fi
    sleep 2
done

# Check kali-mcp-server
for i in $(seq 1 10); do
    if curl -sf http://localhost:3002/health > /dev/null 2>&1; then
        echo "  ✅ kali-mcp-server (port 3002) — ONLINE"
        break
    fi
    if [ "$i" -eq 10 ]; then
        echo "  ⚠️  kali-mcp-server not responding yet (may still be starting)"
    fi
    sleep 2
done

# ─── Tool Audit ──────────────────────────────────
echo ""
echo "══ Arsenal Status ══"
INSTALLED=0
MISSING=0
for tool in nmap nikto sqlmap hydra john gobuster ffuf subfinder nuclei httpx \
  katana naabu tcpdump whois dig searchsploit whatweb tshark \
  wfuzz masscan hping3 msfconsole amass sublist3r sslscan foremost; do
    if command -v "$tool" &>/dev/null; then
        INSTALLED=$((INSTALLED+1))
    else
        echo "  ⚠️  Missing: $tool"
        MISSING=$((MISSING+1))
    fi
done
echo "  📊 Arsenal: $INSTALLED tools ready, $MISSING missing"

# ─── Docker Socket Check (for Lab Sandbox) ───────
if [ -S /var/run/docker.sock ]; then
    echo "  ✅ Docker socket mounted — Lab sandbox available"
else
    echo "  ⚠️  No Docker socket — Lab sandbox disabled (mount with -v /var/run/docker.sock:/var/run/docker.sock)"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "🛡️  Atoms Ninja Arsenal — OPERATIONAL"
echo "   Main API:  http://0.0.0.0:3001"
echo "   Kali MCP:  http://0.0.0.0:3002"
echo "═══════════════════════════════════════════════"
echo ""

# Keep container alive by waiting on PM2
wait $PM2_PID
