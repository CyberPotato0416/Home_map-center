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
    <div className="pt-2">
      <h4 className="text-[12px] font-bold text-gray-400 mb-3 border-b border-white/10 pb-1">
        【基礎性能分析】
      </h4>
      <div className="grid grid-cols-1 gap-3">
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

        <div className="flex flex-col rounded-xl border border-white/10 bg-[#081118] p-3 text-[12px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-300">通勤效益</span>
            <span
              className={`font-bold ${
                rpgData.commuteAnalysis.netBenefit >= 0
                  ? 'text-emerald-300'
                  : 'text-rose-300'
              } text-[11px]`}
            >
              {rpgData.commuteAnalysis.cpLabel}
            </span>
          </div>
          <div className="mt-2 text-gray-400 leading-tight">
            預估每月通勤成本：{Math.round(rpgData.commuteAnalysis.monthlyTimeCost).toLocaleString()} 元
          </div>
          <div className="mt-1 text-gray-400 leading-tight">
            租金差價：{Math.round(rpgData.commuteAnalysis.rentSaving).toLocaleString()} 元
          </div>
          <div className="mt-1 text-gray-400 leading-tight">
            將月淨效益向上調整到 400 元級距：
            {rpgData.commuteAnalysis.benefitLevel > 0
              ? `${rpgData.commuteAnalysis.roundedNetBenefit.toLocaleString()} 元，等級 ${rpgData.commuteAnalysis.benefitLevel}`
              : '無正向淨效益'}
          </div>
          <div className="mt-1 text-gray-200 font-semibold leading-tight">
            月淨效益：{rpgData.commuteAnalysis.netBenefit >= 0 ? '省 ' : '虧 '}
            {Math.abs(Math.round(rpgData.commuteAnalysis.netBenefit)).toLocaleString()} 元
          </div>
        </div>
      </div>
    </div>
  );
};
