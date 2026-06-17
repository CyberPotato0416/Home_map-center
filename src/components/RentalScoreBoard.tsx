import React from "react";
import { CommuteBenefitAnalysis } from "../types";

interface RentalScoreBoardProps {
  rpgData: {
    commuteScore: number;
    spaceScore: number;
    budgetScore: number;
    commuteAnalysis: CommuteBenefitAnalysis;
  };
  commuteDistToOffice: number;
  pingValue: number | null;
  price: number;
  floor: string | undefined;
  rarityColor: string;
  isDashboard?: boolean;
  subsidyAmount?: number; // 若可申請補助，傳入折抵金額（如 3000）
}

export const RentalScoreBoard: React.FC<RentalScoreBoardProps> = ({
  rpgData,
  commuteDistToOffice,
  pingValue,
  price,
  floor,
  rarityColor,
  isDashboard = false,
  subsidyAmount,
}) => {
  const renderBlocks = (score: number, max: number = 10, color: string) => {
    const filled = Math.round(score);
    return (
      <div className={`flex gap-[2px] ${isDashboard ? "mt-1.5 h-5 max-w-[400px]" : "mt-1 h-2 max-w-[200px]"} w-full`}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[1px] ${i < filled ? "" : "bg-white/10"}`}
            style={{ backgroundColor: i < filled ? color : undefined }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`grid grid-cols-1 ${isDashboard ? "gap-5 pt-1" : "gap-2 pt-0.5"}`}>
        <div className="flex flex-col">
          <div className={`flex justify-between items-end ${isDashboard ? "text-[24px]" : "text-xs"} font-mono`}>
            <span className="text-gray-300 font-bold">通勤力</span>
            <span className={`text-gray-400 ${isDashboard ? "text-[20px]" : "text-[10px]"}`}>
              {rpgData.commuteScore.toFixed(1)}/10 (直線 {Math.round(commuteDistToOffice)}m)
            </span>
          </div>
          {renderBlocks(rpgData.commuteScore, 10, rarityColor)}
        </div>

        <div className="flex flex-col">
          <div className={`flex justify-between items-end ${isDashboard ? "text-[24px]" : "text-xs"} font-mono`}>
            <span className="text-gray-300 font-bold">空間力</span>
            <span className={`text-gray-400 ${isDashboard ? "text-[20px]" : "text-[10px]"}`}>
              {rpgData.spaceScore.toFixed(1)}/10 ({pingValue ? `${pingValue} 坪` : "未知"})
            </span>
          </div>
          {renderBlocks(rpgData.spaceScore, 10, rarityColor)}
        </div>

        <div className="flex flex-col">
          <div className={`flex justify-between items-end ${isDashboard ? "text-[24px]" : "text-xs"} font-mono`}>
            <span className="text-gray-300 font-bold">預算力</span>
            <span className={`text-gray-400 ${isDashboard ? "text-[20px]" : "text-[10px]"}`}>
              {rpgData.budgetScore.toFixed(1)}/10 (
                {subsidyAmount && subsidyAmount > 0
                  ? `$${price.toLocaleString()} → $${(price - subsidyAmount).toLocaleString()} 含補助`
                  : `$${price.toLocaleString()}`}
              )
            </span>
          </div>
          {renderBlocks(rpgData.budgetScore, 10, rarityColor)}
        </div>
      </div>
  );
};
