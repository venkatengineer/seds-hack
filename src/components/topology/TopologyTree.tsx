import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { HealthStatus, BoardItem, ComponentItem } from '../../types/vehicle';
import {
  GitFork,
  Rocket,
  Cpu,
  ChevronDown,
  ChevronRight,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Box,
  Terminal,
  Activity,
} from 'lucide-react';

export const TopologyTree: React.FC = () => {
  const {
    vehicle,
    subsystems,
    physicalAssemblies,
    boards,
    components,
    getBoardComponents,
    selectBoardAndInspect,
    selectComponentAndInspect,
    setCurrentTab,
    setSelectedBoardId,
  } = useSystem();
  const { isDark } = useTheme();

  const [statusFilter, setStatusFilter] = useState<'all' | HealthStatus>('all');
  const [expandedSubsystems, setExpandedSubsystems] = useState<Record<string, boolean>>({
    'SUB-03': true,
    'SUB-01': false,
    'SUB-02': false,
    'SUB-04': false,
    'SUB-05': false,
    'SUB-06': false,
  });
  const [expandedBoards, setExpandedBoards] = useState<Record<string, boolean>>({
    'BRD-03': true,
    'BRD-04': false,
    'BRD-01': false,
    'BRD-02': false,
    'BRD-05': false,
    'BRD-06': false,
  });

  const toggleSubsystem = (subId: string) => {
    setExpandedSubsystems(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const toggleBoard = (boardId: string) => {
    setExpandedBoards(prev => ({ ...prev, [boardId]: !prev[boardId] }));
  };

  const expandAll = () => {
    const allSubs: Record<string, boolean> = {};
    const allBoards: Record<string, boolean> = {};
    subsystems.forEach(s => { allSubs[s.id] = true; });
    boards.forEach(b => { allBoards[b.id] = true; });
    setExpandedSubsystems(allSubs);
    setExpandedBoards(allBoards);
  };

  const collapseAll = () => {
    setExpandedSubsystems({});
    setExpandedBoards({});
  };

  return (
    <div
      className={`border rounded-xl p-5 space-y-4 shadow-xl backdrop-blur-xl ${
        isDark
          ? 'bg-[#0a0f18]/90 border-[#1c273a] text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Filter Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <span>AEROSPACE ELECTRONICS TOPOLOGY HIERARCHY (6 TIERS)</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            ROCKET → SUBSYSTEMS → PHYSICAL ASSEMBLIES → AVIONICS BOARDS → SMT COMPONENTS → SENSOR CHANNELS
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 border p-0.5 rounded-lg text-[10px] font-mono ${
            isDark ? 'bg-[#0e1420] border-[#202d44]' : 'bg-slate-100 border-slate-300'
          }`}>
            {(['all', 'healthy', 'warning', 'fault'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2.5 py-1 rounded transition-colors uppercase cursor-pointer ${
                  statusFilter === f
                    ? 'bg-cyan-900/60 text-cyan-200 font-bold border border-cyan-700/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono">
            <button
              onClick={expandAll}
              className={`px-2.5 py-1 rounded border cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              EXPAND ALL
            </button>
            <button
              onClick={collapseAll}
              className={`px-2.5 py-1 rounded border cursor-pointer ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              COLLAPSE
            </button>
          </div>
        </div>
      </div>

      {/* Root Node: Vehicle (Level 1) */}
      <div className="space-y-4 font-mono text-xs">
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-lg ${
            isDark ? 'bg-[#0d1422] border-[#1e2a40]' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-600/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-wider text-cyan-400">{vehicle.id}</span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-xs">{vehicle.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">[LEVEL 1: ROOT LAUNCH VEHICLE]</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {subsystems.length} SUBSYSTEMS • {physicalAssemblies.length} PHYSICAL ENCLOSURES • {vehicle.totalBoardsMonitored} BAYS MONITORED • {vehicle.totalComponentsMonitored} SMT TARGETS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                vehicle.status === 'fault'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                  : vehicle.status === 'warning'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
              }`}
            >
              {vehicle.status} ({vehicle.healthScore}%)
            </span>
          </div>
        </div>

        {/* Tree Branch: Level 2 Subsystems */}
        <div className={`pl-6 space-y-4 relative before:absolute before:left-3 before:top-0 before:bottom-4 before:w-0.5 ${
          isDark ? 'before:bg-[#1a2538]' : 'before:bg-slate-300'
        }`}>
          {subsystems.map(subsystem => {
            const subBoards = boards.filter(b => b.subsystemId === subsystem.id);
            const subAssemblies = physicalAssemblies.filter(a => a.subsystemId === subsystem.id);

            // Filter check
            if (statusFilter !== 'all' && subsystem.status !== statusFilter) {
              const hasMatchingBoard = subBoards.some(b => b.status === statusFilter);
              if (!hasMatchingBoard) return null;
            }

            const isSubExpanded = expandedSubsystems[subsystem.id] ?? false;

            return (
              <div key={subsystem.id} className="space-y-2 relative">
                {/* Horizontal branch line from vertical spine */}
                <div className={`absolute -left-3 top-5 w-3 h-0.5 ${isDark ? 'bg-[#1a2538]' : 'bg-slate-300'}`} />

                {/* Subsystem Card Node (Level 2) */}
                <div
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                    isDark
                      ? 'bg-[#080d16] border-[#162234] hover:border-[#22334e]'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSubsystem(subsystem.id)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {isSubExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{subsystem.id}</span>
                        <span className="text-slate-500">/</span>
                        <span className="font-semibold">{subsystem.name}</span>
                        <span className="text-[10px] text-slate-400">[{subsystem.sectionName}]</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        STA: [{subsystem.axialYRange[0] > 0 ? '+' : ''}{subsystem.axialYRange[0].toFixed(1)}m to {subsystem.axialYRange[1] > 0 ? '+' : ''}{subsystem.axialYRange[1].toFixed(1)}m] • {subAssemblies.length} Physical Assemblies • {subBoards.length} Boards
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        subsystem.status === 'fault'
                          ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60'
                          : subsystem.status === 'warning'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                      }`}
                    >
                      {subsystem.status}
                    </span>
                  </div>
                </div>

                {/* Subsystem Children: Physical Assemblies & Boards (Level 3 & 4) */}
                {isSubExpanded && (
                  <div className={`pl-8 space-y-3 relative before:absolute before:left-4 before:top-0 before:bottom-3 before:w-0.5 ${
                    isDark ? 'before:bg-[#152030]' : 'before:bg-slate-200'
                  }`}>
                    {subBoards.map(board => {
                      const assembly = subAssemblies.find(a => a.id === board.physicalAssemblyId);
                      const boardComps = getBoardComponents(board.id);
                      const isBoardExpanded = expandedBoards[board.id] ?? false;

                      const filteredComps = boardComps.filter(c => {
                        if (statusFilter === 'all') return true;
                        return c.status === statusFilter;
                      });

                      return (
                        <div key={board.id} className="space-y-2 relative">
                          <div className={`absolute -left-4 top-5 w-4 h-0.5 ${isDark ? 'bg-[#152030]' : 'bg-slate-200'}`} />

                          {/* Board Card Node with Assembly Context (Levels 3 & 4) */}
                          <div
                            className={`p-3 rounded-lg border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                              isDark
                                ? 'bg-[#0a0e18] border-[#18263c] hover:border-[#223554]'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                onClick={() => toggleBoard(board.id)}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                {isBoardExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-cyan-300">{board.id}</span>
                                  <span className="text-slate-500">/</span>
                                  <span className="font-medium">{board.name}</span>
                                  {assembly && (
                                    <span className="text-[10px] text-amber-400/90 font-mono">
                                      [{assembly.name}]
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Mounting: STA {board.mountingLocation.y > 0 ? '+' : ''}{board.mountingLocation.y.toFixed(2)}m • Azimuth {board.mountingLocation.azimuthDeg}° • {board.mountingLocation.enclosureType.replace('_', ' ').toUpperCase()} • {boardComps.length} SMT ICs
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  board.status === 'fault'
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60'
                                    : board.status === 'warning'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                                }`}
                              >
                                {board.status}
                              </span>

                              <button
                                onClick={() => selectBoardAndInspect(board.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-[10px] transition-colors cursor-pointer"
                              >
                                <Cpu className="w-3 h-3" />
                                <span>PCB</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedBoardId(board.id);
                                  setCurrentTab('terminal');
                                }}
                                className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] transition-colors cursor-pointer ${
                                  isDark ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700'
                                }`}
                              >
                                <Terminal className="w-3 h-3 text-cyan-400" />
                                <span>LOGS</span>
                              </button>
                            </div>
                          </div>

                          {/* Nested SMT Components (Level 5) & Channels (Level 6) */}
                          {isBoardExpanded && (
                            <div className={`pl-8 space-y-1.5 relative before:absolute before:left-4 before:top-0 before:bottom-3 before:w-0.5 ${
                              isDark ? 'before:bg-[#121b2a]' : 'before:bg-slate-200'
                            }`}>
                              {filteredComps.length > 0 ? (
                                filteredComps.map(comp => (
                                  <div
                                    key={comp.id}
                                    onClick={() => selectComponentAndInspect(board.id, comp.id)}
                                    className={`relative p-2.5 rounded border flex flex-wrap items-center justify-between gap-2 text-[11px] cursor-pointer transition-colors group ${
                                      isDark
                                        ? 'bg-[#060a12] border-[#141e2e] hover:border-cyan-600/60'
                                        : 'bg-white border-slate-200 hover:border-cyan-500'
                                    }`}
                                  >
                                    <div className={`absolute -left-4 top-4 w-4 h-0.5 ${isDark ? 'bg-[#121b2a]' : 'bg-slate-200'}`} />

                                    <div className="flex items-center gap-2.5">
                                      <span className="font-bold group-hover:text-cyan-400 transition-colors">
                                        {comp.referenceDesignator}
                                      </span>
                                      <span className="text-slate-500 font-mono">({comp.packageType})</span>
                                      <span className="truncate max-w-xs">{comp.name}</span>
                                      <span className="text-[10px] text-cyan-500/80">
                                        [{comp.sensorChannels.length} CHANNELS: {comp.sensorChannels.map(c => c.name).join(', ')}]
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="text-slate-400 text-[10px]">
                                        {comp.latestMeasuredResponse.toFixed(1)} {comp.unit}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                          comp.status === 'fault'
                                            ? 'bg-rose-950/80 text-rose-300 border border-rose-600/60'
                                            : comp.status === 'warning'
                                            ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60'
                                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                                        }`}
                                      >
                                        {comp.status}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 text-slate-500 text-[10px] italic">
                                  No components matching filter "{statusFilter}".
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

