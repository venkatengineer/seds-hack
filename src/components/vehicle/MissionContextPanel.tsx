import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { Radio, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

export const MissionContextPanel: React.FC = () => {
  const { vehicle, isTesting, testRuns, esp32Connected, esp32Telemetry, setCurrentTab } = useSystem();
  const { isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      className={`absolute top-[72px] left-5 z-20 pointer-events-auto rounded-xl p-3 backdrop-blur-xl border font-mono select-none transition-all duration-200 shadow-xl ${
        isCollapsed ? 'w-56' : 'w-60 sm:w-64'
      } ${
        isDark
          ? 'bg-slate-950/75 border-slate-800/80 text-slate-300 shadow-black/40'
          : 'bg-white/85 border-slate-300 text-slate-700 shadow-slate-300/40'
      }`}
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/40 text-[9px] uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5 font-bold text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          MISSION CONTEXT
        </span>
        <button
          onClick={() => setIsCollapsed(c => !c)}
          title={isCollapsed ? 'Expand Mission Context' : 'Collapse Panel'}
          className="p-0.5 rounded hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
        >
          {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {isCollapsed ? (
        <div className="flex items-center justify-between text-[11px] pt-0.5">
          <span className="text-slate-400 text-[10px]">{vehicle.id}</span>
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
      ) : (

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
          {esp32Connected ? (
            <button
              onClick={() => setCurrentTab('terminal')}
              title="Open ESP32 Hardware Terminal"
              className="text-emerald-400 font-bold flex items-center gap-1 text-[10px] hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              LIVE ESP32 (/dev/ttyACM0)
            </button>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1 text-[10px]">
              <Radio className="w-3 h-3 text-emerald-400" />
              SIMULATED (CAN 10ms)
            </span>
          )}
        </div>

        {/* Live ESP32 Sensor Summary if connected */}
        {esp32Connected && esp32Telemetry && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px]">
            <span className="text-slate-400">TELEMETRY (BRD-03):</span>
            <span className="text-emerald-300 font-semibold font-mono">
              {esp32Telemetry.ds18b20Temp !== null ? `${esp32Telemetry.ds18b20Temp.toFixed(1)}°C` : '--'} · {esp32Telemetry.busVoltage !== null ? `${esp32Telemetry.busVoltage.toFixed(2)}V` : '--'}
            </span>
          </div>
        )}

        {/* ML Inference Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-[10px]">ML INFERENCE:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
            <Cpu className="w-3 h-3 text-emerald-400 animate-pulse" />
            ACTIVE (RANDOM FOREST)
          </span>
        </div>
      </div>
      )}
    </div>
  );
};
