import React, { useState, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  Thermometer,
  Zap,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export const LiveTelemetryHUDWidget: React.FC = () => {
  const { isTesting, testProgress, pulsePhase, selectBoardAndInspect, setCurrentTab, vehicle } = useSystem();
  const { isDark } = useTheme();
  const [isMinimized, setIsMinimized] = useState(false);

  // Simulated micro-jitter for live digital twin telemetry realism
  const [jitter, setJitter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setJitter((Math.random() - 0.5) * 0.08);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Compute live temperature based on whether active thermal test is running
  let currentTemp = 41.8 + jitter * 2;
  if (isTesting) {
    // Thermal pulse curve peaking at 66.4°C around 45% progress
    const pulseFactor = Math.sin((testProgress / 100) * Math.PI);
    currentTemp = 41.8 + pulseFactor * 24.6 + jitter * 3;
  }

  const busVoltage = (28.32 + jitter).toFixed(2);
  const busCurrent = (1.42 + jitter * 0.4).toFixed(2);
  const tempStr = currentTemp.toFixed(1);

  // Generate SVG sparkline points for real-time sensor wave
  const sparklinePoints = [
    [0, 24],
    [15, 23],
    [30, isTesting ? 14 : 22],
    [45, isTesting ? 4 : 24],
    [60, isTesting ? 7 : 23],
    [75, isTesting ? 16 : 22],
    [90, isTesting ? 21 : 24],
    [105, 23],
    [120, 24],
  ];
  const polylineStr = sparklinePoints.map(p => `${p[0]},${p[1]}`).join(' ');

  return (
    <div className="absolute bottom-20 right-6 z-20 pointer-events-auto font-mono select-none transition-all duration-300">
      {isMinimized ? (
        /* Collapsed Minimal HUD Pill */
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-xl border shadow-xl cursor-pointer transition-all hover:scale-102 ${
            isDark
              ? 'bg-slate-950/85 border-slate-800 text-slate-200 hover:border-cyan-600/70 shadow-black/50'
              : 'bg-white/90 border-slate-300 text-slate-800 hover:border-cyan-500 shadow-slate-300/30'
          }`}
          title="Expand Live Telemetry HUD"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-bold text-cyan-400">BUS TELEMETRY</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 text-[10px]">{busVoltage}V</span>
          <span className="text-slate-500">•</span>
          <span className={isTesting ? 'text-amber-400 font-bold' : 'text-slate-300'}>{tempStr}°C</span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      ) : (
        /* Expanded High-Tech Aerospace Telemetry Card */
        <div
          className={`w-72 rounded-xl p-3 backdrop-blur-2xl border shadow-2xl transition-all ${
            isDark
              ? 'bg-slate-950/90 border-slate-800/90 text-slate-200 shadow-black/70'
              : 'bg-white/95 border-slate-300 text-slate-800 shadow-slate-300/40'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-cyan-400">SPACEWIRE DOWNLINK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400">100 Hz</span>
              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize HUD"
                className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Telemetry Micro Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
            <div
              className={`p-2 rounded-lg border ${
                isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-[9px] mb-0.5">
                <span>V_MAIN</span>
                <Zap className="w-3 h-3 text-amber-400" />
              </div>
              <div className="font-bold text-slate-100 flex items-baseline gap-1">
                <span>{busVoltage}</span>
                <span className="text-[9px] font-normal text-slate-400">V DC</span>
              </div>
            </div>

            <div
              className={`p-2 rounded-lg border ${
                isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-[9px] mb-0.5">
                <span>TEMP (TEMP-02)</span>
                <Thermometer className="w-3 h-3 text-cyan-400" />
              </div>
              <div
                className={`font-bold flex items-baseline gap-1 ${
                  isTesting ? 'text-amber-400' : 'text-slate-100'
                }`}
              >
                <span>{tempStr}</span>
                <span className="text-[9px] font-normal text-slate-400">°C</span>
              </div>
            </div>
          </div>

          {/* Live Waveform Sparkline */}
          <div
            className={`p-2 rounded-lg border mb-2.5 ${
              isDark ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[9px] text-slate-400 mb-1">
              <span>SENSOR TRANSIENT PROFILE</span>
              <span className={isTesting ? 'text-cyan-400 animate-pulse font-bold' : 'text-slate-400'}>
                {isTesting ? `PULSE ${testProgress}%` : 'BASELINE 24-BIT'}
              </span>
            </div>
            <div className="h-7 w-full flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 120 28" className="w-full h-full">
                <defs>
                  <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,28 ${polylineStr} 120,28`}
                  fill="url(#sparklineGrad)"
                />
                <polyline
                  points={polylineStr}
                  fill="none"
                  stroke={isTesting ? '#38bdf8' : '#06b6d4'}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Active Diagnostic Status Strip */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>BRD-03 FAULT</span>
            </span>
            <button
              onClick={() => selectBoardAndInspect('BRD-03')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>INSPECT PCB</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
