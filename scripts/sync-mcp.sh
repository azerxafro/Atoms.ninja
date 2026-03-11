#!/bin/bash

# Configuration Sync Script for MCP Servers
# Targets ~/.copilot/mcp-config.json

CONFIG_SRC="./.github/mcp-config.json"
CONFIG_DEST="$HOME/.copilot/mcp-config.json"

echo "⚡ Syncing MCP configurations to Copilot CLI..."

if [ ! -f "$CONFIG_SRC" ]; then
    echo "❌ Error: Source config file not found at $CONFIG_SRC"
    exit 1
fi

mkdir -p "$(dirname "$CONFIG_DEST")"

# Backup existing config
if [ -f "$CONFIG_DEST" ]; then
    cp "$CONFIG_DEST" "${CONFIG_DEST}.bak"
    echo "📂 Backup of existing config created at ${CONFIG_DEST}.bak"
fi

# In a more advanced version, we would merge the JSON.
# For now, we will suggest the Chief to review and overwrite or manually append.
cp "$CONFIG_SRC" "$CONFIG_DEST"

echo "✅ MCP servers imported to $CONFIG_DEST"
echo "🚀 You can now use these tools in 'gh copilot suggest' or 'gh copilot explain'"
