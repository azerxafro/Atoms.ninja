const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ReconEngine {
  async findIP(domain) {
    try {
      const { stdout } = await execAsync(`dig +short ${domain} A`);
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
    
    // Method 1: Certificate Transparency
    methods.push(this.checkCertTransparency(domain));
    
    // Method 2: Historical DNS
    methods.push(this.checkHistoricalDNS(domain));
    
    // Method 3: Subdomain enumeration
    methods.push(this.enumerateSubdomains(domain));
    
    const results = await Promise.all(methods);
    return this.consolidateResults(results);
  }

  async checkCertTransparency(domain) {
    try {
      const { stdout } = await execAsync(`curl -s "https://crt.sh/?q=%.${domain}&output=json"`);
      const certs = JSON.parse(stdout);
      const subdomains = [...new Set(certs.map(c => c.name_value))];
      return { method: 'cert_transparency', subdomains: subdomains.slice(0, 10) };
    } catch {
      return { method: 'cert_transparency', subdomains: [] };
    }
  }

  async checkHistoricalDNS(domain) {
    try {
      const { stdout } = await execAsync(`dig ${domain} ANY +short`);
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
        const { stdout } = await execAsync(`dig ${sub}.${domain} +short A`);
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
