export interface SalaryInfo {
  salary: string;
  tier: string;
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
