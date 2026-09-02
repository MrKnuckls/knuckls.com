"""Silent FTP cleaner - minimal output, just deletes"""
import ftplib

HOST = "191.101.79.213"
USER = "u882666713.knuckls.com"
PASS = "Dominic4163@#$"

def nuke(ftp, path):
    """Recursively delete everything under path using NLST (faster)"""
    try:
        names = ftp.nlst(path)
    except:
        return
    for name in names:
        if name in ('.', '..'): continue
        # Try as file first
        try:
            ftp.delete(name)
            continue
        except:
            pass
        # Try as directory (recurse)
        try:
            nuke(ftp, name)
            ftp.rmd(name)
        except:
            pass

print("=== Phase 1: Delete wp-content ===")
ftp = ftplib.FTP(HOST, USER, PASS)
ftp.encoding = 'utf-8'

nuke(ftp, 'wp-content')
try: ftp.rmd('wp-content')
except: pass
print("  wp-content done")

nuke(ftp, 'wp-includes')
try: ftp.rmd('wp-includes')
except: pass
print("  wp-includes done")

# Check remaining
remaining = []
ftp.dir(remaining.append)
print("\n=== Remaining ===")
for r in remaining:
    print(r)
ftp.quit()