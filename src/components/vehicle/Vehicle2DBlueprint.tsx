import React from 'react';
import { BoardItem } from '../../types/vehicle';
import { useTheme } from '../../context/ThemeContext';

interface Vehicle2DBlueprintProps {
  boards: BoardItem[];
  selectedBoardId: string;
  onSelectBoard: (boardId: string) => void;
  hoveredBoardId: string | null;
  setHoveredBoardId: (boardId: string | null) => void;
  onSwitchTo3D?: () => void;
}

export const Vehicle2DBlueprint: React.FC<Vehicle2DBlueprintProps> = ({
  boards,
  selectedBoardId,
  onSelectBoard,
  hoveredBoardId,
  setHoveredBoardId,
}) => {
  const { isDark } = useTheme();

  // Y-offsets for the 6 boards in the SVG coordinate frame (Rocket height 1000px, width 700px)
  const boardLayout = [
    { id: 'BRD-01', y: 240, bay: 'BAY-A1', sta: 'STA 240' },
    { id: 'BRD-02', y: 320, bay: 'BAY-A2', sta: 'STA 320' },
    { id: 'BRD-03', y: 400, bay: 'BAY-B1', sta: 'STA 400' }, // Sensor Interface Board (Critical)
    { id: 'BRD-04', y: 480, bay: 'BAY-C1', sta: 'STA 480' },
    { id: 'BRD-05', y: 560, bay: 'BAY-B2', sta: 'STA 560' },
    { id: 'BRD-06', y: 640, bay: 'BAY-D1', sta: 'STA 640' },
  ];

  const primaryLineColor = isDark ? '#334155' : '#94a3b8';
  const labelColor = isDark ? '#06b6d4' : '#0284c7';
  const mutedTextColor = isDark ? '#94a3b8' : '#475569';
  const cardFill = isDark ? '#0c111a' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#cbd5e1';

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-3 overflow-hidden select-none rounded-xl border ${
        isDark ? 'bg-[#070a10] border-slate-800 aerospace-grid-dark' : 'bg-[#f8fafc] border-slate-200 aerospace-grid-light'
      }`}
    >
      <svg
        viewBox="0 0 760 920"
        className="w-full h-full max-h-[820px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#121824' : '#cbd5e1'} />
            <stop offset="50%" stopColor={isDark ? '#1a2334' : '#e2e8f0'} />
            <stop offset="100%" stopColor={isDark ? '#0e141f' : '#94a3b8'} />
          </linearGradient>

          <linearGradient id="cutawayInteriorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? '#070b12' : '#ffffff'} stopOpacity="0.95" />
            <stop offset="100%" stopColor={isDark ? '#0a101b' : '#f1f5f9'} stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Technical Coordinate & Dimension Marks */}
        <g opacity={isDark ? '0.6' : '0.8'} className="font-mono text-[9px]" fill={labelColor}>
          <text x="35" y="35">SEDS-AERO // ORION-IX TECHNICAL ORTHOGRAPHIC BLUEPRINT</text>
          <text x="35" y="50">SYSTEM DATUM: CAD-REV 4.2 • SCALE: 1:20 [METRIC]</text>
          <line x1="25" y1="120" x2="25" y2="850" stroke={primaryLineColor} strokeDasharray="3,3" />
          <text x="30" y="140" transform="rotate(90 30,140)">LONGITUDINAL DATUM [Z+ 7.6m]</text>
          <line x1="120" y1="900" x2="640" y2="900" stroke={primaryLineColor} strokeDasharray="3,3" />
          <text x="380" y="915" textAnchor="middle">MAX ENVELOPE DIAMETER: Ø 1.88m</text>
        </g>

        {/* Centerline */}
        <line x1="380" y1="60" x2="380" y2="880" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="8,6" opacity="0.4" />

        {/* Station Callouts along Left Spine */}
        <g opacity="0.6" className="font-mono text-[8px]" fill={mutedTextColor} textAnchor="end">
          <text x="260" y="110">STA 0.0 (NOSE TIP)</text>
          <line x1="265" y1="110" x2="300" y2="110" stroke={primaryLineColor} strokeDasharray="2,2" />

          <text x="260" y="200">STA 200.0 (SEPARATION)</text>
          <line x1="265" y1="200" x2="300" y2="200" stroke={primaryLineColor} strokeDasharray="2,2" />

          <text x="260" y="720">STA 720.0 (INTERSTAGE)</text>
          <line x1="265" y1="720" x2="300" y2="720" stroke={primaryLineColor} strokeDasharray="2,2" />

          <text x="260" y="870">STA 870.0 (GIMBAL PLANE)</text>
          <line x1="265" y1="870" x2="300" y2="870" stroke={primaryLineColor} strokeDasharray="2,2" />
        </g>

        {/* Vehicle Aerodynamic Outer Shell Outline */}
        {/* Nose Cone */}
        <path
          d="M 380 70 Q 350 120 310 200 L 450 200 Q 410 120 380 70 Z"
          fill="url(#fuselageGrad)"
          stroke={primaryLineColor}
          strokeWidth="1.5"
        />
        {/* Nose Tip Probe */}
        <line x1="380" y1="35" x2="380" y2="70" stroke="#94a3b8" strokeWidth="2.5" />
        <circle cx="380" cy="35" r="3" fill="#06b6d4" />

        {/* Cutaway Hull Exterior Border */}
        <rect
          x="300"
          y="200"
          width="160"
          height="520"
          rx="4"
          fill="url(#cutawayInteriorGrad)"
          stroke={primaryLineColor}
          strokeWidth="1.5"
        />

        {/* Internal Avionics Bay Rack Spine Lines */}
        <line x1="320" y1="210" x2="320" y2="710" stroke={primaryLineColor} strokeWidth="1.5" />
        <line x1="440" y1="210" x2="440" y2="710" stroke={primaryLineColor} strokeWidth="1.5" />

        {/* Propulsion Section & Engine Bell */}
        <path
          d="M 300 720 L 290 810 L 470 810 L 460 720 Z"
          fill="url(#fuselageGrad)"
          stroke={primaryLineColor}
          strokeWidth="1.5"
        />
        <path
          d="M 320 810 L 280 870 L 480 870 L 440 810 Z"
          fill={isDark ? '#0f172a' : '#475569'}
          stroke={primaryLineColor}
          strokeWidth="1.5"
        />
        {/* Engine Bell Thermal Glow */}
        <ellipse cx="380" cy="870" rx="90" ry="12" fill="#0369a1" opacity="0.35" />

        {/* Aero Stabilizing Fins */}
        <polygon points="300,740 210,820 210,850 290,810" fill={isDark ? '#151d2a' : '#94a3b8'} stroke={primaryLineColor} strokeWidth="1.2" />
        <polygon points="460,740 550,820 550,850 470,810" fill={isDark ? '#151d2a' : '#94a3b8'} stroke={primaryLineColor} strokeWidth="1.2" />

        {/* Interactive Board Slots Inside Cutaway Bay */}
        {boardLayout.map((layoutItem, index) => {
          const board = boards.find(b => b.id === layoutItem.id);
          if (!board) return null;

          const isSelected = board.id === selectedBoardId;
          const isHovered = board.id === hoveredBoardId;

          // Status colors
          let statusFill = '#10b981'; // Green
          let statusBorder = '#059669';
          let statusBg = isDark ? '#062017' : '#ecfdf5';
          if (board.status === 'fault') {
            statusFill = '#ef4444'; // Red
            statusBorder = '#dc2626';
            statusBg = isDark ? '#280c10' : '#fef2f2';
          } else if (board.status === 'warning') {
            statusFill = '#f59e0b'; // Amber
            statusBorder = '#d97706';
            statusBg = isDark ? '#261908' : '#fffbeb';
          }

          const cardY = layoutItem.y;
          const isLeftExpanded = index % 2 === 0;

          return (
            <g
              key={board.id}
              onClick={() => onSelectBoard(board.id)}
              onMouseEnter={() => setHoveredBoardId(board.id)}
              onMouseLeave={() => setHoveredBoardId(null)}
              className="cursor-pointer transition-all duration-200"
            >
              {/* Leader Line to Technical Callout Box */}
              <line
                x1={isLeftExpanded ? 315 : 445}
                y1={cardY + 25}
                x2={isLeftExpanded ? 190 : 570}
                y2={cardY + 25}
                stroke={isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : primaryLineColor}
                strokeWidth={isSelected ? '2' : '1'}
                strokeDasharray={isSelected ? 'none' : '2,2'}
              />
              <circle
                cx={isLeftExpanded ? 315 : 445}
                cy={cardY + 25}
                r={isSelected ? '4' : '2.5'}
                fill={isSelected ? '#06b6d4' : '#64748b'}
              />

              {/* Board Card in Center Rack */}
              <rect
                x="315"
                y={cardY}
                width="130"
                height="50"
                rx="4"
                fill={isSelected ? (isDark ? '#0c2235' : '#e0f2fe') : isHovered ? (isDark ? '#131e2d' : '#f1f5f9') : statusBg}
                stroke={isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : statusBorder}
                strokeWidth={isSelected ? '2.5' : '1.2'}
                className="transition-all"
              />

              {/* Status LED on Board Card */}
              <circle
                cx="328"
                cy={cardY + 25}
                r="6"
                fill={statusFill}
                className={board.status === 'fault' ? 'animate-pulse' : ''}
              />

              {/* Board ID & Bay Name inside Rack Card */}
              <text
                x="342"
                y={cardY + 22}
                className="font-mono text-[10px] font-bold"
                fill={isDark ? '#ffffff' : '#0f172a'}
              >
                {board.id}
              </text>
              <text
                x="342"
                y={cardY + 36}
                className="font-mono text-[8px]"
                fill={mutedTextColor}
              >
                {layoutItem.bay}
              </text>

              {/* Technical Callout Box (Left or Right Wing) */}
              <g
                transform={`translate(${isLeftExpanded ? 50 : 520}, ${cardY})`}
                className="transition-transform"
              >
                <rect
                  x="0"
                  y="0"
                  width="185"
                  height="52"
                  rx="4"
                  fill={cardFill}
                  stroke={isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : cardBorder}
                  strokeWidth={isSelected ? '1.5' : '1'}
                />
                {/* Header text */}
                <text x="10" y="16" className="font-mono text-[9px] font-bold" fill={labelColor}>
                  [{layoutItem.bay}] {board.id}
                </text>
                {/* Status Badge */}
                <rect
                  x="120"
                  y="6"
                  width="55"
                  height="14"
                  rx="2"
                  fill={board.status === 'fault' ? (isDark ? '#450a0a' : '#fee2e2') : board.status === 'warning' ? (isDark ? '#451a03' : '#fef3c7') : (isDark ? '#052e16' : '#dcfce7')}
                  stroke={statusFill}
                  strokeWidth="0.8"
                />
                <text
                  x="147"
                  y="16"
                  textAnchor="middle"
                  className="font-mono text-[8px] font-semibold"
                  fill={statusFill}
                >
                  {board.status.toUpperCase()}
                </text>
                {/* Board Name */}
                <text x="10" y="32" className="text-[10px] font-medium" fill={isDark ? '#f1f5f9' : '#1e293b'}>
                  {board.name.length > 22 ? board.name.slice(0, 22) + '...' : board.name}
                </text>
                {/* Sensors & Telemetry snippet */}
                <text x="10" y="44" className="font-mono text-[8px]" fill={mutedTextColor}>
                  {board.monitoredSensorsCount} Channels • {board.temperatureCelsius.toFixed(1)}°C
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
