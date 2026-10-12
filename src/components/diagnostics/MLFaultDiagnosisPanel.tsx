import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { MLDiagnosticResult } from '../../types/vehicle';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileCheck,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MLFaultDiagnosisPanelProps {
  diagnosticResult: MLDiagnosticResult | null;
  onNavigateToHistory?: () => void;
  onNavigateToPcb?: () => void;
}

export const MLFaultDiagnosisPanel: React.FC<MLFaultDiagnosisPanelProps> = ({
  diagnosticResult,
  onNavigateToHistory,
  onNavigateToPcb,
}) => {
  const { selectedBoard, selectedComponent } = useSystem();

  if (!diagnosticResult) {
    return (
      <div className="p-8 text-center bg-[#0a0e16] border border-[#1b2536] rounded-lg space-y-3 font-mono text-xs">
        <Cpu className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
        <div className="text-slate-400">NO ACTIVE ML DIAGNOSTIC RECORD</div>
        <p className="text-slate-500 text-[11px] max-w-md mx-auto">
          Execute a live thermal pulse test or select a component with an anomaly history to load the diagnostic evaluation.
        </p>
      </div>
    );
  }

  const isFault = diagnosticResult.status === 'fault';
  const isWarning = diagnosticResult.status === 'warning';

  return (
    <div className="bg-[#0a0e16] border border-[#1b2536] rounded-lg flex flex-col space-y-5 p-5 text-xs">
      {/* Top Diagnostic Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2536] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold text-sm">
              DIAGNOSTIC RUN: {diagnosticResult.id}
            </span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-slate-400 text-[11px]">
              {selectedBoard?.name} ({diagnosticResult.boardId})
            </span>
          </div>
          <h2 className="text-base font-semibold text-white tracking-wide mt-1 flex items-center gap-2">
            <span>{diagnosticResult.anomalyType}</span>
            <span className="font-mono text-xs text-slate-400">
              [{selectedComponent?.referenceDesignator || diagnosticResult.componentId}]
            </span>
          </h2>
        </div>

        {/* Status & Confidence Badge */}
        <div className="flex items-center gap-2">
          {diagnosticResult.confidence !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0f172a] border border-cyan-800/60 font-mono text-[11px] text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONFIDENCE: {(diagnosticResult.confidence * 100).toFixed(1)}%</span>
              <span className="text-amber-400 text-[9px] uppercase font-bold">(SIMULATED)</span>
            </div>
          )}

          <div
            className={`px-3 py-1 rounded font-mono text-[11px] font-bold uppercase tracking-wider ${
              isFault
                ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
                : isWarning
                ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
            }`}
          >
            {diagnosticResult.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* 1. Observed Physical Behavior */}
      <div className="p-4 rounded bg-[#0d131f] border border-[#1d273a] space-y-1.5">
        <h3 className="font-mono text-[11px] uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>1. OBSERVED BEHAVIOR (EMPIRICAL SENSOR TRANSIENT)</span>
        </h3>
        <p className="text-slate-200 text-xs leading-relaxed font-sans">
          {diagnosticResult.observedBehavior}
        </p>
      </div>

      {/* 2. Quantitative Measured Deviations Table */}
      {diagnosticResult.deviatingMetrics && diagnosticResult.deviatingMetrics.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
            2. SUPPORTING TELEMETRY MEASUREMENTS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border border-[#1b2536]">
              <thead className="bg-[#0e1422] text-slate-400 border-b border-[#1b2536]">
                <tr>
                  <th className="p-2">METRIC NAME</th>
                  <th className="p-2">MEASURED VALUE</th>
                  <th className="p-2">HEALTHY BASELINE</th>
                  <th className="p-2">OBSERVED DEVIATION</th>
                  <th className="p-2">UNIT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#162030]">
                {diagnosticResult.deviatingMetrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#101726]">
                    <td className="p-2 text-slate-200 font-semibold">{m.metricName}</td>
                    <td className="p-2 text-rose-300 font-bold">{m.measured}</td>
                    <td className="p-2 text-cyan-300">{m.baseline}</td>
                    <td className="p-2 text-rose-400 font-bold">{m.deviation}</td>
                    <td className="p-2 text-slate-500">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Potential Root Causes (Clearly Disclaimed as Hypotheses) */}
      <div className="p-4 rounded bg-[#101622] border border-[#1e2a3c] space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[11px] uppercase text-amber-300 font-bold tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>3. POSSIBLE ROOT CAUSES (UNCONFIRMED HYPOTHESES)</span>
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            ENGINEERING REVIEW REQUIRED
          </span>
        </div>
        <ul className="space-y-1.5 pl-2">
          {diagnosticResult.possibleCauses.map((cause, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
              <span className="text-amber-400 font-mono font-bold shrink-0">•</span>
              <span>{cause}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Supporting Empirical Evidence & Contribution */}
      <div className="space-y-2">
        <h3 className="font-mono text-[11px] uppercase text-slate-400 font-semibold tracking-wider">
          4. SUPPORTING MODEL EVIDENCE
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {diagnosticResult.evidence.map((ev, idx) => (
            <div
              key={idx}
              className="p-3 rounded bg-[#080d16] border border-[#172235] space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="font-mono text-[10px] text-cyan-400 font-bold">
                  EVIDENCE ITEM #{idx + 1}
                </div>
                <div className="text-[11px] text-slate-200 mt-1 leading-snug">
                  {ev.description}
                </div>
              </div>
              <div className="pt-2 border-t border-[#141d2d] font-mono text-[10px]">
                <div className="text-slate-400">{ev.measuredVsExpected}</div>
                <div className="text-slate-500 mt-0.5">
                  Weight: {(ev.confidenceContribution * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Recommended Next Engineering Verification Steps */}
      <div className="p-4 rounded bg-cyan-950/20 border border-cyan-800/40 space-y-2">
        <h3 className="font-mono text-[11px] uppercase text-cyan-300 font-bold tracking-wider flex items-center gap-1.5">
          <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>5. RECOMMENDED VERIFICATION ACTIONS</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {diagnosticResult.recommendedActions.map((action, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded bg-[#08101a] border border-[#152336] flex items-start gap-2 text-slate-200 font-mono text-[11px]"
            >
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons to PCB or History */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1b2536]">
        <div className="text-slate-500 font-mono text-[10px]">
          DIAGNOSTIC ADAPTER: MLDiagnosticAdapter v1.4 • TIMESTAMP: {diagnosticResult.timestamp}
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToPcb && (
            <button
              onClick={onNavigateToPcb}
              className="px-3 py-1.5 rounded font-mono text-xs bg-[#111724] hover:bg-[#182133] border border-[#223048] text-cyan-300 transition-colors cursor-pointer"
            >
              LOCATE ON PCB EXPLORER
            </button>
          )}
          {onNavigateToHistory && (
            <button
              onClick={onNavigateToHistory}
              className="px-3 py-1.5 rounded font-mono text-xs bg-[#111724] hover:bg-[#182133] border border-[#223048] text-slate-300 transition-colors cursor-pointer"
            >
              INSPECT HISTORICAL LOGS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
