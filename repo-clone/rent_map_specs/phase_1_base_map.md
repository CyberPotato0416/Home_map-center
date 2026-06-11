# 📋 Phase 1: 基礎地圖與核心標記 (Base Map & Company Center)

## 🎯 開發目標
建立本專案的基本網頁結構，並初始化 Leaflet.js 地圖。地圖必須以 **築本科技 (ZenithBIM) 台北辦公室** 為中心，並在周邊畫出半徑 25 公里的關注範圍線，以及一個具有呼吸燈特效的「公司位置標記」。

---

## 🎨 視覺與排版要求
1.  **版面配置 (Layout)**:
    *   全螢幕響應式佈局 (無捲軸)。
    *   左側為地圖容器 (`#map-container`)，預設寬度佔滿剩餘空間。
    *   右側為資訊控制台與屬性面板 (`#sidebar`)，預設寬度約為 25% (或固定 350px - 400px)。
    *   **側邊欄折疊功能 (Collapsible Sidebar)**：
        *   不論是電腦或平板模式，右側面板必須可自由折疊（類似 BIM/CAD 軟體的屬性控制台或專案瀏覽樹）。
        *   需要在面板左側邊緣或地圖右上角設計一個精美的折疊按鈕（如 `id="btn-toggle-sidebar"`，可使用 `◀` / `▶` 或 `hamburger/close` 圖示）。
        *   折疊時，`#sidebar` 透過 CSS 轉場平滑滑出螢幕右側（`transform: translateX(100%)` 或寬度縮減為 `0`），地圖容器自動擴展至 100% 寬度。
        *   **關鍵 GIS 處理**：當側邊欄收合或展開時，必須在 CSS 動畫結束後（或監聽 transitionend）在 JS 中調用 **`map.invalidateSize()`**，否則地圖渲染區域會產生偏移或拉伸變形。
    *   **左上角漂浮資訊卡折疊功能 (Collapsible Floating Info Card)**：
        *   地圖左上角浮動顯示的「公司中心點與半徑資訊卡」，不得在縮放或平移地圖時卡住視野。
        *   該資訊卡本身**必須具備折疊/收合按鈕**（例如在卡片左上角或右上角設計一個微型的 `▼` / `▲` 或減號按鈕）。
        *   點擊收合時，卡片資訊本體（如詳細地址、經緯度與半徑文字）應以滑動或淡出動畫隱藏，將卡片最小化（僅保留一個精巧的圖示如 `🏢` 或 `ℹ️`）；點擊展開時恢復原樣，確保隨時保持地圖最大可視範圍。
2.  **設計風格 (Aesthetics)**:
    *   **深色科技感模式 (Dark Mode)**。
    *   地圖底圖採用 CartoDB Dark Matter 樣式，避免刺眼的白色地圖。
    *   邊框與面板使用半透明的玻璃摩砂效果 (`backdrop-filter: blur(10px)`)，搭配細微的漸層線條。

---

## 📂 檔案目錄結構
請在專案根目錄下建立以下三個檔案：
```
├── index.html     # 網頁結構
├── style.css      # 樣式表 (CSS)
└── app.js         # JavaScript 邏輯 (ESM 模組化)
```

---

## 🛠️ 實作細節說明

### 1. `index.html` 結構
*   引入 Leaflet 官方 CSS 與 JS CDN：
    *   `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
    *   `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
*   引入 Google Fonts 提升字體質感 (例如 `Outfit` 或 `Inter`)。
*   主體區分為 `#map-container` 與 `#sidebar`。
*   **系統品牌與頁尾標示 (Branding & Footer)**:
    *   面板頂部主標題應設計為「**591Premium 租屋通勤分析系統**」（或簡稱 **591Premium**）。
    *   面板最右下角（或頁尾）的標示，必須改為「**591Premium**」，**不得**出現「築本公司」或「ZenithBIM Corp.」等公司字樣，強調此專案為個人客製化的租房研究系統。


### 2. `style.css` 樣式設定
*   重設 margins，將 `html, body` 設為 `height: 100%; overflow: hidden;`。
*   使用 CSS 變數定義科技感色彩系統：
    ```css
    :root {
      --bg-dark: #0d0e12;
      --panel-bg: rgba(22, 24, 30, 0.8);
      --accent-color: #00f0ff; /* 科技青藍 */
      --danger-color: #ff3860; /* 警示紅 */
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --border-color: rgba(255, 255, 255, 0.1);
    }
    ```
*   為公司 Marker 撰寫一組 CSS 呼吸燈與波紋擴散動畫，當點位放置在地圖上時會不斷向外擴散青藍色波紋：
    ```css
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 0.4; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    ```

### 3. `app.js` 地圖邏輯
*   **地圖初始化**:
    *   中心點設為築本科技座標：`[25.0617, 121.5435]`。
    *   初始縮放層級 (Zoom Level) 設為 `11` 或 `12`。
