import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import rawGeoJson from "./taipei_new_taipei_districts.json";
import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { MrtStation, RentalProperty } from "./types";
import {
  COMPANY_COORDS,
  DISTRICT_RENT_DATA,
  MRT_LINE_COLORS,
  MRT_STATIONS_DATA,
  MRT_LINES_DATA,
} from "./constants";
import {
  getRentColor,
  calculateRecommendedSalary,
  calculateDistance,
  calculateHomeScore,
} from "./utils";
import { getMrtLinesForStation } from "./utils/mrtHelper";
import { useMapInit } from "./hooks/useMapInit";
import { useMapLayers } from "./hooks/useMapLayers";
import { FloatingHUD } from "./components/FloatingHUD";
import { LegendHUD } from "./components/LegendHUD";
import { StatusHUD } from "./components/StatusHUD";
import { Sidebar } from "./components/Sidebar";

export default function App() {
  // State variables for analytics and interaction
  const [radius, setRadius] = useState<number>(4); // Radius in kilometers (default 5)
  const [showCircle, setShowCircle] = useState<boolean>(true); // Toggle circle visibility
  const [zoomLevel, setZoomLevel] = useState<number>(11); // Initial map zoom state
  const [mapCenterPos, setMapCenterPos] = useState<{
    lat: number;
    lng: number;
  }>({ lat: 25.0617, lng: 121.5435 }); // Track current center
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true); // Collapsible sidebar state
  const [isInfoCardOpen, setIsInfoCardOpen] = useState<boolean>(false); // Collapsible Floating HUD card state

  // Heatmap GeoJSON states
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isGeoJsonLoading, setIsGeoJsonLoading] = useState<boolean>(true);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [isUsingFallbackGeoJson, setIsUsingFallbackGeoJson] =
    useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Transit interactive states
  const [showMrtLines, setShowMrtLines] = useState<boolean>(true);
  const [showMrtStations, setShowMrtStations] = useState<boolean>(true);
  const [showMrtLabels, setShowMrtLabels] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<MrtStation | null>(
    null,
  );

  // Phase 4 & 6: Rental Properties CSV & Filter states
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [selectedRental, setSelectedRental] = useState<RentalProperty | null>(
    null,
  );
  const [maxBudget, setMaxBudget] = useState<number>(18000);
  const [minSize, setMinSize] = useState<number>(5);
  const [maxDistance, setMaxDistance] = useState<number>(4);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const [statusFilters, setStatusFilters] = useState<{
    signing: boolean;
    reviewing: boolean;
    renting: boolean;
  }>(() => {
    const saved = localStorage.getItem("rental_status_filters");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { signing: true, reviewing: true, renting: true };
  });

  useEffect(() => {
    localStorage.setItem(
      "rental_status_filters",
      JSON.stringify(statusFilters),
    );
  }, [statusFilters]);

  // Sub-window tabs state (1 = 地圖控制, 2 = 租金熱圖, 3 = 捷運通勤)
  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [isSidebarDragging, setIsSidebarDragging] = useState<boolean>(false);

  // Load rentals from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("my_rental_pins");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove old 'rental' prefixed items, keep 'rent_'
          const filtered = parsed.filter((r: any) => {
            const idStartsWithRental = String(r.id).startsWith("rental");
            const titleHasDemo = String(r.title).includes("小資族首選靜巷套房");
            return !idStartsWithRental && !titleHasDemo;
          });
          setRentals(filtered);
          if (filtered.length !== parsed.length) {
            localStorage.setItem("my_rental_pins", JSON.stringify(filtered));
          }
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
      console.log(
        "Loading static high-fidelity authentic twin-city GeoJSON...",
      );
      setGeoJsonData(rawGeoJson);
      setIsUsingFallbackGeoJson(false);
      setIsGeoJsonLoading(false);
    } catch (err: any) {
      console.error("Fatal error loading static GeoJSON:", err);
      setGeoJsonError(err.message || "無法取得雙北行政區界圖資");
      setIsGeoJsonLoading(false);
    }
  }, []);

  // Map Init hook (replaces lines 120-516)
  useMapInit({
    mapContainerRef,
    mapInstanceRef,
    markerLayerRef,
    circleLayerRef,
    geojsonGroupRef,
    mrtLinesGroupRef,
    mrtStationsGroupRef,
    rentalsGroupRef,
    radius,
    setHoveredDistrict,
    setSelectedDistrict,
    setSelectedStation,
    setMapCenterPos,
    setZoomLevel,
  });

  // Layer visibility hook (replaces 518-580)
  useMapLayers({
    mapInstanceRef,
    circleLayerRef,
    geojsonGroupRef,
    mrtLinesGroupRef,
    mrtStationsGroupRef,
    radius,
    showCircle,
    showHeatmap,
    showMrtLines,
    showMrtStations,
  });

  // Phase 4: Render Rental Properties on Map
  useEffect(() => {
    const group = rentalsGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    const kw = searchKeyword.toLowerCase().trim();

    rentals.forEach((rental) => {
      // Phase 6: Apply Filters
      if (rental.price > maxBudget) return;

      let ping = 0;
      let signStatusStr = "";

      for (const [key, val] of Object.entries(rental.customFields)) {
        const valStr = String(val);
        if (
          (key.includes("坪數") || key.includes("坪")) &&
          !isNaN(parseFloat(valStr))
        ) {
          ping = parseFloat(valStr);
        }
        if (key.includes("簽約狀態") || key.includes("狀態")) {
          signStatusStr = valStr;
        }
      }
      if (ping > 0 && ping < minSize) return;

      const isSigning = signStatusStr.includes("簽約中");
      const isReviewing = signStatusStr.includes("審核中");
      const isRenting = signStatusStr.includes("招租中") || (!isSigning && !isReviewing);

      if (isSigning && !statusFilters.signing) return;
      if (isReviewing && !statusFilters.reviewing) return;
      if (isRenting && !statusFilters.renting) return;

      const distToOffice =
        calculateDistance(
          rental.lat,
          rental.lng,
          COMPANY_COORDS[0],
          COMPANY_COORDS[1],
        ) / 1000; // in km
      if (distToOffice > maxDistance) return;

      if (kw) {
        const titleMatch = rental.title.toLowerCase().includes(kw);
        const prosMatch = rental.pros.some((p) => p.toLowerCase().includes(kw));
        const consMatch = rental.cons.some((c) => c.toLowerCase().includes(kw));
        const fieldsMatch = Object.values(rental.customFields).some((v) =>
          String(v).toLowerCase().includes(kw),
        );
        if (!titleMatch && !prosMatch && !consMatch && !fieldsMatch) return;
      }

      let minMrtDist = Infinity;
      MRT_STATIONS_DATA.forEach((station) => {
        const d = calculateDistance(
          rental.lat,
          rental.lng,
          station.coord[0] as number,
          station.coord[1] as number,
        );
        if (d < minMrtDist) minMrtDist = d;
      });
      const rpgData = calculateHomeScore(
        rental,
        distToOffice * 1000,
        minMrtDist,
      );
      const score = rpgData.totalScore;

      let rarityBorderColor = "#9d9d9d";
      if (score >= 85) rarityBorderColor = "#ffb800";
      else if (score >= 75) rarityBorderColor = "#a335ee";
      else if (score >= 60) rarityBorderColor = "#0070dd";
      else if (score >= 50) rarityBorderColor = "#1eff00";

      const rentTextColor = getRentColor(rental.price);

      const priceText = `$${(rental.price / 1000).toFixed(1)}K`;
      const isSelected = selectedRental?.id === rental.id;

      const customIcon = L.divIcon({
        className: `custom-rent-marker ${isSelected ? "selected" : ""}`,
        html: `
          <div class="marker-badge" style="
            --badge-border: ${rarityBorderColor}; 
            --badge-text: ${rentTextColor};
          ">
            ${priceText}
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const marker = L.marker([rental.lat, rental.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 2000 : 1000,
      });

      let displayLink = rental.link || "";
      // If the currently stored link is actually a bunch of images (legacy corrupted state)
      if (displayLink.includes(".jpg") || displayLink.includes("img")) {
        displayLink = "";
      }

      // Attempt to reconstruct 591 link
      if (!displayLink && rental.customFields?.original_591_id) {
        displayLink = `https://rent.591.com.tw/${rental.customFields.original_591_id}`;
      }

      const popupHtml = `
        <div class="font-sans text-[11px] leading-relaxed select-none min-w-[140px] max-w-[200px]">
          <div class="font-bold text-gray-100 mb-1 leading-tight text-[12px]">${rental.title}</div>
          <div class="text-[#00f0ff] font-mono font-bold mb-1.5">${rental.price.toLocaleString()} 元/月</div>
          ${displayLink ? `<a href="${displayLink}" target="_blank" rel="noreferrer" class="text-gray-400 hover:text-white underline underline-offset-2 text-[10px]">前往 591</a>` : ""}
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        autoPan: false,
        offset: [0, -10],
      });

      marker.on("click", () => {
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
  }, [
    rentals,
    selectedRental,
    maxBudget,
    minSize,
    maxDistance,
    searchKeyword,
    statusFilters,
  ]);

  // Handle sidebar collapse/expand map invalidation sizes sequentially for smooth render changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Call immediately to start size adjustment
    mapInstanceRef.current.invalidateSize({ pan: false });

    // Sequence periodic invalidations to catch the CSS transition midway and at completion
    const intervals = [100, 200, 300, 400, 500];
    const timers = intervals.map((delay) => {
      return setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      }, delay);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isSidebarOpen]);

  // Track map container size changes automatically without panning
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ pan: false });
      }
    });

    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Click handler to refocus back to corporate headquarters using the 30km circle bounds with tight padding
  const handleResetMap = () => {
    if (!mapInstanceRef.current) return;
    setIsResetting(true);

    // Fit the map view to the exact boundary of the circle overlay so it occupies the viewport elegantly
    // Tightened the padding constraint down to [10, 10] (or [5, 5]) so it fits securely close to boundaries
    // We compute the bounds dynamically so it works seamlessly even if showCircle is toggled off
    // Note: L.latLng.toBounds takes sizeInMeters (which means diameter for a circle)
    const bounds = L.latLng(COMPANY_COORDS).toBounds(radius * 2000);
    mapInstanceRef.current.fitBounds(bounds, {
      padding: [40, 40],
      animate: true,
      duration: 1.2,
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
      mapInstanceRef.current.setView(st.coord as L.LatLngExpression, 14, {
        animate: true,
      });
    }
  };

  // Real-time circle coverage area calculation: pi * R^2
  const computedArea = (Math.PI * Math.pow(radius, 2)).toFixed(0);

  // Retrieve details for currently active selected or hovered district
  const activeDistrictName = hoveredDistrict || selectedDistrict || null;
  const activeDistrictRent = activeDistrictName
    ? DISTRICT_RENT_DATA[activeDistrictName]
    : null;

  return (
    <div
      id="app-root"
      className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-[#06070a] text-[#f3f4f6] font-sans antialiased"
    >
      {/* LEFT: Map Segment - Occupies full available space with responsive width dynamic transitions */}
      <div
        id="map-container"
        className={`h-[60vh] md:h-full relative overflow-hidden transition-all duration-300 ease-in-out order-1 md:order-1 border-r border-[#1e2330] ${!showMrtLabels ? "hide-mrt-labels" : ""} ${
          isSidebarOpen ? "w-full flex-1" : "w-full md:w-full flex-1"
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
          {isSidebarOpen ? (
            <PanelRightClose className="w-5 h-5" />
          ) : (
            <PanelRightOpen className="w-5 h-5 animate-pulse" />
          )}
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
        statusFilters={statusFilters}
        setStatusFilters={setStatusFilters}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        isSidebarDragging={isSidebarDragging}
        setIsSidebarDragging={setIsSidebarDragging}
        onResizeComplete={() => {
          if (mapInstanceRef.current)
            mapInstanceRef.current.invalidateSize({ pan: false });
        }}
      />
    </div>
  );
}
