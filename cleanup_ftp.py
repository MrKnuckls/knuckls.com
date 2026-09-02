import ftplib
import sys

host = "191.101.79.213"
user = "u882666713.knuckls.com"
password = "Dominic4163@#$"

ftp = ftplib.FTP(host, user, password)
ftp.encoding = 'utf-8'

def delete_recursive(ftp, path):
    try:
        items = []
        ftp.cwd(path)
        ftp.retrlines('LIST', items.append)
        for item in items:
            parts = item.split()
            name = ' '.join(parts[8:])
            if name in ('.', '..'):
                continue
            if parts[0].startswith('d'):
                delete_recursive(ftp, name)
            else:
                try:
                    ftp.delete(name)
                    print(f"  deleted file: {name}")
                except Exception as e:
                    print(f"  fail file {name}: {e}")
        ftp.cwd('..')
        ftp.rmd(path)
        print(f"Deleted dir: {path}")
    except Exception as e:
        print(f"  fail dir {path}: {e}")

# Delete WordPress directories
for d in ['wp-admin', 'wp-includes', 'wp-content']:
    delete_recursive(ftp, d)

# Delete WordPress root files
wp_files = [
    'index.php', 'wp-config.php', 'wp-config-sample.php',
    'wp-blog-header.php', 'wp-comments-post.php', 'wp-cron.php',
    'wp-links-opml.php', 'wp-load.php', 'wp-login.php', 'wp-mail.php',
    'wp-settings.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php',
    'xmlrpc.php', 'license.txt', 'readme.html'
]

for f in wp_files:
    try:
        ftp.delete(f)
        print(f"Deleted: {f}")
    except Exception as e:
        print(f"Skip {f}: {e}")

print("\n=== Remaining ===")
remaining = []
ftp.dir(remaining.append)
for r in remaining:
    print(r)

ftp.quit()
print("\nWordPress cleanup complete.")