import React, { useRef, useState } from 'react';
import { UploadCloud, DownloadCloud, Database, Trash2, CheckCircle, XCircle, Search, SlidersHorizontal } from 'lucide-react';
import Papa from 'papaparse';
import { RentalProperty } from '../types';

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const clearRentals = () => {
    if (window.confirm('確定要清除所有租屋點位資料嗎？')) {
      setRentals([]);
      setSelectedRental(null);
      localStorage.removeItem('my_rental_pins');
    }
  };

  const processCSV = (file: File) => {
    setError(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          if (!rows || rows.length === 0) {
            setError('CSV 檔案為空');
            return;
          }

          const parsedRentals: RentalProperty[] = [];
          
          rows.forEach((row, index) => {
            const keys = Object.keys(row);
            
            // Core mappers
            let id = '';
            let lat = 0;
            let lng = 0;
            let price = 0;
            let title = '';
            let link = '';
            let images: string[] = [];
            let pros: string[] = [];
            let cons: string[] = [];
            const customFields: Record<string, string> = {};

            keys.forEach(k => {
              const lowerK = k.toLowerCase();
              const val = String(row[k] || '');
              
              if (['id'].includes(lowerK) && val) {
                id = val;
              } else if (['lat', 'latitude', '緯度'].some(kw => lowerK.includes(kw))) {
                lat = parseFloat(val);
              } else if (['lng', 'longitude', 'long', '經度'].some(kw => lowerK.includes(kw))) {
                lng = parseFloat(val);
              } else if (['price', 'rent', '租金', '價格'].some(kw => lowerK.includes(kw))) {
                price = parseInt(val.replace(/[^0-9]/g, ''), 10);
              } else if (['title', 'name', '名稱', '標題', '租屋'].some(kw => lowerK.includes(kw))) {
                title = val;
              } else if (['link', 'url', '網址', '連結'].some(kw => lowerK.includes(kw)) && !['image', 'photo', 'img'].some(kw => lowerK.includes(kw))) {
                link = val;
              } else if (['image', 'photo', '照片', '圖片'].some(kw => lowerK.includes(kw))) {
                if (val) {
                  images = val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                }
              } else if (['pros', '優點'].some(kw => lowerK.includes(kw))) {
                if (val) {
                  pros = val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
                }
              } else if (['cons', '缺點'].some(kw => lowerK.includes(kw))) {
                if (val) {
                  cons = val.split(/[;,]/).map(s => s.trim()).filter(Boolean);
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
               parsedRentals.push({
                 id: id || `rental-${Date.now()}-${index}`,
                 lat,
                 lng,
                 price: isNaN(price) ? 0 : price,
                 title,
                 link,
                 images,
                 pros,
                 cons,
                 customFields
               });
            }
          });

          if (parsedRentals.length > 0) {
            setRentals(prevRentals => {
              const updatedRentals = [...prevRentals];
              let newlyAdded = 0;
              let updatedCount = 0;
              let deletedCount = 0;

              parsedRentals.forEach(newRental => {
                const existingIndex = updatedRentals.findIndex(
                  r => r.id === newRental.id || (r.link && r.link === newRental.link) || (r.lat === newRental.lat && r.lng === newRental.lng)
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
              localStorage.setItem('my_rental_pins', JSON.stringify(updatedRentals));
              
              let msg = `成功匯入！目前共有 ${updatedRentals.length} 筆物件。\n`;
              if (newlyAdded > 0) msg += `- 新增: ${newlyAdded} 筆\n`;
              if (updatedCount > 0) msg += `- 更新: ${updatedCount} 筆\n`;
              if (deletedCount > 0) msg += `- 刪除 (因租金為0): ${deletedCount} 筆\n`;
              
              alert(msg);
              return updatedRentals;
            });
          } else {
            setError('無法解析出任何有效的座標點位。請確保包含「緯度」與「經度」欄位。');
          }
        } catch (e: any) {
          setError(`解析錯誤: ${e.message || '格式有誤'}`);
        }
        
        // Clear input to allow re-upload
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      error: (error) => {
        setError(`CSV 解析失敗: ${error.message}`);
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSV(file);
    }
  };

  const exportToCSV = () => {
    if (rentals.length === 0) return alert('目前沒有可匯出的租屋資料！');
    
    // Determine dynamic custom fields
    const customHeaders = new Set<string>();
    rentals.forEach(r => Object.keys(r.customFields).forEach(k => customHeaders.add(k)));
    const customHeadersArray = Array.from(customHeaders);
    
    const headers = ['id', 'title', 'price', 'lat', 'lng', 'link', 'images', 'pros', 'cons', ...customHeadersArray];
    const csvRows = [headers.join(',')];
    
    for (const row of rentals) {
      const values = headers.map(header => {
        let val: any = '';
        if (['id', 'title', 'price', 'lat', 'lng', 'link'].includes(header)) {
          val = (row as any)[header] || '';
        } else if (['images', 'pros', 'cons'].includes(header)) {
           val = (row as any)[header].join(';');
        } else {
          val = row.customFields[header] || '';
        }
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvBlob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
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
          您可以在此導出目前地圖上的所有租屋資料，也可以重新匯入新的 591 整理清單。
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] p-2 rounded flex items-start gap-1.5 font-sans">
            <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button 
            onClick={handleImportClick}
            className="bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 text-[#00f0ff] text-[10px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            📥 匯入 CSV
          </button>
          
          <button 
            onClick={exportToCSV}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            📤 匯出 CSV
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
              <span className="text-[#00f0ff]">${maxBudget.toLocaleString()}</span>
            </label>
            <input 
              type="range" min="8000" max="18000" step="500" 
              value={maxBudget} onChange={(e) => setMaxBudget(parseInt(e.target.value))}
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
              type="range" min="5" max="10" step="0.5" 
              value={minSize} onChange={(e) => setMinSize(parseFloat(e.target.value))}
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
              type="range" min="5" max="25" step="0.5" 
              value={maxDistance} onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 opacity-80 hover:opacity-100 transition-opacity cursor-pointer h-1.5 bg-gray-800 rounded-full appearance-none"
            />
          </div>

        </div>
      </div>
    </div>
  );
};
