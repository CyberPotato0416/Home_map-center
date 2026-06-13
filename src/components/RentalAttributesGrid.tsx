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
}

export const RentalAttributesGrid: React.FC<RentalAttributesGridProps> = ({
  attributes,
  sidebarWidth,
  children,
}) => {
  return (
    <div className="pt-1">
      <div
        className={`grid gap-x-2 gap-y-3 ${
          sidebarWidth >= 840
            ? "grid-cols-4"
            : sidebarWidth >= 630
              ? "grid-cols-3"
              : "grid-cols-2"
        }`}
      >
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
                className="text-[10px] text-gray-500 font-medium truncate mb-0.5"
                title={attr.key}
              >
                {attr.key}
              </span>
              <span
                className={`text-[12px] font-mono ${textColorClass} ${attr.isFullWidth ? "break-all whitespace-normal leading-relaxed" : "truncate"}`}
                title={strVal}
              >
                {strVal}
              </span>
            </div>
          );
        })}

        {attributes.length === 0 && (
          <div className="col-span-full text-[11px] text-gray-600 font-mono italic">
            無其他自訂屬性
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
