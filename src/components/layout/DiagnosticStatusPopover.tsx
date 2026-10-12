import React, { useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  Play,
  Square,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';

interface DiagnosticStatusPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: () => void;
}

export const DiagnosticStatusPopover: React.FC<DiagnosticStatusPopoverProps> = ({
  isOpen,
  onClose,
  onOpenReport,
}) => {
  const {
    vehicle,
    boards,
    isTesting,
    testProgress,
    startLiveTest,
    stopLiveTest,
    setCurrentTab,
    selectedBoardId,
    selectedComponentId,
  } = useSystem();
  const { isDark } = useTheme();
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const faultsCount = vehicle.activeFaultsCount;
  const warningsCount = vehicle.suspectedAnomaliesCount;
  const nominalCount = boards.length - faultsCount - warningsCount;

  return (
    <div
      ref={popoverRef}
      className={`absolute top-14 right-4 sm:right-6 w-84 sm:w-96 rounded-xl p-4 backdrop-blur-2xl shadow-2xl z-40 pointer-events-auto border animate-in fade-in slide-in-from-top-2 duration-200 ${
        isDark
          ? 'bg-[#0a0f18]/95 border-[#1e2a3c] text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.6)]'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_12px_40px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Popover Header */}
      <div className={`flex items-center justify-between pb-2.5 mb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              vehicle.status === 'fault'
                ? 'bg-rose-500 animate-pulse'
                : vehicle.status === 'warning'
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <h4 className="font-mono text-xs font-bold tracking-wider uppercase">
            FLIGHT SYSTEMS STATUS SUMMARY
          </h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* System Health Score Bar */}
      <div className={`p-3 rounded-lg border mb-3 ${isDark ? 'bg-[#060a12]/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between font-mono text-xs mb-1.5">
          <span className="text-slate-400">VEHICLE HEALTH:</span>
          <span
            className={`font-bold ${
              vehicle.healthScore > 85
                ? 'text-emerald-400'
                : vehicle.healthScore > 65
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {vehicle.healthScore}% ({vehicle.status.toUpperCase()})
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              vehicle.healthScore > 85
                ? 'bg-emerald-500'
                : vehicle.healthScore > 65
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${vehicle.healthScore}%` }}
          />
        </div>
      </div>

      {/* Boards Summary Counts */}
      <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs mb-3">
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="text-lg font-bold">{faultsCount}</div>
          <div className="text-[10px] uppercase text-rose-400">Confirmed</div>
        </div>
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-amber-950/20 border-amber-900/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <div className="text-lg font-bold">{warningsCount}</div>
          <div className="text-[10px] uppercase text-amber-400">Anomalies</div>
        </div>
        <div className={`p-2 rounded-lg border ${isDark ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
          <div className="text-lg font-bold">{nominalCount}</div>
          <div className="text-[10px] uppercase text-emerald-400">Nominal</div>
        </div>
      </div>

      {/* Integration Connections */}
      <div className={`p-2.5 rounded-lg border font-mono text-[11px] space-y-1.5 mb-3.5 ${isDark ? 'bg-[#060a12]/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">HARDWARE LINK:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            VIRTUAL CAN BUS (10ms)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">ML INFERENCE ENGINE:</span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            ONNX RUNTIME (ONLINE)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">STIMULUS PROTOCOL:</span>
          <span className={isTesting ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
            {isTesting ? `RUNNING (${testProgress}%)` : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="space-y-1.5">
        {isTesting ? (
          <button
            onClick={() => stopLiveTest()}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>ABORT ACTIVE TEST</span>
          </button>
        ) : (
          <button
            onClick={() => {
              startLiveTest(selectedBoardId, selectedComponentId);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>START THERMAL PULSE TEST</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setCurrentTab('faults');
              onClose();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-mono text-xs transition-colors cursor-pointer border ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>ML FAULTS</span>
          </button>

          <button
            onClick={() => {
              onOpenReport();
              onClose();
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg font-mono text-xs transition-colors cursor-pointer border ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-black'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
