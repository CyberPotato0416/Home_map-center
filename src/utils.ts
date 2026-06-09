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

export interface ScoreBreakdownItem {
  name: string;
  score: number;
  value: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface ScoreResult {
  totalScore: number;
  breakdown: ScoreBreakdownItem[];
}

export function calculateWeightedScore(
  property: any,
  distToOffice: number,
  minMrtDist: number
): ScoreResult {
  let score = 100;
  const breakdown: ScoreBreakdownItem[] = [];

  // 1. GIS Commute Penalty
  const distPenalty = Math.round(distToOffice / 100);
  if (distPenalty > 0) {
    score -= distPenalty;
    breakdown.push({
      name: '距公司通勤距離',
      score: -distPenalty,
      value: distToOffice < 1000 ? `${Math.round(distToOffice)}m` : `${(distToOffice / 1000).toFixed(1)}km`,
      type: 'negative',
    });
  }

  const mrtPenalty = Math.round(minMrtDist / 20);
  if (mrtPenalty > 0) {
    score -= mrtPenalty;
    breakdown.push({
      name: '捷運站距離',
      score: -mrtPenalty,
      value: `${Math.round(minMrtDist)}m`,
      type: 'negative',
    });
  }

  // Helper to get field values case-insensitively
  const getField = (keys: string[]): string => {
    for (const key of keys) {
      if (property.customFields) {
        for (const [k, v] of Object.entries(property.customFields)) {
          if (k.toLowerCase() === key.toLowerCase()) {
            return String(v).trim();
          }
        }
      }
    }
    return '';
  };

  // Helper to check yes/no boolean values
  const isYes = (val: string): boolean => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return ['是', 'y', 'yes', 'true', '有', '1', '✔️', '✅'].some(kw => lower.includes(kw));
  };

