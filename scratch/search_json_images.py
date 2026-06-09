import json

image_ids = [
    "177977533523320106",
    "177977533520447301",
    "177977533545951202",
    "177977533524115407",
    "177977533524854903",
    "177977533518252401",
    "177977533546699200",
    "177977533521462709"
]

with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "r", encoding="utf-8") as f:
    text = f.read()

print("Searching in 591_api_response.json:")
for img_id in image_ids:
    found = img_id in text
    print(f"  Image ID {img_id}: {'Found' if found else 'NOT Found'}")
