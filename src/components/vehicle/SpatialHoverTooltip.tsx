import React from 'react';
import { BoardItem } from '../../types/vehicle';
import { AlertTriangle, CheckCircle2, Thermometer, Zap, Cpu, Compass } from 'lucide-react';

interface SpatialHoverTooltipProps {
  board: BoardItem;
  isDark: boolean;
}

export const SpatialHoverTooltip: React.FC<SpatialHoverTooltipProps> = ({ board, isDark }) => {
  const isFault = board.status === 'fault';
  const isWarning = board.status === 'warning';

  return (
    <div
      className={`absolute bottom-16 left-6 max-w-sm rounded-xl p-3 backdrop-blur-2xl border shadow-2xl pointer-events-none z-30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 font-mono ${
        isDark
          ? 'bg-[#0a0f18]/95 border-slate-700/80 text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.8)]'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_12px_40px_rgba(0,0,0,0.15)]'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-1.5 mb-1.5 border-b border-slate-700/40">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-cyan-400 text-xs">{board.id}</span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] font-semibold truncate max-w-[170px] text-slate-200">
            {board.name}
          </span>
        </div>

        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            isFault
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : isWarning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}
        >
          {board.status}
        </span>
      </div>

      {/* Bay designation & Structural Station */}
      <div className="text-[10px] text-slate-400 mb-2 flex items-center justify-between">
        <span>{board.slot.bayName}</span>
        <span className="text-cyan-400 flex items-center gap-1">
          <Compass className="w-3 h-3" />
          <span>STA: {board.mountingLocation.y > 0 ? '+' : ''}{board.mountingLocation.y.toFixed(2)}m</span>
        </span>
      </div>

      {/* Telemetry Micro-Grid */}
      <div
        className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-lg border text-[10px] mb-2 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-1">
          <Thermometer className="w-3 h-3 text-cyan-400" />
          <span>{board.temperatureCelsius.toFixed(1)}°C</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{board.voltageRailV.toFixed(2)}V</span>
        </div>
        <div className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-emerald-400" />
          <span>{board.monitoredSensorsCount} CH</span>
        </div>
      </div>

      {/* Status Description Snippet */}
      {isFault && (
        <div className="text-[10px] text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-800/40 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>Thermal recovery lag on TEMP-02 (ML 96.8% fault)</span>
        </div>
      )}

      {/* Click prompt */}
      <div className="text-[9px] text-cyan-400/80 flex items-center justify-between">
        <span>CLICK TO SELECT & INSPECT BAY</span>
        <span>MERIDIAN 28°</span>
      </div>
    </div>
  );
};
