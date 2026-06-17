import React, { useMemo, useState } from "react";
import {
  Copy,
  Check,
  MapPin,
  HelpCircle,
  MessageSquare,
  FileText,
  MessageCircle,
  ShieldCheck,
  Zap,
  Bookmark,
  GripVertical,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  LayoutGrid
} from "lucide-react";
import { RentalProperty, TargetCenter } from "../types";
import { calculateDistance, calculateHomeScore } from "../utils";
import { MRT_STATIONS_DATA } from "../constants";
import { RentalImageGallery } from "./RentalImageGallery";
import { RentalScoreBoard } from "./RentalScoreBoard";
import { RentalScoreBreakdown } from "./RentalScoreBreakdown";
import { RentalAttributesGrid } from "./RentalAttributesGrid";

interface RentalDetailDashboardProps {
  rental: RentalProperty | null;
  targetCenter: TargetCenter;
  onClose?: () => void;
}

const QUESTION_TEMPLATES: Record<string, string> = {
  "管理費": "管理費是多少元/月？還是已經包含在租金內？",
  "服務費": "請問有需要支付仲介服務費嗎？服務費是多少（如半個月租金）？",
  "裝潢等級": "請問屋內的裝潢新舊程度如何？照片中的家具都會保留嗎？",
  "衛浴等級": "請問衛浴是乾濕分離的嗎？熱水器是儲熱式、瞬熱式還是天然瓦斯？",
  "電表類型": "請問電費是獨立電表還是共用分表計量？",
  "電費": "請問電費的計價方式為何？是一度多少元（台水台電計費，還是定額如 5 元/度）？",
  "公用費用": "請問公共用電、水費、網路費等雜費需要額外分攤嗎？",
  "停車位": "請問大樓有提供機車或汽車停車位嗎？",
  "停車費": "請問停車位費用是多少元/月？",
  "電梯": "請問大樓有電梯嗎？",
  "洗衣機": "請問有提供個人專用的獨立洗衣機嗎？還是需要共用？",
  "變頻冷氣": "請問冷氣是省電的「變頻冷氣」嗎？是分離式還是窗型？",
  "垃圾代收": "請問大樓有垃圾代收服務（免追垃圾車）嗎？",
  "租屋補助": "請問這間物件可以申報租屋補助、入籍或報稅嗎？",
  "朝向": "請問房間的窗戶朝向是哪裡？採光與西曬狀況如何？",
  "開伙狀況": "請問可以開伙嗎？是可以使用簡易電磁爐還是附有瓦斯爐具？",
  "網速": "請問有提供寬頻網路嗎？網速大約是多少（如 100M）？",
  "浴缸": "請問衛浴裡有附浴缸嗎？",
  "熱水器形式": "請問熱水器形式是電熱式、瓦斯還是其他形式？"
};

