import re
import sys

# Reconfigure stdout to use UTF-8 to prevent CP950 encode errors on Windows
sys.stdout.reconfigure(encoding='utf-8')

with open(r"h:\640_cheers_Soft\scratch\room_page.html", "r", encoding="utf-8") as f:
    html = f.read()

scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
if len(scripts) > 0:
    print("=== SCRIPT 1 CONTENT ===")
    print(scripts[0].strip())
