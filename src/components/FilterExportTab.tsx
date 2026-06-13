import React, { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  DownloadCloud,
  Database,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  SlidersHorizontal,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Papa from "papaparse";
import { RentalProperty } from "../types";
import { getRentalLocalId } from "../utils";

interface FilterExportTabProps {
  rentals: RentalProperty[];
  setRentals: (r: RentalProperty[]) => void;
  setSelectedRental: (r: RentalProperty | null) => void;
  maxBudget: number;
  setMaxBudget: (b: number) => void;
  minSize: number;
  setMinSize: (s: number) => void;
  maxDistance: number;
  setMaxDistance: (d: number) => void;
  searchKeyword: string;
  setSearchKeyword: (k: string) => void;
  statusFilters?: { signing: boolean; reviewing: boolean; renting: boolean };
  setStatusFilters?: (
    f:
      | { signing: boolean; reviewing: boolean; renting: boolean }
      | ((prev: any) => any),
  ) => void;
}

export const FilterExportTab: React.FC<FilterExportTabProps> = ({
  rentals,
  setRentals,
  setSelectedRental,
  maxBudget,
  setMaxBudget,
  minSize,
  setMinSize,
  maxDistance,
  setMaxDistance,
  searchKeyword,
  setSearchKeyword,
  statusFilters,
  setStatusFilters,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  // ⚡ 591Premium 相片直灌載入器狀態與處理虛擬機 ⚡
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<{ name: string; count: number; isIdFolder: boolean }[]>([]);
  const [showStatusList, setShowStatusList] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const zipInputRef = useRef<HTMLInputElement>(null);

  const refreshImageStatus = async () => {
    try {
      const res = await fetch("/api/rentals-images-status");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.folders)) {
          const sorted = data.folders.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setImageStatus(sorted);
        }
      }
    } catch (e) {
      console.error("Error fetching images status:", e);
    }
  };

  useEffect(() => {
    refreshImageStatus();
  }, []);

  const forceHealImages = async () => {
    try {
      const res = await fetch("/api/rentals-images-status");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.folders)) {
          let healedCount = 0;
          const healed = rentals.map((rental) => {
            const idValue = getRentalLocalId(rental);
            const folderMatch = data.folders.find(
              (f: any) => String(f.name).toLowerCase().trim() === String(idValue).toLowerCase().trim()
            );

            if (folderMatch && folderMatch.count > 0) {
              const actualFiles = folderMatch.files || [];
              const newLocalImages = actualFiles.length > 0
                ? actualFiles.map((file: string) => `/rentals_images/${idValue}/${file}`)
                : Array.from(
                    { length: folderMatch.count },
                    (_, i) => `/rentals_images/${idValue}/image_${i + 1}.jpg`
                  );
              healedCount++;
              return {
                ...rental,
                images: newLocalImages,
              };
            }
            return rental;
          });

          setRentals(healed);
          localStorage.setItem("my_rental_pins", JSON.stringify(healed));
          alert(`🎉 圖片比對與路徑修復完成！\n- 成功比對並修復 ${healedCount} 個特定租屋物件的本機相片庫路徑。`);
          refreshImageStatus();
        } else {
          alert("無法取得圖片資料夾清單。");
        }
      } else {
        alert("無法連結伺服器圖片通道。");
      }
    } catch (e: any) {
      alert(`修復失敗: ${e.message}`);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleZipClick = () => {
    zipInputRef.current?.click();
  };

  const readEntryFiles = async (
    entry: any,
    pathList: { file: File; path: string }[] = [],
    currentPath = ""
  ) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
        pathList.push({ file, path: `${currentPath}${file.name}` });
      }
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const readAllEntries = async (): Promise<any[]> => {
        const allEntries: any[] = [];
        const readBatch = async (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((entries: any[]) => resolve(entries));
          });
        };
        let batch = await readBatch();
        while (batch && batch.length > 0) {
          allEntries.push(...batch);
          batch = await readBatch();
        }
        return allEntries;
      };

      const entries = await readAllEntries();
      for (const ent of entries) {
        await readEntryFiles(ent, pathList, `${currentPath}${entry.name}/`);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploading(true);
    setUploadProgress("正在解析拖放的資料與壓縮檔...");
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const items = Array.from(e.dataTransfer.items || []) as any[];
      const entries = items.map((item) => item.webkitGetAsEntry()).filter(Boolean);

      // Check archives (.zip, .rar)
      const archiveFiles: File[] = [];
      const files = Array.from(e.dataTransfer.files || []) as File[];
      files.forEach((f) => {
        const lowerName = f.name.toLowerCase();
        if (lowerName.endsWith(".zip") || lowerName.endsWith(".rar")) {
          archiveFiles.push(f);
        }
      });

      if (archiveFiles.length > 0) {
        const file = archiveFiles[0];
        const isZip = file.name.toLowerCase().endsWith(".zip");
        setUploadProgress(
          `正在上傳壓縮檔 ${file.name}... (大小: ${(file.size / 1024 / 1024).toFixed(1)}MB)，解壓耗時請保持連線...`
        );

        const endpoint = isZip ? "/api/upload-zip" : "/api/upload-rar";
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": isZip ? "application/zip" : "application/octet-stream",
          },
          body: file,
        });

        if (res.ok) {
          setUploadSuccess(`成功！${file.name} 已於雲端沙盒解壓縮並灌入到位！`);
          refreshImageStatus();
        } else {
          const errData = await res.json().catch(() => ({}));
          setUploadError(errData.error || "解壓失敗，請嘗試直接拖放解壓後的資料夾！");
        }
        setUploading(false);
        return;
      }

      // Recursive directories structure
      if (entries.length > 0) {
        const pathList: { file: File; path: string }[] = [];
        for (const entry of entries) {
          await readEntryFiles(entry, pathList);
        }

        if (pathList.length === 0) {
          setUploadError("未偵測到任何相片。拖放前請確認資料夾內含 JPG / PNG 圖片物件。");
          setUploading(false);
          return;
        }

        const cleanedPaths = pathList.map((item) => {
          let relPath = item.path;
          const index = relPath.indexOf("rentals_images/");
          if (index >= 0) {
            relPath = relPath.substring(index);
          } else {
            relPath = `rentals_images/${relPath}`;
          }
          return { file: item.file, targetPath: relPath };
        });

        const totalFiles = cleanedPaths.length;
        setUploadProgress(`找到 ${totalFiles} 張相片，正進行背景通道分批灌入...`);

        let uploadedCount = 0;
        const uploadFileItem = async (item: { file: File; targetPath: string }) => {
          const res = await fetch("/api/upload-file", {
            method: "POST",
            headers: {
              "X-File-Path": item.targetPath,
              "Content-Type": "application/octet-stream",
            },
            body: item.file,
          });
          if (!res.ok) {
            throw new Error(`上傳 ${item.file.name} 失敗`);
          }
          uploadedCount++;
          setUploadProgress(
            `正在灌進沙盒身分庫: ${uploadedCount} / ${totalFiles} 張 (${Math.round(
              (uploadedCount / totalFiles) * 100
            )}%)`
          );
        };

        const concurrency = 4;
        const queue = [...cleanedPaths];
        const workers = Array(concurrency)
          .fill(null)
          .map(async () => {
            while (queue.length > 0) {
              const item = queue.shift();
              if (item) {
                try {
                  await uploadFileItem(item);
                } catch (e) {
                  console.error(e);
                }
              }
            }
          });

        await Promise.all(workers);

        setUploadSuccess(`已成功導入！一共灌進了 ${uploadedCount} 張相片物件！`);
        refreshImageStatus();
      } else {
        setUploadError("不支援的物件。請拖入資料夾或壓縮檔 (.zip, .rar)！");
      }
    } catch (err: any) {
      setUploadError(`灌入過程中斷，錯誤原因: ${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const handleZipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const isZip = file.name.toLowerCase().endsWith(".zip");
    setUploadProgress(`正在透過通道上傳 ${file.name}... (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const endpoint = isZip ? "/api/upload-zip" : "/api/upload-rar";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": isZip ? "application/zip" : "application/octet-stream",
        },
        body: file,
      });

      if (res.ok) {
        setUploadSuccess(`🎉 灌入完成！壓縮檔 ${file.name} 已於背景解壓並配對成功！`);
        refreshImageStatus();
      } else {
        const errData = await res.json().catch(() => ({}));
        setUploadError(errData.error || "解壓失敗，請將檔案解壓後整包拖入！");
      }
    } catch (err: any) {
      setUploadError(`傳輸或解壓失敗: ${err.message || err}`);
    } finally {
      setUploading(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const clearRentals = () => {
    if (window.confirm("確定要清除所有租屋點位資料嗎？")) {
      setRentals([]);
      setSelectedRental(null);
      localStorage.removeItem("my_rental_pins");
    }
  };

  const processCSV = async (file: File) => {
    setError(null);
    let serverFolders: any[] = [];
    try {
      const res = await fetch("/api/rentals-images-status");
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.folders)) {
          serverFolders = data.folders;
        }
      }
    } catch (e) {
      console.error("Failed to pre-fetch rentals images status during transition", e);
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          if (!rows || rows.length === 0) {
            setError("CSV 檔案為空");
            return;
          }

          const parsedRentals: RentalProperty[] = [];
          const fields = results.meta.fields || [];
          const titleKeyFromHeader = fields.length > 1 ? fields[1] : null;

          rows.forEach((row, index) => {
            const keys = Object.keys(row);

            // Core mappers
            let id = "";
            let lat = 0;
            let lng = 0;
            let price = 0;
            let title = titleKeyFromHeader
              ? String(row[titleKeyFromHeader] || "").trim()
              : "";
            let link = "";
            let images: string[] = [];
            let pros: string[] = [];
            let cons: string[] = [];
            const customFields: Record<string, string> = {};

            keys.forEach((k) => {
              const lowerK = k.toLowerCase().trim();
              const val = String(row[k] || "");

              if (["id"].includes(lowerK) && val) {
                id = val;
              } else if (
                ["lat", "latitude", "緯度"].some((kw) => lowerK.includes(kw))
              ) {
                lat = parseFloat(val);
              } else if (
                ["lng", "longitude", "long", "經度"].some((kw) =>
                  lowerK.includes(kw),
                )
              ) {
                lng = parseFloat(val);
              } else if (
                ["price", "rent", "租金", "價格"].some((kw) =>
                  lowerK.includes(kw),
                )
              ) {
                price = parseInt(val.replace(/[^0-9]/g, ""), 10);
              } else if (k === titleKeyFromHeader) {
                // Already used as primary title source
              } else if (
                !title &&
                ["title", "name", "名稱", "標題", "物件"].some(
                  (kw) =>
                    lowerK.includes(kw) &&
                    !lowerK.includes("狀態") &&
                    !lowerK.includes("裝潢"),
                )
              ) {
                title = val;
              } else if (
                lowerK === "source_591_url" ||
                lowerK === "url" ||
                lowerK === "link" ||
                lowerK === "網址" ||
                lowerK === "連結"
              ) {
                if (!link || lowerK === "source_591_url") {
                  link = val;
                }
              } else if (
                ["image", "img", "pic", "photo", "照片", "圖片", "cover"].some(
                  (kw) => lowerK.includes(kw),
                )
              ) {
                if (val && !lowerK.includes("original")) {
                  // Prefer local images (without 'original' in key)
                  try {
                    if (val.startsWith("[")) {
                      images = JSON.parse(val.replace(/'/g, '"'));
                    } else {
                      images = val
                        .split(/[;,|]/)
                        .map((s) =>
                          s.replace(/^\[?['"]?|['"]?\]?$/g, "").trim(),
                        )
                        .filter(Boolean);
                    }
                  } catch (e) {
                    images = val
                      .split(/[;,|]/)
                      .map((s) => s.replace(/^\[?['"]?|['"]?\]?$/g, "").trim())
                      .filter(Boolean);
                  }
                } else if (val && lowerK.includes("original")) {
                  customFields[k] = val;
                }
              } else if (["pros", "優點"].some((kw) => lowerK.includes(kw))) {
                if (val) {
                  pros = val
                    .split(/[;,]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
              } else if (["cons", "缺點"].some((kw) => lowerK.includes(kw))) {
                if (val) {
                  cons = val
                    .split(/[;,]/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                }
              } else {
                // Keep everything else as custom dynamic fields
                customFields[k] = val;
              }
            });

            // Only add if we have some coords
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
              // Fallback title
              if (!title) title = `Property ${index + 1}`;
              
              const tempRental: RentalProperty = {
                id: id || `rent_${Date.now()}_${index}`,
                lat,
                lng,
                price: isNaN(price) ? 0 : price,
                title,
                link,
                images,
                pros,
                cons,
                customFields,
              };

              // AUTO-HEAL: Immediately resolve best images using server folders & files
              const idValueForHeal = getRentalLocalId(tempRental);
              if (idValueForHeal && serverFolders.length > 0) {
                const folderMatch = serverFolders.find(
                  (f) => String(f.name).toLowerCase().trim() === String(idValueForHeal).toLowerCase().trim()
                );
                if (folderMatch && folderMatch.count > 0) {
                  const actualFiles = folderMatch.files || [];
                  if (actualFiles.length > 0) {
                    tempRental.images = actualFiles.map((file: string) => `/rentals_images/${idValueForHeal}/${file}`);
                  } else {
                    tempRental.images = Array.from(
                      { length: folderMatch.count },
                      (_, i) => `/rentals_images/${idValueForHeal}/image_${i + 1}.jpg`
                    );
                  }
                }
              }

              parsedRentals.push(tempRental);
            }
          });

          if (parsedRentals.length > 0) {
            setRentals((prevRentals) => {
              const updatedRentals = [...prevRentals];
              let newlyAdded = 0;
              let updatedCount = 0;
              let deletedCount = 0;

              parsedRentals.forEach((newRental) => {
                const existingIndex = updatedRentals.findIndex(
                  (r) =>
                    r.id === newRental.id ||
                    (r.link && r.link === newRental.link) ||
                    (r.lat === newRental.lat && r.lng === newRental.lng),
                );

                if (newRental.price === 0) {
                  // Price 0 means we should hide/delete this rental
                  if (existingIndex >= 0) {
                    updatedRentals.splice(existingIndex, 1);
                    deletedCount++;
                  }
                } else {
                  if (existingIndex >= 0) {
                    updatedRentals[existingIndex] = newRental; // Update existing
                    updatedCount++;
                  } else {
                    updatedRentals.push(newRental); // Add new
                    newlyAdded++;
                  }
                }
              });

              // Persist locally
              localStorage.setItem(
                "my_rental_pins",
                JSON.stringify(updatedRentals),
              );

              let msg = `成功匯入！目前共有 ${updatedRentals.length} 筆物件。\n`;
              if (newlyAdded > 0) msg += `- 新增: ${newlyAdded} 筆\n`;
              if (updatedCount > 0) msg += `- 更新: ${updatedCount} 筆\n`;
              if (deletedCount > 0)
                msg += `- 刪除 (因租金為0): ${deletedCount} 筆\n`;

              alert(msg);
              return updatedRentals;
            });
          } else {
            setError(
              "無法解析出任何有效的座標點位。請確保包含「緯度」與「經度」欄位。",
            );
          }
        } catch (e: any) {
          setError(`解析錯誤: ${e.message || "格式有誤"}`);
        }

        // Clear input to allow re-upload
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        setError(`CSV 解析失敗: ${error.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  };

  const exportToCSV = () => {
    if (rentals.length === 0) return alert("目前沒有可匯出的租屋資料！");

    // Determine dynamic custom fields
    const customHeaders = new Set<string>();
    rentals.forEach((r) =>
      Object.keys(r.customFields).forEach((k) => customHeaders.add(k)),
    );
    const customHeadersArray = Array.from(customHeaders);

    const headers = [
      "id",
      "title",
      "price",
      "lat",
      "lng",
      "link",
      "images",
      "pros",
      "cons",
      ...customHeadersArray,
    ];
    const csvRows = [headers.join(",")];

    for (const row of rentals) {
      const values = headers.map((header) => {
        let val: any = "";
        if (["id", "title", "price", "lat", "lng", "link"].includes(header)) {
          val = (row as any)[header] || "";
        } else if (["images", "pros", "cons"].includes(header)) {
          val = (row as any)[header].join(";");
        } else {
          val = row.customFields[header] || "";
        }
        const escaped = ("" + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const csvBlob = new Blob(
      [new Uint8Array([0xef, 0xbb, 0xbf]), csvRows.join("\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rentals_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Backup & Import/Export Section */}
      <div className="bg-[#0f111a] border border-[#1e2330] rounded-xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-[#00f0ff]"></div>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
          <Database className="w-4 h-4 text-purple-400" />
          資料備份與匯出 (CSV)
        </div>
        <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
          您可以在此導出目前地圖上的所有租屋資料，也可以重新匯入新的 591
          整理清單。
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] p-2 rounded flex items-start gap-1.5 font-sans">
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mt-1">
          <button
            onClick={async () => {
              try {
                const res = await fetch("/rentals_import.csv");
                if (res.ok) {
                  const text = await res.text();
                  const fakeFile = new File([text], "rentals_import.csv", { type: "text/csv" });
                  processCSV(fakeFile);
                } else {
                  setError("無法取得預設資料包");
                }
              } catch(e) {
                setError("無法取得預設資料包");
              }
            }}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold py-2.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">預設包</span>
          </button>

          <button
            onClick={handleImportClick}
            className="bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-bold py-2.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
          >
            <UploadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">匯入 CSV</span>
          </button>

          <button
            onClick={exportToCSV}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold py-2.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
          >
            <DownloadCloud className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">匯出 CSV</span>
          </button>
        </div>

        {rentals.length > 0 && (
          <div className="flex items-center justify-between text-[10px] mt-1 font-mono">
            <div className="text-gray-400 flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              目前已載入 {rentals.length} 筆物件
            </div>
            <button
              onClick={clearRentals}
              className="text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> 清空
            </button>
          </div>
        )}
      </div>

      {/* ⚡ 591Premium 相片直灌通道 Loader Panel ⚡ */}
      <div className="bg-[#0f111a] border border-[#1e2330] rounded-xl p-4 shadow-lg flex flex-col gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#005fff]"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
            <ImageIcon className="w-4 h-4 text-[#00f0ff]" />
            相片資料夾直灌通道 (RAR/ZIP/Folder)
          </div>
          <button 
            type="button"
            onClick={refreshImageStatus}
            title="點擊重整存量"
            className="text-gray-500 hover:text-cyan-400 p-1 rounded hover:bg-white/5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
          您可以將<strong>「整包 rentals_images」</strong>資料夾直接拖入下方，或將相片壓縮成 <code>.zip</code> 檔/<code>.rar</code> 檔拖放或點選上傳，系統會自動在雲端沙盒完成解壓與配對。
        </p>

        {/* DRAG AND DROP AREA */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleZipClick}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 select-none ${
            dragActive
              ? "border-[#00f0ff] bg-cyan-500/10 text-[#00f0ff] scale-[0.99] shadow-inner shadow-[#00f0ff]/10"
              : "border-[#1e2330] hover:border-cyan-500/40 hover:bg-[#161a25]/50 text-gray-400"
          }`}
        >
          <input
            type="file"
            accept=".zip,.rar"
            ref={zipInputRef}
            onChange={handleZipFileChange}
            className="hidden"
          />

          <UploadCloud className={`w-8 h-8 transition-transform duration-300 ${dragActive ? "animate-bounce text-[#00f0ff]" : "text-gray-500 hover:text-cyan-400"}`} />
          
          <div className="text-[10px] font-mono font-bold tracking-tight text-center">
            {dragActive ? (
              <span className="text-cyan-400">「偵測到拖放，請在此放開滑鼠」</span>
            ) : (
              <span>拖放 rentals_images 資料夾或 ZIP/RAR 檔至此</span>
            )}
          </div>
          <div className="text-[9px] text-gray-600 text-center">
            或點此瀏覽本機中的壓縮檔 (.zip, .rar)
          </div>
        </div>

        {/* LOADING PROGRESS AND STATUS */}
        {uploading && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 text-[10px] p-2.5 rounded-lg flex flex-col gap-2 font-mono">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00f0ff]" />
              <span className="font-semibold text-gray-300">背景直灌通道運行中...</span>
            </div>
            <div className="text-[9px] text-gray-400 leading-snug">
              {uploadProgress}
            </div>
            {/* PROGRESS SIMULATION SUB-BAR */}
            <div className="w-full bg-[#161a25] rounded-full h-1 overflow-hidden">
              <div className="bg-[#00f0ff] h-full animate-pulse transition-all duration-300" style={{ width: "100%" }}></div>
            </div>
          </div>
        )}

        {/* SUCCESS ALERTER */}
        {uploadSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] p-2.5 rounded-lg flex items-start gap-2 font-sans">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-gray-200">灌入成功！</div>
              <p className="text-[9px] text-gray-400 mt-1 leading-snug">{uploadSuccess}</p>
            </div>
          </div>
        )}

        {/* ERROR ALERTER */}
        {uploadError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-2.5 rounded-lg flex items-start gap-2 font-sans">
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-gray-200">管道受阻或未解壓</div>
              <p className="text-[9px] text-red-400/80 mt-1 leading-snug">{uploadError}</p>
            </div>
          </div>
        )}

        {/* 🛠️ 手動比對與自愈修復相片按鈕 🛠️ */}
        <button
          type="button"
          onClick={forceHealImages}
          className="w-full bg-cyan-950/40 hover:bg-cyan-900/60 active:scale-[0.98] border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-cyan-200 text-[10px] font-mono font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-950/30 select-none group"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
          <span>⚡ 診斷比對並自動修復所有相片連結 ⚡</span>
        </button>

        {/* EXISTING COCKPIT DIRECTORIES PANEL */}
        <div className="border-t border-[#1e2330]/60 pt-2 mt-1">
          <button
            type="button"
            onClick={() => setShowStatusList(!showStatusList)}
            className="w-full flex items-center justify-between text-[10px] font-mono text-gray-400 hover:text-cyan-400 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-500" />
              開闢現存相片庫 ({imageStatus.length} 個夾)
            </span>
            <span className="text-gray-600 hover:text-gray-400 underline">
              {showStatusList ? "收合目錄" : "展開檢視"}
            </span>
          </button>

          {showStatusList && (
            <div className="mt-2 max-h-[140px] overflow-y-auto bg-[#0a0c12] border border-[#1e2330]/80 rounded p-2 flex flex-col gap-1.5 custom-scrollbar font-mono text-[9px]">
              {imageStatus.length === 0 ? (
                <div className="text-gray-600 text-center py-2">（無現存 rentals_images 目錄，請先直灌）</div>
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {imageStatus.map((dir, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-[#131622] p-1.5 rounded border border-[#1e2330]/40 text-gray-300"
                    >
                      <span className={`truncate ${dir.isIdFolder ? "text-cyan-400 font-bold" : "text-purple-400"}`}>
                        📁 {dir.name}
                      </span>
                      <span className="text-gray-500 font-bold shrink-0">
                        {dir.count} 張
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filtering Section */}
      <div className="bg-[#0f111a] border border-[#1e2330] rounded-xl p-4 shadow-lg flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 border-b border-white/5 pb-2">
          <SlidersHorizontal className="w-4 h-4 text-[#00f0ff]" />
          進階交叉篩選器
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          {/* Keyword Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-gray-400 font-bold flex justify-between">
              <span>🔍 關鍵字搜尋</span>
            </label>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="搜尋名稱、優缺點、標籤..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full bg-[#161a25] border border-white/10 rounded-lg py-1.5 pl-7 pr-3 text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00f0ff]/50 transition-colors"
              />
            </div>
          </div>

          {/* Max Budget Slider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-gray-400 font-bold flex justify-between">
              <span>💰 預算上限 (Max Budget)</span>
              <span className="text-[#00f0ff]">
                ${maxBudget.toLocaleString()}
              </span>
            </label>
            <input
              type="range"
              min="8000"
              max="18000"
              step="500"
              value={maxBudget}
              onChange={(e) => setMaxBudget(parseInt(e.target.value))}
              className="w-full accent-[#00f0ff] opacity-80 hover:opacity-100 transition-opacity cursor-pointer h-1.5 bg-gray-800 rounded-full appearance-none"
            />
          </div>

          {/* Min Size Slider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-gray-400 font-bold flex justify-between">
              <span>📐 最小坪數 (Min Size)</span>
              <span className="text-[#00f0ff]">{minSize} 坪</span>
            </label>
            <input
              type="range"
              min="5"
              max="10"
              step="0.5"
              value={minSize}
              onChange={(e) => setMinSize(parseFloat(e.target.value))}
              className="w-full accent-purple-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer h-1.5 bg-gray-800 rounded-full appearance-none"
            />
          </div>

          {/* Max Distance Slider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-gray-400 font-bold flex justify-between">
              <span>🚶 最大通勤距離 (Max Dist.)</span>
              <span className="text-emerald-400">{maxDistance} km</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer h-1.5 bg-gray-800 rounded-full appearance-none"
            />
          </div>

          {/* Status Filters */}
          {statusFilters && setStatusFilters && (
            <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
              <label className="text-[10px] font-mono text-gray-400 font-bold">
                📋 簽約狀態 (Sign Status)
              </label>
              <div className="flex gap-3">
                {/* 簽約中 */}
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${statusFilters.signing ? "bg-[#00f0ff] border-[#00f0ff]" : "bg-transparent border-gray-600"}`}
                  >
                    {statusFilters.signing && (
                      <CheckCircle className="w-2.5 h-2.5 text-black" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono transition-colors ${statusFilters.signing ? "text-gray-200" : "text-gray-500"}`}
                  >
                    簽約中
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={statusFilters.signing}
                    onChange={(e) =>
                      setStatusFilters((prev) => ({
                        ...prev,
                        signing: e.target.checked,
                      }))
                    }
                  />
                </label>

                {/* 審核中 */}
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${statusFilters.reviewing ? "bg-purple-400 border-purple-400" : "bg-transparent border-gray-600"}`}
                  >
                    {statusFilters.reviewing && (
                      <CheckCircle className="w-2.5 h-2.5 text-black" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono transition-colors ${statusFilters.reviewing ? "text-gray-200" : "text-gray-500"}`}
                  >
                    審核中
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={statusFilters.reviewing}
                    onChange={(e) =>
                      setStatusFilters((prev) => ({
                        ...prev,
                        reviewing: e.target.checked,
                      }))
                    }
                  />
                </label>

                {/* 招租中 */}
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <div
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${statusFilters.renting ? "bg-emerald-400 border-emerald-400" : "bg-transparent border-gray-600"}`}
                  >
                    {statusFilters.renting && (
                      <CheckCircle className="w-2.5 h-2.5 text-black" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono transition-colors ${statusFilters.renting ? "text-gray-200" : "text-gray-500"}`}
                  >
                    招租中
                  </span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={statusFilters.renting}
                    onChange={(e) =>
                      setStatusFilters((prev) => ({
                        ...prev,
                        renting: e.target.checked,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
