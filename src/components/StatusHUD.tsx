import React from 'react';

interface StatusHUDProps {
  lat: number;
  lng: number;
  zoom: number;
}

export const StatusHUD: React.FC<StatusHUDProps> = ({ lat, lng, zoom }) => {
  return (
    <div className="absolute bottom-4 left-4 z-[999] pointer-events-none hidden sm:block">
      <div className="bg-[#0b0c10]/95 border border-white/10 px-3 py-1.5 rounded-lg text-[11px] text-[#9ca3af] font-mono flex items-center gap-2 shadow-lg backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse"></span>
        <span>地圖視角: [{lat.toFixed(4)}, {lng.toFixed(4)}] / Zoom {zoom.toFixed(1)}</span>
      </div>
    </div>
  );
};
