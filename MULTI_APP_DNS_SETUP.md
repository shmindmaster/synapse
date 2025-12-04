# DNS Configuration Guide for Multi-App Deployment

## For use with 20+ applications on DigitalOcean App Platform

## Overview

All applications follow a standardized domain structure:

- **Frontend:** `https://[app-slug].shtrial.com`
- **Backend API:** `https://api.[app-slug].shtrial.com`
- **API Docs:** `https://api.[app-slug].shtrial.com/docs`
- **OpenAPI Spec:** `https://api.[app-slug].shtrial.com/openapi.json`

## DNS Architecture (DigitalOcean Managed)

DNS for `shtrial.com` is hosted on DigitalOcean, which provides:

- Single point of management alongside App Platform
- Automatic SSL certificate issuance via Let's Encrypt
- Fast DNS propagation (2-5 minutes)
- Easy integration with App Platform apps

### Nameservers

The domain uses DigitalOcean nameservers:

```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

### Record Types

For each app, create CNAME records pointing to App Platform's ingress:

```
[app-slug]              CNAME  origin-apps.ondigitalocean.com.
api.[app-slug]          CNAME  origin-apps.ondigitalocean.com.
```

## Automated DNS Setup

Use `scripts/setup-app-dns.ps1` to automatically create DNS records:

```powershell
# Using DigitalOcean API token
$env:DIGITALOCEAN_TOKEN = "your-do-token"
.\scripts\setup-app-dns.ps1 -AppSlug myapp

# Or if doctl is authenticated
.\scripts\setup-app-dns.ps1 -AppSlug myapp
```

The script will:

1. Check existing DNS records
2. Create frontend CNAME record (`myapp.shtrial.com`)
3. Create backend CNAME record (`api.myapp.shtrial.com`)
4. Provide verification commands

## Manual DNS Setup (DigitalOcean Dashboard)

### Steps:

1. Log into DigitalOcean: https://cloud.digitalocean.com/
2. Go to **Networking** → **Domains**
3. Select `shtrial.com`
4. Click **Add Record** and add:

   **Record 1 - Frontend**

   - Type: CNAME
   - Hostname: `[app-slug]`
   - Is an alias of: `origin-apps.ondigitalocean.com.`
   - TTL: 1800

   **Record 2 - Backend API**

   - Type: CNAME
   - Hostname: `api.[app-slug]`
   - Is an alias of: `origin-apps.ondigitalocean.com.`
   - TTL: 1800

5. Click **Create Record** for each

## Using doctl CLI

### List existing records

```bash
doctl compute domain records list shtrial.com
```

### Create frontend record

```bash
doctl compute domain records create shtrial.com \
  --record-name myapp \
  --record-type CNAME \
  --record-data origin-apps.ondigitalocean.com. \
  --record-ttl 1800
```

### Create backend record

```bash
doctl compute domain records create shtrial.com \
  --record-name api.myapp \
  --record-type CNAME \
  --record-data origin-apps.ondigitalocean.com. \
  --record-ttl 1800
```

### Delete a record

```bash
# First get the record ID
doctl compute domain records list shtrial.com

# Then delete by ID
doctl compute domain records delete shtrial.com [record-id]
```

## App Spec Domain Configuration

In your `do-app-spec.yaml`, domains are configured with the `zone` field for DigitalOcean-managed DNS:

```yaml
domains:
  - domain: myapp.shtrial.com
    type: PRIMARY
    zone: shtrial.com # DigitalOcean manages DNS
  - domain: api.myapp.shtrial.com
    type: ALIAS
    zone: shtrial.com
```

The `zone` field tells App Platform that DigitalOcean manages this domain's DNS.

## Monitoring & Verification

### Check DNS Propagation

```powershell
# Check specific record
nslookup myapp.shtrial.com
nslookup api.myapp.shtrial.com

# Check with Google DNS
nslookup myapp.shtrial.com 8.8.8.8

# Check with Cloudflare DNS
nslookup myapp.shtrial.com 1.1.1.1
```

### Verify App Platform Integration

```bash
# Check if app is accessible
curl -I https://myapp.shtrial.com
curl -I https://api.myapp.shtrial.com/health

# Check SSL certificate
openssl s_client -connect api.myapp.shtrial.com:443 -servername api.myapp.shtrial.com
```

### List All Domain Records

```bash
doctl compute domain records list shtrial.com --format ID,Name,Type,Data,TTL
```

## Troubleshooting

### DNS Not Resolving

1. Wait 2-5 minutes for DigitalOcean DNS propagation
2. Clear local DNS cache:

   ```powershell
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache

   # Linux
   sudo systemctl restart systemd-resolved
   ```

3. Try different nameserver:
   ```
   nslookup myapp.shtrial.com 8.8.8.8
   nslookup myapp.shtrial.com 1.1.1.1
   ```

### SSL Certificate Issues

1. Verify domain is added to App Platform spec with `zone` field
2. Check App Platform dashboard for certificate status
3. Ensure DNS records exist and resolve correctly
4. Wait up to 24 hours for Let's Encrypt to issue certificate (usually minutes)

### Connection Refused

1. Verify app is deployed: `doctl apps list`
2. Check app status: `doctl apps get <app-id>`
3. View deployment logs: `doctl apps logs get <app-id> --deployment-id <id>`
4. Check ingress rules in app spec

### Record Already Exists

If you get an error that a record already exists:

```bash
# List records to find the existing one
doctl compute domain records list shtrial.com | grep myapp

# Update or delete as needed
doctl compute domain records update shtrial.com [record-id] --record-data origin-apps.ondigitalocean.com.
```

## DNS Records Checklist for New App

For each new application deployment:

- [ ] App deployed to DigitalOcean App Platform
- [ ] Frontend CNAME record created in DigitalOcean DNS
- [ ] Backend CNAME record created in DigitalOcean DNS
- [ ] DNS records resolve correctly (test with nslookup)
- [ ] App health check passing
- [ ] SSL certificate issued (check app dashboard)
- [ ] Frontend accessible at `https://[app-slug].shtrial.com`
- [ ] Backend accessible at `https://api.[app-slug].shtrial.com`
- [ ] API docs accessible at `https://api.[app-slug].shtrial.com/docs`

## Reference

- [DigitalOcean DNS Documentation](https://docs.digitalocean.com/products/networking/dns/)
- [DigitalOcean App Platform Domains](https://docs.digitalocean.com/products/app-platform/how-to/manage-domains/)
- [doctl DNS Commands](https://docs.digitalocean.com/reference/doctl/reference/compute/domain/)
- [DNS Propagation Checker](https://www.whatsmydns.net/)
- [DigitalOcean Ingress Documentation](https://docs.digitalocean.com/products/app-platform/references/app-spec/#ingress)
