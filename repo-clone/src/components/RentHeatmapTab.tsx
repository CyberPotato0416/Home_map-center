import React from 'react';
import { Layers, Eye, EyeOff, Compass, Shield } from 'lucide-react';
import { RentData } from '../types';
import { getRentColor, calculateRecommendedSalary } from '../utils';

interface RentHeatmapTabProps {
  showHeatmap: boolean;
  setShowHeatmap: (s: boolean) => void;
  activeDistrictName: string | null;
  activeDistrictRent: RentData | null;
  selectedDistrict: string | null;
  setSelectedDistrict: (d: string | null) => void;
  setSelectedStation: (st: any | null) => void;
}

export const RentHeatmapTab: React.FC<RentHeatmapTabProps> = ({
  showHeatmap,
  setShowHeatmap,
  activeDistrictName,
  activeDistrictRent,
  selectedDistrict,
  setSelectedDistrict,
  setSelectedStation,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Rent Heatmap Toggle Card */}
      <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-[#ff3860]" />
            租金熱圖設定
          </div>
          <span className="text-[9px] bg-[#ff3860]/10 text-red-400 px-2 py-0.5 rounded font-mono border border-red-500/20">
            數據實時活化
          </span>
        </div>

        {/* Heatmap toggles as requested */}
        <div className="flex items-center justify-between text-xs text-gray-300 py-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
            顯示行政區租金統計熱圖
          </span>
          <button 
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              showHeatmap 
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/25' 
                : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
            }`}
            title={showHeatmap ? "隱藏租金熱圖" : "顯示租金熱圖"}
          >
            {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* DYNAMIC DISTRICT REPORT CARD */}
      <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
            <Compass className="w-4 h-4 text-cyan-400" />
            行政區租屋情報分析儀
          </span>
          <span className="text-[9px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-mono">
            REALTIME DISTRICT
          </span>
        </div>

        {activeDistrictName && activeDistrictRent ? (
          <div className="flex flex-col gap-3 animate-fade-in">
            {/* District Header and Pricing Level Indicator Badge */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getRentColor(activeDistrictRent.rent) }}></span>
                  {activeDistrictName}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">行政區租金統計情報</p>
              </div>
              <span className="text-[11px] font-bold bg-[#ff3860]/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-md">
                {activeDistrictRent.level}
              </span>
            </div>

            {/* Professional stats box */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col gap-0.5 text-center">
                <span className="text-[9px] text-[#9ca3af] uppercase">平均套雅房租金</span>
                <span className="text-sm font-bold font-mono text-cyan-400">
                  NT${activeDistrictRent.rent.toLocaleString()}
                </span>
                <span className="text-[8px] text-gray-500">元 / 每月估算</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col gap-0.5 text-center">
                <span className="text-[9px] text-[#9ca3af] uppercase">推薦月薪水準</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {calculateRecommendedSalary(activeDistrictRent.rent).salary.includes('NT$')
                    ? calculateRecommendedSalary(activeDistrictRent.rent).salary.split(' ')[0]
                    : 'NT$35K+'}
                </span>
                <span className="text-[8px] text-gray-500">維持健康收支比</span>
              </div>
            </div>

            {/* Recommended Role */}
            <div className="bg-[#0b0c10] border border-white/5 rounded-lg p-2.5 flex flex-col gap-1">
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">適配職涯與客群建議：</span>
              <div className="text-[11px] text-gray-200 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                {calculateRecommendedSalary(activeDistrictRent.rent).tier}
              </div>
            </div>

            {/* Description Text */}
            <p className="text-[11px] text-gray-400 leading-relaxed bg-[#0c0d12]/40 p-2 rounded-lg border border-white/5">
              <span className="font-bold text-cyan-400/80">行政區概述：</span>
              {activeDistrictRent.desc}
            </p>

            {selectedDistrict && (
              <button 
                onClick={() => {
                  setSelectedDistrict(null);
                  setSelectedStation(null);
                }}
                className="mt-1 text-center text-[10px] text-[#9ca3af] hover:text-white underline cursor-pointer"
              >
                清除點選篩選區塊
              </button>
            )}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <Compass className="w-10 h-10 text-gray-600 mb-2 animate-pulse" />
            <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed font-sans">
              請在地圖上 <span className="text-cyan-400 font-semibold">點擊</span> 或 <span className="text-[#00f0ff] font-semibold">滑鼠移入</span> 雙北市行政區塊
            </p>
            <p className="text-[9px] text-gray-600 mt-1.5 leading-snug">
              系統將即時回傳該行政區「租金水準與壓力級別」分析。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
