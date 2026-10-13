import React from 'react';
import {
  X,
  Wind,
  ArrowDown,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Radio,
  Zap,
} from 'lucide-react';

interface BalloonPhysicsExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BalloonPhysicsExplainerModal: React.FC<BalloonPhysicsExplainerModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/40 flex flex-col max-h-[88vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                Ballonet Variable-Buoyancy & BLDC Vectoring Physics
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Controlled Aerostat Descent & Precision Recovery Dynamics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 1: The Core Problem & Ballonet Solution */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold font-mono text-xs tracking-wider">
              <Layers className="w-4 h-4" />
              <span>1. VARIABLE BUOYANCY: WHY PUMP AIR INTO AN INTERNAL BALLONET?</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              Traditional high-altitude balloons descend by venting helium gas into the atmosphere. This is <span className="text-rose-400 font-semibold">irreversible, wasteful, and limits multi-day mission endurance</span>.
            </p>
            <p className="text-slate-300 leading-relaxed text-xs">
              This aerospace recovery platform uses an <strong className="text-amber-300">Internal Ballonet (Air Bladder)</strong> inside the main helium envelope:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-sky-400 flex items-center space-x-1">
                  <span>Helium Gas (Lifting)</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Density: <span className="text-slate-200">~0.178 kg/m³</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Remains sealed in the envelope at all times. Never vented or lost.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center space-x-1">
                  <span>Ambient Air Injected (Ballast)</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Density: <span className="text-slate-200">~1.225 kg/m³</span> (6.9x heavier!)
                </div>
                <div className="text-[11px] text-slate-400">
                  Compressor draws ambient outside air into the internal ballonet bag.
                </div>
              </div>
            </div>

            {/* Formula Block */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/20 font-mono text-xs space-y-1">
              <div className="text-slate-400">Net Vertical Force Equation:</div>
              <div className="text-amber-300 font-bold">
                F_net = F_buoyancy - F_gravity = (ρ_ambient · V_total · g) - [(M_dry + M_helium + <span className="text-amber-400">M_ballonet_air</span>) · g]
              </div>
              <div className="text-[11px] text-slate-400">
                As the ballonet inflates with ambient air, <span className="text-amber-300">M_ballonet_air increases</span> while displacement remains fixed. When <span className="text-amber-300">F_gravity &gt; F_buoyancy</span>, the vehicle steadily descends at a controlled rate (-1.5 to -3.2 m/s).
              </div>
            </div>
          </div>

          {/* Section 2: BLDC Thruster Wind Cancellation */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-sky-400 font-semibold font-mono text-xs tracking-wider">
              <Zap className="w-4 h-4" />
              <span>2. BLDC THRUSTER VECTORING: WIND COMPENSATION & PRECISION TARGETING</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              During descent, crosswinds exert aerodynamic drag on the balloon envelope:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-sky-300 border border-slate-800">
              F_drag = 0.5 · ρ_air · C_d · A_cross · (v_wind - v_balloon)²
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              The 4 symmetrical outrigger BLDC motors use 2-axis servo gimbals (pitch &amp; yaw) to aim their thrust vector directly into the oncoming wind vector.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">WIND VECTOR</span>
                <span className="text-rose-400 font-bold">DRIFT FORCE</span>
              </div>
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800 flex items-center justify-center">
                <span className="text-amber-400 font-bold">VS PID CONTROLLER</span>
              </div>
              <div className="p-2 rounded bg-slate-950/70 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">BLDC COUNTER-THRUST</span>
                <span className="text-emerald-400 font-bold">ZERO NET DRIFT</span>
              </div>
            </div>
          </div>

          {/* Section 3: Recovery & Shock-Absorbing Landing Gear */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold font-mono text-xs tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>3. TERMINAL FLARE & SHOCK-ABSORBING TOUCHDOWN</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Ground Proximity Radar (&lt;45m AGL):</strong> The radar altimeter under the gondola triggers terminal flare, commanding BLDC thrusters to vector downward and decelerate vertical velocity from -3.0 m/s to &lt;0.8 m/s.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Hydraulic Telescopic Struts:</strong> 4 articulated carbon fiber legs with hydraulic pistons compress upon touchdown, dissipating remaining kinetic energy without bouncing or tipping.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Xenon Strobe Recovery Beacon:</strong> Pulses every 1.2s to provide high-visibility visual location for ground retrieval teams.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            AEROSPACE VARIABLE-BUOYANCY SIMULATION ENGINE
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-mono text-xs font-semibold transition-colors"
          >
            GOT IT, CLOSE GUIDE
          </button>
        </div>
      </div>
    </div>
  );
};
