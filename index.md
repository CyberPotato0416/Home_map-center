# 🗺️ 591Premium 雙北都市 GIS 智慧租屋地圖系統 — 專案文件索引 (Index)

本專案旨在結合 **都市 GIS 資料（行政區界、租金統計、捷運路網）** 與 **591 租屋紀錄**，打造一個以 **民權東路三段辦公室** 為核心的客製化地圖式租屋決策分析系統。

為確保開發流程順暢，本專案將規格與開發計畫分段管理。以下為專案相關說明文件之索引連結：

---

## 📌 核心說明與規範

*   **[README.md](file:///H:/645_Home_map-center/README.md)**：本機開發伺服器啟動與部署的基礎說明指南。
*   **[CLAUDE.md](file:///H:/645_Home_map-center/CLAUDE.md)**：AI 助理通訊規範、數據誠實原則與領域檢討 SOP 準則。

---

## 🗺️ GIS 租屋地圖主計畫與階段規格 (Roadmap & Specs)

*   **[rent_map_master_plan.md](file:///H:/645_Home_map-center/rent_map_specs/rent_map_master_plan.md)**：系統架構、技術選型、地理核心範圍與資料結構定義的**總體計畫書**。

### 分步開發規格書 (Phased Specs)：
1.  **[Phase 1: 基礎地圖與核心標記](file:///H:/645_Home_map-center/rent_map_specs/phase_1_base_map.md)**
    *   建立以公司為中心的地圖、標記 25km 範圍圈與辦公室起點。
2.  **[Phase 2: 行政區劃與租金統計底圖](file:///H:/645_Home_map-center/rent_map_specs/phase_2_district_rent_heatmap.md)**
    *   繪製雙北行政區界，並以政府租金統計數據呈現漸層熱圖。
3.  **[Phase 3: 捷運系統與主要公車路線](file:///H:/645_Home_map-center/rent_map_specs/phase_3_transit_layer.md)**
    *   繪製大台北捷運線與重要站點的 GIS 通勤圖層。
4.  **[Phase 4: CSV 租屋資料導入與唯讀地圖標記](file:///H:/645_Home_map-center/rent_map_specs/phase_4_custom_rental_pins.md)**
    *   動態解析 CSV 並將租屋點標記渲染於地圖，資料存於 `localStorage`。
5.  **[Phase 5: 591 風格資訊面板與 GIS 通勤分析](file:///H:/645_Home_map-center/rent_map_specs/phase_5_details_panel_commute.md)**
    *   側邊詳細資訊欄、直線距離/捷運距離計算與自動通勤評分。
6.  **[Phase 6: 資料匯出與進階篩選](file:///H:/645_Home_map-center/rent_map_specs/phase_6_import_export_filters.md)**
    *   CSV 備份匯出與多重條件（租金、坪數、通勤時間）交叉篩選。

---

## 🛠️ 地端輔助工具

*   **[extract_591_to_csv.py](file:///H:/645_Home_map-center/extract_591_to_csv.py)**：591 租屋資訊擷取與 CSV 轉檔工具。
*   **[extract_pdf.py](file:///H:/645_Home_map-center/extract_pdf.py)**：PDF 資料抽取解析工具。
