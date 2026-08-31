#!/usr/bin/env python3
"""
knuckls_status.py  —  Home-lab server status endpoint for knuckls.com

Runs on the home lab. Polls your game servers, then serves a JSON feed
at  http://0.0.0.0:8080/status.json  with CORS headers so the WordPress
site can fetch it and show live green/red dots + player counts.

NO pip / NO external packages — pure Python stdlib.

HOW IT WORKS
  1. For "fivem" servers it hits the server's built-in HTTP API
     (http://host:port/players.json) to get a real player count.
  2. For "tcp" servers it just checks the port is open (online/offline).
  3. Every POLL seconds it refreshes and caches the result.
  4. A tiny web server answers GET /status.json with CORS so the
     WordPress HTML widget (on a different domain) can read it.

EXPOSE IT SAFELY (DNS is on Hostinger hPanel — no Cloudflare)
  The WordPress site (Hostinger, HTTPS) must fetch this over HTTPS, so:
    1. Give the lab a public address: static IP, or DDNS (DuckDNS/No-IP).
    2. Forward one router port to this script on the lab.
    3. In hPanel > Domains > knuckls.com > DNS add:
         status.knuckls.com  A  <your public IP>
    4. Terminate TLS in front of this script (Caddy / Let's Encrypt reverse
       proxy) so the endpoint is https://status.knuckls.com/status.json.
       Browsers block mixed content, so plain http:// will fail on the site.
  CORS is already enabled in this script (Access-Control-Allow-Origin: *),
  so cross-origin fetch from knuckls.com works once it's HTTPS.
"""

import http.server
import json
import socket
import socketserver
import threading
import time
from datetime import datetime, timezone

# ----------------------------------------------------------------------
# EDIT THIS: your servers. host can be 127.0.0.1 / LAN IP / docker name.
# type: "fivem" (real player count via API) or "tcp" (port check only)
# ----------------------------------------------------------------------
SERVERS = [
    {"name": "Knuckls FiveM",   "game": "FiveM",  "type": "fivem", "host": "127.0.0.1", "port": 30120},
    {"name": "Knuckls DayZ",    "game": "DayZ",   "type": "tcp",   "host": "127.0.0.1", "port": 2302},
    {"name": "Knuckls GTA",     "game": "GTA",    "type": "tcp",   "host": "127.0.0.1", "port": 6672},
    {"name": "Knuckls Arc Crew","game": "Arc Raiders","type": "tcp","host": "127.0.0.1", "port": 27015},
]

POLL_SECONDS = 30
LISTEN_PORT = 8080

# ----------------------------------------------------------------------
cache = {"updated": None, "servers": []}
cache_lock = threading.Lock()


def tcp_up(host, port, timeout=3):
    """Return True if the TCP port is open."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def fivem_players(host, port, timeout=4):
    """Fetch real player count from a FiveM server's HTTP API."""
    try:
        url = f"http://{host}:{port}/players.json"
        with urllib_request.urlopen(url, timeout=timeout) as r:
            data = json.loads(r.read().decode())
            return len(data) if isinstance(data, list) else None
    except Exception:
        return None


def poll():
    results = []
    for s in SERVERS:
        entry = {
            "name": s["name"],
            "game": s["game"],
            "type": s["type"],
            "online": False,
            "players": None,
        }
        if s["type"] == "fivem":
            entry["online"] = tcp_up(s["host"], s["port"])
            if entry["online"]:
                entry["players"] = fivem_players(s["host"], s["port"])
        else:  # tcp
            entry["online"] = tcp_up(s["host"], s["port"])
        results.append(entry)
    return results


def refresh_loop():
    while True:
        results = poll()
        with cache_lock:
            cache["updated"] = datetime.now(timezone.utc).isoformat()
            cache["servers"] = results
        time.sleep(POLL_SECONDS)


class Handler(http.server.BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")  # CORS for WP
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body.encode())

    def do_GET(self):
        if self.path.rstrip("/") in ("", "/status.json"):
            with cache_lock:
                payload = json.dumps(cache, indent=2)
            self._send(200, payload)
        elif self.path.rstrip("/") == "/healthz":
            self._send(200, '{"ok":true}')
        else:
            self._send(404, '{"error":"not found"}')

    def log_message(self, *args):
        pass  # quiet


def main():
    # initial poll so /status.json isn't empty on first hit
    with cache_lock:
        cache["updated"] = datetime.now(timezone.utc).isoformat()
        cache["servers"] = poll()
    threading.Thread(target=refresh_loop, daemon=True).start()
    with socketserver.TCPServer(("0.0.0.0", LISTEN_PORT), Handler) as httpd:
        print(f"[knuckls-status] serving on :{LISTEN_PORT}/status.json  (Ctrl+C to stop)")
        httpd.serve_forever()


if __name__ == "__main__":
    import urllib.request  # noqa (used by fivem_players)
    main()
