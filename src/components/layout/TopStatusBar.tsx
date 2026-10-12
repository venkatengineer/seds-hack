import React, { useState, useEffect, useRef } from 'react';
import { useSystem } from '../../context/SystemContext';
import {
  Play,
  Square,
  Clock,
  RotateCcw,
  FileText,
  Download,
  MoreVertical,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface TopStatusBarProps {
  onOpenReport: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ onOpenReport }) => {
  const {
    vehicle,
    isTesting,
    startLiveTest,
    stopLiveTest,
    resetDemoState,
    selectedBoardId,
    selectedComponentId,
    testRuns,
  } = useSystem();

  const [utcTime, setUtcTime] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = () => {
    const headers = ['TestRunId', 'Timestamp', 'VehicleId', 'BoardId', 'BoardName', 'ComponentRef', 'TestType', 'Outcome', 'PeakTemp_C', 'RecoverySec', 'MLConfidence', 'StabilityTrend'];
    const rows = testRuns.map(r => [
      r.id,
      r.timestamp,
      r.vehicleId,
      r.boardId,
      `"${r.boardName}"`,
      r.componentRef,
      r.testType,
      r.outcome,
      r.peakTemperature,
      r.recoveryTimeSeconds,
      r.mlConfidence ? (r.mlConfidence * 100).toFixed(1) + '%' : 'N/A',
      r.stabilityTrend,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AERO_TELEMETRY_${vehicle.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsMenuOpen(false);
  };

  return (
    <header className="h-13 bg-[#080b12] border-b border-[#182233] px-4 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: Application Identity & Single Understated System Status */}
      <div className="flex items-center gap-3 sm:gap-5 overflow-hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold hidden sm:inline">
            AERO-DIAG
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200">
            <span className="text-slate-500 font-medium">VEHICLE:</span>
            <span className="font-semibold text-white tracking-wide">{vehicle.id}</span>
          </div>
        </div>

        {/* Single Understated Connection/Status Indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d131f] border border-[#1a2538] text-[11px] font-mono text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-300 font-medium">SIMULATION MODE</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 hidden md:inline">ML: READY</span>
        </div>
      </div>

      {/* Right: UTC Clock, Master Start/Stop Test, and Compact Action Menu */}
      <div className="flex items-center gap-2.5">
        {/* Understated UTC Clock */}
        <div className="hidden lg:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 px-2.5 py-1 rounded bg-[#06090e] border border-[#162030]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-slate-300">{utcTime || 'SYNCHRONIZING...'}</span>
        </div>

        {/* Master Start / Stop Thermal Test Button */}
        {isTesting ? (
          <button
            onClick={stopLiveTest}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-[0_0_12px_rgba(225,29,72,0.4)] transition-all cursor-pointer"
          >
            <Square className="w-3 h-3 fill-current animate-pulse" />
            <span>ABORT TEST</span>
          </button>
        ) : (
          <button
            onClick={() => startLiveTest(selectedBoardId, selectedComponentId)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>START TEST</span>
          </button>
        )}

        {/* Compact Action Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(o => !o)}
            title="Options and Actions Menu"
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#121927] border border-[#1c273b] transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-52 bg-[#0c111a] border border-[#1e2a3c] rounded-lg shadow-2xl py-1 z-50 font-mono text-xs backdrop-blur-md">
              <button
                onClick={() => {
                  onOpenReport();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-[#141d2d] transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generate Report</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-[#141d2d] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Telemetry CSV</span>
              </button>

              <div className="border-t border-[#182335] my-1" />

              <button
                onClick={() => {
                  resetDemoState();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-[#141d2d] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Reset Demo Baseline</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
