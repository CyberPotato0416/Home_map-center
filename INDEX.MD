# 🗺️ 租屋評比地圖中心 (Home Map Center) - 專案導覽與工作流

本文件記載了租屋決策分析工具的完整專案架構、檔案權限規範以及四大核心工作流（**爬取 ➔ 清洗 ➔ 同步 ➔ 評比**）。

---

## 🔄 核心工作流 (Core Workflow)

### 1. 爬取物件 (Crawl Rentals)
* **工具**：[extract_591_to_csv.py](file:///H:/645_Home_map-center/extract_591_to_csv.py) (地端 Python GUI / CLI 爬蟲)
* **流程**：
  1. 輸入 591 物件網址或 ID。
  2. 爬蟲模擬 Session 抓取房屋詳情、聯絡人、管理費、變頻冷氣等基礎欄位。
  3. 自動下載高畫質照片，並存入 [public/rentals_images/](file:///H:/645_Home_map-center/public/rentals_images/) 的物件專屬 ID 資料夾下。
  4. 爬蟲將最新數據追加寫入 [public/rentals_import.xlsm](file:///H:/645_Home_map-center/public/rentals_import.xlsm)。

### 2. 清洗與格式化成 XLSM (Clean & Format)
* **核心檔案**：[public/rentals_import.xlsm](file:///H:/645_Home_map-center/public/rentals_import.xlsm) 與其內建巨集 [RentalsManager.bas](file:///H:/645_Home_map-center/RentalsManager.bas)
* **流程**：
  * **樓層正則修正**：在巨集或清洗腳本中，自動將 E 欄（floor）樓層欄位的 `2 樓`、`2 樓/3 樓` 等中文字眼使用 Regular Expressions 替換修正為英文字 `2F`、`2F/3F`，並限制寬度為 12。
  * **版面與驗證**：巨集自動格式化價格與坪數、隱藏不必要欄位（隱藏 M 欄原始網址）、插入 Zebra 斑馬線著色、為 AN 欄（開伙狀況）、AP 欄（浴缸）、AQ 欄（熱水器形式）建立下拉式選單資料驗證。
  * **著色規則**：巨集會根據網頁屬性卡邏輯，為「有/無、可/不可、不詳、招租/簽約/審核中」等欄位標示符合 app 主題的亮點著色。
  * **排序**：按「簽約狀態」➔「租金」➔「坪數」進行三層排序。

### 3. 同步與上網頁 (Sync & Upload)
* **同步指令**：
  ```bash
  python scratch/generate_questions.py
  ```
* **流程**：
  1. 上述指令會讀取最新 `rentals_import.xlsm` 數據，將其寫入 [public/rentals_import.csv](file:///H:/645_Home_map-center/public/rentals_import.csv) 供前端讀取。
  2. 根據「不詳」或空白欄位，自動為「招租中」物件更新 [rental_questions.md](file:///H:/645_Home_map-center/rental_questions.md)（提問追蹤清單與 591 防吃換行私訊範本）。
  3. 啟動網頁伺服器（`npm run dev`），網頁前端讀取最新點位；亦可手動透過網頁 UI 的「匯入 CSV」或「相片直灌通道」上傳 ZIP/RAR 壓縮包。

### 4. 積分評比 (Score Assessment)
* **評比邏輯**：[src/utils.ts](file:///H:/645_Home_map-center/src/utils.ts) 的 `calculateHomeScore`
* **流程**：
  * 網頁載入數據後，根據設定之公司座標（`[25.0395, 121.5435]`，堯金科技，仁愛路三段大安區）進行多維度加減分計算：
    * **通勤月淨效益**：租金差價扣除通勤時間成本，計算出 CP 值等級（最高加 5 分，金箍通勤圈加 15 分）。
    * **空間與預算**：8坪以下為0分，12坪以上得10分；預算越低分數越高。
    * **設備增益/減益**：有電梯（+15）、獨立陽台（+15，方便噴模型漆）、變頻冷氣（+10）、個人獨洗（+10）；地下室（-30）、無電梯4樓以上（-15）、共用洗衣機（-5）、電費超過 6.0 元/度（-15）。
  * 最終得分於 Sidebar 點位屬性卡中以「裝備屬性卡」形式呈現，輔助決策。

---

## 📁 專案重要架構說明

* [README.md](file:///H:/645_Home_map-center/README.md) — 專案本地部署與啟動說明。
* [CLAUDE.md](file:///H:/645_Home_map-center/CLAUDE.md) — **AI Agent 開發最高規範與憲法（嚴禁刪除爬蟲、XLSM、CSV 及 specs，開發限於 `src/`）**。
* [INDEX.MD](file:///H:/645_Home_map-center/INDEX.MD) — 專案總導覽與工作流說明（本檔案）。
* [extract_591_to_csv.py](file:///H:/645_Home_map-center/extract_591_to_csv.py) — 爬蟲工具（地端 Python）。
* [public/rentals_import.xlsm](file:///H:/645_Home_map-center/public/rentals_import.xlsm) — 主要修改與維護的 Excel 資料源。
* [RentalsManager.bas](file:///H:/645_Home_map-center/RentalsManager.bas) — 儲存於專案中的巨集模組（內含合併版 `SetupReportMode`）。
* [rental_requirements.md](file:///H:/645_Home_map-center/rental_requirements.md) — 您的租屋需求文案（含 FB 社團/房仲聯絡用範本）。
* [rental_questions.md](file:///H:/645_Home_map-center/rental_questions.md) — 自動化產出的「不詳」欄位待問清單與 591 防吃換行問答範本。
* [src/utils.ts](file:///H:/645_Home_map-center/src/utils.ts) — 核心計分與地圖幾何計算。
