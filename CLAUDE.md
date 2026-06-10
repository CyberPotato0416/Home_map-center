# 📋 AI Agent 開發規範 (ai.dev / CLAUDE 必讀)

> **重要：這份文件是本專案的最高規範，AI agent 進入專案時必須先讀這份文件，並嚴格遵守以下規則。**

---

## 🚫 禁止事項 (DO NOT)

### 1. 禁止刪除地端工具與資料檔案
以下檔案是屬於「本地工具」，**嚴禁在任何 refactor、cleanup、或整理 commit 中將其刪除**：

| 檔案路徑 | 用途說明 |
|---|---|
| `extract_591_to_csv.py` | Python GUI 爬蟲工具，用於從 591 租屋網抓取物件資料並產生 CSV |
| `public/rentals_import.csv` | 主要租屋物件匯入資料來源，供網頁前端匯入使用 |
| `public/rentals_images/` | 本地下載的物件照片目錄 |
| `rent_map_specs/` | 所有 Phase 規格書目錄（.md 檔），**請保留全部** |

> ⚠️ 若你認為某個檔案不必要，**請提出建議但不要自行刪除**。等待使用者確認後才能動作。

### 2. 禁止刪除規格書
`rent_map_specs/` 目錄下的所有 `.md` 規格書是產品設計文件，**任何時候都不得刪除**。

### 3. 不得修改 Python 爬蟲工具
`extract_591_to_csv.py` 是獨立的地端工具，**除非使用者明確指示，否則不得修改其內容或路徑配置**。
### 4. 反重力地端不修改前端網頁的CODE，一律處理.MD .CSV .PY等敘述或是工具檔案。
---

## ✅ 開發規範 (DO)

### 1. 專注於 `src/` 目錄下的前端實作
所有的網頁 UI 開發工作應集中在 `src/` 目錄下進行：
- `src/components/` — React 元件
- `src/hooks/` — 自訂 Hook
- `src/utils.ts` — 工具函式與評分邏輯
- `src/utils/` — 各類輔助函式

### 2. 遵循現有的 Phase 規格書
開發前必須先讀取對應 Phase 的規格書（位於 `rent_map_specs/`），並以規格書的設計方向為準。

### 3. 提交前確認不誤刪重要檔案
每次 commit 前請執行 `git status` 確認變更清單，若有「deleted」的檔案，**必須核實是否為允許刪除的暫存/測試檔**。

---

## 📁 專案結構說明

```
645_Home_map-center/
├── extract_591_to_csv.py   ← 🔒 地端工具，禁止刪除
├── public/
│   ├── rentals_import.csv  ← 🔒 物件資料，禁止刪除
│   └── rentals_images/     ← 🔒 本地照片，禁止刪除
├── rent_map_specs/         ← 🔒 所有規格書，禁止刪除
│   ├── rent_map_master_plan.md
│   ├── rent_map_phase_7_spec.md
│   └── ...
└── src/                    ← ✅ 前端實作區域
    ├── App.tsx
    ├── components/
    ├── hooks/
    └── utils.ts
```
