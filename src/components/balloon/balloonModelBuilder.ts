import * as THREE from 'three';
import { createBldcMotorAssembly, BldcMotorAssembly } from './bldcModelBuilder';

export interface BalloonAssembly {
  rootGroup: THREE.Group;
  envelopeGroup: THREE.Group;
  envelopeOuterMesh: THREE.Mesh;
  envelopeCutawayMesh: THREE.Mesh;
  ballonetMesh: THREE.Mesh;
  ballonetGroup: THREE.Group;
  pumpIntakeParticles: THREE.Points;
  gondolaGroup: THREE.Group;
  landingLegsGroup: THREE.Group;
  landingPistons: THREE.Mesh[];
  radarScanCone: THREE.Mesh;
  recoveryBeaconLight: THREE.PointLight;
  recoveryBeaconMesh: THREE.Mesh;
  bldcMotors: BldcMotorAssembly[];
  setBallonetInflationRatio: (ratio: number) => void; // 0.0 to 1.0
  setEnvelopeCutaway: (mode: 'cutaway' | 'solid' | 'wireframe') => void;
  setLandingCompression: (compressedAmount: number) => void; // 0 = extended, 1 = fully compressed
  updateBalloonAnimation: (delta: number, isPumping: boolean, isRadarActive: boolean) => void;
}

