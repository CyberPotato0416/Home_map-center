import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import L from "leaflet";
import { MrtStation, RentalProperty, TargetCenter } from "../types";
import { COMPANY_COORDS } from "../constants";
import { getRentalLocalId } from "../utils";
import rawGeoJson from "../taipei_new_taipei_districts.json";

interface AppContextType {
  // Map settings
  radius: number;
  setRadius: (r: number) => void;
  showCircle: boolean;
  setShowCircle: (s: boolean) => void;
  zoomLevel: number;
  setZoomLevel: (z: number) => void;
  mapCenterPos: { lat: number; lng: number };
  setMapCenterPos: (pos: { lat: number; lng: number }) => void;
  isResetting: boolean;
  setIsResetting: (r: boolean) => void;
  targetCenter: TargetCenter;
  setTargetCenter: (tc: TargetCenter) => void;
  recenterMap: () => void;

  // GIS layer states
  showHeatmap: boolean;
  setShowHeatmap: (s: boolean) => void;
  geoJsonData: any;
  isGeoJsonLoading: boolean;
  geoJsonError: string | null;
  isUsingFallbackGeoJson: boolean;
  selectedDistrict: string | null;
  setSelectedDistrict: (d: string | null) => void;
  hoveredDistrict: string | null;
  setHoveredDistrict: (d: string | null) => void;

  // Transit states
  showMrtLines: boolean;
  setShowMrtLines: (v: boolean) => void;
  showMrtStations: boolean;
  setShowMrtStations: (v: boolean) => void;
  showMrtLabels: boolean;
  setShowMrtLabels: (v: boolean) => void;
  selectedStation: MrtStation | null;
  setSelectedStation: (station: MrtStation | null) => void;

  // Rental states
  rentals: RentalProperty[];
  setRentals: React.Dispatch<React.SetStateAction<RentalProperty[]>>;
  selectedRental: RentalProperty | null;
  setSelectedRental: (r: RentalProperty | null) => void;

  // Filter states
  maxBudget: number;
  setMaxBudget: (b: number) => void;
  minSize: number;
  setMinSize: (s: number) => void;
  maxDistance: number;
  setMaxDistance: (d: number) => void;
  searchKeyword: string;
  setSearchKeyword: (kw: string) => void;
  statusFilters: { signing: boolean; reviewing: boolean; renting: boolean };
  setStatusFilters: React.Dispatch<
    React.SetStateAction<{ signing: boolean; reviewing: boolean; renting: boolean }>
  >;

  // Sidebar & Layout states
  isSidebarOpen: boolean;
  setIsSidebarOpen: (o: boolean) => void;
  isInfoCardOpen: boolean;
  setIsInfoCardOpen: (o: boolean) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  sidebarWidth: number;
  setSidebarWidth: (w: number) => void;
  isSidebarDragging: boolean;
  setIsSidebarDragging: (d: boolean) => void;

  // Refs for Leaflet mapping to bypass rerender limits
  mapInstanceRef: React.MutableRefObject<L.Map | null>;
  markerLayerRef: React.MutableRefObject<L.Marker | null>;
  circleLayerRef: React.MutableRefObject<L.Circle | null>;
  geojsonGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtLinesGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtStationsGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  rentalsGroupRef: React.MutableRefObject<L.LayerGroup | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Leaflet mutable refs (stored here to share with hooks/components cleanly)
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.Marker | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const geojsonGroupRef = useRef<L.LayerGroup | null>(null);
  const mrtLinesGroupRef = useRef<L.LayerGroup | null>(null);
  const mrtStationsGroupRef = useRef<L.LayerGroup | null>(null);
  const rentalsGroupRef = useRef<L.LayerGroup | null>(null);

