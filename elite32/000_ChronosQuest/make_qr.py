import qrcode
import os

url = "http://192.168.0.194:8888"
img = qrcode.make(url)
save_path = r"d:\AntiG\GAG_test2026\game_portal.png"
img.save(save_path)
print(f"QR Code generated for {url} at {save_path}")
