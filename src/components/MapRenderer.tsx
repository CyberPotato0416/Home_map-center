import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { MRT_STATIONS_DATA } from "../constants";
import { getRentColor, calculateDistance, calculateHomeScore } from "../utils";
import { useMapInit } from "../hooks/useMapInit";
import { useMapLayers } from "../hooks/useMapLayers";
import { useAppContext } from "../context/AppContext";

export const MapRenderer: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    rentals,
    selectedRental,
    setSelectedRental,
    maxBudget,
    minSize,
    maxDistance,
    searchKeyword,
    statusFilters,
    targetCenter,
    setSelectedStation,
    setSelectedDistrict,
    mapInstanceRef,
    rentalsGroupRef,
    isSidebarOpen,
  } = useAppContext();

  // Initialize map
  useMapInit({ mapContainerRef });

  // Layer visibility controllers
  useMapLayers();

  // Render Rental Properties on Map
  useEffect(() => {
    const group = rentalsGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;

    group.clearLayers();

    const kw = searchKeyword.toLowerCase().trim();

    rentals.forEach((rental) => {
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
          targetCenter.lat,
          targetCenter.lng,
        ) / 1000;
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
      if (displayLink.includes(".jpg") || displayLink.includes("img")) {
        displayLink = "";
      }

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

  // Sidebar resize transition timeouts watcher
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.invalidateSize({ pan: false });

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

  // Track map container size changes automatically
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

  return (
    <div ref={mapContainerRef} className="w-full h-full" id="map" />
  );
};
