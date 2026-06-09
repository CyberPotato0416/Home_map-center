import json

with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "r", encoding="utf-8") as f:
    text = f.read()

# Find all occurrences of "img" in the raw text
lines = text.split('\n')
for i, line in enumerate(lines):
    if "img" in line or "591.com.tw" in line:
        if "http" in line:
            print(f"Line {i+1}: {line.strip()}")
