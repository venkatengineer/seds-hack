import * as THREE from 'three';

export interface BldcMotorAssembly {
  rootGroup: THREE.Group;
  gimbalPitchGroup: THREE.Group;
  gimbalYawGroup: THREE.Group;
  motorGroup: THREE.Group;
  rotorBell: THREE.Group;
  statorGroup: THREE.Group;
  propellerGroup: THREE.Group;
  propBlurDisc: THREE.Mesh;
  propBlades: THREE.Mesh[];
  thrustParticles: THREE.Points;
  escLed: THREE.Mesh;
  motorId: string;
  updateAnimation: (rpm: number, pitchAngleRad: number, yawAngleRad: number, delta: number) => void;
  setExplodedProgress: (progress: number) => void; // 0 = normal, 1 = exploded
}

export function createBldcMotorAssembly(
  motorId: string,
  options: {
    accentColor?: number;
    propRadius?: number;
    mountArmLength?: number;
  } = {}
): BldcMotorAssembly {
  const accentColor = options.accentColor ?? 0x0284c7; // Aero cyan-blue
  const propRadius = options.propRadius ?? 0.42;

  // Root assembly group
  const rootGroup = new THREE.Group();
  rootGroup.name = `BLDC_${motorId}`;
  rootGroup.userData = { isBldc: true, motorId };

  // Materials
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.85,
    roughness: 0.25,
  });

  const anodizedMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    metalness: 0.9,
    roughness: 0.18,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.95,
    roughness: 0.12,
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    metalness: 0.8,
    roughness: 0.35,
    emissive: 0x78350f,
    emissiveIntensity: 0.25,
  });

  const carbonFiberMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.4,
    roughness: 0.3,
  });

  // 1. Gimbal Base & Yaw Bracket
  const gimbalYawGroup = new THREE.Group();
  gimbalYawGroup.name = 'GimbalYaw';
  rootGroup.add(gimbalYawGroup);

  // Carbon mount arm collar
  const armCollarGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16);
  armCollarGeo.rotateX(Math.PI / 2);
  const armCollar = new THREE.Mesh(armCollarGeo, carbonFiberMat);
  gimbalYawGroup.add(armCollar);

  // Yaw servo housing
  const yawServoGeo = new THREE.BoxGeometry(0.06, 0.05, 0.08);
  const yawServo = new THREE.Mesh(yawServoGeo, titaniumMat);
  yawServo.position.set(0, 0.04, 0);
  gimbalYawGroup.add(yawServo);

  // 2. Gimbal Pitch Pivot
  const gimbalPitchGroup = new THREE.Group();
  gimbalPitchGroup.name = 'GimbalPitch';
  gimbalPitchGroup.position.set(0, 0.08, 0);
  gimbalYawGroup.add(gimbalPitchGroup);

  // CNC Pitch Yoke (U-shaped bracket)
  const yokeLGeo = new THREE.BoxGeometry(0.015, 0.10, 0.02);
  const yokeL = new THREE.Mesh(yokeLGeo, anodizedMat);
  yokeL.position.set(-0.06, 0.04, 0);
  gimbalPitchGroup.add(yokeL);

  const yokeR = yokeL.clone();
  yokeR.position.set(0.06, 0.04, 0);
  gimbalPitchGroup.add(yokeR);

  const yokeCrossGeo = new THREE.BoxGeometry(0.135, 0.018, 0.035);
  const yokeCross = new THREE.Mesh(yokeCrossGeo, anodizedMat);
  yokeCross.position.set(0, -0.01, 0);
  gimbalPitchGroup.add(yokeCross);

  // 3. Motor Core Assembly Group
  const motorGroup = new THREE.Group();
  motorGroup.name = 'MotorCore';
  motorGroup.position.set(0, 0.06, 0);
  gimbalPitchGroup.add(motorGroup);

  // Motor baseplate with mounting holes
  const baseplateGeo = new THREE.CylinderGeometry(0.065, 0.07, 0.015, 24);
  const baseplate = new THREE.Mesh(baseplateGeo, anodizedMat);
  baseplate.position.y = 0;
  motorGroup.add(baseplate);

  // Stator Core Group (internal static parts)
  const statorGroup = new THREE.Group();
  statorGroup.name = 'StatorGroup';
  motorGroup.add(statorGroup);

  // Stator central iron core
  const statorCoreGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.05, 18);
  const statorCore = new THREE.Mesh(statorCoreGeo, titaniumMat);
  statorCore.position.y = 0.032;
  statorGroup.add(statorCore);

  // 12 Copper Wire Coils (stator poles)
  const numPoles = 12;
  for (let i = 0; i < numPoles; i++) {
    const angle = (i / numPoles) * Math.PI * 2;
    const coilGeo = new THREE.BoxGeometry(0.018, 0.042, 0.018);
    const coil = new THREE.Mesh(coilGeo, copperMat);
    const radius = 0.046;
    coil.position.set(Math.cos(angle) * radius, 0.032, Math.sin(angle) * radius);
    coil.rotation.y = -angle;
    statorGroup.add(coil);
  }

  // Bearing rings
  const bearingGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 16);
  const lowerBearing = new THREE.Mesh(bearingGeo, steelMat);
  lowerBearing.position.y = 0.008;
  statorGroup.add(lowerBearing);

  const upperBearing = new THREE.Mesh(bearingGeo, steelMat);
  upperBearing.position.y = 0.058;
  statorGroup.add(upperBearing);

  // Precision 4mm stainless steel shaft
  const shaftGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.12, 16);
  const shaft = new THREE.Mesh(shaftGeo, steelMat);
  shaft.position.y = 0.06;
  statorGroup.add(shaft);

  // 4. Rotor Bell Group (outer rotating assembly)
  const rotorBell = new THREE.Group();
  rotorBell.name = 'RotorBell';
  rotorBell.position.y = 0.035;
  motorGroup.add(rotorBell);

  // Outer bell shell with CNC cooling vent holes
  const bellShellGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.045, 24, 1, true);
  const bellShell = new THREE.Mesh(bellShellGeo, anodizedMat);
  bellShell.position.y = 0.015;
  rotorBell.add(bellShell);

  // Top bell cap with 6 spoke cutouts
  const bellCapGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.012, 24);
  const bellCap = new THREE.Mesh(bellCapGeo, anodizedMat);
  bellCap.position.y = 0.038;
  rotorBell.add(bellCap);

  // Permanent magnet ring lining (14 poles)
  const magnetRingGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.038, 28, 1, true);
  const magnetMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
  const magnetRing = new THREE.Mesh(magnetRingGeo, magnetMat);
  magnetRing.position.y = 0.015;
  rotorBell.add(magnetRing);

  // Center spinner prop lock nut
  const spinnerGeo = new THREE.ConeGeometry(0.022, 0.035, 18);
  const spinner = new THREE.Mesh(spinnerGeo, anodizedMat);
  spinner.position.y = 0.058;
  rotorBell.add(spinner);

  // 5. High-Efficiency Carbon Fiber 3-Blade Propeller
  const propellerGroup = new THREE.Group();
  propellerGroup.name = 'Propeller';
  propellerGroup.position.y = 0.045;
  rotorBell.add(propellerGroup);

  const propBlades: THREE.Mesh[] = [];
  const numBlades = 3;
  for (let i = 0; i < numBlades; i++) {
    const angle = (i / numBlades) * Math.PI * 2;
    // Aerodynamic tapered airfoil blade shape
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.025, 0.05);
    bladeShape.lineTo(0.032, propRadius * 0.7);
    bladeShape.lineTo(0.015, propRadius);
    bladeShape.lineTo(-0.015, propRadius);
    bladeShape.lineTo(-0.022, propRadius * 0.7);
    bladeShape.lineTo(-0.018, 0.05);
    bladeShape.closePath();

    const extrudeSettings = {
      depth: 0.004,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.002,
      bevelThickness: 0.002,
    };
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
    // Twist blade to give realistic aerodynamic pitch angle
    bladeGeo.rotateZ(Math.PI / 2);
    bladeGeo.rotateX(0.18); // Aerodynamic pitch angle

    const bladeMesh = new THREE.Mesh(bladeGeo, carbonFiberMat);
    bladeMesh.rotation.y = angle;
    propellerGroup.add(bladeMesh);
    propBlades.push(bladeMesh);
  }

  // Semi-transparent Prop Blur Disc (appears when spinning fast)
  const blurGeo = new THREE.CircleGeometry(propRadius * 1.02, 32);
  blurGeo.rotateX(-Math.PI / 2);
  const blurMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const propBlurDisc = new THREE.Mesh(blurGeo, blurMat);
  propBlurDisc.position.y = 0.046;
  rotorBell.add(propBlurDisc);

  // 6. 3-Phase Silicone Lead Wires (U, V, W)
  const wireCurveU = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.02, 0.02, -0.04),
    new THREE.Vector3(-0.04, 0.01, -0.06),
    new THREE.Vector3(-0.03, -0.04, -0.07),
    new THREE.Vector3(0, -0.08, -0.08),
  ]);
  const wireGeoU = new THREE.TubeGeometry(wireCurveU, 16, 0.004, 8, false);
  const wireMatU = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }); // Red U-phase
  const wireU = new THREE.Mesh(wireGeoU, wireMatU);
  motorGroup.add(wireU);

  const wireCurveV = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.02, -0.045),
    new THREE.Vector3(0, 0.01, -0.065),
    new THREE.Vector3(0, -0.04, -0.075),
    new THREE.Vector3(0, -0.08, -0.08),
  ]);
  const wireGeoV = new THREE.TubeGeometry(wireCurveV, 16, 0.004, 8, false);
  const wireMatV = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 }); // Yellow V-phase
  const wireV = new THREE.Mesh(wireGeoV, wireMatV);
  motorGroup.add(wireV);

  const wireCurveW = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.02, -0.04),
    new THREE.Vector3(0.04, 0.01, -0.06),
    new THREE.Vector3(0.03, -0.04, -0.07),
    new THREE.Vector3(0, -0.08, -0.08),
  ]);
  const wireGeoW = new THREE.TubeGeometry(wireCurveW, 16, 0.004, 8, false);
  const wireMatW = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }); // Black W-phase
  const wireW = new THREE.Mesh(wireGeoW, wireMatW);
  motorGroup.add(wireW);

  // 7. Electronic Speed Controller (ESC) Module with Heatsink
  const escBoxGeo = new THREE.BoxGeometry(0.045, 0.025, 0.085);
  const escMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
  const escMesh = new THREE.Mesh(escBoxGeo, escMat);
  escMesh.position.set(0, -0.09, -0.05);
  gimbalYawGroup.add(escMesh);

  // ESC status LED indicator
  const escLedGeo = new THREE.SphereGeometry(0.004, 12, 12);
  const escLedMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
  const escLed = new THREE.Mesh(escLedGeo, escLedMat);
  escLed.position.set(0.015, 0.014, 0.03);
  escMesh.add(escLed);

  // 8. Aerodynamic Thrust Vortex Stream Particles
  const particleCount = 120;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  const particleColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const rad = Math.random() * propRadius * 0.9;
    const y = -(Math.random() * 0.8);
    particlePos[i * 3] = Math.cos(angle) * rad;
    particlePos[i * 3 + 1] = y;
    particlePos[i * 3 + 2] = Math.sin(angle) * rad;

    particleColors[i * 3] = 0.2;
    particleColors[i * 3 + 1] = 0.7;
    particleColors[i * 3 + 2] = 1.0;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.018,
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const thrustParticles = new THREE.Points(particleGeo, particleMat);
  thrustParticles.position.y = 0.04;
  gimbalPitchGroup.add(thrustParticles);

  // Tag all meshes with motor metadata for raycasting clicks
  rootGroup.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.userData = { isBldc: true, motorId, rootGroup };
    }
  });

  // Animation controller
  let currentPropAngle = 0;
  const updateAnimation = (rpm: number, pitchAngleRad: number, yawAngleRad: number, delta: number) => {
    // 1. Gimbal vectoring angles
    gimbalPitchGroup.rotation.x = pitchAngleRad;
    gimbalYawGroup.rotation.y = yawAngleRad;

    // 2. Propeller spin rotation
    const rotationSpeed = (rpm / 60) * Math.PI * 2;
    currentPropAngle += rotationSpeed * delta;
    rotorBell.rotation.y = currentPropAngle;

    // 3. Motion blur disc visibility according to RPM
    if (rpm > 1200) {
      const normalizedRpm = Math.min(1.0, (rpm - 1200) / 6000);
      blurMat.opacity = 0.25 + normalizedRpm * 0.45;
      particleMat.opacity = normalizedRpm * 0.7;
    } else {
      blurMat.opacity = 0.0;
      particleMat.opacity = 0.0;
    }

    // 4. ESC LED pulse
    if (rpm > 100) {
      const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
      escLedMat.color.setHex(pulse > 0.5 ? 0x06b6d4 : 0x10b981);
    } else {
      escLedMat.color.setHex(0x10b981);
    }

    // 5. Animate vortex particle stream downwards
    if (rpm > 500) {
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] -= delta * 1.8 * (rpm / 4000);
        if (positions[i * 3 + 1] < -0.9) {
          positions[i * 3 + 1] = 0.02;
          const angle = Math.random() * Math.PI * 2;
          const rad = Math.random() * propRadius * 0.85;
          positions[i * 3] = Math.cos(angle) * rad;
          positions[i * 3 + 2] = Math.sin(angle) * rad;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;
    }
  };

  // Exploded view animation state
  const setExplodedProgress = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    rotorBell.position.y = 0.035 + p * 0.12;
    statorGroup.position.y = -p * 0.04;
    propellerGroup.position.y = 0.045 + p * 0.08;
    escMesh.position.z = -0.05 - p * 0.06;
  };

  return {
    rootGroup,
    gimbalPitchGroup,
    gimbalYawGroup,
    motorGroup,
    rotorBell,
    statorGroup,
    propellerGroup,
    propBlurDisc,
    propBlades,
    thrustParticles,
    escLed,
    motorId,
    updateAnimation,
    setExplodedProgress,
  };
}
