import { SalaryInfo } from './types';

// Color code mappings corresponding to specific rental pricing levels in 1,000 NT$ intervals (Professional Morandi Palette)
export function getRentColor(rent: number): string {
  if (rent >= 21000) return '#BD2C41'; // NT$21,000+
  if (rent >= 20000) return '#C84656'; // NT$20,000 - 20,999
  if (rent >= 19000) return '#D25D6B'; // NT$19,000 - 19,999
  if (rent >= 18000) return '#D97480'; // NT$18,000 - 18,999
  if (rent >= 17000) return '#C8A06B'; // NT$17,000 - 17,999
  if (rent >= 16000) return '#D2B17B'; // NT$16,000 - 16,999
  if (rent >= 15000) return '#DAC18A'; // NT$15,000 - 15,999
  if (rent >= 14000) return '#6B8DA6'; // NT$14,000 - 14,999
  if (rent >= 13000) return '#7BA0B8'; // NT$13,000 - 13,999
  if (rent >= 12000) return '#8BB2CA'; // NT$12,000 - 12,999
  if (rent >= 11000) return '#7D9E84'; // NT$11,000 - 11,999
  if (rent >= 10000) return '#8DB295'; // NT$10,000 - 10,999
  return '#9DC5A6';                   // Under NT$10,000
}

export function calculateRecommendedSalary(rent: number): SalaryInfo {
  if (rent >= 18000) return { salary: 'NT$60,000+', tier: '高階白領 / 科技主管 / 資深專業人士' };
  if (rent >= 15000) return { salary: 'NT$50,000 - 60,000', tier: '中階工程師 / 產品設計師 / 核心白領' };
  if (rent >= 11000) return { salary: 'NT$40,000 - 50,000', tier: '初階白領 / 一般商務通勤族' };
  return { salary: 'NT$35,000 - 40,000', tier: '社會新鮮人 / 高性價比通勤上班族' };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 地球半徑 (公尺)
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 回傳公尺數
}

export interface ScoreBreakdown {
  name: string;
  value: string;
  score: number;
  type: 'positive' | 'negative' | 'neutral';
}

export interface RPGScoreData {
  totalScore: number;
  commuteScore: number;
  spaceScore: number;
  budgetScore: number;
  convenienceScore: number;
  breakdown: ScoreBreakdown[];
  features: {
    electricity: string;
    trash: string;
    ac: string;
  };
  notes: string;
}

