import React, { useMemo, useState, useEffect } from 'react';
import { Building, Image as ImageIcon, Train, Bus, Navigation, Info, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { RentalProperty } from '../types';
import { calculateDistance, calculateHomeScore } from '../utils';
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);

  useEffect(() => {
    setCurrentImgIndex(0);
    setIsDetailsOpen(true);
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

  // Try to find nearest bus stop from customFields
  const busInfo = useMemo(() => {
    if (!selectedRental) return '未知';
    for (const [key, val] of Object.entries(selectedRental.customFields || {})) {
      if (key.includes('公車站') || key.toLowerCase().includes('bus')) {
        return String(val);
      }
    }
    return '未知';
  }, [selectedRental]);

  const rpgData = useMemo(() => {
    if (!selectedRental || !commuteData) return null;
    return calculateHomeScore(selectedRental, commuteData.distToOffice, commuteData.minMrtDist);
  }, [selectedRental, commuteData]);

  let rarityColor = '#9d9d9d';
  let rarityName = '普通';
  let glowClass = 'shadow-[#9d9d9d]/10';
  let borderClass = 'border-[#9d9d9d]';

  if (rpgData) {
    if (rpgData.totalScore >= 85) { rarityColor = '#ffb800'; rarityName = '傳說'; glowClass = 'shadow-[#ffb800]/20'; borderClass = 'border-[#ffb800]'; }
    else if (rpgData.totalScore >= 75) { rarityColor = '#a335ee'; rarityName = '史詩'; glowClass = 'shadow-[#a335ee]/20'; borderClass = 'border-[#a335ee]'; }
    else if (rpgData.totalScore >= 60) { rarityColor = '#0070dd'; rarityName = '稀有'; glowClass = 'shadow-[#0070dd]/20'; borderClass = 'border-[#0070dd]'; }
    else if (rpgData.totalScore >= 50) { rarityColor = '#1eff00'; rarityName = '優秀'; glowClass = 'shadow-[#1eff00]/20'; borderClass = 'border-[#1eff00]'; }
  }

  const renderBlocks = (score: number, max: number = 10, color: string) => {
    const filled = Math.round(score);
    return (
      <div className="flex gap-[2px] mt-1.5 h-2.5 w-full max-w-[200px]">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={`flex-1 rounded-[1px] ${i < filled ? '' : 'bg-white/10'}`} style={{ backgroundColor: i < filled ? color : undefined }} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Selected Rental Details Section */}
      {selectedRental && rpgData ? (
        <div className={`bg-[#0f111a] border border-white/5 border-l-[4px] ${borderClass} rounded-xl p-4 shadow-lg ${glowClass} flex flex-col gap-4 animate-fade-in`}>
          
          {/* 1. Header (Rarity & Title) */}
          <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 text-[10px] font-bold font-mono rounded" style={{ backgroundColor: rarityColor, color: rarityColor === '#1eff00' || rarityColor === '#ffb800' ? '#000' : '#fff' }}>
                {rarityName}
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {selectedRental.type || '未分類'} | iLvl: {selectedRental.id}
              </span>
            </div>
            <h3 className="text-[16px] font-bold text-gray-100 leading-snug" style={{ color: rarityColor }}>
              {selectedRental.title}
            </h3>
            <div className="flex items-baseline gap-2 font-mono mt-1">
              <span className="text-[#00f0ff] font-bold text-[24px] tracking-tight">
                NT$ {selectedRental.price.toLocaleString()}
              </span>
              <span className="text-[12px] text-gray-500 font-normal">/ 月</span>
            </div>
            {(() => {
              let displayLink = selectedRental.link || '';
              if (displayLink.includes('.jpg') || displayLink.includes('img') || displayLink.includes('.png')) displayLink = '';
              if (!displayLink && selectedRental.customFields?.original_591_id) {
                displayLink = `https://rent.591.com.tw/${selectedRental.customFields.original_591_id}`;
              }
              if (!displayLink && selectedRental.source_591_url) {
                displayLink = selectedRental.source_591_url;
              }
              
              return displayLink ? (
                <a href={displayLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-[11px] underline underline-offset-2 w-fit mt-1">
                  🔗 前往 591 原始網頁
                </a>
              ) : null;
            })()}
          </div>

          {/* Image Gallery */}
          <div className="space-y-1.5 relative group">
            <div className="aspect-video w-full bg-[#1e2330] rounded-lg overflow-hidden border border-white/5 relative flex items-center justify-center">
              {selectedRental.images && selectedRental.images.length > 0 ? (
                <>
                  <img 
                    src={selectedRental.images[currentImgIndex]} 
                    alt="preview" 
                    className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
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
          </div>

          {/* 2. GIS Distances */}
          <div className="flex items-center gap-4 text-[12px] pb-1 px-1 mt-1">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                距築本科技
              </span>
              <span className="font-mono text-gray-200 font-bold">
                {commuteData.distToOffice < 1000 ? `${Math.round(commuteData.distToOffice)}m` : `${(commuteData.distToOffice / 1000).toFixed(1)}km`}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-2"></div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 flex items-center gap-1">
                <Train className="w-3.5 h-3.5 text-emerald-400" />最近捷運站
              </span>
              <span className="font-mono text-gray-200 font-bold">
                {commuteData.nearestMrt || '未知'} <span className="text-gray-500 font-normal text-[10px]">({Math.round(commuteData.minMrtDist)}m)</span>
              </span>
            </div>
            {busInfo !== '未知' && (
              <>
                <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-2"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-sky-400" />最近公車站
                  </span>
                  <span className="font-mono text-gray-200 font-bold">
                    {busInfo}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 3. Score & Notes */}
          <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="flex flex-col items-center justify-center shrink-0">
              <span className="text-[12px] text-gray-400 font-bold mb-[-4px]">戰鬥力</span>
              <span className="text-[40px] font-mono font-bold tracking-tighter" style={{ color: rarityColor }}>
                {rpgData.totalScore}
              </span>
            </div>
            <div className="flex flex-col h-full border-l border-white/10 pl-4 w-full">
              <span className="text-[11px] text-gray-500 mb-1">備註欄位</span>
              <p className="text-[13px] text-gray-300 font-mono italic leading-relaxed break-all line-clamp-3">
                {rpgData.notes ? `"${rpgData.notes}"` : "待審核"}
              </p>
            </div>
          </div>

          {/* 4. Core Stats Progress Bars */}
          <div className="pt-2">
            <h4 className="text-[12px] font-bold text-gray-400 mb-3 border-b border-white/10 pb-1">【基礎性能分析】</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col">
                <div className="flex justify-between items-end text-[12px] font-mono">
                  <span className="text-gray-300">通勤力</span>
                  <span className="text-gray-400 text-[10px]">{rpgData.commuteScore.toFixed(1)}/10 (直線 {Math.round(commuteData?.distToOffice || 0)}m)</span>
                </div>
                {renderBlocks(rpgData.commuteScore, 10, rarityColor)}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-end text-[12px] font-mono">
                  <span className="text-gray-300">空間力</span>
                  <span className="text-gray-400 text-[10px]">{rpgData.spaceScore.toFixed(1)}/10 ({pingValue ? `${pingValue} 坪` : '未知'})</span>
                </div>
                {renderBlocks(rpgData.spaceScore, 10, rarityColor)}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-end text-[12px] font-mono">
                  <span className="text-gray-300">預算力</span>
                  <span className="text-gray-400 text-[10px]">{rpgData.budgetScore.toFixed(1)}/10 (${selectedRental.price.toLocaleString()})</span>
                </div>
                {renderBlocks(rpgData.budgetScore, 10, rarityColor)}
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-end text-[12px] font-mono">
                  <span className="text-gray-300">便利力</span>
                  <span className="text-gray-400 text-[10px]">{rpgData.convenienceScore.toFixed(1)}/10 ({selectedRental.floor || '未知樓層'})</span>
                </div>
                {renderBlocks(rpgData.convenienceScore, 10, rarityColor)}
              </div>
            </div>
          </div>

          {/* 5. Secondary Attributes */}
          <div className="pt-2">
            <h4 className="text-[12px] font-bold text-gray-400 mb-3 border-b border-white/10 pb-1">【附加裝備數值】</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-5 flex justify-center">⚡</span>
                <span className="font-mono">能源負載: {rpgData.features.electricity}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-5 flex justify-center">🗑️</span>
                <span className="font-mono">後勤維護: {rpgData.features.trash}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="w-5 flex justify-center">❄️</span>
                <span className="font-mono">環境溫控: {rpgData.features.ac}</span>
              </div>
            </div>
          </div>

          {/* 6. Buffs & Debuffs Detail Breakdown */}
          <div className="pt-2">
            <button 
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className="w-full flex items-center justify-between text-[12px] font-bold text-gray-400 mb-2 border-b border-white/10 pb-1 hover:text-gray-300 transition-colors"
            >
              <span>【評分與扣分明細】</span>
              {isDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            
            {isDetailsOpen && (
              <div className="flex flex-col gap-1.5 pr-1 -mr-2">
                {rpgData.breakdown.map((item, i) => (
                  <div key={i} className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg text-[11px] font-mono border ${
                    item.type === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.type === 'negative' ? 'bg-[#ff3860]/10 text-[#ff3860] border-[#ff3860]/20' :
                    'bg-gray-800 text-gray-400 border-gray-700'
                  }`}>
                    <span className="flex items-center gap-1.5 font-bold">
                      {item.type === 'positive' && <span className="opacity-80">✦</span>}
                      {item.type === 'negative' && <span className="opacity-80 text-[10px] mt-[1px]">💀</span>}
                      {item.name} <span className="opacity-60 text-[10px] font-normal">({item.value})</span>
                    </span>
                    <span className="font-bold text-[12px]">{item.score > 0 ? `+${item.score}` : item.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Dynamic Custom Attributes Grid */}
          <div className="pt-3">
            <h4 className="text-[12px] font-bold text-gray-400 mb-3 border-b border-white/10 pb-1 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> 附加屬性
            </h4>
            <div className={`grid gap-x-2 gap-y-3 ${
              sidebarWidth >= 840 ? 'grid-cols-4' : sidebarWidth >= 630 ? 'grid-cols-3' : 'grid-cols-2'
            }`}>
              {pingValue !== null && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium mb-0.5">size_ping (坪數)</span>
                  <span className="text-[12px] text-gray-200 font-mono tracking-tight">
                    {pingValue}
                  </span>
                </div>
              )}
              
              {selectedRental.floor && (
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-medium mb-0.5">floor (樓層)</span>
                  <span className="text-[12px] text-gray-200 font-mono tracking-tight">
                    {selectedRental.floor}
                  </span>
                </div>
              )}

              {Object.entries(selectedRental.customFields).map(([key, value], i) => {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'floor' || lowerKey === 'size_ping') return null; // Avoid duplicating if already displayed

                const isFullWidth = ['地址', 'address', '家具', '設備', 'facilities', 'furniture', '提供設備', 'created_at', 'created'].some(k => lowerKey.includes(k));
                
                return (
                  <div key={i} className={`flex flex-col ${isFullWidth ? 'col-span-full' : ''}`}>
                    <span className="text-[10px] text-gray-500 font-medium truncate mb-0.5" title={key}>{key}</span>
                    <span className={`text-[12px] text-gray-200 font-mono ${isFullWidth ? 'break-all whitespace-normal leading-relaxed' : 'truncate'}`} title={String(value || '-')}>{value || '-'}</span>
                  </div>
                );
              })}

              {Object.keys(selectedRental.customFields).length === 0 && pingValue === null && !selectedRental.floor && (
                 <div className="col-span-full text-[11px] text-gray-600 font-mono italic">無其他自訂屬性</div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
          <Building className="w-8 h-8 text-gray-700 mb-2" />
          <span className="text-xs text-gray-500">點擊地圖上的物件以查看武器裝備屬性卡</span>
        </div>
      )}
    </div>
  );
};