  // States
  const [radius, setRadius] = useState<number>(4);
  const [showCircle, setShowCircle] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(11);
  const [mapCenterPos, setMapCenterPos] = useState<{ lat: number; lng: number }>({
    lat: 25.0617,
    lng: 121.5435,
  });
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isInfoCardOpen, setIsInfoCardOpen] = useState<boolean>(false);

  const [targetCenter, setTargetCenter] = useState<TargetCenter>(() => {
    const saved = localStorage.getItem("target_center");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: "築本科技股份有限公司",
      address: "台北市民權東路三段 · 近捷運中山國中站",
      lat: COMPANY_COORDS[0],
      lng: COMPANY_COORDS[1],
    };
  });

  // Heatmap GeoJSON states
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isGeoJsonLoading, setIsGeoJsonLoading] = useState<boolean>(true);
  const [geoJsonError, setGeoJsonError] = useState<string | null>(null);
  const [isUsingFallbackGeoJson, setIsUsingFallbackGeoJson] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  // Transit states
  const [showMrtLines, setShowMrtLines] = useState<boolean>(true);
  const [showMrtStations, setShowMrtStations] = useState<boolean>(true);
  const [showMrtLabels, setShowMrtLabels] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<MrtStation | null>(null);

  // Rentals state
  const [rentals, setRentals] = useState<RentalProperty[]>([]);
  const [selectedRental, setSelectedRental] = useState<RentalProperty | null>(null);

  // Filters state
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

  // Sidebar Layout state
  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarWidth, setSidebarWidth] = useState<number>(420);
  const [isSidebarDragging, setIsSidebarDragging] = useState<boolean>(false);

  // Save target center to localStorage on change
  useEffect(() => {
    localStorage.setItem("target_center", JSON.stringify(targetCenter));
  }, [targetCenter]);

  // Save status filters to localStorage on change
  useEffect(() => {
    localStorage.setItem("rental_status_filters", JSON.stringify(statusFilters));
  }, [statusFilters]);

  // Load geojson data
  useEffect(() => {
    setIsGeoJsonLoading(true);
    setGeoJsonError(null);
    try {
      setGeoJsonData(rawGeoJson);
      setIsUsingFallbackGeoJson(false);
      setIsGeoJsonLoading(false);
    } catch (err: any) {
      console.error("Fatal error loading static GeoJSON:", err);
      setGeoJsonError(err.message || "無法取得雙北行政區界圖資");
      setIsGeoJsonLoading(false);
    }
  }, []);

  // Load rentals and automatically heal images
  useEffect(() => {
    const saved = localStorage.getItem("my_rental_pins");
    let loadedRentals: RentalProperty[] = [];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loadedRentals = parsed.filter((r: any) => {
            const idStartsWithRental = String(r.id).startsWith("rental");
            const titleHasDemo = String(r.title).includes("小資族首選靜巷套房");
            return !idStartsWithRental && !titleHasDemo;
          });
        }
      } catch (e) {
        console.error("Failed to parse saved rentals", e);
      }
    }

    const healAndSetRentals = async () => {
      try {
        const res = await fetch("/api/rentals-images-status");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.folders)) {
            let changed = false;
            const healed = loadedRentals.map((rental) => {
              const idValue = getRentalLocalId(rental);
              const folderMatch = data.folders.find(
                (f: any) => String(f.name).toLowerCase().trim() === String(idValue).toLowerCase().trim()
              );

              if (folderMatch && folderMatch.count > 0) {
                const newLocalImages = Array.from(
                  { length: folderMatch.count },
                  (_, i) => `/rentals_images/${idValue}/image_${i + 1}.jpg`
                );

                const isDifferent =
                  !rental.images ||
                  rental.images.length !== newLocalImages.length ||
                  rental.images.some((img) => !img.startsWith("/rentals_images/"));

                if (isDifferent) {
                  changed = true;
                  return {
                    ...rental,
                    images: newLocalImages,
                  };
                }
              }
              return rental;
            });

            setRentals(healed);
            if (changed || loadedRentals.length !== (saved ? JSON.parse(saved).length : 0)) {
              localStorage.setItem("my_rental_pins", JSON.stringify(healed));
            }
            return;
          }
        }
      } catch (e) {
        console.error("Self-healing image migrator failed:", e);
      }

      setRentals(loadedRentals);
    };

    healAndSetRentals();
  }, []);

  // Sync tab navigation with selections
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

  // Recenter map action helper
  const recenterMap = () => {
    if (!mapInstanceRef.current) return;
    setIsResetting(true);

    const bounds = L.latLng([targetCenter.lat, targetCenter.lng]).toBounds(radius * 2000);
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

  return (
    <AppContext.Provider
      value={{
        radius,
        setRadius,
        showCircle,
        setShowCircle,
        zoomLevel,
        setZoomLevel,
        mapCenterPos,
        setMapCenterPos,
        isResetting,
        setIsResetting,
        targetCenter,
        setTargetCenter,
        recenterMap,

        showHeatmap,
        setShowHeatmap,
        geoJsonData,
        isGeoJsonLoading,
        geoJsonError,
        isUsingFallbackGeoJson,
        selectedDistrict,
        setSelectedDistrict,
        hoveredDistrict,
        setHoveredDistrict,

        showMrtLines,
        setShowMrtLines,
        showMrtStations,
        setShowMrtStations,
        showMrtLabels,
        setShowMrtLabels,
        selectedStation,
        setSelectedStation,

        rentals,
        setRentals,
        selectedRental,
        setSelectedRental,

        maxBudget,
        setMaxBudget,
        minSize,
        setMinSize,
        maxDistance,
        setMaxDistance,
        searchKeyword,
        setSearchKeyword,
        statusFilters,
        setStatusFilters,

        isSidebarOpen,
        setIsSidebarOpen,
        isInfoCardOpen,
        setIsInfoCardOpen,
        activeTab,
        setActiveTab,
        sidebarWidth,
        setSidebarWidth,
        isSidebarDragging,
        setIsSidebarDragging,

        mapInstanceRef,
        markerLayerRef,
        circleLayerRef,
        geojsonGroupRef,
        mrtLinesGroupRef,
        mrtStationsGroupRef,
        rentalsGroupRef,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
