import React, { useState } from 'react';
import { BalloonLandingCanvas } from '../components/balloon/BalloonLandingCanvas';
import {
  BalloonDescentTelemetryHUD,
  BalloonFlightState,
} from '../components/balloon/BalloonDescentTelemetryHUD';
import { BalloonDescentControlPanel } from '../components/balloon/BalloonDescentControlPanel';
import { BldcMotorInspectorModal } from '../components/balloon/BldcMotorInspectorModal';
import { BalloonPhysicsExplainerModal } from '../components/balloon/BalloonPhysicsExplainerModal';

export const BalloonLandingPage: React.FC = () => {
  // Flight state & physics
  const [flightState, setFlightState] = useState<BalloonFlightState>({
    altitude: 380, // Start at 380m AGL
    verticalVelocity: 0,
    ballonetInflationRatio: 0.15, // Partially filled initial state
    ballonetAirMassKg: 7.2,
    windSpeed: 8.5, // 8.5 m/s wind
    windDirectionDeg: 45, // Northeast
    horizontalOffset: { x: 0, z: 0 },
    phase: 'FLOAT',
    compressorActive: false,
    radarActive: false,
    beaconActive: true,
    gearCompression: 0,
    motorRpms: [1800, 1800, 1800, 1800],
  });

  // UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPumpingAir, setIsPumpingAir] = useState<boolean>(true);
  const [autoCompensateWind, setAutoCompensateWind] = useState<boolean>(true);
  const [envelopeMode, setEnvelopeMode] = useState<'cutaway' | 'solid' | 'wireframe'>('cutaway');
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'ballonet' | 'bldc' | 'landing'>('overview');
  const [selectedMotorId, setSelectedMotorId] = useState<string | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState<boolean>(false);

  // Playback handlers
  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setFlightState({
      altitude: 380,
      verticalVelocity: 0,
      ballonetInflationRatio: 0.15,
      ballonetAirMassKg: 7.2,
      windSpeed: 8.5,
      windDirectionDeg: 45,
      horizontalOffset: { x: 0, z: 0 },
      phase: 'FLOAT',
      compressorActive: false,
      radarActive: false,
      beaconActive: true,
      gearCompression: 0,
      motorRpms: [1800, 1800, 1800, 1800],
    });
    setIsPumpingAir(true);
    setIsPlaying(true);
  };

  const handleJumpToPhase = (phaseIndex: number) => {
    switch (phaseIndex) {
      case 0: // Float
        setFlightState((prev) => ({
          ...prev,
          altitude: 400,
          verticalVelocity: 0,
          ballonetInflationRatio: 0.1,
          ballonetAirMassKg: 4.8,
          phase: 'FLOAT',
          gearCompression: 0,
        }));
        setIsPumpingAir(false);
        break;
      case 1: // Inflating
        setFlightState((prev) => ({
          ...prev,
          altitude: 360,
          verticalVelocity: -0.4,
          ballonetInflationRatio: 0.45,
          ballonetAirMassKg: 21.6,
          phase: 'INFLATING',
          gearCompression: 0,
        }));
        setIsPumpingAir(true);
        break;
      case 2: // Descent & Wind
        setFlightState((prev) => ({
          ...prev,
          altitude: 220,
          verticalVelocity: -2.6,
          ballonetInflationRatio: 0.82,
          ballonetAirMassKg: 39.4,
          phase: 'DESCENT',
          gearCompression: 0,
        }));
        setIsPumpingAir(true);
        break;
      case 3: // Radar Flare
        setFlightState((prev) => ({
          ...prev,
          altitude: 38,
          verticalVelocity: -0.8,
          ballonetInflationRatio: 0.95,
          ballonetAirMassKg: 45.6,
          phase: 'RADAR_FLARE',
          gearCompression: 0,
        }));
        setIsPumpingAir(false);
        break;
      case 4: // Touchdown
        setFlightState((prev) => ({
          ...prev,
          altitude: 0,
          verticalVelocity: 0,
          ballonetInflationRatio: 1.0,
          ballonetAirMassKg: 48.0,
          phase: 'TOUCHDOWN',
          gearCompression: 1.0,
        }));
        setIsPumpingAir(false);
        break;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950 overflow-hidden">
      {/* 3D Viewport with HUD overlay */}
      <div className="relative flex-1 w-full h-full">
        {/* Interactive 3D Canvas */}
        <BalloonLandingCanvas
          flightState={flightState}
          onUpdateFlightState={setFlightState}
          envelopeMode={envelopeMode}
          selectedMotorId={selectedMotorId}
          onSelectMotor={(id) => setSelectedMotorId(id)}
          cameraPreset={cameraPreset}
          isPlaying={isPlaying}
          autoCompensateWind={autoCompensateWind}
          isPumpingAir={isPumpingAir}
        />

        {/* Telemetry Flight HUD Overlay */}
        <BalloonDescentTelemetryHUD
          flightState={flightState}
          onOpenExplainer={() => setIsExplainerOpen(true)}
          onSelectMotor={(id) => setSelectedMotorId(id)}
        />
      </div>

      {/* Bottom Control Dock */}
      <BalloonDescentControlPanel
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        windSpeed={flightState.windSpeed}
        onWindSpeedChange={(spd) => setFlightState((p) => ({ ...p, windSpeed: spd }))}
        windDirectionDeg={flightState.windDirectionDeg}
        onWindDirectionChange={(dir) => setFlightState((p) => ({ ...p, windDirectionDeg: dir }))}
        isPumpingAir={isPumpingAir}
        onTogglePumping={() => setIsPumpingAir((p) => !p)}
        autoCompensateWind={autoCompensateWind}
        onToggleAutoCompensate={() => setAutoCompensateWind((p) => !p)}
        envelopeMode={envelopeMode}
        onEnvelopeModeChange={setEnvelopeMode}
        onSelectCameraPreset={setCameraPreset}
        onJumpToPhase={handleJumpToPhase}
      />

      {/* Clicked BLDC Motor Inspector Modal */}
      <BldcMotorInspectorModal
        motorId={selectedMotorId}
        onClose={() => setSelectedMotorId(null)}
        telemetry={
          selectedMotorId
            ? {
                rpm: flightState.motorRpms[0] || 4200,
                pitchDeg: flightState.altitude < 45 ? 32 : 18,
                yawDeg: -flightState.windDirectionDeg,
                throttlePct: Math.round(((flightState.motorRpms[0] || 4200) / 9000) * 100),
                currentAmps: Number((((flightState.motorRpms[0] || 4200) / 9000) * 22).toFixed(1)),
                tempC: 38.4,
              }
            : undefined
        }
      />

      {/* Physics Explainer Modal */}
      <BalloonPhysicsExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
};
