import React from "react";

interface RentalScoreBreakdownProps {
  breakdown: {
    name: string;
    value: string;
    score: number;
    type: "positive" | "negative" | "neutral";
  }[];
}

export const RentalScoreBreakdown: React.FC<RentalScoreBreakdownProps> = ({
  breakdown,
}) => {
  const buffs = breakdown.filter((item) => item.score > 0);
  const debuffs = breakdown.filter((item) => item.score < 0);

  return (
    <div className="flex flex-col gap-4 pt-2">
      {/* 屬性增幅 (Buffs) */}
      <div>
        <h4 className="text-[12px] font-bold text-gray-400 mb-2 border-b border-white/10 pb-1">
          【屬性增幅 (Buffs)】
        </h4>
        <div className="flex flex-col gap-1.5">
          {buffs.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-1 animate-fade-in"
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
            <div className="text-[11px] text-gray-500 italic px-1">
              無增幅屬性
            </div>
          )}
        </div>
      </div>

      {/* 屬性減益 (Debuffs) */}
      <div>
        <h4 className="text-[12px] font-bold text-gray-400 mb-2 border-b border-white/10 pb-1">
          【屬性減益 (Debuffs)】
        </h4>
        <div className="flex flex-col gap-1.5">
          {debuffs.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-1 animate-fade-in"
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
            <div className="text-[11px] text-gray-500 italic px-1">
              無減益屬性
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
