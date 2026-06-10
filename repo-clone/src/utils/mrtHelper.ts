export const TRANSFER_MAP_DATA: Record<string, string[]> = {
  "南京復興": ["BR", "G"],
  "大安": ["BR", "R"],
  "忠孝復興": ["BR", "BL"],
  "南港展覽館": ["BR", "BL"],
  "中山": ["R", "G"],
  "台北車站": ["R", "BL"],
  "臺北車站": ["R", "BL"],
  "民權西路": ["R", "O"],
  "古亭": ["G", "O"],
  "中正紀念堂": ["R", "G"],
  "東門": ["R", "O"],
  "西門": ["G", "BL"],
  "忠孝新生": ["BL", "O"],
  "松江南京": ["G", "O"]
};

export const BR_STATIONS_DATA = [
  "動物園", "木柵", "萬芳社區", "萬芳醫院", "辛亥", "麟光", "六張犁", "科技大樓", 
  "中山國中", "松山機場", "大直", "劍南路", "西湖", "港墘", "文德", "內湖", 
  "大湖公園", "葫洲", "東湖", "南港軟體園區"
];

export const R_STATIONS_DATA = [
  "淡水", "紅樹林", "竹圍", "關渡", "忠義", "復興崗", "北投", "新北投", "奇岩", 
  "唭哩岸", "石牌", "明德", "芝山", "士林", "劍潭", "圓山", "雙連", "台大醫院", 
  "臺大醫院", "大安森林公園", "信義安和", "台北101/世貿", "象山"
];

export const G_STATIONS_DATA = [
  "松山", "南京三民", "台北小巨蛋", "臺北小巨蛋", "北門", "小南門", "台電大樓", "公館", "萬隆", 
  "景美", "七張", "小碧潭", "新店區公所", "新店"
];

export const BL_STATIONS_DATA = [
  "頂埔", "永寧", "土城", "海山", "亞東醫院", "府中", "板橋", "新埔", "江子翠", "龍山寺", 
  "善導寺", "國父紀念館", "市政府", "永春", "後山埤", "昆陽", "南港"
];

export const O_STATIONS_DATA = [
  "南勢角", "永安市場", "頂溪", "行天宮", "中山國小", "大橋頭", "三重國小", 
  "三和國中", "徐匯中學", "三民高中", "蘆洲", "台北橋", "菜寮", "三重", 
  "先嗇宮", "新莊", "輔大", "丹鳳", "迴龍"
];

export function getMrtLinesForStation(stationName: string): string[] {
  const name = stationName.endsWith("站") ? stationName.slice(0, -1) : stationName;
  if (TRANSFER_MAP_DATA[name]) return TRANSFER_MAP_DATA[name];
  if (BR_STATIONS_DATA.includes(name)) return ["BR"];
  if (R_STATIONS_DATA.includes(name)) return ["R"];
  if (G_STATIONS_DATA.includes(name)) return ["G"];
  if (BL_STATIONS_DATA.includes(name)) return ["BL"];
  if (O_STATIONS_DATA.includes(name)) return ["O"];
  
  if (name.includes("萬芳") || (name.includes("港") && !name.includes("南港"))) return ["BR"];
  if (name.includes("信義") || name.includes("安和")) return ["R"];
  if (name.includes("南京") || name.includes("新店")) return ["G"];
  if (name.includes("忠孝") || name.includes("南港")) return ["BL"];
  if (name.includes("三重") || name.includes("和")) return ["O"];
  return ["R"]; // Default fallback
}
