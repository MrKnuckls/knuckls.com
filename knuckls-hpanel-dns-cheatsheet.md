# knuckls.com — hPanel DNS Cheat-Sheet (live status feed)

GOAL: let knuckls.com (Hostinger WordPress) reach your home-lab status feed at
`https://status.knuckls.com/status.json`.

DNS is on Hostinger (hPanel) — NOT Cloudflare. So we add an A record in hPanel
pointing a subdomain at your home public IP, then serve HTTPS from the lab.

================================================================
PART 1 — Add the DNS record in hPanel
================================================================
1. Log into https://hpanel.hostinger.com/
2. Left menu →  Domains  →  knuckls.com
   (or  Websites → knuckls.com → Manage → Domains/DNS)
3. Open  DNS Zone / DNS Records  (the zone editor).
4. Click  Add Record  and enter:
     Type:     A
     Name:     status
     Points to: <YOUR HOME PUBLIC IP>      ← see Part 2
     TTL:      3600  (or default)
5. Save.
6. Propagation: usually a few minutes; up to 24h max. Check with:
     nslookup status.knuckls.com
   It should return your home IP once live.

================================================================
PART 2 — Give the lab a public address
================================================================
- STATIC IP: use it directly in the A record above.
- DYNAMIC IP (most home ISPs): use a free DDNS name instead:
    DuckDNS (duckdns.org) or No-IP (noip.com) → gives you e.g.
    knuckls.duckdns.org that auto-updates to your IP.
  Then in hPanel use a CNAME record instead of A:
     Type:  CNAME
     Name:  status
     Points to: knuckls.duckdns.org
  (Some Hostinger plans also let you point the A record at the DDNS and
   run the DDNS updater on the lab — pick whichever your plan allows.)

================================================================
PART 3 — Router port forward (home side)
================================================================
1. Log into your home router.
2. Port forward:
     External port: 8080   (or any you prefer)
     Internal IP:   <lab box LAN IP, e.g. 192.168.1.50>
     Internal port: 8080
     Protocol: TCP
3. The lab box runs knuckls_status.py (listens on :8080).

================================================================
PART 4 — TLS in front of the lab (required — WordPress is HTTPS)
================================================================
Browsers BLOCK mixed content, so the site can ONLY fetch https://.
Put a TLS terminator in front of :8080, e.g. Caddy:
   status.knuckls.com {
     reverse_proxy localhost:8080
   }
(Caddy auto-gets a Let's Encrypt cert.) Now
https://status.knuckls.com/status.json works.
Test from anywhere:  curl https://status.knuckls.com/status.json

================================================================
PART 5 — Point WordPress at it
================================================================
On the Servers page, open the "Live status" HTML widget (WIDGET 14 in
knuckls-servers-elementor.md) and set:
   const STATUS_URL = "https://status.knuckls.com/status.json";
Save. Green/red dots + player counts now update live every 30s.

================================================================
OPTION B — Skip the live feed (no lab exposure)
================================================================
If you don't want to expose the lab, just leave the static 🟢/🔴 text
already in the Servers page copy and don't add the DNS record. Simple,
safe, no maintenance. You update status by hand when things change.
