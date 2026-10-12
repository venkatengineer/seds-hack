import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { BoardItem, ComponentItem, HealthStatus } from '../../types/vehicle';
import { PcbComponentInspector } from './PcbComponentInspector';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  AlertCircle,
  ShieldAlert,
  Info,
  ArrowLeft,
} from 'lucide-react';

export const PcbExplorer: React.FC = () => {
  const {
    boards,
    selectedBoardId,
    setSelectedBoardId,
    selectedComponentId,
    setSelectedComponentId,
    selectedBoard,
    selectedComponent,
    getBoardComponents,
    startLiveTest,
    setCurrentTab,
  } = useSystem();
  const { isDark } = useTheme();

  // Ensure a valid board is selected when opening PCB Explorer
  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[2]?.id || boards[0]?.id);
    }
  }, [selectedBoardId, boards, setSelectedBoardId]);

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | HealthStatus>('all');
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);

  const boardComponents = useMemo(() => {
    return getBoardComponents(selectedBoardId);
  }, [selectedBoardId, getBoardComponents]);

  const filteredComponents = useMemo(() => {
    return boardComponents.filter(c => {
      const matchesSearch =
        c.referenceDesignator.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [boardComponents, searchQuery, statusFilter]);

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(2.8, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, z - 0.25));
  const handleResetView = () => {
    setZoom(1.1);
    setPan({ x: 0, y: 0 });
  };

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.pcb-component-node')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom(z => Math.min(2.8, Math.max(0.6, z + delta)));
  };

  return (
    <div className="w-full h-full flex flex-col gap-3">
      {/* Top PCB Control Header */}
      <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200 shadow-sm'}`}>
        {/* Back to Vehicle Stage & Board Switcher Dropdown */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentTab('overview')}
            title="Return to 3D Vehicle Stage"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-500 font-mono text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">VEHICLE STAGE</span>
          </button>

          <span className="text-slate-500 hidden sm:inline">|</span>

          <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">BOARD:</label>
          <div className="relative">
            <select
              value={selectedBoardId}
              onChange={e => {
                setSelectedBoardId(e.target.value);
                const comps = getBoardComponents(e.target.value);
                if (comps.length > 0) setSelectedComponentId(comps[0].id);
              }}
              className={`appearance-none border font-mono text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer ${
                isDark ? 'bg-[#0e1420] border-[#223048] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {boards.map(b => (
                <option key={b.id} value={b.id}>
                  [{b.id}] {b.name} — {b.status.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              selectedBoard?.status === 'fault'
                ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
                : selectedBoard?.status === 'warning'
                ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
            }`}
          >
            {selectedBoard?.status}
          </span>
        </div>

        {/* Center Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search component (e.g. TEMP-02, U1)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`border text-xs font-mono pl-8 pr-3 py-1 rounded-lg placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-52 sm:w-64 ${
                isDark ? 'bg-[#0e1420] border-[#223048] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className={`flex items-center gap-1 border p-0.5 rounded-lg text-[10px] font-mono ${
            isDark ? 'bg-[#0e1420] border-[#223048]' : 'bg-slate-100 border-slate-200'
          }`}>
            {(['all', 'healthy', 'warning', 'fault'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2 py-0.5 rounded transition-colors uppercase ${
                  statusFilter === f
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className={`flex items-center gap-1 border p-1 rounded-lg font-mono text-xs ${
          isDark ? 'bg-[#0e1420] border-[#223048]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-slate-500 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleResetView}
            title="Reset Zoom & Pan"
            className="p-1 text-slate-400 hover:text-cyan-400 rounded transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main PCB Explorer Split View */}
      <div className="flex-1 flex flex-col xl:flex-row gap-3 min-h-[580px] overflow-hidden">
        {/* Left: Interactive PCB Canvas */}
        <div
          className={`flex-1 rounded-xl border relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${
            isDark ? 'bg-[#07090e] border-[#1b2536]' : 'bg-[#e9edf3] border-slate-300'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Subtle PCB Substrate Backdrop Grid */}
          <div className="absolute inset-0 aerospace-grid opacity-30 pointer-events-none" />

          {/* Coordinate Scale Callout in corner */}
          <div className={`absolute top-3 left-3 font-mono text-[10px] p-2 rounded-lg border z-10 pointer-events-none backdrop-blur-md ${
            isDark ? 'text-slate-400 bg-[#090d15]/85 border-[#172132]' : 'text-slate-600 bg-white/85 border-slate-300'
          }`}>
            <div>BOARD: {selectedBoard?.name}</div>
            <div>DIMS: {selectedBoard?.dimensionsMm.width}mm × {selectedBoard?.dimensionsMm.height}mm ({selectedBoard?.layersCount} LAYERS)</div>
            <div>REVISION: {selectedBoard?.revision} • SIMULATED PLACEMENT</div>
          </div>

          {/* PCB Board Render Container */}
          <div
            className="transition-transform duration-75 origin-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            {/* SVG PCB Board with copper traces, silk screen, and components */}
            <svg
              width="620"
              height="400"
              viewBox="0 0 620 400"
              className="drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Dark solder mask substrate gradient */}
                <linearGradient id="pcbSubstrateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0d1b15" />
                  <stop offset="50%" stopColor="#0a1510" />
                  <stop offset="100%" stopColor="#070f0c" />
                </linearGradient>

                {/* Copper trace stroke color */}
                <linearGradient id="copperTraceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#b45309" />
                  <stop offset="50%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>

              {/* 1. PCB Substrate FR4 Board */}
              <rect
                x="10"
                y="10"
                width="600"
                height="380"
                rx="14"
                fill="url(#pcbSubstrateGrad)"
                stroke="#1f3d2d"
                strokeWidth="2.5"
              />

              {/* Corner Mounting Holes with Gold Pad Washers */}
              {[
                { cx: 30, cy: 30 },
                { cx: 590, cy: 30 },
                { cx: 30, cy: 370 },
                { cx: 590, cy: 370 },
              ].map((hole, i) => (
                <g key={i}>
                  <circle cx={hole.cx} cy={hole.cy} r="12" fill="#ca8a04" opacity="0.6" />
                  <circle cx={hole.cx} cy={hole.cy} r="7" fill="#040608" stroke="#ca8a04" strokeWidth="1.5" />
                </g>
              ))}

              {/* Fiducial Optical Alignment Marks */}
              {[
                { cx: 50, cy: 360 },
                { cx: 570, cy: 50 },
              ].map((fid, i) => (
                <g key={i}>
                  <circle cx={fid.cx} cy={fid.cy} r="4" fill="#ca8a04" />
                  <circle cx={fid.cx} cy={fid.cy} r="7" fill="none" stroke="#22c55e" strokeWidth="0.8" />
                </g>
              ))}

              {/* 2. Copper Traces Routing Network (Realistic 45-degree aerospace PCB traces) */}
              <g stroke="url(#copperTraceGrad)" strokeWidth="1.8" fill="none" opacity="0.75">
                <path d="M 60 90 L 120 90 L 150 60 L 250 60" />
                <path d="M 120 90 L 120 180 L 170 230 L 320 230" />
                <path d="M 80 180 L 130 180 L 160 150 L 280 150 L 320 190" />
                <path d="M 280 150 L 340 90 L 420 90 L 460 130 L 520 130" />
                <path d="M 220 280 L 260 240 L 380 240 L 440 300 L 540 300" />
                <path d="M 150 290 L 190 250 L 260 250" />
                <path d="M 380 140 L 410 170 L 480 170 L 510 200" />
                <path d="M 200 120 L 220 100 L 300 100" />
              </g>

              {/* Ground vias array (small gold plated holes) */}
              {[
                { cx: 110, cy: 110 }, { cx: 130, cy: 130 }, { cx: 210, cy: 45 },
                { cx: 310, cy: 75 }, { cx: 400, cy: 120 }, { cx: 470, cy: 220 },
                { cx: 270, cy: 290 }, { cx: 350, cy: 310 }, { cx: 500, cy: 330 },
              ].map((via, i) => (
                <circle key={i} cx={via.cx} cy={via.cy} r="2.2" fill="#040608" stroke="#ca8a04" strokeWidth="1" />
              ))}

              {/* 3. Silkscreen Labels & Outlines */}
              <g fill="#94a3b8" opacity="0.6" className="font-mono text-[9px]">
                <text x="35" y="60">AERO-TEST-BAY // SENSOR FRONT-END</text>
                <text x="35" y="72">REVISION: {selectedBoard?.revision}</text>
                <text x="470" y="370">LAYER 1/8 [TOP SIG]</text>
              </g>

              {/* 4. Active Components Footprints */}
              {filteredComponents.map(comp => {
                const isSelected = comp.id === selectedComponentId;
                const isHovered = comp.id === hoveredCompId;
                const { x, y, width, height } = comp.pcbPosition;

                // Scale up coordinates to fit 600x380 SVG canvas comfortably
                const cx = x * 1.55 + 20;
                const cy = y * 1.35 + 20;
                const cw = width * 1.4;
                const ch = height * 1.4;

                // Status marker colors
                let statusColor = '#10b981'; // Green
                let statusHalo = 'rgba(16, 185, 129, 0.4)';
                if (comp.status === 'fault') {
                  statusColor = '#ef4444'; // Red
                  statusHalo = 'rgba(239, 68, 68, 0.7)';
                } else if (comp.status === 'warning') {
                  statusColor = '#f59e0b'; // Amber
                  statusHalo = 'rgba(245, 158, 11, 0.6)';
                }

                return (
                  <g
                    key={comp.id}
                    className="pcb-component-node cursor-pointer transition-transform"
                    onClick={() => setSelectedComponentId(comp.id)}
                    onMouseEnter={() => setHoveredCompId(comp.id)}
                    onMouseLeave={() => setHoveredCompId(null)}
                  >
                    {/* Selection / Hover Glow Ring */}
                    {(isSelected || isHovered || comp.status === 'fault') && (
                      <rect
                        x={cx - 6}
                        y={cy - 6}
                        width={cw + 12}
                        height={ch + 12}
                        rx="6"
                        fill="none"
                        stroke={isSelected ? '#06b6d4' : isHovered ? '#38bdf8' : statusColor}
                        strokeWidth={isSelected ? '2.5' : '1.8'}
                        strokeDasharray={isSelected ? 'none' : '4,2'}
                        className={comp.status === 'fault' ? 'animate-pulse' : ''}
                      />
                    )}

                    {/* IC Body Packaging */}
                    <rect
                      x={cx}
                      y={cy}
                      width={cw}
                      height={ch}
                      rx="3"
                      fill="#121824"
                      stroke={isSelected ? '#06b6d4' : '#2b394e'}
                      strokeWidth="1.2"
                    />

                    {/* Pin 1 orientation index dot */}
                    <circle cx={cx + 6} cy={cy + 6} r="2" fill="#64748b" />

                    {/* Solder lead pins along top & bottom edges */}
                    {Array.from({ length: Math.min(8, Math.floor(cw / 8)) }).map((_, pi) => (
                      <g key={pi}>
                        <rect x={cx + 6 + pi * 8} y={cy - 4} width="4" height="4" fill="#ca8a04" rx="0.5" />
                        <rect x={cx + 6 + pi * 8} y={cy + ch} width="4" height="4" fill="#ca8a04" rx="0.5" />
                      </g>
                    ))}

                    {/* Component Reference Designator (e.g. TEMP-02, U1) */}
                    <text
                      x={cx + cw / 2}
                      y={cy + ch / 2 + 3}
                      textAnchor="middle"
                      className="font-mono text-[9px] font-bold fill-white select-none pointer-events-none"
                    >
                      {comp.referenceDesignator}
                    </text>

                    {/* Health Status Indicator Badge Dot on component */}
                    <circle
                      cx={cx + cw - 6}
                      cy={cy + 6}
                      r="4"
                      fill={statusColor}
                      className={comp.status === 'fault' ? 'animate-pulse' : ''}
                    />

                    {/* If fault, clear text warning pill */}
                    {comp.status === 'fault' && (
                      <g transform={`translate(${cx + cw / 2 - 24}, ${cy + ch + 8})`}>
                        <rect width="48" height="12" rx="2" fill="#ef4444" />
                        <text
                          x="24"
                          y="9"
                          textAnchor="middle"
                          className="font-mono text-[8px] font-bold fill-white"
                        >
                          FAULT
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom PCB Legend */}
          <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 bg-[#0a0f18]/90 border border-[#1b2536] p-2 rounded text-[10px] font-mono z-10">
            <span className="text-slate-500 font-semibold uppercase">COMPONENT STATUS:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300">HEALTHY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300">SUSPECTED ANOMALY</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-300 font-semibold">CONFIRMED FAULT</span>
            </div>
          </div>
        </div>

        {/* Right: Component Inspector Panel */}
        {selectedComponent && selectedBoard && (
          <PcbComponentInspector
            component={selectedComponent}
            board={selectedBoard}
            onRunTest={(bId, cId) => {
              startLiveTest(bId, cId);
              setCurrentTab('telemetry');
            }}
            onViewFaultAnalysis={() => setCurrentTab('faults')}
          />
        )}
      </div>
    </div>
  );
};
