import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { Radio, Cpu, ShieldCheck, AlertTriangle } from 'lucide-react';

export const MissionContextPanel: React.FC = () => {
  const { vehicle, isTesting, testRuns } = useSystem();
  const { isDark } = useTheme();

  // Determine current test state from actual execution lifecycle
  const testStateLabel = isTesting
    ? 'RUNNING'
    : testRuns.length > 0
    ? testRuns[0].outcome === 'fault_confirmed'
      ? 'COMPLETED (FAULT)'
      : 'COMPLETED (NOMINAL)'
    : 'IDLE';

  const testStateColor = isTesting
    ? 'text-cyan-400'
    : testRuns.length > 0 && testRuns[0].outcome === 'fault_confirmed'
    ? 'text-rose-400'
    : 'text-emerald-400';

  return (
    <div
      className={`absolute top-[72px] left-5 z-20 pointer-events-auto rounded-xl p-3 backdrop-blur-xl border font-mono select-none transition-all duration-200 shadow-xl w-60 sm:w-64 ${
        isDark
          ? 'bg-slate-950/75 border-slate-800/80 text-slate-300 shadow-black/40'
          : 'bg-white/85 border-slate-300 text-slate-700 shadow-slate-300/40'
      }`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40 text-[9px] uppercase tracking-wider text-slate-400">
        <span>MISSION CONTEXT</span>
        <span className="text-cyan-500 font-bold">TELEMETRY SYNC</span>
      </div>

      <div className="space-y-1.5 text-[11px]">
        {/* Vehicle Identifier */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px]">VEHICLE:</span>
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            {vehicle.id}
          </span>
        </div>

        {/* Current Test State */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px]">TEST STATE:</span>
          <span className={`font-semibold flex items-center gap-1.5 ${testStateColor}`}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isTesting
                  ? 'bg-cyan-400 animate-ping'
                  : testRuns.length > 0 && testRuns[0].outcome === 'fault_confirmed'
                  ? 'bg-rose-400'
                  : 'bg-emerald-400'
              }`}
            />
            {testStateLabel}
          </span>
        </div>

        {/* Hardware Connection */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px]">HARDWARE LINK:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
            <Radio className="w-3 h-3 text-emerald-400" />
            SIMULATED (CAN 10ms)
          </span>
        </div>

        {/* ML Inference Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px]">ML INFERENCE:</span>
          <span className="text-cyan-400 font-medium flex items-center gap-1 text-[10px]">
            <Cpu className="w-3 h-3 text-cyan-400" />
            READY (ONNX INT8)
          </span>
        </div>
      </div>
    </div>
  );
};
