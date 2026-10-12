import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { Clock, TrendingUp, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const DiagnosticTimeline: React.FC = () => {
  const { testRuns, selectedComponent } = useSystem();

  // Filter test runs for the selected component or show recent runs
  const componentRuns = testRuns.filter(
    r => r.componentId === selectedComponent?.id || r.componentRef === selectedComponent?.referenceDesignator
  );

  const displayRuns = componentRuns.length > 0 ? componentRuns : testRuns.slice(0, 5);

  return (
    <div className="bg-[#0a0e16] border border-[#1b2536] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[#172132] pb-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="font-semibold text-white uppercase tracking-wider">
            DIAGNOSTIC OCCURRENCE TIMELINE: {selectedComponent?.referenceDesignator}
          </h3>
        </div>
        <span className="text-[10px] text-slate-500">
          TREND: {selectedComponent?.status === 'fault' ? 'MONOTONIC DETERIORATION' : 'STABLE'}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1a2538]">
        {displayRuns.map((run, idx) => {
          const isFault = run.outcome === 'fault_confirmed';
          const isWarning = run.outcome === 'anomaly_detected';

          return (
            <div key={run.id} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-[#0a0e16] ${
                  isFault
                    ? 'bg-rose-500 animate-pulse'
                    : isWarning
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />

              <div className="p-3 rounded bg-[#0d131f] border border-[#1a2638] space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{run.id}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{run.timestamp.replace('T', ' ').replace('Z', ' UTC')}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isFault
                        ? 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                        : isWarning
                        ? 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                        : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                    }`}
                  >
                    {run.outcome.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[10px] font-mono text-slate-400 pt-1">
                  <div>
                    PEAK TEMP: <span className="text-slate-200">{run.peakTemperature.toFixed(1)}°C</span>
                  </div>
                  <div>
                    RECOVERY TIME: <span className="text-slate-200">{run.recoveryTimeSeconds}s</span>
                  </div>
                  {run.mlConfidence && (
                    <div>
                      CONFIDENCE: <span className="text-cyan-300">{(run.mlConfidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {run.anomalyCategory && (
                  <div className="text-[10px] font-mono text-rose-300/90 pt-0.5">
                    CLASSIFICATION: {run.anomalyCategory}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
