import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface LegendHUDProps {
  showHeatmap: boolean;
}

const colorLevels = [
  { color: '#BD2C41', range: 'NT$21,000+', desc: '極高租金區 (信義)' },
  { color: '#C84656', range: 'NT$20,000 - 20,999', desc: '極高租金區 (大安)' },
  { color: '#D25D6B', range: 'NT$19,000 - 19,999', desc: '高端租金區' },
  { color: '#D97480', range: 'NT$18,000 - 18,999', desc: '高租金區 (松山)' },
  { color: '#C8A06B', range: 'NT$17,000 - 17,999', desc: '中高租金區' },
  { color: '#D2B17B', range: 'NT$16,000 - 16,999', desc: '中階租金區' },
  { color: '#DAC18A', range: 'NT$15,000 - 15,999', desc: '中階租金區' },
  { color: '#6B8DA6', range: 'NT$14,000 - 14,999', desc: '中階租金區' },
  { color: '#7BA0B8', range: 'NT$13,000 - 13,999', desc: '中低租金區' },
  { color: '#8BB2CA', range: 'NT$12,000 - 12,999', desc: '低階租金區' },
  { color: '#7D9E84', range: 'NT$11,000 - 11,999', desc: '低階租金區' },
  { color: '#8DB295', range: 'NT$10,000 - 10,999', desc: '平價租金區' },
  { color: '#9DC5A6', range: '< NT$10,000', desc: '超親民租金區' },
];

export const LegendHUD: React.FC<LegendHUDProps> = ({ showHeatmap }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (!showHeatmap) return null;

  return (
    <div className="absolute bottom-5 right-16 z-[999] pointer-events-auto transition-all duration-300 hidden sm:block animate-fade-in">
      <div className="bg-[#0c0d12]/92 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl max-w-[260px]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center justify-between w-full text-left gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider hover:text-white transition-colors cursor-pointer focus:outline-none ${
            isCollapsed ? '' : 'mb-2 pb-1.5 border-b border-white/10'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            雙北租金熱圖說明
          </span>
          {isCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {!isCollapsed && (
          <>
            <div className="flex flex-col gap-1 text-[9px] max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {colorLevels.map((lvl, idx) => (
                <div key={idx} className="flex items-center justify-between text-gray-300 py-0.5">
                  <span className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-sm border border-white/15" 
                      style={{ backgroundColor: lvl.color }}
                    />
                    <span className="font-mono text-gray-200 font-semibold">{lvl.range}</span>
                  </span>
                  <span className="text-gray-400 text-[8px] font-sans">{lvl.desc}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-[#9ca3af] leading-tight font-sans">
              * 數據基於大台北地區平均套雅房市租水準編彙。
            </div>
          </>
        )}
      </div>
    </div>
  );
};
