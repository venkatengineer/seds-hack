import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Wind,
  Layers,
  Camera,
  Compass,
  Sliders,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface BalloonDescentControlPanelProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  windSpeed: number;
  onWindSpeedChange: (speed: number) => void;
  windDirectionDeg: number;
  onWindDirectionChange: (dir: number) => void;
  isPumpingAir: boolean;
  onTogglePumping: () => void;
  autoCompensateWind: boolean;
  onToggleAutoCompensate: () => void;
  envelopeMode: 'cutaway' | 'solid' | 'wireframe';
  onEnvelopeModeChange: (mode: 'cutaway' | 'solid' | 'wireframe') => void;
  onSelectCameraPreset: (preset: 'overview' | 'ballonet' | 'bldc' | 'landing') => void;
  onJumpToPhase: (phaseIndex: number) => void;
}

export const BalloonDescentControlPanel: React.FC<BalloonDescentControlPanelProps> = ({
  isPlaying,
  onTogglePlay,
  onReset,
  windSpeed,
  onWindSpeedChange,
  windDirectionDeg,
  onWindDirectionChange,
  isPumpingAir,
  onTogglePumping,
  autoCompensateWind,
  onToggleAutoCompensate,
  envelopeMode,
  onEnvelopeModeChange,
  onSelectCameraPreset,
  onJumpToPhase,
}) => {
  return (
    <div className="w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-3 sm:p-4 text-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Playback & Phase Step Jumpers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Pause / Reset */}
          <button
            onClick={onTogglePlay}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>SIMULATE</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Reset to Initial Float Condition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Quick Phase Jump Buttons */}
          <div className="hidden sm:flex bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-[11px] font-mono">
            {[
              { id: 0, label: '1. Float' },
              { id: 1, label: '2. Pump Air' },
              { id: 2, label: '3. Descent & Wind' },
              { id: 3, label: '4. Radar Flare' },
              { id: 4, label: '5. Touchdown' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onJumpToPhase(p.id)}
                className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Wind & Ballonet Air Pump Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Wind Speed Control */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Wind className="w-4 h-4 text-sky-400" />
            <span className="text-slate-400">WIND:</span>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={windSpeed}
              onChange={(e) => onWindSpeedChange(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded"
            />
            <span className="text-sky-300 font-bold w-12 text-right">{windSpeed.toFixed(1)} m/s</span>
          </div>

          {/* Wind Heading Direction Control */}
          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-400">DIR:</span>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={windDirectionDeg}
              onChange={(e) => onWindDirectionChange(parseInt(e.target.value))}
              className="w-20 accent-indigo-400 cursor-pointer h-1.5 bg-slate-700 rounded"
            />
            <span className="text-indigo-300 font-bold w-10 text-right">{windDirectionDeg}°</span>
          </div>

          {/* Ballonet Air Compressor Pump Toggle */}
          <button
            onClick={onTogglePumping}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              isPumpingAir
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isPumpingAir ? 'bg-amber-400 animate-ping' : 'bg-slate-600'}`} />
            <span>PUMP AIR BLADDER: {isPumpingAir ? 'ON' : 'OFF'}</span>
          </button>

          {/* BLDC Autopilot Drift Compensation Toggle */}
          <button
            onClick={onToggleAutoCompensate}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer ${
              autoCompensateWind
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-sky-400" />
            <span>BLDC AUTO-COMPENSATE: {autoCompensateWind ? 'ACTIVE' : 'OFF'}</span>
          </button>
        </div>

        {/* Right: Envelope Mode & Camera Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Envelope Cutaway / Solid / Wireframe */}
          <div className="flex bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-[11px] font-mono">
            {(['cutaway', 'solid', 'wireframe'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onEnvelopeModeChange(mode)}
                className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                  envelopeMode === mode
                    ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'cutaway' ? 'CUTAWAY (BALLONET)' : mode}
              </button>
            ))}
          </div>

          {/* Camera View Presets */}
          <div className="flex bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-[11px] font-mono">
            {[
              { id: 'overview', label: 'FULL' },
              { id: 'ballonet', label: 'BAG' },
              { id: 'bldc', label: 'BLDC' },
              { id: 'landing', label: 'GEAR' },
            ].map((cam) => (
              <button
                key={cam.id}
                onClick={() => onSelectCameraPreset(cam.id as any)}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={`Camera focus: ${cam.label}`}
              >
                {cam.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
