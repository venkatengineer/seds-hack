import React from 'react';
import {
  Compass,
  ArrowDown,
  Wind,
  Layers,
  Radio,
  Zap,
  ShieldCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export interface BalloonFlightState {
  altitude: number; // meters AGL (e.g. 500 down to 0)
  verticalVelocity: number; // m/s (negative for descent)
  ballonetInflationRatio: number; // 0.0 to 1.0
  ballonetAirMassKg: number; // kg of ambient air pumped inside
  windSpeed: number; // m/s (0 to 25)
  windDirectionDeg: number; // 0 to 360
  horizontalOffset: { x: number; z: number }; // meters from bullseye
  phase: 'FLOAT' | 'INFLATING' | 'DESCENT' | 'RADAR_FLARE' | 'TOUCHDOWN';
  compressorActive: boolean;
  radarActive: boolean;
  beaconActive: boolean;
  gearCompression: number; // 0 to 1
  motorRpms: number[]; // 4 motors
}

interface BalloonDescentTelemetryHUDProps {
  flightState: BalloonFlightState;
  onOpenExplainer: () => void;
  onSelectMotor: (motorId: string) => void;
}

export const BalloonDescentTelemetryHUD: React.FC<BalloonDescentTelemetryHUDProps> = ({
  flightState,
  onOpenExplainer,
  onSelectMotor,
}) => {
  const {
    altitude,
    verticalVelocity,
    ballonetInflationRatio,
    ballonetAirMassKg,
    windSpeed,
    windDirectionDeg,
    horizontalOffset,
    phase,
    compressorActive,
    radarActive,
    gearCompression,
    motorRpms,
  } = flightState;

  // Derive buoyancy and gravitational forces
  const totalVehicleDryMass = 68.0; // kg
  const heliumDisplacementLift = 105.0; // kgf equivalent at sea level
  const currentTotalMass = totalVehicleDryMass + ballonetAirMassKg;
  const netForceNewtons = Math.round((heliumDisplacementLift - currentTotalMass) * 9.81);

  const getPhaseBadge = () => {
    switch (phase) {
      case 'FLOAT':
        return { label: 'PHASE 1: EQUILIBRIUM FLOAT', color: 'border-sky-500/50 bg-sky-500/10 text-sky-300' };
      case 'INFLATING':
        return { label: 'PHASE 2: BALLONET PUMPING (WEIGHT GAIN)', color: 'border-amber-500/50 bg-amber-500/10 text-amber-300' };
      case 'DESCENT':
        return { label: 'PHASE 3: DESCENT & BLDC WIND DRIFT CANCEL', color: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' };
      case 'RADAR_FLARE':
        return { label: 'PHASE 4: RADAR TERMINAL FLARE (<45m)', color: 'border-purple-500/50 bg-purple-500/10 text-purple-300' };
      case 'TOUCHDOWN':
        return { label: 'PHASE 5: RECOVERY TOUCHDOWN CONFIRMED', color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' };
    }
  };

  const badge = getPhaseBadge();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Telemetry Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left Flight Header */}
        <div className="pointer-events-auto flex items-center space-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-lg shadow-black/40">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold tracking-wider text-white">
                AEROSTAT RECOVERY PLATFORM
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400 mt-0.5">
              <span>TARGET: RECOVERY PAD 01 (0.0m, 0.0m)</span>
              <span>•</span>
              <span className="text-emerald-400">AUTONOMOUS GUIDANCE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Right Info / Explainer Button */}
        <div className="pointer-events-auto flex items-center space-x-2">
          <button
            onClick={onOpenExplainer}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center space-x-2 transition-all shadow-md active:scale-95"
          >
            <Layers className="w-4 h-4" />
            <span>HOW BALLONET &amp; BLDC LANDING WORKS</span>
          </button>
        </div>
      </div>

      {/* Floating Center Notification for Flare & Touchdown */}
      {phase === 'RADAR_FLARE' && (
        <div className="self-center pointer-events-none px-5 py-2 rounded-xl bg-purple-950/90 border border-purple-500/60 shadow-xl shadow-purple-950/60 text-purple-200 text-xs font-mono flex items-center space-x-2 animate-bounce">
          <Activity className="w-4 h-4 text-purple-400" />
          <span>TERMINAL RADAR FLARE ENGAGED: BLDC MOTORS SPOOLING TO DECELERATE TOUCHDOWN</span>
        </div>
      )}

      {phase === 'TOUCHDOWN' && (
        <div className="self-center pointer-events-none px-6 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/70 shadow-2xl shadow-emerald-950/80 text-emerald-200 text-xs font-mono flex items-center space-x-2.5 animate-pulse">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="font-bold tracking-wide">
            TOUCHDOWN CONFIRMED: GEAR COMPRESSED ({Math.round(gearCompression * 100)}%) • RECOVERY BEACON PULSING
          </span>
        </div>
      )}

      {/* Primary Flight Display Telemetry Panels (Lower Left & Lower Right) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Left Flight Metrics (Altitude Tape & Variable Buoyancy) */}
        <div className="pointer-events-auto flex flex-col space-y-2 max-w-sm w-full">
          <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 space-y-2.5 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center space-x-1.5 text-sky-400 font-bold">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>FLIGHT TELEMETRY (AGL)</span>
              </span>
              <span className={verticalVelocity < -0.2 ? 'text-amber-400' : 'text-slate-300'}>
                VSI: {verticalVelocity.toFixed(1)} m/s
              </span>
            </div>

            {/* Altitude readout */}
            <div className="flex items-baseline justify-between font-mono">
              <div>
                <span className="text-3xl font-extrabold text-white tracking-tight">
                  {Math.max(0, Math.round(altitude))}
                </span>
                <span className="text-xs text-slate-400 ml-1">METERS AGL</span>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>RADAR ALT: </span>
                <span className={altitude < 45 ? 'text-purple-400 font-bold' : 'text-slate-300'}>
                  {radarActive ? `${Math.max(0, altitude).toFixed(1)}m (LOCKED)` : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* Ballonet Air Mass & Volume Bar */}
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-semibold flex items-center space-x-1">
                  <span>BALLONET AIR BLADDER</span>
                  {compressorActive && <span className="text-[10px] text-amber-300 animate-pulse">(PUMPING)</span>}
                </span>
                <span className="text-white font-bold">{Math.round(ballonetInflationRatio * 100)}% INFLATED</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, ballonetInflationRatio * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>PUMPED AIR MASS: <strong className="text-amber-300">+{ballonetAirMassKg.toFixed(1)} kg</strong></span>
                <span>NET FORCE: <strong className={netForceNewtons < 0 ? 'text-rose-400' : 'text-emerald-400'}>{netForceNewtons} N</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stationkeeping & Wind Compensation Panel */}
        <div className="pointer-events-auto flex flex-col space-y-2 max-w-sm w-full">
          <div className="p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80 space-y-2.5 shadow-xl shadow-black/50">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span className="flex items-center space-x-1.5 text-sky-400 font-bold">
                <Wind className="w-3.5 h-3.5" />
                <span>WIND &amp; BLDC STATIONKEEPING</span>
              </span>
              <span className="text-slate-300 font-bold">{windSpeed.toFixed(1)} m/s @ {windDirectionDeg}°</span>
            </div>

            {/* Target Error Vector */}
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">TOUCHDOWN DRIFT ERROR:</span>
              <span className={`font-bold ${Math.hypot(horizontalOffset.x, horizontalOffset.z) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ΔX: {horizontalOffset.x.toFixed(1)}m | ΔZ: {horizontalOffset.z.toFixed(1)}m
              </span>
            </div>

            {/* 4x BLDC Motor Quick Pod Indicators (Clickable to inspect in 3D!) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>QUAD VECTORING BLDC PODS (CLICK TO ZOOM CAD)</span>
                <span className="text-sky-400">ACTIVE PID</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                {[
                  { id: 'MOT-01-FWD', name: 'FWD', rpm: motorRpms[0] ?? 0 },
                  { id: 'MOT-02-RIGHT', name: 'STBD', rpm: motorRpms[1] ?? 0 },
                  { id: 'MOT-03-AFT', name: 'AFT', rpm: motorRpms[2] ?? 0 },
                  { id: 'MOT-04-LEFT', name: 'PORT', rpm: motorRpms[3] ?? 0 },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectMotor(m.id)}
                    className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-sky-500/20 border border-slate-800 hover:border-sky-500/50 flex flex-col items-center transition-all group cursor-pointer"
                  >
                    <span className="text-slate-400 group-hover:text-sky-300 font-semibold">{m.name}</span>
                    <span className="text-sky-400 font-bold">{m.rpm}</span>
                    <span className="text-[8px] text-slate-500">RPM</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
