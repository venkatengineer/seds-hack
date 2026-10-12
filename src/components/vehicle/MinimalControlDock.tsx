import React from 'react';
import { VehicleInspectionMode } from './Vehicle3DCanvas';
import { useTheme } from '../../context/ThemeContext';
import {
  Layers,
  Box,
  Maximize2,
  RotateCcw,
  Rotate3d,
  Sun,
  Moon,
  Compass,
} from 'lucide-react';

interface MinimalControlDockProps {
  activeTabMode: '3d' | '2d';
  setActiveTabMode: (mode: '3d' | '2d') => void;
  inspectionMode: VehicleInspectionMode;
  setInspectionMode: (mode: VehicleInspectionMode) => void;
  autoRotate: boolean;
  setAutoRotate: React.Dispatch<React.SetStateAction<boolean>>;
  onFitVehicle: () => void;
  onResetCamera: () => void;
}

export const MinimalControlDock: React.FC<MinimalControlDockProps> = ({
  activeTabMode,
  setActiveTabMode,
  inspectionMode,
  setInspectionMode,
  autoRotate,
  setAutoRotate,
  onFitVehicle,
  onResetCamera,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full z-20 pointer-events-auto shadow-2xl backdrop-blur-xl transition-all duration-300 border border-slate-700/40 bg-slate-950/70 text-slate-200 data-[theme=light]:bg-white/80 data-[theme=light]:border-slate-300 data-[theme=light]:text-slate-700 data-[theme=light]:shadow-slate-400/20"
      data-theme={theme}
    >
      {/* 1. View Stage Toggle: 3D vs 2D */}
      <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-slate-900/60 data-[theme=light]:bg-slate-200/70" data-theme={theme}>
        <button
          onClick={() => setActiveTabMode('3d')}
          title="3D Spatial Stage"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
            activeTabMode === '3d'
              ? isDark
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white text-cyan-700 shadow-sm border border-slate-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100 data-[theme=light]:hover:text-slate-900'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D STAGE</span>
        </button>

        <button
          onClick={() => setActiveTabMode('2d')}
          title="2D Orthographic Blueprint"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
            activeTabMode === '2d'
              ? isDark
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-white text-cyan-700 shadow-sm border border-slate-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100 data-[theme=light]:hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">2D BLUEPRINT</span>
        </button>
      </div>

      {/* Divider */}
      {activeTabMode === '3d' && (
        <div className="h-4 w-px bg-slate-700/50 data-[theme=light]:bg-slate-300" data-theme={theme} />
      )}

      {/* 2. 3D Inspection Modes: Exterior / Cutaway / Exploded */}
      {activeTabMode === '3d' && (
        <div className="flex items-center gap-1 font-mono text-[11px]">
          {(['exterior', 'cutaway', 'exploded'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setInspectionMode(mode)}
              title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} Vehicle Inspection Mode`}
              className={`px-2.5 py-1 rounded-full capitalize transition-all cursor-pointer ${
                inspectionMode === mode
                  ? isDark
                    ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-600/70 font-semibold shadow-inner'
                    : 'bg-cyan-100/90 text-cyan-900 border border-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 data-[theme=light]:hover:text-slate-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-4 w-px bg-slate-700/50 data-[theme=light]:bg-slate-300" data-theme={theme} />

      {/* 3. Utility Tools: Fit, Reset, Auto-Orbit, Theme Toggle */}
      <div className="flex items-center gap-1">
        {activeTabMode === '3d' && (
          <>
            <button
              onClick={onFitVehicle}
              title="Fit Entire Vehicle in Viewport [F]"
              className="p-1.5 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 data-[theme=light]:hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetCamera}
              title="Reset Camera Framing [R]"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 data-[theme=light]:hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setAutoRotate(r => !r)}
              title={autoRotate ? 'Pause Turntable Auto-Rotation' : 'Start Turntable Presentation Orbit'}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                autoRotate
                  ? isDark
                    ? 'text-cyan-300 bg-cyan-950/80 border border-cyan-700/50'
                    : 'text-cyan-700 bg-cyan-100 border border-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 data-[theme=light]:hover:bg-slate-200'
              }`}
            >
              <Rotate3d className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>
          </>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Lunar Studio (Light Theme)' : 'Switch to Orbital Graphite (Dark Theme)'}
          className="p-1.5 rounded-full text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 data-[theme=light]:hover:bg-slate-200 transition-colors cursor-pointer ml-0.5"
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>
      </div>
    </div>
  );
};
