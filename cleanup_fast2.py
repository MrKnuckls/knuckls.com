"""Fast FTP cleaner - wipes everything but .htaccess, default.php, .private"""
import ftplib, sys

HOST = "191.101.79.213"
USER = "u882666713.knuckls.com"
PASS = "Dominic4163@#$"

KEEP = {'.', '..', '.htaccess', '.htaccess.bk', 'default.php', '.private'}

def walk(ftp, path):
    """Walk remote tree, return (dirs, files) lists ordered leaf-first"""
    items = []
    ftp.retrlines(f'LIST {path}', items.append)
    dirs, files = [], []
    for item in items:
        parts = item.split(maxsplit=9)
        name = parts[-1]
        if name in KEEP: continue
        full = f"{path}/{name}" if path else name
        if parts[0].startswith('d'):
            sd, sf = walk(ftp, full)
            dirs.extend(sd)
            dirs.append(full)
            files.extend(sf)
        else:
            files.append(full)
    return dirs, files

def delete(root, keep=None, name=""):
    ftp = ftplib.FTP(HOST, USER, PASS)
    ftp.encoding = 'utf-8'
    if root:
        ftp.cwd(root)
    
    dirs, files = walk(ftp, name)
    total = len(files) + len(dirs)
    
    for f in files:
        try: ftp.delete(f)
        except: pass
    
    for d in dirs:
        try: ftp.rmd(d)
        except: pass
    
    ftp.quit()
    return total

# Wipe everything root level files first
ftp = ftplib.FTP(HOST, USER, PASS)
ftp.encoding = 'utf-8'

root_files = [
    'index.php', 'wp-config.php', 'wp-config-sample.php',
    'wp-blog-header.php', 'wp-comments-post.php', 'wp-cron.php',
    'wp-links-opml.php', 'wp-load.php', 'wp-login.php', 'wp-mail.php',
    'wp-settings.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php',
    'xmlrpc.php', 'license.txt', 'readme.html'
]
for f in root_files:
    try:
        ftp.delete(f)
        print(f"DEL {f}")
    except:
        pass

# Now delete wp-content, wp-includes recursively
for d in ['wp-content', 'wp-includes']:
    try:
        print(f"\nDeleting {d}...")
        dirs, files = walk(ftp, d)
        count = 0
        for f in files:
            try: ftp.delete(f); count += 1
            except: pass
        for dirname in dirs:
            try: ftp.rmd(dirname); count += 1
            except: pass
        print(f"  Removed {count} items from {d}")
    except Exception as e:
        print(f"  Error on {d}: {e}")

print("\n=== Final state ===")
remaining = []
ftp.dir(remaining.append)
for r in remaining:
    print(r)
ftp.quit()