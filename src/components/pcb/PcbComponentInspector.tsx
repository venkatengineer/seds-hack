import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { ComponentItem, BoardItem } from '../../types/vehicle';
import {
  ShieldAlert,
  Play,
  Activity,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sliders,
  Cpu,
  Layers,
  Thermometer,
  Zap,
} from 'lucide-react';

interface PcbComponentInspectorProps {
  component: ComponentItem;
  board: BoardItem;
  onRunTest: (boardId: string, componentId: string) => void;
  onViewFaultAnalysis: () => void;
}

export const PcbComponentInspector: React.FC<PcbComponentInspectorProps> = ({
  component,
  board,
  onRunTest,
  onViewFaultAnalysis,
}) => {
  const { injectComponentFault } = useSystem();
  const { isDark } = useTheme();

  const [minExp, maxExp] = component.expectedHealthyRange;
  const measured = component.latestMeasuredResponse;
  const isOutOfRange = measured < minExp || measured > maxExp;

  // Calculate percentage within or beyond range
  const span = maxExp - minExp || 1;
  const relativePercent = Math.min(100, Math.max(0, ((measured - minExp) / span) * 100));

  return (
    <div className={`w-full xl:w-96 rounded-xl border flex flex-col h-full overflow-hidden text-xs shadow-sm ${
      isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200'
    }`}>
      {/* Header */}
      <div className={`p-3.5 border-b flex items-center justify-between ${
        isDark ? 'border-[#1b2536] bg-[#070a10]' : 'border-slate-100 bg-slate-50'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-cyan-500">
              {component.referenceDesignator}
            </span>
            <span className="text-slate-400">/</span>
            <span className="font-mono text-[10px] text-slate-400">{component.packageType}</span>
          </div>
          <h3 className={`font-semibold text-xs mt-0.5 truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {component.name}
          </h3>
        </div>

        {/* Status Badge */}
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
            component.status === 'fault'
              ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
              : component.status === 'warning'
              ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
              : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
          }`}
        >
          {component.status}
        </span>
      </div>

      {/* Body Content */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {/* Board & Physical Placement Meta */}
        <div className={`grid grid-cols-2 gap-2 p-2.5 rounded-lg border font-mono text-[10px] ${
          isDark ? 'bg-[#070b12] border-[#172132] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div>
            <span className="text-slate-400">PARENT BOARD:</span>
            <div className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{board.name}</div>
          </div>
          <div>
            <span className="text-slate-400">PCB POS (X, Y):</span>
            <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
              {component.pcbPosition.x}mm, {component.pcbPosition.y}mm
            </div>
          </div>
          <div>
            <span className="text-slate-400">PACKAGE FOOTPRINT:</span>
            <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{component.packageType}</div>
          </div>
          <div>
            <span className="text-slate-400">TESTS LOGGED:</span>
            <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{component.completedTestsCount} CYCLES</div>
          </div>
        </div>

        {/* Measured Response vs Expected Range */}
        <div className={`p-3 rounded-lg border space-y-2 ${
          isDark ? 'bg-[#0d131f] border-[#1e2a3c]' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between font-mono text-[11px]">
            <span className="text-slate-400">LATEST MEASURED OUTPUT:</span>
            <span className={`font-bold text-sm ${isOutOfRange ? 'text-rose-500' : 'text-emerald-500'}`}>
              {component.latestMeasuredResponse.toFixed(2)} {component.unit}
            </span>
          </div>

          {/* Range Visualizer Bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
              <span>MIN: {minExp.toFixed(1)} {component.unit}</span>
              <span className="text-cyan-400">EXPECTED NOMINAL</span>
              <span>MAX: {maxExp.toFixed(1)} {component.unit}</span>
            </div>
            <div className="relative w-full h-3 bg-slate-900 rounded-sm border border-slate-800 overflow-hidden">
              {/* Healthy Target Zone */}
              <div className="absolute inset-y-0 left-[20%] right-[20%] bg-emerald-950/40 border-x border-emerald-500/30" />
              {/* Actual Measured Marker */}
              <div
                className={`absolute top-0 bottom-0 w-1.5 shadow-sm transition-all ${
                  isOutOfRange ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                }`}
                style={{ left: `${Math.min(98, Math.max(2, relativePercent))}%` }}
              />
            </div>
          </div>

          {component.observedDeviationPercent !== undefined && (
            <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[#182335]">
              <span className="text-slate-400">OBSERVED DEVIATION:</span>
              <span className={`font-semibold ${component.observedDeviationPercent > 10 ? 'text-rose-400' : 'text-amber-400'}`}>
                +{component.observedDeviationPercent.toFixed(1)}% vs BASELINE
              </span>
            </div>
          )}
        </div>

        {/* ML Inference Evaluation Box */}
        {component.mlConfidence !== undefined ? (
          <div className="p-3 rounded bg-rose-950/20 border border-rose-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-rose-300 font-bold uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>ML MODEL DIAGNOSIS</span>
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-700/50 text-rose-300 font-semibold">
                {(component.mlConfidence * 100).toFixed(1)}% CONF. (SIMULATED)
              </span>
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed">
              {component.notes}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 text-[11px] text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Thermal decay & transient rise strictly follow healthy calibrated model.</span>
          </div>
        )}

        {/* Connected Sensor Channels List */}
        <div>
          <h4 className="font-mono text-[10px] uppercase text-slate-400 font-semibold mb-1.5">
            CONNECTED SENSOR CHANNELS ({component.sensorChannels.length})
          </h4>
          <div className="space-y-1.5">
            {component.sensorChannels.map(ch => (
              <div
                key={ch.id}
                className="p-2 rounded bg-[#080c14] border border-[#162030] flex items-center justify-between text-[11px] font-mono"
              >
                <div>
                  <div className="text-slate-200 font-semibold">{ch.name}</div>
                  <div className="text-slate-500 text-[10px]">{ch.id} • {ch.type}</div>
                </div>
                <div className="text-right">
                  <div className="text-cyan-300 font-semibold">{ch.baselineNominal} {ch.unit}</div>
                  <div className="text-slate-500 text-[9px]">[{ch.minTolerance} - {ch.maxTolerance}]</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Fault Injection Controls for Demonstration */}
        <div className="p-2.5 rounded bg-[#090d16] border border-[#172236] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>TEST HARNESS FAULT INJECTION</span>
            </span>
            <span className="text-[9px] text-slate-500">TOGGLE STATE</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
            <button
              onClick={() => injectComponentFault(component.id, 'healthy')}
              className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                component.status === 'healthy'
                  ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              HEALTHY
            </button>
            <button
              onClick={() => injectComponentFault(component.id, 'warning', 'excessive_jitter')}
              className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                component.status === 'warning'
                  ? 'bg-amber-900/50 border-amber-500 text-amber-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              WARNING
            </button>
            <button
              onClick={() => injectComponentFault(component.id, 'fault', 'thermal_decay_lag')}
              className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                component.status === 'fault'
                  ? 'bg-rose-900/50 border-rose-500 text-rose-200 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              FAULT
            </button>
          </div>
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-3 border-t border-[#1b2536] bg-[#070a10] space-y-2">
        <button
          onClick={() => onRunTest(board.id, component.id)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/80 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>RUN THERMAL PULSE TEST</span>
        </button>

        {component.status !== 'healthy' && (
          <button
            onClick={onViewFaultAnalysis}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded font-mono text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 border border-rose-600/50 text-rose-300 transition-colors cursor-pointer"
          >
            <FileSearch className="w-3.5 h-3.5 text-rose-400" />
            <span>VIEW ML FAULT ROOT-CAUSE ANALYSIS</span>
          </button>
        )}
      </div>
    </div>
  );
};
