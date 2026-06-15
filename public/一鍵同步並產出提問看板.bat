@echo off
chcp 65001 > nul
echo ==========================================
echo 正在讀取 rentals_import.xlsm 並同步最新資料...
echo ==========================================
python "H:\645_Home_map-center\scratch\generate_questions.py"
echo.
echo ==========================================
echo 執行完成！已成功更新以下檔案：
echo 1. H:\645_Home_map-center\rental_questions.md (待確認提問清單)
echo 2. H:\645_Home_map-center\public\rentals_import.csv (地圖網頁同步)
echo ==========================================
echo.
pause
