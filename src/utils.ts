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
