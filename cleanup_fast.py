import ftplib, time

host = "191.101.79.213"
user = "u882666713.knuckls.com"
password = "Dominic4163@#$"

ftp = ftplib.FTP(host, user, password)
ftp.encoding = 'utf-8'

def delete_paths(ftp, paths):
    """Delete leaf files first, then dirs. paths = [(type, name), ...]"""
    files = [p[1] for p in paths if p[0] == '-']
    dirs = [p[1] for p in paths if p[0] == 'd']
    
    for f in files:
        try: ftp.delete(f)
        except: pass
    
    for d in dirs:
        try: ftp.rmd(d)
        except: pass

# Collect everything from root first
def collect(ftp, path=""):
    """Returns (files, dirs) at this level"""
    items = []
    ftp.retrlines(f'LIST {path}', items.append)
    files, dirs = [], []
    for item in items:
        parts = item.split()
        name = ' '.join(parts[8:])
        if name in ('.', '..'): continue
        full = f"{path}/{name}" if path else name
        if parts[0].startswith('d'):
            sub_files, sub_dirs = collect(ftp, full)
            files.extend(sub_files)
            files.append(('-', full))
        else:
            files.append(('-', full))
    return files, dirs

print("Collecting all files/dirs (one pass)...")
all_files, _ = collect(ftp)
print(f"Found {len(all_files)} items to delete")

# Delete from leaf to root (already ordered that way from recursion)
count = 0
for t, name in all_files:
    try:
        if t == '-':
            ftp.delete(name)
        else:
            ftp.rmd(name)
        count += 1
        if count % 200 == 0:
            print(f"  Deleted {count}/{len(all_files)}")
    except Exception as e:
        pass

print(f"\nDeleted {count} total items")

# Also delete any leftover root wp-* files
for f in ['index.php', 'wp-config.php', 'wp-config-sample.php',
          'wp-blog-header.php', 'wp-comments-post.php', 'wp-cron.php',
          'wp-links-opml.php', 'wp-load.php', 'wp-login.php', 'wp-mail.php',
          'wp-settings.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php',
          'xmlrpc.php', 'license.txt', 'readme.html']:
    try:
        ftp.delete(f)
        print(f"Deleted root: {f}")
    except:
        pass

print("\n=== Remaining ===")
remaining = []
ftp.dir(remaining.append)
for r in remaining:
    print(r)

ftp.quit()