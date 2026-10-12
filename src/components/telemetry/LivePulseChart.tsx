import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { TelemetryDataPoint, ComponentItem } from '../../types/vehicle';
import { Thermometer, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LivePulseChartProps {
  data: TelemetryDataPoint[];
  component?: ComponentItem;
  title?: string;
  isLive?: boolean;
}

export const LivePulseChart: React.FC<LivePulseChartProps> = ({
  data,
  component,
  title = 'THERMAL TRANSIENT RESPONSE SIGNATURE',
  isLive = true,
}) => {
  // Derive telemetry metrics
  const maxMeasured = data.length > 0 ? Math.max(...data.map(d => d.measuredValue)) : 0;
  const maxExpected = data.length > 0 ? Math.max(...data.map(d => d.expectedValue)) : 0;
  const hasAnomaly = data.some(d => d.anomalyDetected);
  const unit = component?.unit || '°C';

  // Custom aerospace dark tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pt = payload[0].payload as TelemetryDataPoint;
      const delta = (pt.measuredValue - pt.expectedValue).toFixed(2);

      return (
        <div className="p-2.5 rounded bg-[#0a0f18]/95 border border-[#1e2a3c] shadow-2xl font-mono text-[11px] space-y-1">
          <div className="text-slate-400 border-b border-[#182335] pb-1 flex items-center justify-between">
            <span>ELAPSED TIME:</span>
            <span className="text-white font-bold">{label}s</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-cyan-400">EXPECTED NOMINAL:</span>
            <span className="text-slate-200">{pt.expectedValue.toFixed(2)} {unit}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={pt.anomalyDetected ? 'text-rose-400 font-bold' : 'text-slate-200'}>
              MEASURED OUTPUT:
            </span>
            <span className={pt.anomalyDetected ? 'text-rose-400 font-bold' : 'text-white'}>
              {pt.measuredValue.toFixed(2)} {unit}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#182335] pt-1">
            <span className="text-slate-500">RESIDUAL DELTA (ΔT):</span>
            <span className={Number(delta) > 3 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
              {Number(delta) > 0 ? `+${delta}` : delta} {unit}
            </span>
          </div>
          {pt.pulseActive && (
            <div className="text-[10px] text-amber-400 bg-amber-950/40 px-1 py-0.5 rounded text-center font-bold">
              HEAT PULSE ACTIVE [250mA]
            </div>
          )}
          {pt.anomalyDetected && (
            <div className="text-[10px] text-rose-300 bg-rose-950/60 px-1 py-0.5 rounded text-center font-bold">
              ANOMALY THRESHOLD EXCEEDED
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#070a10] border border-[#1b2536] rounded-lg p-3.5 space-y-3">
      {/* Chart Top Header & Quick Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#162030] pb-2 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded bg-cyan-400" />
          <h3 className="font-semibold text-slate-100 uppercase tracking-wide">
            {title}
          </h3>
          {isLive && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-700/50 text-[10px] text-cyan-300 font-medium">
              LIVE SAMPLING
            </span>
          )}
        </div>

        {/* Telemetry Stats Pills */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="text-slate-400">
            PEAK MEASURED: <span className="text-white font-bold">{maxMeasured.toFixed(1)} {unit}</span>
          </div>
          <div className="text-slate-400">
            NOMINAL PEAK: <span className="text-cyan-400 font-bold">{maxExpected.toFixed(1)} {unit}</span>
          </div>
          <div className="text-slate-400">
            STATUS:{' '}
            <span
              className={`font-bold ${
                hasAnomaly ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {hasAnomaly ? 'DEVIATION DETECTED' : 'CONFORMANT'}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#172233" opacity={0.6} />

            <XAxis
              dataKey="elapsedSeconds"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={val => `${val}s`}
              label={{ value: 'ELAPSED TIME (SECONDS)', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 10 }}
            />

            <YAxis
              stroke="#64748b"
              domain={['dataMin - 5', 'dataMax + 8']}
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={val => `${val.toFixed(0)}${unit}`}
              label={{ value: `TEMPERATURE (${unit})`, angle: -90, position: 'insideLeft', offset: 12, fill: '#475569', fontSize: 10 }}
            />

            {/* Stimulus Pulse Active Zone: t=1.0 to t=3.5s */}
            <ReferenceArea
              x1={1.0}
              x2={3.5}
              stroke="#d97706"
              strokeOpacity={0.4}
              strokeDasharray="2 2"
              fill="#f59e0b"
              fillOpacity={0.06}
              label={{ value: 'HEAT PULSE ACTIVE [t=1.0 - 3.5s]', fill: '#f59e0b', fontSize: 9, position: 'top' }}
            />

            {/* Threshold limits */}
            <Line
              type="monotone"
              dataKey="upperThreshold"
              stroke="#475569"
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              name="Upper Tolerance (+2.5°C)"
            />

            <Line
              type="monotone"
              dataKey="lowerThreshold"
              stroke="#475569"
              strokeDasharray="2 2"
              dot={false}
              isAnimationActive={false}
              name="Lower Tolerance (-2.5°C)"
            />

            {/* Expected Healthy Reference Curve */}
            <Line
              type="monotone"
              dataKey="expectedValue"
              stroke="#06b6d4"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Expected Healthy Response"
            />

            {/* Measured Response Curve */}
            <Line
              type="monotone"
              dataKey="measuredValue"
              stroke={hasAnomaly ? '#f43f5e' : '#f8fafc'}
              strokeWidth={2.5}
              dot={false}
              name="Measured Sensor Response"
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              iconType="plainline"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes on Hardware/Model Calibration */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-[#162030]">
        <span>MODEL BASELINE: FINITE-ELEMENT HEAT TRANSFER TRANSIENT</span>
        <span>SAMPLING RATE: 50 SAMPLES / 10s • STIMULUS DURATION: 2.5s</span>
      </div>
    </div>
  );
};
