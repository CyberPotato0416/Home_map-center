import React, { useEffect } from 'react';
import L from 'leaflet';

interface MapLayersProps {
  mapInstanceRef: React.MutableRefObject<L.Map | null>;
  circleLayerRef: React.MutableRefObject<L.Circle | null>;
  geojsonGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtLinesGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  mrtStationsGroupRef: React.MutableRefObject<L.LayerGroup | null>;
  radius: number;
  showCircle: boolean;
  showHeatmap: boolean;
  showMrtLines: boolean;
  showMrtStations: boolean;
}

export function useMapLayers({
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
}: MapLayersProps) {
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
}
