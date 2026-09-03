# knuckls DB API — Docker on Unraid

## Build & Run on Unraid

1. **Copy files to Unraid**  
   Upload this `db-api/` folder to your Unraid server (or git clone the repo in the Unraid appdata dir).

2. **Build the Docker image**  
   On Unraid terminal or via Community Apps → Docker → Custom:
   ```bash
   cd /path/to/db-api
   docker build -t knuckls-db-api .
   ```

3. **Create the container**  
   ```bash
   docker run -d \
     --name knuckls-db-api \
     --restart unless-stopped \
     -p 10.15.34.65:5005:5000 \
     -e DB_HOST=10.15.34.65 \
     -e DB_PORT=3306 \
     -e DB_USER=knuckls_api \
     -e DB_PASS=knuckls2026 \
     -e DB_NAME=knuckls_site \
     -e API_KEY=knuckls2026 \
     knuckls-db-api
   ```
   This binds to Unraid's IP on port 5005 — only accessible inside your LAN.

4. **Verify**  
   ```bash
   curl http://10.15.34.65:5005/health
   # → {"ok": true, "service": "knuckls-db-api"}
   curl "http://10.15.34.65:5005/servers?key=knuckls2026"
   # → {"servers": [...]}
   ```

## Cloudflare Tunnel

Add this to your existing `config.yml` on the tunnel server:

```yaml
ingress:
  # existing rules...
  - hostname: api.knucklsgames.com
    service: http://10.15.34.65:5005
  # catch-all...
```

Then in Cloudflare Dashboard → DNS → add:
- Type: CNAME
- Name: api
- Target: knucklsgames.com (or your tunnel subdomain)
- Proxy: DNS Only (gray cloud)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `10.15.34.65` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `knuckls_api` | MySQL user |
| `DB_PASS` | `knuckls2026` | MySQL password |
| `DB_NAME` | `knuckls_site` | Database name |
| `API_KEY` | `knuckls2026` | Shared secret for Hostinger → API auth |
| `PORT` | `5000` | Container port |