import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { FloatingHUD } from "./components/FloatingHUD";
import { LegendHUD } from "./components/LegendHUD";
import { StatusHUD } from "./components/StatusHUD";
import { Sidebar } from "./components/Sidebar";
import { MapRenderer } from "./components/MapRenderer";
import { AppProvider, useAppContext } from "./context/AppContext";

function RentAnalysisApp() {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    showMrtLabels,
  } = useAppContext();

  return (
    <div
      id="app-root"
      className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-[#06070a] text-[#f3f4f6] font-sans antialiased"
    >
      {/* LEFT: Map Segment */}
      <div
        id="map-container"
        className={`h-[60vh] md:h-full relative overflow-hidden transition-all duration-300 ease-in-out order-1 md:order-1 border-r border-[#1e2330] ${!showMrtLabels ? "hide-mrt-labels" : ""} ${
          isSidebarOpen ? "w-full flex-1" : "w-full md:w-full flex-1"
        }`}
      >
        <MapRenderer />

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

        <FloatingHUD />

        <LegendHUD />

        <StatusHUD />

        <div className="absolute top-4 right-16 z-[990] pointer-events-none hidden md:block select-none">
          <div className="bg-gradient-to-r from-purple-500/10 to-emerald-500/10 backdrop-blur-md border border-purple-500/20 px-3 py-1.5 rounded-full text-[10px] text-purple-400 font-mono font-semibold tracking-wider uppercase">
            Phase 6: Export & Filter Active
          </div>
        </div>
      </div>

      {/* RIGHT: Sidebar Dashboard Panel */}
      <Sidebar />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <RentAnalysisApp />
    </AppProvider>
  );
}
