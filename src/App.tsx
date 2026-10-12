import React, { useState } from 'react';
import { SystemProvider, useSystem } from './context/SystemContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ReportModal } from './components/layout/ReportModal';
import { MinimalNavOverlay } from './components/layout/MinimalNavOverlay';
import { DiagnosticStatusPopover } from './components/layout/DiagnosticStatusPopover';
import { MissionOverview } from './pages/MissionOverview';
import { VehicleTopology } from './pages/VehicleTopology';
import { BoardDiagnostics } from './pages/BoardDiagnostics';
import { LiveTelemetry } from './pages/LiveTelemetry';
import { FaultAnalysis } from './pages/FaultAnalysis';
import { MLDiagnosticTerminal } from './components/terminal/MLDiagnosticTerminal';
import { Esp32ModalDrawer } from './components/terminal/Esp32ModalDrawer';
import { TestHistory } from './pages/TestHistory';
import { Settings } from './pages/Settings';
import {
  Menu,
  ArrowLeft,
  Sun,
  Moon,
  FileText,
  Activity,
  ShieldAlert,
  RotateCcw,
  Terminal as TerminalIcon,
} from 'lucide-react';

const MainWorkspace: React.FC = () => {
  const { currentTab, setCurrentTab, vehicle, isTesting, testProgress, esp32Connected, esp32Telemetry } = useSystem();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [isStatusOpen, setIsStatusOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isEsp32Open, setIsEsp32Open] = useState<boolean>(false);

  const getTabTitle = () => {
    switch (currentTab) {
      case 'overview':
        return '3D VEHICLE STAGE';
      case 'pcb':
        return 'INTERACTIVE PCB EXPLORER';
      case 'telemetry':
        return 'LIVE TELEMETRY & STIMULUS RUNNER';
      case 'faults':
        return 'MACHINE LEARNING FAULT DIAGNOSTICS';
      case 'terminal':
        return 'LIVE ML DIAGNOSTIC TERMINAL';
      case 'topology':
        return 'VEHICLE AVIONICS TOPOLOGY';
      case 'history':
        return 'VERIFICATION TEST HISTORY';
      case 'settings':
        return 'PLATFORM CONFIGURATION';
      default:
        return 'SYSTEM';
    }
  };

  return (
    <div
      className={`h-screen w-screen overflow-hidden relative select-none font-sans ${
        isDark ? 'bg-[#07090e] text-slate-100' : 'bg-[#eef2f6] text-slate-900'
      }`}
      data-theme={theme}
    >
      {/* ============================================================== */}
      {/* 1. PRIMARY VIEW: 100% IMMERSIVE 3D VEHICLE EXPERIENCE           */}
      {/* ============================================================== */}
      {currentTab === 'overview' ? (
        <div className="w-full h-full relative">
          {/* Top-Left Floating Minimal Brand & Menu Trigger */}
          <div className="absolute top-5 left-5 z-20 pointer-events-auto flex items-center gap-2.5">
            <button
              onClick={() => setIsNavOpen(true)}
              title="Open Navigation Menu"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl backdrop-blur-xl border shadow-xl cursor-pointer transition-all duration-200 hover:scale-102 ${
                isDark
                  ? 'bg-slate-950/75 border-slate-800 text-slate-100 hover:border-cyan-700/60 shadow-black/40'
                  : 'bg-white/85 border-slate-300 text-slate-900 hover:border-cyan-600 shadow-slate-300/40'
              }`}
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-600/20 text-cyan-500">
                <Menu className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-mono text-xs font-bold tracking-wider leading-none">
                  AERO-DIAG
                </div>
                <div className="font-mono text-[9px] text-slate-400 leading-none mt-1">
                  ORION-IX // BLK 2
                </div>
              </div>
            </button>
          </div>

          {/* Top-Right Floating Minimal Diagnostic Status Indicator & Terminal Link */}
          <div className="absolute top-5 right-5 z-20 pointer-events-auto flex items-center gap-2">
            {/* Live ESP32 Hardware Status Button */}
            <button
              onClick={() => setIsEsp32Open(true)}
              title="Open Live ESP32 Hardware Serial Terminal"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-xl cursor-pointer font-mono text-xs transition-all duration-200 hover:scale-102 ${
                esp32Connected
                  ? isDark
                    ? 'bg-emerald-950/75 border-emerald-700/60 text-emerald-300 hover:border-emerald-500 shadow-emerald-950/30'
                    : 'bg-emerald-50/90 border-emerald-300 text-emerald-800 hover:border-emerald-500 shadow-emerald-200/30'
                  : isDark
                  ? 'bg-slate-950/75 border-slate-800 text-slate-400 hover:border-slate-700 shadow-black/40'
                  : 'bg-white/85 border-slate-300 text-slate-600 hover:border-slate-400 shadow-slate-300/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  esp32Connected
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.9)]'
                    : 'bg-slate-500'
                }`}
              />
              <span className="font-bold">ESP32</span>
              {esp32Connected && esp32Telemetry?.ds18b20Temp !== null && (
                <span className="hidden sm:inline text-[11px] font-mono text-emerald-400">
                  {esp32Telemetry?.ds18b20Temp?.toFixed(1)}°C
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('terminal')}
              title="Open Live ML Diagnostic Terminal"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl border shadow-xl cursor-pointer font-mono text-xs transition-all duration-200 hover:scale-102 ${
                isDark
                  ? 'bg-slate-950/75 border-slate-800 text-cyan-400 hover:border-cyan-700/60 shadow-black/40'
                  : 'bg-white/85 border-slate-300 text-cyan-700 hover:border-cyan-600 shadow-slate-300/40'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">TERMINAL</span>
            </button>

            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              title="Toggle Diagnostic Health Summary"
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full backdrop-blur-xl border shadow-xl cursor-pointer font-mono text-xs transition-all duration-200 hover:scale-102 ${
                isDark
                  ? 'bg-slate-950/75 border-slate-800 text-slate-200 hover:border-slate-700 shadow-black/40'
                  : 'bg-white/85 border-slate-300 text-slate-800 hover:border-slate-400 shadow-slate-300/40'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isTesting
                    ? 'bg-cyan-400 animate-ping'
                    : vehicle.status === 'fault'
                    ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : vehicle.status === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  SYSTEM HEALTH
                </span>
                <span className="text-[11px] font-bold mt-0.5">
                  {isTesting
                    ? `STIMULUS ${testProgress}%`
                    : vehicle.activeFaultsCount > 0 || vehicle.suspectedAnomaliesCount > 0
                    ? `${vehicle.activeFaultsCount} FAULT · ${vehicle.suspectedAnomaliesCount} ANOMALY`
                    : 'ALL SYSTEMS NOMINAL'}
                </span>
              </div>
            </button>
          </div>

          {/* Center: Dominant 3D Vehicle Stage (Fills 100% of Viewport!) */}
          <main className="w-full h-full">
            <MissionOverview onOpenReport={() => setIsReportOpen(true)} />
          </main>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. SPECIALIZED ENGINEERING TOOLS VIEWS                          */
        /* (PCB Explorer, Live Telemetry, ML Faults, Topology, History)   */
        /* ============================================================== */
        <div className="flex flex-col w-full h-full overflow-hidden">
          {/* Engineering Tool Header */}
          <header
            className={`flex items-center justify-between px-5 py-3 border-b backdrop-blur-xl z-20 shrink-0 ${
              isDark
                ? 'bg-[#090d15]/90 border-slate-800 text-slate-100'
                : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            {/* Left: Return to Vehicle Stage & Navigation Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNavOpen(true)}
                title="Navigation Menu"
                className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-black'
                }`}
              >
                <Menu className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTab('overview')}
                title="Return to 3D Vehicle Stage"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>RETURN TO VEHICLE STAGE</span>
              </button>

              <div className="h-4 w-px bg-slate-700/40 hidden sm:block" />

              <div className="hidden sm:block">
                <span className="font-mono text-xs font-bold tracking-wider text-cyan-500">
                  {getTabTitle()}
                </span>
                <span className="font-mono text-[10px] text-slate-400 ml-2">
                  // ORION-IX
                </span>
              </div>
            </div>

            {/* Right: Quick Diagnostic Status Pill, Theme Toggle & Report */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEsp32Open(true)}
                title="Open Live ESP32 Hardware Terminal Window"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border font-mono text-xs transition-colors cursor-pointer ${
                  esp32Connected
                    ? isDark
                      ? 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    esp32Connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span className="font-bold">ESP32</span>
                {esp32Connected && esp32Telemetry?.ds18b20Temp !== null && (
                  <span className="hidden sm:inline text-[10px] text-emerald-400">
                    {esp32Telemetry?.ds18b20Temp?.toFixed(1)}°C
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    vehicle.status === 'fault'
                      ? 'bg-rose-500 animate-pulse'
                      : vehicle.status === 'warning'
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[11px] hidden md:inline">
                  {vehicle.status.toUpperCase()}
                </span>
              </button>

              <button
                onClick={toggleTheme}
                title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-amber-300 hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                title="Export Engineering Report"
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer hidden sm:flex items-center gap-1.5 font-mono text-xs ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-black'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>REPORT</span>
              </button>
            </div>
          </header>

          {/* Main Engineering Tool Workspace Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-5 relative">
            {currentTab === 'topology' && <VehicleTopology />}
            {currentTab === 'pcb' && <BoardDiagnostics />}
            {currentTab === 'telemetry' && <LiveTelemetry />}
            {currentTab === 'faults' && <FaultAnalysis />}
            {currentTab === 'terminal' && <MLDiagnosticTerminal />}
            {currentTab === 'history' && (
              <TestHistory onOpenReport={() => setIsReportOpen(true)} />
            )}
            {currentTab === 'settings' && <Settings />}
          </main>
        </div>
      )}

      {/* Slide-out Navigation Drawer Overlay */}
      <MinimalNavOverlay
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Compact Popover for System Health & Diagnostic Connections */}
      <DiagnosticStatusPopover
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Printable Diagnostics & CSV Export Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Live ESP32 Hardware Serial Terminal Modal */}
      <Esp32ModalDrawer
        isOpen={isEsp32Open}
        onClose={() => setIsEsp32Open(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <SystemProvider>
        <MainWorkspace />
      </SystemProvider>
    </ThemeProvider>
  );
}

export default App;
