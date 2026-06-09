import urllib.request
import json
import ssl
import http.cookiejar
import re
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

url = "https://rent.591.com.tw/21414812"
house_id = "21414812"

cookie_jar = http.cookiejar.CookieJar()
cookie_handler = urllib.request.HTTPCookieProcessor(cookie_jar)
context = ssl._create_unverified_context()
https_handler = urllib.request.HTTPSHandler(context=context)
opener = urllib.request.build_opener(cookie_handler, https_handler)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

try:
    # 1. Fetch home page to get cookies
    print("Fetching 591 home page...")
    req_home = urllib.request.Request("https://rent.591.com.tw/", headers=headers)
    with opener.open(req_home) as response:
        response.read()
    
    cookies = {cookie.name: cookie.value for cookie in cookie_jar}
    token = cookies.get("T591_TOKEN", "")
    
    # 2. Fetch HTML of details page (to extract Schema.org JSON-LD images)
    print("Fetching rental details HTML...")
    req_html = urllib.request.Request(url, headers=headers)
    with opener.open(req_html) as response:
        html_content = response.read().decode('utf-8')
        
    # Parse images from JSON-LD
    images = []
    json_ld_matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html_content, re.DOTALL)
    for block in json_ld_matches:
        if '"@type":"Product"' in block or '"Product"' in block:
            try:
                ld_data = json.loads(block.strip())
                # ld_data can be a list or a dict
                if isinstance(ld_data, list):
                    for item in ld_data:
                        if item.get("@type") == "Product":
                            images = item.get("image", [])
                            break
                elif isinstance(ld_data, dict):
                    images = ld_data.get("image", [])
            except Exception as e:
                print(f"Failed to parse JSON-LD: {e}")
    
    # 3. Fetch BFF detail API for structured fields
    print("Fetching BFF API details...")
    headers_api = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Device": "pc",
        "Deviceid": token,
        "Referer": "https://rent.591.com.tw/",
        "Accept": "application/json, text/plain, */*"
    }
    api_url = f"https://bff.591.com.tw/v1/house/rent/detail?id={house_id}"
    req_api = urllib.request.Request(api_url, headers=headers_api)
    with opener.open(req_api) as response:
        api_data = json.loads(response.read().decode('utf-8'))
        
    if api_data.get("status") != 1:
        raise Exception(f"BFF API returned status error: {api_data.get('msg')}")
        
    detail = api_data.get("data", {})
    gtm = detail.get("gtm_detail_data", {})
    pos = detail.get("positionRound", {})
    
    # Extract fields matching our schema
    title = detail.get("title", "")
    price = int(detail.get("price", "0").replace(",", ""))
    size_ping = float(gtm.get("area_name", 0))
    floor = gtm.get("floor_name", "")
    house_type = gtm.get("kind_name", "")
    
    # Address prepended with region name
    address = pos.get("address", "")
    region = ""
    breadcrumbs = detail.get("breadcrumb", [])
    if breadcrumbs:
        region = breadcrumbs[0].get("name", "")
    if region and not address.startswith(region):
        address = region + address
        
    lat = float(pos.get("lat", 0))
    lng = float(pos.get("lng", 0))
    
    # Facilities list
    facility_list = []
    service = detail.get("service", {})
    for fac in service.get("facility", []):
        if fac.get("active") == 1:
            facility_list.append(fac.get("name"))
            
    # Nearest MRT station
    mrt_name = ""
    mrt_distance = 0
    for category in pos.get("data", []):
        if category.get("key") == "traffic":
            for child in category.get("children", []):
                if child.get("type") == "subway":
                    mrt_name = child.get("name", "")
                    mrt_distance = int(child.get("distance", 0))
                    break
            if mrt_name:
                break
                
    # Output the result
    result = {
        "id": f"rent_{int(datetime.now().timestamp() * 1000)}",
        "title": title,
        "price": price,
        "size_ping": size_ping,
        "floor": floor,
        "type": house_type,
        "address": address,
        "coordinates": [lat, lng],
        "source_591_url": url,
        "original_591_id": house_id,
        "images": images,
        "mrt_nearest": {
            "name": mrt_name,
            "distance_meters": mrt_distance
        },
        "facilities": facility_list,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    
    print("\n=== EXTRACTION SUCCESSFUL ===")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
except Exception as e:
    print(f"Extraction failed: {e}")
