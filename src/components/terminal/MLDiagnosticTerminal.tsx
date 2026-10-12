import React, { useState, useRef, useEffect } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Terminal as TerminalIcon,
  Play,
  Square,
  Copy,
  Trash2,
  Filter,
  Check,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Maximize2,
  Pause,
  Download,
  Radio,
} from 'lucide-react';
import { Esp32SerialTerminal } from './Esp32SerialTerminal';

export const MLDiagnosticTerminal: React.FC = () => {
  const {
    terminalEvents,
    clearTerminalEvents,
    isTesting,
    testProgress,
    startLiveTest,
    stopLiveTest,
    selectedSubsystem,
    selectedPhysicalAssembly,
    selectedBoard,
    selectedComponent,
    currentDiagnosticResult,
    subsystems,
    boards,
    selectedBoardId,
    setSelectedBoardId,
    selectedComponentId,
    setSelectedComponentId,
    setCurrentTab,
    vehicle,
    esp32Connected,
    esp32Telemetry,
  } = useSystem();
  const { isDark } = useTheme();

  const [terminalMode, setTerminalMode] = useState<'esp32' | 'ml'>('esp32');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'FAULT' | 'WARNING' | 'TEST' | 'MODEL'>('ALL');
  const [boardFilter, setBoardFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of log
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalEvents, autoScroll]);

  // Filter events
  const filteredEvents = terminalEvents.filter(evt => {
    if (severityFilter === 'FAULT' && evt.severity !== 'fault') return false;
    if (severityFilter === 'WARNING' && evt.severity !== 'warning') return false;
    if (severityFilter === 'TEST' && evt.category !== 'TEST' && evt.category !== 'SENSOR' && evt.category !== 'SIGNAL') return false;
    if (severityFilter === 'MODEL' && evt.category !== 'MODEL' && evt.category !== 'RESULT') return false;
    if (boardFilter !== 'ALL' && evt.boardId !== boardFilter) return false;
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredEvents
      .map(e => `[${e.timestamp}] [${e.category.padEnd(8)}] ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono text-xs select-none">
      {/* View Switcher: ESP32 Hardware Stream vs ML Neural Logs */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div
          className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'bg-[#090d16] border-[#182335]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setTerminalMode('esp32')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              terminalMode === 'esp32'
                ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                esp32Connected
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span>ASTRA-IST ESP32 SERIAL</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 border border-white/20">
              {esp32Connected ? '/dev/ttyACM0' : 'OFFLINE'}
            </span>
          </button>

          <button
            onClick={() => setTerminalMode('ml')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
              terminalMode === 'ml'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>ML NEURAL DIAGNOSTIC LOGS</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 border border-white/20">
              SIMULATED
            </span>
          </button>
        </div>

        {/* Live ESP32 Sensor Quick Badges */}
        {esp32Telemetry && (
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg border bg-emerald-950/40 border-emerald-800/40 text-emerald-300">
              DS18B20: {esp32Telemetry.ds18b20Temp !== null ? `${esp32Telemetry.ds18b20Temp.toFixed(2)}°C` : '--'}
            </span>
            <span className="px-2.5 py-1 rounded-lg border bg-teal-950/40 border-teal-800/40 text-teal-300">
              NTC: {esp32Telemetry.ntcTemp !== null ? `${esp32Telemetry.ntcTemp.toFixed(1)}°C` : '--'}
            </span>
            <span className="px-2.5 py-1 rounded-lg border bg-amber-950/40 border-amber-800/40 text-amber-300">
              RAIL: {esp32Telemetry.busVoltage !== null ? `${esp32Telemetry.busVoltage.toFixed(3)}V` : '--'}
            </span>
          </div>
        )}
      </div>

      {terminalMode === 'esp32' ? (
        <div className="flex-1 overflow-hidden min-h-[580px]">
          <Esp32SerialTerminal />
        </div>
      ) : (
        <>
          {/* Top Engineering Terminal Header */}
          <div
            className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
              isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200'
            }`}
          >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h2 className={`font-bold tracking-wider text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              LIVE ML DIAGNOSTIC TERMINAL
            </h2>
          </div>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CAN BUS: 10ms
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              TENSORRT INT8 (SIMULATED)
            </span>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center gap-2">
          {/* Severity Filter */}
          <div
            className={`flex items-center gap-0.5 p-0.5 rounded-lg border text-[10px] ${
              isDark ? 'bg-[#0e1420] border-[#223048]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['ALL', 'FAULT', 'WARNING', 'TEST', 'MODEL'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  severityFilter === sev
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Board Scope Dropdown */}
          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className={`border rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-cyan-500 cursor-pointer ${
              isDark ? 'bg-[#0e1420] border-[#223048] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <option value="ALL">ALL BOARDS (6)</option>
            {boards.map(b => (
              <option key={b.id} value={b.id}>
                {b.id} ({b.status.toUpperCase()})
              </option>
            ))}
          </select>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Pause Auto-Follow' : 'Resume Auto-Follow'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              autoScroll
                ? isDark
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'text-slate-400 hover:text-slate-200 border-slate-700/40'
            }`}
          >
            {autoScroll ? <Activity className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopyLogs}
            title="Copy Terminal Logs to Clipboard"
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer ${
              isDark ? 'border-[#223048] hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Logs */}
          <button
            onClick={clearTerminalEvents}
            title="Clear Terminal Display"
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ${
              isDark ? 'border-[#223048] hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Live Stimulus Trigger */}
          {isTesting ? (
            <button
              onClick={stopLiveTest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>ABORT</span>
            </button>
          ) : (
            <button
              onClick={() => startLiveTest(selectedBoardId, selectedComponentId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.35)] cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>TRIGGER PULSE</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Terminal Split View */}
      <div className="flex-1 flex flex-col xl:flex-row gap-3 min-h-[560px] overflow-hidden">
        {/* Left Column: Live Monospace Terminal Screen */}
        <div
          className={`flex-1 rounded-xl border flex flex-col overflow-hidden shadow-inner ${
            isDark ? 'bg-[#05080e] border-[#182234]' : 'bg-[#0f172a] border-slate-300'
          }`}
        >
          {/* Terminal Title Bar */}
          <div className="px-3.5 py-2 bg-[#090e18] border-b border-[#141d2d] flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-bold">STDOUT /dev/ttyAERO0</span>
              <span className="text-slate-500">•</span>
              <span>FILTER: {severityFilter}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {filteredEvents.length} EVENTS LOGGED
            </div>
          </div>

          {/* Terminal Text Buffer */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 font-mono text-[11px] leading-relaxed">
            {filteredEvents.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center">
                Terminal buffer clear. Trigger a thermal pulse test to begin acquisition.
              </div>
            ) : (
              filteredEvents.map((evt, idx) => {
                let catBadgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50';
                if (evt.category === 'TEST') catBadgeColor = 'text-blue-400 bg-blue-950/60 border-blue-800/50';
                else if (evt.category === 'SENSOR') catBadgeColor = 'text-teal-400 bg-teal-950/60 border-teal-800/50';
                else if (evt.category === 'SIGNAL') catBadgeColor = 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50';
                else if (evt.category === 'ANALYSIS') catBadgeColor = 'text-amber-400 bg-amber-950/60 border-amber-800/50';
                else if (evt.category === 'MODEL') catBadgeColor = 'text-violet-400 bg-violet-950/60 border-violet-800/50';
                else if (evt.category === 'RESULT') {
                  catBadgeColor = evt.severity === 'fault'
                    ? 'text-rose-400 bg-rose-950/80 border-rose-800/60'
                    : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60';
                }

                let textColor = 'text-slate-300';
                if (evt.severity === 'fault') textColor = 'text-rose-300 font-semibold';
                else if (evt.severity === 'warning') textColor = 'text-amber-300';
                else if (evt.severity === 'success') textColor = 'text-emerald-300 font-semibold';

                return (
                  <div key={evt.id || idx} className="flex items-start gap-2 hover:bg-slate-900/40 p-0.5 rounded transition-colors">
                    <span className="text-slate-600 select-none w-8 text-right shrink-0">
                      {(idx + 1).toString().padStart(3, '0')}
                    </span>
                    <span className="text-slate-500 shrink-0 font-mono">
                      [{evt.timestamp}]
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold shrink-0 ${catBadgeColor}`}>
                      {evt.category.padEnd(8)}
                    </span>
                    {evt.boardId && (
                      <span className="text-cyan-600 shrink-0 text-[10px]">
                        [{evt.boardId}]
                      </span>
                    )}
                    <span className={`flex-1 break-words ${textColor}`}>
                      {evt.message}
                    </span>
                    {evt.latencyMs && (
                      <span className="text-slate-500 text-[10px] shrink-0">
                        {evt.latencyMs}ms
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Command Input Prompt / Status Bar */}
          <div className="px-3.5 py-2 bg-[#090e18] border-t border-[#141d2d] flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-cyan-500 font-bold">$</span>
              <span className="text-slate-300">aero-diag --stream --tensorrt-int8 --channel TEMP-02</span>
              <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
            </div>
            <div className="text-[10px] text-slate-500 hidden sm:inline">
              AUTONOMOUS INFERENCE PROTOCOL
            </div>
          </div>
        </div>

        {/* Right Column: Comprehensive ML Engineering Evidence & Root Cause Breakdown */}
        <div
          className={`w-full xl:w-96 rounded-xl border flex flex-col p-4 space-y-4 overflow-y-auto shadow-sm ${
            isDark ? 'bg-[#0a0e16] border-[#1b2536] text-slate-200' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`pb-3 border-b flex items-start justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div>
              <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                DIAGNOSTIC EVIDENCE
              </div>
              <h3 className="font-bold text-sm tracking-tight mt-0.5">
                ML CLASSIFICATION CARD
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider ${
                currentDiagnosticResult?.status === 'fault'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
                  : currentDiagnosticResult?.status === 'warning'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
              }`}
            >
              {currentDiagnosticResult?.status || 'PASS'}
            </span>
          </div>

          {/* Subsystem & Component Hierarchy Breadcrumb */}
          <div className={`p-2.5 rounded-lg border font-mono text-[10px] space-y-1 ${
            isDark ? 'bg-[#060a12]/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">VEHICLE:</span>
              <span className="font-bold text-white">{vehicle.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">SUBSYSTEM:</span>
              <span className="font-bold text-cyan-400">{selectedSubsystem?.name || 'Sensor Instrumentation'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">ASSEMBLY:</span>
              <span className="text-slate-200">{selectedPhysicalAssembly?.name || 'Temperature Measurement Assembly'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">BOARD:</span>
              <span className="text-slate-200">{selectedBoard?.name} ({selectedBoard?.id})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">TARGET SENSOR:</span>
              <span className="font-bold text-amber-400">{selectedComponent?.referenceDesignator} ({selectedComponent?.name})</span>
            </div>
          </div>

          {/* Model Inference Confidence Breakdown */}
          <div className={`p-3 rounded-lg border space-y-2 ${
            isDark ? 'bg-[#060a12]/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-400">MODEL CONFIDENCE:</span>
              <span className="font-bold text-cyan-400">
                {currentDiagnosticResult ? `${(currentDiagnosticResult.confidence * 100).toFixed(1)}%` : '96.8%'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${currentDiagnosticResult ? currentDiagnosticResult.confidence * 100 : 96.8}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span>ALGORITHM: 1D-CNN + GRU</span>
              <span className="text-amber-500 font-semibold">[SIMULATED INFERENCE]</span>
            </div>
          </div>

          {/* Measured Deviations Grid */}
          <div className={`p-3 rounded-lg border space-y-2 text-xs font-mono ${
            isDark ? 'bg-[#060a12]/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="font-bold text-[11px] text-slate-300 border-b pb-1 border-slate-700/50">
              TRANSIENT CURVE MEASUREMENTS:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-400 block">PEAK TEMP:</span>
                <span className="font-bold text-rose-400">68.4°C</span>
              </div>
              <div>
                <span className="text-slate-400 block">EXPECTED BASELINE:</span>
                <span className="text-slate-300">42.0°C</span>
              </div>
              <div>
                <span className="text-slate-400 block">DELTA DEVIATION:</span>
                <span className="font-bold text-rose-400">+28.6%</span>
              </div>
              <div>
                <span className="text-slate-400 block">RECOVERY LAG:</span>
                <span className="font-bold text-amber-400">+4.2 sec delay</span>
              </div>
            </div>
          </div>

          {/* Hypothesized Root Causes */}
          <div className="space-y-1.5 text-xs">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              HYPOTHESIZED ROOT CAUSES:
            </div>
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
              isDark ? 'bg-rose-950/20 border-rose-900/40 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>Degraded thermal bond between RTD substrate and cold plate.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>Intermittent resistance drift on excitation current driver line.</span>
              </div>
            </div>
          </div>

          {/* Recommended Verification Actions */}
          <div className="space-y-1.5 text-xs">
            <div className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              RECOMMENDED ACTIONS:
            </div>
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
              isDark ? 'bg-slate-900/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Execute localized 4-wire Kelvin resistance measurement on sensor leads.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>Perform mechanical torque re-check on cold plate mounting screws (0.8 Nm).</span>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                if (selectedBoard) {
                  setSelectedBoardId(selectedBoard.id);
                  setCurrentTab('pcb');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <span>INSPECT IN PCB EXPLORER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentTab('overview')}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              }`}
            >
              <span>RETURN TO 3D VEHICLE STAGE</span>
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
