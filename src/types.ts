export interface TargetCenter {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SalaryInfo {
  salary: string;
  tier: string;
}

export interface CommuteBenefitAnalysis {
  monthlyTimeCost: number;
  rentSaving: number;
  netBenefit: number;
  roundedNetBenefit: number;
  benefitLevel: number;
  thresholdPerKm: number;
  cpLabel:
    | '高 CP 值（通勤時間成本低於租金省下的錢）'
    | '低 CP 值（時間換租金不划算）'
    | '中性 CP 值';
  explanation: string;
}

export interface RentData {
  rent: number;
  level: string;
  desc: string;
}

export interface MrtStation {
  name: string;
  coord: [number, number] | number[];
  lines: string[];
  desc: string;
}

export interface RentalProperty {
  id: string;
  lat: number;
  lng: number;
  price: number;
  title: string;
  link?: string;
  images: string[];
  pros: string[];
  cons: string[];
  customFields: Record<string, string>;
}
