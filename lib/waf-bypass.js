/**
 * lib/waf-bypass.js — WAF Bypass & Origin-IP Discovery Engine
 *
 * Automated techniques to discover the real origin IP behind WAFs/CDNs.
 * All shell commands are executed locally on the EC2 instance.
 */

const { spawn } = require("child_process");
const dns = require("dns").promises;
const https = require("https");
const http = require("http");

// ═══════════════════════════════════════════════
//  Known CDN/WAF IP Ranges (CIDR prefixes)
// ═══════════════════════════════════════════════
const CDN_RANGES = {
  cloudflare: [
    "103.21.244.", "103.22.200.", "103.31.4.", "104.16.", "104.17.",
    "104.18.", "104.19.", "104.20.", "104.21.", "104.22.", "104.23.",
    "104.24.", "104.25.", "104.26.", "104.27.", "108.162.", "131.0.72.",
    "141.101.", "162.158.", "172.64.", "172.65.", "172.66.", "172.67.",
    "173.245.", "188.114.", "190.93.", "197.234.", "198.41.",
  ],
  aws_cloudfront: [
    "13.32.", "13.33.", "13.35.", "13.224.", "13.225.", "13.226.",
    "13.227.", "13.249.", "18.64.", "18.65.", "18.154.", "18.155.",
    "18.160.", "18.164.", "52.84.", "52.85.", "52.222.", "54.182.",
    "54.192.", "54.230.", "54.239.", "54.240.", "64.252.", "65.8.",
    "65.9.", "99.84.", "99.86.", "130.176.", "143.204.", "144.220.",
    "204.246.", "205.251.",
  ],
  akamai: [
    "23.0.", "23.1.", "23.2.", "23.3.", "23.4.", "23.5.", "23.6.",
    "23.32.", "23.33.", "23.34.", "23.35.", "23.36.", "23.37.",
    "23.38.", "23.39.", "23.40.", "23.41.", "23.42.", "23.43.",
    "23.44.", "23.45.", "23.46.", "23.47.", "23.48.", "23.49.",
    "23.50.", "23.51.", "23.52.", "23.53.", "23.54.", "23.55.",
    "23.56.", "23.57.", "23.58.", "23.59.", "23.60.", "23.61.",
    "23.62.", "23.63.", "23.64.", "23.65.", "23.66.", "23.67.",
    "23.192.", "23.193.", "23.194.", "23.195.", "23.196.", "23.197.",
    "23.198.", "23.199.", "23.200.", "23.201.", "23.202.", "23.203.",
    "23.204.", "23.205.", "23.206.", "23.207.",
  ],
  incapsula: ["107.154.", "45.64.64.", "192.230."],
  sucuri: ["192.88.134.", "185.93.228.", "185.93.229.", "185.93.230.", "185.93.231."],
  ddos_guard: ["186.2.160.", "186.2.161.", "186.2.162.", "186.2.163."],
};

// ═══════════════════════════════════════════════
//  Helper: Run shell command with timeout
// ═══════════════════════════════════════════════
function runCommand(command, args = [], timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, args, {
      env: {
        ...process.env,
        PATH: process.env.PATH + ":/usr/local/bin:/usr/bin:/usr/sbin",
      },
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ stdout, stderr, timedOut: true, code: -1 });
    }, timeoutMs);
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, timedOut: false, code: code || 0 });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: err.message, timedOut: false, code: -1 });
    });
  });
}

