const fetch = globalThis.fetch || require("node-fetch");

const EC2_ENDPOINT = process.env.ATOMS_EC2_ENDPOINT || "";

// Execute a command on EC2 via the proxy — never locally
async function execOnEC2(command, args = [], timeout = 30000) {
  if (!EC2_ENDPOINT) {
    throw new Error("EC2 arsenal not connected (ATOMS_EC2_ENDPOINT not set)");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(`${EC2_ENDPOINT}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, args }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return { stdout: data.result || data.stdout || "" };
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

class ReconEngine {
  async findIP(domain) {
    try {
      const { stdout } = await execOnEC2("dig", ["+short", domain, "A"]);
      const ips = stdout.trim().split('\n').filter(ip => ip.match(/^\d+\.\d+\.\d+\.\d+$/));
      
      return {
        domain,
        cloudflare_ips: ips,
        is_proxied: await this.isCloudFlare(ips[0])
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async isCloudFlare(ip) {
    const cfRanges = ['173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', 
                      '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
                      '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22',
                      '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
                      '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'];
    
    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
    return cfRanges.some(range => this.ipInRange(ipNum, range));
  }

  ipInRange(ip, cidr) {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
    return (ip & mask) === (rangeNum & mask);
  }

  async bypassWAF(domain) {
    const methods = [];
    
    methods.push(this.checkCertTransparency(domain));
    methods.push(this.checkHistoricalDNS(domain));
    methods.push(this.enumerateSubdomains(domain));
    
    const results = await Promise.all(methods);
    return this.consolidateResults(results);
  }

  async checkCertTransparency(domain) {
    try {
      const { stdout } = await execOnEC2("curl", ["-s", `https://crt.sh/?q=%.${domain}&output=json`], 15000);
      const certs = JSON.parse(stdout);
      const subdomains = [...new Set(certs.map(c => c.name_value))];
      return { method: 'cert_transparency', subdomains: subdomains.slice(0, 10) };
    } catch {
      return { method: 'cert_transparency', subdomains: [] };
    }
  }

  async checkHistoricalDNS(domain) {
    try {
      const { stdout } = await execOnEC2("dig", [domain, "ANY", "+short"]);
      return { method: 'historical_dns', records: stdout.trim().split('\n') };
    } catch {
      return { method: 'historical_dns', records: [] };
    }
  }

  async enumerateSubdomains(domain) {
    const common = ['mail', 'ftp', 'admin', 'cpanel', 'direct', 'origin', 'dev', 'staging'];
    const results = [];
    
    for (const sub of common) {
      try {
        const { stdout } = await execOnEC2("dig", [`${sub}.${domain}`, "+short", "A"]);
        const ip = stdout.trim().split('\n')[0];
        if (ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          const isCF = await this.isCloudFlare(ip);
          if (!isCF) results.push({ subdomain: `${sub}.${domain}`, ip, bypassed: true });
        }
      } catch {}
    }
    
    return { method: 'subdomain_enum', bypassed_hosts: results };
  }

  consolidateResults(results) {
    return {
      timestamp: new Date().toISOString(),
      findings: results,
      real_ips: results.flatMap(r => r.bypassed_hosts || []).map(h => h.ip)
    };
  }
}

module.exports = ReconEngine;