export function createBalloonAssembly(): BalloonAssembly {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AerospaceBalloonRecoveryVehicle';

  // =========================================================================
  // 1. BALLOON ENVELOPE (Stratospheric Zero-Pressure / Super-Pressure Profile)
  // =========================================================================
  const envelopeGroup = new THREE.Group();
  envelopeGroup.name = 'BalloonEnvelopeGroup';
  // Position balloon center higher up relative to the gondola
  envelopeGroup.position.set(0, 4.2, 0);
  rootGroup.add(envelopeGroup);

  // Generate teardrop balloon envelope profile curve
  const envelopePoints: THREE.Vector2[] = [];
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 = apex (top), 1 = base (bottom)
    const y = (1 - t) * 5.2 - 2.0; // Y from +3.2 to -2.0
    // Natural teardrop equation: wider near upper-mid, tapering down to narrow base
    let r = 0;
    if (t < 0.35) {
      // Top dome
      r = Math.sin((t / 0.35) * (Math.PI / 2)) * 2.4;
    } else {
      // Tapering lower cone
      const taper = (t - 0.35) / 0.65;
      r = 2.4 * Math.cos(taper * (Math.PI / 2.2));
    }
    r = Math.max(0.18, r);
    envelopePoints.push(new THREE.Vector2(r, y));
  }

  const envelopeGeometry = new THREE.LatheGeometry(envelopePoints, 36);

  // Outer Envelope Material (Translucent UV-stabilized Polyethylene film)
  const outerEnvelopeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    transmission: 0.65, // Translucent to clearly reveal the internal ballonet!
    thickness: 0.4,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    reflectivity: 0.8,
    clearcoat: 0.4,
  });

  const envelopeOuterMesh = new THREE.Mesh(envelopeGeometry, outerEnvelopeMat);
  envelopeOuterMesh.name = 'EnvelopeOuterSkin';
  envelopeGroup.add(envelopeOuterMesh);

  // Cutaway Half Mesh (for explicit sectional inspection)
  const cutawayGeometry = new THREE.LatheGeometry(envelopePoints, 36, 0, Math.PI * 1.25);
  const cutawayMat = outerEnvelopeMat.clone();
  cutawayMat.opacity = 0.85;
  cutawayMat.transmission = 0.15;
  const envelopeCutawayMesh = new THREE.Mesh(cutawayGeometry, cutawayMat);
  envelopeCutawayMesh.name = 'EnvelopeCutawaySkin';
  envelopeCutawayMesh.visible = false;
  envelopeGroup.add(envelopeCutawayMesh);

  // Gore vertical reinforcing load tapes (rib lines around the balloon)
  const numGores = 18;
  const goreLinesGroup = new THREE.Group();
  for (let g = 0; g < numGores; g++) {
    const angle = (g / numGores) * Math.PI * 2;
    const curvePoints = envelopePoints.map(p => {
      return new THREE.Vector3(Math.cos(angle) * (p.x * 1.002), p.y, Math.sin(angle) * (p.x * 1.002));
    });
    const goreCurve = new THREE.CatmullRomCurve3(curvePoints);
    const goreGeo = new THREE.TubeGeometry(goreCurve, 32, 0.008, 6, false);
    const goreMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.5 });
    const goreMesh = new THREE.Mesh(goreGeo, goreMat);
    goreLinesGroup.add(goreMesh);
  }
  envelopeGroup.add(goreLinesGroup);

  // Structural Apex Cap (top crown plate)
  const apexCapGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.08, 24);
  const apexMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 }); // Gold anodized
  const apexCap = new THREE.Mesh(apexCapGeo, apexMat);
  apexCap.position.y = 3.22;
  envelopeGroup.add(apexCap);

  // Helium rapid-deflation rip-panel outline (red recovery marker)
  const ripPanelGeo = new THREE.BoxGeometry(0.04, 1.2, 0.25);
  const ripPanelMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const ripPanel = new THREE.Mesh(ripPanelGeo, ripPanelMat);
  ripPanel.position.set(1.9, 1.2, 0);
  envelopeGroup.add(ripPanel);

  // =========================================================================
  // 2. INTERNAL BALLONET (AIR BAG / BLADDER INSIDE THE ENVELOPE)
  // =========================================================================
  // This is the core variable-buoyancy mechanism: pumping ambient air into this
  // internal bladder increases overall vehicle mass and density, causing descent!
  const ballonetGroup = new THREE.Group();
  ballonetGroup.name = 'InternalBallonetAirBagGroup';
  // Positioned in the lower chamber of the envelope
  ballonetGroup.position.set(0, -0.6, 0);
  envelopeGroup.add(ballonetGroup);

  // Ballonet bladder mesh (high-visibility Ripstop fabric)
  const ballonetGeometry = new THREE.SphereGeometry(1.4, 32, 28);
  // Deform sphere to look like a flexible bladder inside the tapered lower balloon
  ballonetGeometry.scale(1.0, 1.25, 1.0);

  const ballonetMaterial = new THREE.MeshStandardMaterial({
    color: 0xf97316, // High-visibility Aerospace International Orange
    roughness: 0.45,
    metalness: 0.15,
    emissive: 0xc2410c,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.88,
  });

  const ballonetMesh = new THREE.Mesh(ballonetGeometry, ballonetMaterial);
  ballonetMesh.name = 'BallonetAirBladder';
  ballonetGroup.add(ballonetMesh);

  // Ballonet internal pressure seam ribs
  const ballonetWireGeo = new THREE.WireframeGeometry(ballonetGeometry);
  const ballonetWireMat = new THREE.LineBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.4 });
  const ballonetWire = new THREE.LineSegments(ballonetWireGeo, ballonetWireMat);
  ballonetMesh.add(ballonetWire);

  // Flexible air duct pipe connecting payload compressor to ballonet
  const ductCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -2.1, 0),
    new THREE.Vector3(0.05, -1.8, 0.05),
    new THREE.Vector3(0, -1.4, 0),
    new THREE.Vector3(0, -0.8, 0),
  ]);
  const ductGeo = new THREE.TubeGeometry(ductCurve, 20, 0.055, 12, false);
  const ductMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.5 });
  const airDuct = new THREE.Mesh(ductGeo, ductMat);
  envelopeGroup.add(airDuct);

  // Ambient Air Intake Streamline Particles (visualizing air pumping into ballonet)
  const intakeCount = 100;
  const intakeGeo = new THREE.BufferGeometry();
  const intakePos = new Float32Array(intakeCount * 3);
  const intakeColors = new Float32Array(intakeCount * 3);

  for (let i = 0; i < intakeCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.4 + Math.random() * 0.8;
    const y = -2.2 - Math.random() * 0.9;
    intakePos[i * 3] = Math.cos(angle) * r;
    intakePos[i * 3 + 1] = y;
    intakePos[i * 3 + 2] = Math.sin(angle) * r;

    intakeColors[i * 3] = 0.2;
    intakeColors[i * 3 + 1] = 0.8;
    intakeColors[i * 3 + 2] = 1.0;
  }
  intakeGeo.setAttribute('position', new THREE.BufferAttribute(intakePos, 3));
  intakeGeo.setAttribute('color', new THREE.BufferAttribute(intakeColors, 3));

  const intakeMat = new THREE.PointsMaterial({
    size: 0.028,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pumpIntakeParticles = new THREE.Points(intakeGeo, intakeMat);
  envelopeGroup.add(pumpIntakeParticles);

  // =========================================================================
  // 3. SUSPENSION RIGGING (Vectran Load Lines to Payload)
  // =========================================================================
  const riggingGroup = new THREE.Group();
  riggingGroup.name = 'SuspensionRigging';
  rootGroup.add(riggingGroup);

  const numRiggingLines = 8;
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xcbd5e1 });
  for (let r = 0; r < numRiggingLines; r++) {
    const angle = (r / numRiggingLines) * Math.PI * 2;
    const topPt = new THREE.Vector3(Math.cos(angle) * 0.55, 2.1, Math.sin(angle) * 0.55);
    const botPt = new THREE.Vector3(Math.cos(angle) * 0.48, 0.45, Math.sin(angle) * 0.48);
    const lineCurve = new THREE.LineCurve3(topPt, botPt);
    const lineGeo = new THREE.TubeGeometry(lineCurve, 8, 0.006, 6, false);
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    riggingGroup.add(lineMesh);
  }

  // =========================================================================
  // 4. SCIENTIFIC PAYLOAD & RECOVERY GONDOLA
  // =========================================================================
  const gondolaGroup = new THREE.Group();
  gondolaGroup.name = 'ScientificPayloadGondola';
  gondolaGroup.position.set(0, 0, 0);
  rootGroup.add(gondolaGroup);

  // Carbon fiber truss chassis box
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
  const chassisGeo = new THREE.BoxGeometry(0.9, 0.5, 0.9);
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
  chassisMesh.position.y = 0.25;
  gondolaGroup.add(chassisMesh);

  // Avionics electronics bay transparent face
  const avionicsWindowGeo = new THREE.BoxGeometry(0.82, 0.38, 0.02);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, transmission: 0.9, roughness: 0.1, transparent: true });
  const avionicsWindow = new THREE.Mesh(avionicsWindowGeo, glassMat);
  avionicsWindow.position.set(0, 0.25, 0.46);
  gondolaGroup.add(avionicsWindow);

  // Electric Centrifugal Air Compressor (pumps ambient air into ballonet)
  const pumpHousingGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.22, 20);
  const pumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.2 });
  const pumpHousing = new THREE.Mesh(pumpHousingGeo, pumpMat);
  pumpHousing.position.set(0, 0.55, 0);
  gondolaGroup.add(pumpHousing);

  // Air intake filter bellmouth
  const bellmouthGeo = new THREE.TorusGeometry(0.12, 0.03, 12, 24);
  bellmouthGeo.rotateX(Math.PI / 2);
  const bellmouth = new THREE.Mesh(bellmouthGeo, apexMat);
  bellmouth.position.set(0, 0.68, 0);
  gondolaGroup.add(bellmouth);

  // Emergency Recovery Parachute Canister (cylindrical canister on side)
  const chuteCanisterGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.42, 16);
  const chuteCanisterMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.7 });
  const chuteCanister = new THREE.Mesh(chuteCanisterGeo, chuteCanisterMat);
  chuteCanister.position.set(-0.48, 0.28, 0);
  gondolaGroup.add(chuteCanister);

  // Iridium Satellite Tracker Antenna & GPS Dome
  const gpsDomeGeo = new THREE.SphereGeometry(0.06, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const gpsMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const gpsDome = new THREE.Mesh(gpsDomeGeo, gpsMat);
  gpsDome.position.set(0.32, 0.51, 0.32);
  gondolaGroup.add(gpsDome);

  // High-intensity Xenon Recovery Strobe Beacon
  const strobeMastGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 12);
  const strobeMast = new THREE.Mesh(strobeMastGeo, chassisMat);
  strobeMast.position.set(0.35, 0.65, -0.35);
  gondolaGroup.add(strobeMast);

  const beaconGeo = new THREE.SphereGeometry(0.035, 16, 16);
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.5,
  });
  const recoveryBeaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  recoveryBeaconMesh.position.set(0.35, 0.82, -0.35);
  gondolaGroup.add(recoveryBeaconMesh);

  const recoveryBeaconLight = new THREE.PointLight(0xffffff, 2.5, 15);
  recoveryBeaconLight.position.set(0.35, 0.85, -0.35);
  gondolaGroup.add(recoveryBeaconLight);

  // Ground Proximity Radar Altimeter & Scanning Cone
  const radarSensorGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 16);
  const radarSensor = new THREE.Mesh(radarSensorGeo, apexMat);
  radarSensor.position.set(0, -0.02, 0);
  gondolaGroup.add(radarSensor);

  // Animated downward radar scanning cone
  const scanConeGeo = new THREE.ConeGeometry(1.6, 3.8, 24, 1, true);
  scanConeGeo.rotateX(Math.PI);
  const scanConeMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const radarScanCone = new THREE.Mesh(scanConeGeo, scanConeMat);
  radarScanCone.position.set(0, -1.9, 0);
  gondolaGroup.add(radarScanCone);

  // =========================================================================
  // 5. SHOCK-ABSORBING LANDING GEAR (4x Articulated Struts with Honeycomb Pads)
  // =========================================================================
  const landingLegsGroup = new THREE.Group();
  landingLegsGroup.name = 'ShockAbsorbingLandingGear';
  gondolaGroup.add(landingLegsGroup);

  const landingPistons: THREE.Mesh[] = [];
  const legAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];

  legAngles.forEach((angle, idx) => {
    const legArm = new THREE.Group();
    legArm.rotation.y = angle;
    landingLegsGroup.add(legArm);

    // Upper cylinder / shock body
    const shockBodyGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12);
    shockBodyGeo.rotateZ(0.45); // Splayed outwards for stable stance
    const shockBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const shockBody = new THREE.Mesh(shockBodyGeo, shockBodyMat);
    shockBody.position.set(0.48, 0.12, 0);
    legArm.add(shockBody);

    // Telescopic lower piston rod
    const pistonGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.32, 12);
    pistonGeo.rotateZ(0.45);
    const pistonMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 });
    const piston = new THREE.Mesh(pistonGeo, pistonMat);
    piston.position.set(0.58, -0.06, 0);
    piston.name = `LandingPiston_${idx}`;
    legArm.add(piston);
    landingPistons.push(piston);

    // Honeycomb footpad (wide circular pad for soft terrain landing)
    const footpadGeo = new THREE.CylinderGeometry(0.09, 0.095, 0.02, 16);
    const footpadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const footpad = new THREE.Mesh(footpadGeo, footpadMat);
    footpad.position.set(0.68, -0.21, 0);
    legArm.add(footpad);
  });

  // =========================================================================
  // 6. QUAD VECTORABLE BLDC PROPULSION UNITS (4x Symmetrical Thrust Pods)
  // =========================================================================
  const bldcMotors: BldcMotorAssembly[] = [];
  const motorPositions = [
    { id: 'MOT-01-FWD', angle: 0, x: 0, z: 1.15, label: 'Forward Thruster' },
    { id: 'MOT-02-RIGHT', angle: -Math.PI / 2, x: 1.15, z: 0, label: 'Starboard Thruster' },
    { id: 'MOT-03-AFT', angle: Math.PI, x: 0, z: -1.15, label: 'Aft Thruster' },
    { id: 'MOT-04-LEFT', angle: Math.PI / 2, x: -1.15, z: 0, label: 'Port Thruster' },
  ];

  motorPositions.forEach((posConfig, idx) => {
    // Carbon fiber outrigger boom arm
    const armCurve = new THREE.LineCurve3(
      new THREE.Vector3(posConfig.x * 0.3, 0.24, posConfig.z * 0.3),
      new THREE.Vector3(posConfig.x, 0.24, posConfig.z)
    );
    const armGeo = new THREE.TubeGeometry(armCurve, 8, 0.024, 12, false);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const armMesh = new THREE.Mesh(armGeo, armMat);
    gondolaGroup.add(armMesh);

    // Create precision BLDC motor assembly
    const bldc = createBldcMotorAssembly(posConfig.id, {
      accentColor: idx % 2 === 0 ? 0x0284c7 : 0x06b6d4,
      propRadius: 0.38,
    });
    bldc.rootGroup.position.set(posConfig.x, 0.24, posConfig.z);
    bldc.rootGroup.rotation.y = posConfig.angle;
    gondolaGroup.add(bldc.rootGroup);
    bldcMotors.push(bldc);
  });

  // =========================================================================
  // CONTROL API
  // =========================================================================

  // Dynamic ballonet volume scaling
  const setBallonetInflationRatio = (ratio: number) => {
    const r = Math.max(0.12, Math.min(1.0, ratio));
    // When empty (0), ballonet is a small deflated bladder (scale ~0.2)
    // When full (1), ballonet expands to fill the lower chamber (scale ~1.0)
    const scaleFactor = 0.22 + r * 0.78;
    ballonetGroup.scale.set(scaleFactor, scaleFactor * 1.1, scaleFactor);
    ballonetMaterial.opacity = 0.65 + r * 0.32;
  };

  // Envelope display mode
  const setEnvelopeCutaway = (mode: 'cutaway' | 'solid' | 'wireframe') => {
    if (mode === 'cutaway') {
      envelopeOuterMesh.visible = false;
      envelopeCutawayMesh.visible = true;
      (envelopeCutawayMesh.material as THREE.MeshPhysicalMaterial).wireframe = false;
    } else if (mode === 'wireframe') {
      envelopeOuterMesh.visible = true;
      envelopeCutawayMesh.visible = false;
      outerEnvelopeMat.wireframe = true;
    } else {
      // Solid
      envelopeOuterMesh.visible = true;
      envelopeCutawayMesh.visible = false;
      outerEnvelopeMat.wireframe = false;
      outerEnvelopeMat.transmission = 0.45;
    }
  };

  // Landing gear compression upon touchdown
  const setLandingCompression = (compressed: number) => {
    const c = Math.max(0, Math.min(1, compressed));
    landingPistons.forEach(p => {
      // Piston slides up into the shock body
      p.position.y = -0.06 + c * 0.12;
      p.position.x = 0.58 - c * 0.05;
    });
  };

  // Animation frame updater
  let strobeTimer = 0;
  let radarAngle = 0;
  const updateBalloonAnimation = (delta: number, isPumping: boolean, isRadarActive: boolean) => {
    // 1. Recovery Xenon Beacon flash every 1.2s
    strobeTimer += delta;
    if (strobeTimer > 1.2) {
      strobeTimer = 0;
      recoveryBeaconLight.intensity = 5.0;
      (recoveryBeaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.5;
    } else if (strobeTimer > 0.08) {
      recoveryBeaconLight.intensity = 0.3;
      (recoveryBeaconMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;
    }

    // 2. Ground Proximity Radar scanning sweep
    if (isRadarActive) {
      radarScanCone.visible = true;
      radarAngle += delta * 3.5;
      radarScanCone.rotation.y = radarAngle;
      (radarScanCone.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(radarAngle * 2) * 0.08;
    } else {
      radarScanCone.visible = false;
    }

    // 3. Ambient air intake particles flow into compressor
    if (isPumping) {
      pumpIntakeParticles.visible = true;
      const positions = intakeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < intakeCount; i++) {
        // Move towards intake point (0, -2.1, 0)
        positions[i * 3 + 1] += delta * 1.5;
        if (positions[i * 3 + 1] > -1.95) {
          positions[i * 3 + 1] = -3.0;
          const a = Math.random() * Math.PI * 2;
          const r = 0.4 + Math.random() * 0.8;
          positions[i * 3] = Math.cos(a) * r;
          positions[i * 3 + 2] = Math.sin(a) * r;
        }
      }
      intakeGeo.attributes.position.needsUpdate = true;
    } else {
      pumpIntakeParticles.visible = false;
    }
  };

  return {
    rootGroup,
    envelopeGroup,
    envelopeOuterMesh,
    envelopeCutawayMesh,
    ballonetMesh,
    ballonetGroup,
    pumpIntakeParticles,
    gondolaGroup,
    landingLegsGroup,
    landingPistons,
    radarScanCone,
    recoveryBeaconLight,
    recoveryBeaconMesh,
    bldcMotors,
    setBallonetInflationRatio,
    setEnvelopeCutaway,
    setLandingCompression,
    updateBalloonAnimation,
  };
}
