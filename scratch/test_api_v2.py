import urllib.request
import json
import ssl
import http.cookiejar

url_detail = "https://bff.591.com.tw/v1/house/rent/detail?id=21414812"

# Setup cookie jar and SSL context
cookie_jar = http.cookiejar.CookieJar()
cookie_handler = urllib.request.HTTPCookieProcessor(cookie_jar)

context = ssl._create_unverified_context()
https_handler = urllib.request.HTTPSHandler(context=context)

# Build opener with SSL context handler
opener = urllib.request.build_opener(cookie_handler, https_handler)

# Common headers
headers_home = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

try:
    # 1. Fetch home page to get cookies
    print("Fetching home page to get cookies...")
    req_home = urllib.request.Request("https://rent.591.com.tw/", headers=headers_home)
    with opener.open(req_home) as response:
        response.read() # Consume
    
    cookies = {cookie.name: cookie.value for cookie in cookie_jar}
    print("Cookies retrieved:")
    for k, v in cookies.items():
        print(f"  {k}: {v}")

    # Extract token
    token = cookies.get("T591_TOKEN")
    if not token:
        print("T591_TOKEN not found in cookies. Using a dummy/empty deviceid...")
        token = ""

    # 2. Fetch detail page
    print("\nFetching detail API...")
    headers_detail = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Device": "pc",
        "Deviceid": token,
        "Referer": "https://rent.591.com.tw/",
        "Accept": "application/json, text/plain, */*"
    }
    
    req_detail = urllib.request.Request(url_detail, headers=headers_detail)
    with opener.open(req_detail) as response:
        body = response.read().decode('utf-8')
        data = json.loads(body)
        print("Detail Keys:")
        print(list(data.keys()))
        if "data" in data:
            info = data["data"].get("info", {})
            print(f"Title: {info.get('title')}")
            print(f"Rent: {info.get('price')}")
            with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print("Saved to 591_api_response.json")
except Exception as e:
    print(f"Failed: {e}")
