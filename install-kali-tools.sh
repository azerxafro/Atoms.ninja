#!/bin/bash
# ═══════════════════════════════════════════════════════
# Atoms Ninja — Full Kali Arsenal Installer for Amazon Linux 2023
# Installs ALL major cybersecurity tools
# ═══════════════════════════════════════════════════════
set -e
ARCH=$(uname -m)
echo "🛡️  Atoms Ninja — Full Arsenal Installer"
echo "   Arch: $ARCH"
echo ""

# ─── System Dependencies ──────────────────────────────
echo "══ [1/8] System packages ══"
sudo yum install -y \
  tcpdump nmap whois bind-utils wget git gcc make \
  openssl-devel libpcap-devel libffi-devel python3-devel \
  python3-pip perl perl-Net-SSLeay \
  libxml2 libxml2-devel libxslt libxslt-devel \
  samba-client unzip jq tar gzip \
  2>&1 | grep -E "^(Complete|Nothing|Installed)" || true
echo "✅ System packages done"

# ─── Python Security Tools ────────────────────────────
echo ""
echo "══ [2/8] Python tools (sqlmap, theHarvester, wfuzz, impacket, etc) ══"
pip3 install --user --upgrade pip 2>&1 | tail -1
pip3 install --user \
  sqlmap \
  wfuzz \
  impacket \
  pwntools \
  dirsearch \
  shodan \
  censys \
  dnstwist \
  2>&1 | tail -3
echo "✅ Python tools done"

# ─── Nikto (Web Scanner) ──────────────────────────────
echo ""
echo "══ [3/8] Nikto ══"
if [ ! -f /usr/local/bin/nikto ]; then
  cd /tmp && rm -rf nikto
  git clone --depth 1 https://github.com/sullo/nikto.git 2>&1 | tail -1
  sudo cp -r nikto/program /opt/nikto
  sudo ln -sf /opt/nikto/nikto.pl /usr/local/bin/nikto
  echo "✅ nikto installed"
else
  echo "✅ nikto already installed"
fi

# ─── Hydra (Password Cracker) ─────────────────────────
echo ""
echo "══ [4/8] Hydra ══"
if ! command -v hydra &>/dev/null; then
  cd /tmp && rm -rf thc-hydra
  git clone --depth 1 https://github.com/vanhauser-thc/thc-hydra.git 2>&1 | tail -1
  cd thc-hydra && ./configure 2>&1 | tail -1 && make -j$(nproc) 2>&1 | tail -1
  sudo make install 2>&1 | tail -1
  echo "✅ hydra installed"
else
  echo "✅ hydra already installed"
fi

# ─── Go Binary Tools (pre-built releases) ─────────────
echo ""
echo "══ [5/8] Go tools (gobuster, ffuf, subfinder, nuclei, httpx, amass, katana) ══"
GOBIN=/usr/local/bin

# gobuster
if ! command -v gobuster &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/OJ/gobuster/releases/download/v3.6.0/gobuster_3.6.0_Linux_x86_64.tar.gz" -O gobuster.tar.gz
  tar xzf gobuster.tar.gz && sudo mv gobuster $GOBIN/ && rm -f gobuster.tar.gz
  echo "  ✅ gobuster"
fi

# ffuf
if ! command -v ffuf &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/ffuf/ffuf/releases/download/v2.1.0/ffuf_2.1.0_linux_amd64.tar.gz" -O ffuf.tar.gz
  tar xzf ffuf.tar.gz && sudo mv ffuf $GOBIN/ && rm -f ffuf.tar.gz
  echo "  ✅ ffuf"
fi

# subfinder
if ! command -v subfinder &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/projectdiscovery/subfinder/releases/download/v2.6.7/subfinder_2.6.7_linux_amd64.zip" -O subfinder.zip
  unzip -o subfinder.zip -d subfinder_tmp 2>/dev/null && sudo mv subfinder_tmp/subfinder $GOBIN/ && rm -rf subfinder.zip subfinder_tmp
  echo "  ✅ subfinder"
fi

# nuclei
if ! command -v nuclei &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/projectdiscovery/nuclei/releases/download/v3.3.7/nuclei_3.3.7_linux_amd64.zip" -O nuclei.zip
  unzip -o nuclei.zip -d nuclei_tmp 2>/dev/null && sudo mv nuclei_tmp/nuclei $GOBIN/ && rm -rf nuclei.zip nuclei_tmp
  echo "  ✅ nuclei"
fi

# httpx
if ! command -v httpx &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/projectdiscovery/httpx/releases/download/v1.6.9/httpx_1.6.9_linux_amd64.zip" -O httpx.zip
  unzip -o httpx.zip -d httpx_tmp 2>/dev/null && sudo mv httpx_tmp/httpx $GOBIN/ && rm -rf httpx.zip httpx_tmp
  echo "  ✅ httpx"
fi

# katana (web crawler)
if ! command -v katana &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/projectdiscovery/katana/releases/download/v1.1.0/katana_1.1.0_linux_amd64.zip" -O katana.zip
  unzip -o katana.zip -d katana_tmp 2>/dev/null && sudo mv katana_tmp/katana $GOBIN/ && rm -rf katana.zip katana_tmp
  echo "  ✅ katana"
fi

