import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { Activity, Square, CheckCircle2, AlertTriangle, Zap, Play } from 'lucide-react';

export const SensorTestActivityBar: React.FC = () => {
  const {
    isTesting,
    pulsePhase,
    testProgress,
    elapsedTestTimeSeconds,
    startLiveTest,
    stopLiveTest,
    selectedBoardId,
    testRuns,
  } = useSystem();
  const { isDark } = useTheme();

  if (!isTesting) {
    return (
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto font-mono select-none">
        <button
          onClick={() => startLiveTest()}
          title="Trigger Active Thermal Stimulus Pulse & Run ML INT8 Fault Inference"
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-2xl text-xs font-semibold cursor-pointer transition-all duration-200 hover:scale-105 group ${
            isDark
              ? 'bg-slate-950/85 hover:bg-cyan-950/90 border-cyan-700/60 hover:border-cyan-400 text-cyan-300 shadow-[0_0_24px_rgba(6,182,212,0.3)]'
              : 'bg-white/95 hover:bg-cyan-50 border-cyan-400 hover:border-cyan-600 text-cyan-800 shadow-[0_8px_24px_rgba(6,182,212,0.2)]'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="tracking-wider">RUN FAULT STIMULUS TEST</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${
              isDark
                ? 'bg-cyan-950/80 border-cyan-800/60 text-cyan-400'
                : 'bg-cyan-100 border-cyan-300 text-cyan-900'
            }`}
          >
            INT8 ML
          </span>
        </button>
      </div>
    );
  }

  const currentRunId = testRuns.length > 0 ? `RUN ${(testRuns.length + 1).toString().padStart(4, '0')}` : 'RUN 0042';

  const phaseDescription: Record<string, string> = {
    ready: 'Initiating thermal pulse generator',
    stimulus: 'Applying controlled heat pulse (+25°C)',
    peak: 'Capturing peak transient inflection',
    recovery: 'Acquiring thermal decay response (TEMP-02)',
    inference: 'Evaluating INT8 anomaly model',
    complete: 'Test complete · Fault diagnostics generated',
  };

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto font-mono select-none animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-full border shadow-2xl backdrop-blur-2xl text-xs ${
          isDark
            ? 'bg-slate-950/85 border-cyan-700/60 text-slate-100 shadow-[0_0_24px_rgba(6,182,212,0.25)]'
            : 'bg-white/95 border-cyan-400 text-slate-900 shadow-[0_8px_24px_rgba(6,182,212,0.18)]'
        }`}
      >
        {/* Pulsing Stimulus Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
          </span>
          <span className="font-bold text-cyan-400">THERMAL TEST</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-semibold">{currentRunId}</span>
        </div>

        {/* Phase & Target */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-300 border-l border-slate-700/50 pl-3">
          <span className="text-cyan-300">{phaseDescription[pulsePhase] || 'Acquiring transient'}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400 font-bold">{selectedBoardId || 'BRD-03'}</span>
        </div>

        {/* Progress & Time */}
        <div className="flex items-center gap-2 pl-2 font-mono text-[11px]">
          <span className="text-cyan-400 font-bold">{testProgress}%</span>
          <span className="text-slate-400 text-[10px]">({elapsedTestTimeSeconds}s)</span>
        </div>

        {/* Abort Button */}
        <button
          onClick={stopLiveTest}
          title="Abort Active Thermal Test"
          className="ml-1 p-1 rounded-full text-rose-400 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
