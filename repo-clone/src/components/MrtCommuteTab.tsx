import React from 'react';
import { Train, Eye, EyeOff, Compass } from 'lucide-react';
import { MrtStation } from '../types';
import { MRT_LINE_COLORS, MRT_STATIONS_DATA } from '../constants';

interface MrtCommuteTabProps {
  showHeatmap: boolean;
  setShowHeatmap: (v: boolean) => void;
  showMrtLines: boolean;
  setShowMrtLines: (v: boolean) => void;
  showMrtStations: boolean;
  setShowMrtStations: (v: boolean) => void;
  showMrtLabels: boolean;
  setShowMrtLabels: (v: boolean) => void;
  selectedStation: MrtStation | null;
  setSelectedStation: (station: MrtStation | null) => void;
  setSelectedDistrict: (d: string | null) => void;
  onStationClick: (station: MrtStation) => void;
}

export const MrtCommuteTab: React.FC<MrtCommuteTabProps> = ({
  showHeatmap,
  setShowHeatmap,
  showMrtLines,
  setShowMrtLines,
  showMrtStations,
  setShowMrtStations,
  showMrtLabels,
  setShowMrtLabels,
  selectedStation,
  setSelectedStation,
  setSelectedDistrict,
  onStationClick,
}) => {
  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* MRT Controls Card */}
      <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <Train className="w-4 h-4 text-amber-400" />
            圖層與軌道設定
          </div>
          <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-mono border border-amber-500/20">
            核心圖層同步
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              顯示/隱藏 行政區套房租金底圖
            </span>
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showHeatmap 
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25' 
                  : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={showHeatmap ? "隱藏租金底圖" : "顯示租金底圖"}
            >
              {showHeatmap ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* MRT Lines Toggle */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-sm"></span>
              顯示/隱藏 捷運路網折線
            </span>
            <button 
              onClick={() => setShowMrtLines(!showMrtLines)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showMrtLines 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25' 
                  : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={showMrtLines ? "隱藏捷運路網" : "顯示捷運路網"}
            >
              {showMrtLines ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* MRT Stations Toggle */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white border border-emerald-400 inline-block"></span>
              顯示/隱藏 捷運站點標記
            </span>
            <button 
              onClick={() => setShowMrtStations(!showMrtStations)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showMrtStations 
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25' 
                  : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={showMrtStations ? "隱藏捷運站點" : "顯示捷運站點"}
            >
              {showMrtStations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>

          {/* MRT Labels Toggle */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono bg-white/10 text-white/50 px-1 rounded flex items-center justify-center">T</span>
              顯示/隱藏 捷運站名名稱
            </span>
            <button 
              onClick={() => setShowMrtLabels(!showMrtLabels)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showMrtLabels 
                  ? 'bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25' 
                  : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={showMrtLabels ? "隱藏捷運站名" : "顯示捷運站名"}
            >
              {showMrtLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Station Detail Report Card (renders if selectedStation exists) */}
      {selectedStation && (
        <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg animate-fade-in">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-cyan-400" />
              捷運站點詳細分析
            </span>
            <span className="text-[9px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-mono">
              STATION ACTIVE
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-100 flex items-center gap-1.5 leading-snug">
                  <span className="w-2.5 h-2.5 rounded-full bg-white border inline-block shrink-0" style={{ borderColor: MRT_LINE_COLORS[selectedStation.lines[0]] }}></span>
                  {selectedStation.name} 站
                </h3>
                <p className="text-[10px] text-[#9ca3af] mt-0.5 font-sans">台北大眾捷運通勤地標</p>
              </div>
              <div className="flex gap-1">
                {selectedStation.lines.map((line: string) => (
                  <span 
                    key={line} 
                    className="text-[8.5px] font-bold text-white font-mono px-1.5 py-0.5 rounded border border-white/10 shrink-0 leading-none"
                    style={{ backgroundColor: MRT_LINE_COLORS[line] }}
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col gap-0.5 text-center">
                <span className="text-[9px] text-[#9ca3af] uppercase">公司通勤級別</span>
                <span className="text-sm font-bold font-mono text-cyan-400">
                  {selectedStation.name === "中山國中" ? "SS 神速級" : selectedStation.lines.includes("BR") ? "S 暢行級" : "A 快速級"}
                </span>
                <span className="text-[8px] text-gray-500">直達民權東路三段</span>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-lg p-2 flex flex-col gap-0.5 text-center">
                <span className="text-[9px] text-[#9ca3af] uppercase">交會路線數</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {selectedStation.lines.length > 1 ? `${selectedStation.lines.length} 鐵共構` : "單線支點"}
                </span>
                <span className="text-[8px] text-gray-500">
                  {selectedStation.lines.length > 1 ? "轉乘戰略大站" : "核心民生站點"}
                </span>
              </div>
            </div>

            <div className="bg-[#0b0c10] border border-white/5 rounded-lg p-2.5 flex flex-col gap-1">
              <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">聯絡與通勤特色評級：</span>
              <p className="text-[11px] text-gray-300 leading-normal font-sans">
                {selectedStation.desc}
              </p>
            </div>

            <button 
              onClick={() => setSelectedStation(null)}
              className="text-center text-[10px] text-cyan-400 hover:text-white underline cursor-pointer mt-1"
            >
              返回通勤捷運總表
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: METRO COMMUTE ANALYSIS PANEL */}
      <div className="bg-[#141722]/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-md">
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
          <span className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <Train className="w-4 h-4 text-[#00f0ff]" />
            捷運通勤交會分析儀
          </span>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono">
            PHASE 3 ACTIVE
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="text-[11px] text-gray-400 leading-normal font-sans">
            本系統已疊加台北捷運五大核心高架與地下軌道線，分析出以下與位於<span className="text-[#00f0ff] font-semibold">中山國中站</span>旁的築本總部最緊密的通勤前哨站：
          </p>

          <div className="flex flex-col gap-2 mt-1">
            {/* Station item 1 */}
            <button 
              onClick={() => {
                const st = MRT_STATIONS_DATA.find(s => s.name === "中山國中");
                if (st) onStationClick(st);
              }}
              className="w-full text-left bg-white/[0.02] border border-white/5 hover:border-[#00f0ff]/30 p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#9E652E] shrink-0"></span>
                <span className="text-[11px] font-bold text-gray-100">中山國中 站</span>
              </span>
              <span className="text-[9px] bg-[#9E652E]/10 text-[#9E652E] px-1.5 py-0.5 rounded font-mono font-bold hover:scale-105 transition-transform shrink-0">
                直達 0 分鐘
              </span>
            </button>

            {/* Station item 2 */}
            <button 
              onClick={() => {
                const st = MRT_STATIONS_DATA.find(s => s.name === "南京復興");
                if (st) onStationClick(st);
              }}
              className="w-full text-left bg-white/[0.02] border border-white/5 hover:border-[#00f0ff]/30 p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#9E652E]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#008659]"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-100">南京復興 站</span>
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold hover:scale-105 transition-transform shrink-0">
                捷運 1 站 (棕/綠)
              </span>
            </button>

            {/* Station item 3 */}
            <button 
              onClick={() => {
                const st = MRT_STATIONS_DATA.find(s => s.name === "忠孝復興");
                if (st) onStationClick(st);
              }}
              className="w-full text-left bg-white/[0.02] border border-white/5 hover:border-[#00f0ff]/30 p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#9E652E]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#0070BD]"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-100">忠孝復興 站</span>
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold hover:scale-105 transition-transform shrink-0">
                捷運 2 站 (棕/藍)
              </span>
            </button>

            {/* Station item 4 */}
            <button 
              onClick={() => {
                const st = MRT_STATIONS_DATA.find(s => s.name === "大安");
                if (st) onStationClick(st);
              }}
              className="w-full text-left bg-white/[0.02] border border-white/5 hover:border-[#00f0ff]/30 p-2 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all hover:bg-white/[0.04]"
            >
              <span className="flex items-center gap-2">
                <span className="flex gap-0.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#9E652E]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#E3002C]"></span>
                </span>
                <span className="text-[11px] font-bold text-gray-100">大安 站</span>
              </span>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold hover:scale-105 transition-transform shrink-0">
                捷運 3 站 (棕/紅)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
