import React from 'react';
import { Building2, ChevronDown, ChevronUp } from 'lucide-react';

interface FloatingHUDProps {
  radius: number;
  isInfoCardOpen: boolean;
  setIsInfoCardOpen: (open: boolean) => void;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({
  radius,
  isInfoCardOpen,
  setIsInfoCardOpen,
}) => {
  return (
    <div className="absolute top-4 left-4 z-[999] pointer-events-none flex flex-col gap-2 max-w-[85%] sm:max-w-md">
      {isInfoCardOpen ? (
        // Expanded State Cards
        <div className="bg-[#0c0d12]/92 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl pointer-events-auto transition-all duration-300 transform scale-100 origin-top-left animate-fade-in">
          <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] inline-block animate-pulse"></span>
              <span>中心站點 & 追蹤半徑</span>
            </div>
            <button
              onClick={() => setIsInfoCardOpen(false)}
              className="p-1 rounded hover:bg-white/10 border border-white/5 hover:border-white/20 text-[#9ca3af] hover:text-white transition-all cursor-pointer flex items-center justify-center focus:outline-none"
              title="收合詳細資訊"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#00f0ff]/10 border border-[#00f0ff]/20 rounded-lg text-[#00f0ff] shrink-0">
              <Building2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5 leading-snug">
                築本科技股份有限公司 (台北辦公室)
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                台北市民權東路三段 · 近捷運中山國中站
              </p>
              <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/5 pb-0.5">
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9ca3af] font-mono uppercase tracking-wider">中心座標</span>
                  <span className="text-[11px] font-mono text-[#00f0ff] font-medium">25.0617, 121.5435</span>
                </div>
                <div className="h-6 w-[1px] bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-[#9ca3af] font-mono uppercase tracking-wider">關聯半徑</span>
                  <span className="text-[11px] font-mono text-cyan-400 font-medium">{radius} 公里</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Compact Minimized State (only elegant icon and simple indicator)
        <button
          onClick={() => setIsInfoCardOpen(true)}
          className="bg-[#0c0d12]/92 backdrop-blur-md border border-cyan-400/30 hover:border-cyan-400 rounded-xl p-2.5 shadow-xl pointer-events-auto hover:bg-[#141620] text-cyan-400 hover:text-white transition-all duration-200 cursor-pointer flex items-center gap-2 group active:scale-95 animate-fade-in focus:outline-none"
          title="展開中心點資訊"
        >
          <Building2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span className="text-[10px] sm:text-xs font-semibold font-sans tracking-wide">🏢 中心點 ({radius}km 追蹤中)</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
};
