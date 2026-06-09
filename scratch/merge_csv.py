#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
CSV 合併工具：將舊版 CSV 合併進 Vite 專案 CSV
- 依 original_591_id 去重（已存在的不重複寫入）
- 修正舊版 images 路徑（補上 Vite 根相對路徑前綴 /）
"""
import csv, sys, os
sys.stdout.reconfigure(encoding='utf-8')

SRC  = r"h:\640_cheers_Soft\rentals_import.csv"
DEST = r"h:\640_cheers_Soft\rent_gis_app\public\rentals_import.csv"

def fix_images_path(val):
    """將舊版 rentals_images/xxx/yyy.jpg 修正為 /rentals_images/xxx/yyy.jpg"""
    if not val:
        return val
    parts = []
    for p in val.split(';'):
        p = p.strip()
        if p and not p.startswith('/') and not p.startswith('http'):
            p = '/' + p
        parts.append(p)
    return ';'.join(parts)

# 讀取目的 CSV 已有的 ID
existing_ids = set()
dest_rows = []
fieldnames = []

if os.path.exists(DEST) and os.path.getsize(DEST) > 0:
    with open(DEST, 'r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        for row in reader:
            dest_rows.append(row)
            eid = row.get('original_591_id', '').strip()
            if eid:
                existing_ids.add(eid)

# 讀取來源 CSV
new_rows = []
with open(SRC, 'r', newline='', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    if not fieldnames:
        fieldnames = reader.fieldnames or []
    for row in reader:
        eid = row.get('original_591_id', '').strip()
        if eid in existing_ids:
            print(f"  ⏭️  略過重複: {eid} ({row.get('title','')[:20]})")
        else:
            # 修正 images 路徑補上 /
            if 'images' in row:
                row['images'] = fix_images_path(row['images'])
            new_rows.append(row)
            existing_ids.add(eid)
            print(f"  ✅ 新增: {eid} ({row.get('title','')[:30]})")

if not new_rows:
    print("\n✅ 無新增資料，兩份 CSV 內容已一致。")
else:
    # 合併後全部重寫（utf-8-sig BOM，Excel 相容）
    all_rows = dest_rows + new_rows
    with open(DEST, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(all_rows)
    print(f"\n🎉 合併完成！新增 {len(new_rows)} 筆，目的檔案共 {len(all_rows)} 筆。")
    print(f"📄 {DEST}")
