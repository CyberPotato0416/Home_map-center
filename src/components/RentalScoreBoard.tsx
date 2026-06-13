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
}

export const RentalScoreBoard: React.FC<RentalScoreBoardProps> = ({
  rpgData,
  commuteDistToOffice,
  pingValue,
  price,
  floor,
  rarityColor,
}) => {
  const renderBlocks = (score: number, max: number = 10, color: string) => {
    const filled = Math.round(score);
    return (
      <div className="flex gap-[2px] mt-1.5 h-2.5 w-full max-w-[200px]">
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
    <div className="grid grid-cols-1 gap-3 pt-1">
        <div className="flex flex-col">
          <div className="flex justify-between items-end text-[12px] font-mono">
            <span className="text-gray-300">通勤力</span>
            <span className="text-gray-400 text-[10px]">
              {rpgData.commuteScore.toFixed(1)}/10 (直線 {Math.round(commuteDistToOffice)}
              m)
            </span>
          </div>
          {renderBlocks(rpgData.commuteScore, 10, rarityColor)}
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-end text-[12px] font-mono">
            <span className="text-gray-300">空間力</span>
            <span className="text-gray-400 text-[10px]">
              {rpgData.spaceScore.toFixed(1)}/10 ({pingValue ? `${pingValue} 坪` : "未知"})
            </span>
          </div>
          {renderBlocks(rpgData.spaceScore, 10, rarityColor)}
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between items-end text-[12px] font-mono">
            <span className="text-gray-300">預算力</span>
            <span className="text-gray-400 text-[10px]">
              {rpgData.budgetScore.toFixed(1)}/10 (${price.toLocaleString()})
            </span>
          </div>
          {renderBlocks(rpgData.budgetScore, 10, rarityColor)}
        </div>
      </div>
  );
};
