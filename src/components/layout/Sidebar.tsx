import React from 'react';
import { useSystem, NavigationTab } from '../../context/SystemContext';
import {
  Rocket,
  GitFork,
  Cpu,
  LineChart,
  AlertOctagon,
  History,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentTab, setCurrentTab, vehicle } = useSystem();

  const navItems: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Mission Overview', icon: Rocket },
    { id: 'topology', label: 'Vehicle Topology', icon: GitFork },
    {
      id: 'pcb',
      label: 'Board Diagnostics',
      icon: Cpu,
      badgeCount: vehicle.activeFaultsCount,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    { id: 'telemetry', label: 'Live Telemetry', icon: LineChart },
    {
      id: 'faults',
      label: 'Fault Analysis',
      icon: AlertOctagon,
      badgeCount: vehicle.activeFaultsCount + vehicle.suspectedAnomaliesCount,
      badgeColor: vehicle.activeFaultsCount > 0 
        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
        : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    { id: 'history', label: 'Test History', icon: History },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`bg-[#0a0d14] border-r border-[#1c2433] flex flex-col justify-between transition-all duration-300 select-none z-20 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-14 border-b border-[#1c2433] px-3 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-mono font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                Δ
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-white tracking-wide leading-tight">
                  AEROSPACE DIAG
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  HEALTH TELEMETRY
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 mx-auto rounded bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-mono font-bold text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              Δ
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#141a28] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 shadow-[inset_0_1px_1px_rgba(6,182,212,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111724]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {!collapsed && (
                  <span className="flex-1 text-left truncate tracking-wide">{item.label}</span>
                )}
                {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold ${item.badgeColor}`}
                  >
                    {item.badgeCount}
                  </span>
                )}
                {collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Mission Status Footer */}
      {!collapsed ? (
        <div className="p-3 m-2 rounded bg-[#0d121c] border border-[#1a2334] text-[11px] font-mono">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">SYSTEM HEALTH</span>
            <span className={`font-semibold ${vehicle.status === 'fault' ? 'text-rose-400' : vehicle.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {vehicle.healthScore}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                vehicle.status === 'fault'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : vehicle.status === 'warning'
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${vehicle.healthScore}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
            <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">{vehicle.activeFaultsCount} FAULT / {vehicle.suspectedAnomaliesCount} ANOMALY</span>
          </div>
        </div>
      ) : (
        <div className="p-2 text-center font-mono text-[10px] text-slate-500">
          {vehicle.healthScore}%
        </div>
      )}
    </aside>
  );
};
