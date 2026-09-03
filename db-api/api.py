"""
knuckls.com Database API
Runs in Docker on Unraid. Provides live DB-backed endpoints for knuckls.com.
"""
import json
import os
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import pymysql
from urllib.parse import urlparse, parse_qs

DB_HOST = os.environ.get("DB_HOST", "10.15.34.65")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_USER = os.environ.get("DB_USER", "knuckls_api")
DB_PASS = os.environ.get("DB_PASS", "knuckls2026")
DB_NAME = os.environ.get("DB_NAME", "knuckls_site")
API_KEY = os.environ.get("API_KEY", "knuckls2026")  # Simple auth for Hostinger

def db():
    return pymysql.connect(host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASS, database=DB_NAME,
                           charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor, connect_timeout=5)

class APIHandler(BaseHTTPRequestHandler):
    def _auth(self):
        qs = parse_qs(urlparse(self.path).query)
        key = qs.get('key', [None])[0] or self.headers.get('X-API-Key')
        return key == API_KEY

    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode())

    def _html(self, text, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(text.encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        path = parsed.path.rstrip('/')

        # Health check
        if path == '/health' or path == '/':
            self._json({"ok": True, "service": "knuckls-db-api"})
            return

        if not self._auth():
            self._json({"error": "unauthorized"}, 401)
            return

        action = qs.get('action', [None])[0] or path.strip('/')

        try:
            conn = db()
            cur = conn.cursor()

            if action == 'config':
                cur.execute("SELECT `key`, `value` FROM site_config")
                rows = cur.fetchall()
                pages = {r['key']: r['value'] for r in rows}
                self._json({"pages": pages})

            elif action == 'blog':
                cur.execute("SELECT id, title, content, category, version, author, image, tags, created_at FROM blog_posts ORDER BY created_at DESC")
                posts = []
                for r in cur.fetchall():
                    p = {k: r[k] for k in ['id','title','content','category','version','author','image']}
                    p['date'] = r['created_at'].strftime('%Y-%m-%d') if r['created_at'] else ''
                    p['body'] = r['content']
                    try:
                        p['tags'] = json.loads(r['tags']) if r['tags'] else []
                    except:
                        p['tags'] = []
                    posts.append(p)
                self._json(posts)

            elif action == 'servers':
                cur.execute("SELECT * FROM server_config ORDER BY id")
                rows = cur.fetchall()
                self._json({"servers": rows})

            elif action == 'assets':
                cur.execute("SELECT * FROM assets ORDER BY created_at DESC")
                rows = cur.fetchall()
                self._json({"assets": rows})

            elif action == 'status':
                # Return server status placeholder (Pterodactyl status fetched from panel)
                cur.execute("SELECT id, name, game, pt_uuid FROM server_config")
                rows = cur.fetchall()
                # Return the config; actual online status is still fetched by console.php from Pterodactyl
                self._json({"servers": rows})

            else:
                self._json({"error": f"unknown action: {action}"}, 404)

            cur.close()
            conn.close()

        except Exception as e:
            self._json({"error": str(e)}, 500)

    def do_POST(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        path = parsed.path.rstrip('/')

        if not self._auth():
            self._json({"error": "unauthorized"}, 401)
            return

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b'{}'
        try:
            data = json.loads(body)
        except:
            data = {}

        action = qs.get('action', [None])[0] or data.get('action', path.strip('/'))

        try:
            conn = db()
            cur = conn.cursor()

            if action == 'config_update':
                for k, v in data.get('pages', {}).items():
                    cur.execute("INSERT INTO site_config (`key`, `value`) VALUES (%s, %s) ON DUPLICATE KEY UPDATE `value`=%s",
                               (k, str(v), str(v)))
                conn.commit()
                self._json({"ok": True})

            elif action == 'blog_add':
                cur.execute("INSERT INTO blog_posts (title, content, category, version, author, image, tags) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                           (data.get('title',''), data.get('content',data.get('body','')), data.get('category'),
                            data.get('version'), data.get('author','MrKnuckls'), data.get('image'),
                            json.dumps(data.get('tags',[]))))
                conn.commit()
                self._json({"ok": True, "id": cur.lastrowid})

            elif action == 'blog_delete':
                cur.execute("DELETE FROM blog_posts WHERE id=%s", (data.get('id'),))
                conn.commit()
                self._json({"ok": True})

            elif action == 'servers_update':
                for s in data.get('servers', []):
                    if s.get('id'):
                        cur.execute("INSERT INTO server_config (id, name, game, `desc`, pt_uuid) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE name=%s, game=%s, `desc`=%s",
                                   (s['id'], s.get('name',''), s.get('game',''), s.get('desc',''), s.get('pt_uuid',''),
                                    s.get('name',''), s.get('game',''), s.get('desc','')))
                conn.commit()
                self._json({"ok": True})

            elif action == 'asset_add':
                cur.execute("INSERT INTO assets (title, `desc`, file_type, file_path, file_size, preview) VALUES (%s, %s, %s, %s, %s, %s)",
                           (data.get('title',''), data.get('desc',''), data.get('file_type',''),
                            data.get('file_path',''), data.get('file_size',''), data.get('preview','')))
                conn.commit()
                self._json({"ok": True, "id": cur.lastrowid})

            elif action == 'asset_delete':
                cur.execute("DELETE FROM assets WHERE id=%s", (data.get('id'),))
                conn.commit()
                self._json({"ok": True})

            else:
                self._json({"error": f"unknown action: {action}"}, 404)

            cur.close()
            conn.close()

        except Exception as e:
            self._json({"error": str(e)}, 500)

    def log_message(self, format, *args):
        print(f"[API] {args[0]} {args[1]} {args[2]}")

if __name__ == '__main__':
    port = int(os.environ.get("PORT", "5000"))
    server = HTTPServer(('0.0.0.0', port), APIHandler)
    print(f"knuckls DB API running on port {port}")
    server.serve_forever()