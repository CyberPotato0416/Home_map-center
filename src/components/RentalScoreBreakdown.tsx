import React from "react";

interface RentalScoreBreakdownProps {
  breakdown: {
    name: string;
    value: string;
    score: number;
    type: "positive" | "negative" | "neutral";
  }[];
  isDashboard?: boolean;
}

export const RentalScoreBreakdown: React.FC<RentalScoreBreakdownProps> = ({
  breakdown,
  isDashboard = false,
}) => {
  const buffs = breakdown.filter((item) => item.score > 0);
  const debuffs = breakdown.filter((item) => item.score < 0);
  const neutrals = breakdown.filter((item) => item.type === "neutral");

  return (
    <div className={`flex flex-col ${isDashboard ? "gap-4 pt-2" : "gap-2 pt-1"}`}>
      {/* 屬性增幅 (Buffs) */}
      <div>
        <h4 className={`${isDashboard ? "text-[24px] mb-2 pb-1" : "text-[12px] font-bold mb-1 pb-0.5"} text-gray-400 border-b border-white/10`}>
          【屬性增幅 (Buffs)】
        </h4>
        <div className={`flex flex-col ${isDashboard ? "gap-1.5" : "gap-0.5"}`}>
          {buffs.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center ${isDashboard ? "text-[22px] pb-1" : "text-[11px] pb-0.5"} font-mono border-b border-white/5 animate-fade-in`}
            >
              <span className="text-[#00d1b2] font-semibold">
                ✦ {item.name} {item.value ? `(${item.value})` : ""}
              </span>
              <span className="text-[#00d1b2] font-bold font-mono">
                +{item.score}
              </span>
            </div>
          ))}
          {buffs.length === 0 && (
            <div className={`${isDashboard ? "text-[22px]" : "text-[10px]"} text-gray-500 italic px-1`}>
              無增幅屬性
            </div>
          )}
        </div>
      </div>

      {/* 屬性減益 (Debuffs) */}
      <div>
        <h4 className={`${isDashboard ? "text-[24px] mb-2 pb-1" : "text-[12px] font-bold mb-1 pb-0.5"} text-gray-400 border-b border-white/10`}>
          【屬性減益 (Debuffs)】
        </h4>
        <div className={`flex flex-col ${isDashboard ? "gap-1.5" : "gap-0.5"}`}>
          {debuffs.map((item, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center ${isDashboard ? "text-[22px] pb-1" : "text-[11px] pb-0.5"} font-mono border-b border-white/5 animate-fade-in`}
            >
              <span className="text-[#ff3860] font-semibold">
                💀 {item.name} {item.value ? `(${item.value})` : ""}
              </span>
              <span className="text-[#ff3860] font-bold font-mono">
                {item.score}
              </span>
            </div>
          ))}
          {debuffs.length === 0 && (
            <div className={`${isDashboard ? "text-[22px]" : "text-[10px]"} text-gray-500 italic px-1`}>
              無減益屬性
            </div>
          )}
        </div>
      </div>

      {/* 屬性說明 (Info/Neutral) — 中性詞條：+0 分但影響計算或值得注意 */}
      {neutrals.length > 0 && (
        <div>
          <h4 className={`${isDashboard ? "text-[24px] mb-2 pb-1" : "text-[12px] font-bold mb-1 pb-0.5"} text-gray-400 border-b border-white/10`}>
            【屬性說明 (Info)】
          </h4>
          <div className={`flex flex-col ${isDashboard ? "gap-1.5" : "gap-0.5"}`}>
            {neutrals.map((item, idx) => (
              <div
                key={idx}
                className={`flex justify-between items-center ${isDashboard ? "text-[22px] pb-1" : "text-[11px] pb-0.5"} font-mono border-b border-white/5 animate-fade-in`}
              >
                <span className="text-[#7ec8e3] font-semibold">
                  ℹ️ {item.name} {item.value ? `(${item.value})` : ""}
                </span>
                <span className="text-[#7ec8e3] font-bold font-mono">
                  ±0
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

