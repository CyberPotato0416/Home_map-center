import React, { useMemo, useState, useEffect } from "react";
import {
  Building,
  Image as ImageIcon,
  Train,
  Bus,
  Navigation,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { RentalProperty, TargetCenter } from "../types";
import { calculateDistance, calculateHomeScore } from "../utils";
import { MRT_STATIONS_DATA } from "../constants";
import { RentalImageGallery } from "./RentalImageGallery";
import { RentalScoreBreakdown } from "./RentalScoreBreakdown";
import { RentalAttributesGrid } from "./RentalAttributesGrid";
import { RentalScoreBoard } from "./RentalScoreBoard";

interface RentalImportTabProps {
  rentals: RentalProperty[];
  setRentals: (r: RentalProperty[]) => void;
  selectedRental: RentalProperty | null;
  setSelectedRental: (r: RentalProperty | null) => void;
  targetCenter: TargetCenter;
  desiredRent: number;
  sidebarWidth?: number;
}

export const RentalImportTab: React.FC<RentalImportTabProps> = ({
  rentals,
  setRentals,
  selectedRental,
  setSelectedRental,
  targetCenter,
  desiredRent,
  sidebarWidth = 420,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setCurrentImgIndex(0);
    setIsDetailsOpen(true);
    setImageError(false);
  }, [selectedRental]);

  useEffect(() => {
    setImageError(false);
  }, [currentImgIndex]);

  const commuteData = useMemo(() => {
    if (!selectedRental) return null;
    const distToOffice = calculateDistance(
      selectedRental.lat,
      selectedRental.lng,
      targetCenter.lat,
      targetCenter.lng,
    );

    let nearestMrt = null;
    let minMrtDist = Infinity;

    MRT_STATIONS_DATA.forEach((station) => {
      const d = calculateDistance(
        selectedRental.lat,
        selectedRental.lng,
        station.coord[0] as number,
        station.coord[1] as number,
      );
      if (d < minMrtDist) {
        minMrtDist = d;
        nearestMrt = station.name;
      }
    });

    const score = Math.max(
      0,
      Math.round(100 - distToOffice / 100 - minMrtDist / 20),
    );

    return {
      distToOffice,
      nearestMrt,
      minMrtDist,
      score,
    };
  }, [selectedRental]);

  // Try to find ping from customFields
  const pingValue = useMemo(() => {
    if (!selectedRental) return null;
    for (const [key, val] of Object.entries(selectedRental.customFields || {})) {
      if (key.includes("坪數") || key.includes("坪") || key.toLowerCase().includes("size_ping") || key.toLowerCase().includes("ping")) {
        const p = parseFloat(String(val));
        if (!isNaN(p) && p > 0) return p;
      }
    }
    return null;
  }, [selectedRental]);

  // Try to find nearest bus stop from customFields
  const busInfo = useMemo(() => {
    if (!selectedRental) return "未知";
    for (const [key, val] of Object.entries(
      selectedRental.customFields || {},
    )) {
      if (key.includes("公車站") || key.toLowerCase().includes("bus")) {
        return String(val);
      }
    }
    return "未知";
  }, [selectedRental]);

  const rpgData = useMemo(() => {
    if (!selectedRental || !commuteData) return null;
    return calculateHomeScore(
      selectedRental,
      commuteData.distToOffice,
      commuteData.minMrtDist,
      desiredRent,
    );
  }, [selectedRental, commuteData, desiredRent]);

  const customAttributes = useMemo(() => {
    if (!selectedRental) return [];

    const fieldsMap = { ...(selectedRental.customFields || {}) };
    if (selectedRental.floor) fieldsMap["floor"] = selectedRental.floor;

    const popField = (searchKeys: string[]) => {
      for (const key of Object.keys(fieldsMap)) {
        const lowerKey = key.toLowerCase();
        if (searchKeys.some((sk) => lowerKey.includes(sk))) {
          const val = fieldsMap[key];
          delete fieldsMap[key];
          if (val === "不詳" || val === "" || val === undefined) return null;
          return val;
        }
      }
      return null;
    };

    const attrList: { key: string; val: any; isFullWidth?: boolean }[] = [];

    // pop duplicates or unwanted
    popField(["size_ping"]); // Already in main card

    // 1. type 同一列，放 original_591_id
    const _type = popField(["type", "型態"]);
    const _originId = popField(["original_591_id"]);

    const finalType = _type || selectedRental.type;
    if (finalType || _originId) {
      attrList.push({
        key: "型態 / 591 ID",
        val: `${finalType || "-"}${_originId ? ` / ${_originId}` : ""}`,
      });
    }

    // 2. mrt_nearest_name和 bus_nearest_name同一排
    // 3. mrt_nearest_distance請直接寫在mrt_nearest_name後方 例如：大安站(461m)
    const _mrtName = popField(["mrt_nearest_name", "捷運站"]);
    const _mrtDist = popField(["mrt_nearest_distance"]);
    const _busName = popField(["bus_nearest_name", "公車站"]);

    if (_mrtName || _busName) {
      const mrtStr = _mrtName
        ? `${_mrtName}${_mrtDist ? `(${_mrtDist}m)` : ""}`
        : "-";
      const busStr = _busName || "-";
      attrList.push({
        key: "最近捷運 / 公車",
        val: `${mrtStr} / ${busStr}`,
        isFullWidth: true,
      });
    }

    // 4. 聯絡人和聯絡電話...facilities移到裝潢等級前
    const _contact = popField(["聯絡人"]);
    const _phone = popField(["聯絡電話", "phone"]);
    const _line = popField(["line"]);
    const _contactType = popField(["身分"]);

    if (_contact || _phone || _line || _contactType) {
      attrList.push({
        key: "聯絡資訊",
        val: `${_contactType ? `[${_contactType}] ` : ""}${_contact || "-"}${_phone ? ` / ${_phone}` : ""}${_line ? ` / Line: ${_line}` : ""}`,
        isFullWidth: true,
      });
    }

    // 1. address放在聯絡資訊下一列
    const _address = popField(["地址", "address"]);
    if (_address) {
      attrList.push({
        key: "地址",
        val: _address,
        isFullWidth: true,
      });
    }

    // 2. floor放在address後, 3. 電梯和 floor 同列
    const _floor = popField(["floor", "樓層"]);
    if (_floor) {
      attrList.push({ key: "樓層", val: _floor });
    }

    const _elevator = popField(["電梯", "elevator"]);
    if (_elevator) {
      attrList.push({ key: "電梯", val: _elevator });
    }

    const _facilities = popField(["設備", "facilities", "家具", "furniture"]);
    if (_facilities) {
      attrList.push({
        key: "提供設備 / 家具",
        val: String(_facilities).replace(/;/g, "、"),
        isFullWidth: true,
      });
    }

    const _decorLevel = popField(["裝潢等級"]);
    if (_decorLevel) attrList.push({ key: "裝潢等級", val: _decorLevel });

    const _bathLevel = popField(["衛浴等級"]);
    if (_bathLevel) attrList.push({ key: "衛浴等級", val: _bathLevel });

    // Then add everything else left in fieldsMap
    Object.keys(fieldsMap).forEach((key) => {
      const val = fieldsMap[key];
      const isFullWidth = [
        "created_at",
        "created",
        "notes",
        "備註",
        "簽約狀態",
      ].some((k) => key.toLowerCase().includes(k));
      attrList.push({ key, val, isFullWidth });
    });

    return attrList;
  }, [selectedRental]);

  let rarityColor = "#9d9d9d";
  let rarityName = "普通";
  let glowClass = "shadow-[#9d9d9d]/10";
  let borderClass = "border-[#9d9d9d]";

  if (rpgData) {
    if (rpgData.totalScore >= 85) {
      rarityColor = "#ffb800";
      rarityName = "傳說";
      glowClass = "shadow-[#ffb800]/20";
      borderClass = "border-[#ffb800]";
    } else if (rpgData.totalScore >= 75) {
      rarityColor = "#a335ee";
      rarityName = "史詩";
      glowClass = "shadow-[#a335ee]/20";
      borderClass = "border-[#a335ee]";
    } else if (rpgData.totalScore >= 60) {
      rarityColor = "#0070dd";
      rarityName = "稀有";
      glowClass = "shadow-[#0070dd]/20";
      borderClass = "border-[#0070dd]";
    } else if (rpgData.totalScore >= 50) {
      rarityColor = "#1eff00";
      rarityName = "優秀";
      glowClass = "shadow-[#1eff00]/20";
      borderClass = "border-[#1eff00]";
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Selected Rental Details Section */}
      {selectedRental && rpgData ? (
        <div
          className={`bg-[#0f111a] border border-white/5 border-l-[4px] ${borderClass} rounded-xl p-4 shadow-lg ${glowClass} flex flex-col gap-4 animate-fade-in`}
        >
          {/* 1. Header (Rarity & Title) */}
          <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span
                className="px-1.5 py-0.5 text-[10px] font-bold font-mono rounded"
                style={{
                  backgroundColor: rarityColor,
                  color:
                    rarityColor === "#1eff00" || rarityColor === "#ffb800"
                      ? "#000"
                      : "#fff",
                }}
              >
                {rarityName}
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {selectedRental.type || "未分類"} | iLvl: {selectedRental.id}
              </span>
            </div>
            <h3
              className="text-[16px] font-bold text-gray-100 leading-snug"
              style={{ color: rarityColor }}
            >
              {selectedRental.title}
            </h3>
            <div className="flex items-baseline gap-2 font-mono mt-1">
              <span className="text-[#00f0ff] font-bold text-[24px] tracking-tight">
                NT$ {selectedRental.price.toLocaleString()}
              </span>
              <span className="text-[12px] text-gray-500 font-normal">
                / 月
              </span>
            </div>
            {(() => {
              let displayLink = selectedRental.link || "";
              if (
                displayLink.includes(".jpg") ||
                displayLink.includes("img") ||
                displayLink.includes(".png")
              )
                displayLink = "";
              if (
                !displayLink &&
                selectedRental.customFields?.original_591_id
              ) {
                displayLink = `https://rent.591.com.tw/${selectedRental.customFields.original_591_id}`;
              }
              if (!displayLink && selectedRental.source_591_url) {
                displayLink = selectedRental.source_591_url;
              }

              return displayLink ? (
                <a
                  href={displayLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-[11px] underline underline-offset-2 w-fit mt-1"
                >
                  🔗 前往 591 原始網頁
                </a>
              ) : null;
            })()}
          </div>

          <RentalImageGallery rental={selectedRental} />

          {/* 2. GIS Distances */}
          <div className="flex items-center gap-4 text-[12px] pb-1 px-1 mt-1">
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                距 {targetCenter.name.length > 5 ? targetCenter.name.substring(0, 5) + '...' : targetCenter.name}
              </span>
              <span className="font-mono text-gray-200 font-bold">
                {commuteData.distToOffice < 1000
                  ? `${Math.round(commuteData.distToOffice)}m`
                  : `${(commuteData.distToOffice / 1000).toFixed(1)}km`}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-2"></div>
            <div className="flex flex-col gap-1">
              <span className="text-gray-500 flex items-center gap-1">
                <Train className="w-3.5 h-3.5 text-emerald-400" />
                最近捷運站
              </span>
              <span className="font-mono text-gray-200 font-bold">
                {commuteData.nearestMrt || "未知"}{" "}
                <span className="text-gray-500 font-normal text-[10px]">
                  ({Math.round(commuteData.minMrtDist)}m)
                </span>
              </span>
            </div>
            {busInfo !== "未知" && (
              <>
                <div className="w-[1px] h-8 bg-white/10 shrink-0 mx-2"></div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Bus className="w-3.5 h-3.5 text-sky-400" />
                    最近公車站
                  </span>
                  <span className="font-mono text-gray-200 font-bold">
                    {busInfo}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 3. Score & Notes */}
          <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/5">
            <div className="flex flex-col items-center justify-center shrink-0">
              <span className="text-[12px] text-gray-400 font-bold mb-[-4px]">
                戰鬥力
              </span>
              <span
                className="text-[40px] font-mono font-bold tracking-tighter"
                style={{ color: rarityColor }}
              >
                {rpgData.totalScore}
              </span>
            </div>
            <div className="flex flex-col h-full border-l border-white/10 pl-4 w-full">
              <span className="text-[11px] text-gray-500 mb-1">備註欄位</span>
              <p className="text-[13px] text-gray-300 font-mono italic leading-relaxed break-all line-clamp-3">
                {rpgData.notes && rpgData.notes.trim() ? `"${rpgData.notes.trim()}"` : "待審核"}
              </p>
            </div>
          </div>

          {/* 4. Core Stats Progress Bars */}
          <RentalScoreBoard
            rpgData={rpgData}
            commuteDistToOffice={commuteData.distToOffice}
            pingValue={pingValue}
            price={selectedRental.price}
            floor={selectedRental.floor}
            rarityColor={rarityColor}
          />

          <RentalScoreBreakdown breakdown={rpgData.breakdown} />

          {/* 7. Dynamic Custom Attributes Grid */}
          <RentalAttributesGrid
            attributes={customAttributes}
            sidebarWidth={sidebarWidth}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900/30 rounded-xl border border-white/5 border-dashed">
          <Building className="w-8 h-8 text-gray-700 mb-2" />
          <span className="text-xs text-gray-500">
            點擊地圖上的物件以查看武器裝備屬性卡
          </span>
        </div>
      )}
    </div>
  );
};
