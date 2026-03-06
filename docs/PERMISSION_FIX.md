# 🔐 GCP VM Setup - Permission Fix Guide

## Problem
Your service account `atoms-ninja@gen-lang-client-0528385692.iam.gserviceaccount.com` needs permissions to create VMs.

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Enable Required APIs

Open these links and click **"ENABLE"** on each:

1. **Service Usage API**
   ```
   https://console.developers.google.com/apis/api/serviceusage.googleapis.com/overview?project=267691095149
   ```

2. **Compute Engine API**
   ```
   https://console.cloud.google.com/apis/library/compute.googleapis.com?project=gen-lang-client-0528385692
   ```

3. **Cloud Monitoring API**
   ```
   https://console.cloud.google.com/apis/library/monitoring.googleapis.com?project=gen-lang-client-0528385692
   ```

### Step 2: Grant Service Account Permissions

**Option A: Use Console (Easiest)**

1. Go to IAM page:
   ```
   https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0528385692
   ```

2. Find this service account:
   ```
   atoms-ninja@gen-lang-client-0528385692.iam.gserviceaccount.com
   ```

3. Click the ✏️ (Edit) pencil icon

4. Click **"+ ADD ANOTHER ROLE"** and add these 3 roles:
   - `Compute Admin`
   - `Service Usage Admin`
   - `Monitoring Admin`

5. Click **SAVE**

**Option B: Use Command Line (If you have owner access)**

Open Cloud Shell at https://console.cloud.google.com/home/dashboard?project=gen-lang-client-0528385692 and run:

```bash
# Grant permissions
gcloud projects add-iam-policy-binding gen-lang-client-0528385692 \
    --member="serviceAccount:atoms-ninja@gen-lang-client-0528385692.iam.gserviceaccount.com" \
    --role="roles/compute.admin"

gcloud projects add-iam-policy-binding gen-lang-client-0528385692 \
    --member="serviceAccount:atoms-ninja@gen-lang-client-0528385692.iam.gserviceaccount.com" \
    --role="roles/serviceusage.serviceUsageAdmin"

gcloud projects add-iam-policy-binding gen-lang-client-0528385692 \
    --member="serviceAccount:atoms-ninja@gen-lang-client-0528385692.iam.gserviceaccount.com" \
    --role="roles/monitoring.admin"
```

---

## ✅ After Permissions Are Set

Come back here and run:

```bash
cd /Users/admin/atoms
bash create-vm-simple.sh
```

This will create:
- **VM Name:** atoms-kali-security
- **Machine:** e2-standard-4 (4 vCPU, 16GB RAM)
- **Disk:** 100GB SSD
- **Cost:** ~$120/month ✅ (under your $150 budget)
- **Tools:** All Kali Linux security tools
- **Monitoring:** Google Cloud Ops Agent enabled

---

## 💰 Cost Breakdown

| Resource | Specs | Monthly Cost |
|----------|-------|--------------|
| Compute | e2-standard-4 (4vCPU, 16GB) | ~$100 |
| Storage | 100GB SSD | ~$17 |
| Network | Egress | ~$3-5 |
| **TOTAL** | | **~$120/month** |

**Budget safety:** $120 < $150 ✅

---

## 🔗 Quick Links

- **IAM Console:** https://console.cloud.google.com/iam-admin/iam?project=gen-lang-client-0528385692
- **Compute Instances:** https://console.cloud.google.com/compute/instances?project=gen-lang-client-0528385692
- **APIs & Services:** https://console.cloud.google.com/apis/dashboard?project=gen-lang-client-0528385692
- **Billing:** https://console.cloud.google.com/billing?project=gen-lang-client-0528385692

---

## 🆘 Still Having Issues?

If you get permission errors, you might need to:
1. Make sure billing is enabled on the project
2. Use your main Google account (not service account) to grant permissions
3. Check if you're the project owner

**Set billing alerts manually:**
1. Go to: https://console.cloud.google.com/billing/
2. Click "Budgets & alerts"
3. Create budget: $150/month with alerts at 80%, 90%, 100%

---

Ready to create your VM once permissions are set! 🥷
