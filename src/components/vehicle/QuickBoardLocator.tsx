import React, { useState } from 'react';
import { BoardItem } from '../../types/vehicle';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Cpu, Crosshair } from 'lucide-react';

interface QuickBoardLocatorProps {
  boards: BoardItem[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
  hoveredBoardId: string | null;
  setHoveredBoardId: (boardId: string | null) => void;
  isDark: boolean;
}

export const QuickBoardLocator: React.FC<QuickBoardLocatorProps> = ({
  boards,
  selectedBoardId,
  onSelectBoard,
  hoveredBoardId,
  setHoveredBoardId,
  isDark,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Station height and bay mapping for ordered display from top to bottom
  const bayStationMap: Record<string, { sta: string; shortName: string }> = {
    'BRD-01': { sta: 'STA +2.85m', shortName: 'Nav Core' },
    'BRD-02': { sta: 'STA +2.50m', shortName: 'Flight Control' },
    'BRD-03': { sta: 'STA +2.15m', shortName: 'Sensor Interface' },
    'BRD-04': { sta: 'STA +1.80m', shortName: 'Telemetry & Comm' },
    'BRD-05': { sta: 'STA +1.45m', shortName: 'Power Management' },
    'BRD-06': { sta: 'STA +1.10m', shortName: 'Propulsion Controller' },
  };

  const faultCount = boards.filter(b => b.status === 'fault').length;
  const warningCount = boards.filter(b => b.status === 'warning').length;

  return (
    <div className="absolute top-6 left-6 z-30 pointer-events-auto font-mono select-none">
      {/* Collapsed Pill Button */}
      <button
        onClick={() => setIsOpen(open => !open)}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border transition-all cursor-pointer shadow-lg ${
          isDark
            ? 'bg-[#0a0f18]/90 border-slate-700/80 text-slate-200 hover:border-cyan-500/70 hover:bg-[#0f172a]'
            : 'bg-white/90 border-slate-200 text-slate-800 hover:border-cyan-500/50 hover:bg-slate-50'
        }`}
        title="Toggle Quick Avionics Bay Locator"
      >
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wider">AVIONICS BAYS ({boards.length})</span>
        </span>

        {faultCount > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span>{faultCount} FAULT</span>
          </span>
        )}

        {faultCount === 0 && warningCount > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{warningCount} WARN</span>
          </span>
        )}

        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {/* Expanded Dropdown Panel */}
      {isOpen && (
        <div
          className={`mt-2 w-80 rounded-xl p-3 backdrop-blur-2xl border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 ${
            isDark
              ? 'bg-[#0a0f18]/95 border-slate-700/80 text-slate-200 shadow-[0_16px_50px_rgba(0,0,0,0.8)]'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_16px_50px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Header Summary */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40 text-[10px] uppercase text-slate-400">
            <span>ORION-IX AVIONICS BAYS</span>
            <span className="text-cyan-400 font-semibold">6 MONITORED</span>
          </div>

          {/* Ordered Board List */}
          <div className="space-y-1">
            {boards.map(board => {
              const isSelected = board.id === selectedBoardId;
              const isHovered = board.id === hoveredBoardId;
              const meta = bayStationMap[board.id] || { sta: 'BAY', shortName: board.name };
              const isFault = board.status === 'fault';
              const isWarning = board.status === 'warning';

              return (
                <div
                  key={board.id}
                  onMouseEnter={() => setHoveredBoardId(board.id)}
                  onMouseLeave={() => setHoveredBoardId(null)}
                  onClick={() => {
                    if (isSelected) {
                      onSelectBoard(null);
                    } else {
                      onSelectBoard(board.id);
                    }
                  }}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all cursor-pointer border ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-semibold'
                      : isHovered
                      ? isDark
                        ? 'bg-slate-800/80 border-slate-600 text-slate-100'
                        : 'bg-slate-100 border-slate-300 text-slate-900'
                      : isDark
                      ? 'bg-slate-900/40 border-transparent text-slate-300 hover:bg-slate-800/50'
                      : 'bg-slate-50/70 border-transparent text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Status Pip */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isFault
                          ? 'bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse'
                          : isWarning
                          ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                          : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                      }`}
                    />

                    <div className="truncate">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-cyan-400">{board.id}</span>
                        <span className="text-[11px] truncate font-normal text-slate-300">
                          {meta.shortName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {board.slot.bayName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px] text-slate-400">
                    <div>{meta.sta}</div>
                    <div
                      className={`uppercase text-[9px] font-bold ${
                        isFault ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {board.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Guidance */}
          <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>CLICK TO FOCUS 3D CAMERA</span>
            </div>
            {selectedBoardId && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onSelectBoard(null);
                }}
                className="text-cyan-400 hover:underline cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