  const isNo = (val: string): boolean => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return ['否', 'n', 'no', 'false', '無', '0', '❌'].some(kw => lower.includes(kw));
  };

  // Get facilities
  const facilitiesStr = getField(['facilities']) || property.customFields?.facilities || '';
  const facilitiesList = typeof facilitiesStr === 'string' 
    ? facilitiesStr.split(/[;,]/).map(s => s.trim().toLowerCase())
    : [];

  const titleLower = (property.title || '').toLowerCase();
  const notesLower = (getField(['notes', '備註']) || '').toLowerCase();

  // 2. Elevator (電梯)
  const elevatorVal = getField(['電梯', '有電梯']);
  let hasElevator = false;
  if (elevatorVal) {
    hasElevator = isYes(elevatorVal);
  } else {
    // Fallback to facilities or title/notes
    hasElevator = facilitiesList.includes('電梯') || titleLower.includes('電梯') || notesLower.includes('電梯');
  }

  if (hasElevator) {
    score += 15;
    breakdown.push({
      name: '電梯',
      score: 15,
      value: '有',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '電梯',
      score: 0,
      value: '無',
      type: 'neutral',
    });
  }

  // 3. Washing Machine (洗衣機)
  const washingVal = getField(['洗衣機', '獨洗', '獨立洗衣機']);
  let washingMachine = '未知';
  let washingScore = 0;
  if (washingVal) {
    if (isYes(washingVal) || washingVal.includes('獨洗') || washingVal.includes('獨立')) {
      washingMachine = '獨立';
      washingScore = 10;
    } else if (isNo(washingVal) || washingVal.includes('共用')) {
      washingMachine = '共用/無';
      washingScore = -5;
    }
  } else {
    if (facilitiesList.includes('洗衣機') || titleLower.includes('獨洗') || titleLower.includes('獨立洗衣機')) {
      washingMachine = '獨立';
      washingScore = 10;
    } else {
      washingMachine = '共用或無';
      washingScore = -5;
    }
  }
  score += washingScore;
  breakdown.push({
    name: '獨立洗衣機',
    score: washingScore,
    value: washingMachine,
    type: washingScore > 0 ? 'positive' : washingScore < 0 ? 'negative' : 'neutral',
  });

  // 4. Inverter AC (變頻冷氣)
  const acVal = getField(['變頻冷氣', '變頻']);
  let acType = '未知';
  let acScore = 0;
  if (acVal) {
    if (isYes(acVal) || acVal.includes('變頻')) {
      acType = '變頻冷氣';
      acScore = 10;
    } else if (isNo(acVal) || acVal.includes('定頻')) {
      acType = '定頻冷氣';
      acScore = -5;
    }
  } else {
    if (titleLower.includes('變頻') || notesLower.includes('變頻')) {
      acType = '變頻冷氣';
      acScore = 10;
    } else if (titleLower.includes('定頻') || notesLower.includes('定頻')) {
      acType = '定頻冷氣';
      acScore = -5;
    }
  }
  score += acScore;
  breakdown.push({
    name: '變頻冷氣',
    score: acScore,
    value: acType,
    type: acScore > 0 ? 'positive' : acScore < 0 ? 'negative' : 'neutral',
  });

  // 5. Trash Collection (垃圾代收)
  const trashVal = getField(['垃圾代收', '垃圾處理', '代收垃圾']);
  let hasTrash = false;
  if (trashVal) {
    hasTrash = isYes(trashVal);
  } else {
    hasTrash = titleLower.includes('垃圾代收') || titleLower.includes('垃圾處理') || notesLower.includes('垃圾代收') || notesLower.includes('垃圾處理') || notesLower.includes('代收垃圾');
  }
  if (hasTrash) {
    score += 15;
    breakdown.push({
      name: '垃圾代收',
      score: 15,
      value: '有',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '垃圾代收',
      score: 0,
      value: '無',
      type: 'neutral',
    });
  }

  // 6. Rent Subsidy (租屋補助)
  const subsidyVal = getField(['租屋補助', '補助', '可租補']);
  let hasSubsidy = false;
  if (subsidyVal) {
    hasSubsidy = isYes(subsidyVal);
  } else {
    hasSubsidy = titleLower.includes('租補') || titleLower.includes('可租補') || titleLower.includes('租屋補助') || notesLower.includes('租補') || notesLower.includes('可租補') || notesLower.includes('租屋補助');
  }
  if (hasSubsidy) {
    score += 10;
    breakdown.push({
      name: '租屋補助',
      score: 10,
      value: '可申請',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '租屋補助',
      score: 0,
      value: '不可/未知',
      type: 'neutral',
    });
  }

  // 7. Decoration Stars (裝潢等級)
  const decVal = getField(['裝潢等級', '裝潢']);
  let decScore = 0;
  const decLevel = parseInt(decVal.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(decLevel) && decLevel >= 1 && decLevel <= 5) {
    decScore = (decLevel - 3) * 5;
    score += decScore;
    breakdown.push({
      name: '裝潢等級',
      score: decScore,
      value: `${decLevel} 星`,
      type: decScore > 0 ? 'positive' : decScore < 0 ? 'negative' : 'neutral',
    });
  } else {
    breakdown.push({
      name: '裝潢等級',
      score: 0,
      value: '未知',
      type: 'neutral',
    });
  }

  // 8. Bathroom Stars (衛浴等級)
  const bathVal = getField(['衛浴等級', '衛浴']);
  let bathScore = 0;
  const bathLevel = parseInt(bathVal.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(bathLevel) && bathLevel >= 1 && bathLevel <= 5) {
    bathScore = (bathLevel - 3) * 5;
    score += bathScore;
    breakdown.push({
      name: '衛浴等級',
      score: bathScore,
      value: `${bathLevel} 星`,
      type: bathScore > 0 ? 'positive' : bathScore < 0 ? 'negative' : 'neutral',
    });
  } else {
    breakdown.push({
      name: '衛浴等級',
      score: 0,
      value: '未知',
      type: 'neutral',
    });
  }

  // 9. Electricity Pricing (電費)
  const elecVal = getField(['電費', '電費計價', '電費度', '公用費用']);
  let elecScore = 0;
  let elecValueTxt = '未知';
  const elecMatch = elecVal.match(/\d+(\.\d+)?/);
  if (elecMatch) {
    const elecPrice = parseFloat(elecMatch[0]);
    elecValueTxt = `${elecPrice} 元/度`;
    if (elecPrice <= 4.0) {
      elecScore = 5;
    } else if (elecPrice <= 5.0) {
      elecScore = 0;
    } else if (elecPrice <= 6.0) {
      elecScore = -5;
    } else {
      elecScore = -15;
    }
    score += elecScore;
    breakdown.push({
      name: '電費計價',
      score: elecScore,
      value: elecValueTxt,
      type: elecScore > 0 ? 'positive' : elecScore < 0 ? 'negative' : 'neutral',
    });
  } else {
    breakdown.push({
      name: '電費計價',
      score: 0,
      value: '未知',
      type: 'neutral',
    });
  }

  // 10. Electricity Meter Type (電表類型)
  const meterVal = getField(['電表類型', '電錶類型', '電表', '電錶']);
  let meterType = '未知';
  let meterScore = 0;
  if (meterVal) {
    if (meterVal.includes('獨立')) {
      meterType = '獨立電表';
      meterScore = 10;
    } else if (meterVal.includes('共用')) {
      meterType = '共用電表';
      meterScore = -5;
    }
  }
  score += meterScore;
  breakdown.push({
    name: '電表類型',
    score: meterScore,
    value: meterType,
    type: meterScore > 0 ? 'positive' : meterScore < 0 ? 'negative' : 'neutral',
  });

  // 11. Floor & No-elevator penalty (樓層 & 電梯)
  const floorVal = property.floor || getField(['樓層', 'floor']) || '';
  let floorNum = 1;
  let isBasement = false;
  let isTopAddition = false;

  const floorValLower = floorVal.toLowerCase();
  if (floorValLower.includes('b') || floorValLower.includes('地下')) {
    isBasement = true;
  } else {
    if (floorValLower.includes('頂') || floorValLower.includes('頂加') || floorValLower.includes('頂層加蓋')) {
      isTopAddition = true;
    }
    const match = floorVal.match(/(-?\d+)/);
    if (match) {
      floorNum = parseInt(match[1], 10);
    }
  }

  let floorScore = 0;
  let floorDetail = floorVal || `${floorNum}樓`;

  if (isBasement) {
    floorScore = -30;
    floorDetail = '地下室';
  } else if (!hasElevator) {
    if (floorNum <= 2) {
      floorScore = 0;
    } else if (floorNum >= 3 && floorNum <= 5) {
      floorScore = -5;
    } else if (floorNum >= 6) {
      floorScore = -10;
    }
  }
  score += floorScore;
  if (floorScore !== 0 || isBasement || !hasElevator) {
    breakdown.push({
      name: '樓層加/扣分',
      score: floorScore,
      value: floorDetail + (hasElevator ? ' (有電梯)' : ' (無電梯)'),
      type: floorScore < 0 ? 'negative' : 'neutral',
    });
  }

  // 12. Parking & Parking Fee (停車位, 停車費)
  const parkSpace = getField(['停車位', '車位']);
  const parkFeeVal = getField(['停車費']);
  let hasPark = false;
  if (parkSpace && parkSpace.includes('室內')) {
    const feeMatch = parkFeeVal.match(/\d+/);
    const fee = feeMatch ? parseInt(feeMatch[0], 10) : 0;
    if (fee === 0 || parkFeeVal.includes('免') || parkFeeVal.includes('無')) {
      hasPark = true;
    }
  }
  if (hasPark) {
    score += 10;
    breakdown.push({
      name: '停車位',
      score: 10,
      value: '室內免費車位',
      type: 'positive',
    });
  }

  // 13. Balcony (陽台)
  const hasBalcony = facilitiesList.includes('陽台') || titleLower.includes('陽台') || notesLower.includes('陽台') || titleLower.includes('露台') || titleLower.includes('露臺') || notesLower.includes('露台') || notesLower.includes('露臺');
  if (hasBalcony) {
    score += 8;
    breakdown.push({
      name: '陽台 (模型噴漆/透氣)',
      score: 8,
      value: '有',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '陽台 (模型噴漆/透氣)',
      score: 0,
      value: '無',
      type: 'neutral',
    });
  }

  // 14. Public Space (公共空間/頂樓)
  const hasPublicSpace = titleLower.includes('頂樓') || notesLower.includes('頂樓') || notesLower.includes('公共空間') || notesLower.includes('公用空間') || notesLower.includes('露台') || notesLower.includes('露臺') || titleLower.includes('露台') || titleLower.includes('露臺') || isTopAddition;
  if (hasPublicSpace) {
    score += 12;
    breakdown.push({
      name: '公共空間 (頂樓/雜物器材存放)',
      score: 12,
      value: '有',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '公共空間 (頂樓/雜物器材存放)',
      score: 0,
      value: '無',
      type: 'neutral',
    });
  }

  // 15. Kitchen (廚房)
  const hasKitchen = facilitiesList.includes('廚房') || facilitiesList.includes('天然瓦斯') || titleLower.includes('廚房') || titleLower.includes('開伙') || titleLower.includes('可煮') || notesLower.includes('廚房') || notesLower.includes('開伙') || notesLower.includes('天然瓦斯') || notesLower.includes('可煮');
  if (hasKitchen) {
    score += 10;
    breakdown.push({
      name: '廚房/開伙',
      score: 10,
      value: '有',
      type: 'positive',
    });
  } else {
    breakdown.push({
      name: '廚房/開伙',
      score: 0,
      value: '無',
      type: 'neutral',
    });
  }

  return {
    totalScore: Math.max(0, score),
    breakdown,
  };
}
