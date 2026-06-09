import re

with open(r"h:\640_cheers_Soft\scratch\room_page.html", "r", encoding="utf-8") as f:
    html = f.read()

# Let's search for script tags containing initial state
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
print(f"Total script tags: {len(scripts)}")
for i, script in enumerate(scripts):
    if "177977533523320106" in script:
        print(f"Found image in script {i+1} (length {len(script)}):")
        # Print first 200 chars and last 200 chars or print context
        idx = script.find("177977533523320106")
        start = max(0, idx - 150)
        end = min(len(script), idx + 300)
        print("CONTEXT:")
        print(script[start:end])
