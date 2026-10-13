import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  X,
  Zap,
  Gauge,
  Compass,
  Cpu,
  Layers,
  Activity,
  Play,
  RotateCcw,
  ShieldCheck,
  Thermometer,
  Radio,
  Sliders,
} from 'lucide-react';
import { createBldcMotorAssembly, BldcMotorAssembly } from './bldcModelBuilder';

interface BldcMotorInspectorModalProps {
  motorId: string | null;
  onClose: () => void;
  telemetry?: {
    rpm: number;
    pitchDeg: number;
    yawDeg: number;
    throttlePct: number;
    currentAmps: number;
    tempC: number;
  };
}

export const BldcMotorInspectorModal: React.FC<BldcMotorInspectorModalProps> = ({
  motorId,
  onClose,
  telemetry: externalTelemetry,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [manualThrottle, setManualThrottle] = useState<number>(45);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'3d' | 'specs' | 'telemetry'>('3d');
  const [manualPitch, setManualPitch] = useState<number>(0);
  const [manualYaw, setManualYaw] = useState<number>(0);

  // References for Three.js scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const bldcRef = useRef<BldcMotorAssembly | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const orbitAnglesRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.6,
    phi: 0.8,
    radius: 1.4,
  });

  // Calculate live values
  const currentRpm = isTestRunning
    ? 8400
    : externalTelemetry
      ? externalTelemetry.rpm
      : Math.round((manualThrottle / 100) * 8800);
  const currentPitchRad = THREE.MathUtils.degToRad(
    externalTelemetry ? externalTelemetry.pitchDeg : manualPitch
  );
  const currentYawRad = THREE.MathUtils.degToRad(
    externalTelemetry ? externalTelemetry.yawDeg : manualYaw
  );
  const currentCurrentAmps = isTestRunning
    ? 24.8
    : externalTelemetry
      ? externalTelemetry.currentAmps
      : Number(((manualThrottle / 100) * 22.4).toFixed(1));
  const currentTemp = isTestRunning
    ? 48.5
    : externalTelemetry
      ? externalTelemetry.tempC
      : Number((26 + (manualThrottle / 100) * 18).toFixed(1));

  // Initialize Three.js viewport
  useEffect(() => {
    if (!mountRef.current || !motorId) return;

    const width = mountRef.current.clientWidth || 460;
    const height = mountRef.current.clientHeight || 420;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913);

    // Subtle grid and aerospace ground target ring
    const gridHelper = new THREE.GridHelper(2.5, 20, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -0.45;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.05, 50);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;
    mountRef.current.replaceChildren(renderer.domElement);

    // Studio Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x0f172a, 1.2);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(-2, -1, -2);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0x38bdf8, 2.5, 4);
    accentLight.position.set(0, 0.8, 0.6);
    scene.add(accentLight);

    // Create the BLDC motor model instance
    const bldc = createBldcMotorAssembly(motorId, {
      accentColor: 0x0ea5e9,
      propRadius: 0.44,
    });
    bldcRef.current = bldc;
    scene.add(bldc.rootGroup);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (bldcRef.current) {
        bldcRef.current.updateAnimation(currentRpm, currentPitchRad, currentYawRad, delta);
      }

      // Update camera position based on orbit angles
      const { theta, phi, radius } = orbitAnglesRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Mouse drag handlers for Orbiting
    const dom = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - prevMouseRef.current.x;
      const dy = e.clientY - prevMouseRef.current.y;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };

      orbitAnglesRef.current.theta -= dx * 0.008;
      orbitAnglesRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, orbitAnglesRef.current.phi - dy * 0.008)
      );
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitAnglesRef.current.radius = Math.max(
        0.6,
        Math.min(3.0, orbitAnglesRef.current.radius + e.deltaY * 0.0015)
      );
    };

    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [motorId]);

  // Update exploded progress in Three.js
  useEffect(() => {
    if (bldcRef.current) {
      bldcRef.current.setExplodedProgress(explodedProgress);
    }
  }, [explodedProgress]);

  if (!motorId) return null;

  // Run Dyno Spin Burst Test
  const handleRunDynoTest = () => {
    setIsTestRunning(true);
    setTimeout(() => {
      setIsTestRunning(false);
    }, 3500);
  };

  const getMotorLabel = (id: string) => {
    switch (id) {
      case 'MOT-01-FWD':
        return 'Forward Vectoring Pod (+Z Axis)';
      case 'MOT-02-RIGHT':
        return 'Starboard Vectoring Pod (+X Axis)';
      case 'MOT-03-AFT':
        return 'Aft Vectoring Pod (-Z Axis)';
      case 'MOT-04-LEFT':
        return 'Port Vectoring Pod (-X Axis)';
      default:
        return 'High-Torque Aerostat Thruster';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950/95 border border-sky-500/30 rounded-2xl shadow-2xl shadow-sky-950/50 flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-white tracking-wide">{motorId}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  ACTIVE & TELEMETRY LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{getMotorLabel(motorId)}</p>
            </div>
          </div>

          {/* Navigation Tabs & Close */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs font-mono">
              <button
                onClick={() => setActiveTab('3d')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === '3d'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D CAD & VECTOR</span>
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'specs'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>SPECS & WINDINGS</span>
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'telemetry'
                    ? 'bg-sky-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>3-PHASE DYNO</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
              title="Close Inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* Left Column: 3D Viewport with Live Overlays */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 relative min-h-[360px] lg:min-h-[460px]">
            {/* 3D Canvas Container */}
            <div ref={mountRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative" />

            {/* In-Canvas Floating Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-1.5 pointer-events-none">
              <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-[11px] font-mono text-sky-300 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                <span>12N14P STATOR / CURVED N52SH MAGNETS</span>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 text-[11px] font-mono text-emerald-300 flex items-center space-x-2">
                <Radio className="w-3 h-3 text-emerald-400" />
                <span>2-AXIS SERVO GIMBAL VECTORING</span>
              </div>
            </div>

            {/* Exploded View Control Bar */}
            <div className="p-3 bg-slate-900/70 border-t border-slate-800/80 flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>EXPLODED VIEW:</span>
                <span className="text-sky-400 font-bold">{Math.round(explodedProgress * 100)}%</span>
              </div>
              <div className="flex-1 max-w-xs">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={explodedProgress}
                  onChange={(e) => setExplodedProgress(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                />
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setExplodedProgress(0)}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  ASSEMBLE
                </button>
                <button
                  onClick={() => setExplodedProgress(1)}
                  className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30"
                >
                  DISASSEMBLE
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Controls, Telemetry & Specs */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between space-y-4 bg-slate-950/60">
            {activeTab === '3d' && (
              <div className="space-y-4">
                {/* Live Dyno Metrics */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>ROTOR VELOCITY</span>
                      <Gauge className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="mt-1 flex items-baseline space-x-1">
                      <span className="text-2xl font-bold font-mono text-white tracking-tight">
                        {currentRpm.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">RPM</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-sky-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (currentRpm / 9000) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>3-PHASE CURRENT</span>
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="mt-1 flex items-baseline space-x-1">
                      <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
                        {currentCurrentAmps}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">AMPS</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-2 flex justify-between">
                      <span>BUS: 24.2 V</span>
                      <span className="text-emerald-400">{(currentCurrentAmps * 24.2).toFixed(0)} W</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>STATOR TEMP</span>
                      <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="mt-1 flex items-baseline space-x-1">
                      <span className="text-2xl font-bold font-mono text-white tracking-tight">
                        {currentTemp}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">°C</span>
                    </div>
                    <div className="text-[11px] font-mono text-emerald-400 mt-2">
                      NORMAL (&lt;85°C LIMIT)
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>THRUST VECTOR</span>
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="text-sm font-bold font-mono text-indigo-300">
                        P: {(currentPitchRad * 57.3).toFixed(1)}°
                      </span>
                      <span className="text-sm font-bold font-mono text-indigo-300">
                        Y: {(currentYawRad * 57.3).toFixed(1)}°
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-2">
                      WIND DRIFT CANCELLATION
                    </div>
                  </div>
                </div>

                {/* Interactive Throttle & Vector Controls */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 font-mono">
                      <Sliders className="w-3.5 h-3.5 text-sky-400" />
                      <span>MANUAL THROTTLE SPINDLE</span>
                    </span>
                    <span className="text-xs font-mono text-sky-400 font-bold">{manualThrottle}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={manualThrottle}
                    disabled={isTestRunning}
                    onChange={(e) => setManualThrottle(parseInt(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />

                  {/* Manual Pitch & Yaw Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>PITCH GIMBAL</span>
                        <span>{manualPitch}°</span>
                      </div>
                      <input
                        type="range"
                        min="-45"
                        max="45"
                        value={manualPitch}
                        onChange={(e) => setManualPitch(parseInt(e.target.value))}
                        className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>YAW VECTOR</span>
                        <span>{manualYaw}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={manualYaw}
                        onChange={(e) => setManualYaw(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Dyno Test Button */}
                <button
                  onClick={handleRunDynoTest}
                  disabled={isTestRunning}
                  className={`w-full py-2.5 px-4 rounded-xl font-mono text-xs font-semibold tracking-wider flex items-center justify-center space-x-2 transition-all ${
                    isTestRunning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                      : 'bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-400 hover:to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/20 active:scale-[0.98]'
                  }`}
                >
                  <Play className={`w-4 h-4 ${isTestRunning ? 'animate-spin' : ''}`} />
                  <span>
                    {isTestRunning ? 'RUNNING DYNOMOMETER FULL-THROTTLE BURST...' : 'EXECUTE 8,400 RPM DYNO BURST TEST'}
                  </span>
                </button>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="space-y-3.5 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="text-sky-400 font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>PRECISION BLDC AEROSPACE ARCHITECTURE</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Custom outrunner brushless DC motor engineered specifically for high-altitude aerostat dynamic stationkeeping and precision terminal flare deceleration.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">STATOR CONFIG</span>
                    <span className="text-slate-200 font-semibold">12-Pole (12N) Copper</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">ROTOR MAGNETS</span>
                    <span className="text-slate-200 font-semibold">14-Pole (14P) N52SH Arc</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">PROPELLER</span>
                    <span className="text-slate-200 font-semibold">14x4.8 Carbon Toray 3-Blade</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">MAX THRUST</span>
                    <span className="text-emerald-400 font-semibold">4.85 kgf per unit (19.4 kgf total)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">VOLTAGE / KV</span>
                    <span className="text-slate-200 font-semibold">24V (6S LiPo) / 880 KV</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-500 block">GIMBAL ARTICULATION</span>
                    <span className="text-indigo-400 font-semibold">±45° Pitch, ±180° Yaw</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-[11px] text-sky-200 space-y-1">
                  <span className="font-semibold block text-sky-300">WIND COMPENSATION FUNCTION</span>
                  <span>
                    When the balloon descends, aerodynamic drag forces push the vehicle laterally. The 4 BLDC outriggers vector their thrust directly opposite to the calculated wind drift vector (F_wind), maintaining the landing gear trajectory perfectly locked onto the center recovery bullseye.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'telemetry' && (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-sky-400 font-bold">3-PHASE FOC OSCILLOSCOPE</span>
                    <span className="text-[11px] text-emerald-400">120° ELECT. OFFSET</span>
                  </div>
                  {/* Waveform Visualization */}
                  <div className="h-24 bg-slate-950 rounded-lg border border-slate-800/80 p-2 flex items-center relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 300 80">
                      {/* Phase U (Red) */}
                      <path
                        d="M 0 40 Q 37.5 10 75 40 T 150 40 T 225 40 T 300 40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        opacity="0.85"
                      />
                      {/* Phase V (Yellow) */}
                      <path
                        d="M 0 40 Q 37.5 70 75 40 T 150 40 T 225 40 T 300 40"
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2"
                        opacity="0.85"
                      />
                      {/* Phase W (Sky Blue) */}
                      <path
                        d="M 0 20 Q 37.5 60 75 20 T 150 20 T 225 20 T 300 20"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        opacity="0.85"
                      />
                    </svg>
                    <div className="absolute top-1 right-2 flex space-x-2 text-[10px]">
                      <span className="text-red-400">Phase U</span>
                      <span className="text-yellow-400">Phase V</span>
                      <span className="text-sky-400">Phase W</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Field-Oriented Control (FOC):</span>
                    <span className="text-emerald-400 font-bold">LOCKED & COMMUTATING</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>ESC Frequency:</span>
                    <span className="text-slate-200">48.0 kHz DShot1200</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phase Back-EMF:</span>
                    <span className="text-slate-200">18.4 Vpk-pk</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Active Freewheeling:</span>
                    <span className="text-emerald-400">ENABLED (97.2% Efficiency)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Status & Dismiss Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE: FLIGHT CONTROLLER CAN-BUS</span>
              </div>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
              >
                RETURN TO DESCENT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
