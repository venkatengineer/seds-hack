import React, { useState, useEffect, useRef } from 'react';
import {
  esp32Service,
  Esp32Telemetry,
  SerialLineEntry,
  Esp32Status,
} from '../../services/esp32Service';
import { useTheme } from '../../context/ThemeContext';
import {
  Terminal as TerminalIcon,
  Cpu,
  Radio,
  Zap,
  Thermometer,
  Activity,
  Pause,
  Play,
  Copy,
  Check,
  Trash2,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface Esp32SerialTerminalProps {
  compact?: boolean;
  onClose?: () => void;
}

export const Esp32SerialTerminal: React.FC<Esp32SerialTerminalProps> = ({
  compact = false,
  onClose,
}) => {
  const { isDark } = useTheme();

  const [status, setStatus] = useState<Esp32Status>(() => esp32Service.getStatus());
  const [telemetry, setTelemetry] = useState<Esp32Telemetry>(() => esp32Service.getTelemetry());
  const [lines, setLines] = useState<SerialLineEntry[]>(() => esp32Service.getRecentLines());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [commandInput, setCommandInput] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to ESP32 stream
  useEffect(() => {
    const unsubStatus = esp32Service.subscribeStatus(s => setStatus(s));
    const unsubTelemetry = esp32Service.subscribeTelemetry(t => {
      setTelemetry(t);
      setLastActivity(Date.now());
    });

    const unsubLines = esp32Service.subscribeLines(entry => {
      if (!isPaused) {
        setLines(prev => {
          const next = [...prev, entry];
          if (next.length > 600) next.shift();
          return next;
        });
        setLastActivity(Date.now());
      }
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
      unsubLines();
    };
  }, [isPaused]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && !isPaused && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, autoScroll, isPaused]);

  const handleCopy = () => {
    const text = lines.map(l => `${l.timestamp ? `[${l.timestamp}] ` : ''}${l.line}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    esp32Service.clearLines();
    setLines([]);
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commandInput.trim() || isSending) return;

    setIsSending(true);
    const cmd = commandInput.trim();
    setCommandInput('');
    await esp32Service.sendCommand(cmd);
    setIsSending(false);
  };

  const filteredLines = searchFilter.trim()
    ? lines.filter(l => l.line.toLowerCase().includes(searchFilter.toLowerCase()))
    : lines;

  // Format line with syntax colors
  const renderLineContent = (rawText: string) => {
    if (rawText.includes('------ ASTRA-IST READINGS ------')) {
      return (
        <span className="text-cyan-400 font-bold bg-cyan-950/40 px-1 py-0.5 rounded border border-cyan-800/40">
          {rawText}
        </span>
      );
    }
    if (rawText.includes('DS18B20 temperature:')) {
      const parts = rawText.split('DS18B20 temperature:');
      return (
        <span>
          <span className="text-emerald-400 font-semibold">DS18B20 temperature:</span>
          <span className="text-emerald-300 font-bold ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('NTC estimated temperature:')) {
      const parts = rawText.split('NTC estimated temperature:');
      return (
        <span>
          <span className="text-teal-400 font-semibold">NTC estimated temperature:</span>
          <span className="text-teal-300 font-bold ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('NTC ADC:')) {
      const parts = rawText.split('NTC ADC:');
      return (
        <span>
          <span className="text-slate-400">NTC ADC:</span>
          <span className="text-slate-200 font-mono ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('INA219 bus voltage:')) {
      const parts = rawText.split('INA219 bus voltage:');
      return (
        <span>
          <span className="text-amber-400 font-semibold">INA219 bus voltage:</span>
          <span className="text-amber-300 font-bold ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('INA219 shunt voltage:')) {
      const parts = rawText.split('INA219 shunt voltage:');
      return (
        <span>
          <span className="text-amber-500/80">INA219 shunt voltage:</span>
          <span className="text-amber-200 font-mono ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('INA219 current:')) {
      const parts = rawText.split('INA219 current:');
      return (
        <span>
          <span className="text-indigo-400 font-semibold">INA219 current:</span>
          <span className="text-indigo-300 font-bold ml-1">{parts[1]}</span>
        </span>
      );
    }
    if (rawText.includes('INA219 power:')) {
      const parts = rawText.split('INA219 power:');
      return (
        <span>
          <span className="text-purple-400 font-semibold">INA219 power:</span>
          <span className="text-purple-300 font-bold ml-1">{parts[1]}</span>
        </span>
      );
    }
    return <span className="text-slate-300">{rawText}</span>;
  };

  return (
    <div
      className={`w-full h-full flex flex-col font-mono text-xs select-none ${
        compact ? 'p-3' : 'gap-3'
      }`}
    >
      {/* 1. Header Toolbar */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 shadow-sm shrink-0 ${
          isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200'
        }`}
      >
        {/* Device identity and live connection status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status.connected
                  ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <div className="flex items-center gap-1.5">
              <span className={`font-bold tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ASTRA-IST ESP32 SERIAL
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-semibold">
                {status.port || '/dev/ttyACM0'}
              </span>
            </div>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
            <span>{status.baudRate} BAUD</span>
            <span>•</span>
            <span className={status.connected ? 'text-emerald-400' : 'text-rose-400'}>
              {status.connected ? 'STREAMING ACTIVE' : 'DISCONNECTED'}
            </span>
            <span>•</span>
            <span>{lines.length} LINES</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Search/Filter Bar */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter output..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className={`pl-7 pr-2 py-1 rounded-lg border text-[10px] focus:outline-none focus:border-cyan-500 ${
                isDark ? 'bg-[#0e1420] border-[#223048] text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
              } w-28 sm:w-36`}
            />
          </div>

          {/* Auto-Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Disable Auto-Scroll' : 'Enable Auto-Scroll'}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              autoScroll
                ? isDark
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  : 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'text-slate-400 hover:text-slate-200 border-slate-700/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          {/* Pause / Resume Stream */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume Serial Stream' : 'Pause Serial Stream'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-colors cursor-pointer ${
              isPaused
                ? 'bg-amber-600/20 border-amber-500/60 text-amber-300'
                : isDark
                ? 'border-slate-800 text-slate-400 hover:text-slate-200'
                : 'border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            {isPaused ? <Play className="w-3 h-3 fill-current text-amber-400" /> : <Pause className="w-3 h-3" />}
            <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Copy Logs */}
          <button
            onClick={handleCopy}
            title="Copy Serial Buffer to Clipboard"
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer ${
              isDark ? 'border-[#223048] hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Buffer */}
          <button
            onClick={handleClear}
            title="Clear Serial Buffer"
            className={`p-1.5 rounded-lg border text-slate-400 hover:text-rose-400 transition-colors cursor-pointer ${
              isDark ? 'border-[#223048] hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-2 py-1 rounded-lg border text-slate-400 hover:text-white border-slate-700 cursor-pointer ml-1 text-[11px]"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-time Telemetry Sensor Cards (High-Density Aerospace Strip) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
        {/* DS18B20 Temp Card */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            isDark ? 'bg-[#090d16] border-[#182335]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Thermometer className="w-3 h-3" />
              DS18B20 DIGITAL TEMP
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              BRD-03
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-emerald-400 font-mono tracking-tight">
              {telemetry.ds18b20Temp !== null ? `${telemetry.ds18b20Temp.toFixed(2)} °C` : '--.- °C'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              NOM: 25.0°C
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>CH: TEMP-02</span>
            <span>1-Wire Bus</span>
          </div>
        </div>

        {/* NTC Thermistor Card */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            isDark ? 'bg-[#090d16] border-[#182335]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-teal-400 font-semibold">
              <Cpu className="w-3 h-3" />
              NTC THERMISTOR
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-teal-950/60 text-teal-300 border border-teal-800/40">
              ADC {telemetry.ntcAdc ?? '----'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-teal-400 font-mono tracking-tight">
              {telemetry.ntcTemp !== null ? `${telemetry.ntcTemp.toFixed(1)} °C` : '--.- °C'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              CH: TEMP-01
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>Steinhart-Hart</span>
            <span>12-bit SAR ADC</span>
          </div>
        </div>

        {/* INA219 Bus Voltage Card */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            isDark ? 'bg-[#090d16] border-[#182335]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Zap className="w-3 h-3" />
              INA219 BUS VOLTAGE
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
              3.3V RAIL
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-amber-400 font-mono tracking-tight">
              {telemetry.busVoltage !== null ? `${telemetry.busVoltage.toFixed(3)} V` : '-.--- V'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ±0.5% REG
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>Shunt: {telemetry.shuntVoltage !== null ? `${telemetry.shuntVoltage.toFixed(3)} mV` : '---'}</span>
            <span>I2C 0x40</span>
          </div>
        </div>

        {/* INA219 Current & Power Card */}
        <div
          className={`p-2.5 rounded-xl border flex flex-col justify-between ${
            isDark ? 'bg-[#090d16] border-[#182335]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-indigo-400 font-semibold">
              <Radio className="w-3 h-3" />
              CURRENT & POWER
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
              TELEMETRY
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-indigo-400 font-mono tracking-tight">
              {telemetry.currentMa !== null ? `${telemetry.currentMa.toFixed(2)} mA` : '-.-- mA'}
            </span>
            <span className="text-xs font-semibold text-purple-400 font-mono">
              {telemetry.powerMw !== null ? `${telemetry.powerMw.toFixed(2)} mW` : '-.-- mW'}
            </span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
            <span>Low-Power Quiescent</span>
            <span>Sampling @ 1Hz</span>
          </div>
        </div>
      </div>

      {/* Live Trained ML Model Diagnostic Classification Strip */}
      {telemetry.mlDiagnosis && (
        <div
          className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 shadow-sm shrink-0 ${
            telemetry.mlDiagnosis.severity === 'fault'
              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              : telemetry.mlDiagnosis.severity === 'warning'
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold tracking-wide">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>LIVE ML DIAGNOSIS:</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[11px] border ${
                telemetry.mlDiagnosis.severity === 'fault'
                  ? 'bg-rose-900/60 border-rose-500 text-rose-100 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : telemetry.mlDiagnosis.severity === 'warning'
                  ? 'bg-amber-900/60 border-amber-500 text-amber-100'
                  : 'bg-emerald-900/60 border-emerald-500 text-emerald-100'
              }`}
            >
              {telemetry.mlDiagnosis.classification}
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              CONFIDENCE: {(telemetry.mlDiagnosis.confidence * 100).toFixed(1)}%
            </span>
            <span className="hidden md:inline text-[10px] text-slate-400">
              // {telemetry.mlDiagnosis.description}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-slate-400">MODEL:</span>
            <span className="text-cyan-300 font-semibold">{telemetry.mlDiagnosis.algorithm}</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              100% VAL SCORE
            </span>
          </div>
        </div>
      )}

      {/* 3. Monospace Terminal Display */}
      <div
        className={`flex-1 min-h-[300px] rounded-xl border flex flex-col overflow-hidden shadow-inner ${
          isDark ? 'bg-[#05080e] border-[#182234]' : 'bg-[#0a0f1d] border-slate-300'
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="px-3.5 py-2 bg-[#090e18] border-b border-[#141d2d] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-bold">SERIAL CONSOLE /dev/ttyACM0</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[10px]">ENCODING: UTF-8 RAW</span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-2">
            <span>LAST RX: {new Date(lastActivity).toLocaleTimeString()}</span>
            <span>•</span>
            <span className="text-cyan-400">{filteredLines.length} LINES</span>
          </div>
        </div>

        {/* Terminal Text Lines */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1 font-mono text-[11px] leading-relaxed select-text">
          {filteredLines.length === 0 ? (
            <div className="text-slate-500 italic py-12 text-center flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-500" />
              <span>Awaiting serial data packets from ESP32 on /dev/ttyACM0...</span>
            </div>
          ) : (
            filteredLines.map((entry, index) => (
              <div
                key={entry.id || index}
                className="flex items-start gap-2 hover:bg-slate-800/30 px-1 py-0.5 rounded transition-colors group"
              >
                <span className="text-slate-600 select-none text-[10px] w-8 text-right shrink-0">
                  {index + 1}
                </span>
                {entry.timestamp && (
                  <span className="text-slate-500 select-none text-[10px] shrink-0">
                    [{entry.timestamp}]
                  </span>
                )}
                <div className="flex-1 break-all">
                  {renderLineContent(entry.line)}
                </div>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Line Input */}
        <form
          onSubmit={handleSendCommand}
          className="p-2 bg-[#080d16] border-t border-[#141d2d] flex items-center gap-2 shrink-0"
        >
          <span className="text-cyan-500 font-bold pl-1.5 select-none">{'>'}</span>
          <input
            type="text"
            placeholder="Send serial command to ESP32 (e.g. AT, STATUS, PING)..."
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            disabled={!status.connected}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 text-xs focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={!commandInput.trim() || isSending || !status.connected}
            className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:hover:bg-cyan-600 text-white text-[11px] font-semibold cursor-pointer transition-colors"
          >
            <Send className="w-3 h-3" />
            <span>SEND</span>
          </button>
        </form>
      </div>
    </div>
  );
};
