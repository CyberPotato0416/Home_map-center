import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import rawGeoJson from '../taipei_new_taipei_districts.json';
import { COMPANY_COORDS, DISTRICT_RENT_DATA, MRT_LINE_COLORS, MRT_STATIONS_DATA, MRT_LINES_DATA } from '../constants';
import { getRentColor } from '../utils';
import { getMrtLinesForStation } from '../utils/mrtHelper';
import { MrtStation } from '../types';

interface MapInitProps {
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapInstanceRef: React.MutableRefObject<L.Map | null>;
  markerLayerRef: React.MutableRefObject<L.Marker | null>;
  circleLayerRef: React.MutableRefObject<L.Circle | null>;
  geojsonGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtLinesGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtStationsGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  rentalsGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  
  radius: number;
  setHoveredDistrict: (d: string | null) => void;
  setSelectedDistrict: (d: string | null) => void;
  setSelectedStation: (s: MrtStation | null) => void;
  setMapCenterPos: (pos: { lat: number; lng: number }) => void;
  setZoomLevel: (zoom: number) => void;
}

export function useMapInit({
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
  setZoomLevel
}: MapInitProps) {
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // 1. Initialize map instance
    const map = L.map(mapContainerRef.current, {
      center: COMPANY_COORDS,
      zoom: 11,
      zoomControl: false, // Disabling standard control for custom zoom placing on bottomright
      minZoom: 9,
      maxZoom: 18,
      trackResize: false, // Disable native resize so we can manually invalidateSize with { pan: false }
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
            const desc = staticStation ? staticStation.desc : `$${normalizedName} 捷運站，大台北大眾捷運運輸系統核心通勤點。`;
            const primaryLine = lines[0] || 'R';
            const borderColor = MRT_LINE_COLORS[primaryLine] || '#ffffff';
            const isTransfer = lines.length > 1;

            const badgeHtml = lines.map(line => `<span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold text-white font-mono leading-none select-none shrink-0 border border-white/10" style="background-color: ${MRT_LINE_COLORS[line]}">${line}</span>`).join('');

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
          
          const badgeHtml = station.lines.map(line => `<span class="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold text-white font-mono leading-none select-none shrink-0 border border-white/10" style="background-color: ${MRT_LINE_COLORS[line]}">${line}</span>`).join('');

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
}
