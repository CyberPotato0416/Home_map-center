import urllib.request
import json
import ssl
import http.cookiejar

url_detail = "https://bff.591.com.tw/v1/house/rent/detail?id=21414812"

cookie_jar = http.cookiejar.CookieJar()
cookie_handler = urllib.request.HTTPCookieProcessor(cookie_jar)
context = ssl._create_unverified_context()
https_handler = urllib.request.HTTPSHandler(context=context)
opener = urllib.request.build_opener(cookie_handler, https_handler)

headers_home = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

try:
    print("Fetching home page to get cookies...")
    req_home = urllib.request.Request("https://rent.591.com.tw/", headers=headers_home)
    with opener.open(req_home) as response:
        response.read()
    
    cookies = {cookie.name: cookie.value for cookie in cookie_jar}
    token = cookies.get("T591_TOKEN", "")

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
        
        # Save to disk first
        with open(r"h:\640_cheers_Soft\scratch\591_api_response.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Successfully saved API response to 591_api_response.json")
        
        print(f"Data type: {type(data)}")
        print(f"Status: {data.get('status')}, Msg: {data.get('msg')}")
        d_val = data.get('data')
        print(f"Data field type: {type(d_val)}")
        if isinstance(d_val, list):
            print(f"Data is list of length: {len(d_val)}")
            if len(d_val) > 0:
                print(f"First item type: {type(d_val[0])}")
        elif isinstance(d_val, dict):
            print(f"Data keys: {list(d_val.keys())}")
            
except Exception as e:
    print(f"Failed: {e}")