*   **載入 Dark Mode 底圖**:
    *   使用 CartoDB Dark Matter 的 Tile URL：
        `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
        (Attribution: `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>`)
*   **繪製與控制 25km 關注範圍線**:
    *   在中心點 `[25.0617, 121.5435]` 繪製一個 Leaflet 圓形 (`L.circle`)。
    *   **半徑範圍與拉桿控制**：
        *   系統應提供一個「關注範圍半徑拉桿 (Slider)」，其數值設定區間必須限制在 **`5km ~ 25km`** 之間（例如 `min="5"`, `max="25"`, `step="1"`，預設值可為 `25` 或是使用者選定值）。
        *   **效能優化事件驅動設計**：
            *   **拖動拉桿時 (Dragging - `input` 事件)**：僅即時更新 UI 上的公里數文字（例如讓 `25 km` 變為 `15 km`），為使用者提供流暢的預覽數值，**此時不更新地圖圓圈半徑**。
            *   **釋放滑鼠後 (Released - `change` 事件)**：當使用者鬆開滑桿、確認數值後，才觸發 Leaflet 地圖關注圈半徑的重繪（`focusCircle.setRadius(value * 1000)`）。如此可避免拖動過程中因高頻率重繪 Leaflet 圖層與進行連動運算導致網頁卡頓甚至當機。
        *   圓圈預設半徑為 **25,000 公尺 (25km)**。
    *   樣式：虛線 (`dashArray: "6, 6"`), 顏色選用淡紅色或科技青藍，極高透明度填滿 (`fillOpacity: 0.03` - `0.05`)。
*   **添加公司標記**:
    *   在中心點添加一個 `L.marker` 或 `L.divIcon`，套用上述寫好的 CSS 呼吸動畫 Class。
    *   Popup 提示文字內容：「**築本科技股份有限公司 (台北辦公室)**」。
*   **「重新聚焦公司中心點」按鈕 (Re-focus Button)**:
    *   在右側面板中放置一個按鈕（例如 `id="btn-recenter"`），文字為「🎯 返回公司中心點」。
    *   點擊後，地圖**不得**使用 `map.setView([lat, lng], fixedZoom)` 固定縮放比例。
    *   **正確做法**：呼叫 `map.fitBounds(focusCircle.getBounds(), { padding: [10, 10] })`。
        *   `focusCircle` 是關注虛線圓圈物件，必須以變數保存。
        *   **邊距微調**：為了讓範圍圓圈極致貼近地圖邊緣（減少不必要的空白），請將 `padding` 縮小至 `[10, 10]`（或 `[5, 5]`），使其邊距距離縮小一半，貼合視窗邊界。
    *   效果：無論使用者目前縮放或平移到任何位置，按下按鈕後地圖都會流暢動畫縮放至「**以公司為中心、關注半徑圓圈恰好貼滿視窗**」的最佳比例。
    *   範例代碼：
        ```javascript
        // 建立 25km 關注圓圈並保存到變數
        const focusCircle = L.circle([25.0617, 121.5435], {
          radius: 25000,
          color: '#ff3860',
          weight: 2,
          dashArray: '8, 8',
          fillOpacity: 0.03
        }).addTo(map);

        // 監聽拉桿變動
        const rangeSlider = document.getElementById('range-slider');
        // 1. 拖動時：僅即時更新 UI 上的公里數文字顯示
        rangeSlider.addEventListener('input', (e) => {
          document.getElementById('range-value').innerText = `${e.target.value} km`;
        });
        // 2. 釋放滑鼠後：才觸發地圖圓圈半徑重繪
        rangeSlider.addEventListener('change', (e) => {
          const kms = parseInt(e.target.value);
          focusCircle.setRadius(kms * 1000);
        });

        // 右側按鈕點擊事件
        document.getElementById('btn-recenter').addEventListener('click', () => {
          // padding 設為 10px 讓虛線圈圈更貼近邊界
          map.fitBounds(focusCircle.getBounds(), { padding: [10, 10], animate: true });
        });
        ```

---

## 🏁 階段驗收標準
- [ ] 頁面載入後，呈現滿版深色地圖，且無瀏覽器捲軸。
- [ ] 地圖中心精準對齊台北市民權東路三段 (築本科技)，並有專屬圖示與呼吸擴散燈效。
- [ ] 地圖上清晰呈現一個虛線範圍圓圈，且半徑設定拉桿 (Slider) 的選擇區間被嚴格限制在 **`5km ~ 25km`** 內，點動或拖移能即時改變圓圈半徑。
- [ ] 點擊公司標記能跳出氣泡視窗，正確顯示公司名稱。
- [ ] 右側面板能夠正常顯示，排版不會被地圖擠壓變形。
- [ ] 面板右下角（或頁尾）已改為「**591Premium**」，並移除所有「築本公司」與「ZenithBIM Corp.」等字樣。
- [ ] **右側面板折疊功能**：點擊折疊按鈕時，右側控制台能平滑收合，地圖寬度自動擴展至 100%；且收合/展開時地圖比例正常、不產生拉伸變形（需正確調用 `map.invalidateSize()`）。
- [ ] **左上角漂浮資訊卡折疊功能**：資訊卡上設有微型收合/展開按鈕，點擊後能將卡片最小化（僅保留圖示/小標題），不遮擋地圖主體視野，且能順暢展回原樣。
- [ ] 「🎯 返回公司中心點」按鈕存在，且點擊後地圖以動畫方式縮放至 **當前設定的關注半徑虛線圓圈（最大 25km）恰好貼近視窗邊緣** 的比例（採用 `fitBounds` 且 `padding` 設定在 `[10, 10]` 左右，使紅圈極致貼合邊框）。
- [ ] **驗證關鍵**：先手動將地圖縮放至街道級（Zoom 16+）或大幅平移至外縣市，按下按鈕後，地圖必須正確縮放回該虛線圓圈的完整視角，而非跳回固定的縮放層級。