export const RentalDetailDashboard: React.FC<RentalDetailDashboardProps> = ({
  rental,
  targetCenter,
  onClose
}) => {
  const [copiedLine, setCopiedLine] = useState(false);
  const [copied591, setCopied591] = useState(false);

  // Collapse states
  const [isPhotoCollapsed, setIsPhotoCollapsed] = useState(false);
  const [isQuestionsCollapsed, setIsQuestionsCollapsed] = useState(false);
  const [isBuffsCollapsed, setIsBuffsCollapsed] = useState(false);
  const [isAttrsCollapsed, setIsAttrsCollapsed] = useState(false);

  // Sizes: "half" (6/12 columns) or "full" (12/12 columns)
  const [cardSizes, setCardSizes] = useState<Record<string, "half" | "full">>({
    photo: "half",
    questions: "half",
    buffs: "half",
    attrs: "half",
  });

  // Reorderable layout order
  const [cardOrder, setCardOrder] = useState<string[]>(["photo", "buffs", "questions", "attrs"]);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Drag handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...cardOrder];
    const draggedIdx = newOrder.indexOf(draggedId);
    const targetIdx = newOrder.indexOf(targetId);

    newOrder.splice(draggedIdx, 1);
    newOrder.splice(targetIdx, 0, draggedId);
    setCardOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const toggleSize = (id: string) => {
    setCardSizes((prev) => ({
      ...prev,
      [id]: prev[id] === "half" ? "full" : "half",
    }));
  };

  // Helper to extract fields case-insensitively
  const getVal = (field: string): string => {
    if (!rental) return "";
    if ((rental as any)[field] !== undefined) return String((rental as any)[field]);

    const key = Object.keys(rental.customFields || {}).find(
      (k) => k.toLowerCase() === field.toLowerCase()
    );
    return key ? String(rental.customFields[key]) : "";
  };

  const scoreData = useMemo(() => {
    if (!rental) return null;

    // Calculate distance to office
    const distToOffice = calculateDistance(
      rental.lat,
      rental.lng,
      targetCenter.lat,
      targetCenter.lng
    );

    // Calculate nearest MRT
    let nearestMrt = "";
    let minMrtDist = Infinity;
    MRT_STATIONS_DATA.forEach((station) => {
      const d = calculateDistance(
        rental.lat,
        rental.lng,
        station.coord[0] as number,
        station.coord[1] as number
      );
      if (d < minMrtDist) {
        minMrtDist = d;
        nearestMrt = station.name;
      }
    });

    const rpg = calculateHomeScore(rental, distToOffice, minMrtDist);

    return {
      distToOffice,
      nearestMrt,
      minMrtDist,
      rpg
    };
  }, [rental, targetCenter]);

  // Identify "不詳" or empty questions
  const unknownQuestions = useMemo(() => {
    if (!rental) return [];
    const list: { field: string; question: string }[] = [];

    Object.entries(QUESTION_TEMPLATES).forEach(([field, question]) => {
      const val = getVal(field).trim();
      if (val === "不詳" || val === "") {
        list.push({ field, question });
      }
    });
    return list;
  }, [rental]);

  // LINE copyable template
  const lineTemplateText = useMemo(() => {
    if (!rental || unknownQuestions.length === 0) return "";
    let t = `您好，想請教您關於 ${rental.title} 物件：\n`;
    unknownQuestions.forEach((q, idx) => {
      const cleanQ = q.question
        .replace("請問", "")
        .replace("請問有需要", "需要")
        .replace("請問這間物件", "這間");
      t += `${idx + 1}. ${cleanQ}\n`;
    });
    t += "再麻煩您回覆了，感謝您！";
    return t;
  }, [rental, unknownQuestions]);

  // 591 copyable template (single line to prevent message truncation)
  const template591Text = useMemo(() => {
    if (!rental || unknownQuestions.length === 0) return "";
    const parts = ["您好，想請教本物件："];
    unknownQuestions.forEach((q, idx) => {
      const cleanQ = q.question
        .replace("請問", "")
        .replace("請問有需要", "需要")
        .replace("請問這間物件", "這間");
      parts.push(`【Q${idx + 1}】${cleanQ}`);
    });
    parts.push("再麻煩您抽空回覆了，謝謝！");
    return parts.join(" 🔸 ");
  }, [rental, unknownQuestions]);

  const copyToClipboard = (text: string, type: "line" | "591") => {
    navigator.clipboard.writeText(text);
    if (type === "line") {
      setCopiedLine(true);
      setTimeout(() => setCopiedLine(false), 2000);
    } else {
      setCopied591(true);
      setTimeout(() => setCopied591(false), 2000);
    }
  };

  if (!rental || !scoreData) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#0a0c14] text-gray-500 font-sans border border-white/5 rounded-2xl">
        <HelpCircle className="w-12 h-12 text-gray-700 mb-4 animate-pulse" />
        <span className="text-sm">請在右側清單選擇物件，以在此全版面觀看詳情與提問大看板</span>
      </div>
    );
  }

  // Rarity Colors
  let rarityColor = "#9d9d9d";
  let rarityName = "普通";
  let borderClass = "border-[#9d9d9d]/30";
  let glowClass = "shadow-[#9d9d9d]/5";

  if (scoreData.rpg.totalScore >= 85) {
    rarityColor = "#ffb800";
    rarityName = "傳說級物件";
    borderClass = "border-[#ffb800]/40";
    glowClass = "shadow-[#ffb800]/10";
  } else if (scoreData.rpg.totalScore >= 75) {
    rarityColor = "#a335ee";
    rarityName = "史詩級物件";
    borderClass = "border-[#a335ee]/40";
    glowClass = "shadow-[#a335ee]/10";
  } else if (scoreData.rpg.totalScore >= 60) {
    rarityColor = "#0070dd";
    rarityName = "稀有級物件";
    borderClass = "border-[#0070dd]/40";
    glowClass = "shadow-[#0070dd]/10";
  } else if (scoreData.rpg.totalScore >= 50) {
    rarityColor = "#1eff00";
    rarityName = "優秀級物件";
    borderClass = "border-[#1eff00]/40";
    glowClass = "shadow-[#1eff00]/10";
  }

  const pingValue = parseFloat(getVal("size_ping")) || null;

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070913] p-6 flex flex-col gap-6 animate-fade-in custom-scrollbar relative">

      {/* Reset Layout Button (返回4大版面) */}
      <button
        onClick={() => {
          setCardSizes({
            photo: "half",
            buffs: "half",
            questions: "half",
            attrs: "half",
          });
          setCardOrder(["photo", "buffs", "questions", "attrs"]);
        }}
        className="fixed top-[68px] right-4 z-[999] p-2.5 rounded-full bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/30 hover:border-cyan-400 text-cyan-400 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 flex items-center justify-center gap-1.5 px-4 text-xs font-bold"
        title="重設所有區塊為半版十字配置"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>返回4大版面</span>
      </button>

      {/* 1. TOP HEADER SUMMARY */}
      <div className={`bg-[#0f1220]/80 backdrop-blur-md rounded-2xl p-6 border-l-[6px] ${borderClass} flex flex-col justify-between gap-4 shadow-xl ${glowClass}`}>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase" style={{ backgroundColor: `${rarityColor}15`, color: rarityColor, border: `1px solid ${rarityColor}30` }}>
              {rarityName}
            </span>
            <span className="text-[10px] text-gray-500 font-mono uppercase">ID: {rental.id}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-white leading-tight font-sans">
            {rental.title}
          </h2>

          {/* Price & Score */}
          <div className="flex flex-wrap items-center gap-6 mt-1 mb-2">
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xs text-gray-500 mr-1.5">每月預算租金</span>
              <span className="text-[28px] font-black text-[#00f0ff] tracking-tight">
                NT$ {rental.price.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-normal">/ 月</span>
            </div>

            <span className="w-1.5 h-1.5 rounded-full bg-white/10 hidden sm:inline"></span>

            <div className="flex items-center gap-2.5 bg-black/40 px-4 py-1.5 rounded-xl border border-white/5 font-mono">
              <span className="text-[10px] text-gray-500 font-bold">綜合戰鬥力</span>
              <span className="text-[32px] font-black leading-none tracking-tighter" style={{ color: rarityColor }}>
                {scoreData.rpg.totalScore}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              {getVal("address") || "未知"}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <span className="flex items-center gap-1">
              <span className="font-bold text-[#00f0ff]">{scoreData.nearestMrt}站</span>
              <span className="opacity-60">({Math.round(scoreData.minMrtDist)}m)</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
            <span className="flex items-center gap-1">
              <span>距離中心點:</span>
              <span className="font-bold text-gray-200 font-mono">
                {scoreData.distToOffice < 1000
                  ? `${Math.round(scoreData.distToOffice)}m`
                  : `${(scoreData.distToOffice / 1000).toFixed(1)}km`}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. DRAGGABLE & RESIZABLE FLEX LAYOUT */}
      <div className="flex flex-wrap gap-6 items-start w-full">
        {cardOrder.map((cardId) => {
          const isHalf = cardSizes[cardId] === "half";
          const colSpanClass = isHalf ? "w-full xl:w-[calc(50%-12px)] min-w-[320px]" : "w-full min-w-[320px]";
          const isDragged = draggedId === cardId;

          // Drag event helper props
          const dragProps = {
            draggable: true,
            onDragStart: () => handleDragStart(cardId),
            onDragOver: (e: React.DragEvent) => handleDragOver(e, cardId),
            onDragEnd: handleDragEnd,
          };

          if (cardId === "photo") {
            return (
              <div
                key="photo"
                className={`${colSpanClass} resizable-photo-box bg-[#0f1220]/60 border border-white/5 rounded-2xl p-4 shadow-lg flex flex-col gap-3 transition-[border-color,box-shadow,background-color,opacity] duration-300 ${isDragged ? "opacity-30 border-cyan-400/50 scale-[0.98]" : "hover:border-cyan-400/20"
                  }`}
              >
                {/* Header with drag handle, title and action buttons */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2 select-none">
                    <div {...dragProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-cyan-400 p-1 rounded hover:bg-white/5 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      物件相片庫
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSize("photo")}
                      title={isHalf ? "放大至全版寬度" : "縮小至半版寬度"}
                      className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isHalf ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsPhotoCollapsed(!isPhotoCollapsed)}
                      className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isPhotoCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isPhotoCollapsed && (
                  <div className="animate-fade-in flex-1 min-h-0 flex flex-col">
                    <RentalImageGallery rental={rental} />
                  </div>
                )}
              </div>
            );
          }

          if (cardId === "questions") {
            return (
              <div
                key="questions"
                className={`${colSpanClass} resizable-horizontal-box bg-[#0f1220]/60 border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col gap-4 animate-float-slow hover:border-[#ffb800]/25 transition-[border-color,box-shadow,background-color,opacity] duration-300 ${isDragged ? "opacity-30 border-cyan-400/50 scale-[0.98]" : ""
                  }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <div {...dragProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-[#ffb800] p-1 rounded hover:bg-white/5 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#ffb800]" />
                      房仲/房東待確認提問與一鍵複製大看板
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-[#ffb800]/10 text-[#ffb800] border border-[#ffb800]/25 px-2 py-0.5 rounded font-mono">
                      {unknownQuestions.length} 項資訊待核實
                    </span>
                    <button
                      onClick={() => toggleSize("questions")}
                      title={isHalf ? "放大至全版寬度" : "縮小至半版寬度"}
                      className="p-1 rounded text-gray-500 hover:text-[#ffb800] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isHalf ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsQuestionsCollapsed(!isQuestionsCollapsed)}
                      className="p-1 rounded text-gray-500 hover:text-[#ffb800] hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isQuestionsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isQuestionsCollapsed && (
                  <>
                    {unknownQuestions.length > 0 ? (
                      <div className="flex flex-col gap-4 animate-fade-in">
                        {/* Checklist */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-black/30 p-4 rounded-xl border border-white/5 text-[22px] font-mono">
                          {unknownQuestions.map((uq, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-gray-400">
                              <span className="text-rose-400 font-bold shrink-0">□</span>
                              <div>
                                <span className="text-gray-300 font-bold">【{uq.field}】</span>
                                <span className="text-gray-400">{uq.question}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* LINE Copy Area */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[24px] text-gray-300">
                            <span className="flex items-center gap-2 font-bold">
                              <MessageCircle className="w-6 h-6 text-emerald-400" />
                              💬 LINE / 通訊軟體專用範本（多行）
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(lineTemplateText, "line");
                              }}
                              className={`px-4 py-1.5 rounded text-[20px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${copiedLine
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                  : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                                }`}
                            >
                              {copiedLine ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              {copiedLine ? "已複製" : "複製範本"}
                            </button>
                          </div>
                          <pre className="bg-[#121626] border border-white/5 rounded-xl p-3.5 text-[24px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap select-all">
                            {lineTemplateText}
                          </pre>
                        </div>

                        {/* 591 Copy Area */}
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[24px] text-gray-300">
                            <span className="flex items-center gap-2 font-bold">
                              <MessageSquare className="w-6 h-6 text-sky-400" />
                              ⚡ 591 在線問答專用（單行防吃換行設計）
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(template591Text, "591");
                              }}
                              className={`px-4 py-1.5 rounded text-[20px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${copied591
                                  ? "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                                  : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
                                }`}
                            >
                              {copied591 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              {copied591 ? "已複製" : "複製單行"}
                            </button>
                          </div>
                          <div className="bg-[#121626] border border-white/5 rounded-xl p-3.5 text-[24px] text-gray-400 font-mono leading-normal break-all select-all">
                            {template591Text}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[24px] p-4 rounded-xl flex items-center justify-center gap-3 animate-fade-in">
                        <ShieldCheck className="w-8 h-8" />
                        <span>恭喜！目前物件所有欄位資訊均已核實完整，沒有任何「不詳」欄位。</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          }

          if (cardId === "buffs") {
            return (
              <div
                key="buffs"
                className={`${colSpanClass} resizable-box bg-[#0f1220]/60 border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col gap-4 animate-float-medium hover:border-purple-500/25 transition-[border-color,box-shadow,background-color,opacity] duration-300 ${isDragged ? "opacity-30 border-cyan-400/50 scale-[0.98]" : ""
                  }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2 select-none">
                    <div {...dragProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-purple-400 p-1 rounded hover:bg-white/5 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      戰鬥力屬性加成與減益分析 (Buffs / Debuffs)
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSize("buffs")}
                      title={isHalf ? "放大至全版寬度" : "縮小至半版寬度"}
                      className="p-1 rounded text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isHalf ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsBuffsCollapsed(!isBuffsCollapsed)}
                      className="p-1 rounded text-gray-500 hover:text-purple-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isBuffsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isBuffsCollapsed && (
                  <div className="flex flex-col gap-3 animate-fade-in">
                    <RentalScoreBoard
                      rpgData={scoreData.rpg}
                      commuteDistToOffice={scoreData.distToOffice}
                      pingValue={pingValue}
                      price={rental.price}
                      floor={getVal("floor")}
                      rarityColor={rarityColor}
                      isDashboard={true}
                      subsidyAmount={
                        scoreData.rpg.breakdown.some(
                          (b) => b.type === "neutral" && b.name === "可申請租屋補助"
                        )
                          ? 3000
                          : undefined
                      }
                    />

                    <div className="border-t border-white/5 my-2"></div>
                    <RentalScoreBreakdown breakdown={scoreData.rpg.breakdown} isDashboard={true} />
                  </div>
                )}
              </div>
            );
          }

          if (cardId === "attrs") {
            return (
              <div
                key="attrs"
                className={`${colSpanClass} resizable-box bg-[#0f1220]/60 border border-white/5 rounded-2xl p-5 shadow-lg animate-float-fast hover:border-cyan-400/25 transition-[border-color,box-shadow,background-color,opacity] duration-300 ${isDragged ? "opacity-30 border-cyan-400/50 scale-[0.98]" : ""
                  }`}
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <div className="flex items-center gap-2 select-none">
                    <div {...dragProps} className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-cyan-400 p-1 rounded hover:bg-white/5 transition-colors">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-cyan-400" />
                      物件全屬性明細一覽表
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleSize("attrs")}
                      title={isHalf ? "放大至全版寬度" : "縮小至半版寬度"}
                      className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isHalf ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setIsAttrsCollapsed(!isAttrsCollapsed)}
                      className="p-1 rounded text-gray-500 hover:text-cyan-400 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      {isAttrsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {!isAttrsCollapsed && (
                  <div className="animate-fade-in">
                    {(() => {
                      const fieldsMap = { ...(rental.customFields || {}) };
                      if (rental.floor) fieldsMap["floor"] = rental.floor;

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

                      popField(["size_ping"]);

                      const _type = popField(["type", "型態"]);
                      const _originId = popField(["original_591_id"]);
                      const _signStatus = popField(["簽約狀態"]);
                      const finalType = _type || rental.type;

                      if (finalType || _originId) {
                        attrList.push({
                          key: "物件型態 / 來源ID",
                          val: `${finalType || "-"}${_originId ? ` / ${_originId}` : ""}`,
                        });
                      }
                      if (_signStatus) {
                        attrList.push({ key: "目前簽約狀態", val: _signStatus });
                      }

                      const _mrtName = popField(["mrt_nearest_name", "捷運站"]);
                      const _mrtDist = popField(["mrt_nearest_distance"]);
                      const _busName = popField(["bus_nearest_name", "公車站"]);
                      if (_mrtName || _busName) {
                        const mrtStr = _mrtName ? `${_mrtName}${_mrtDist ? `(${_mrtDist}m)` : ""}` : "-";
                        attrList.push({
                          key: "最近大眾捷運 / 公車站",
                          val: `${mrtStr} / ${_busName || "-"}`,
                          isFullWidth: true,
                        });
                      }

                      const _contact = popField(["聯絡人"]);
                      const _phone = popField(["聯絡電話", "phone"]);
                      const _line = popField(["line"]);
                      const _contactType = popField(["身分"]);
                      if (_contact || _phone || _line || _contactType) {
                        attrList.push({
                          key: "屋主 / 房仲聯絡資訊",
                          val: `${_contactType ? `[${_contactType}] ` : ""}${_contact || "-"}${_phone ? ` / ${_phone}` : ""}${_line ? ` / Line: ${_line}` : ""}`,
                          isFullWidth: true,
                        });
                      }

                      const _address = popField(["地址", "address"]);
                      if (_address) {
                        attrList.push({ key: "詳細地址", val: _address, isFullWidth: true });
                      }

                      const _floor = popField(["floor", "樓層"]);
                      if (_floor) attrList.push({ key: "樓層", val: _floor });

                      const _elevator = popField(["電梯", "elevator"]);
                      if (_elevator) attrList.push({ key: "配置電梯", val: _elevator });

                      const _facilities = popField(["設備", "facilities", "家具", "furniture"]);
                      if (_facilities) {
                        attrList.push({
                          key: "房內設備 / 家俱電器",
                          val: String(_facilities).replace(/;/g, "、"),
                          isFullWidth: true,
                        });
                      }

                      const _notes = popField(["notes", "備註"]);
                      if (_notes) {
                        attrList.push({
                          key: "備註說明 (Notes)",
                          val: _notes,
                          isFullWidth: true,
                        });
                      }

                      const _decorLevel = popField(["裝潢等級"]);
                      if (_decorLevel) attrList.push({ key: "裝潢程度", val: `等級 ${_decorLevel}` });

                      const _bathLevel = popField(["衛浴等級"]);
                      if (_bathLevel) attrList.push({ key: "衛浴品質", val: `等級 ${_bathLevel}` });

                      Object.keys(fieldsMap).forEach((key) => {
                        const val = fieldsMap[key];
                        const isFullWidth = ["created_at", "created", "notes", "備註"].some((k) => key.toLowerCase().includes(k));
                        attrList.push({ key, val, isFullWidth });
                      });

                      return (
                        <div className="flex flex-col gap-4">
                          <RentalAttributesGrid attributes={attrList} sidebarWidth={600} isDashboard={true}>
                            <div className="mt-4 flex flex-col rounded-xl border border-white/10 bg-[#081118] p-4 text-[24px]">
                              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                                <span className="text-gray-300 font-bold">通勤效益分析</span>
                                <span className={`font-bold ${scoreData.rpg.commuteAnalysis.netBenefit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  {scoreData.rpg.commuteAnalysis.cpLabel}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 mt-2.5 text-gray-400">
                                <div>預估每月通勤成本：{Math.round(scoreData.rpg.commuteAnalysis.monthlyTimeCost).toLocaleString()} 元</div>
                                <div>租金省下額度：{Math.round(scoreData.rpg.commuteAnalysis.rentSaving).toLocaleString()} 元</div>
                                <div className="md:col-span-2 text-gray-200 font-semibold mt-1">
                                  月淨效益：{scoreData.rpg.commuteAnalysis.netBenefit >= 0 ? "節省 " : "多支付 "}
                                  {Math.abs(Math.round(scoreData.rpg.commuteAnalysis.netBenefit)).toLocaleString()} 元/月
                                </div>
                              </div>
                            </div>
                          </RentalAttributesGrid>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}
      </div>

    </div>
  );
};
