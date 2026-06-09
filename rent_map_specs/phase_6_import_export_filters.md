# 📋 Phase 6: 資料匯出與進階篩選 (CSV Export & Advanced Filtering)

## 🎯 開發目標
進入系統的最後收尾階段。為了解決「591 資料可能丟失」的終極痛點，我們需要提供完整的 **CSV 檔案備份與導出功能**，讓使用者能夠將所有在系統中分析過、計算過通勤距離與評分的租屋資料，重新導出為本機試算表 (.csv 格式) 進行備份或在 Excel 中進行二次編輯。同時，開發一套**進階交叉篩選器**，動態過濾並顯示符合預算、坪數、通勤距離與關鍵字的點位。

---

## 🎨 篩選器與控制元件設計 (TAB 5 Layout)
1.  **控制台按鈕 (Control Buttons)**:
    *   **側邊欄 TAB 5**：本階段的所有匯出/匯入按鈕與篩選器皆統一放置於 **側邊欄 TAB 5 (篩選與備份)**：
        *   `📥 匯入租屋 CSV (Import CSV)`: (此為 Phase 4 核心按鈕，在此階段統一移至或整合於 TAB 5 中)
        *   `📤 匯出租屋 CSV (Export CSV)`: 點擊後瀏覽器自動將當前 `localStorage` 內的所有租屋點位與 GIS 計算數據，包裝下載為 `rentals_export_[日期].csv`。
2.  **進階篩選器面板 (Filter Panel - 放置於 TAB 5)**:
    *   **預算上限滑桿 (Max Budget)**: 區間 NT$ 8,000 - NT$ 18,000，預設拉到最大值。
    *   **最小坪數滑桿 (Min Size)**: 區間 5 坪 - 10 坪，步進級距為 0.5 坪 (e.g. `step="0.5"`), 預設拉到最小值。
    *   **最大通勤距離 (Max Distance)**: 區間 5 公里 - 25 公里（對應 25km 關注圈，以 5km 為起點數值），控制點位到公司中心點的距離。
    *   **關鍵字搜尋框 (Search Bar)**: 可對「標題」、「優缺點標籤」與「備案備忘錄」進行模糊搜尋。
3.  **地圖聯動**:
    *   當任何篩選條件改變時，不符合條件的價格標記 (Price Marker) 必須立刻從地圖隱藏 (removeLayer)，符合的點位則重新顯示 (addTo)。

---

## 🛠️ 實作步驟指引

### 1. 實現 CSV 格式匯出 (Export CSV)
*   遍歷 `localStorage` 中的租屋 JSON 陣列，轉換回標準的 CSV 字串格式：
    ```javascript
    function exportToCSV() {
      const rentals = JSON.parse(localStorage.getItem('my_rental_pins') || '[]');
      if (rentals.length === 0) return alert('目前沒有可匯出的租屋資料！');
      
      const headers = ['title', 'price', 'size_ping', 'floor', 'type', 'lat', 'lng', 'source_591_url', 'image_urls', 'pros', 'cons', 'notes'];
      const csvRows = [headers.join(',')];
      
      for (const row of rentals) {
        const values = headers.map(header => {
          let val = row[header] || '';
          // 若欄位為陣列 (如 images, pros, cons)，以分號串接方便 Excel 讀取
          if (Array.isArray(val)) val = val.join(';');
          // 處理數值含有逗號的字串逃逸，避免破壞 CSV 結構
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }
      
      const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' }); // 加上 UTF-8 BOM 避免 Excel 開啟亂碼
      const url = URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rentals_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    }
    ```

### 2. 動態交叉篩選邏輯 (Filter Logic)
*   撰寫 `filterRentals()` 函數：
    1.  取得當前預算、坪數、通勤距離滑桿的數值，以及關鍵字輸入字串。
    2.  遍歷所有已加載的地圖 Marker 實例。
    3.  比對該點位之原始屬性：
        *   租金是否 $\le$ 預算上限。
        *   坪數是否 $\ge$ 最小坪數。
        *   到公司距離（利用已算的 `distToOffice`）是否 $\le$ 最大距離。
        *   關鍵字（轉小寫）是否出現在名稱、優缺點標籤或備忘錄中。
    4.  符合所有條件則 `marker.addTo(map)`，否則 `map.removeLayer(marker)`。
*   為每個篩選器的 UI 元件綁定 `input` 或 `change` 事件，即時驅動過濾動作。

---

## 🏁 階段驗收標準
- [ ] 匯入、匯出按鈕與所有進階篩選器（預算、坪數、距離、關鍵字），皆已完整整合於側邊欄 **TAB 5 (篩選與備份)**。
- [ ] 點擊「匯出租屋 CSV」按鈕，能成功下載副檔名為 `.csv` 且帶 UTF-8 BOM 的檔案，用 Excel 或 Google 試算表開啟時，中文字型正常且各個欄位排列整齊。
- [ ] 將導出的 CSV 重新匯入系統，地圖點位能完美還原，且無重複點位或解析錯誤。
- [ ] 拖動篩選器（預算、坪數、距離）或輸入關鍵字搜尋時，地圖上的價格標記會即時過濾（隱藏/顯示），沒有任何渲染延遲。
