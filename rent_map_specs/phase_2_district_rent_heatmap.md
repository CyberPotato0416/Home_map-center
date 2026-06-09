# 📋 Phase 2: 行政區劃與租金統計底圖 (District Heatmap & Rental Levels)

## 🎯 開發目標
在地圖疊加雙北市行政區界線 (GeoJSON)，並根據各行政區的 **「套房 (Suites) 平均月租金」** 進行漸層色彩著色，藉此快速篩選高性價比 (CP 值) 或高負擔區域。

---

## 🎨 視覺與互動設計
1.  **漸層莫蘭迪灰度粉彩著色法 (Stepped Morandi Choropleth Map)**:
    *   為了避免色彩過於刺眼，本專案採用**帶灰度且優雅的「莫蘭迪粉彩色系」**，並改為**每 1,000 元租金差距即進行顏色遞增漸層變化**，以大幅提升行政區地圖的色彩鑑別度。
    *   我們定義四個基礎核心價位點，並在區間內以 **1,000 元為一階進行色彩線性插值 (LERP)**：
        *   **`$8,000` (含以下)**: 灰鼠尾草綠 (Dusty Sage Green, `#8FA08B`)，代表 NT$ 8,000 起的平價區間。
        *   **`$12,000`**: 灰藍色 (Muted Slate Blue, `#7B8FA7`)，代表 NT$ 12,000 起的中階區間。
        *   **`$16,000`**: 香檳金褐 (Muted Gold-Tan, `#C2A87E`)，代表 NT$ 16,000 起的高階區間。
        *   **`$20,000` (含以上)**: 乾燥玫瑰粉 (Dusty Rose Pink, `#C08A93`)，代表 NT$ 20,000 起的高價精華區。
    *   例如：`$9,000`、`$10,000`、`$11,000` 會是介於「鼠尾草綠」到「灰藍色」之間的漸變過渡色，讓地圖呈現溫和、高級且層次分明的微漸層視覺效果。
    *   **填滿不透明度 (`fillOpacity`)**: 設為 `0.2` (即 80% 透明度)。由於莫蘭迪色調有灰度，若不透明度太高會遮擋街道文字。設為 `0.2` 能讓底圖的街道、地標文字等資訊清晰透出。
2.  **動態互動 (Interactive Elements)**:
    *   滑鼠移入行政區：高亮邊框，並顯示半透明懸浮視窗 (Tooltip/Popup)。
    *   氣泡內容呈現實用的統計資訊，並自動計算推薦月薪（以租金佔月薪 30% 的財務健康標準估算）：
        *   例：「**松山區** | 套房平均月租金：NT$ 18,000 | 建議月薪：> NT$ 60,000」
        *   例：「**淡水區** | 套房平均月租金：NT$ 8,500 | 建議月薪：> NT$ 28,300」
3.  **雙北租金熱圖說明圖例 (Collapsible Heatmap Legend Widget)**:
    *   在畫面的**右下角**（或合適位置）放置一個獨立的租金圖例懸浮面板。
    *   **標題與去遊戲化**：圖例標題定為「**雙北租金熱圖說明**」。
    *   **可折疊機制 (Collapsible)**：
        *   圖例面板的右上角或標題列必須具備一個微型的收合/展開按鈕（例如 `▼` / `▲` 或 `+` / `-` 圖示）。
        *   點擊收合時，圖例面板平滑折疊縮小，僅保留標題與小圖示（例如只顯示 `📊 租金圖例` 或是收摺成一個精緻的毛玻璃小圓鈕），避免遮擋右下角地圖範圍。
        *   點擊展開時，平滑展開還原顯示完整的租金區階漸變色階對照表。

---

## 📊 靜態行政區套房租金對照表 (靜態 JSON 結構)
> **備註**：此表格數據皆以**「獨立套房 / 分租套房」**的平均月租金行情為標準，而非整層住家的價格。

請將以下資料寫入 `app.js` 或獨立的 `district_rent.json`，用於渲染著色：

```javascript
const districtRentData = {
  // 臺北市
  "大安區": { rent: 20000 },
  "信義區": { rent: 21000 },
  "松山區": { rent: 18000 },
  "中山區": { rent: 17000 },
  "中正區": { rent: 17500 },
  "內湖區": { rent: 16000 },
  "南港區": { rent: 16500 },
  "士林區": { rent: 14000 },
  "大同區": { rent: 14500 },
  "萬華區": { rent: 13500 },
  "文山區": { rent: 13500 },
  "北投區": { rent: 13000 },
  // 新北市 (篩選離公司較近的精華區)
  "板橋區": { rent: 14000 },
  "永和區": { rent: 13000 },
  "中和區": { rent: 12000 },
  "三重區": { rent: 12500 },
  "新店區": { rent: 13000 },
  "汐止區": { rent: 12000 },
  "新莊區": { rent: 11500 },
  "蘆洲區": { rent: 11000 },
  "土城區": { rent: 10500 },
  "林口區": { rent: 10000 },
  "淡水區": { rent: 8500 }
};
```

---

## 🛠️ 實作步驟指引

