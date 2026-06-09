import React, { useMemo, useState, useEffect } from 'react';
import { Building, Image as ImageIcon, Train, Navigation, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { RentalProperty } from '../types';
import { calculateDistance } from '../utils';
import { COMPANY_COORDS, MRT_STATIONS_DATA } from '../constants';

interface RentalImportTabProps {
  rentals: RentalProperty[];
  setRentals: (r: RentalProperty[]) => void;
  selectedRental: RentalProperty | null;
  setSelectedRental: (r: RentalProperty | null) => void;
  sidebarWidth?: number;
}

export const RentalImportTab: React.FC<RentalImportTabProps> = ({
  rentals,
  setRentals,
  selectedRental,
  setSelectedRental,
  sidebarWidth = 420,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    setCurrentImgIndex(0);
  }, [selectedRental]);

  const commuteData = useMemo(() => {
    if (!selectedRental) return null;
    const distToOffice = calculateDistance(selectedRental.lat, selectedRental.lng, COMPANY_COORDS[0], COMPANY_COORDS[1]);
    
    let nearestMrt = null;
    let minMrtDist = Infinity;
    
    MRT_STATIONS_DATA.forEach(station => {
      const d = calculateDistance(selectedRental.lat, selectedRental.lng, station.coord[0] as number, station.coord[1] as number);
      if (d < minMrtDist) {
        minMrtDist = d;
        nearestMrt = station.name;
      }
    });

    const score = Math.max(0, Math.round(100 - (distToOffice / 100) - (minMrtDist / 20)));

    return {
      distToOffice,
      nearestMrt,
      minMrtDist,
      score
    };
  }, [selectedRental]);

  // Try to find ping from customFields
  const pingValue = useMemo(() => {
    if (!selectedRental) return null;
    for (const [key, val] of Object.entries(selectedRental.customFields)) {
      if (key.includes('坪數') || key.includes('坪')) {
        const p = parseFloat(String(val));
        if (!isNaN(p) && p > 0) return p;
      }
    }
    return null;
  }, [selectedRental]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Selected Rental Details Section */}
      {selectedRental ? (
        <div className="bg-[#0f111a] border border-[#00f0ff]/30 border-l-[3px] border-l-[#00f0ff] rounded-xl p-4 shadow-lg shadow-[#00f0ff]/5 flex flex-col gap-4 animate-fade-in">
          
          {/* 1. Image Gallery */}
          <div className="space-y-1.5 relative group">
            <div className="aspect-video w-full bg-[#1e2330] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
              {selectedRental.images && selectedRental.images.length > 0 ? (
                <>
                  <img 
                    src={selectedRental.images[currentImgIndex]} 
                    alt="preview" 
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%234b5563" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                      target.className = "w-1/2 h-1/2 object-contain opacity-30";
                    }}
                  />
                  {selectedRental.images.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setCurrentImgIndex(prev => prev === 0 ? selectedRental.images.length - 1 : prev - 1); 
                        }}
                        className="absolute left-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setCurrentImgIndex(prev => prev === selectedRental.images.length - 1 ? 0 : prev + 1); 
                        }}
                        className="absolute right-2 text-white bg-black/50 hover:bg-black/70 p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <Building className="w-8 h-8 opacity-50" />
                  <span className="text-xs font-mono">No Image</span>
                </div>
              )}
            </div>
            {selectedRental.images && selectedRental.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-mono flex items-center gap-1 border border-white/10 pointer-events-none">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{currentImgIndex + 1} / {selectedRental.images.length}</span>
              </div>
            )}
          </div>

          {/* 2. Core Metrics & Title */}
          <div>
            <div className="text-[10px] font-mono text-gray-500 mb-1 flex items-center justify-between">
              <span>{selectedRental.id}</span>
              {selectedRental.link && (
                <a href={selectedRental.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[#00f0ff]/70 hover:text-[#00f0ff] transition-colors">
                  🔗 前往 591 原始網頁
                </a>
              )}
            </div>
            <h3 className="text-sm font-bold text-gray-100 leading-snug mb-2">{selectedRental.title}</h3>
            
            <div className="flex items-baseline gap-2 text-xs font-mono">
              <span className="text-[#00f0ff] font-bold text-xl tracking-tight">
                NT$ {selectedRental.price.toLocaleString()}
              </span>
              <span className="text-[11px] text-gray-500 font-normal">/ 月</span>
            </div>
          </div>

          {/* 3. GIS Analytics Badge */}
          {commuteData && (
            <div className="bg-[#161a25] border border-white/5 rounded-lg p-3 flex flex-col gap-2.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f0ff]/5 rounded-full blur-2xl -mt-10 -mr-10 pointer-events-none"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-[#00f0ff]" />
                  GIS 通勤指標
                </span>
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${commuteData.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : commuteData.score >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-400'}`}>
                  SCORE {commuteData.score}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="flex flex-col gap-1 text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    距築本科技
                  </span>
                  <span className="font-mono text-gray-200">
                    {commuteData.distToOffice < 1000 ? `${Math.round(commuteData.distToOffice)}m` : `${(commuteData.distToOffice / 1000).toFixed(1)}km`}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-[11px]">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Train className="w-3 h-3" />
                    最近捷運站
                  </span>
                  <span className="font-mono text-gray-200">
                    {commuteData.nearestMrt} <span className="text-gray-500">({Math.round(commuteData.minMrtDist)}m)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Pros/Cons Tags */}
          {(selectedRental.pros.length > 0 || selectedRental.cons.length > 0) && (
            <div className="flex flex-col gap-1.5 pt-1">
              {selectedRental.pros.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRental.pros.map((pro, i) => (
                    <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      + {pro}
                    </span>
                  ))}
                </div>
              )}
              {selectedRental.cons.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedRental.cons.map((con, i) => (
                    <span key={i} className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      − {con}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Dynamic Custom Attributes Grid */}
          <div className="pt-3 border-t border-white/5">
            <h4 className="text-[20px] font-bold text-gray-400 mb-2 flex items-center gap-1">
              <Info className="w-5 h-5" /> 附加屬性
            </h4>
            <div className={`grid gap-x-3 gap-y-3 ${
              sidebarWidth >= 840 ? 'grid-cols-4' : sidebarWidth >= 630 ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {pingValue !== null && (
                <div className="flex flex-col">
                  <span className="text-[20px] text-gray-500 font-medium">單坪租金</span>
                  <span className="text-[24px] text-[#00f0ff] font-mono font-bold tracking-tight">
                    ${Math.round(selectedRental.price / pingValue).toLocaleString()} <span className="text-[20px] font-normal text-gray-500">/坪</span>
                  </span>
                </div>
              )}
              
              {Object.entries(selectedRental.customFields).map(([key, value], i) => {
                const lowerKey = key.toLowerCase();
                const isFullWidth = ['地址', 'address', '家具', '設備', 'facilities', 'furniture', '提供設備'].some(k => lowerKey.includes(k));
                
                return (
                  <div key={i} className={`flex flex-col ${isFullWidth ? 'col-span-full' : ''}`}>
                    <span className="text-[20px] text-gray-500 font-medium truncate" title={key}>{key}</span>
                    <span className={`text-[15px] text-gray-200 font-mono ${isFullWidth ? 'break-words whitespace-normal' : 'truncate'}`} title={String(value || '-')}>{value || '-'}</span>
                  </div>
                );
              })}

              {Object.keys(selectedRental.customFields).length === 0 && pingValue === null && (
                 <div className="col-span-full text-[20px] text-gray-600 font-mono italic">無其他自訂屬性</div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
          <Building className="w-8 h-8 text-gray-700 mb-2" />
          <span className="text-xs text-gray-500">點擊地圖上的物件以查看詳細資料</span>
        </div>
      )}
    </div>
  );
};
