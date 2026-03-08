# 🌐 IP Attribution Configuration — atoms.ninja

> **Platform:** Vercel (serverless frontend/API) + AWS EC2 `us-east-1` (Kali MCP backend)
> **Managed via:** `ip-attribution.json` at the repo root

---

## Architecture: Who Connects to What

```
Internet Users
      │
      ▼
Vercel (atoms-ninja.vercel.app / atoms-dun.vercel.app)
      │
      ├─ /api/kali ──────────────────────────────────────────► EC2 :3001  (Kali MCP)
      │                                                         sg-0047128872be65558
      │                                                         34.202.47.138
      └─ /api/multi-ai ──────────────────────────────────────► Google Gemini API (external)

Admin (your IP)
      │
      └─ SSH :22 ────────────────────────────────────────────► EC2 :22
                                                               (admin IP only)

Tamil Nadu Govt / Police Network
      │
      └─ HTTPS :3001 ────────────────────────────────────────► EC2 :3001
                                                               (govt CIDRs only)
```

---

## IP Sources

| Component | IPv4 Source | Update Frequency |
|-----------|-------------|-----------------|
| Vercel Serverless | `https://ipx.vercel.sh/` | Weekly (dynamic) |
| AWS EC2 Ranges | `https://ip-ranges.amazonaws.com/ip-ranges.json` | Weekly |
| EC2 Elastic IP | `34.202.47.138` (static) | Only if instance replaced |
| GCP Kali VM | `136.113.58.241` (static) | Only if VM replaced |
| Admin SSH | Your IP (set in `ip-attribution.json`) | When admin IP changes |
| Govt / Police | Tamil Nadu network CIDRs | As needed |

---

## Security Group Rules (sg-0047128872be65558)

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 22 | TCP | `admin.ssh_source_ip` only | Admin SSH |
| 80 | TCP | `0.0.0.0/0` | HTTP → HTTPS redirect |
| 443 | TCP | `0.0.0.0/0` | Public HTTPS API |
| 3001 | TCP | Vercel IP ranges + Govt CIDRs | Kali MCP execution endpoint |

> **⚠️ The old rule allowing port 3001 from `0.0.0.0/0` must be removed.** Run the security group hardener to apply this.

---

## Quick Audit Runbook

### 1. Fetch Live IP Ranges
```bash
npm run fetch-ips
# Writes to ip-attribution.json
```

### 2. Configure Your Admin IP
Edit `ip-attribution.json`:
```json
"admin": {
  "ssh_source_ip": "YOUR_ACTUAL_IP/32"
}
```
Find your current IP: `curl https://ipinfo.io/ip`

### 3. Add Government / Police Network CIDRs
Edit `ip-attribution.json`:
```json
"government": {
  "ipv4_ranges": [
    "203.0.113.0/24",
    "198.51.100.0/24"
  ]
}
```

### 4. Preview Security Group Changes (Dry-run)
```bash
npm run secure-sg -- --dry-run
```

### 5. Apply Security Group Changes (Live)
```bash
npm run secure-sg -- --apply
```

### 6. Set Up AWS WAF (First time only)
```bash
npm run setup-waf -- --dry-run   # preview
npm run setup-waf -- --apply     # create WAF resources
```

---

## Update Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Refresh Vercel + AWS IP ranges | Weekly | `npm run fetch-ips` |
| Re-apply security group rules | After `fetch-ips` | `npm run secure-sg -- --apply` |
| Full audit (fetch + review) | Weekly | `npm run audit-ips` |
| WAF IP Set update | After `fetch-ips` | Re-run `npm run setup-waf -- --apply` |

---

## AWS WAF Configuration

The WAF Web ACL (`atoms-ninja-waf`) is set up with REGIONAL scope for future ALB / API Gateway attachment.

**Rules:**
1. **AllowVercelAndGovtIPs** (Priority 1) — Allowlist: Vercel ranges + Govt CIDRs → `Allow`
2. **RateLimitPerIP** (Priority 2) — 2,000 requests per 5 minutes per IP → `Block` if exceeded
3. **Default action** — `Allow` (protection focused on `/api/kali` + `/api/execute` via rules)

**To associate with an ALB** (after provisioning):
```bash
aws wafv2 associate-web-acl \
  --web-acl-arn "<ARN from ip-attribution.json waf.web_acl_arn>" \
  --resource-arn "<YOUR_ALB_ARN>" \
  --region us-east-1
```

> **Note:** Direct EC2 instances (without ALB/API GW) cannot be associated with WAF v2. Consider placing EC2 behind an ALB for full WAF coverage.

---

## Lockout Recovery

If you lose SSH access to the EC2 instance:

1. **AWS Console** → EC2 → Security Groups → `sg-0047128872be65558`
2. Add an inbound rule: TCP port 22 from your current IP
3. SSH in and verify your IP, then re-run `npm run secure-sg -- --apply`
4. Remove the manual rule added in step 2

Alternatively, use **EC2 Instance Connect** in the AWS Console (no SSH key required for browser-based access).

---

## Files Reference

| File | Purpose |
|------|---------|
| `ip-attribution.json` | Central IP config — edit admin + govt IPs here |
| `scripts/fetch-ip-ranges.sh` | Fetches Vercel + AWS IP ranges |
| `scripts/update-security-group.sh` | Applies EC2 security group rules |
| `scripts/setup-aws-waf.sh` | Provisions AWS WAF v2 Web ACL |

---

## Security Notes

- `ip-attribution.json` is **safe to commit** — it contains only public IP ranges and placeholders, no credentials
- All scripts default to **dry-run** mode — pass `--apply` to make live changes
- The `.aws-instance.env` file is in `.gitignore` — never commit AWS credentials
- Government IPs are stored locally only; never hardcode them in Vercel env vars
