import React from 'react';
import { BoardItem } from '../../types/vehicle';
import {
  ExternalLink,
  Cpu,
  Thermometer,
  Zap,
  X,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface VehicleBayCardProps {
  board: BoardItem;
  onInspectBoard: (boardId: string) => void;
  onClose: () => void;
}

export const VehicleBayCard: React.FC<VehicleBayCardProps> = ({
  board,
  onInspectBoard,
  onClose,
}) => {
  return (
    <div className="absolute top-18 right-4 sm:w-92 bg-[#090e18]/95 border border-[#1e2a3c] rounded-lg p-4 backdrop-blur-md shadow-2xl z-20 pointer-events-auto transition-all animate-in fade-in slide-in-from-right-2 duration-300">
      {/* Header with Title, Status & Close button */}
      <div className="flex items-start justify-between gap-2 mb-2.5 border-b border-[#182234] pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="font-bold text-cyan-400">{board.id}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{board.slot.bayName}</span>
          </div>
          <h4 className="text-xs font-semibold text-white tracking-wide mt-0.5 truncate">
            {board.name}
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
              board.status === 'fault'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
                : board.status === 'warning'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
            }`}
          >
            {board.status}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Exit board inspection and return to full vehicle view"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Engineering Diagnostic Summary */}
      <div className="text-[11px] text-slate-300 mb-3 leading-relaxed">
        {board.status === 'fault' ? (
          <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-rose-200 text-[11px] font-mono flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span>CONFIRMED FAULT: Secondary sensor TEMP-02 thermal decay lag detected (+4.2s recovery delay).</span>
          </div>
        ) : board.status === 'warning' ? (
          <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px] font-mono flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>SUSPECTED ANOMALY: Minor supply rail ripple elevation on LDO VREG-02.</span>
          </div>
        ) : (
          <div className="p-2 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-200 text-[11px] font-mono flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>ALL NOMINAL: Transient response curves strictly within healthy calibrated envelope.</span>
          </div>
        )}
      </div>

      {/* Telemetry Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded bg-[#060910] border border-[#152030] font-mono text-[10px] mb-3">
        <div>
          <div className="text-slate-500 flex items-center gap-1">
            <Thermometer className="w-3 h-3 text-cyan-400" />
            <span>TEMP</span>
          </div>
          <div className="text-slate-200 font-semibold">{board.temperatureCelsius.toFixed(1)}°C</div>
        </div>
        <div>
          <div className="text-slate-500 flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>RAIL</span>
          </div>
          <div className="text-slate-200 font-semibold">{board.voltageRailV.toFixed(2)}V</div>
        </div>
        <div>
          <div className="text-slate-500 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>SENSORS</span>
          </div>
          <div className="text-slate-200 font-semibold">{board.monitoredSensorsCount} CH</div>
        </div>
      </div>

      {/* Action Buttons: Open PCB Explorer and Back to Vehicle */}
      <div className="space-y-1.5">
        <button
          onClick={() => onInspectBoard(board.id)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white transition-colors cursor-pointer group shadow-[0_0_12px_rgba(6,182,212,0.3)]"
        >
          <span>OPEN INTERACTIVE PCB EXPLORER</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded font-mono text-xs text-slate-400 hover:text-white bg-[#0e1420] hover:bg-[#141d2d] border border-[#1c283c] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>BACK TO FULL VEHICLE</span>
        </button>
      </div>
    </div>
  );
};
