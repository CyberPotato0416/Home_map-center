import React from 'react';
import { Sliders, Eye, EyeOff, RefreshCw, AlertTriangle, Compass, MapPin } from 'lucide-react';
import { TargetCenter } from '../types';
import { useAppContext } from '../context/AppContext';

export const MapControlTab: React.FC = () => {
  const {
    targetCenter,
    setTargetCenter,
    radius,
    setRadius,
    showCircle,
    setShowCircle,
    isGeoJsonLoading,
    geoJsonError,
    isUsingFallbackGeoJson,
    isResetting,
    recenterMap: onResetMap,
  } = useAppContext();

  const computedArea = (Math.PI * Math.pow(radius, 2)).toFixed(0);
  // Local slider state to ensure high-performance dragging feedback without trigger high-frequency re-renders on the map
  const [localRadius, setLocalRadius] = React.useState<number>(radius);

  // States for target center configuration
  const [isEditingCenter, setIsEditingCenter] = React.useState(false);
  const [centerForm, setCenterForm] = React.useState<TargetCenter>(targetCenter);

  const PRESET_CENTERS: TargetCenter[] = React.useMemo(() => [
    {
      name: "築本科技股份有限公司",
      address: "台北市民權東路三段 · 近捷運中山國中站",
      lat: 25.0617,
      lng: 121.5435
    },
    {
      name: "陳冠宇建築師事務所",
      address: "台北市大安區仁愛路3段29號5樓",
      lat: 25.0385,
      lng: 121.5365
    }
  ], []);

  React.useEffect(() => {
    setLocalRadius(radius);
  }, [radius]);

  const commitRadius = (val: number) => {
    setRadius(val);
  };

  const saveTargetCenter = () => {
    setTargetCenter({
      ...centerForm,
      lat: Number(centerForm.lat) || 25.0617,
      lng: Number(centerForm.lng) || 121.5435
    });
    setIsEditingCenter(false);
    onResetMap();
  };

  const selectPresetCenter = (preset: TargetCenter) => {
    setTargetCenter(preset);
    setCenterForm(preset);
    onResetMap();
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* SECTION 1: MAP CONTROLLER CARD */}
      <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-cyan-400" />
            地圖半徑與範圍控制
          </div>
          <span className="text-[10px] font-mono bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-400/20">
            系統載入健全
          </span>
        </div>

        {/* Slider to adjust circles */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs text-gray-400">
            <span>設定關注範圍 ({localRadius}k)</span>
            <span className="font-mono text-[#00f0ff] font-bold text-xs bg-[#00f0ff]/15 px-2 py-0.5 rounded border border-[#00f0ff]/20">
              {localRadius} km
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="20" 
            step="1"
            value={localRadius} 
            onChange={(e) => setLocalRadius(parseInt(e.target.value))}
            onMouseUp={() => commitRadius(localRadius)}
            onTouchEnd={() => commitRadius(localRadius)}
            onKeyUp={() => commitRadius(localRadius)}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#00f0ff] focus:outline-none"
          />
          <div className="flex justify-between text-[9px] text-gray-500 font-mono">
            <span>1k</span>
            <span>10k</span>
            <span>20k</span>
          </div>
        </div>

        {/* Toggles Group */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
          {/* Radius circle eye toggles */}
          <div className="flex items-center justify-between text-xs text-gray-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>
              顯示 {radius}km 關注範圍線
            </span>
            <button 
              onClick={() => setShowCircle(!showCircle)}
              className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                showCircle 
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25' 
                  : 'bg-gray-800 border-white/10 text-gray-400 hover:text-white'
              }`}
              title={showCircle ? "隱藏範圍線" : "顯示範圍線"}
            >
              {showCircle ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* GIS status loading/updating status HUD panel */}
        <div className="bg-[#0b0c10] border border-white/5 rounded-lg p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[9px] text-[#9ca3af]">
            <span>雙北圖資與路網狀態:</span>
            {isGeoJsonLoading ? (
              <span className="text-amber-400 flex items-center gap-1">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                更新中
              </span>
            ) : geoJsonError ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                地網連線異常
              </span>
            ) : (
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                {isUsingFallbackGeoJson ? "本地安全網格 (備用)" : "雙軌同步 (CDN)"}
              </span>
            )}
          </div>
          <div className="flex justify-between items-baseline text-[10px] text-gray-400 mt-1">
            <span>關注半徑內覆蓋面積</span>
            <span className="text-xs font-bold font-mono text-[#00f0ff]">
              {showCircle ? parseInt(computedArea).toLocaleString() : '0'} km²
            </span>
          </div>
        </div>

        {/* Map Centering back to corporate button */}
        <button
          id="btn-recenter"
          onClick={onResetMap}
          disabled={isResetting}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/35 hover:to-blue-500/35 active:scale-[0.98] border border-cyan-400/20 text-[#00f0ff] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50 font-sans"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          🎯 返回中心點 ({targetCenter.name})
        </button>
      </div>

      {/* Target Center Configuration Card */}
      <div className="bg-[#141722]/80 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-lg">
        <div className="flex flex-col gap-2 border-b border-white/5 pb-3">
          <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            選擇預設據點
          </div>
          {PRESET_CENTERS.map((preset, idx) => (
            <label key={idx} className={`flex items-start gap-2 p-2 rounded cursor-pointer border transition-colors ${
              Math.abs(targetCenter.lat - preset.lat) < 0.0001 && Math.abs(targetCenter.lng - preset.lng) < 0.0001
              ? 'bg-cyan-500/10 border-cyan-400/30' 
              : 'bg-black/20 border-white/5 hover:bg-black/40'
            }`}>
              <div className="pt-0.5">
                <input 
                  type="radio" 
                  name="preset_center" 
                  checked={Math.abs(targetCenter.lat - preset.lat) < 0.0001 && Math.abs(targetCenter.lng - preset.lng) < 0.0001}
                  onChange={() => selectPresetCenter(preset)}
                  className="accent-cyan-400"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">{preset.name}</span>
                <span className="text-[10px] text-gray-400">{preset.address}</span>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between cursor-pointer mt-1" onClick={() => setIsEditingCenter(!isEditingCenter)}>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-purple-400" />
            自訂測距中心點
          </div>
          <button className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white transition-colors">
            {isEditingCenter ? "收起" : "修改"}
          </button>
        </div>

        {isEditingCenter ? (
          <div className="flex flex-col gap-2 mt-1 animate-fade-in">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">據點名稱 (Company Name)</label>
              <input
                type="text"
                value={centerForm.name}
                onChange={e => setCenterForm({...centerForm, name: e.target.value})}
                className="bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400">地址資訊 (Address info)</label>
              <input
                type="text"
                value={centerForm.address}
                onChange={e => setCenterForm({...centerForm, address: e.target.value})}
                className="bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400">緯度 (LAT)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerForm.lat}
                  onChange={e => setCenterForm({...centerForm, lat: parseFloat(e.target.value)})}
                  className="bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400">經度 (LNG)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerForm.lng}
                  onChange={e => setCenterForm({...centerForm, lng: parseFloat(e.target.value)})}
                  className="bg-black/40 border border-white/10 rounded p-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>
            <button
              onClick={saveTargetCenter}
              className="mt-1 w-full py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded border border-purple-500/30 text-xs font-bold transition-all"
            >
              儲存並更新地圖
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-gray-400 leading-normal bg-black/30 p-2 rounded border border-white/5">
            {PRESET_CENTERS.some(p => Math.abs(targetCenter.lat - p.lat) < 0.0001 && Math.abs(targetCenter.lng - p.lng) < 0.0001) ? (
              <span className="text-white/40">目前使用上方預設據點</span>
            ) : (
              <>
                <span className="text-white font-bold">{targetCenter.name}</span><br />
                {targetCenter.address}<br />
                Lat: {targetCenter.lat}, Lng: {targetCenter.lng}
              </>
            )}
          </div>
        )}
      </div>

      {/* Instructions Guide Card */}
      <div className="bg-[#141722]/50 border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 shadow-md">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <Compass className="w-4 h-4 text-cyan-400" />
          圖資操作說明
        </div>
        <p className="text-[11px] text-gray-400 leading-normal font-sans">
          切換上方 <span className="text-[#ff3860] font-semibold">租金熱圖 (TAB 2)</span> 可以觀察雙北市的月租行情地圖並分析各行政區情報；切換至 <span className="text-amber-400 font-semibold">捷運通勤 (TAB 3)</span> 可設定捷運圖層配置並觀看通勤關鍵站點。
        </p>
      </div>
    </div>
  );
};
