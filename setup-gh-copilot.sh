#!/bin/bash
# Setup GitHub Copilot CLI on Kali Linux GCP VM

set -e

echo "🚀 Installing GitHub Copilot CLI on Kali Linux..."

# Install GitHub CLI
echo "📦 Installing GitHub CLI..."
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh -y

# Install Copilot extension
echo "🤖 Installing GitHub Copilot extension..."
gh extension install github/gh-copilot

echo "✅ GitHub Copilot CLI installed!"
echo ""
echo "Next steps:"
echo "1. Run: gh auth login"
echo "2. Run: gh copilot config"
echo "3. Test: gh copilot suggest 'scan for vulnerabilities on 192.168.1.1'"
echo ""
echo "Integration:"
echo "Our webapp will call: gh copilot suggest '<user query>'"
echo "Copilot will return the best command, then we execute it!"
