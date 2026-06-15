import React from "react";
import { Info } from "lucide-react";

interface CustomAttribute {
  key: string;
  val: any;
  isFullWidth?: boolean;
}

interface RentalAttributesGridProps {
  attributes: CustomAttribute[];
  sidebarWidth: number;
  children?: React.ReactNode;
  isDashboard?: boolean;
}

export const RentalAttributesGrid: React.FC<RentalAttributesGridProps> = ({
  attributes,
  sidebarWidth,
  children,
  isDashboard = false,
}) => {
  const gridClass = isDashboard
    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-x-4 gap-y-5"
    : `${
        sidebarWidth >= 840
          ? "grid-cols-4"
          : sidebarWidth >= 630
            ? "grid-cols-3"
            : "grid-cols-2"
      } gap-x-2 gap-y-3`;

  return (
    <div className="pt-1">
      <div className={`grid ${gridClass}`}>
        {attributes.map((attr, i) => {
          const strVal = String(attr.val || "-").trim();
          let textColorClass = "text-gray-200";

          const isFee =
            attr.key.includes("管理費") || attr.key.includes("服務費");

          if (strVal === "無" || strVal === "不可" || strVal === "無代收") {
            textColorClass = isFee ? "text-[#00d1b2]" : "text-[#ff3860]";
          } else if (
            strVal === "有" ||
            strVal === "可" ||
            strVal === "代收"
          ) {
            textColorClass = isFee ? "text-[#ff3860]" : "text-[#00d1b2]";
          } else if (strVal === "不詳") {
            textColorClass = "text-orange-400";
          } else if (strVal.includes("簽約中")) {
            textColorClass = "text-[#00f0ff]";
          } else if (strVal.includes("審核中")) {
            textColorClass = "text-purple-400";
          } else if (strVal.includes("招租中")) {
            textColorClass = "text-emerald-400";
          }

          return (
            <div
              key={i}
              className={`flex flex-col ${attr.isFullWidth ? "col-span-full" : ""}`}
            >
              <span
                className={`${isDashboard ? "text-[20px]" : "text-[10px]"} text-gray-500 font-medium truncate mb-0.5`}
                title={attr.key}
              >
                {attr.key}
              </span>
              <span
                className={`${isDashboard ? "text-[24px]" : "text-[12px]"} font-mono ${textColorClass} ${attr.isFullWidth ? "break-all whitespace-normal leading-relaxed" : "truncate"}`}
                title={strVal}
              >
                {strVal}
              </span>
            </div>
          );
        })}

        {attributes.length === 0 && (
          <div className={`col-span-full ${isDashboard ? "text-[22px]" : "text-[11px]"} text-gray-600 font-mono italic`}>
            無其他自訂屬性
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
