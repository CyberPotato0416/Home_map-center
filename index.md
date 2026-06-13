# 🗺️ 租屋資料與本地圖片對應關係說明 (index.md)

本文件說明在地端開發環境及部署到 `ai.dev` (雲端沙盒環境) 時，物件資料 CSV 與本地下載圖片的對應與載入機制。

---

## 📁 檔案與路徑對應關係

| 本地開發路徑 (地端) | `ai.dev` 伺服器映射路徑 (網頁靜態資源) | 說明 |
| :--- | :--- | :--- |
| `H:\645_Home_map-center\public\rentals_import.csv` | `/rentals_import.csv` | 主要的租屋物件資料庫，包含物件名稱、價格、經緯度、ID 以及相對圖片路徑等。 |
| `H:\645_Home_map-center\public\rentals_images\` | `/rentals_images/` | 靜態照片根目錄。每個物件都有一個以其 `original_591_id` 命名的資料夾。 |
| `H:\645_Home_map-center\public\rentals_images\renco_41963\` | `/rentals_images/renco_41963/` | 範例：Renco #41963 物件的照片資料夾。 |

> [!NOTE]
> 由於 Vite/React 專案的靜態資源目錄設定為 `public/`，當專案打包或運行 dev server 時，`public/` 底下的所有檔案都會被映射至伺服器的**根路徑**下（即原本 `public/rentals_images/` 在網頁中存取時僅需寫 `/rentals_images/`）。

---

## 🔍 側邊欄圖片載入與呈現邏輯

側邊欄的圖片輪播模組定義在 [RentalImageGallery.tsx](file:///H:/645_Home_map-center/src/components/RentalImageGallery.tsx)。其運作方式如下：

### 1. 取得物件識別碼 (`idValue`)
圖片模組會依序嘗試取得物件的 ID 作為資料夾名稱：
1. 先讀取物件自訂欄位 `rental.customFields.original_591_id` (例如 `renco_41963` 或 `21414812`)。
2. 若無，則透過 Regex 從物件詳情連結 `rental.link` 提取 ID。
3. 若皆無，則使用系統內部的 `rental.id`。

### 2. 解析本地圖片路徑
在輪播切換圖片時，程式會動態拼接靜態路徑：
```typescript
const localPath = `/rentals_images/${idValue}/image_${currentImgIndex + 1}.${activeExt}`;
```
* **第一張圖**對應：`/rentals_images/renco_41963/image_1.jpg`
* **第二張圖**對應：`/rentals_images/renco_41963/image_2.jpg`
*(依此類推)*

### 3. 自動防錯與重試機制 (Error Handling)
為防範圖片格式不一致 (如 `.jpg` 或 `.png`) 以及雲端沙盒檔案未完全同步的問題，[RentalImageGallery.tsx](file:///H:/645_Home_map-center/src/components/RentalImageGallery.tsx#L55-L63) 內建了三層載入機制：
1. **第一層（預設本地讀取）**：直接讀取本地靜態伺服器路徑（例如：`/rentals_images/renco_41963/image_1.jpg`）。
2. **第二層（副檔名互換重試）**：若載入失敗，會將 `.jpg` 換成 `.png`（或反之）重新嘗試讀取。
3. **第三層（GitHub 遠端備用）**：若前兩者地端讀取皆失敗，則會自動轉為從 GitHub 遠端儲存庫的原始碼 Raw 連結載入：
   `https://raw.githubusercontent.com/CyberPotato0416/Home_map-center/main/public/rentals_images/renco_41963/image_1.jpg`
