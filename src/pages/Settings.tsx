import React, { useState } from 'react';
import { useSystem } from '../context/SystemContext';
import { HealthStatus } from '../types/vehicle';
import {
  Settings as SettingsIcon,
  Sliders,
  Cpu,
  Zap,
  RotateCcw,
  ShieldAlert,
  Server,
  Cable,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const {
    components,
    boards,
    injectComponentFault,
    resetDemoState,
    simulationNotice,
  } = useSystem();

  const [hwBus, setHwBus] = useState<string>('Simulated-VBus');
  const [controllerEndpoint, setControllerEndpoint] = useState<string>('192.168.10.45:5020');
  const [mlEndpoint, setMlEndpoint] = useState<string>('http://localhost:8000/api/v1/diagnose');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.85);
  const [thermalToleranceDelta, setThermalToleranceDelta] = useState<number>(2.5);

  return (
    <div className="space-y-5 text-xs">
      {/* Top Header */}
      <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1b2536] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <span>SYSTEM INTEGRATION & FAULT INJECTION SETTINGS</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            CALIBRATION THRESHOLDS, ADAPTER CONFIGURATION & INTERACTIVE TESTBED INJECTION
          </p>
        </div>

        <button
          onClick={resetDemoState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#111724] hover:bg-[#18233a] border border-[#202d44] text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>RESTORE DEMO DEFAULTS</span>
        </button>
      </div>

      {/* Grid: Hardware Adapter & ML Service Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hardware Adapter Card */}
        <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1b2536] space-y-3">
          <div className="flex items-center justify-between border-b border-[#172234] pb-2">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Cable className="w-4 h-4 text-amber-400" />
              <span>HARDWARE DAQ CONTROLLER ADAPTER</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/50 text-amber-300 font-mono text-[10px]">
              MODE: SIMULATED
            </span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Configure future integration parameters. The active telemetry and heat injection drivers connect to this controller when physical hardware is deployed.
          </p>

          <div className="space-y-3 font-mono text-[11px]">
            <div>
              <label className="text-slate-500 block mb-1">INTERFACING BUS PROTOCOL:</label>
              <select
                value={hwBus}
                onChange={e => setHwBus(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1c283c] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Simulated-VBus">Simulated-VBus (In-Memory Deterministic)</option>
                <option value="CAN-FD">CAN-FD (Aero CAN 2.0B / 5 Mbps)</option>
                <option value="SpaceWire">SpaceWire (ECSS-E-ST-50-52C)</option>
                <option value="MIL-STD-1553">MIL-STD-1553 Avionics Data Bus</option>
                <option value="Ethernet-DAQ">Ethernet-DAQ (Modbus-TCP / SCPI)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1">PHYSICAL CONTROLLER IP / PORT:</label>
              <input
                type="text"
                value={controllerEndpoint}
                onChange={e => setControllerEndpoint(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1c283c] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* ML Inference Model Adapter Card */}
        <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1b2536] space-y-3">
          <div className="flex items-center justify-between border-b border-[#172234] pb-2">
            <span className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>ML DIAGNOSTIC INFERENCE SERVICE</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-600/50 text-cyan-300 font-mono text-[10px]">
              ENGINE: READY
            </span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            The machine learning fault diagnostics module classifies thermal recovery transients against physics-based finite-element baselines.
          </p>

          <div className="space-y-3 font-mono text-[11px]">
            <div>
              <label className="text-slate-500 block mb-1">INFERENCE SERVICE ENDPOINT:</label>
              <input
                type="text"
                value={mlEndpoint}
                onChange={e => setMlEndpoint(e.target.value)}
                className="w-full bg-[#0d131f] border border-[#1c283c] rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500">ANOMALY CONFIDENCE THRESHOLD:</span>
                <span className="text-cyan-400 font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.99"
                step="0.01"
                value={confidenceThreshold}
                onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-500">ALLOWED THERMAL RESIDUAL TOLERANCE (±ΔT):</span>
                <span className="text-cyan-400 font-bold">±{thermalToleranceDelta.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.5"
                value={thermalToleranceDelta}
                onChange={e => setThermalToleranceDelta(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Fault Injection Testbed Matrix */}
      <div className="p-4 rounded-lg bg-[#0a0e16] border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172234] pb-2">
          <div>
            <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>LIVE SENSOR FAULT INJECTION TESTBED</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Force state shifts on individual sensors. The board and vehicle health scores will immediately recalculate through hierarchical state aggregation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {components.map(comp => {
            const board = boards.find(b => b.id === comp.boardId);

            return (
              <div
                key={comp.id}
                className="p-3 rounded bg-[#070b12] border border-[#172132] space-y-2 font-mono text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="text-cyan-300">{comp.referenceDesignator}</span>
                    <span className="text-slate-500 text-[10px]">[{board?.id}]</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      comp.status === 'fault'
                        ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
                        : comp.status === 'warning'
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
                        : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 truncate">
                  {comp.name}
                </div>

                {/* State Injection Buttons */}
                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#141d2d] text-[10px]">
                  <button
                    onClick={() => injectComponentFault(comp.id, 'healthy')}
                    className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                      comp.status === 'healthy'
                        ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    HEALTHY
                  </button>
                  <button
                    onClick={() => injectComponentFault(comp.id, 'warning', 'excessive_jitter')}
                    className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                      comp.status === 'warning'
                        ? 'bg-amber-900/60 border-amber-500 text-amber-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    WARNING
                  </button>
                  <button
                    onClick={() => injectComponentFault(comp.id, 'fault', 'thermal_decay_lag')}
                    className={`py-1 rounded border text-center transition-colors cursor-pointer ${
                      comp.status === 'fault'
                        ? 'bg-rose-900/60 border-rose-500 text-rose-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    FAULT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
