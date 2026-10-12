import React, { useState } from 'react';
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
  Grid,
  MoreHorizontal,
} from 'lucide-react';

interface MinimalControlDockProps {
  activeTabMode: '3d' | '2d';
  setActiveTabMode: (mode: '3d' | '2d') => void;
  inspectionMode: VehicleInspectionMode;
  setInspectionMode: (mode: VehicleInspectionMode) => void;
  autoRotate: boolean;
  setAutoRotate: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid?: boolean;
  setShowGrid?: React.Dispatch<React.SetStateAction<boolean>>;
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
  showGrid = true,
  setShowGrid,
  onFitVehicle,
  onResetCamera,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div
      className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full z-30 pointer-events-auto shadow-2xl backdrop-blur-xl transition-all duration-300 border font-mono select-none ${
        isDark
          ? 'bg-slate-950/80 border-slate-800 text-slate-200 shadow-black/50'
          : 'bg-white/90 border-slate-300 text-slate-800 shadow-slate-400/20'
      }`}
    >
      {/* ============================================================== */}
      {/* GROUP 1: VIEW (3D STAGE vs 2D BLUEPRINT)                      */}
      {/* ============================================================== */}
      <div
        className={`flex items-center gap-0.5 p-0.5 rounded-full ${
          isDark ? 'bg-slate-900/70' : 'bg-slate-100'
        }`}
      >
        <button
          onClick={() => setActiveTabMode('3d')}
          title="View Mode: 3D Spatial Stage"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeTabMode === '3d'
              ? isDark
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-semibold'
                : 'bg-white text-cyan-700 shadow-sm border border-slate-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden md:inline">3D STAGE</span>
        </button>

        <button
          onClick={() => setActiveTabMode('2d')}
          title="View Mode: 2D Orthographic Blueprint"
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            activeTabMode === '2d'
              ? isDark
                ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/60 shadow-[0_0_10px_rgba(6,182,212,0.3)] font-semibold'
                : 'bg-white text-cyan-700 shadow-sm border border-slate-300 font-semibold'
              : 'text-slate-400 hover:text-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">2D BLUEPRINT</span>
        </button>
      </div>

      {/* Divider */}
      {activeTabMode === '3d' && (
        <div className={`h-4 w-px ${isDark ? 'bg-slate-700/50' : 'bg-slate-300'}`} />
      )}

      {/* ============================================================== */}
      {/* GROUP 2: INSPECTION (EXTERIOR / CROSS-SECTION / CUTAWAY / EXPLODED) */}
      {/* ============================================================== */}
      {activeTabMode === '3d' && (
        <div className="flex items-center gap-1 text-[11px]">
          {([
            { id: 'exterior', label: 'Exterior' },
            { id: 'cross-section', label: 'Cross-Section' },
            { id: 'cutaway', label: 'Cutaway' },
            { id: 'exploded', label: 'Exploded' },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setInspectionMode(id)}
              title={`Inspection Mode: ${label}`}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                inspectionMode === id
                  ? isDark
                    ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-600/70 font-semibold shadow-inner'
                    : 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className={`h-4 w-px ${isDark ? 'bg-slate-700/50' : 'bg-slate-300'}`} />

      {/* ============================================================== */}
      {/* GROUP 3: CAMERA & APPEARANCE                                   */}
      {/* ============================================================== */}
      <div className="flex items-center gap-1">
        {activeTabMode === '3d' && (
          <>
            <button
              onClick={onFitVehicle}
              title="Fit Entire Vehicle in Viewport [F]"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60' : 'text-slate-600 hover:text-cyan-700 hover:bg-slate-100'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetCamera}
              title="Reset Camera Framing [R]"
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
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
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Rotate3d className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            </button>

            {setShowGrid && (
              <button
                onClick={() => setShowGrid(g => !g)}
                title={showGrid ? 'Hide CAD Engineering Ground Grid' : 'Show CAD Engineering Ground Grid'}
                className={`p-1.5 rounded-full transition-colors cursor-pointer hidden sm:block ${
                  showGrid
                    ? isDark
                      ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/50'
                      : 'text-cyan-700 bg-cyan-50 border border-cyan-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}

        {/* Light / Dark Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Lunar Studio (Light Theme)' : 'Switch to Orbital Graphite (Dark Theme)'}
          className={`p-1.5 rounded-full transition-colors cursor-pointer ml-0.5 ${
            isDark ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60' : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
          }`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
        </button>
      </div>
    </div>
  );
};
