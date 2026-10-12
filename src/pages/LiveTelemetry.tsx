import React, { useState, useEffect } from 'react';
import { useSystem } from '../context/SystemContext';
import { useTheme } from '../context/ThemeContext';
import { ThermalPulseRunner } from '../components/telemetry/ThermalPulseRunner';
import { LivePulseChart } from '../components/telemetry/LivePulseChart';
import { SignalBehaviorMode, generateThermalPulseData } from '../data/mockTelemetry';
import {
  LineChart,
  Play,
  Square,
  Sliders,
  Cpu,
  Layers,
  Thermometer,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const LiveTelemetry: React.FC = () => {
  const {
    boards,
    components,
    selectedBoardId,
    setSelectedBoardId,
    selectedComponentId,
    setSelectedComponentId,
    selectedBoard,
    selectedComponent,
    isTesting,
    startLiveTest,
    stopLiveTest,
    liveTelemetryPoints,
    getBoardComponents,
  } = useSystem();
  const { isDark } = useTheme();

  // Ensure a valid board is selected when opening Telemetry
  useEffect(() => {
    if (!selectedBoardId && boards.length > 0) {
      setSelectedBoardId(boards[2]?.id || boards[0]?.id);
    }
  }, [selectedBoardId, boards, setSelectedBoardId]);

  const [behaviorMode, setBehaviorMode] = useState<SignalBehaviorMode>('degraded_decay');
  const [compareGolden, setCompareGolden] = useState<boolean>(true);

  const boardComponents = getBoardComponents(selectedBoardId || 'BRD-03');

  const handleStartSimulatedTest = () => {
    startLiveTest(selectedBoardId, selectedComponentId, behaviorMode);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Test Lifecycle Runner Progression Bar */}
      <ThermalPulseRunner />

      {/* 2. Main Live Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[520px]">
        {/* Left 3 Cols: High-Resolution Time-Series Graph */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[480px]">
          <LivePulseChart
            data={liveTelemetryPoints}
            component={selectedComponent}
            title={`THERMAL PULSE TRANSIENT RESPONSE: ${selectedComponent?.referenceDesignator || 'TEMP-02'}`}
            isLive={true}
          />
        </div>

        {/* Right 1 Col: Test Parameters & Signal Mode Configurator */}
        <div className={`p-4 rounded-xl border space-y-4 font-mono flex flex-col justify-between ${
          isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between pb-2 text-xs border-b ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <span className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                <span>TEST PARAMETERS</span>
              </span>
              <span className="text-[10px] text-slate-400">STIMULUS PROTOCOL</span>
            </div>

            {/* Board Selector */}
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">TARGET BOARD:</label>
              <select
                value={selectedBoardId}
                onChange={e => {
                  setSelectedBoardId(e.target.value);
                  const comps = getBoardComponents(e.target.value);
                  if (comps.length > 0) setSelectedComponentId(comps[0].id);
                }}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#0d131f] border-[#1c283c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {boards.map(b => (
                  <option key={b.id} value={b.id}>
                    [{b.id}] {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sensor / Component Selector */}
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">SENSOR CHANNEL:</label>
              <select
                value={selectedComponentId}
                onChange={e => setSelectedComponentId(e.target.value)}
                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 cursor-pointer ${
                  isDark ? 'bg-[#0d131f] border-[#1c283c] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {boardComponents.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.referenceDesignator} — {c.name} ({c.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Signal Signature Profile Mode Selector */}
            <div>
              <label className="text-slate-400 text-[10px] block mb-1">
                SIMULATED RESPONSE SIGNATURE:
              </label>
              <div className="space-y-1 text-[10px]">
                {[
                  { id: 'healthy', label: 'Healthy (Nominal Rise & Decay)', color: 'text-emerald-400' },
                  { id: 'degraded_decay', label: 'Degraded (Thermal Decay Lag)', color: 'text-rose-400' },
                  { id: 'stuck', label: 'Stuck Sensor (Flatline Output)', color: 'text-slate-400' },
                  { id: 'noisy', label: 'Noisy Sensor (Erratic Fluctuations)', color: 'text-amber-400' },
                  { id: 'intermittent', label: 'Intermittent (Signal Dropouts)', color: 'text-amber-400' },
                ].map(sig => (
                  <button
                    key={sig.id}
                    onClick={() => setBehaviorMode(sig.id as SignalBehaviorMode)}
                    className={`w-full text-left p-2 rounded-lg border transition-colors cursor-pointer ${
                      behaviorMode === sig.id
                        ? isDark
                          ? 'bg-cyan-950/70 border-cyan-500 text-white font-bold'
                          : 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold'
                        : isDark
                        ? 'bg-[#080c14] border-[#162030] text-slate-400 hover:text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <div className="truncate">{sig.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware Stimulus Specs */}
            <div className="p-2.5 rounded bg-[#080c14] border border-[#152030] text-[10px] space-y-1 text-slate-400">
              <div className="flex justify-between">
                <span>INJECTION CURRENT:</span>
                <span className="text-slate-200 font-semibold">250.0 mA</span>
              </div>
              <div className="flex justify-between">
                <span>PULSE WINDOW:</span>
                <span className="text-slate-200 font-semibold">t=1.0s to 3.5s (2.5s)</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL DURATION:</span>
                <span className="text-slate-200 font-semibold">10.0 Seconds</span>
              </div>
              <div className="flex justify-between">
                <span>CALIBRATION TOLERANCE:</span>
                <span className="text-cyan-400 font-semibold">±2.5°C Boundary</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            {isTesting ? (
              <button
                onClick={stopLiveTest}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 transition-colors shadow-[0_0_12px_rgba(225,29,72,0.4)] cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>ABORT CURRENT RUN</span>
              </button>
            ) : (
              <button
                onClick={handleStartSimulatedTest}
                className="w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/80 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>EXECUTE THERMAL TEST</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
