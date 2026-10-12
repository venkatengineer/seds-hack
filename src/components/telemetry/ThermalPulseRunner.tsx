import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { PulsePhase } from '../../types/vehicle';
import {
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Cpu,
  ShieldAlert,
  Play,
  Square,
  AlertTriangle,
} from 'lucide-react';

export const ThermalPulseRunner: React.FC = () => {
  const {
    pulsePhase,
    isTesting,
    testProgress,
    elapsedTestTimeSeconds,
    startLiveTest,
    stopLiveTest,
    selectedBoard,
    selectedComponent,
    simulationNotice,
  } = useSystem();

  const stages: { id: PulsePhase; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'ready', label: '1. Ready', icon: Clock },
    { id: 'pulse_initiated', label: '2. Pulse Initiated', icon: Zap },
    { id: 'acquisition', label: '3. Data Acquisition', icon: Activity },
    { id: 'signal_processing', label: '4. DSP Filtering', icon: Activity },
    { id: 'ml_inference', label: '5. ML Inference', icon: Cpu },
    { id: 'diagnostic_result', label: '6. Diagnostics', icon: ShieldAlert },
    { id: 'completed', label: '7. Completed', icon: CheckCircle2 },
  ];

  const getStageStatus = (stageId: PulsePhase) => {
    const stageOrder: PulsePhase[] = [
      'ready',
      'pulse_initiated',
      'acquisition',
      'signal_processing',
      'ml_inference',
      'diagnostic_result',
      'completed',
    ];
    const currentIndex = stageOrder.indexOf(pulsePhase);
    const thisIndex = stageOrder.indexOf(stageId);

    if (thisIndex < currentIndex) return 'completed';
    if (thisIndex === currentIndex && isTesting) return 'active';
    if (thisIndex === currentIndex && pulsePhase === 'completed') return 'completed';
    return 'pending';
  };

  return (
    <div className="p-4 bg-[#0a0e16] border border-[#1b2536] rounded-lg space-y-4">
      {/* Top Banner: Notice & Hardware Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-amber-950/20 border border-amber-900/40 text-[11px] font-mono text-amber-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{simulationNotice}</span>
        </div>
        <div className="text-slate-400 text-[10px]">
          STIMULUS PROTOCOL: 250mA / 2.5s PULSE / 10s WINDOW
        </div>
      </div>

      {/* 7-Stage Progression Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-semibold text-white">TEST EXECUTION SEQUENCE:</span>
            <span className="text-cyan-400 font-mono">
              TARGET: {selectedComponent?.referenceDesignator} ({selectedBoard?.name})
            </span>
          </div>
          <div className="text-slate-400">
            ELAPSED: <span className="text-white font-bold">{elapsedTestTimeSeconds.toFixed(1)}s</span> / 10.0s ({testProgress}%)
          </div>
        </div>

        {/* Stage Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {stages.map(stage => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`p-2 rounded border text-center transition-all ${
                  status === 'active'
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse'
                    : status === 'completed'
                    ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-300'
                    : 'bg-[#070a10] border-[#182234] text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-mono text-[10px] font-semibold">
                  <Icon className="w-3 h-3" />
                  <span className="truncate">{stage.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continuous Progress Bar */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-150 ${
              isTesting ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${testProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
