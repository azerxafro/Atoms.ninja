# ═══════════════════════════════════════════════════════
# Atoms Ninja — Full Arsenal Docker Container
# Base: Kali Linux Rolling + Node.js 18 + 30+ Security Tools
# Ports: 3001 (atoms-server), 3002 (kali-mcp), 8080 (ZAP on-demand)
# ═══════════════════════════════════════════════════════

FROM kalilinux/kali-rolling

LABEL maintainer="Atoms Ninja Team"
LABEL description="Full cybersecurity arsenal: Kali tools + MCP servers + AI backend"

ENV DEBIAN_FRONTEND=noninteractive
ENV ATOMS_DOCKER=true

WORKDIR /app

# ─── System Dependencies + Kali Tools ─────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    curl wget git unzip jq tar gzip ca-certificates gnupg lsb-release \
    # Network scanning
    nmap masscan hping3 \
    # Vulnerability scanning
    nikto sslscan \
    # Web testing
    sqlmap dirb gobuster \
    # Password cracking
    hydra john \
    # Wireless
    aircrack-ng \
    # Network analysis
    tcpdump tshark netcat-openbsd \
    # Information gathering
    whois dnsutils amass theharvester sublist3r \
    # Web fingerprinting
    whatweb wpscan \
    # Exploit database
    exploitdb \
    # SMB enumeration
    enum4linux \
    # Forensics
    foremost \
    # OWASP ZAP (on-demand daemon)
    zaproxy \
    # Metasploit framework
    metasploit-framework \
    # Python ecosystem
    python3 python3-pip python3-venv \
    # Build essentials (for compiled tools)
    build-essential libpcap-dev libssl-dev libffi-dev python3-dev \
    && rm -rf /var/lib/apt/lists/*

# ─── Node.js 18 + PM2 ─────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pm2

# ─── Python Security Tools ────────────────────────────
RUN pip3 install --break-system-packages --no-cache-dir \
    dirsearch \
    wfuzz \
    impacket \
    pwntools \
    dnstwist \
    shodan \
    censys \
    2>/dev/null || true

# ─── Sherlock (OSINT) ─────────────────────────────────
RUN cd /opt \
    && git clone --depth 1 https://github.com/sherlock-project/sherlock.git \
    && cd sherlock \
    && pip3 install --break-system-packages --no-cache-dir -r requirements.txt 2>/dev/null || true \
    && ln -sf /opt/sherlock/sherlock/sherlock.py /usr/local/bin/sherlock

# ─── Go Binary Tools (pre-built releases) ─────────────
RUN mkdir -p /opt/go-tools \
    # nuclei
    && cd /tmp \
    && wget -q "https://github.com/projectdiscovery/nuclei/releases/download/v3.3.7/nuclei_3.3.7_linux_amd64.zip" -O nuclei.zip \
    && unzip -o nuclei.zip -d nuclei_tmp 2>/dev/null && mv nuclei_tmp/nuclei /opt/go-tools/ && rm -rf nuclei.zip nuclei_tmp \
    # httpx
    && wget -q "https://github.com/projectdiscovery/httpx/releases/download/v1.6.9/httpx_1.6.9_linux_amd64.zip" -O httpx.zip \
    && unzip -o httpx.zip -d httpx_tmp 2>/dev/null && mv httpx_tmp/httpx /opt/go-tools/ && rm -rf httpx.zip httpx_tmp \
    # subfinder
    && wget -q "https://github.com/projectdiscovery/subfinder/releases/download/v2.6.7/subfinder_2.6.7_linux_amd64.zip" -O subfinder.zip \
    && unzip -o subfinder.zip -d subfinder_tmp 2>/dev/null && mv subfinder_tmp/subfinder /opt/go-tools/ && rm -rf subfinder.zip subfinder_tmp \
    # katana
    && wget -q "https://github.com/projectdiscovery/katana/releases/download/v1.1.0/katana_1.1.0_linux_amd64.zip" -O katana.zip \
    && unzip -o katana.zip -d katana_tmp 2>/dev/null && mv katana_tmp/katana /opt/go-tools/ && rm -rf katana.zip katana_tmp \
    # naabu
    && wget -q "https://github.com/projectdiscovery/naabu/releases/download/v2.3.3/naabu_2.3.3_linux_amd64.zip" -O naabu.zip \
    && unzip -o naabu.zip -d naabu_tmp 2>/dev/null && mv naabu_tmp/naabu /opt/go-tools/ && rm -rf naabu.zip naabu_tmp \
    # ffuf
    && wget -q "https://github.com/ffuf/ffuf/releases/download/v2.1.0/ffuf_2.1.0_linux_amd64.tar.gz" -O ffuf.tar.gz \
    && tar xzf ffuf.tar.gz -C /opt/go-tools/ ffuf && rm -f ffuf.tar.gz \
    && chmod +x /opt/go-tools/*

ENV PATH="/opt/go-tools:${PATH}"

# ─── Wordlists ────────────────────────────────────────
RUN mkdir -p /usr/share/wordlists \
    && cd /usr/share/wordlists \
    && git clone --depth 1 https://github.com/danielmiessler/SecLists.git 2>/dev/null || true \
    && wget -q "https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt" -O rockyou.txt 2>/dev/null || true

# ─── Application Setup ────────────────────────────────
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY atoms-server.js kali-mcp-server.js shared-config.js validate-config.js ./
COPY lib/ ./lib/
COPY api/ ./api/
COPY ecosystem.config.js ./
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create required directories
RUN mkdir -p /var/log/atoms /tmp/atoms-lab

# ─── Ports ─────────────────────────────────────────────
EXPOSE 3001 3002 8080

# ─── Health Check ──────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -sf http://localhost:3001/health || exit 1

# ─── Entrypoint ───────────────────────────────────────
ENTRYPOINT ["/entrypoint.sh"]

