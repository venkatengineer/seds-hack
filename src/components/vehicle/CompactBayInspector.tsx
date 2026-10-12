import React from 'react';
import { BoardItem } from '../../types/vehicle';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ChevronRight,
  ArrowLeft,
  X,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  Zap,
  Cpu,
  Layers,
  Terminal,
  Compass,
  Crosshair,
  TrendingUp,
} from 'lucide-react';

interface CompactBayInspectorProps {
  board: BoardItem;
  onInspectBoard: (boardId: string) => void;
  onFocusBoard?: () => void;
  onOpenTerminal?: () => void;
  onClose: () => void;
  inspectionMode?: 'exterior' | 'cutaway' | 'exploded';
  onToggleCutaway?: () => void;
}

export const CompactBayInspector: React.FC<CompactBayInspectorProps> = ({
  board,
  onInspectBoard,
  onFocusBoard,
  onOpenTerminal,
  onClose,
  inspectionMode,
  onToggleCutaway,
}) => {
  const { isDark } = useTheme();
  const { subsystems, physicalAssemblies, getBoardComponents, setCurrentTab } = useSystem();

  // Resolve hierarchy entities
  const subsystem = subsystems.find(s => s.id === board.subsystemId);
  const assembly = physicalAssemblies.find(a => a.id === board.physicalAssemblyId);
  const boardComponents = getBoardComponents(board.id);
  const faultyComp = boardComponents.find(c => c.status === 'fault');

  const isFault = board.status === 'fault';
  const isWarning = board.status === 'warning';

  return (
    <div
      className={`fixed sm:absolute bottom-0 sm:bottom-auto sm:top-20 right-0 sm:right-6 left-0 sm:left-auto w-full sm:w-84 md:w-88 rounded-t-2xl sm:rounded-xl p-4 backdrop-blur-2xl shadow-2xl z-40 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-6 sm:slide-in-from-right-6 duration-250 border max-h-[75vh] sm:max-h-[calc(100vh-140px)] overflow-y-auto ${
        isDark
          ? 'bg-[#0a0f18]/95 border-[#1e2a3c] text-slate-100 shadow-[0_16px_50px_rgba(0,0,0,0.7)]'
          : 'bg-white/95 border-slate-200 text-slate-900 shadow-[0_16px_50px_rgba(0,0,0,0.14)]'
      }`}
    >
      {/* Mobile Drawer Handle Pill */}
      <div className="w-12 h-1 bg-slate-600/40 rounded-full mx-auto mb-2.5 sm:hidden" />

      {/* 6-Tier Hierarchy Breadcrumb Track */}
      <div className={`pb-2 mb-2.5 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-slate-400 overflow-x-auto whitespace-nowrap pb-0.5">
          <span className="text-cyan-500 font-bold">ORION-IX</span>
          <ChevronRight className="w-2.5 h-2.5 opacity-50 shrink-0" />
          <span className="truncate max-w-[85px]" title={subsystem?.name || board.subsystemId}>
            {subsystem ? subsystem.name.split(' ')[0] : board.subsystemId}
          </span>
          <ChevronRight className="w-2.5 h-2.5 opacity-50 shrink-0" />
          <span className="truncate max-w-[85px]" title={assembly?.name || board.physicalAssemblyId}>
            {assembly ? assembly.name.split(' ')[0] : board.physicalAssemblyId}
          </span>
          <ChevronRight className="w-2.5 h-2.5 opacity-50 shrink-0" />
          <span className="text-slate-200 font-semibold">{board.id}</span>
        </div>

        {/* Top Header: Bay Designation & Close Button */}
        <div className="flex items-start justify-between gap-3 mt-1.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400">{board.id}</span>
              <span className="text-slate-500">•</span>
              <span className="font-mono text-[11px] text-slate-400">{board.slot.bayName}</span>
            </div>
            <h3 className="text-sm font-semibold tracking-tight mt-0.5 leading-snug">
              {board.name}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isFault
                  ? isDark
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                  : isWarning
                  ? isDark
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                  : isDark
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {board.status}
            </span>
            <button
              onClick={onClose}
              title="Deselect Bay and Return to Full View"
              className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Structural Airframe Mounting Data */}
      <div
        className={`p-2 rounded-lg border font-mono text-[10px] mb-2.5 flex items-center justify-between ${
          isDark ? 'bg-[#060a12]/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-cyan-500" />
          <span>STA: {board.mountingLocation.y > 0 ? '+' : ''}{board.mountingLocation.y.toFixed(2)}m</span>
        </div>
        <div>AZ: {board.mountingLocation.azimuthDeg}°</div>
        <div className="uppercase tracking-wider text-slate-400">
          {board.mountingLocation.enclosureType.replace('_', ' ')}
        </div>
      </div>

      {/* Sensor Measurements & Expected Baseline Envelope */}
      <div
        className={`p-2.5 rounded-lg border font-mono text-[10px] mb-2.5 space-y-1.5 ${
          isDark ? 'bg-[#060a12]/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-700/30">
          <span className="font-semibold text-cyan-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            LATEST MEASUREMENT
          </span>
          <span>EXPECTED BASELINE</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Thermometer className="w-3 h-3 text-cyan-400" />
            <span>TEMP: <strong className={isFault ? 'text-rose-400' : 'text-slate-100'}>{board.temperatureCelsius.toFixed(1)}°C</strong></span>
          </div>
          <span className="text-slate-400">38.0°C – 44.0°C</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>V_RAIL: <strong className={isWarning ? 'text-amber-400' : 'text-slate-100'}>{board.voltageRailV.toFixed(2)}V</strong></span>
          </div>
          <span className="text-slate-400">3.20V – 3.40V</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>CHANNELS: <strong>{board.monitoredSensorsCount} CH</strong></span>
          </div>
          <span className="text-slate-400">ADC 24-bit 100Hz</span>
        </div>
      </div>

      {/* Engineering Diagnostic Summary Snippet */}
      <div className="text-xs mb-3 leading-relaxed">
        {isFault ? (
          <div
            className={`p-2.5 rounded-lg border flex items-start gap-2 font-mono text-[11px] ${
              isDark
                ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">CRITICAL DEVIATION:</span> Secondary sensor TEMP-02 thermal recovery lag (+4.2s delay).
              <div className="text-[10px] text-rose-400 mt-1">
                ML Model: Confirmed Fault • 96.8% Confidence (Simulated)
              </div>
            </div>
          </div>
        ) : isWarning ? (
          <div
            className={`p-2.5 rounded-lg border flex items-start gap-2 font-mono text-[11px] ${
              isDark
                ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ANOMALY DETECTED:</span> Minor ripple elevation on auxiliary rail.
            </div>
          </div>
        ) : (
          <div
            className={`p-2.5 rounded-lg border flex items-start gap-2 font-mono text-[11px] ${
              isDark
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">ALL NOMINAL:</span> Transient stimulus response matches calibrated envelope.
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons: Inspect Board in 3D, Cutaway Toggle, Open PCB Explorer, Diagnostics */}
      <div className="space-y-1.5 font-mono">
        {onFocusBoard && (
          <button
            onClick={onFocusBoard}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>INSPECT BOARD (FRAME IN 3D)</span>
          </button>
        )}

        {onToggleCutaway && (
          <button
            onClick={onToggleCutaway}
            className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              inspectionMode === 'exterior'
                ? isDark
                  ? 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-700/60 text-cyan-300'
                  : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
                : isDark
                ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {inspectionMode === 'exterior' ? 'OPEN BAY CUTAWAY (LOOK INSIDE)' : 'RESTORE EXTERIOR HULL'}
            </span>
          </button>
        )}

        <button
          onClick={() => onInspectBoard(board.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all cursor-pointer shadow-[0_0_16px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] group"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>OPEN PCB EXPLORER</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform ml-auto" />
        </button>

        <button
          onClick={() => {
            if (onOpenTerminal) {
              onOpenTerminal();
            } else {
              setCurrentTab('terminal');
            }
          }}
          className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-900/80 hover:bg-slate-800 border-cyan-800/40 text-cyan-300 hover:border-cyan-600'
              : 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>OPEN DIAGNOSTICS (ML TERMINAL)</span>
          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>

        <button
          onClick={onClose}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer border ${
            isDark
              ? 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
              : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="w-3 h-3" />
          <span>DISMISS & RETURN TO FULL VIEW</span>
        </button>
      </div>
    </div>
  );
};