### 1. 取得與儲存雙北行政區 GeoJSON (拒絕幾何八邊形近似)
*   **【重要限制】絕對禁止使用任何人工幾何近似圖形**：不允許使用正八邊形 (Octagon)、正六邊形、或以行政區經緯度為圓心的圓圈覆蓋圖來代表行政區。行政區必須是真實的、非重疊的自然行政區界多邊形 (Polygon/MultiPolygon)，由真實的 GIS 數據繪製而成。
*   **本地圖資儲存策略 (推薦)**：
    *   請下載台灣開源行政區劃 GeoJSON 檔。例如 g0v 釋出的鄉鎮市區界線 JSON：
        `https://raw.githubusercontent.com/g0v/twgeojson/master/json/twTown1982.json`
    *   **本地過濾**：因為全台行政區檔案偏大，請在開發階段手動過濾或編寫過濾指令，僅篩選 `COUNTYNAME` 為 `臺北市` 與 `新北市` 的所有行政區，將篩選後得到的資料儲存為：
        `data/taipei_new_taipei_districts.geojson` (過濾後體積僅約 350KB)。
    *   在前端程式碼中，使用 `fetch('data/taipei_new_taipei_districts.geojson')` 載入這份已過濾的本機檔案，並透過 `L.geoJSON()` 直接渲染成精確、相連而不相交的板塊。


### 2. 著色與圖層邏輯 (`app.js`)
*   撰寫每 1,000 元租金區間進行顏色漸變插值（LERP）的著色函數：
    ```javascript
    // 莫蘭迪核心色階點
    const MORANDI_PALETTE = {
      8000: '#8FA08B',  // 灰鼠尾草綠 (Dusty Sage Green)
      12000: '#7B8FA7', // 灰藍色 (Muted Slate Blue)
      16000: '#C2A87E', // 香檳金褐 (Muted Gold-Tan)
      20000: '#C08A93'  // 乾燥玫瑰粉 (Dusty Rose Pink)
    };

    // 顏色線性插值 (LERP) 輔助函數
    function lerpColor(color1, color2, factor) {
      const r1 = parseInt(color1.substring(1, 3), 16);
      const g1 = parseInt(color1.substring(3, 5), 16);
      const b1 = parseInt(color1.substring(5, 7), 16);
      
      const r2 = parseInt(color2.substring(1, 3), 16);
      const g2 = parseInt(color2.substring(3, 5), 16);
      const b2 = parseInt(color2.substring(5, 7), 16);
      
      const r = Math.round(r1 + factor * (r2 - r1));
      const g = Math.round(g1 + factor * (g2 - g1));
      const b = Math.round(b1 + factor * (b2 - b1));
      
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    // 動態計算每 1000 元差距的莫蘭迪色
    function getColor(rent) {
      // 限制租金在 8,000 ~ 20,000 元之間，並四捨五入到最近的 1,000 元階梯
      const roundedRent = Math.max(8000, Math.min(20000, Math.round(rent / 1000) * 1000));
      
      if (roundedRent <= 8000) return MORANDI_PALETTE[8000];
      if (roundedRent >= 20000) return MORANDI_PALETTE[20000];
      
      if (roundedRent < 12000) {
        const factor = (roundedRent - 8000) / 4000;
        return lerpColor(MORANDI_PALETTE[8000], MORANDI_PALETTE[12000], factor);
      } else if (roundedRent < 16000) {
        const factor = (roundedRent - 12000) / 4000;
        return lerpColor(MORANDI_PALETTE[12000], MORANDI_PALETTE[16000], factor);
      } else {
        const factor = (roundedRent - 16000) / 4000;
        return lerpColor(MORANDI_PALETTE[16000], MORANDI_PALETTE[20000], factor);
      }
    }
    ```
*   撰寫 `style(feature)` 函數，讀取 feature 中對應的區名 (`TOWNNAME` 或 `T_Name`，依 GeoJSON 欄位而定)，若在 `districtRentData` 中有對應值，則呼叫 `getColor(rent)` 設定其填滿顏色 (`fillColor`)，否則設為透明。
*   樣式細節：
    *   邊框顏色: `rgba(255, 255, 255, 0.2)`
    *   邊框寬度: `1px`
    *   填滿不透明度 (`fillOpacity`): `0.2` (設定為 80% 的透明度，能讓色彩呈現淡雅高級感，同時完全不遮蓋底層的街道線條、建築名稱與地圖文字資料)


### 3. 滑鼠互動功能 (`onEachFeature`)
*   **`mouseover`**: 將滑鼠移入的圖層樣式加粗邊框，例如 `weight: 3`、`color: var(--accent-color)`，並置頂顯示。
*   **`mouseout`**: 移開後恢復原始著色樣式。
*   **`click`**: 點擊行政區時，地圖自動 zoomTo 該區域的 bounding box (`map.fitBounds(e.target.getBounds())`)。

---

## 🏁 階段驗收標準
- [ ] 雙北市行政區成功加載，呈現出真實、非重疊的行政邊界多邊形 (Polygon/MultiPolygon)，**絕對禁止**以正八邊形或圓形等數學網格近似表示。
- [ ] 各行政區根據**套房平均租金**，呈現出低調雅致的**「灰鼠尾草綠、灰藍色、香檳金褐色、乾燥玫瑰粉色」**等莫蘭迪半透明色塊，底部的道路線條依然清晰可辨。
- [ ] 滑鼠滑過行政區時，會觸發高亮邊框，且彈出顯示行政區名稱、套房平均租金與建議月薪（依租金佔 30% 估算）。
- [ ] 點擊任何行政區，地圖會平滑縮放聚焦至該區。
- [ ] 畫面右下角設有「雙北租金熱圖說明」圖例，且具備微型折疊/展開按鈕，點擊後能將圖例最小化，不遮擋地圖視野。