// ═══════════════════════════════════════════════
//  Technique 1: WAF Detection (wafw00f)
// ═══════════════════════════════════════════════
async function detectWAF(domain) {
  const result = { technique: "waf_detection", status: "running", data: {} };
  try {
    // Try wafw00f first
    const waf = await runCommand("wafw00f", [domain, "-o", "-"], 20000);
    if (waf.code === 0 && waf.stdout) {
      result.data.raw = waf.stdout;
      // Parse wafw00f output
      const wafMatch = waf.stdout.match(/is behind\s+(.+?)(?:\s+WAF|\s*$)/im);
      const noWafMatch = waf.stdout.match(/No WAF detected/i);
      if (wafMatch) {
        result.data.detected = true;
        result.data.vendor = wafMatch[1].trim();
      } else if (noWafMatch) {
        result.data.detected = false;
        result.data.vendor = null;
      }
    }

    // Also check HTTP headers for WAF signatures
    const curl = await runCommand("curl", [
      "-sI", "-m", "10", "--connect-timeout", "5",
      `https://${domain}`,
    ], 15000);
    if (curl.stdout) {
      result.data.headers = curl.stdout;
      const hdrs = curl.stdout.toLowerCase();
      if (hdrs.includes("cf-ray") || hdrs.includes("cloudflare")) {
        result.data.detected = true;
        result.data.vendor = result.data.vendor || "Cloudflare";
        result.data.cfRay = curl.stdout.match(/cf-ray:\s*(.+)/i)?.[1]?.trim();
      }
      if (hdrs.includes("x-sucuri") || hdrs.includes("sucuri")) {
        result.data.detected = true;
        result.data.vendor = result.data.vendor || "Sucuri";
      }
      if (hdrs.includes("x-akamai") || hdrs.includes("akamai")) {
        result.data.detected = true;
        result.data.vendor = result.data.vendor || "Akamai";
      }
      if (hdrs.includes("x-cdn") && hdrs.includes("incapsula")) {
        result.data.detected = true;
        result.data.vendor = result.data.vendor || "Imperva/Incapsula";
      }
      if (hdrs.includes("server: awselb") || hdrs.includes("x-amz-cf")) {
        result.data.detected = true;
        result.data.vendor = result.data.vendor || "AWS CloudFront/ALB";
      }
    }

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Technique 2: DNS Enumeration
// ═══════════════════════════════════════════════
async function enumerateDNS(domain) {
  const result = { technique: "dns_enumeration", status: "running", data: {} };
  try {
    const baseDomain = domain.replace(/^www\./, "");

    // 1. Full DNS records via dig
    const recordTypes = ["A", "AAAA", "MX", "NS", "TXT", "SOA", "CNAME"];
    const dnsResults = {};

    await Promise.all(
      recordTypes.map(async (type) => {
        const dig = await runCommand("dig", ["+short", baseDomain, type], 10000);
        if (dig.stdout.trim()) {
          dnsResults[type] = dig.stdout.trim().split("\n").filter(Boolean);
        }
      }),
    );
    result.data.records = dnsResults;

    // 2. Check common subdomains that might leak origin IP
    const leakSubdomains = [
      "direct", "origin", "origin-www", "direct-connect",
      "mail", "smtp", "pop", "imap", "webmail",
      "ftp", "cpanel", "webdisk", "whm",
      "dev", "staging", "stage", "test", "qa",
      "api", "backend", "admin", "panel",
      "old", "legacy", "backup",
    ];

    const subdomainIPs = {};
    await Promise.all(
      leakSubdomains.map(async (sub) => {
        try {
          const addrs = await dns.resolve4(`${sub}.${baseDomain}`);
          if (addrs.length > 0) {
            subdomainIPs[`${sub}.${baseDomain}`] = addrs;
          }
        } catch (e) { /* doesn't resolve */ }
      }),
    );
    result.data.subdomainIPs = subdomainIPs;

    // 3. MX records often reveal origin IP 
    if (dnsResults.MX) {
      const mxIPs = {};
      await Promise.all(
        dnsResults.MX.map(async (mx) => {
          const mxHost = mx.split(/\s+/).pop().replace(/\.$/, "");
          try {
            const addrs = await dns.resolve4(mxHost);
            mxIPs[mxHost] = addrs;
          } catch (e) { /* skip */ }
        }),
      );
      result.data.mxIPs = mxIPs;
    }

    // 4. SPF record may contain origin IP
    if (dnsResults.TXT) {
      const spf = dnsResults.TXT.find((t) => t.includes("v=spf1"));
      if (spf) {
        result.data.spf = spf;
        const ipMatches = spf.match(/ip[46]:([^\s]+)/g);
        if (ipMatches) {
          result.data.spfIPs = ipMatches.map((m) => m.replace(/^ip[46]:/, ""));
        }
      }
    }

    // 5. Try dnsrecon if available
    const dnsrecon = await runCommand("dnsrecon", ["-d", baseDomain, "-t", "std", "--json", "-"], 30000);
    if (dnsrecon.code === 0 && dnsrecon.stdout) {
      try {
        result.data.dnsrecon = JSON.parse(dnsrecon.stdout);
      } catch (e) {
        result.data.dnsreconRaw = dnsrecon.stdout.substring(0, 2000);
      }
    }

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Technique 3: Certificate Transparency Logs
// ═══════════════════════════════════════════════
async function certTransparency(domain) {
  const result = { technique: "cert_transparency", status: "running", data: {} };
  try {
    const baseDomain = domain.replace(/^www\./, "");

    // Query crt.sh for all certificates
    const crtsh = await runCommand("curl", [
      "-s", "-m", "15",
      `https://crt.sh/?q=%.${baseDomain}&output=json`,
    ], 20000);

    if (crtsh.stdout) {
      try {
        const certs = JSON.parse(crtsh.stdout);
        // Extract unique hostnames from certificates
        const hostnames = new Set();
        certs.forEach((cert) => {
          if (cert.name_value) {
            cert.name_value.split("\n").forEach((name) => {
              hostnames.add(name.trim().toLowerCase());
            });
          }
        });
        result.data.certCount = certs.length;
        result.data.hostnames = [...hostnames].slice(0, 100); // cap at 100

        // Resolve unique hostnames to find non-CDN IPs
        const resolvedIPs = {};
        const uniqueHosts = [...hostnames]
          .filter((h) => !h.startsWith("*"))
          .slice(0, 30); // resolve first 30

        await Promise.all(
          uniqueHosts.map(async (host) => {
            try {
              const addrs = await dns.resolve4(host);
              resolvedIPs[host] = addrs;
            } catch (e) { /* skip */ }
          }),
        );
        result.data.resolvedIPs = resolvedIPs;
      } catch (e) {
        result.data.crtshRaw = crtsh.stdout.substring(0, 2000);
      }
    }

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Technique 4: Historical DNS Records
// ═══════════════════════════════════════════════
async function historicalRecords(domain) {
  const result = { technique: "historical_records", status: "running", data: {} };
  try {
    const baseDomain = domain.replace(/^www\./, "");

    // ViewDNS.info history (HTML scrape — free, no API key)
    const viewdns = await runCommand("curl", [
      "-s", "-m", "15", "-A", "Mozilla/5.0",
      `https://viewdns.info/iphistory/?domain=${baseDomain}`,
    ], 20000);

    if (viewdns.stdout) {
      // Extract IPs from the HTML table
      const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
      const ips = [...new Set(viewdns.stdout.match(ipRegex) || [])];
      result.data.historicalIPs = ips;
    }

    // SecurityTrails (free tier — may fail without key)
    const st = await runCommand("curl", [
      "-s", "-m", "15", "-A", "Mozilla/5.0",
      `https://api.securitytrails.com/v1/history/${baseDomain}/dns/a`,
      "-H", `APIKEY: ${process.env.SECURITYTRAILS_API_KEY || ""}`,
    ], 20000);

    if (st.stdout) {
      try {
        const stData = JSON.parse(st.stdout);
        if (stData.records) {
          result.data.securityTrails = stData.records
            .map((r) => ({
              ip: r.values?.[0]?.ip,
              firstSeen: r.first_seen,
              lastSeen: r.last_seen,
            }))
            .filter((r) => r.ip)
            .slice(0, 20);
        }
      } catch (e) { /* not JSON */ }
    }

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Technique 5: Cloud/CDN IP Range Detection
// ═══════════════════════════════════════════════
function detectCDN(ip) {
  for (const [provider, prefixes] of Object.entries(CDN_RANGES)) {
    if (prefixes.some((prefix) => ip.startsWith(prefix))) {
      return provider;
    }
  }
  return null;
}

async function cloudDetect(domain, collectedIPs = []) {
  const result = { technique: "cloud_detection", status: "running", data: {} };
  try {
    // Resolve the domain's current IPs
    let currentIPs = [];
    try {
      currentIPs = await dns.resolve4(domain);
    } catch (e) { /* skip */ }

    const allIPs = [...new Set([...currentIPs, ...collectedIPs])];
    const analysis = {};

    for (const ip of allIPs) {
      const cdn = detectCDN(ip);
      analysis[ip] = {
        isCDN: !!cdn,
        provider: cdn,
        isPotentialOrigin: !cdn,
      };
    }

    result.data.currentIPs = currentIPs;
    result.data.analysis = analysis;
    result.data.originCandidates = allIPs.filter((ip) => !detectCDN(ip));

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Technique 6: Direct Origin Probe
// ═══════════════════════════════════════════════
async function directProbe(domain, candidateIPs = []) {
  const result = { technique: "direct_probe", status: "running", data: {} };
  try {
    const probeResults = {};

    for (const ip of candidateIPs.slice(0, 10)) {
      const probe = { ip, matchesOrigin: false };

      // Check if HTTPS on this IP serves the same domain's content
      const curl = await runCommand("curl", [
        "-sI", "-m", "5", "--connect-timeout", "3",
        "-k", // ignore cert errors
        "-H", `Host: ${domain}`,
        `https://${ip}`,
      ], 10000);

      if (curl.stdout) {
        probe.httpsStatus = curl.stdout.match(/HTTP\/\S+\s+(\d+)/)?.[1];
        probe.server = curl.stdout.match(/server:\s*(.+)/i)?.[1]?.trim();
        // If we get a 200/301/302, it likely serves traffic for this domain
        if (["200", "301", "302", "307", "308"].includes(probe.httpsStatus)) {
          probe.matchesOrigin = true;
        }
      }

      // Also check HTTP
      const curlHttp = await runCommand("curl", [
        "-sI", "-m", "5", "--connect-timeout", "3",
        "-H", `Host: ${domain}`,
        `http://${ip}`,
      ], 10000);

      if (curlHttp.stdout) {
        probe.httpStatus = curlHttp.stdout.match(/HTTP\/\S+\s+(\d+)/)?.[1];
        if (!probe.matchesOrigin && ["200", "301", "302"].includes(probe.httpStatus)) {
          probe.matchesOrigin = true;
        }
      }

      // Quick nmap scan for open web ports
      const nmap = await runCommand("nmap", ["-Pn", "-p", "80,443,8080,8443", "-T4", "--open", ip], 15000);
      if (nmap.stdout) {
        probe.openPorts = nmap.stdout.match(/(\d+)\/tcp\s+open/g)?.map((m) => m.split("/")[0]) || [];
      }

      probeResults[ip] = probe;
    }

    result.data.probes = probeResults;
    result.data.confirmedOrigins = Object.entries(probeResults)
      .filter(([_, p]) => p.matchesOrigin)
      .map(([ip]) => ip);

    result.status = "complete";
  } catch (e) {
    result.status = "error";
    result.data.error = e.message;
  }
  return result;
}

// ═══════════════════════════════════════════════
//  Master: Run Full WAF Bypass Discovery
// ═══════════════════════════════════════════════
async function runFullDiscovery(domain, techniques = ["all"]) {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const runAll = techniques.includes("all");
  const results = { domain: cleanDomain, startedAt: new Date().toISOString(), techniques: {} };
  const candidateIPs = new Set();

  // Step 1: WAF Detection
  if (runAll || techniques.includes("waf_detection")) {
    results.techniques.waf_detection = await detectWAF(cleanDomain);
  }

  // Step 2: DNS Enumeration
  if (runAll || techniques.includes("dns_enumeration")) {
    const dnsResult = await enumerateDNS(cleanDomain);
    results.techniques.dns_enumeration = dnsResult;
    // Collect candidate IPs from DNS
    if (dnsResult.data.subdomainIPs) {
      Object.values(dnsResult.data.subdomainIPs).flat().forEach((ip) => candidateIPs.add(ip));
    }
    if (dnsResult.data.mxIPs) {
      Object.values(dnsResult.data.mxIPs).flat().forEach((ip) => candidateIPs.add(ip));
    }
    if (dnsResult.data.spfIPs) {
      dnsResult.data.spfIPs.forEach((ip) => candidateIPs.add(ip));
    }
  }

  // Step 3: Certificate Transparency
  if (runAll || techniques.includes("cert_transparency")) {
    const certResult = await certTransparency(cleanDomain);
    results.techniques.cert_transparency = certResult;
    // Collect IPs from cert resolved hosts
    if (certResult.data.resolvedIPs) {
      Object.values(certResult.data.resolvedIPs).flat().forEach((ip) => candidateIPs.add(ip));
    }
  }

  // Step 4: Historical Records
  if (runAll || techniques.includes("historical_records")) {
    const histResult = await historicalRecords(cleanDomain);
    results.techniques.historical_records = histResult;
    if (histResult.data.historicalIPs) {
      histResult.data.historicalIPs.forEach((ip) => candidateIPs.add(ip));
    }
    if (histResult.data.securityTrails) {
      histResult.data.securityTrails.forEach((r) => candidateIPs.add(r.ip));
    }
  }

  // Step 5: Cloud/CDN Detection — filter out CDN IPs
  const allCandidates = [...candidateIPs];
  if (runAll || techniques.includes("cloud_detection")) {
    const cloudResult = await cloudDetect(cleanDomain, allCandidates);
    results.techniques.cloud_detection = cloudResult;
    // Only keep non-CDN IPs as origin candidates
    results.originCandidates = cloudResult.data.originCandidates || [];
  } else {
    results.originCandidates = allCandidates.filter((ip) => !detectCDN(ip));
  }

  // Step 6: Direct Probe on origin candidates
  if ((runAll || techniques.includes("direct_probe")) && results.originCandidates.length > 0) {
    const probeResult = await directProbe(cleanDomain, results.originCandidates);
    results.techniques.direct_probe = probeResult;
    results.confirmedOrigins = probeResult.data.confirmedOrigins || [];
  } else {
    results.confirmedOrigins = [];
  }

  results.completedAt = new Date().toISOString();

  // Build summary
  const wafData = results.techniques.waf_detection?.data;
  results.summary = {
    domain: cleanDomain,
    wafDetected: wafData?.detected || false,
    wafVendor: wafData?.vendor || "Unknown",
    totalCandidateIPs: results.originCandidates.length,
    confirmedOriginIPs: results.confirmedOrigins,
    confidence: results.confirmedOrigins.length > 0 ? "HIGH" : results.originCandidates.length > 0 ? "MEDIUM" : "LOW",
  };

  return results;
}

module.exports = {
  detectWAF,
  enumerateDNS,
  certTransparency,
  historicalRecords,
  cloudDetect,
  directProbe,
  runFullDiscovery,
  detectCDN,
};
