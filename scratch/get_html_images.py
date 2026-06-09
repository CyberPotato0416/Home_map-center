import urllib.request
import ssl
import http.cookiejar

url = "https://rent.591.com.tw/21414812"

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
    print("Fetching home page first...")
    req_home = urllib.request.Request("https://rent.591.com.tw/", headers=headers)
    with opener.open(req_home) as response:
        response.read()

    print("Fetching detail HTML...")
    req_detail = urllib.request.Request(url, headers=headers)
    with opener.open(req_detail) as response:
        html = response.read().decode('utf-8')
        
    with open(r"h:\640_cheers_Soft\scratch\room_page.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Saved HTML page to room_page.html")
    
    # Simple check for image hosts or lists
    import re
    urls = re.findall(r'https://img\d?\.591\.com\.tw/house/[^\s"\'>]+', html)
    print(f"Found {len(urls)} house image URLs in HTML:")
    for u in set(urls):
        print(f"  {u}")
        
except Exception as e:
    print(f"Failed: {e}")
