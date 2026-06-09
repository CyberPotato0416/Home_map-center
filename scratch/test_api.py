import urllib.request
import json
import ssl

url = "https://bff.591.com.tw/v1/house/rent/detail?id=21414812"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Device": "pc",
    "Referer": "https://rent.591.com.tw/",
    "Accept": "application/json, text/plain, */*"
}

req = urllib.request.Request(url, headers=headers)
context = ssl._create_unverified_context()

try:
    with urllib.request.urlopen(req, context=context) as response:
        status = response.status
        body = response.read().decode('utf-8')
        print(f"HTTP Status: {status}")
        data = json.loads(body)
        print("Success! JSON Keys:")
        print(list(data.keys()))
        if "data" in data:
            print("Detail Data Keys:")
            print(list(data["data"].keys()))
            info = data["data"].get("info", {})
            print(f"Title: {info.get('title')}")
            print(f"Rent: {info.get('price')}")
            # Save raw json for comparison
            with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print("Saved API response to 591_api_response.json")
except Exception as e:
    print(f"Request failed: {e}")
