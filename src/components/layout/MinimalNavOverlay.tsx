import React, { useEffect } from 'react';
import { useSystem, NavigationTab } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Rocket,
  Layers,
  Cpu,
  Activity,
  AlertOctagon,
  Terminal,
  Clock,
  Settings as SettingsIcon,
  X,
  FileText,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

interface MinimalNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReport: () => void;
}

export const MinimalNavOverlay: React.FC<MinimalNavOverlayProps> = ({
  isOpen,
  onClose,
  onOpenReport,
}) => {
  const { currentTab, setCurrentTab, vehicle, resetDemoState } = useSystem();
  const { isDark } = useTheme();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems: { id: NavigationTab; label: string; icon: React.FC<any>; description: string; badge?: string }[] = [
    {
      id: 'overview',
      label: 'Vehicle 3D Stage',
      icon: Rocket,
      description: 'Primary vehicle inspection stage with cutaway & exploded models',
    },
    {
      id: 'pcb',
      label: 'PCB Component Explorer',
      icon: Cpu,
      description: 'Orthographic board circuit traces & active sensor diagnostics',
      badge: vehicle.activeFaultsCount > 0 ? `${vehicle.activeFaultsCount} FAULT` : undefined,
    },
    {
      id: 'terminal',
      label: 'Live ML Diagnostic Terminal',
      icon: Terminal,
      description: 'Monospace event stream, edge ML evidence & real-time telemetry logs',
      badge: vehicle.activeFaultsCount > 0 ? 'LIVE EVENT' : undefined,
    },
    {
      id: 'telemetry',
      label: 'Live Telemetry & Stimulus',
      icon: Activity,
      description: 'Real-time thermal pulse waveforms & transient response curve analysis',
    },
    {
      id: 'faults',
      label: 'ML Fault Diagnostics',
      icon: AlertOctagon,
      description: 'Explainable neural network classification & confidence breakdown',
      badge: vehicle.activeFaultsCount > 0 ? 'CRITICAL' : undefined,
    },
    {
      id: 'topology',
      label: 'Vehicle Topology',
      icon: Layers,
      description: 'CAN / SpaceWire bus interconnection architecture',
    },
    {
      id: 'history',
      label: 'Verification Test History',
      icon: Clock,
      description: 'Historical pulse verification run logs & diagnostic events',
    },
    {
      id: 'settings',
      label: 'Platform Settings',
      icon: SettingsIcon,
      description: 'Hardware bus mock parameters & ML adapter thresholds',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel */}
      <div
        className={`relative z-10 w-full max-w-sm h-full flex flex-col backdrop-blur-2xl shadow-2xl p-6 border-r animate-in slide-in-from-left duration-250 ${
          isDark
            ? 'bg-[#090d15]/95 border-[#1c273a] text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between pb-5 mb-5 border-b border-slate-700/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <h2 className="font-mono text-sm font-bold tracking-wider">
                AERO-DIAG // FLIGHT SYSTEMS
              </h2>
            </div>
            <p className="font-mono text-[11px] text-slate-400 mt-1">
              VEHICLE: ORION-IX • BLOCK 2 AVIONICS
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left group ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-950/70 border border-cyan-700/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-cyan-50 border border-cyan-300 text-cyan-900 font-semibold'
                    : isDark
                    ? 'hover:bg-slate-900/60 text-slate-300 hover:text-white border border-transparent'
                    : 'hover:bg-slate-100 text-slate-700 hover:text-black border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isActive
                        ? isDark
                          ? 'bg-cyan-900/80 text-cyan-300'
                          : 'bg-cyan-200 text-cyan-800'
                        : isDark
                        ? 'bg-slate-800/80 text-slate-400 group-hover:text-cyan-400'
                        : 'bg-slate-200/80 text-slate-600 group-hover:text-cyan-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-mono text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-1">
                      {item.description}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700/50">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                      isActive ? 'opacity-100 text-cyan-400' : ''
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Drawer Bottom Actions: Report & Demo Reset */}
        <div className="pt-4 mt-4 border-t border-slate-700/30 space-y-2">
          <button
            onClick={() => {
              onOpenReport();
              onClose();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs font-semibold border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT VERIFICATION REPORT</span>
          </button>

          <button
            onClick={() => {
              resetDemoState();
              onClose();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
              isDark
                ? 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEMO FAULT SCENARIO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
