import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import rawGeoJson from './taipei_new_taipei_districts.json';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

import { MrtStation, RentalProperty } from './types';
import { 
  COMPANY_COORDS, 
  DISTRICT_RENT_DATA, 
  MRT_LINE_COLORS, 
  MRT_STATIONS_DATA, 
  MRT_LINES_DATA 
} from './constants';
import { getRentColor, calculateRecommendedSalary, calculateDistance } from './utils';
import { FloatingHUD } from './components/FloatingHUD';
import { LegendHUD } from './components/LegendHUD';
import { StatusHUD } from './components/StatusHUD';
import { Sidebar } from './components/Sidebar';

// Look up MRT lines for a given station name (without trailing "站")
const TRANSFER_MAP: Record<string, string[]> = {
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

const BR_STATIONS = [
  "動物園", "木柵", "萬芳社區", "萬芳醫院", "辛亥", "麟光", "六張犁", "科技大樓", 
  "中山國中", "松山機場", "大直", "劍南路", "西湖", "港墘", "文德", "內湖", 
  "大湖公園", "葫洲", "東湖", "南港軟體園區"
];

const R_STATIONS = [
  "淡水", "紅樹林", "竹圍", "關渡", "忠義", "復興崗", "北投", "新北投", "奇岩", 
  "唭哩岸", "石牌", "明德", "芝山", "士林", "劍潭", "圓山", "雙連", "台大醫院", 
  "臺大醫院", "大安森林公園", "信義安和", "台北101/世貿", "象山"
];

const G_STATIONS = [
  "松山", "南京三民", "台北小巨蛋", "臺北小巨蛋", "北門", "小南門", "台電大樓", "公館", "萬隆", 
  "景美", "七張", "小碧潭", "新店區公所", "新店"
];

const BL_STATIONS = [
  "頂埔", "永寧", "土城", "海山", "亞東醫院", "府中", "板橋", "新埔", "江子翠", "龍山寺", 
  "善導寺", "國父紀念館", "市政府", "永春", "後山埤", "昆陽", "南港"
];

const O_STATIONS = [
  "南勢角", "永安市場", "頂溪", "行天宮", "中山國小", "大橋頭", "三重國小", 
  "三和國中", "徐匯中學", "三民高中", "蘆洲", "台北橋", "菜寮", "三重", 
  "先嗇宮", "新莊", "輔大", "丹鳳", "迴龍"
];

function getMrtLinesForStation(stationName: string): string[] {
  const name = stationName.endsWith("站") ? stationName.slice(0, -1) : stationName;
  if (TRANSFER_MAP[name]) return TRANSFER_MAP[name];
  if (BR_STATIONS.includes(name)) return ["BR"];
  if (R_STATIONS.includes(name)) return ["R"];
  if (G_STATIONS.includes(name)) return ["G"];
  if (BL_STATIONS.includes(name)) return ["BL"];
  if (O_STATIONS.includes(name)) return ["O"];
  
  if (name.includes("萬芳") || (name.includes("港") && !name.includes("南港"))) return ["BR"];
  if (name.includes("信義") || name.includes("安和")) return ["R"];
  if (name.includes("南京") || name.includes("新店")) return ["G"];
  if (name.includes("忠孝") || name.includes("南港")) return ["BL"];
  if (name.includes("三重") || name.includes("和")) return ["O"];
  return ["R"]; // Default fallback
}

export default function App() {
  // State variables for analytics and interaction
  const [radius, setRadius] = useState<number>(5); // Radius in kilometers (default 5)
  const [showCircle, setShowCircle] = useState<boolean>(true); // Toggle circle visibility
  const [zoomLevel, setZoomLevel] = useState<number>(11); // Initial map zoom state
  const [mapCenterPos, setMapCenterPos] = useState<{ lat: number; lng: number }>({ lat: 25.0617, lng: 121.5435 }); // Track current center
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Collapsible sidebar state
  const [isInfoCardOpen, setIsInfoCardOpen] = useState<boolean>(true); // Collapsible Floating HUD card state

  // Heatmap GeoJSON states
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isGeoJsonLoading, setIsGeoJsonLoading] = useState<boolean>(true);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [isUsingFallbackGeoJson, setIsUsingFallbackGeoJson] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Transit interactive states
  const [showMrtLines, setShowMrtLines] = useState<boolean>(true);
  const [showMrtStations, setShowMrtStations] = useState<boolean>(true);
  const [showMrtLabels, setShowMrtLabels] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<MrtStation | null>(null);

  // Phase 4 & 6: Rental Properties CSV & Filter states
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [selectedRental, setSelectedRental] = useState<RentalProperty | null>(null);
  const [maxBudget, setMaxBudget] = useState<number>(18000);
  const [minSize, setMinSize] = useState<number>(5);
  const [maxDistance, setMaxDistance] = useState<number>(5);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Sub-window tabs state (1 = 地圖控制, 2 = 租金熱圖, 3 = 捷運通勤)
  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [isSidebarDragging, setIsSidebarDragging] = useState<boolean>(false);

  // Load rentals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('my_rental_pins');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRentals(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved rentals", e);
      }
    }
  }, []);

  // Auto-switch tabs based on map interactions
  useEffect(() => {
    if (selectedRental) {
      setActiveTab(4);
      if (!isSidebarOpen) setIsSidebarOpen(true);
    } else if (selectedStation) {
      setActiveTab(3);
    }
  }, [selectedRental, selectedStation]);

  useEffect(() => {
    if (selectedDistrict) {
      setActiveTab(2);
    }
  }, [selectedDistrict]);

  // References to DOM and Leaflet instances
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const markerLayerRef = useRef<L.Marker | null>(null);

  // Dedicated Leaflet layer group controllers
  const geojsonGroupRef = useRef<L.LayerGroup | null>(null);
  const mrtLinesGroupRef = useRef<L.LayerGroup | null>(null);
  const mrtStationsGroupRef = useRef<L.LayerGroup | null>(null);
  const rentalsGroupRef = useRef<L.LayerGroup | null>(null);

  // Load GeoJSON district boundary files once on mount
  useEffect(() => {
    setIsGeoJsonLoading(true);
    setGeoJsonError(null);
    try {
      console.log("Loading static high-fidelity authentic twin-city GeoJSON...");
      setGeoJsonData(rawGeoJson);
      setIsUsingFallbackGeoJson(false);
      setIsGeoJsonLoading(false);
    } catch (err: any) {
      console.error("Fatal error loading static GeoJSON:", err);
      setGeoJsonError(err.message || '無法取得雙北行政區界圖資');
      setIsGeoJsonLoading(false);
    }
  }, []);

  // Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize map instance
    const map = L.map(mapContainerRef.current, {
      center: COMPANY_COORDS,
      zoom: 11,
      zoomControl: false, // Disabling standard control for custom zoom placing on bottomright
      minZoom: 9,
      maxZoom: 18,
    });

    mapInstanceRef.current = map;

    map.createPane('districtsPane');
    if (map.getPane('districtsPane')) {
      map.getPane('districtsPane')!.style.zIndex = '390'; // Place below overlayPane (400)
    }

    // 2. Add custom styled dark-matter tile layers
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    // 3. Add Custom Zoom Controls manually at bottom right for slicker placement
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // 4. Custom Marker for ZenithBIM using breathing and ripple effect HTML class representation
    const customCompanyIcon = L.divIcon({
      html: `
        <div class="company-marker-container">
          <div class="company-marker-ripple"></div>
          <div class="company-marker-ripple-2"></div>
          <div class="company-marker-center"></div>
        </div>
      `,
      className: 'custom-leaflet-marker', // prevent default styles
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker(COMPANY_COORDS, { icon: customCompanyIcon, zIndexOffset: 10000 })
      .addTo(map)
      .bindPopup(`
        <div class="font-sans text-[13px] text-gray-200">
          <div class="flex items-center gap-1.5 font-bold text-cyan-400 text-[14px] mb-1">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-ping"></span>
            築本科技股份有限公司
          </div>
          <div class="text-[12px] font-medium text-gray-100 mb-1">台北辦公室 (地圖中心)</div>
          <div class="text-[11px] text-gray-400 mb-2">台北市民權東路三段 · 近捷運中山國中站</div>
          <div class="pt-1.5 border-t border-white/10 flex justify-between text-[10px] font-mono text-gray-300">
            <span>LAT: 25.0617</span>
            <span>LNG: 121.5435</span>
          </div>
        </div>
      `, {
        closeButton: false,
        offset: [0, -10]
      });

    // Fire default open popup
    marker.openPopup();
    markerLayerRef.current = marker;

    // 5. Instantiating the custom dashed circle overlay for double-north coverage range (30km initial)
    const circle = L.circle(COMPANY_COORDS, {
      radius: radius * 1000,
      color: '#ff3860', // Light red border color
      fillColor: '#00f0ff', // Light cyan blue filling
      fillOpacity: 0.025,
      weight: 1.5,
      dashArray: '6, 6'
    }).addTo(map);

    circleLayerRef.current = circle;

    // 6. Initialize Layer Groups for Heatmap, MRT Lines, and MRT Stations
    const geojsonGroup = L.layerGroup().addTo(map);
    const mrtLinesGroup = L.layerGroup().addTo(map);
    const mrtStationsGroup = L.layerGroup().addTo(map);
    const rentalsGroup = L.layerGroup().addTo(map);

    geojsonGroupRef.current = geojsonGroup;
    mrtLinesGroupRef.current = mrtLinesGroup;
    mrtStationsGroupRef.current = mrtStationsGroup;
    rentalsGroupRef.current = rentalsGroup;

    // 6b. Populate High-Fidelity District boundaries GeoJSON (rawGeoJson) into geojsonGroup
    const geojson = L.geoJSON(rawGeoJson as any, {
      pane: 'districtsPane',
      style: (feature: any) => {
        const townName = feature.properties?.TOWNNAME || '';
        const rentData = DISTRICT_RENT_DATA[townName];
        return {
          fillColor: rentData ? getRentColor(rentData.rent) : 'transparent',
          fillOpacity: 0.1, // 90% transparency
          color: 'rgba(255, 255, 255, 0.2)', // Glassy grid edge borders
          weight: 1,
        };
      },
      onEachFeature: (feature: any, layer: any) => {
        const townName = feature.properties?.TOWNNAME || '';
        const countyName = feature.properties?.COUNTYNAME || '';
        const rentData = DISTRICT_RENT_DATA[townName];

        if (rentData) {
          // Mouse Hover Events
          layer.on({
            mouseover: (e: any) => {
              const ly = e.target;
              ly.setStyle({
                weight: 3,
                color: '#00f0ff',
                fillOpacity: 0.35,
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                ly.bringToFront();
              }
              setHoveredDistrict(townName);
            },
            mouseout: (e: any) => {
              const ly = e.target;
              geojson.resetStyle(ly);
              setHoveredDistrict(null);
            },
            click: (e: any) => {
              const ly = e.target;
              map.fitBounds(ly.getBounds(), {
                padding: [40, 40],
                animate: true,
                duration: 0.8
              });
              setSelectedDistrict(townName);
              setSelectedStation(null); // Clear active transit station details to highlight district info
            }
          });
        }
      }
    });

    geojson.addTo(geojsonGroup);

    // 7. Dynamic fetching of MRT routes from GeoJSON
    fetch('/data/mrt_routes.geojson')
      .then(res => res.json())
      .then(routesData => {
        L.geoJSON(routesData, {
          style: (feature: any) => {
            const routeName = feature.properties?.RouteName || feature.properties?.name || '';
            let color = '#ffffff';
            if (routeName.includes("木柵") || routeName.includes("內湖") || routeName.includes("文湖")) color = "#9E652E"; // BR棕線
            else if (routeName.includes("淡水") || routeName.includes("信義") || routeName.includes("紅") || routeName.includes("淡水信義")) color = "#E3002C"; // R紅線
            else if (routeName.includes("板南") || routeName.includes("土城") || routeName.includes("南港") || routeName.includes("藍")) color = "#0070BD"; // BL藍線
            else if (routeName.includes("松山") || routeName.includes("新店") || routeName.includes("小南門") || routeName.includes("綠") || routeName.includes("松山新店")) color = "#008659"; // G綠線
            else if (routeName.includes("中和") || routeName.includes("新莊") || routeName.includes("蘆洲") || routeName.includes("橘") || routeName.includes("中和新蘆")) color = "#F8B61C"; // O橘線
            return {
              color: color,
              weight: 3.5,
              opacity: 0.85,
              lineJoin: 'round'
            };
          }
        }).addTo(mrtLinesGroup);
      })
      .catch(err => {
        console.error("Failed to load dynamic MRT routes GeoJSON, falling back to static:", err);
        // Fallback to static lines from constants
        Object.entries(MRT_LINES_DATA).forEach(([lineCode, coords]) => {
          const color = MRT_LINE_COLORS[lineCode] || '#ffffff';
          const polyline = L.polyline(coords as L.LatLngExpression[], {
            color: color,
            weight: 3.5,
            opacity: 0.85,
            lineJoin: 'round'
          });
          polyline.addTo(mrtLinesGroup);
        });
      });

    // 8. Dynamic fetching of MRT stations from GeoJSON
    fetch('/data/mrt_stations.geojson')
      .then(res => res.json())
      .then(stationsData => {
        L.geoJSON(stationsData, {
          pointToLayer: (feature: any, latlng: L.LatLng) => {
            const stationName = feature.properties?.NAME || '';
            const normalizedName = stationName.endsWith("站") ? stationName.slice(0, -1) : stationName;
            
            // Look up static metadata if matching
            const staticStation = MRT_STATIONS_DATA.find(s => s.name === normalizedName);
            const lines = staticStation ? staticStation.lines : getMrtLinesForStation(normalizedName);
            const desc = staticStation ? staticStation.desc : `${normalizedName} 捷運站，大台北大眾捷運運輸系統核心通勤點。`;
            const primaryLine = lines[0] || 'R';
            const borderColor = MRT_LINE_COLORS[primaryLine] || '#ffffff';
            const isTransfer = lines.length > 1;

            const badgeHtml = lines.map(line => `
              <span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold text-white font-mono leading-none select-none shrink-0 border border-white/10" style="background-color: ${MRT_LINE_COLORS[line]}">
                ${line}
              </span>
            `).join('');

            // Container group representing this station's layers
            const containerGroup = L.layerGroup();
            let mainMarker: L.CircleMarker;

            if (isTransfer) {
              // 轉乘站：雙層 circleMarker，外框為黑色細邊白色大直徑圓，內包覆主代表色
              mainMarker = L.circleMarker(latlng, {
                radius: 5.2,
                fillColor: '#ffffff',
                fillOpacity: 1,
                color: '#000000',
                weight: 1.8,
              });
              
              const innerDot = L.circleMarker(latlng, {
                radius: 2.5,
                fillColor: borderColor,
                fillOpacity: 1,
                stroke: false
              });
              innerDot.addTo(containerGroup);
            } else {
              // 一般站點：外圈為路線色粗度2px，內圈實心白色，直徑6px (radius: 3.2)
              mainMarker = L.circleMarker(latlng, {
                radius: 3.2,
                fillColor: '#ffffff',
                fillOpacity: 1,
                color: borderColor,
                weight: 2,
              });
            }

            // Permanent label tooltip right beside the station node
            mainMarker.bindTooltip(normalizedName, {
              permanent: true,
              direction: 'right',
              className: 'mrt-station-label',
              offset: [6, 0]
            });

            // Standard detailed hover analytical popup
            mainMarker.bindPopup(`
              <div class="font-sans text-[11px] leading-relaxed select-none max-w-[190px]">
                <div class="font-bold text-gray-100 flex items-center gap-1.5 mb-1.5 text-[12px] border-b border-white/5 pb-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-white inline-block border" style="border-color: ${borderColor}"></span>
                  ${normalizedName} 站
                </div>
                <p class="text-[10px] text-gray-400 mt-0.5 leading-snug font-sans mb-1.5">
                  "${desc}"
                </p>
                <div class="flex items-center gap-1.5 text-[9.5px] text-gray-300">
                  <span class="font-medium shrink-0">路線:</span>
                  <div class="flex gap-1 flex-wrap">${badgeHtml}</div>
                </div>
              </div>
            `, {
              offset: [0, -5],
              closeButton: false
            });

            // Interactive mouse events for expansions and styling transitions
            mainMarker.on('mouseover', (e: any) => {
              const smarker = e.target;
              smarker.setStyle(isTransfer ? {
                radius: 6.8,
                weight: 2.4
              } : {
                radius: 4.8,
                weight: 2.8
              });
              
              const label = smarker.getTooltip();
              if (label && label._container) {
                label._container.classList.add('hovered');
              }
            });

            mainMarker.on('mouseout', (e: any) => {
              const smarker = e.target;
              smarker.setStyle(isTransfer ? {
                radius: 5.2,
                weight: 1.8
              } : {
                radius: 3.2,
                weight: 2
              });
              
              const label = smarker.getTooltip();
              if (label && label._container) {
                label._container.classList.remove('hovered');
              }
            });

            mainMarker.on('click', (e: any) => {
              const clickedStation: MrtStation = staticStation || {
                name: normalizedName,
                coord: [latlng.lat, latlng.lng],
                lines: lines,
                desc: desc
              };
              setSelectedStation(clickedStation);
              setSelectedDistrict(null);
              map.setView(e.latlng, 14, { animate: true });
            });

            mainMarker.addTo(containerGroup);
            containerGroup.addTo(mrtStationsGroup);

            return mainMarker;
          }
        }).addTo(mrtStationsGroup);
      })
      .catch(err => {
        console.error("Failed to load MRT stations GeoJSON, falling back to static:", err);
        // Fallback to static curation list
        MRT_STATIONS_DATA.forEach((station) => {
          const primaryLine = station.lines[0];
          const borderColor = MRT_LINE_COLORS[primaryLine] || '#ffffff';
          
          const badgeHtml = station.lines.map(line => `
            <span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold text-white font-mono leading-none select-none shrink-0 border border-white/10" style="background-color: ${MRT_LINE_COLORS[line]}">
              ${line}
            </span>
          `).join('');

          const stationMarker = L.circleMarker(station.coord as L.LatLngExpression, {
            radius: 4,
            fillColor: '#ffffff',
            fillOpacity: 1,
            color: borderColor,
            weight: 1.8,
          });

          stationMarker.bindTooltip(`
            <div class="font-sans text-[11px] leading-relaxed select-none max-w-[190px]">
              <div class="font-bold text-gray-100 flex items-center gap-1.5 mb-1.5 text-[12px] border-b border-white/5 pb-1">
                <span class="w-2 h-2 rounded-full bg-white inline-block border" style="border-color: ${borderColor}"></span>
                ${station.name} 站
              </div>
              <p class="text-[10px] text-gray-400 mt-0.5 leading-snug font-sans mb-1.5">
                "${station.desc}"
              </p>
              <div class="flex items-center gap-1.5 text-[9.5px] text-gray-300">
                <span class="font-medium shrink-0">路線:</span>
                <div class="flex gap-1 flex-wrap">${badgeHtml}</div>
              </div>
            </div>
          `, {
            sticky: true,
            direction: 'top',
            className: 'mrt-station-tooltip'
          });

          stationMarker.on('mouseover', (e: any) => {
            const smarker = e.target;
            smarker.setStyle({ radius: 6, weight: 2.8 });
          });

          stationMarker.on('mouseout', (e: any) => {
            const smarker = e.target;
            smarker.setStyle({ radius: 4, weight: 1.8 });
          });

          stationMarker.on('click', (e: any) => {
            setSelectedStation(station);
            setSelectedDistrict(null);
            map.setView(e.latlng, 14, { animate: true });
          });

          stationMarker.addTo(mrtStationsGroup);
        });
      });

    // 9. Hook standard map events for coordination HUD displays
    map.on('move', () => {
      const center = map.getCenter();
      setMapCenterPos({ lat: center.lat, lng: center.lng });
    });

    map.on('zoomend', () => {
      setZoomLevel(map.getZoom());
    });

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius or show-state reactively
  useEffect(() => {
    if (!circleLayerRef.current || !mapInstanceRef.current) return;

    if (showCircle) {
      if (!mapInstanceRef.current.hasLayer(circleLayerRef.current)) {
        circleLayerRef.current.addTo(mapInstanceRef.current);
      }
      circleLayerRef.current.setRadius(radius * 1000);
    } else {
      circleLayerRef.current.remove();
    }
  }, [radius, showCircle]);

  // GeoJSON data loaded statically on map initialization

  // Handle GeoJSON group visibility reactively
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geojsonGroupRef.current) return;

    if (showHeatmap) {
      if (!map.hasLayer(geojsonGroupRef.current)) {
        map.addLayer(geojsonGroupRef.current);
      }
    } else {
      if (map.hasLayer(geojsonGroupRef.current)) {
        map.removeLayer(geojsonGroupRef.current);
      }
    }
  }, [showHeatmap]);

  // Handle MRT Lines visibility reactively
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mrtLinesGroupRef.current) return;

    if (showMrtLines) {
      if (!map.hasLayer(mrtLinesGroupRef.current)) {
        map.addLayer(mrtLinesGroupRef.current);
      }
    } else {
      if (map.hasLayer(mrtLinesGroupRef.current)) {
        map.removeLayer(mrtLinesGroupRef.current);
      }
    }
  }, [showMrtLines]);

  // Handle MRT Stations visibility reactively
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mrtStationsGroupRef.current) return;

    if (showMrtStations) {
      if (!map.hasLayer(mrtStationsGroupRef.current)) {
        map.addLayer(mrtStationsGroupRef.current);
      }
    } else {
      if (map.hasLayer(mrtStationsGroupRef.current)) {
        map.removeLayer(mrtStationsGroupRef.current);
      }
    }
  }, [showMrtStations]);

  // Phase 4: Render Rental Properties on Map
  useEffect(() => {
    const group = rentalsGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    const kw = searchKeyword.toLowerCase().trim();

    rentals.forEach(rental => {
      // Phase 6: Apply Filters
      if (rental.price > maxBudget) return;
      
      let ping = 0;
      for (const [key, val] of Object.entries(rental.customFields)) {
        const valStr = String(val);
        if ((key.includes('坪數') || key.includes('坪')) && !isNaN(parseFloat(valStr))) {
          ping = parseFloat(valStr);
          break;
        }
      }
      if (ping > 0 && ping < minSize) return;

      const distToOffice = calculateDistance(rental.lat, rental.lng, COMPANY_COORDS[0], COMPANY_COORDS[1]) / 1000; // in km
      if (distToOffice > maxDistance) return;

      if (kw) {
        const titleMatch = rental.title.toLowerCase().includes(kw);
        const prosMatch = rental.pros.some(p => p.toLowerCase().includes(kw));
        const consMatch = rental.cons.some(c => c.toLowerCase().includes(kw));
        const fieldsMatch = Object.values(rental.customFields).some(v => String(v).toLowerCase().includes(kw));
        if (!titleMatch && !prosMatch && !consMatch && !fieldsMatch) return;
      }

      const priceText = `$${(rental.price / 1000).toFixed(1)}K`;
      const isSelected = selectedRental?.id === rental.id;
      
      const customIcon = L.divIcon({
        className: `custom-rent-marker ${isSelected ? 'selected' : ''}`,
        html: `<div class="marker-badge">${priceText}</div>`,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const marker = L.marker([rental.lat, rental.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 2000 : 1000
      });

      const popupHtml = `
        <div class="font-sans text-[11px] leading-relaxed select-none min-w-[140px] max-w-[200px]">
          <div class="font-bold text-gray-100 mb-1 leading-tight text-[12px]">${rental.title}</div>
          <div class="text-[#00f0ff] font-mono font-bold mb-1.5">${rental.price.toLocaleString()} 元/月</div>
          ${rental.link ? `<a href="${rental.link}" target="_blank" rel="noreferrer" class="text-gray-400 hover:text-white underline underline-offset-2 text-[10px]">前往 591</a>` : ''}
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        autoPan: false,
        offset: [0, -10]
      });

      marker.on('click', () => {
        setSelectedRental(rental);
        setSelectedStation(null);
        setSelectedDistrict(null);
        map.panTo([rental.lat, rental.lng]);
      });

      marker.addTo(group);
      
      // Auto-open popup if selected
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [rentals, selectedRental, maxBudget, minSize, maxDistance, searchKeyword]);

  // Handle sidebar collapse/expand map invalidation sizes sequentially for smooth render changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Call immediately to start size adjustment
    mapInstanceRef.current.invalidateSize({ animate: true });

    // Sequence periodic invalidations to catch the CSS transition midway and at completion
    const intervals = [100, 200, 300, 400, 500];
    const timers = intervals.map(delay => {
      return setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: true });
        }
      }, delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isSidebarOpen]);

  // Click handler to refocus back to corporate headquarters using the 30km circle bounds with tight padding
  const handleResetMap = () => {
    if (!mapInstanceRef.current) return;
    setIsResetting(true);
    
    // Fit the map view to the exact boundary of the circle overlay so it occupies the viewport elegantly
    // Tightened the padding constraint down to [10, 10] (or [5, 5]) so it fits securely close to boundaries
    // We compute the bounds dynamically so it works seamlessly even if showCircle is toggled off
    const bounds = L.latLng(COMPANY_COORDS).toBounds(radius * 1000);
    mapInstanceRef.current.fitBounds(bounds, {
      padding: [10, 10],
      animate: true,
      duration: 1.2
    });
    
    setTimeout(() => {
      if (markerLayerRef.current) {
        markerLayerRef.current.openPopup();
      }
      setIsResetting(false);
    }, 1200);
  };

  const handleStationClick = (st: MrtStation) => {
    setSelectedStation(st);
    setSelectedDistrict(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(st.coord as L.LatLngExpression, 14, { animate: true });
    }
  };

  // Real-time circle coverage area calculation: pi * R^2
  const computedArea = (Math.PI * Math.pow(radius, 2)).toFixed(0);

  // Retrieve details for currently active selected or hovered district
  const activeDistrictName = hoveredDistrict || selectedDistrict || null;
  const activeDistrictRent = activeDistrictName ? DISTRICT_RENT_DATA[activeDistrictName] : null;

  return (
    <div id="app-root" className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-[#06070a] text-[#f3f4f6] font-sans antialiased">
      
      {/* LEFT: Map Segment - Occupies full available space with responsive width dynamic transitions */}
      <div 
        id="map-container" 
        className={`h-[60vh] md:h-full relative overflow-hidden transition-all duration-300 ease-in-out order-1 md:order-1 border-r border-[#1e2330] ${!showMrtLabels ? 'hide-mrt-labels' : ''} ${
          isSidebarOpen ? 'w-full md:w-[75%]' : 'w-full md:w-full'
        }`}
      >
        
        {/* Dynamic map canvas */}
        <div ref={mapContainerRef} className="w-full h-full" id="map" />

        {/* Floating Collapsible Control Panel Button (id="btn-toggle-sidebar") */}
        <button
          id="btn-toggle-sidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 right-4 z-[999] p-2.5 rounded-full bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-400/30 hover:border-cyan-400 text-cyan-400 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95 flex items-center justify-center animate-fade-in"
          title={isSidebarOpen ? "收合側邊欄" : "展開側邊欄"}
        >
          {isSidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5 animate-pulse" />}
        </button>

        {/* Floating Collapsible Quick Stats HUD */}
        <FloatingHUD
          radius={radius}
          isInfoCardOpen={isInfoCardOpen}
          setIsInfoCardOpen={setIsInfoCardOpen}
        />

        {/* Translucent GIS Heatmap Legend Overlay Layer */}
        <LegendHUD showHeatmap={showHeatmap} />

        {/* Map Position Status HUD overlay at center-bottom */}
        <StatusHUD
          lat={mapCenterPos.lat}
          lng={mapCenterPos.lng}
          zoom={zoomLevel}
        />

        {/* Dynamic Watermark Accent */}
        <div className="absolute top-4 right-16 z-[990] pointer-events-none hidden md:block select-none">
          <div className="bg-gradient-to-r from-purple-500/10 to-emerald-500/10 backdrop-blur-md border border-purple-500/20 px-3 py-1.5 rounded-full text-[10px] text-purple-400 font-mono font-semibold tracking-wider uppercase">
            Phase 6: Export & Filter Active
          </div>
        </div>
      </div>

      {/* RIGHT: Sidebar Dashboard Panel with smooth translation and scale toggle transitions */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}

        radius={radius}
        setRadius={setRadius}
        showCircle={showCircle}
        setShowCircle={setShowCircle}
        isGeoJsonLoading={isGeoJsonLoading}
        geoJsonError={geoJsonError}
        isUsingFallbackGeoJson={isUsingFallbackGeoJson}
        computedArea={computedArea}
        isResetting={isResetting}
        onResetMap={handleResetMap}

        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        activeDistrictName={activeDistrictName}
        activeDistrictRent={activeDistrictRent}
        selectedDistrict={selectedDistrict}
        setSelectedDistrict={setSelectedDistrict}

        showMrtLines={showMrtLines}
        setShowMrtLines={setShowMrtLines}
        showMrtStations={showMrtStations}
        setShowMrtStations={setShowMrtStations}
        showMrtLabels={showMrtLabels}
        setShowMrtLabels={setShowMrtLabels}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        onStationClick={handleStationClick}

        rentals={rentals}
        setRentals={setRentals}
        selectedRental={selectedRental}
        setSelectedRental={setSelectedRental}
        
        maxBudget={maxBudget}
        setMaxBudget={setMaxBudget}
        minSize={minSize}
        setMinSize={setMinSize}
        maxDistance={maxDistance}
        setMaxDistance={setMaxDistance}
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}

        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        isSidebarDragging={isSidebarDragging}
        setIsSidebarDragging={setIsSidebarDragging}
        onResizeComplete={() => {
          if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
        }}
      />
    </div>
  );
}
