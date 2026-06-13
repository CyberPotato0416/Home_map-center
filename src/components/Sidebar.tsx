import React from "react";
import {
  Sword,
  Sliders,
  Layers,
  Train,
  FileSpreadsheet,
  Database,
} from "lucide-react";
import { MapControlTab } from "./MapControlTab";
import { RentHeatmapTab } from "./RentHeatmapTab";
import { MrtCommuteTab } from "./MrtCommuteTab";
import { RentalImportTab } from "./RentalImportTab";
import { FilterExportTab } from "./FilterExportTab";
import { useAppContext } from "../context/AppContext";

export const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    activeTab,
    setActiveTab,
    sidebarWidth,
    setSidebarWidth,
    isSidebarDragging,
    setIsSidebarDragging,
    recenterMap,
  } = useAppContext();

  const startResizing = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (window.innerWidth < 768) return; // Disable drag on mobile

      setIsSidebarDragging(true);
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        let newWidth = startWidth - deltaX;
        if (newWidth < 320) newWidth = 320;
        if (newWidth > document.body.clientWidth * 0.8)
          newWidth = document.body.clientWidth * 0.8;
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsSidebarDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth, setSidebarWidth, setIsSidebarDragging],
  );

  return (
    <div
      id="sidebar"
      style={
        window.innerWidth >= 768 && isSidebarOpen ? { width: sidebarWidth } : {}
      }
      className={`relative h-[40vh] md:h-full overflow-y-auto bg-[#0a0b10] border-t md:border-t-0 md:border-l border-[#1e2330] flex flex-col order-2 md:order-2 shrink-0 ${
        isSidebarDragging ? "" : "transition-all duration-300 ease-in-out"
      } ${
        isSidebarOpen
          ? "w-full md:w-[420px] opacity-100 visible"
          : "w-0 md:w-0 opacity-0 invisible overflow-hidden border-l-0"
      }`}
    >
      {isSidebarOpen && window.innerWidth >= 768 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#00f0ff] hover:opacity-50 z-[100] transition-colors"
          onMouseDown={startResizing}
        />
      )}
      {/* BRAND HEADER & LOGO */}
      <div className="p-5 border-b border-[#1e2330] bg-[#0c0d13]/70 backdrop-blur-sm shrink-0 selection:bg-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f0ff] to-[#005fff] flex items-center justify-center shadow-lg shadow-[#00f0ff]/20 shrink-0">
            <Sword className="w-5 h-5 text-gray-900 font-bold" />
          </div>
          <div>
            <div className="text-xs font-mono text-cyan-400 tracking-wider font-extrabold uppercase">
              592 Premium
            </div>
            <h1 className="text-base font-bold text-gray-100 tracking-tight leading-tight">
              租屋通勤分析系統
            </h1>
          </div>
        </div>
      </div>

      {/* CYBERPUNK CHRONO-TAB NAVIGATION */}
      <div className="flex bg-[#0c0d12] border-b border-[#1e2330] shrink-0 sticky top-0 z-30 select-none">
        <button
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-1 cursor-pointer outline-none ${
            activeTab === 1
              ? "text-[#00f0ff] border-[#00f0ff] bg-cyan-500/[0.04]"
              : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.02]"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>地圖控制</span>
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-1 cursor-pointer outline-none ${
            activeTab === 2
              ? "text-[#ff3860] border-[#ff3860] bg-red-500/[0.04]"
              : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.02]"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>租金熱圖</span>
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`flex-1 py-3 text-center text-xs font-bold transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-1 cursor-pointer outline-none ${
            activeTab === 3
              ? "text-amber-400 border-amber-400 bg-amber-500/[0.04]"
              : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.02]"
          }`}
        >
          <Train className="w-4 h-4" />
          <span>捷運通勤</span>
        </button>
        <button
          onClick={() => setActiveTab(4)}
          className={`flex-1 py-3 text-center text-[11px] font-bold transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-1 cursor-pointer outline-none ${
            activeTab === 4
              ? "text-[#00f0ff] border-[#00f0ff] bg-[#00f0ff]/[0.04]"
              : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.02]"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>物件詳情</span>
        </button>
        <button
          onClick={() => setActiveTab(5)}
          className={`flex-1 py-3 text-center text-[11px] font-bold transition-all duration-200 border-b-2 flex flex-col items-center justify-center gap-1 cursor-pointer outline-none ${
            activeTab === 5
              ? "text-purple-400 border-purple-400 bg-purple-500/[0.04]"
              : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.02]"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>篩選與備份</span>
        </button>
      </div>

      {/* MAIN SIDEBAR PANEL CONTENTS */}
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
        {activeTab === 1 && <MapControlTab />}
        {activeTab === 2 && <RentHeatmapTab />}
        {activeTab === 3 && <MrtCommuteTab />}
        {activeTab === 4 && <RentalImportTab />}
        {activeTab === 5 && <FilterExportTab />}
      </div>

      {/* INNER CARD FOOTERS */}
      <div className="p-4 bg-[#0a0b10] border-t border-[#1e2330] text-center text-[10px] text-gray-500 font-mono tracking-wide mt-auto shrink-0 select-none">
        © 2026 592 Premium | 個人化租屋通勤分析系統
      </div>
    </div>
  );
};