# naabu (port scanner)
if ! command -v naabu &>/dev/null; then
  cd /tmp
  wget -q "https://github.com/projectdiscovery/naabu/releases/download/v2.3.3/naabu_2.3.3_linux_amd64.zip" -O naabu.zip
  unzip -o naabu.zip -d naabu_tmp 2>/dev/null && sudo mv naabu_tmp/naabu $GOBIN/ && rm -rf naabu.zip naabu_tmp
  echo "  ✅ naabu"
fi

echo "✅ Go tools done"

# ─── John the Ripper ──────────────────────────────────
echo ""
echo "══ [6/8] John the Ripper ══"
if ! command -v john &>/dev/null; then
  cd /tmp && rm -rf john
  git clone --depth 1 https://github.com/openwall/john.git 2>&1 | tail -1
  cd john/src && ./configure 2>&1 | tail -1 && make -j$(nproc) 2>&1 | tail -1
  sudo cp ../run/john /usr/local/bin/
  sudo cp -r ../run /opt/john-run
  echo "✅ john installed"
else
  echo "✅ john already installed"
fi

# ─── Git-based Tools ──────────────────────────────────
echo ""
echo "══ [7/8] Git-based tools ══"

# WhatWeb
if ! command -v whatweb &>/dev/null; then
  echo "  📥 Installing whatweb..."
  sudo dnf install -y ruby ruby-devel libyaml-devel 2>&1 | tail -1
  cd /tmp && rm -rf WhatWeb
  git clone --depth 1 https://github.com/urbanadventurer/WhatWeb.git 2>&1 | tail -1
  cd WhatWeb
  sudo gem install bundler 2>&1 | tail -1
  sudo bundle install 2>&1 | tail -1
  sudo cp -R * /usr/local/bin/ || sudo cp whatweb /usr/local/bin/
  sudo mkdir -p /usr/local/share/whatweb
  sudo cp -R plugins lib my-plugins /usr/local/share/whatweb/ 2>/dev/null || true
  echo "  ✅ whatweb"
fi

# enum4linux
if [ ! -f /usr/local/bin/enum4linux ]; then
  cd /tmp && rm -rf enum4linux
  git clone --depth 1 https://github.com/CiscoCXSecurity/enum4linux.git 2>&1 | tail -1
  sudo cp enum4linux/enum4linux.pl /usr/local/bin/enum4linux
  sudo chmod +x /usr/local/bin/enum4linux
  echo "  ✅ enum4linux"
fi

# sherlock (OSINT username finder)
if [ ! -d /opt/sherlock ]; then
  cd /tmp && rm -rf sherlock
  git clone --depth 1 https://github.com/sherlock-project/sherlock.git 2>&1 | tail -1
  sudo mv sherlock /opt/sherlock
  cd /opt/sherlock && pip3 install --user -r requirements.txt 2>&1 | tail -1
  sudo ln -sf /opt/sherlock/sherlock/sherlock.py /usr/local/bin/sherlock
  echo "  ✅ sherlock"
fi

# SecLists (wordlists)
if [ ! -d /usr/share/wordlists/SecLists ]; then
  echo "  📥 Downloading SecLists wordlists (this takes a minute)..."
  sudo mkdir -p /usr/share/wordlists
  cd /usr/share/wordlists
  sudo git clone --depth 1 https://github.com/danielmiessler/SecLists.git 2>&1 | tail -1
  echo "  ✅ SecLists wordlists"
fi

# rockyou.txt
if [ ! -f /usr/share/wordlists/rockyou.txt ]; then
  cd /usr/share/wordlists
  sudo wget -q "https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt" -O rockyou.txt 2>/dev/null || true
  echo "  ✅ rockyou.txt"
fi

# ExploitDB / searchsploit
if ! command -v searchsploit &>/dev/null; then
  cd /tmp
  git clone --depth 1 https://gitlab.com/exploit-database/exploitdb.git 2>&1 | tail -1
  sudo mv exploitdb /opt/exploitdb
  sudo ln -sf /opt/exploitdb/searchsploit /usr/local/bin/searchsploit
  echo "  ✅ searchsploit"
fi

echo "✅ Git-based tools done"

# ─── PATH Setup ───────────────────────────────────────
echo ""
echo "══ [8/8] PATH + Configs ══"
# Ensure ~/.local/bin is in PATH for Python tools
grep -q '.local/bin' ~/.bashrc || echo 'export PATH=$HOME/.local/bin:$PATH' >> ~/.bashrc
echo "✅ PATH configured"

# ─── Final Audit ──────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════"
echo "🎯 TOOL AUDIT — What's installed:"
echo "═══════════════════════════════════════════════"
INSTALLED=0
MISSING=0
for tool in nmap nikto sqlmap hydra john gobuster ffuf subfinder nuclei httpx \
  katana naabu tcpdump whois dig nslookup searchsploit enum4linux whatweb \
  sherlock wfuzz curl wget python3 git; do
  if command -v $tool &>/dev/null; then
    echo "  ✅ $tool ($(which $tool))"
    INSTALLED=$((INSTALLED+1))
  elif [ -f /home/ec2-user/.local/bin/$tool ]; then
    echo "  ✅ $tool (~/.local/bin/$tool)"
    INSTALLED=$((INSTALLED+1))
  else
    echo "  ❌ $tool"
    MISSING=$((MISSING+1))
  fi
done
echo ""
echo "📊 Results: $INSTALLED installed, $MISSING missing"
echo "✅ Arsenal setup complete!"
