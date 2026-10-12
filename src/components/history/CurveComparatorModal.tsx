import React from 'react';
import { TestRunRecord } from '../../types/vehicle';
import { generateThermalPulseData } from '../../data/mockTelemetry';
import { LivePulseChart } from '../telemetry/LivePulseChart';
import { X, Layers, GitCompare, ArrowRight } from 'lucide-react';

interface CurveComparatorModalProps {
  selectedRun: TestRunRecord | null;
  onClose: () => void;
}

export const CurveComparatorModal: React.FC<CurveComparatorModalProps> = ({
  selectedRun,
  onClose,
}) => {
  if (!selectedRun) return null;

  // Generate curve for this historical run
  const behaviorMode = selectedRun.outcome === 'fault_confirmed'
    ? 'degraded_decay'
    : selectedRun.outcome === 'anomaly_detected'
    ? 'noisy'
    : 'healthy';

  const historicalCurve = generateThermalPulseData(behaviorMode, 25.0);
  const healthyBaselineCurve = generateThermalPulseData('healthy', 25.0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0b0f17] border border-[#1e2738] rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#1c2433] flex items-center justify-between bg-[#080b11]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              HISTORICAL TRANSIENT CURVE COMPARISON: {selectedRun.id}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comparison Header Meta */}
        <div className="p-4 bg-[#090d15] border-b border-[#182232] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
          <div>
            <span className="text-slate-500 uppercase">RUN ID:</span>
            <div className="text-white font-bold">{selectedRun.id}</div>
            <div className="text-slate-400 text-[10px]">{selectedRun.timestamp}</div>
          </div>
          <div>
            <span className="text-slate-500 uppercase">COMPONENT / BOARD:</span>
            <div className="text-cyan-300 font-bold">{selectedRun.componentRef}</div>
            <div className="text-slate-400 text-[10px]">{selectedRun.boardName}</div>
          </div>
          <div>
            <span className="text-slate-500 uppercase">OUTCOME:</span>
            <div className={`font-bold ${selectedRun.outcome === 'fault_confirmed' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {selectedRun.outcome.replace('_', ' ').toUpperCase()}
            </div>
            <div className="text-slate-400 text-[10px]">{selectedRun.anomalyCategory || 'Nominal'}</div>
          </div>
          <div>
            <span className="text-slate-500 uppercase">STABILITY TREND:</span>
            <div className="text-amber-300 font-bold uppercase">{selectedRun.stabilityTrend}</div>
            <div className="text-slate-400 text-[10px]">Peak {selectedRun.peakTemperature.toFixed(1)}°C</div>
          </div>
        </div>

        {/* Side-by-side or Overlaid charts */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="h-[360px]">
            <LivePulseChart
              data={historicalCurve}
              title={`HISTORICAL RUN [${selectedRun.id}] — TRANSIENT MEASUREMENT`}
              isLive={false}
            />
          </div>

          <div className="h-[320px]">
            <LivePulseChart
              data={healthyBaselineCurve}
              title="CALIBRATED GOLDEN REFERENCE CURVE (HEALTHY SENSOR COMPARISON)"
              isLive={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
