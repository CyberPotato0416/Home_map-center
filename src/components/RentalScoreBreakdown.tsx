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
  return (
    <div className="pt-2">
      <h4 className="text-[12px] font-bold text-gray-400 mb-3 border-b border-white/10 pb-1">
        【評分與扣分明細】
      </h4>
      <div className="flex flex-col gap-1.5">
        {breakdown.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center text-[11px] font-mono border-b border-white/5 pb-1"
          >
            <span
              className={`${
                item.type === "negative"
                  ? "text-[#ff3860]"
                  : item.type === "positive"
                    ? "text-[#00d1b2]"
                    : "text-gray-400"
              }`}
            >
              {item.name}: {item.value}
            </span>
            <span
              className={`font-bold ${
                item.type === "negative"
                  ? "text-[#ff3860]"
                  : item.type === "positive"
                    ? "text-[#00d1b2]"
                    : "text-gray-400"
              }`}
            >
              {item.score > 0 ? `+${item.score}` : item.score}
            </span>
          </div>
        ))}
        {breakdown.length === 0 && (
          <div className="text-[11px] text-gray-500 italic">
            無特殊加扣分項目
          </div>
        )}
      </div>
    </div>
  );
};