export function calculateHomeScore(rental: any, distToOfficeMeters: number, minMrtDist: number = 0): RPGScoreData {
  let score = 50; // Base score
  const breakdown: ScoreBreakdown[] = [];

  const getField = (keywords: string[]) => {
    for (const [key, val] of Object.entries(rental.customFields || {})) {
      if (keywords.some(k => key.toLowerCase().includes(k))) return String(val).toLowerCase();
    }
    return '';
  };

  const hasKeyword = (keywords: string[]) => {
    const val = getField(keywords);
    if (val === '是' || val === '有' || val === 'yes' || val === 'true') return true;
    const notesLower = (rental.customFields?.notes || rental.notes || '').toLowerCase();
    const titleLower = (rental.title || '').toLowerCase();
    return keywords.some(k => titleLower.includes(k) || notesLower.includes(k));
  };

  const getNumber = (keywords: string[]) => {
    const val = getField(keywords);
    const num = parseFloat(val.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  };

  // 1. Commute
  const distKm = distToOfficeMeters / 1000;
  const commuteDistScore = distKm <= 1.0 ? 10 : 10 - Math.ceil((distKm - 1.0) / 0.5);
  const commuteScore = Math.max(0, Math.min(10, commuteDistScore));
  score += commuteDistScore;
  breakdown.push({
    name: '距公司距離',
    value: distToOfficeMeters < 1000 ? `${Math.round(distToOfficeMeters)}m` : `${distKm.toFixed(1)}km`,
    score: commuteDistScore,
    type: commuteDistScore > 0 ? 'positive' : commuteDistScore < 0 ? 'negative' : 'neutral'
  });

  // MRT Dist
  let mrtScore = 0;
  if (minMrtDist > 0) {
    if (minMrtDist <= 500) mrtScore = 10;
    else if (minMrtDist <= 800) mrtScore = 5;
    else if (minMrtDist <= 1200) mrtScore = -5;
    else mrtScore = -15;
    score += mrtScore;
    breakdown.push({
      name: '捷運站距離',
      value: `${Math.round(minMrtDist)}m`,
      score: mrtScore,
      type: mrtScore > 0 ? 'positive' : mrtScore < 0 ? 'negative' : 'neutral'
    });
  }

  // 2. Space Ping
  const pingValue = getNumber(['坪數', '坪']) || 5; // Default to 5
  const spaceScore = Math.round(Math.min(10, pingValue / 1.5));
  score += spaceScore;

  // 3. Budget
  const budgetScore = Math.round(Math.max(0, Math.min(10, (20000 - rental.price) / 1000)));
  score += budgetScore;

  // 4. Convenience (Elevator & Floor)
  let convenienceScore = 5;
  const hasElevator = hasKeyword(['電梯', 'elevator']);
  const floorVal = getField(['樓層', 'floor']) || String(rental.floor || '');
  let isBasement = floorVal.includes('b') || floorVal.includes('地下');
  let floorNum = parseInt(floorVal.match(/(-?\d+)/)?.[1] || '1', 10);

  let curConvenienceAdd = 0;
  let floorValStr = '未知';

  if (hasElevator) {
    convenienceScore = 10;
    curConvenienceAdd = 15;
    floorValStr = '有電梯';
  } else {
    if (isBasement) {
      convenienceScore = 0;
      curConvenienceAdd = -30;
      floorValStr = '地下室';
    } else if (floorNum <= 2) {
      convenienceScore = 10;
      curConvenienceAdd = 10;
      floorValStr = `${floorNum} 樓`;
    } else if (floorNum === 3) {
      convenienceScore = 8;
      curConvenienceAdd = 8;
      floorValStr = '無電梯 3 樓';
    } else if (floorNum === 4) {
      convenienceScore = 7;
      curConvenienceAdd = 7;
      floorValStr = '無電梯 4 樓';
    } else if (floorNum === 5) {
      convenienceScore = 6;
      curConvenienceAdd = 6;
      floorValStr = '無電梯 5 樓';
    } else if (floorNum >= 6) {
      convenienceScore = 2;
      curConvenienceAdd = 2;
      floorValStr = `無電梯 ${floorNum} 樓`;
    } else {
      convenienceScore = 10;
      curConvenienceAdd = 10;
      floorValStr = '無電梯低樓層';
    }
  }
  score += curConvenienceAdd;
  breakdown.push({
    name: '電梯/樓層',
    value: floorValStr,
    score: curConvenienceAdd,
    type: curConvenienceAdd > 0 ? 'positive' : curConvenienceAdd < 0 ? 'negative' : 'neutral'
  });

  // Balcony
  if (hasKeyword(['陽台', 'balcony'])) {
    score += 8;
    breakdown.push({ name: '陽台', value: '模型噴漆與透氣', score: 8, type: 'positive' });
  }
  
  // Rooftop / Public space
  if (hasKeyword(['頂樓', '公共空間', 'rooftop'])) {
    score += 12;
    breakdown.push({ name: '公共空間/頂樓', value: '擺放雜物、模型器材', score: 12, type: 'positive' });
  }

  // Kitchen
  if (hasKeyword(['廚房', '開伙', 'kitchen'])) {
    score += 10;
    breakdown.push({ name: '廚房/開伙', value: '可', score: 10, type: 'positive' });
  }

  // AC Type
  const acTypeVal = getField(['變頻冷氣', '冷氣']).toLowerCase();
  let acInfo = '未知';
  let acScore = 0;

  if (acTypeVal.includes('變頻分離') || acTypeVal.includes('變頻分離式')) {
    acScore = 10;
    acInfo = '變頻分離式';
  } else if (acTypeVal.includes('分離') || acTypeVal.includes('分離式')) {
    acScore = 5;
    acInfo = '分離式';
  } else if (acTypeVal.includes('窗型')) {
    acScore = 0;
    acInfo = '窗型冷氣';
  } else if (acTypeVal === '是' || acTypeVal.includes('變頻')) {
    acScore = 10;
    acInfo = '變頻冷氣';
  } else if (acTypeVal.includes('定頻') || acTypeVal === '否') {
    acScore = -5;
    acInfo = '定頻冷氣';
  }

  score += acScore;
  breakdown.push({ name: '冷氣類型', value: acInfo, score: acScore, type: acScore > 0 ? 'positive' : acScore < 0 ? 'negative' : 'neutral' });

  // Washing Machine
  const isIndependentWashing = hasKeyword(['獨洗', '獨立洗衣機']);
  const isSharedWashing = hasKeyword(['共洗', '共用洗衣機', '無洗衣機']);
  let washScore = 0;
  let washInfo = '未知';
  if (isIndependentWashing) {
    washScore = 10;
    washInfo = '獨立洗衣機';
  } else if (isSharedWashing) {
    washScore = -5;
    washInfo = '共用/無';
  }
  score += washScore;
  breakdown.push({ name: '洗衣機', value: washInfo, score: washScore, type: washScore > 0 ? 'positive' : washScore < 0 ? 'negative' : 'neutral' });

  // Trash
  const hasTrash = hasKeyword(['垃圾代收', '垃圾處理']);
  let trashInfo = '無';
  if (hasTrash) {
    score += 15;
    trashInfo = '有垃圾代收';
    breakdown.push({ name: '垃圾代收', value: '免追垃圾車', score: 15, type: 'positive' });
  } else {
    breakdown.push({ name: '垃圾代收', value: '無', score: 0, type: 'neutral' });
  }

  // Subsidy
  if (hasKeyword(['租補', '補助', '可申請租補', '租屋補助'])) {
    score += 10;
    breakdown.push({ name: '租屋補助', value: '可申請', score: 10, type: 'positive' });
  }

  // Electric Meter & Pricing
  const isIndependentMeter = hasKeyword(['獨立電表']);
  const isSharedMeter = hasKeyword(['共用電表']);
  let electricInfo = '未知';
  const electricPrice = getNumber(['電費', '電價', '電費計價']);

  if (isIndependentMeter) {
    electricInfo = electricPrice ? `${electricPrice} 元/度 (獨立電表)` : '獨立電表';
  } else if (isSharedMeter) {
    electricInfo = electricPrice ? `${electricPrice} 元/度 (共用電表)` : '共用電表';
  } else if (electricPrice) {
    electricInfo = `${electricPrice} 元/度`;
  }

  let electricScore = 0;
  if (isIndependentMeter) electricScore += 10;
  else if (isSharedMeter) electricScore -= 5;

  if (electricPrice) {
    if (electricPrice >= 6.1) electricScore -= 15;
    else if (electricPrice >= 5.1) electricScore -= 5;
  }
  
  score += electricScore;
  if (electricScore !== 0) {
    breakdown.push({ 
      name: '電表/電費', 
      value: electricInfo, 
      score: electricScore, 
      type: electricScore > 0 ? 'positive' : 'negative' 
    });
  }

  // Parking Space (停車位)
  // 有車位 ➡️ +10 分
  const hasParking = hasKeyword(['停車位', '車位']);
  if (hasParking) {
    score += 10;
    breakdown.push({
      name: '停車位',
      value: '有平面/室內車位',
      score: 10,
      type: 'positive'
    });
  }

  return {
    totalScore: Math.round(score),
    commuteScore,
    spaceScore,
    budgetScore,
    convenienceScore,
    breakdown,
    features: {
      electricity: electricInfo,
      trash: trashInfo,
      ac: acInfo === '未知' ? '未知' : acInfo
    },
    notes: rental.customFields?.notes || rental.notes || ''
  };
}

// Helper to extract 591 ID or folder ID from a property
export function getRentalLocalId(rental: any): string {
  if (!rental) return "";
  let idValue = "";

  // Title-based custom fallback dictionary for absolute reliability (e.g. for specific 591 rentals)
  const titleStr = String(rental.title || "").toLowerCase().trim();
  if (titleStr.includes("住商林") || titleStr.includes("大曬衣") || titleStr.includes("宿舍獨沙發") || titleStr.includes("露臺獨洗")) {
    return "21366680";
  }
  if (titleStr.includes("寧夏夜市") || titleStr.includes("711全新")) {
    return "21280476";
  }
  if (titleStr.includes("好便利") && (titleStr.includes("中山區") || titleStr.includes("超值"))) {
    return "20390403";
  }

  // 1. First priority: Try to extract actual ID from rental.images if it already has folder paths
  if (rental.images && rental.images.length > 0) {
    for (const img of rental.images) {
      if (!img) continue;
      const localFolder = img.match(/rentals_images\/([a-zA-Z0-9_\-]+)/);
      if (
        localFolder &&
        localFolder[1] &&
        localFolder[1] !== "rentals_images" &&
        !localFolder[1].startsWith("[") &&
        !localFolder[1].startsWith("http")
      ) {
        idValue = localFolder[1];
        break;
      }
    }
  }

  // 2. Second priority: Try custom fields
  if (!idValue && rental.customFields) {
    for (const [k, v] of Object.entries(rental.customFields)) {
      const lk = k.toLowerCase().trim();
      if (
        (lk === "original_591_id" ||
          lk === "591_id" ||
          lk === "id_591" ||
          lk === "id" ||
          lk === "original_id" ||
          lk.includes("original_591") ||
          lk.includes("物編") ||
          lk.includes("編號")) &&
        v &&
        String(v).trim()
      ) {
        idValue = String(v).trim();
        break;
      }
    }
  }

  // 3. Third priority: Try source link
  if (!idValue && rental.link) {
    const match = rental.link.match(/(\d{6,})/) || rental.link.match(/object\/([a-zA-Z0-9]+)/);
    if (match) {
      idValue = match[1];
    } else {
      const rencoMatch = rental.link.match(/renco.*\/(\d+)/) || rental.link.match(/renco_(\d+)/);
      if (rencoMatch) {
        idValue = `renco_${rencoMatch[1]}`;
      }
    }
  }

  // 4. Ultimate priority fallback to ID
  if (!idValue) {
    idValue = rental.id || "";
  }

  // Clean any rent_ or rental_ raw prefixes to resolve direct local matches gracefully
  return String(idValue).replace(/^(rent_?|rental_?)/i, "").trim();
}
