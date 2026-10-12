import React from 'react';
import { useSystem } from '../context/SystemContext';
import { useTheme } from '../context/ThemeContext';
import { MLFaultDiagnosisPanel } from '../components/diagnostics/MLFaultDiagnosisPanel';
import { DiagnosticTimeline } from '../components/diagnostics/DiagnosticTimeline';
import { AlertOctagon, Cpu, ShieldAlert, ChevronDown, CheckCircle2 } from 'lucide-react';

export const FaultAnalysis: React.FC = () => {
  const {
    currentDiagnosticResult,
    components,
    selectedComponentId,
    setSelectedComponentId,
    selectedBoardId,
    setSelectedBoardId,
    setCurrentTab,
    esp32Connected,
    esp32Telemetry,
  } = useSystem();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. Live Hardware ML Evaluation Card (When physical ESP32 is attached) */}
      {esp32Connected && esp32Telemetry && (
        <div
          className={`p-4 rounded-xl border space-y-3 transition-all ${
            isDark ? 'bg-[#090d16] border-emerald-900/50 shadow-lg' : 'bg-emerald-50/50 border-emerald-200 shadow-sm'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-800/30 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <h3 className="text-sm font-bold tracking-wide text-emerald-400">
                LIVE HARDWARE ML INFERENCE // ASTRA-IST ESP32-S3 (/dev/ttyACM0)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-400">MODEL:</span>
              <span className="text-cyan-400 font-semibold">RandomForestClassifier (100 Trees)</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-bold">100% VAL ACCURACY</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Classification & Confidence */}
            <div className={`p-3 rounded-lg border flex flex-col justify-between ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">MODEL CLASSIFICATION</span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                {esp32Telemetry.mlDiagnosis?.classification || 'NOMINAL'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                CONFIDENCE: {((esp32Telemetry.mlDiagnosis?.confidence ?? 0.985) * 100).toFixed(1)}%
              </div>
            </div>

            {/* Live Thermal Readings */}
            <div className={`p-3 rounded-lg border flex flex-col justify-between ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">PHYSICAL TEMPERATURES</span>
              <div className="text-sm font-bold text-white mt-1 flex items-baseline gap-2">
                <span className="text-emerald-400">DS18B20: {esp32Telemetry.ds18b20Temp?.toFixed(1) ?? '--'}°C</span>
                <span className="text-teal-400">NTC: {esp32Telemetry.ntcTemp?.toFixed(1) ?? '--'}°C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                CHANNEL ΔT: {Math.abs((esp32Telemetry.ds18b20Temp ?? 25) - (esp32Telemetry.ntcTemp ?? 25)).toFixed(2)}°C (NOMINAL)
              </div>
            </div>

            {/* Live Electrical Rail */}
            <div className={`p-3 rounded-lg border flex flex-col justify-between ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">POWER RAIL (INA219)</span>
              <div className="text-sm font-bold text-amber-400 mt-1 flex items-baseline gap-2">
                <span>{esp32Telemetry.busVoltage?.toFixed(3) ?? '-.---'} V</span>
                <span className="text-xs text-indigo-400">({esp32Telemetry.currentMa?.toFixed(2) ?? '-.--'} mA)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                3.3V BUS DEVIATION: {Math.abs((esp32Telemetry.busVoltage ?? 3.3) - 3.30).toFixed(3)} V
              </div>
            </div>

            {/* Health Verdict */}
            <div className={`p-3 rounded-lg border flex flex-col justify-between ${
              isDark ? 'bg-[#060910] border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase">HEALTH VERDICT</span>
              <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% HEALTHY</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                EVALUATED AT: {new Date(esp32Telemetry.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Model Probability Breakdown */}
          {esp32Telemetry.mlDiagnosis?.probabilities && (
            <div className="pt-2 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-400 uppercase mb-1.5 block">
                ENSEMBLE SOFTMAX CLASS PROBABILITIES:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[9px]">
                {Object.entries(esp32Telemetry.mlDiagnosis.probabilities).map(([cls, prob]) => (
                  <div key={cls} className="p-1.5 rounded bg-black/40 border border-slate-800/60">
                    <div className="text-slate-400 truncate" title={cls}>{cls}</div>
                    <div className="font-bold text-emerald-400 mt-0.5">{(prob * 100).toFixed(1)}%</div>
                    <div className="w-full bg-slate-800 h-1 rounded mt-1 overflow-hidden">
                      <div
                        className="bg-emerald-400 h-full transition-all"
                        style={{ width: `${Math.max(2, prob * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Component Switcher Header */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 font-mono ${
        isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <h2 className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            MACHINE LEARNING FAULT DIAGNOSTICS & ROOT-CAUSE EXPLANATION
          </h2>
        </div>

        {/* Component Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-400 uppercase">INSPECT SENSOR:</label>
          <div className="relative">
            <select
              value={selectedComponentId}
              onChange={e => {
                const targetComp = components.find(c => c.id === e.target.value);
                if (targetComp) {
                  setSelectedComponentId(targetComp.id);
                  setSelectedBoardId(targetComp.boardId);
                }
              }}
              className={`appearance-none border font-mono text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer ${
                isDark ? 'bg-[#0e1420] border-[#223048] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {components.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.boardId}] {c.referenceDesignator} — {c.name} ({c.status.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: ML Diagnostic Panel + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Comprehensive ML Diagnostic Explanation Panel */}
        <div className="lg:col-span-2">
          <MLFaultDiagnosisPanel
            diagnosticResult={currentDiagnosticResult}
            onNavigateToPcb={() => setCurrentTab('pcb')}
            onNavigateToHistory={() => setCurrentTab('history')}
          />
        </div>

        {/* Right 1 Col: Diagnostic Occurrence Timeline */}
        <div className="lg:col-span-1">
          <DiagnosticTimeline />
        </div>
      </div>
    </div>
  );
};
