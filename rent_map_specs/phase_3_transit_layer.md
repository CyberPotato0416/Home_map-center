# 📋 Phase 3: 捷運系統與主要公車路線 (Transit GIS Layer)

## 🎯 開發目標
在地圖上疊加台北捷運 (MRT) 核心路網與重要站點。由於公司（築本科技）位於**民權東路三段**，最貼近的是 **文湖線（棕線）- 中山國中站** 以及 **松山新店線（綠線）/ 文湖線 - 南京復興站**。本階段的目的是讓使用者一目了然各租屋處的捷運通勤便利度。

---

## 🎨 視覺與樣式要求
1.  **捷運路線 (MRT Lines)**:
    *   以粗度 `3px` 或 `4px` 的 Polyline 繪製，顏色使用北捷官方標準色：
        *   **文湖線 (棕線 BR)**: `#9E652E`
        *   **淡水信義線 (紅線 R)**: `#E3002C`
        *   **板南線 (藍線 BL)**: `#0070BD`
        *   **松山新店線 (綠線 G)**: `#008659`
        *   **中和新蘆線 (橘線 O)**: `#F8B61C`
2.  **捷運站點 (MRT Stations)**:
    *   **直接參照台北捷運官方地圖樣式**：
        *   一般站點：外框為對應捷運路線色（粗度約 `2px`），內圈為白色實心的圓形標記 (`L.circleMarker`)，直徑 `6px`。
        *   轉乘站點：使用雙層圓圈樣式（白色實心大圓，帶黑色細框，內部包覆路線代表色的圓圈），或以特殊的環狀轉乘圖案表示，完美模擬北捷官方地圖的轉乘識別度。
        *   站名標籤：直接在地圖上以精巧的 sans-serif 字型 (如微軟正黑體、Inter) 呈現於站點旁，滑鼠移過時加粗顯示並顯示轉乘資訊。
3.  **圖層控制開關 (Layer Control)**:
    *   **不要使用** Leaflet 原生的右上角浮動控制元件 `L.control.layers`。
    *   必須將圖層控制開關整合為**右側折疊面板（Sidebar）的「TAB 3 (圖層設定)」**。
    *   在 TAB 3 面板內提供精美的開關 (Toggle Switches) 或複選框：
        *   [ ] 顯示/隱藏 行政區套房租金底圖
        *   [ ] 顯示/隱藏 捷運路網折線
        *   [ ] 顯示/隱藏 捷運站點標記
    *   透過 JS 監聽這些 UI 控制項，當狀態改變時動態在 `map` 上添加/移除對應的 Layer Group，保持地圖畫面乾淨。

---

## 🗃️ 完整捷運圖資來源 (GeoJSON 檔案下載與本機儲存)
為了實現**全部五大捷運線路所有站點的完整繪製**，不採用寫死在程式碼中的簡化資料。我們使用台北市政府開放資料所整理的完整捷運 GIS 數據，請引導 `AI.dev` 將以下 GeoJSON 檔案下載並儲存於本機專案的 `data/`（或 `public/data/`）目錄下：

1.  **捷運路線線段資料 (Routes GeoJSON)**：
    *   **檔案名稱**：`mrt_routes.geojson`
    *   **下載來源**：[leoluyi/taipei_mrt - routes.geojson](https://raw.githubusercontent.com/leoluyi/taipei_mrt/master/routes.geojson) (整理自官方資料，包含完整的線路折線坐標)
2.  **捷運站點點位資料 (Stations GeoJSON)**：
    *   **檔案名稱**：`mrt_stations.geojson`
    *   **下載來源**：[leoluyi/taipei_mrt - stations.geojson](https://raw.githubusercontent.com/leoluyi/taipei_mrt/master/stations.geojson) (整理自官方資料，包含全部車站座標、站名與對應的路線名稱)

---

## 🛠️ 實作步驟指引

### 1. 動態讀取與繪製捷運折線 (Routes Layer)
*   使用 `fetch('data/mrt_routes.geojson')` 讀取捷運路線資料。
*   利用 Leaflet 的 `L.geoJSON` 載入路線：
    *   **線條著色**：讀取每個特徵 (Feature) 中的屬性（例如線路名稱 `name` 或 `line_code`），對應設定為台北捷運的五大官方色彩（如 `文湖線` 用 `#9E652E`，`板南線` 用 `#0070BD`，以此類推）。
    *   **線條粗度**：邊線粗度設為 `3.5px`，以確保路網連貫清晰。
*   將路線圖層存入 `mrtLinesLayer` 變數（`L.layerGroup`）。

### 2. 動態讀取與標記捷運站點 (Stations Layer)
*   使用 `fetch('data/mrt_stations.geojson')` 讀取站點點位資料。
*   利用 `L.geoJSON` 載入站點，並使用 `pointToLayer` 函數將點渲染成 `L.circleMarker`：
    *   **外觀著色**：依據站點所屬的線路，套用對應的捷運色。若該站為多線交會的「轉乘站」，則渲染為白色大圓（`radius: 5`，外框 `weight: 2` 帶黑色 `#000000` 邊線，內部包覆代表色圓圈）以對應台北捷運官方地圖轉乘圖標。
    *   **永久站名標籤**：使用 `L.tooltip` 設定 `permanent: true, direction: 'right', className: 'mrt-station-label'`，直接在地圖上常態性顯示站名（如「南京復興」、「中山國中」），字型設為精美的 sans-serif，字體大小隨 zoom 級別自適應或保持精巧（如 `10px`），避免雜亂。
*   將所有站點圖層存入 `mrtStationsLayer` 變數（`L.layerGroup`）。

### 3. 綁定右側面板 TAB 3 自訂圖層控制器
*   在右側折疊面板（Sidebar）的 TAB 3 結構中加入三個開關（如 HTML Checkbox 搭配 CSS 設計成 Toggle Switch 樣式）。
*   在 JS 中為這三個開關綁定 `change` 事件監聽器：
    *   **行政區套房租金底圖開關**：切換時對 `geojsonLayer` 呼叫 `addTo(map)` 或 `remove()`。
    *   **捷運路網開關**：切換時對 `mrtLinesLayer` 呼叫 `addTo(map)` 或 `remove()`。
    *   **捷運站點開關**：切換時對 `mrtStationsLayer` 呼叫 `addTo(map)` 或 `remove()`。

---

## 🏁 階段驗收標準
- [ ] 捷運路線與站點（特別是貫穿公司附近的棕線與綠線）以正確的官方代表色與外圈樣式顯示在地圖上，一般站與轉乘站外觀區分明確，符合台北捷運官方圖示風格。
- [ ] 重要捷運站點旁有清晰的站名文字，滑鼠移入能看到精美的線路徽章與轉乘提示。
- [ ] 地圖右上角沒有出現 Leaflet 原生的 `L.control.layers` 浮動按鈕。
- [ ] 點擊右側折疊面板的 **TAB 3 (圖層設定)**，能透過精美的開關獨立控制「行政區套房租金底圖」、「捷運路線」與「捷運站點」的顯示與隱藏，切換時地圖無卡頓且即時更新。
