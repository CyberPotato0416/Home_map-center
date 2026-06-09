# 📋 Phase 5: 591 風格資訊面板與 GIS 通勤分析 (Details Panel & Commute Scoring)

## 🎯 開發目標
當使用者點擊地圖上的任意租屋標記 (Pin) 時，右側的面板 (`#sidebar`) 會展開並動態更新，呈現該房屋的完整相片、價格細節、優缺點標籤等類似 591 租屋網的排版。同時，系統會**自動利用 GIS 座標運算**算出該租屋點到「公司 (築本科技)」與「最近捷運站」的距離，自動推算通勤時間與綜合分數。

---

## 🎨 資訊面板 UI 設計 (591 Style Detail Card)
右側邊欄面板應包含以下區塊：
1.  **房屋相片輪播 (Image Gallery)**: 顯示上傳的照片，若無照片則顯示精美的預設房屋插圖。
2.  **動態指標屬性網格 (Dynamic Metrics & Custom Attributes)**:
    *   **核心大字**：大字粗體顯示月租金 (e.g. `NT$ 16,500 / 月`)。
    *   **自訂屬性網格 (Dynamic Grid)**：遍歷並渲染所有其他從 CSV 讀入的自訂欄位屬性（排除已在地圖或標題中顯示的核心欄位如 `lat`, `lng`, `price`, `title`, `image_urls` / `images`、`pros`, `cons` 相關屬性）。
    *   不寫死任何指標名稱，自動將剩餘的 CSV 自訂欄位鍵值對（如 `坪數`、`樓層`、`房型`、`押金`、`寵物規定` 等）繪製成雙欄資訊表格或屬性標籤卡。
    *   **動態計算**：若屬性中包含「坪數」相關欄位，自動結合月租金計算並顯示「單坪租金」（租金 / 坪數）。
3.  **都市 GIS 通勤指標卡 (GIS Analytics Badge)**:
    *   **距公司距離**: 自動計算並顯示與公司之間的直線距離（公里/公尺）。
    *   **最近捷運站**: 顯示最近站名與距離 (公尺)。
    *   **通勤評分 (Commute Score)**: 根據距離公司與捷運站的遠近，綜合給出 `0 - 100` 分。
4.  **優缺點標籤 (Tags)**: 綠色膠囊代表優點，紅色膠囊代表缺點。
5.  **詳細備忘錄與操作區**:
    *   備份註記文字框 (唯讀顯示)。
    *   「🌐 前往 591 原始網頁」按鈕 (另開分頁)。
    *   【註】因本系統採用 CSV 本地匯入覆蓋機制，此面板為唯讀展示，**不提供**「編輯欄位」或「刪除紀錄」按鈕。


---

## 📐 GIS 距離與通勤演算法 (Haversine Formula)
請引導 `AI.dev` 在 `app.js` 中實現 **Haversine 距離公式**，來計算兩點經緯度間的實際地理距離 (公尺)：

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半徑 (公尺)
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 回傳公尺數
}
```

### 🚇 最近捷運站計算
*   在載入特定租屋點時，遍歷已自 GeoJSON 載入並儲存的捷運站點陣列（例如在載入 `mrt_stations.geojson` 時，將其 stations 特徵存入全域變數 `mrtStationsData` 中），計算租屋點與各捷運站的距離，找出距離最近的車站，並回傳其名稱與距離。

---

## 🛠️ 實作步驟指引

### 1. 建立側邊欄資訊渲染函數 (動態屬性繪製)
*   撰寫 `renderDetailPanel(rental)` 函數，將選中的 `rental` 物件各項屬性動態寫入右側 DOM。
*   **動態渲染自訂欄位**：取得 `rental` 物件後，過濾掉 `lat`, `lng`, `price`, `title`, `image_urls`, `pros`, `cons`, `notes` 等已在特定區塊渲染的核心屬性，將剩餘的自訂鍵值對（Key-Value）以 `Object.entries(rental)` 遍歷，動態生成 HTML 填入「自訂屬性網格」中。
*   如果沒有選中點位，則顯示預設提示畫面：「*請點選地圖上的租屋點，或於右側面板匯入租屋 CSV 檔案來檢視通勤分析。*」。


### 2. 動態計算與寫入 GIS 指標
*   當點位被點擊時：
    1.  計算 `distToOffice = calculateDistance(rental.lat, rental.lng, 25.0617, 121.5435)`。
    2.  遍歷自 GeoJSON 載入的捷運站點資料（`mrtStationsData`），找出最近的一站 `nearestMrt` 與 `distToMrt`。
    3.  計算通勤分數 `Commute Score = Math.max(0, 100 - (distToOffice / 100) - (distToMrt / 20))`。
    4.  將以上結果渲染到側邊欄。


---

## 🏁 階段驗收標準
- [ ] 點擊地圖上的價格標記後，右側側邊欄能滑出或更新為該物件的詳細資料卡片。
- [ ] 側邊欄正確顯示相片輪播與單坪租金。
- [ ] 側邊欄自動顯示該點離築本科技的直線距離（公里或公尺）。
- [ ] 側邊欄自動顯示最近捷運站（如「中山國中站 (250m)」）與通勤綜合分數。
