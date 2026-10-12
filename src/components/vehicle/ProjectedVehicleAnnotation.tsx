import React from 'react';
import { BoardItem, SubsystemItem } from '../../types/vehicle';
import { Compass, Cpu, Layers } from 'lucide-react';

interface ProjectedVehicleAnnotationProps {
  anchor: {
    x: number;
    y: number;
    visible: boolean;
    boardId: string;
  };
  board: BoardItem;
  subsystem?: SubsystemItem;
  isDark: boolean;
}

export const ProjectedVehicleAnnotation: React.FC<ProjectedVehicleAnnotationProps> = ({
  anchor,
  board,
  subsystem,
  isDark,
}) => {
  if (!anchor.visible) return null;

  // Determine line orientation (point to left or right depending on anchor x)
  const isRightHalf = anchor.x > window.innerWidth * 0.5;
  const lineDeltaX = isRightHalf ? -65 : 65;
  const lineDeltaY = -40;
  const targetX = anchor.x + lineDeltaX;
  const targetY = anchor.y + lineDeltaY;

  const isFault = board.status === 'fault';
  const isWarning = board.status === 'warning';
  const accentColor = isFault ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4';

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-mono select-none overflow-hidden">
      {/* SVG Engineering Leader Line */}
      <svg className="w-full h-full absolute inset-0">
        <circle
          cx={anchor.x}
          cy={anchor.y}
          r="3.5"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
        />
        <circle cx={anchor.x} cy={anchor.y} r="1.5" fill={accentColor} />

        {/* Diagonal Leader Line */}
        <line
          x1={anchor.x}
          y1={anchor.y}
          x2={targetX}
          y2={targetY}
          stroke={isDark ? '#475569' : '#94a3b8'}
          strokeWidth="1"
          strokeDasharray="3 2"
        />

        {/* Horizontal Baseline Under Card */}
        <line
          x1={targetX}
          y1={targetY}
          x2={isRightHalf ? targetX - 140 : targetX + 140}
          y2={targetY}
          stroke={isDark ? '#475569' : '#94a3b8'}
          strokeWidth="1"
        />
      </svg>

      {/* Floating Callout Card Anchored to 3D Space */}
      <div
        className={`absolute rounded-lg p-2.5 backdrop-blur-xl border text-[10px] transition-transform duration-75 shadow-lg ${
          isRightHalf ? '-translate-x-full' : ''
        } -translate-y-full ${
          isDark
            ? 'bg-slate-950/85 border-slate-700/80 text-slate-300 shadow-black/50'
            : 'bg-white/90 border-slate-300 text-slate-800 shadow-slate-300/40'
        }`}
        style={{
          left: isRightHalf ? `${targetX - 8}px` : `${targetX + 8}px`,
          top: `${targetY - 6}px`,
        }}
      >
        <div className="flex items-center gap-1.5 font-bold mb-1 pb-1 border-b border-slate-700/40">
          <span style={{ color: accentColor }}>{board.id}</span>
          <span className="text-slate-500">•</span>
          <span className="truncate max-w-[140px] text-slate-200">{board.name}</span>
        </div>

        <div className="space-y-0.5 text-[9px] text-slate-400">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">SUB:</span>
            <span className="text-slate-300 font-semibold">{subsystem?.name || board.subsystemId}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">BAY:</span>
            <span>{board.slot.bayName}</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-400">
            <Compass className="w-2.5 h-2.5" />
            <span>STA: {board.mountingLocation.y > 0 ? '+' : ''}{board.mountingLocation.y.toFixed(2)}m · AZ 28°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
