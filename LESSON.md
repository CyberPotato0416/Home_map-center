# 🎓 Lesson: 為什麼 CSV 在 Windows Excel 中會變成亂碼？

在處理含有中文（或非 ASCII 字元）的 CSV 檔案時，最常見的問題就是**「用 Excel 開啟時變成亂碼」**。以下是本次遇到的原因與背後的技術細節：

## 1. 核心原因：Windows Excel 的編碼辨識機制
* **UTF-8（無 BOM）**：預設的現代文字編碼格式。絕大多數瀏覽器、React 前端專案、Linux/macOS 系統以及 Python 預設都會使用此格式。
* **Windows Excel (繁體中文環境)**：在 Windows 平台上，如果雙擊開啟一個 `.csv` 檔案，Excel 會預設使用系統的舊版區域編碼（在台灣為 **Big5 / CP950**）來讀取。
* **亂碼的產生**：當 Excel 嘗試用 **Big5** 去解碼一堆 **UTF-8** 編碼的中文位元組時，位元組對應的字元表完全錯位，就會產生如 `鑼`、`底`、`鎛` 等常見的繁體字型亂碼（又稱 UTF-8 盲轉 Big5 亂碼）。

---

## 2. 解決方法：加入 BOM (Byte Order Mark)
BOM 是放在文字檔案最開頭的一組特殊隱性位元組（UTF-8 的 BOM 為 `0xEF, 0xBB, 0xBF`）。

* **BOM 的作用**：它像是一個「身分識別證」，告訴開啟檔案的軟體（如 Excel）：「這是一個 UTF-8 編碼的檔案，請直接用 UTF-8 解碼！」
* **前後差異**：
  * **修改前 (Python `utf-8`)**：檔案開頭直接是 `id,title,price...` ➜ Excel 誤判為 Big5 ➜ 炸成亂碼。
  * **修改後 (Python `utf-8-sig`)**：檔案開頭多了 BOM 標記 ➜ Excel 識別出 BOM ➜ 改用 UTF-8 正常解密 ➜ 中文完美呈現。

---

## 3. 開發最佳實踐 (Best Practices)
1. **地端 Python 輸出 CSV**：
   如果 CSV 是給一般使用者在 Windows 上用 Excel 開啟的，寫入時請使用 `utf-8-sig` 編碼：
   ```python
   with open('output.csv', mode='w', encoding='utf-8-sig', newline='') as f:
       writer = csv.writer(f)
   ```
2. **網頁前端匯出 CSV (JavaScript)**：
   在前端產生下載的 Blob 時，務必手動在 CSV 字串最前面塞入 BOM 位元組：
   ```javascript
   const BOM = new Uint8Array([0xef, 0xbb, 0xbf]);
   const csvBlob = new Blob([BOM, csvString], { type: "text/csv;charset=utf-8;" });
   ```
