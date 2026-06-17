# 🗺️ 591Premium 租屋評比地圖中心 (Home Map Center)

> 以 **堯金科技（仁愛路三段大安區）** 為通勤中心點，整合 591 爬蟲、Excel 清洗、GIS 地圖與 RPG 屬性卡評分的租屋決策分析工具。  
> 完整工作流說明請見 [INDEX.MD](./INDEX.MD)，開發規範請見 [CLAUDE.md](./CLAUDE.md)。

---

## 🔧 前置需求 (Prerequisites)

| 工具 | 用途 |
|---|---|
| **Node.js** v18+ | 執行前端網頁伺服器 (`npm run dev`) |
| **Python** 3.8+ | 執行爬蟲 (`extract_591_to_csv.py`) 及同步腳本 (`scratch/generate_questions.py`) |
| **Microsoft Excel** (含 VBA) | 開啟 `public/rentals_import.xlsm` 並執行巨集清洗資料 |

---

## 🚀 本地啟動 (Run Locally)

```bash
# 1. 安裝 Node.js 依賴
npm install

# 2. 設定環境變數（複製範本後填入 API Key）
cp .env.example .env.local
# 編輯 .env.local，填入 GEMINI_API_KEY=你的金鑰

# 3. 啟動開發伺服器（含後端 Express + 前端 Vite HMR）
npm run dev
```

伺服器啟動後，瀏覽器開啟 `http://localhost:3000`（或終端機顯示的埠號）。

---

## 📋 主要 npm 指令

| 指令 | 說明 |
|---|---|
| `npm run dev` | 啟動開發伺服器（`tsx server.ts`，含 HMR） |
| `npm run build` | 建置生產版本（Vite + esbuild 打包） |
| `npm run start` | 執行已建置的生產伺服器（`node dist/server.cjs`） |
| `npm run lint` | TypeScript 型別檢查（`tsc --noEmit`） |

---

## 🔄 核心工作流 (Core Workflow)

```
爬取 591 物件                清洗與格式化              同步到網頁               積分評比
extract_591_to_csv.py  →  rentals_import.xlsm  →  generate_questions.py  →  npm run dev
(Python GUI 爬蟲)          (VBA 巨集整理)           (CSV + 問題集更新)       (地圖 + 屬性卡)
```

詳細各步驟說明請見 [INDEX.MD](./INDEX.MD)。

---

## 📁 重要檔案一覽

| 路徑 | 說明 |
|---|---|
| `src/utils.ts` | 核心評分邏輯 (`calculateHomeScore`) |
| `src/constants.ts` | 公司座標 (`COMPANY_COORDS`) 與捷運站資料 |
| `public/rentals_import.csv` | 網頁前端讀取的租屋資料（由同步腳本產生）|
| `public/rentals_images/` | 本地物件照片（由爬蟲下載）|
| `extract_591_to_csv.py` | 591 租屋爬蟲（地端工具，勿刪）|
| `scratch/generate_questions.py` | XLSM → CSV + 提問清單同步腳本（勿刪）|
| `rent_map_specs/` | 所有 Phase 規格書（勿刪）|
| `RentalsManager.bas` | Excel VBA 巨集模組（勿刪）|
