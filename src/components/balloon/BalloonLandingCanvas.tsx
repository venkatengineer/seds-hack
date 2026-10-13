import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBalloonAssembly, BalloonAssembly } from './balloonModelBuilder';
import { BalloonFlightState } from './BalloonDescentTelemetryHUD';

interface BalloonLandingCanvasProps {
  flightState: BalloonFlightState;
  onUpdateFlightState: (updater: (prev: BalloonFlightState) => BalloonFlightState) => void;
  envelopeMode: 'cutaway' | 'solid' | 'wireframe';
  selectedMotorId: string | null;
  onSelectMotor: (motorId: string) => void;
  cameraPreset: 'overview' | 'ballonet' | 'bldc' | 'landing';
  isPlaying: boolean;
  autoCompensateWind: boolean;
  isPumpingAir: boolean;
}

export const BalloonLandingCanvas: React.FC<BalloonLandingCanvasProps> = ({
  flightState,
  onUpdateFlightState,
  envelopeMode,
  selectedMotorId,
  onSelectMotor,
  cameraPreset,
  isPlaying,
  autoCompensateWind,
  isPumpingAir,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const balloonAssemblyRef = useRef<BalloonAssembly | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hoveredMotorRef = useRef<string | null>(null);
  const [hoveredMotorId, setHoveredMotorId] = useState<string | null>(null);

  // Target camera offset relative to the balloon vehicle
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(12, 10, 18));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 0));

  // Wind streamline particles reference
  const windParticlesRef = useRef<THREE.Points | null>(null);

  // Force vector arrows
  const arrowBuoyancyRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowGravityRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowWindRef = useRef<THREE.ArrowHelper | null>(null);
  const arrowThrustRef = useRef<THREE.ArrowHelper | null>(null);

  // Synchronize camera presets
  useEffect(() => {
    switch (cameraPreset) {
      case 'overview':
        targetCamPosRef.current.set(14, 12, 19);
        targetLookAtRef.current.set(0, 3.5, 0);
        break;
      case 'ballonet':
        targetCamPosRef.current.set(2.5, 4.2, 5.0);
        targetLookAtRef.current.set(0, 4.2, 0);
        break;
      case 'bldc':
        targetCamPosRef.current.set(2.8, 1.4, 2.8);
        targetLookAtRef.current.set(0, 0.4, 0);
        break;
      case 'landing':
        targetCamPosRef.current.set(4.0, 0.8, 4.0);
        targetLookAtRef.current.set(0, -0.2, 0);
        break;
    }
  }, [cameraPreset]);

  // Main Three.js Scene Setup & Animation Loop
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050811);
    scene.fog = new THREE.FogExp2(0x050811, 0.012);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(14, 12, 19);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRefCurrentDom: mountRef.current.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 120;
    controls.minDistance = 2.0;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't flip below ground
    controlsRef.current = controls;

    // =========================================================================
    // 1. LIGHTING
    // =========================================================================
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x090d16, 1.2);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(20, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 120;
    const d = 25;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const groundReflectLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    groundReflectLight.position.set(-20, -5, -20);
    scene.add(groundReflectLight);

    // =========================================================================
    // 2. RECOVERY TARGET LANDING PAD ENVIRONMENT
    // =========================================================================
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);

    // Wide terrain base
    const terrainGeo = new THREE.PlaneGeometry(160, 160, 40, 40);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.85,
      metalness: 0.1,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -0.02;
    terrainMesh.receiveShadow = true;
    terrainGroup.add(terrainMesh);

    // Circular Landing Grid
    const landingGrid = new THREE.GridHelper(80, 40, 0x0284c7, 0x1e293b);
    landingGrid.position.y = 0.001;
    terrainGroup.add(landingGrid);

    // Aerospace Landing Bullseye (Concentric Rings & Touchdown Markers)
    const ringRadii = [2.5, 6.0, 12.0, 20.0];
    ringRadii.forEach((radius, idx) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.08, radius + 0.08, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 0 ? 0x38bdf8 : idx === 1 ? 0x0284c7 : 0x1e293b,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.005;
      terrainGroup.add(ringMesh);
    });

    // Central Touchdown 'H' Marker
    const hBarMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const hBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.4), hBarMat);
    hBar1.position.set(-0.8, 0.01, 0);
    const hBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 2.4), hBarMat);
    hBar2.position.set(0.8, 0.01, 0);
    const hCross = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.35), hBarMat);
    hCross.position.set(0, 0.01, 0);
    terrainGroup.add(hBar1, hBar2, hCross);

    // Runway Perimeter Strobe LED beacons around the pad
    const beaconCount = 12;
    for (let i = 0; i < beaconCount; i++) {
      const angle = (i / beaconCount) * Math.PI * 2;
      const r = 20.0;
      const bPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155 })
      );
      bPost.position.set(Math.cos(angle) * r, 0.2, Math.sin(angle) * r);
      const bLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
      );
      bLight.position.set(0, 0.22, 0);
      bPost.add(bLight);
      terrainGroup.add(bPost);
    }

    // =========================================================================
    // 3. WIND STREAMLINE PARTICLES
    // =========================================================================
    const particleCount = 450;
    const windGeo = new THREE.BufferGeometry();
    const windPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      windPos[i * 3] = (Math.random() - 0.5) * 60;
      windPos[i * 3 + 1] = 0.5 + Math.random() * 30;
      windPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
    const windMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.4,
    });
    const windPoints = new THREE.Points(windGeo, windMat);
    scene.add(windPoints);
    windParticlesRef.current = windPoints;

    // =========================================================================
    // 4. BALLOON VEHICLE ASSEMBLY
    // =========================================================================
    const balloonAssembly = createBalloonAssembly();
    balloonAssemblyRef.current = balloonAssembly;
    scene.add(balloonAssembly.rootGroup);

    // =========================================================================
    // 5. 3D FORCE VECTOR ARROWS (Floating beside the gondola)
    // =========================================================================
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    // Buoyancy (Up - Emerald)
    const arrowBuoyancy = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      arrowOrigin,
      2.5,
      0x10b981,
      0.4,
      0.25
    );
    // Gravity (Down - Rose)
    const arrowGravity = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      arrowOrigin,
      2.2,
      0xf43f5e,
      0.4,
      0.25
    );
    // Wind Force (Downwind - Sky Blue)
    const arrowWind = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      arrowOrigin,
      1.8,
      0x0ea5e9,
      0.35,
      0.2
    );
    // BLDC Counter-Thrust (Orange)
    const arrowThrust = new THREE.ArrowHelper(
      new THREE.Vector3(-1, 0, 0),
      arrowOrigin,
      1.8,
      0xf59e0b,
      0.35,
      0.2
    );

    scene.add(arrowBuoyancy, arrowGravity, arrowWind, arrowThrust);
    arrowBuoyancyRef.current = arrowBuoyancy;
    arrowGravityRef.current = arrowGravity;
    arrowWindRef.current = arrowWind;
    arrowThrustRef.current = arrowThrust;

    // =========================================================================
    // 6. RAYCASTING INTERACTION FOR CLICKING BLDC MOTORS
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(balloonAssembly.rootGroup.children, true);

      let foundMotor: string | null = null;
      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== balloonAssembly.rootGroup) {
          if (cur.userData && cur.userData.isBldc && cur.userData.motorId) {
            foundMotor = cur.userData.motorId;
            break;
          }
          cur = cur.parent;
        }
        if (foundMotor) break;
      }

      if (foundMotor !== hoveredMotorRef.current) {
        hoveredMotorRef.current = foundMotor;
        setHoveredMotorId(foundMotor);
        renderer.domElement.style.cursor = foundMotor ? 'pointer' : 'default';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(balloonAssembly.rootGroup.children, true);

      for (const hit of intersects) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur && cur !== balloonAssembly.rootGroup) {
          if (cur.userData && cur.userData.isBldc && cur.userData.motorId) {
            onSelectMotor(cur.userData.motorId);
            return;
          }
          cur = cur.parent;
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('click', onClick);

    // =========================================================================
    // 7. ANIMATION & PHYSICS INTEGRATION LOOP
    // =========================================================================
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera smooth target interpolation
      const vehicleRoot = balloonAssembly.rootGroup;
      const centerTarget = new THREE.Vector3(
        vehicleRoot.position.x + targetLookAtRef.current.x,
        vehicleRoot.position.y + targetLookAtRef.current.y,
        vehicleRoot.position.z + targetLookAtRef.current.z
      );
      controls.target.lerp(centerTarget, 0.06);

      // Animate wind streamline particles
      if (windParticlesRef.current) {
        const positions = windGeo.attributes.position.array as Float32Array;
        const windRad = (flightState.windDirectionDeg * Math.PI) / 180;
        const wx = Math.sin(windRad) * (flightState.windSpeed * 0.8 + 0.5) * delta;
        const wz = Math.cos(windRad) * (flightState.windSpeed * 0.8 + 0.5) * delta;

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3] += wx * 8;
          positions[i * 3 + 2] += wz * 8;

          if (Math.abs(positions[i * 3]) > 35) positions[i * 3] = -positions[i * 3] * 0.95;
          if (Math.abs(positions[i * 3 + 2]) > 35) positions[i * 3 + 2] = -positions[i * 3 + 2] * 0.95;
        }
        windGeo.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, []);

  // Update Envelope Cutaway mode when changed
  useEffect(() => {
    if (balloonAssemblyRef.current) {
      balloonAssemblyRef.current.setEnvelopeCutaway(envelopeMode);
    }
  }, [envelopeMode]);

  // Main Physics Tick & Model Synchronizer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!balloonAssemblyRef.current) return;

      onUpdateFlightState((prev) => {
        if (!isPlaying) {
          // If paused, keep visual 3D position synced
          return prev;
        }

        const dt = 0.06; // 60ms physics sub-step
        let newInflation = prev.ballonetInflationRatio;
        let newAirMass = prev.ballonetAirMassKg;
        let isCompressorRunning = isPumpingAir;

        // 1. Ballonet Air Compressor Pumping Dynamics
        // When pumping, air is drawn from ambient atmosphere into the ballonet bladder
        if (isPumpingAir && newInflation < 1.0) {
          // Pumping rate: ~0.8 kg/s of ambient air
          newAirMass = Math.min(48.0, newAirMass + 0.9 * dt);
          newInflation = Math.min(1.0, newAirMass / 48.0);
        }

        // 2. Variable-Buoyancy Vertical Dynamics
        const dryMass = 68.0;
        const totalMass = dryMass + newAirMass;
        const heliumLiftEquivalent = 105.0; // Helium displacement lift
        const netBuoyantForceKg = heliumLiftEquivalent - totalMass;

        let newAlt = prev.altitude;
        let newVsi = prev.verticalVelocity;
        let phase = prev.phase;
        let gearComp = prev.gearCompression;

        if (newAlt > 0) {
          // Accelerate downwards when net force is negative (gravity > buoyancy)
          const targetDescentRate = netBuoyantForceKg < 0 ? -1.8 - (Math.abs(netBuoyantForceKg) / 25) * 1.6 : 0;
          
          // Terminal flare deceleration when altitude < 45m AGL
          let commandedVsi = targetDescentRate;
          if (newAlt < 45) {
            // Radar Flare cushions touchdown
            commandedVsi = Math.max(-0.75, targetDescentRate * 0.35);
            phase = 'RADAR_FLARE';
          } else if (newInflation > 0.15) {
            phase = 'DESCENT';
          } else if (isPumpingAir) {
            phase = 'INFLATING';
          } else {
            phase = 'FLOAT';
          }

          // Inertial velocity smoothing
          newVsi = THREE.MathUtils.lerp(newVsi, commandedVsi, 0.12);
          newAlt = Math.max(0, newAlt + newVsi * dt * 4.5); // Scaled time rate for visual smoothness
        } else {
          // Touchdown
          newAlt = 0;
          newVsi = 0;
          phase = 'TOUCHDOWN';
          gearComp = Math.min(1.0, gearComp + dt * 2.0); // Compress landing gear
          isCompressorRunning = false;
        }

        // 3. Wind Drift & BLDC Counter-Thrust Vectoring
        const windRad = (prev.windDirectionDeg * Math.PI) / 180;
        const windDriftSpeed = prev.windSpeed;
        let offsetX = prev.horizontalOffset.x;
        let offsetZ = prev.horizontalOffset.z;

        // Motor RPM & Gimbal Angles
        let motorRpms = [0, 0, 0, 0];
        let gimbalPitch = 0;
        let gimbalYaw = -windRad; // Vector thrust directly into the wind

        if (newAlt > 0) {
          if (autoCompensateWind) {
            // Autopilot actively cancels drift vector
            const requiredRpm = Math.min(8800, Math.round(2200 + (windDriftSpeed / 25) * 5500));
            // During radar flare, motors add vertical lift flare
            const flareRpm = newAlt < 45 ? 1800 : 0;
            const finalRpm = Math.min(9000, requiredRpm + flareRpm);
            motorRpms = [finalRpm, finalRpm, finalRpm, finalRpm];

            gimbalPitch = THREE.MathUtils.degToRad(newAlt < 45 ? 32 : 18);
            // Counter-drift PID smoothly drives offset to center (0,0)
            offsetX = THREE.MathUtils.lerp(offsetX, 0, 0.08);
            offsetZ = THREE.MathUtils.lerp(offsetZ, 0, 0.08);
          } else {
            // No auto compensation: balloon drifts downwind!
            motorRpms = [800, 800, 800, 800];
            const driftDx = Math.sin(windRad) * windDriftSpeed * dt * 0.8;
            const driftDz = Math.cos(windRad) * windDriftSpeed * dt * 0.8;
            offsetX += driftDx;
            offsetZ += driftDz;
          }
        } else {
          // Landed on pad
          motorRpms = [0, 0, 0, 0];
        }

        // =====================================================================
        // Sync with Three.js 3D Model
        // =====================================================================
        const b = balloonAssemblyRef.current;
        if (b) {
          // Position balloon vehicle in 3D scene (scale altitude to 0..16)
          const sceneY = (newAlt / 400) * 14.0 + 0.35;
          const sceneX = (offsetX / 50) * 10;
          const sceneZ = (offsetZ / 50) * 10;
          b.rootGroup.position.set(sceneX, sceneY, sceneZ);

          // Update ballonet inflation scale
          b.setBallonetInflationRatio(newInflation);

          // Update landing gear hydraulic compression
          b.setLandingCompression(gearComp);

          // Update 4 BLDC Motors
          b.bldcMotors.forEach((m, idx) => {
            m.updateAnimation(motorRpms[idx] ?? 0, gimbalPitch, gimbalYaw, dt);
          });

          // Update envelope beacon, compressor particles, radar cone
          b.updateBalloonAnimation(dt, isCompressorRunning, newAlt < 45 && newAlt > 0);

          // Update 3D Force Vector Arrows
          if (
            arrowBuoyancyRef.current &&
            arrowGravityRef.current &&
            arrowWindRef.current &&
            arrowThrustRef.current
          ) {
            const gondolaPos = new THREE.Vector3(sceneX, sceneY + 0.3, sceneZ);
            arrowBuoyancyRef.current.position.copy(gondolaPos);
            arrowGravityRef.current.position.copy(gondolaPos);
            arrowWindRef.current.position.copy(gondolaPos);
            arrowThrustRef.current.position.copy(gondolaPos);

            // Gravity arrow length grows with pumped air mass
            const gravLen = Math.max(1.0, (totalMass / 105.0) * 3.0);
            arrowGravityRef.current.setLength(gravLen, 0.35, 0.2);

            // Wind arrow
            const windDirVec = new THREE.Vector3(Math.sin(windRad), 0, Math.cos(windRad)).normalize();
            arrowWindRef.current.setDirection(windDirVec);
            arrowWindRef.current.setLength(Math.max(0.6, (windDriftSpeed / 25) * 3.5), 0.35, 0.2);

            // Thrust arrow points opposite to wind
            const thrustDirVec = windDirVec.clone().negate();
            if (newAlt < 45) thrustDirVec.y += 0.4;
            thrustDirVec.normalize();
            arrowThrustRef.current.setDirection(thrustDirVec);
            arrowThrustRef.current.setLength(
              autoCompensateWind ? Math.max(0.6, (motorRpms[0] / 8000) * 3.5) : 0.2,
              0.35,
              0.2
            );
          }
        }

        return {
          ...prev,
          altitude: newAlt,
          verticalVelocity: newVsi,
          ballonetInflationRatio: newInflation,
          ballonetAirMassKg: newAirMass,
          horizontalOffset: { x: offsetX, z: offsetZ },
          phase,
          compressorActive: isCompressorRunning,
          radarActive: newAlt < 45 && newAlt > 0,
          gearCompression: gearComp,
          motorRpms,
        };
      });
    }, 60);

    return () => clearInterval(timer);
  }, [isPlaying, isPumpingAir, autoCompensateWind, onUpdateFlightState]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Three.js Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Hover Indicator when hovering over a BLDC Motor */}
      {hoveredMotorId && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1.5 rounded-full bg-sky-950/90 border border-sky-400 text-sky-200 text-xs font-mono shadow-lg shadow-sky-950/80 flex items-center space-x-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>CLICK {hoveredMotorId} FOR 3D CAD, EXPLODED VIEW &amp; DYNO TEST</span>
        </div>
      )}

      {/* 3D Force Vectors Legend (Floating Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden md:flex flex-col space-y-1 bg-slate-950/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-800/80 text-[10px] font-mono shadow-lg">
        <span className="text-slate-400 font-bold mb-0.5">3D FORCE VECTORS</span>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-1 bg-emerald-500 rounded" />
          <span className="text-emerald-400">Buoyancy Force (F_B)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-1 bg-rose-500 rounded" />
          <span className="text-rose-400">Gravity + Air Mass (F_g)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-1 bg-sky-400 rounded" />
          <span className="text-sky-300">Wind Aerodynamic Drag</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-1 bg-amber-400 rounded" />
          <span className="text-amber-300">BLDC Vectoring Counter-Thrust</span>
        </div>
      </div>
    </div>
  );
};
