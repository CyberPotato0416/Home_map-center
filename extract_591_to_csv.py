#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
591 租屋網資料擷取與 CSV 轉換工具 (GUI / CLI 雙模式版)
這個工具可以抓取一或多個 591 租屋網址的詳細資料，並自動下載高畫質照片與轉換為 GIS 可讀的 CSV。

使用說明：
1. 雙擊執行或 python extract_591_to_csv.py 啟動圖形介面 (GUI)。
2. 命令列批次執行：python extract_591_to_csv.py 網址1 網址2
"""

import urllib.request
import json
import ssl
import http.cookiejar
import re
import csv
import sys
import os
from datetime import datetime, timezone
import threading

# GUI 相關元件
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

# Vite 專案的 public 目錄（下載的照片放在此處，Vite 本地伺服器才能正確讀取）
VITE_PUBLIC_DIR = r"H:\645_Home_map-center\public"
# CSV 輸出路徑（CSV 也放在專案目錄下，方便一起管理）
DEFAULT_CSV = r"H:\645_Home_map-center\public\rentals_import.csv"

# 設定標準輸出編碼
sys.stdout.reconfigure(encoding='utf-8')


def get_591_session():
    """模擬瀏覽器首頁請求，取得最新的 T591_TOKEN"""
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
        req = urllib.request.Request("https://rent.591.com.tw/", headers=headers)
        with opener.open(req) as response:
            response.read()
        cookies = {cookie.name: cookie.value for cookie in cookie_jar}
        return opener, cookies.get("T591_TOKEN", "")
    except Exception as e:
        return opener, ""


def extract_591_id(url_or_id):
    """從網址或字串中解析出 591 物件 ID"""
    url_or_id = url_or_id.strip()
    if not url_or_id:
        return None
    if url_or_id.isdigit():
        return url_or_id
    match = re.search(r'(?:rent\.591\.com\.tw/|detail-|id=)(\d+)', url_or_id)
    if match:
        return match.group(1)
    match_fallback = re.search(r'\b(\d{7,9})\b', url_or_id)
    if match_fallback:
        return match_fallback.group(1)
    return None


def download_images(opener, image_urls, house_id, csv_path, log_func=print):
    """
    下載房屋圖片並儲存到 Vite 專案的 public/rentals_images/<house_id>/ 目錄。
    CSV 中記錄的路徑為 Vite 根相對路徑（前綴 /），例如：/rentals_images/21414812/image_1.jpg
    """
    local_paths = []
    if not image_urls:
        return local_paths
    
    # 圖片存入 Vite public/rentals_images/ 目錄
    images_root = os.path.join(VITE_PUBLIC_DIR, "rentals_images")
    house_dir = os.path.join(images_root, house_id)
    os.makedirs(house_dir, exist_ok=True)
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://rent.591.com.tw/"
    }
    
    log_func(f"  📥 正在下載物件圖片 (共 {len(image_urls)} 張)...")
    for idx, img_url in enumerate(image_urls, 1):
        ext = ".jpg"
        if ".png" in img_url.lower():
            ext = ".png"
        
        filename = f"image_{idx}{ext}"
        local_filepath = os.path.join(house_dir, filename)
        # Vite 根相對路徑（前綴 /，代表從 public/ 根目錄讀取）
        vite_path = f"/rentals_images/{house_id}/{filename}"
        
        try:
            # 取得原始大圖
            clean_url = img_url.split("!")[0]
            req = urllib.request.Request(clean_url, headers=headers)
            with opener.open(req) as response:
                with open(local_filepath, "wb") as f:
                    f.write(response.read())
            local_paths.append(vite_path)
            log_func(f"    [+] 圖片 {idx} 下載成功")
        except Exception:
            try:
                # 失敗則用原網址下載
                req = urllib.request.Request(img_url, headers=headers)
                with opener.open(req) as response:
                    with open(local_filepath, "wb") as f:
                        f.write(response.read())
                local_paths.append(vite_path)
                log_func(f"    [+] 圖片 {idx} 下載成功 (原圖尺寸)")
            except Exception as e2:
                log_func(f"    [-] 圖片 {idx} 下載失敗: {e2}")
                
    return local_paths


def fetch_rental_details(opener, token, house_id, csv_path, log_func=print):
    """根據 ID 解析 591 詳情，並下載圖片"""
    url = f"https://rent.591.com.tw/{house_id}"
    api_url = f"https://bff.591.com.tw/v1/house/rent/detail?id={house_id}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
    }
    
    images = []
    try:
        req_html = urllib.request.Request(url, headers=headers)
        with opener.open(req_html) as response:
            html = response.read().decode('utf-8')
            
        json_ld_matches = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.DOTALL)
        for block in json_ld_matches:
            if '"@type":"Product"' in block or '"Product"' in block:
                try:
                    ld_data = json.loads(block.strip())
                    if isinstance(ld_data, list):
                        for item in ld_data:
                            if item.get("@type") == "Product":
                                images = item.get("image", [])
                                break
                    elif isinstance(ld_data, dict):
                        images = ld_data.get("image", [])
                except:
                    pass
    except Exception as e:
        log_func(f"  [提示] 網頁解析圖片失敗: {e}")

    headers_api = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Device": "pc",
        "Deviceid": token,
        "Referer": "https://rent.591.com.tw/",
        "Accept": "application/json, text/plain, */*"
    }
    
    req_api = urllib.request.Request(api_url, headers=headers_api)
    with opener.open(req_api) as response:
        api_data = json.loads(response.read().decode('utf-8'))
        
    if api_data.get("status") != 1:
        raise Exception(f"BFF API 錯誤: {api_data.get('msg')}")
        
    detail = api_data.get("data", {})
    gtm = detail.get("gtm_detail_data", {})
    pos = detail.get("positionRound", {})
    
    title = detail.get("title", "")
    price = int(detail.get("price", "0").replace(",", ""))
    size_ping = float(gtm.get("area_name", 0))
    floor = gtm.get("floor_name", "")
    house_type = gtm.get("kind_name", "")
    
    address = pos.get("address", "")
    region = ""
    breadcrumbs = detail.get("breadcrumb", [])
    if breadcrumbs:
        region = breadcrumbs[0].get("name", "")
    if region and not address.startswith(region):
        address = region + address
        
    lat = float(pos.get("lat", 0))
    lng = float(pos.get("lng", 0))
    
    facility_list = []
    service = detail.get("service", {})
    for fac in service.get("facility", []):
        if fac.get("active") == 1:
            facility_list.append(fac.get("name"))
            
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
                
    # 聯絡人資訊解析
    link_info = detail.get("linkInfo", {})
    contact_name = link_info.get("name", "").strip()
    contact_phone = link_info.get("mobile", "").strip() or link_info.get("phone", "").strip()
    contact_line = link_info.get("line", "").strip()
    contact_role = link_info.get("roleName", "").strip()

    # 下載圖片到本地
    local_images = download_images(opener, images, house_id, csv_path, log_func)
                
    row_data = {
        "id": f"rent_{int(datetime.now().timestamp() * 1000)}",
        "title": title,
        "price": price,
        "size_ping": size_ping,
        "floor": floor,
        "type": house_type,
        "address": address,
        "latitude": lat,
        "longitude": lng,
        "source_591_url": url,
        "original_591_id": house_id,
        "images": ";".join(local_images),
        "original_image_urls": ";".join(images),
        "mrt_nearest_name": mrt_name,
        "mrt_nearest_distance": mrt_distance,
        "facilities": ";".join(facility_list),
        "聯絡人": contact_name,
        "聯絡電話": contact_phone,
        "Line聯絡": contact_line,
        "聯絡人身分": contact_role,
        "created_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    }
    
    return row_data


def process_urls(urls, csv_path, log_func=print, finish_callback=None):
    """批次執行擷取流程，並寫入 CSV"""
    log_func("建立 591 安全 Session 中...")
    opener, token = get_591_session()
    
    extracted_rows = []
    success_count = 0
    
    log_func(f"開始分析，共 {len(urls)} 筆...")
    for idx, url_item in enumerate(urls, 1):
        house_id = extract_591_id(url_item)
        if not house_id:
            log_func(f"[{idx}/{len(urls)}] ❌ 無法解析物件 ID: {url_item}")
            continue
            
        log_func(f"[{idx}/{len(urls)}] 🚀 正在分析物件 ID: {house_id}...")
        try:
            row = fetch_rental_details(opener, token, house_id, csv_path, log_func)
            extracted_rows.append(row)
            success_count += 1
            log_func(f"  ✅ 擷取成功: {row['title']}")
        except Exception as e:
            log_func(f"  ❌ 擷取失敗! 錯誤原因: {e}")
            
    if not extracted_rows:
        log_func("\n⚠️ 本次任務沒有任何資料成功寫入。")
        if finish_callback:
            finish_callback(0)
        return
        
    file_exists = os.path.exists(csv_path) and os.path.getsize(csv_path) > 0
    fieldnames = [
        "id", "title", "price", "size_ping", "floor", "type", "address", 
        "latitude", "longitude", "source_591_url", "original_591_id", 
        "images", "original_image_urls", "mrt_nearest_name", "mrt_nearest_distance", "facilities", 
        "聯絡人", "聯絡電話", "Line聯絡", "聯絡人身分", "created_at"
    ]
    
    # 讀取既有 CSV 中已記錄的 591 ID，避免重複寫入同一筆物件
    existing_ids = set()
    if file_exists:
        try:
            with open(csv_path, "r", newline='', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for existing_row in reader:
                    eid = existing_row.get("original_591_id", "").strip()
                    if eid:
                        existing_ids.add(eid)
        except Exception as e:
            log_func(f"  [提示] 讀取既有 CSV 失敗，將直接追加: {e}")

    # 過濾掉已存在的物件
    new_rows = []
    for row in extracted_rows:
        rid = str(row.get("original_591_id", ""))
        if rid in existing_ids:
            log_func(f"  ⏭️  略過重複物件 ID: {rid}（已存在 CSV 中）")
        else:
            new_rows.append(row)
            existing_ids.add(rid)

    if not new_rows:
        log_func("\n⚠️ 所有物件皆已存在 CSV 中，本次無新增資料。")
        if finish_callback:
            finish_callback(0)
        return

    log_func(f"\n💾 正在追加寫入 CSV 檔案 (+{len(new_rows)} 筆): {csv_path} ...")
    try:
        if file_exists:
            # 🔑 追加模式：使用普通 utf-8（不加 BOM），否則會在檔案中間插入 BOM 字元損毀 CSV
            with open(csv_path, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                for row in new_rows:
                    writer.writerow(row)
        else:
            # 🔑 新建模式：使用 utf-8-sig（開頭加 BOM），讓 Excel 雙擊開啟時中文不亂碼
            os.makedirs(os.path.dirname(csv_path), exist_ok=True)
            with open(csv_path, 'w', newline='', encoding='utf-8-sig') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                for row in new_rows:
                    writer.writerow(row)
        log_func("  💾 CSV 追加寫入成功！")
        log_func(f"\n🎉 任務結束！新增 {len(new_rows)} 筆，略過 {len(extracted_rows) - len(new_rows)} 筆重複物件。")
        if finish_callback:
            finish_callback(success_count)
    except Exception as e:
        log_func(f"  ❌ 無法寫入檔案: {e}")
        if finish_callback:
            finish_callback(-1)


# ==========================================
# Tkinter 圖形介面設計 (GUI Class)
# ==========================================

class AppGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("591Premium GIS 資料下載歸檔工具")
        self.root.geometry("750x600")
        self.root.minsize(700, 500)
        
        # 設定 Windows 視窗主題
        style = ttk.Style()
        style.theme_use('vista')
        
        self.csv_path = tk.StringVar(value=DEFAULT_CSV)
        self.create_widgets()
        
    def create_widgets(self):
        # 1. 標題與簡介區
        header_frame = ttk.Frame(self.root, padding="10")
        header_frame.pack(fill=tk.X)
        
        title_label = ttk.Label(header_frame, text="591 租屋網批次下載 & GIS 存檔歸檔工具", font=("微軟正黑體", 14, "bold"))
        title_label.pack(anchor=tk.W)
        
        desc_label = ttk.Label(header_frame, text="貼上 591 網址或物件 ID，將自動下載高畫質照片，並產出 UTF-8 BOM 格式的 GIS 地圖 CSV 檔案。", foreground="gray")
        desc_label.pack(anchor=tk.W, pady=(5, 0))
        
        # 2. 存檔路徑選擇
        path_frame = ttk.LabelFrame(self.root, text=" 匯出 CSV 存檔路徑（建議指向 Vite 專案的 public/ 目錄） ", padding="10")
        path_frame.pack(fill=tk.X, padx=15, pady=5)
        
        self.path_entry = ttk.Entry(path_frame, textvariable=self.csv_path, width=70)
        self.path_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 5))
        
        path_btn = ttk.Button(path_frame, text="瀏覽...", command=self.browse_csv_path)
        path_btn.pack(side=tk.RIGHT)
        
        # 3. 網址貼上區
        input_frame = ttk.LabelFrame(self.root, text=" 請貼上 591 網址（支援多行貼上，每行一筆） ", padding="10")
        input_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=5)
        
        self.text_input = tk.Text(input_frame, height=8, font=("Consolas", 10))
        self.text_input.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        
        scrollbar = ttk.Scrollbar(input_frame, command=self.text_input.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.text_input.config(yscrollcommand=scrollbar.set)
        
        # 預設提示內容
        self.text_input.insert(tk.END, "https://rent.591.com.tw/21414812\n")
        
        # 4. 按鈕控制區
        btn_frame = ttk.Frame(self.root, padding="10")
        btn_frame.pack(fill=tk.X, padx=5)
        
        self.start_btn = ttk.Button(btn_frame, text="🚀 開始下載並歸檔", command=self.start_processing)
        self.start_btn.pack(side=tk.LEFT, padx=(10, 5), ipadx=10, ipady=3)
        
        self.open_csv_btn = ttk.Button(btn_frame, text="📂 開啟 CSV 檔案 (Excel)", command=self.open_csv)
        self.open_csv_btn.pack(side=tk.LEFT, padx=5, ipady=3)
        
        self.open_folder_btn = ttk.Button(btn_frame, text="🖼️ 開啟本地照片夾", command=self.open_images_folder)
        self.open_folder_btn.pack(side=tk.LEFT, padx=5, ipady=3)
        
        # 5. 即時下載日誌日誌
        log_frame = ttk.LabelFrame(self.root, text=" 執行進度與日誌 ", padding="10")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=10)
        
        self.log_text = tk.Text(log_frame, height=10, font=("Consolas", 9), state=tk.DISABLED, bg="#f0f0f0")
        self.log_text.pack(fill=tk.BOTH, expand=True, side=tk.LEFT)
        
        log_scrollbar = ttk.Scrollbar(log_frame, command=self.log_text.yview)
        log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.log_text.config(yscrollcommand=log_scrollbar.set)
        
    def log(self, message):
        """執行緒安全的 UI 日誌更新"""
        def update():
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, message + "\n")
            self.log_text.config(state=tk.DISABLED)
            self.log_text.see(tk.END)
        self.root.after(0, update)
        
    def browse_csv_path(self):
        filename = filedialog.asksaveasfilename(
            title="選擇存檔的 CSV 檔案路徑",
            defaultextension=".csv",
            filetypes=[("CSV 檔案", "*.csv"), ("所有檔案", "*.*")],
            initialdir=os.path.dirname(self.csv_path.get())
        )
        if filename:
            self.csv_path.set(filename)
            
    def open_csv(self):
        path = self.csv_path.get()
        if not os.path.exists(path):
            messagebox.showwarning("警告", "CSV 檔案尚不存在，請先執行下載流程！")
            return
        try:
            os.startfile(path)
        except Exception as e:
            messagebox.showerror("錯誤", f"無法開啟 CSV 檔案: {e}")
            
    def open_images_folder(self):
        base_dir = os.path.dirname(self.csv_path.get())
        images_dir = os.path.join(base_dir, "rentals_images")
        if not os.path.exists(images_dir):
            os.makedirs(images_dir, exist_ok=True)
        try:
            os.startfile(images_dir)
        except Exception as e:
            messagebox.showerror("錯誤", f"無法開啟照片夾: {e}")
            
    def start_processing(self):
        # 讀取輸入的網址
        input_content = self.text_input.get("1.0", tk.END).strip()
        if not input_content:
            messagebox.showwarning("警告", "請先貼上 591 網址或物件 ID！")
            return
            
        urls = [line.strip() for line in input_content.split("\n") if line.strip()]
        csv_file = self.csv_path.get()
        
        # 鎖定按鈕，防止重複點擊
        self.start_btn.config(state=tk.DISABLED)
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete("1.0", tk.END)
        self.log_text.config(state=tk.DISABLED)
        
        # 開啟背景執行緒進行下載，防止 UI 凍結
        thread = threading.Thread(
            target=process_urls,
            args=(urls, csv_file, self.log, self.on_finish)
        )
        thread.daemon = True
        thread.start()
        
    def on_finish(self, count):
        """下載完成後的 UI 回呼"""
        def update_ui():
            self.start_btn.config(state=tk.NORMAL)
            if count > 0:
                messagebox.showinfo("任務完成", f"🎉 成功完成 {count} 筆租屋物件的下載與歸檔！\n\n您可以點選「開啟本機照片夾」查看照片，並可在系統網頁中匯入此 CSV 檔。")
            elif count == 0:
                messagebox.showwarning("任務提示", "⚠️ 任務完成，但沒有擷取到任何有效的物件資料。請檢查網址是否正確。")
            else:
                messagebox.showerror("錯誤", "❌ 寫入 CSV 失敗，請確認檔案是否被 Excel 開啟而佔用！")
        self.root.after(0, update_ui)


def cli_main():
    """命令列 CLI 運作主流程"""
    urls = sys.argv[1:]
    csv_file = DEFAULT_CSV
    print("====== 591 租屋資料下載歸檔工具 (CLI 模式) ======")
    process_urls(urls, csv_file, print)


if __name__ == "__main__":
    # 根據是否帶有命令列參數判斷啟動 GUI 或 CLI
    if len(sys.argv) > 1:
        cli_main()
    else:
        root = tk.Tk()
        app = AppGUI(root)
        root.mainloop()
