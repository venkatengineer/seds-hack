import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BoardItem, SubsystemItem, PhysicalAssemblyItem } from '../../types/vehicle';

export type VehicleInspectionMode = 'exterior' | 'cross-section' | 'cutaway' | 'exploded';

interface Vehicle3DCanvasProps {
  boards: BoardItem[];
  subsystems?: SubsystemItem[];
  physicalAssemblies?: PhysicalAssemblyItem[];
  selectedBoardId: string | null;
  selectedSubsystemId?: string | null;
  onSelectBoard: (boardId: string | null) => void;
  onSelectSubsystem?: (subsystemId: string | null) => void;
  hoveredBoardId: string | null;
  setHoveredBoardId: (boardId: string | null) => void;
  inspectionMode: VehicleInspectionMode;
  autoRotate: boolean;
  showGrid?: boolean;
  theme: 'dark' | 'light';
  onRegisterFitCamera?: (fitFn: () => void) => void;
  onRegisterResetCamera?: (resetFn: () => void) => void;
  onRegisterFocusBoard?: (focusFn: (boardId: string) => void) => void;
  onProjectedAnchor?: (anchor: { x: number; y: number; visible: boolean; boardId: string } | null) => void;
}

export const Vehicle3DCanvas: React.FC<Vehicle3DCanvasProps> = ({
  boards,
  subsystems,
  physicalAssemblies,
  selectedBoardId,
  selectedSubsystemId,
  onSelectBoard,
  onSelectSubsystem,
  hoveredBoardId,
  setHoveredBoardId,
  inspectionMode,
  autoRotate,
  showGrid = true,
  theme,
  onRegisterFitCamera,
  onRegisterResetCamera,
  onRegisterFocusBoard,
  onProjectedAnchor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const vehicleRootRef = useRef<THREE.Group | null>(null);
  const inspectionModeRef = useRef<VehicleInspectionMode>(inspectionMode);
  inspectionModeRef.current = inspectionMode;
  const onProjectedAnchorRef = useRef(onProjectedAnchor);
  onProjectedAnchorRef.current = onProjectedAnchor;

  // Track mode transitions for silky-smooth 400-800ms engineering cutaway / cross-section reveals
  const modeTransitionRef = useRef<{
    prevMode: VehicleInspectionMode;
    currentMode: VehicleInspectionMode;
    startTime: number;
    duration: number;
  }>({
    prevMode: inspectionMode,
    currentMode: inspectionMode,
    startTime: performance.now(),
    duration: 600,
  });

  // Dynamic lights and environment ref for seamless theme transitions without re-mounting
  const lightsRef = useRef<{
    keyLight: THREE.DirectionalLight;
    fillLight: THREE.DirectionalLight;
    rimLight: THREE.DirectionalLight;
    topLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    shadowPlane: THREE.Mesh;
    gridHelper: THREE.GridHelper;
    ringsGroup: THREE.Group;
  } | null>(null);

  // Camera transition animation state
  const cameraAnimRef = useRef<{
    isAnimating: boolean;
    startTime: number;
    duration: number;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
  }>({
    isAnimating: false,
    startTime: 0,
    duration: 850,
    startPos: new THREE.Vector3(),
    targetPos: new THREE.Vector3(),
    startLookAt: new THREE.Vector3(),
    targetLookAt: new THREE.Vector3(),
  });

  // Dynamic assemblies references
  const dynamicGroupsRef = useRef<{
    noseGroup: THREE.Group;
    solidExteriorFuselage: THREE.Mesh;
    cutawayRearFuselage: THREE.Mesh;
    interiorLining: THREE.Mesh;
    cutawayFuselageWindow: THREE.Mesh;
    crossSectionRimGroup: THREE.Group;
    frontSlidingShell: THREE.Mesh;
    frontSlidingMaterial: THREE.MeshStandardMaterial;
    coreSpineGroup: THREE.Group;
    boosterGroup: THREE.Group;
    exteriorMarkersGroup: THREE.Group;
    explodedGuidesGroup: THREE.Group;
    bayInternalLight1: THREE.PointLight;
    bayInternalLight2: THREE.PointLight;
    boardMeshes: {
      mesh: THREE.Mesh;
      hitMesh: THREE.Mesh;
      boardId: string;
      subsystemId: string;
      baseY: number;
      selectionBox: THREE.BoxHelper;
      ledLight: THREE.PointLight;
    }[];
    exteriorMarkerMeshes: {
      group: THREE.Group;
      hitboxMesh: THREE.Mesh;
      gemMesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
      ledLight: THREE.PointLight;
      boardId: string;
      subsystemId: string;
      baseY: number;
      status: string;
    }[];
  } | null>(null);

  // Cubic easing function
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Compute camera framing from bounding box with generous margins
  const computeFittedCameraState = (
    camera: THREE.PerspectiveCamera,
    object: THREE.Object3D,
    mode: VehicleInspectionMode
  ) => {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Generous breathing room factor so nose tip and nozzle never clip
    const padding = mode === 'exploded' ? 1.45 : 1.35;
    const fovRad = (camera.fov * Math.PI) / 180;
    const aspect = camera.aspect || 1.6;

    const distVertical = (size.y / 2) / Math.tan(fovRad / 2);
    const distHorizontal = (size.x / 2) / (Math.tan(fovRad / 2) * aspect);
    const fitDistance = Math.max(distVertical, distHorizontal, 14.5) * padding;

    // Intentional 3/4 aerospace inspection viewing angle
    const azimuth = Math.PI * 0.16;
    const elevation = Math.PI * 0.08;

    const camX = center.x + fitDistance * Math.sin(azimuth) * Math.cos(elevation);
    const camY = center.y + fitDistance * Math.sin(elevation);
    const camZ = center.z + fitDistance * Math.cos(azimuth) * Math.cos(elevation);

    return {
      position: new THREE.Vector3(camX, camY, camZ),
      target: new THREE.Vector3(center.x, center.y, center.z),
    };
  };

  const createStudioBackgroundTexture = (isLight: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(256, 256, 40, 256, 256, 340);
      if (isLight) {
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(0.5, '#f1f5f9');
        gradient.addColorStop(1, '#e2e8f0');
      } else {
        gradient.addColorStop(0, '#101726'); // soft central halo behind vehicle
        gradient.addColorStop(0.55, '#090d16');
        gradient.addColorStop(1, '#05070a'); // deep vignette
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const isLight = theme === 'light';
    scene.background = createStudioBackgroundTexture(isLight);
    scene.fog = new THREE.Fog(isLight ? 0xeef2f6 : 0x05070a, 22, 50);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.2, 100);
    cameraRef.current = camera;

    // 3. Renderer with high visual fidelity & tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 1.15 : 1.28;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls with smooth inertia & damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.minDistance = 3.0;
    controls.maxDistance = 30.0;
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.minPolarAngle = Math.PI * 0.12;
    controlsRef.current = controls;

    // 5. Professional Aerospace Studio Lighting Setup
    const keyLight = new THREE.DirectionalLight(0xffffff, isLight ? 3.0 : 3.6);
    keyLight.position.set(9, 15, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isLight ? 0xcfd8dc : 0xe2e8f0, isLight ? 2.4 : 2.2);
    fillLight.position.set(-11, 4, 7);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(isLight ? 0x90a4ae : 0x94a3b8, isLight ? 1.8 : 2.8);
    rimLight.position.set(0, -6, -13);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, isLight ? 1.8 : 1.5);
    topLight.position.set(0, 16, 0);
    scene.add(topLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0xf8fafc,
      isLight ? 0xb0bec5 : 0x0f172a,
      isLight ? 1.4 : 1.3
    );
    scene.add(hemiLight);

    // Dedicated interior avionics bay floodlights (active in cutaway)
    const bayInternalLight1 = new THREE.PointLight(0xffffff, isLight ? 2.0 : 2.4, 4.2);
    bayInternalLight1.position.set(0, 2.2, 0.4);
    scene.add(bayInternalLight1);

    const bayInternalLight2 = new THREE.PointLight(0x38bdf8, isLight ? 1.2 : 1.6, 3.5);
    bayInternalLight2.position.set(0, 1.4, 0.4);
    scene.add(bayInternalLight2);

    // 6. Subtle Ground Contact Shadow Disc (soft contact shadow under engine)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeo = new THREE.PlaneGeometry(10, 10);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: isLight ? 0.38 : 0.65,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -5.45;
    scene.add(shadowPlane);

    // 7. Professional Aerospace CAD Ground Grid Surface
    const gridHelper = new THREE.GridHelper(
      32,
      32,
      isLight ? 0x0284c7 : 0x06b6d4,
      isLight ? 0x94a3b8 : 0x1e293b
    );
    gridHelper.position.y = -5.46;
    const gridMat = gridHelper.material as THREE.LineBasicMaterial;
    gridMat.transparent = true;
    gridMat.opacity = isLight ? 0.20 : 0.24;
    gridMat.depthWrite = false;
    gridHelper.visible = showGrid !== false;
    scene.add(gridHelper);

    // Concentric telemetry range rings around the launch pad coordinate origin
    const ringsGroup = new THREE.Group();
    ringsGroup.position.y = -5.455;
    [1.5, 3.2, 5.5, 8.5].forEach((radius, idx) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isLight ? (idx === 0 ? 0x0284c7 : 0x64748b) : (idx === 0 ? 0x06b6d4 : 0x334155),
        transparent: true,
        opacity: isLight ? 0.18 : 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringsGroup.add(ringMesh);
    });
    ringsGroup.visible = showGrid !== false;
    scene.add(ringsGroup);

    lightsRef.current = {
      keyLight,
      fillLight,
      rimLight,
      topLight,
      hemiLight,
      shadowPlane,
      gridHelper,
      ringsGroup,
    };

    // 7. Realistic Aerospace Materials
    const hullWhiteMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf4f6fa : 0xf1f5f9,
      metalness: 0.18,
      roughness: 0.32,
    });

    const hullTitaniumMaterial = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.65,
      roughness: 0.35,
    });

    const darkGraphiteMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e2430,
      metalness: 0.50,
      roughness: 0.45,
    });

    const machinedAlloyMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.22,
    });

    const goldKaptonMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.22,
    });

    const bayChassisMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.82,
      roughness: 0.28,
    });

    const nozzleBellMaterial = new THREE.MeshStandardMaterial({
      color: 0x242e3d,
      metalness: 0.90,
      roughness: 0.28,
    });

    // Cutaway translucent glass cover
    const cutawayGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      metalness: 0.05,
      roughness: 0.1,
      transmission: 0.90,
      transparent: true,
      opacity: 0.15,
      ior: 1.45,
    });

    // 8. Vehicle Hierarchy Groups for Assembly & Inspection Modes
    const vehicleRoot = new THREE.Group();
    vehicleRootRef.current = vehicleRoot;
    scene.add(vehicleRoot);

    const noseGroup = new THREE.Group();
    const avionicsSectionGroup = new THREE.Group();
    const coreSpineGroup = new THREE.Group();
    const boosterGroup = new THREE.Group();

    vehicleRoot.add(noseGroup);
    vehicleRoot.add(avionicsSectionGroup);
    vehicleRoot.add(coreSpineGroup);
    vehicleRoot.add(boosterGroup);

    // =========================================================================
    // A. NOSE CONE & FORWARD TELEMETRY ASSEMBLY (Y = 3.3 to 6.02)
    // =========================================================================
    // Aerodynamic Ogive Nose Cone (Solid, Satin White Aerospace Composite)
    const noseGeo = new THREE.ConeGeometry(0.85, 2.0, 64, 1, false);
    const noseMesh = new THREE.Mesh(noseGeo, hullWhiteMaterial);
    noseMesh.position.y = 4.3;
    noseMesh.castShadow = true;
    noseMesh.receiveShadow = true;
    noseGroup.add(noseMesh);

    // Carbon-composite thermal protection nose tip cap
    const noseCapGeo = new THREE.ConeGeometry(0.28, 0.6, 32);
    const noseCapMesh = new THREE.Mesh(noseCapGeo, darkGraphiteMaterial);
    noseCapMesh.position.y = 5.0;
    noseGroup.add(noseCapMesh);

    // Fine Pitot Telemetry Boom
    const pitotGeo = new THREE.CylinderGeometry(0.016, 0.028, 0.85, 16);
    const pitotMesh = new THREE.Mesh(pitotGeo, machinedAlloyMaterial);
    pitotMesh.position.y = 5.6;
    noseGroup.add(pitotMesh);

    // Pitot tip probe
    const pitotTipGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const pitotTip = new THREE.Mesh(pitotTipGeo, new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.2 }));
    pitotTip.position.y = 6.02;
    noseGroup.add(pitotTip);

    // Forward RCS Attitude Control Thruster Pods (4x flush micro-nozzles)
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const rcsGeo = new THREE.BoxGeometry(0.09, 0.09, 0.05);
      const rcsMesh = new THREE.Mesh(rcsGeo, darkGraphiteMaterial);
      rcsMesh.position.set(Math.cos(angle) * 0.70, 3.65, Math.sin(angle) * 0.70);
      rcsMesh.rotation.y = angle;
      noseGroup.add(rcsMesh);
    }

    // Machined Separation Seam Joint Ring
    const noseJointGeo = new THREE.TorusGeometry(0.855, 0.022, 16, 64);
    const noseJoint = new THREE.Mesh(noseJointGeo, machinedAlloyMaterial);
    noseJoint.rotation.x = Math.PI / 2;
    noseJoint.position.y = 3.3;
    noseGroup.add(noseJoint);

    // =========================================================================
    // B. AVIONICS FUSELAGE SECTION (Y = 0.8 to 3.3)
    // =========================================================================
    // 1. Solid, Continuous 360-degree Fuselage Cylinder (Active in 'exterior' mode)
    // GUARANTEES 100% SOLID SEAMLESS ROCKET IN EXTERIOR MODE!
    const solidExteriorFuselageGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.5, 64, 1, false, 0, Math.PI * 2);
    const solidExteriorFuselage = new THREE.Mesh(solidExteriorFuselageGeo, hullWhiteMaterial);
    solidExteriorFuselage.position.y = 2.05;
    solidExteriorFuselage.castShadow = true;
    solidExteriorFuselage.receiveShadow = true;
    avionicsSectionGroup.add(solidExteriorFuselage);

    // 2. Solid Rear Fuselage Shell (Covers rear 180 degrees Z <= 0 in cross-section / cutaway)
    const cutawayRearGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.5, 64, 1, false, Math.PI * 0.5, Math.PI);
    const cutawayRearFuselage = new THREE.Mesh(cutawayRearGeo, hullWhiteMaterial);
    cutawayRearFuselage.position.y = 2.05;
    cutawayRearFuselage.castShadow = true;
    cutawayRearFuselage.receiveShadow = true;
    avionicsSectionGroup.add(cutawayRearFuselage);

    // Gold Kapton thermal insulation MLI blanket lining on the interior rear wall
    const interiorLiningGeo = new THREE.CylinderGeometry(0.835, 0.835, 2.48, 48, 1, true, Math.PI * 0.5, Math.PI);
    const interiorLining = new THREE.Mesh(interiorLiningGeo, goldKaptonMaterial);
    interiorLining.position.y = 2.05;
    avionicsSectionGroup.add(interiorLining);

    // 3. Cutaway Window Chamfered Frame (Active in 'cutaway' mode)
    const cutawayGlassGeo = new THREE.CylinderGeometry(0.852, 0.852, 2.5, 48, 1, false, -Math.PI * 0.5, Math.PI);
    const cutawayFuselageWindow = new THREE.Mesh(cutawayGlassGeo, cutawayGlassMat);
    cutawayFuselageWindow.position.y = 2.05;
    avionicsSectionGroup.add(cutawayFuselageWindow);

    // 4. Front Sliding Shell for Animated Pull-Apart / Longitudinal Section Transition
    const frontSlidingGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.5, 64, 1, false, -Math.PI * 0.5, Math.PI);
    const frontSlidingMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0xf4f6fa : 0xf1f5f9,
      metalness: 0.18,
      roughness: 0.32,
      transparent: true,
      opacity: 1.0,
    });
    const frontSlidingShell = new THREE.Mesh(frontSlidingGeo, frontSlidingMaterial);
    frontSlidingShell.position.set(0, 2.05, 0);
    frontSlidingShell.castShadow = true;
    frontSlidingShell.visible = false;
    avionicsSectionGroup.add(frontSlidingShell);

    // 5. Authentic Aerospace Longitudinal Cross-Section CAD Rim & Structural Cut Edges
    const crossSectionRimGroup = new THREE.Group();
    avionicsSectionGroup.add(crossSectionRimGroup);

    // Machined Titanium Longitudinal Cut Flanges at X = -0.85 and +0.85, Z = 0
    [-0.85, 0.85].forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.045, 2.5, 0.035);
      const railMesh = new THREE.Mesh(railGeo, machinedAlloyMaterial);
      railMesh.position.set(x, 2.05, 0);
      crossSectionRimGroup.add(railMesh);
    });

    // Forward Pressure Bulkhead at Stage Joint (Y = 3.28)
    const topBulkheadGeo = new THREE.CylinderGeometry(0.845, 0.845, 0.04, 48, 1, false, Math.PI * 0.5, Math.PI);
    const topBulkheadMesh = new THREE.Mesh(topBulkheadGeo, bayChassisMaterial);
    topBulkheadMesh.position.set(0, 3.28, 0);
    crossSectionRimGroup.add(topBulkheadMesh);

    const topCutBarGeo = new THREE.BoxGeometry(1.69, 0.04, 0.035);
    const topCutBar = new THREE.Mesh(topCutBarGeo, machinedAlloyMaterial);
    topCutBar.position.set(0, 3.28, 0);
    crossSectionRimGroup.add(topCutBar);

    // Aft Pressure Bulkhead at Interstage Joint (Y = 0.82)
    const botBulkheadGeo = new THREE.CylinderGeometry(0.845, 0.845, 0.04, 48, 1, false, Math.PI * 0.5, Math.PI);
    const botBulkheadMesh = new THREE.Mesh(botBulkheadGeo, bayChassisMaterial);
    botBulkheadMesh.position.set(0, 0.82, 0);
    crossSectionRimGroup.add(botBulkheadMesh);

    const botCutBarGeo = new THREE.BoxGeometry(1.69, 0.04, 0.035);
    const botCutBar = new THREE.Mesh(botCutBarGeo, machinedAlloyMaterial);
    botCutBar.position.set(0, 0.82, 0);
    crossSectionRimGroup.add(botCutBar);

    // Circumferential Airframe Ring Frames and Cross-Ties at Y = 1.45, 2.05, 2.65
    [1.45, 2.05, 2.65].forEach(y => {
      const ribGeo = new THREE.TorusGeometry(0.845, 0.016, 16, 32, Math.PI);
      const ribMesh = new THREE.Mesh(ribGeo, machinedAlloyMaterial);
      ribMesh.rotation.x = Math.PI / 2;
      ribMesh.rotation.z = Math.PI;
      ribMesh.position.set(0, y, 0);
      crossSectionRimGroup.add(ribMesh);

      const barGeo = new THREE.BoxGeometry(1.68, 0.024, 0.024);
      const barMesh = new THREE.Mesh(barGeo, bayChassisMaterial);
      barMesh.position.set(0, y, 0);
      crossSectionRimGroup.add(barMesh);
    });

    // Structural external bay joint rings
    [0.85, 1.45, 2.05, 2.65, 3.25].forEach(y => {
      const ringGeo = new THREE.TorusGeometry(0.858, 0.02, 16, 64);
      const ring = new THREE.Mesh(ringGeo, machinedAlloyMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      avionicsSectionGroup.add(ring);
    });

    // =========================================================================
    // C. AUTHENTIC AVIONICS COMPARTMENTS & LRU RACK ARCHITECTURE
    // =========================================================================
    // Central structural spine dual-rails with machined gussets
    [-0.44, 0.44].forEach(x => {
      const spineRailGeo = new THREE.BoxGeometry(0.045, 2.42, 0.065);
      const spineRail = new THREE.Mesh(spineRailGeo, bayChassisMaterial);
      spineRail.position.set(x, 2.05, 0.0);
      coreSpineGroup.add(spineRail);
    });

    // Rear aerospace braided wire harness conduit
    const conduitGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.4, 16);
    const conduit = new THREE.Mesh(conduitGeo, goldKaptonMaterial);
    conduit.position.set(0, 2.05, -0.28);
    coreSpineGroup.add(conduit);

    // 6 Modular LRU Electronics Board Assemblies
    const boardMeshes: {
      mesh: THREE.Mesh;
      hitMesh: THREE.Mesh;
      boardId: string;
      subsystemId: string;
      baseY: number;
      selectionBox: THREE.BoxHelper;
      ledLight: THREE.PointLight;
    }[] = [];

    const boardSlotLayout = [
      { id: 'BRD-01', y: 2.85, z: 0.10, subsystemId: 'SUB-01' }, // Nav Core
      { id: 'BRD-02', y: 2.50, z: 0.12, subsystemId: 'SUB-02' }, // Flight Control
      { id: 'BRD-03', y: 2.15, z: 0.14, subsystemId: 'SUB-03' }, // Sensor Interface - CRITICAL FAULT
      { id: 'BRD-04', y: 1.80, z: 0.14, subsystemId: 'SUB-06' }, // Telemetry & Comm
      { id: 'BRD-05', y: 1.45, z: 0.12, subsystemId: 'SUB-04' }, // Power Mgmt - WARNING
      { id: 'BRD-06', y: 1.10, z: 0.10, subsystemId: 'SUB-05' }, // Propulsion Controller
    ];

    boards.forEach((board, index) => {
      const slot = boardSlotLayout.find(s => s.id === board.id) || boardSlotLayout[index] || { id: board.id, y: 2.0, z: 0, subsystemId: 'SUB-01' };

      // Individual Board Group
      const boardGroup = new THREE.Group();
      boardGroup.position.set(0, slot.y, slot.z);
      coreSpineGroup.add(boardGroup);

      // Machined Aluminum LRU Equipment Tray with mounting flanges
      const trayGeo = new THREE.BoxGeometry(0.78, 0.035, 0.46);
      const tray = new THREE.Mesh(trayGeo, bayChassisMaterial);
      tray.position.set(0, -0.03, 0);
      boardGroup.add(tray);

      // Left & Right Vibration Isolation Mounting Brackets
      [-0.41, 0.41].forEach(bracketX => {
        const bracketGeo = new THREE.BoxGeometry(0.04, 0.08, 0.08);
        const bracket = new THREE.Mesh(bracketGeo, machinedAlloyMaterial);
        bracket.position.set(bracketX, -0.02, 0);
        boardGroup.add(bracket);
      });

      // Authentic PCB Substrate (High contrast dark aerospace emerald/graphite)
      const pcbGeo = new THREE.BoxGeometry(0.74, 0.024, 0.42);
      const pcbMat = new THREE.MeshStandardMaterial({
        color: board.id === 'BRD-03' ? 0x0f3621 : 0x132a1e,
        metalness: 0.60,
        roughness: 0.38,
        emissive: board.status === 'fault' ? 0xef4444 : board.status === 'warning' ? 0xf59e0b : 0x000000,
        emissiveIntensity: board.status === 'fault' ? 0.35 : board.status === 'warning' ? 0.2 : 0.0,
      });
      const pcbMesh = new THREE.Mesh(pcbGeo, pcbMat);
      pcbMesh.userData = { boardId: board.id, boardName: board.name, subsystemId: board.subsystemId || slot.subsystemId, baseY: slot.y };
      boardGroup.add(pcbMesh);

      // Central Processor Heat Spreader (Machined Aluminum block)
      const bgaGeo = new THREE.BoxGeometry(0.18, 0.045, 0.18);
      const icMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.22 });
      const mainBga = new THREE.Mesh(bgaGeo, icMat);
      mainBga.position.set(-0.12, 0.025, 0.02);
      boardGroup.add(mainBga);

      // SMT Components & FPGA Package
      const qfpGeo = new THREE.BoxGeometry(0.14, 0.032, 0.09);
      const qfp1 = new THREE.Mesh(qfpGeo, icMat);
      qfp1.position.set(0.16, 0.025, 0.08);
      boardGroup.add(qfp1);

      const qfp2 = new THREE.Mesh(qfpGeo, icMat);
      qfp2.position.set(0.16, 0.025, -0.08);
      boardGroup.add(qfp2);

      // Mil-Spec Backplane Connector
      const edgeConnGeo = new THREE.BoxGeometry(0.44, 0.03, 0.04);
      const edgeConn = new THREE.Mesh(edgeConnGeo, goldKaptonMaterial);
      edgeConn.position.set(0, 0, -0.21);
      boardGroup.add(edgeConn);

      // Front Technical Faceplate with extraction handles
      const faceplateGeo = new THREE.BoxGeometry(0.76, 0.09, 0.025);
      const faceplateMat = new THREE.MeshStandardMaterial({ color: 0x222a38, metalness: 0.75, roughness: 0.35 });
      const faceplate = new THREE.Mesh(faceplateGeo, faceplateMat);
      faceplate.position.set(0, 0, 0.215);
      boardGroup.add(faceplate);

      // Status LED Indicator on Faceplate
      let ledColor = 0x10b981; // Green
      if (board.status === 'fault') ledColor = 0xef4444; // Red
      else if (board.status === 'warning') ledColor = 0xf59e0b; // Amber

      const ledGeo = new THREE.SphereGeometry(0.032, 16, 16);
      const ledMat = new THREE.MeshBasicMaterial({ color: ledColor });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0.31, 0.01, 0.235);
      boardGroup.add(ledMesh);

      // Status LED Point Light
      const ledLight = new THREE.PointLight(ledColor, board.status === 'fault' ? 1.4 : 0.45, 0.75);
      ledLight.position.set(0.31, 0.01, 0.26);
      boardGroup.add(ledLight);

      // Selection Bounding Box Helper
      const boxHelper = new THREE.BoxHelper(pcbMesh, board.status === 'fault' ? 0xef4444 : 0x06b6d4);
      boxHelper.visible = false;
      boardGroup.add(boxHelper);

      // Dedicated Raycasting Hitbox for 100% Reliable Click & Hover Interaction
      const boardHitGeo = new THREE.BoxGeometry(0.85, 0.24, 0.52);
      const boardHitMat = new THREE.MeshBasicMaterial({ visible: false });
      const boardHitMesh = new THREE.Mesh(boardHitGeo, boardHitMat);
      boardHitMesh.position.set(0, 0, 0);
      boardHitMesh.userData = {
        boardId: board.id,
        boardName: board.name,
        subsystemId: board.subsystemId || slot.subsystemId,
        baseY: slot.y,
        isBoardHitbox: true,
      };
      boardGroup.add(boardHitMesh);

      boardMeshes.push({
        mesh: pcbMesh,
        hitMesh: boardHitMesh,
        boardId: board.id,
        subsystemId: board.subsystemId || slot.subsystemId,
        baseY: slot.y,
        selectionBox: boxHelper,
        ledLight,
      });
    });

    // =========================================================================
    // C2. EXTERIOR AIRFRAME AVIONICS SERVICE MARKERS & EXPLODED GUIDES
    // =========================================================================
    const exteriorMarkersGroup = new THREE.Group();
    avionicsSectionGroup.add(exteriorMarkersGroup);

    const explodedGuidesGroup = new THREE.Group();
    vehicleRoot.add(explodedGuidesGroup);

    // Longitudinal Avionics Service Meridian Seam Guide on Fuselage Skin
    const serviceSeamGeo = new THREE.BoxGeometry(0.012, 2.38, 0.008);
    const serviceSeamMesh = new THREE.Mesh(serviceSeamGeo, machinedAlloyMaterial);
    serviceSeamMesh.position.set(Math.sin(0.48 - 0.02) * 0.862, 2.05, Math.cos(0.48 - 0.02) * 0.862);
    serviceSeamMesh.rotation.y = 0.48;
    exteriorMarkersGroup.add(serviceSeamMesh);

    const exteriorMarkerMeshes: {
      group: THREE.Group;
      hitboxMesh: THREE.Mesh;
      gemMesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
      ledLight: THREE.PointLight;
      boardId: string;
      subsystemId: string;
      baseY: number;
      status: string;
    }[] = [];

    boards.forEach((board, index) => {
      const slot = boardSlotLayout.find(s => s.id === board.id) || boardSlotLayout[index] || { id: board.id, y: 2.0, z: 0, subsystemId: 'SUB-01' };

      const markerSubGroup = new THREE.Group();
      const mX = Math.sin(0.48) * 0.864;
      const mZ = Math.cos(0.48) * 0.864;
      markerSubGroup.position.set(mX, slot.y, mZ);
      markerSubGroup.rotation.y = Math.atan2(mX, mZ);

      // Machined titanium bezel ring
      const bezelGeo = new THREE.TorusGeometry(0.065, 0.012, 16, 32);
      const bezelMesh = new THREE.Mesh(bezelGeo, machinedAlloyMaterial);
      markerSubGroup.add(bezelMesh);

      // Backing disc
      const backingGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.008, 32);
      const backingMesh = new THREE.Mesh(backingGeo, darkGraphiteMaterial);
      backingMesh.rotation.x = Math.PI / 2;
      backingMesh.position.z = -0.002;
      markerSubGroup.add(backingMesh);

      // Status Optical Indicator Gem Lens
      const gemColor = board.status === 'fault' ? 0xef4444 : board.status === 'warning' ? 0xf59e0b : 0x10b981;
      const gemGeo = new THREE.CylinderGeometry(0.040, 0.042, 0.014, 24);
      const gemMat = new THREE.MeshStandardMaterial({
        color: gemColor,
        emissive: gemColor,
        emissiveIntensity: board.status === 'fault' ? 0.85 : 0.4,
        roughness: 0.25,
        metalness: 0.1,
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.rotation.x = Math.PI / 2;
      gemMesh.position.z = 0.005;
      markerSubGroup.add(gemMesh);

      // Status Halo Ring
      const haloGeo = new THREE.RingGeometry(0.076, 0.098, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: gemColor,
        transparent: true,
        opacity: board.status === 'fault' ? 0.75 : 0.35,
        side: THREE.DoubleSide,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.z = 0.008;
      markerSubGroup.add(haloMesh);

      // Subtle Stencil Tag Canvas Texture
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 160;
      tagCanvas.height = 48;
      const tagCtx = tagCanvas.getContext('2d');
      if (tagCtx) {
        tagCtx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        tagCtx.strokeStyle = board.status === 'fault' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(100, 116, 139, 0.6)';
        tagCtx.lineWidth = 2;
        if (typeof tagCtx.roundRect === 'function') {
          tagCtx.roundRect(4, 4, 152, 40, 6);
        } else {
          tagCtx.rect(4, 4, 152, 40);
        }
        tagCtx.fill();
        tagCtx.stroke();
        tagCtx.fillStyle = board.status === 'fault' ? '#fca5a5' : '#e2e8f0';
        tagCtx.font = 'bold 18px monospace';
        tagCtx.textAlign = 'center';
        tagCtx.textBaseline = 'middle';
        tagCtx.fillText(`${board.id}`, 80, 24);
      }
      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagGeo = new THREE.PlaneGeometry(0.16, 0.048);
      const tagMat = new THREE.MeshBasicMaterial({ map: tagTex, transparent: true });
      const tagMesh = new THREE.Mesh(tagGeo, tagMat);
      tagMesh.position.set(0.14, 0, 0.006);
      markerSubGroup.add(tagMesh);

      // Low-range localized point light for realistic hull glow
      const markerLight = new THREE.PointLight(gemColor, board.status === 'fault' ? 0.9 : 0.3, 0.55);
      markerLight.position.set(0, 0, 0.06);
      markerSubGroup.add(markerLight);

      // Invisible Raycasting Hitbox
      const hitboxGeo = new THREE.BoxGeometry(0.34, 0.18, 0.15);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitboxMesh.position.set(0.07, 0, 0.02);
      hitboxMesh.userData = {
        boardId: board.id,
        boardName: board.name,
        subsystemId: board.subsystemId || slot.subsystemId,
        baseY: slot.y,
        isExteriorMarker: true,
      };
      markerSubGroup.add(hitboxMesh);

      exteriorMarkersGroup.add(markerSubGroup);

      exteriorMarkerMeshes.push({
        group: markerSubGroup,
        hitboxMesh,
        gemMesh,
        haloMesh,
        ledLight: markerLight,
        boardId: board.id,
        subsystemId: board.subsystemId || slot.subsystemId,
        baseY: slot.y,
        status: board.status,
      });
    });

    // Exploded mode structural alignment guides and board callout lines
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach(angle => {
      const points = [
        new THREE.Vector3(Math.cos(angle) * 0.855, -2.0, Math.sin(angle) * 0.855),
        new THREE.Vector3(Math.cos(angle) * 0.855, 3.8, Math.sin(angle) * 0.855),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x06b6d4,
        dashSize: 0.15,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.45,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      explodedGuidesGroup.add(line);
    });

    boardSlotLayout.forEach(slot => {
      const points = [
        new THREE.Vector3(0.38, slot.y, 0.14),
        new THREE.Vector3(1.15, slot.y, 0.25),
      ];
      const calloutGeo = new THREE.BufferGeometry().setFromPoints(points);
      const calloutMat = new THREE.LineBasicMaterial({
        color: slot.id === 'BRD-03' ? 0xef4444 : 0x06b6d4,
        transparent: true,
        opacity: 0.55,
      });
      const calloutLine = new THREE.Line(calloutGeo, calloutMat);
      explodedGuidesGroup.add(calloutLine);

      const sphereGeo = new THREE.SphereGeometry(0.03, 12, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: slot.id === 'BRD-03' ? 0xef4444 : 0x06b6d4,
      });
      const dot = new THREE.Mesh(sphereGeo, sphereMat);
      dot.position.set(1.15, slot.y, 0.25);
      explodedGuidesGroup.add(dot);
    });

    // =========================================================================
    // D. INTERSTAGE & MAIN BOOSTER PROPELLANT STAGE (Y = -3.4 to +0.8)
    // =========================================================================
    // Smooth Interstage Coupler Barrel with titanium separation band
    const interstageGeo = new THREE.CylinderGeometry(0.85, 0.86, 0.5, 64);
    const interstageMesh = new THREE.Mesh(interstageGeo, darkGraphiteMaterial);
    interstageMesh.position.y = 0.55;
    boosterGroup.add(interstageMesh);

    const interstageBandGeo = new THREE.TorusGeometry(0.862, 0.02, 16, 64);
    const interstageBand = new THREE.Mesh(interstageBandGeo, machinedAlloyMaterial);
    interstageBand.rotation.x = Math.PI / 2;
    interstageBand.position.y = 0.8;
    boosterGroup.add(interstageBand);

    // Main Booster Propellant Tank Barrel (Solid, Continuous Satin White)
    const boosterGeo = new THREE.CylinderGeometry(0.86, 0.87, 3.6, 64);
    const boosterMesh = new THREE.Mesh(boosterGeo, hullWhiteMaterial);
    boosterMesh.position.y = -1.5;
    boosterMesh.castShadow = true;
    boosterMesh.receiveShadow = true;
    boosterGroup.add(boosterMesh);

    // Lower graphite thermal protection wrap band
    const lowerBandGeo = new THREE.CylinderGeometry(0.872, 0.875, 0.6, 64);
    const lowerBand = new THREE.Mesh(lowerBandGeo, darkGraphiteMaterial);
    lowerBand.position.y = -3.0;
    boosterGroup.add(lowerBand);

    // Longitudinal Aero Cable Raceway Conduit strip
    const racewayGeo = new THREE.BoxGeometry(0.05, 3.6, 0.06);
    const raceway = new THREE.Mesh(racewayGeo, darkGraphiteMaterial);
    raceway.position.set(0, -1.5, 0.88);
    boosterGroup.add(raceway);

    // =========================================================================
    // E. AFT BOAT-TAIL & ROCKET ENGINE NOZZLE ASSEMBLY (Y = -5.3 to -3.4)
    // =========================================================================
    // Conical Boat-Tail Fairing
    const boatTailGeo = new THREE.ConeGeometry(0.875, 0.8, 64, 1, true);
    const boatTail = new THREE.Mesh(boatTailGeo, darkGraphiteMaterial);
    boatTail.rotation.x = Math.PI;
    boatTail.position.y = -3.7;
    boosterGroup.add(boatTail);

    // Main Rocket Engine Bell Nozzle
    const nozzleGeo = new THREE.ConeGeometry(0.65, 1.1, 48, 1, true);
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleBellMaterial);
    nozzle.rotation.x = Math.PI;
    nozzle.position.y = -4.55;
    boosterGroup.add(nozzle);

    // Combustion chamber injector dome
    const throatGlowGeo = new THREE.CylinderGeometry(0.16, 0.38, 0.5, 24);
    const throatGlow = new THREE.Mesh(throatGlowGeo, new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
    throatGlow.position.y = -4.4;
    boosterGroup.add(throatGlow);

    // Gimbal Actuator Struts (2x)
    [-0.32, 0.32].forEach(x => {
      const actuatorGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 12);
      const actuator = new THREE.Mesh(actuatorGeo, machinedAlloyMaterial);
      actuator.position.set(x, -4.1, 0.18);
      actuator.rotation.z = x > 0 ? 0.22 : -0.22;
      boosterGroup.add(actuator);
    });

    // 4 Aerodynamic Stabilizing Delta Fins with Machined Pivots
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0);
      finShape.lineTo(0.95, -0.65);
      finShape.lineTo(0.95, -1.25);
      finShape.lineTo(0, -0.9);
      finShape.closePath();

      const extrudeSettings = { depth: 0.035, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 };
      const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);
      const finMesh = new THREE.Mesh(finGeo, darkGraphiteMaterial);
      finMesh.position.set(0, -2.6, 0);
      finMesh.rotation.y = angle;
      finMesh.rotation.x = Math.PI;
      boosterGroup.add(finMesh);
    }

    dynamicGroupsRef.current = {
      noseGroup,
      solidExteriorFuselage,
      cutawayRearFuselage,
      interiorLining,
      cutawayFuselageWindow,
      crossSectionRimGroup,
      frontSlidingShell,
      frontSlidingMaterial,
      coreSpineGroup,
      boosterGroup,
      exteriorMarkersGroup,
      explodedGuidesGroup,
      bayInternalLight1,
      bayInternalLight2,
      boardMeshes,
      exteriorMarkerMeshes,
    };

    // Calculate initial framed camera state based on actual model bounds
    const initialFramed = computeFittedCameraState(camera, vehicleRoot, inspectionMode);
    camera.position.copy(initialFramed.position);
    controls.target.copy(initialFramed.target);
    controls.update();

    if (onRegisterFitCamera) {
      onRegisterFitCamera(() => {
        if (!vehicleRootRef.current || !cameraRef.current || !controlsRef.current) return;
        const fitted = computeFittedCameraState(cameraRef.current, vehicleRootRef.current, inspectionMode);
        cameraAnimRef.current = {
          isAnimating: true,
          startTime: performance.now(),
          duration: 850,
          startPos: cameraRef.current.position.clone(),
          targetPos: fitted.position,
          startLookAt: controlsRef.current.target.clone(),
          targetLookAt: fitted.target,
        };
      });
    }

    if (onRegisterResetCamera) {
      onRegisterResetCamera(() => {
        if (!vehicleRootRef.current || !cameraRef.current || !controlsRef.current) return;
        const fitted = computeFittedCameraState(cameraRef.current, vehicleRootRef.current, 'exterior');
        cameraAnimRef.current = {
          isAnimating: true,
          startTime: performance.now(),
          duration: 900,
          startPos: cameraRef.current.position.clone(),
          targetPos: fitted.position,
          startLookAt: controlsRef.current.target.clone(),
          targetLookAt: fitted.target,
        };
      });
    }

    if (onRegisterFocusBoard) {
      onRegisterFocusBoard((boardId: string) => {
        if (!cameraRef.current || !controlsRef.current || !dynamicGroupsRef.current) return;
        const hitBoard = dynamicGroupsRef.current.boardMeshes.find(b => b.boardId === boardId);
        if (!hitBoard) return;

        // Dedicated close-up framing to inspect board mounting, connectors, and LEDs
        const targetLookAt = new THREE.Vector3(0, hitBoard.baseY, 0.12);
        const targetPos = new THREE.Vector3(0.95, hitBoard.baseY + 0.18, 2.15);

        cameraAnimRef.current = {
          isAnimating: true,
          startTime: performance.now(),
          duration: 750,
          startPos: cameraRef.current.position.clone(),
          targetPos,
          startLookAt: controlsRef.current.target.clone(),
          targetLookAt,
        };
      });
    }

    // 9. Pointer Drag vs Click Isolation
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let downTime = 0;
    let downPos = { x: 0, y: 0 };
    let hasDragged = false;

    const handlePointerDown = (e: PointerEvent) => {
      downTime = performance.now();
      downPos = { x: e.clientX, y: e.clientY };
      hasDragged = false;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - downPos.x);
      const dy = Math.abs(e.clientY - downPos.y);
      if (dx > 4 || dy > 4) {
        hasDragged = true;
      }

      // Hover Raycasting
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const targetHitboxes: THREE.Object3D[] = [];
      if (inspectionModeRef.current === 'exterior') {
        targetHitboxes.push(...exteriorMarkerMeshes.map(m => m.hitboxMesh));
      } else {
        targetHitboxes.push(...boardMeshes.map(b => b.hitMesh));
        targetHitboxes.push(...boardMeshes.map(b => b.mesh));
        targetHitboxes.push(...exteriorMarkerMeshes.map(m => m.hitboxMesh));
      }

      const boardHits = raycaster.intersectObjects(targetHitboxes);

      if (boardHits.length > 0) {
        const hoveredId = boardHits[0].object.userData.boardId;
        setHoveredBoardId(hoveredId);
        container.style.cursor = 'pointer';
      } else {
        setHoveredBoardId(null);
        container.style.cursor = 'grab';
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      const clickDuration = performance.now() - downTime;
      const dx = Math.abs(e.clientX - downPos.x);
      const dy = Math.abs(e.clientY - downPos.y);

      // If user dragged or held down, this is camera orbit, NOT a selection click!
      if (hasDragged || dx > 4 || dy > 4 || clickDuration > 380) {
        return;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      const targetHitboxes: THREE.Object3D[] = [];
      if (inspectionModeRef.current === 'exterior') {
        targetHitboxes.push(...exteriorMarkerMeshes.map(m => m.hitboxMesh));
      } else {
        targetHitboxes.push(...boardMeshes.map(b => b.hitMesh));
        targetHitboxes.push(...boardMeshes.map(b => b.mesh));
        targetHitboxes.push(...exteriorMarkerMeshes.map(m => m.hitboxMesh));
      }

      const boardHits = raycaster.intersectObjects(targetHitboxes);

      if (boardHits.length > 0) {
        // Specific avionics board / exterior marker clicked! Select it in 3D.
        const hitBoardId = boardHits[0].object.userData.boardId;
        const hitSubsystemId = boardHits[0].object.userData.subsystemId;
        onSelectBoard(hitBoardId);
        if (onSelectSubsystem) onSelectSubsystem(hitSubsystemId);
      } else {
        // Rocket exterior or void clicked: deselect bay
        const exteriorHits = raycaster.intersectObjects(vehicleRoot.children, true);
        if (exteriorHits.length === 0) {
          onSelectBoard(null);
          if (onSelectSubsystem) onSelectSubsystem(null);
        }
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);

    // 10. Animation Loop
    let animationFrameId: number;
    const animStartTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const elapsedTime = (now - animStartTime) / 1000;

      // Handle Smooth Cinematic Camera Interpolation
      if (cameraAnimRef.current.isAnimating) {
        const { startTime, duration, startPos, targetPos, startLookAt, targetLookAt } = cameraAnimRef.current;
        const progress = Math.min(1.0, (now - startTime) / duration);
        const ease = easeInOutCubic(progress);

        camera.position.lerpVectors(startPos, targetPos, ease);
        controls.target.lerpVectors(startLookAt, targetLookAt, ease);

        if (progress >= 1.0) {
          cameraAnimRef.current.isAnimating = false;
        }
      }

      // Update OrbitControls
      controls.autoRotate = autoRotate && !cameraAnimRef.current.isAnimating;
      controls.autoRotateSpeed = 0.65;
      controls.update();

      // Dynamic Assembly Offsets based on inspectionMode with smooth transition
      if (dynamicGroupsRef.current) {
        const {
          noseGroup,
          boosterGroup,
          solidExteriorFuselage,
          cutawayRearFuselage,
          interiorLining,
          cutawayFuselageWindow,
          crossSectionRimGroup,
          frontSlidingShell,
          frontSlidingMaterial,
          coreSpineGroup,
          exteriorMarkersGroup,
          explodedGuidesGroup,
          bayInternalLight1,
          bayInternalLight2,
          boardMeshes,
          exteriorMarkerMeshes,
        } = dynamicGroupsRef.current;

        const currentMode = inspectionModeRef.current;
        const trans = modeTransitionRef.current;
        const transElapsed = now - trans.startTime;
        const transProgress = Math.min(1.0, transElapsed / trans.duration);
        const transEase = easeInOutCubic(transProgress);

        let targetNoseY = 0;
        let targetBoosterY = 0;

        if (currentMode === 'exploded') {
          targetNoseY = 1.8;
          targetBoosterY = -1.8;
        }

        noseGroup.position.y += (targetNoseY - noseGroup.position.y) * 0.08;
        boosterGroup.position.y += (targetBoosterY - boosterGroup.position.y) * 0.08;

        // Visual panel states with smooth 400-800ms transition between exterior, cross-section, cutaway, and exploded
        if (currentMode === 'exterior') {
          // If transitioning from cross-section / cutaway back to exterior:
          if (trans.prevMode !== 'exterior' && transProgress < 1.0) {
            solidExteriorFuselage.visible = false;
            frontSlidingShell.visible = true;
            frontSlidingShell.position.z = (1.0 - transEase) * 0.75;
            frontSlidingMaterial.opacity = transEase;
            cutawayRearFuselage.visible = true;
            interiorLining.visible = true;
            crossSectionRimGroup.visible = false;
            cutawayFuselageWindow.visible = false;
            coreSpineGroup.visible = true;
            exteriorMarkersGroup.visible = transProgress > 0.5;
            explodedGuidesGroup.visible = false;
          } else {
            // 100% Solid, seamless, continuous rocket!
            solidExteriorFuselage.visible = true;
            frontSlidingShell.visible = false;
            cutawayRearFuselage.visible = false;
            interiorLining.visible = false;
            crossSectionRimGroup.visible = false;
            cutawayFuselageWindow.visible = false;
            coreSpineGroup.visible = false; // Hide internal electronics in exterior mode
            exteriorMarkersGroup.visible = true; // Exterior interactive indicators visible!
            explodedGuidesGroup.visible = false;
          }
          bayInternalLight1.intensity += (0 - bayInternalLight1.intensity) * 0.12;
          bayInternalLight2.intensity += (0 - bayInternalLight2.intensity) * 0.12;
        } else if (currentMode === 'cross-section') {
          // Clean longitudinal engineering cross-section cut revealing internal avionics bays
          solidExteriorFuselage.visible = false;
          cutawayRearFuselage.visible = true;
          interiorLining.visible = true;
          crossSectionRimGroup.visible = true;
          cutawayFuselageWindow.visible = false; // No glass: unobstructed direct board inspection!
          coreSpineGroup.visible = true;
          exteriorMarkersGroup.visible = false;
          explodedGuidesGroup.visible = false;

          // Animated sliding shell reveal if transitioning from exterior
          if (trans.prevMode === 'exterior' && transProgress < 1.0) {
            frontSlidingShell.visible = true;
            frontSlidingShell.position.z = transEase * 0.75;
            frontSlidingMaterial.opacity = 1.0 - transEase;
          } else {
            frontSlidingShell.visible = false;
          }

          const targetL1 = isLight ? 2.8 : 3.4;
          const targetL2 = isLight ? 1.4 : 1.8;
          bayInternalLight1.intensity += (targetL1 - bayInternalLight1.intensity) * 0.12;
          bayInternalLight2.intensity += (targetL2 - bayInternalLight2.intensity) * 0.12;
        } else if (currentMode === 'cutaway') {
          // Engineering cutaway with translucent aerospace canopy
          solidExteriorFuselage.visible = false;
          cutawayRearFuselage.visible = true;
          interiorLining.visible = true;
          crossSectionRimGroup.visible = false;
          cutawayFuselageWindow.visible = true;
          frontSlidingShell.visible = false;
          coreSpineGroup.visible = true;
          exteriorMarkersGroup.visible = false;
          explodedGuidesGroup.visible = false;
          const targetL1 = isLight ? 2.0 : 2.4;
          const targetL2 = isLight ? 1.2 : 1.6;
          bayInternalLight1.intensity += (targetL1 - bayInternalLight1.intensity) * 0.12;
          bayInternalLight2.intensity += (targetL2 - bayInternalLight2.intensity) * 0.12;
        } else {
          // Exploded mode: separated stages with visible internal equipment and alignment guides
          solidExteriorFuselage.visible = false;
          cutawayRearFuselage.visible = true;
          interiorLining.visible = true;
          crossSectionRimGroup.visible = false;
          cutawayFuselageWindow.visible = false;
          frontSlidingShell.visible = false;
          coreSpineGroup.visible = true;
          exteriorMarkersGroup.visible = false;
          explodedGuidesGroup.visible = true;
          const targetL1 = isLight ? 1.5 : 1.8;
          const targetL2 = isLight ? 1.0 : 1.2;
          bayInternalLight1.intensity += (targetL1 - bayInternalLight1.intensity) * 0.12;
          bayInternalLight2.intensity += (targetL2 - bayInternalLight2.intensity) * 0.12;
        }

        // Exterior Markers Animation, Pulsing, and Halos
        if (currentMode === 'exterior') {
          exteriorMarkerMeshes.forEach(marker => {
            const isSelected = marker.boardId === selectedBoardId;
            const isHovered = marker.boardId === hoveredBoardId;
            const isFault = marker.status === 'fault';
            const isWarning = marker.status === 'warning';

            if (isFault) {
              const pulse = Math.sin(elapsedTime * 5.5) * 0.5 + 0.5;
              const gemMat = marker.gemMesh.material as THREE.MeshStandardMaterial;
              gemMat.emissiveIntensity = 0.5 + pulse * 0.8;
              marker.ledLight.intensity = 0.5 + pulse * 1.0;

              const haloMat = marker.haloMesh.material as THREE.MeshBasicMaterial;
              haloMat.opacity = 0.35 + pulse * 0.55;
              const haloScale = 1.0 + pulse * 0.24;
              marker.haloMesh.scale.set(haloScale, haloScale, 1);
            } else if (isSelected) {
              const pulse = Math.sin(elapsedTime * 4.0) * 0.5 + 0.5;
              const haloMat = marker.haloMesh.material as THREE.MeshBasicMaterial;
              haloMat.opacity = 0.6 + pulse * 0.35;
              marker.haloMesh.scale.set(1.22, 1.22, 1);
            } else if (isHovered) {
              const haloMat = marker.haloMesh.material as THREE.MeshBasicMaterial;
              haloMat.opacity = 0.85;
              marker.haloMesh.scale.set(1.15, 1.15, 1);
            } else {
              const haloMat = marker.haloMesh.material as THREE.MeshBasicMaterial;
              haloMat.opacity = isWarning ? 0.45 : 0.25;
              marker.haloMesh.scale.set(1.0, 1.0, 1);
            }

            if (isHovered || isSelected) {
              marker.group.scale.set(1.08, 1.08, 1.08);
            } else {
              marker.group.scale.set(1.0, 1.0, 1.0);
            }
          });
        }

        // Internal Board Highlighting, Pulsing, and LED behavior
        boardMeshes.forEach(({ mesh, boardId, selectionBox, ledLight }) => {
          if (currentMode === 'exterior') {
            mesh.visible = false;
            selectionBox.visible = false;
            ledLight.visible = false;
            return;
          }

          mesh.visible = true;
          ledLight.visible = true;

          const isSelected = boardId === selectedBoardId;
          const isHovered = boardId === hoveredBoardId;
          const board = boards.find(b => b.id === boardId);
          const mat = mesh.material as THREE.MeshStandardMaterial;

          if (isSelected) {
            selectionBox.visible = true;
            mat.emissive.setHex(board?.status === 'fault' ? 0xef4444 : 0x06b6d4);
            mat.emissiveIntensity = 0.5 + Math.sin(elapsedTime * 5) * 0.2;
            mesh.scale.set(1.06, 1.06, 1.06);
          } else if (isHovered) {
            selectionBox.visible = false;
            mat.emissive.setHex(0x38bdf8);
            mat.emissiveIntensity = 0.35;
            mesh.scale.set(1.03, 1.03, 1.03);
          } else {
            selectionBox.visible = false;
            if (board?.status === 'fault') {
              mat.emissive.setHex(0xef4444);
              mat.emissiveIntensity = 0.25;
            } else if (board?.status === 'warning') {
              mat.emissive.setHex(0xf59e0b);
              mat.emissiveIntensity = 0.2;
            } else {
              mat.emissive.setHex(0x000000);
              mat.emissiveIntensity = 0.0;
            }
            mesh.scale.set(selectedBoardId ? 0.98 : 1.0, selectedBoardId ? 0.98 : 1.0, selectedBoardId ? 0.98 : 1.0);
          }

          if (board?.status === 'fault') {
            ledLight.intensity = 1.3 + Math.sin(elapsedTime * 6) * 0.7;
          }
        });
      }

      // Spatially Projected Technical Annotations Anchor Calculation
      if (onProjectedAnchorRef.current) {
        if (selectedBoardId && dynamicGroupsRef.current) {
          const currentMode = inspectionModeRef.current;
          const pos3D = new THREE.Vector3();
          let found = false;

          if (currentMode === 'exterior') {
            const marker = dynamicGroupsRef.current.exteriorMarkerMeshes.find(m => m.boardId === selectedBoardId);
            if (marker) {
              marker.group.getWorldPosition(pos3D);
              found = true;
            }
          } else {
            const b = dynamicGroupsRef.current.boardMeshes.find(b => b.boardId === selectedBoardId);
            if (b) {
              b.mesh.getWorldPosition(pos3D);
              found = true;
            }
          }

          if (found) {
            const projected = pos3D.clone().project(camera);
            const isFront = projected.z < 1;
            const x = ((projected.x + 1) / 2) * container.clientWidth;
            const y = ((-projected.y + 1) / 2) * container.clientHeight;
            onProjectedAnchorRef.current({ x, y, visible: isFront, boardId: selectedBoardId });
          } else {
            onProjectedAnchorRef.current(null);
          }
        } else {
          onProjectedAnchorRef.current(null);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);

      if (!selectedBoardId && vehicleRootRef.current) {
        const fitted = computeFittedCameraState(camera, vehicleRootRef.current, inspectionMode);
        camera.position.copy(fitted.position);
        controls.target.copy(fitted.target);
        controls.update();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [boards, autoRotate]);

  // Handle Theme Switching without remounting or resetting the camera
  useEffect(() => {
    if (!sceneRef.current || !lightsRef.current) return;
    const isLight = theme === 'light';
    const scene = sceneRef.current;
    const { keyLight, fillLight, rimLight, topLight, hemiLight, shadowPlane, gridHelper, ringsGroup } = lightsRef.current;

    scene.background = createStudioBackgroundTexture(isLight);
    scene.fog = new THREE.Fog(isLight ? 0xeef2f6 : 0x05070a, 22, 50);

    keyLight.intensity = isLight ? 3.0 : 3.6;
    fillLight.color.setHex(isLight ? 0xcfd8dc : 0xe2e8f0);
    fillLight.intensity = isLight ? 2.4 : 2.2;
    rimLight.color.setHex(isLight ? 0x90a4ae : 0x94a3b8);
    rimLight.intensity = isLight ? 1.8 : 2.8;
    topLight.intensity = isLight ? 1.8 : 1.5;

    hemiLight.color.setHex(isLight ? 0xffffff : 0xf8fafc);
    hemiLight.groundColor.setHex(isLight ? 0xb0bec5 : 0x0f172a);
    hemiLight.intensity = isLight ? 1.4 : 1.3;

    const shadowMat = shadowPlane.material as THREE.MeshBasicMaterial;
    shadowMat.opacity = isLight ? 0.38 : 0.65;

    if (gridHelper) {
      const gMat = gridHelper.material as THREE.LineBasicMaterial;
      gMat.opacity = isLight ? 0.20 : 0.24;
    }

    if (ringsGroup) {
      ringsGroup.children.forEach((child, idx) => {
        const rMesh = child as THREE.Mesh;
        const rMat = rMesh.material as THREE.MeshBasicMaterial;
        rMat.color.setHex(isLight ? (idx === 0 ? 0x0284c7 : 0x64748b) : (idx === 0 ? 0x06b6d4 : 0x334155));
        rMat.opacity = isLight ? 0.18 : 0.22;
      });
    }
  }, [theme]);

  // Handle Ground Grid Visibility Toggle
  useEffect(() => {
    if (lightsRef.current) {
      lightsRef.current.gridHelper.visible = showGrid !== false;
      lightsRef.current.ringsGroup.visible = showGrid !== false;
    }
  }, [showGrid]);

  // Handle Inspection Mode Transitions with smooth 650ms animation duration
  useEffect(() => {
    if (modeTransitionRef.current.currentMode !== inspectionMode) {
      modeTransitionRef.current.prevMode = modeTransitionRef.current.currentMode;
      modeTransitionRef.current.currentMode = inspectionMode;
      modeTransitionRef.current.startTime = performance.now();
      modeTransitionRef.current.duration = 650;
    }
    inspectionModeRef.current = inspectionMode;
  }, [inspectionMode]);

  // Cinematic Camera Glide to Board or Return to Overview
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current || !dynamicGroupsRef.current) return;

    if (!selectedBoardId) {
      if (vehicleRootRef.current) {
        const fitted = computeFittedCameraState(cameraRef.current, vehicleRootRef.current, inspectionMode);
        cameraAnimRef.current = {
          isAnimating: true,
          startTime: performance.now(),
          duration: 900,
          startPos: cameraRef.current.position.clone(),
          targetPos: fitted.position,
          startLookAt: controlsRef.current.target.clone(),
          targetLookAt: fitted.target,
        };
      }
      return;
    }

    const hitBoard = dynamicGroupsRef.current.boardMeshes.find(b => b.boardId === selectedBoardId);
    if (hitBoard) {
      let targetLookAt: THREE.Vector3;
      let targetPos: THREE.Vector3;

      if (inspectionMode === 'exterior') {
        const marker = dynamicGroupsRef.current.exteriorMarkerMeshes.find(m => m.boardId === selectedBoardId);
        const y = marker ? marker.baseY : hitBoard.baseY;
        targetLookAt = new THREE.Vector3(0.2, y, 0.4);
        targetPos = new THREE.Vector3(1.6, y + 0.25, 3.2);
      } else if (inspectionMode === 'cross-section') {
        targetLookAt = new THREE.Vector3(0, hitBoard.baseY, 0.12);
        targetPos = new THREE.Vector3(1.15, hitBoard.baseY + 0.25, 2.6);
      } else {
        targetLookAt = new THREE.Vector3(0, hitBoard.baseY, 0.15);
        targetPos = new THREE.Vector3(1.3, hitBoard.baseY + 0.3, 3.2);
      }

      cameraAnimRef.current = {
        isAnimating: true,
        startTime: performance.now(),
        duration: 850,
        startPos: cameraRef.current.position.clone(),
        targetPos,
        startLookAt: controlsRef.current.target.clone(),
        targetLookAt,
      };
    }
  }, [selectedBoardId, inspectionMode]);

  return <div ref={mountRef} className="w-full h-full relative cursor-grab active:cursor-grabbing select-none" />;
};
