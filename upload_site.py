"""Upload knuckls.com static site to Hostinger FTP root"""
import ftplib, os

HOST = "191.101.79.213"
USER = "u882666713.knuckls.com"
PASS = "Dominic4163@#$"
LOCAL = "C:/Users/knuck/AppData/Local/hermes/knuckls"

ftp = ftplib.FTP(HOST, USER, PASS)
ftp.encoding = 'utf-8'

def upload_file(local_path, remote_path):
    with open(local_path, 'rb') as f:
        ftp.storbinary(f'STOR {remote_path}', f)
    print(f"  UP  {remote_path}")

def upload_tree(local_dir, remote_dir=""):
    for name in os.listdir(local_dir):
        local_path = os.path.join(local_dir, name)
        remote_name = f"{remote_dir}/{name}" if remote_dir else name
        if os.path.isfile(local_path):
            upload_file(local_path, remote_name)
        elif os.path.isdir(local_path):
            try:
                ftp.mkd(remote_name)
            except:
                pass
            upload_tree(local_path, remote_name)

# Upload index.html
upload_file(f"{LOCAL}/index.html", "index.html")

# Upload assets/ folder
upload_tree(f"{LOCAL}/assets", "assets")

# Verify
print("\n=== Uploaded files ===")
items = []
ftp.dir(items.append)
for r in items:
    print(r)

print("\n=== assets/ contents ===")
items2 = []
ftp.dir("assets", items2.append)
for r in items2:
    print(r)

ftp.quit()
print("\nUpload complete.")