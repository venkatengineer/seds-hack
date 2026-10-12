export type HealthStatus = 'healthy' | 'warning' | 'fault' | 'offline' | 'untested';

export type ComponentType = 
  | 'temperature_sensor'
  | 'accelerometer'
  | 'voltage_regulator'
  | 'microcontroller'
  | 'fpga'
  | 'adc_dac'
  | 'power_switch'
  | 'optical_sensor'
  | 'pressure_transducer';

export interface PcbCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface SensorChannel {
  id: string;
  name: string;
  type: string;
  unit: string;
  baselineNominal: number;
  minTolerance: number;
  maxTolerance: number;
}

export interface ComponentItem {
  id: string;
  referenceDesignator: string; // e.g. U3, TEMP-02, R14, C22
  name: string;
  type: ComponentType;
  boardId: string;
  pcbPosition: PcbCoordinates;
  status: HealthStatus;
  sensorChannels: SensorChannel[];
  packageType: string; // e.g. 'QFN-32', 'SOIC-8', 'TO-220', '0805'
  latestMeasuredResponse: number;
  expectedHealthyRange: [number, number];
  unit: string;
  latestTestTimestamp: string;
  completedTestsCount: number;
  faultSeverity?: 'critical' | 'moderate' | 'low';
  mlConfidence?: number; // e.g. 0.94 (labeled simulated)
  observedDeviationPercent?: number; // e.g. +14.2%
  anomalyCategory?: 'thermal_decay_lag' | 'stuck_output' | 'excessive_jitter' | 'gain_drift' | 'intermittent_dropout';
  notes?: string;
}

export interface BoardSlot {
  bayId: string;
  bayName: string;
  slotNumber: number;
  section: 'upper_avionics' | 'mid_payload' | 'lower_propulsion' | 'instrument_rack';
}

export interface SubsystemItem {
  id: string; // e.g. 'SUB-01'
  name: string;
  category: 'payload' | 'guidance' | 'sensor_instrumentation' | 'thermal_transient' | 'power_electrical' | 'propulsion_control';
  sectionName: string;
  description: string;
  axialYRange: [number, number]; // [minY, maxY] in 3D rocket coordinates
  status: HealthStatus;
  physicalAssemblyIds: string[];
  boardIds: string[];
}

export interface PhysicalAssemblyItem {
  id: string; // e.g. 'PHY-03-TEMP'
  name: string;
  subsystemId: string;
  boardId: string;
  mountingLocation: {
    y: number; // longitudinal height along vehicle
    radius: number; // radial distance from centerline
    azimuthDeg: number; // azimuthal angle in degrees around body
    enclosureType: 'deck_tray' | 'cold_plate' | 'pressurized_pod' | 'chassis_bay';
    orientation: 'horizontal' | 'vertical_flange' | 'radial_mount' | 'canted';
  };
  status: HealthStatus;
  description: string;
}

export interface BoardItem {
  id: string;
  name: string;
  vehicleId: string;
  subsystemId: string;
  physicalAssemblyId: string;
  mountingLocation: {
    y: number;
    radius: number;
    azimuthDeg: number;
    enclosureType: 'deck_tray' | 'cold_plate' | 'pressurized_pod' | 'chassis_bay';
    orientation: 'horizontal' | 'vertical_flange' | 'radial_mount' | 'canted';
  };
  slot: BoardSlot;
  dimensionsMm: { width: number; height: number };
  layersCount: number;
  revision: string;
  status: HealthStatus;
  componentIds: string[];
  monitoredSensorsCount: number;
  lastTestTimestamp: string;
  temperatureCelsius: number;
  voltageRailV: number;
  description: string;
}

export interface VehicleSystem {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  status: HealthStatus;
  healthScore: number; // 0 - 100%
  subsystemIds: string[];
  boardIds: string[];
  missionTime: string;
  missionPhase: string;
  hardwareConnection: 'connected' | 'disconnected' | 'simulated';
  mlInferenceStatus: 'ready' | 'running' | 'unavailable';
  totalBoardsMonitored: number;
  totalComponentsMonitored: number;
  activeFaultsCount: number;
  suspectedAnomaliesCount: number;
  testsCompletedCount: number;
  lastDiagnosticCycle: string;
}

export type PulsePhase = 
  | 'ready'
  | 'pulse_initiated'
  | 'acquisition'
  | 'signal_processing'
  | 'ml_inference'
  | 'diagnostic_result'
  | 'completed';

export interface TelemetryDataPoint {
  elapsedSeconds: number;
  measuredValue: number;
  expectedValue: number;
  lowerThreshold: number;
  upperThreshold: number;
  pulseActive: boolean;
  anomalyDetected?: boolean;
}

export interface MLDiagnosticEvidence {
  id: string;
  description: string;
  measuredVsExpected: string;
  confidenceContribution: number;
}

export interface MLDiagnosticResult {
  id: string;
  testRunId: string;
  componentId: string;
  boardId: string;
  subsystemId?: string;
  physicalAssemblyId?: string;
  status: HealthStatus;
  anomalyType: string;
  observedBehavior: string;
  confidence: number; // 0 to 1
  isSimulated: boolean;
  severity: 'critical' | 'moderate' | 'low';
  possibleCauses: string[];
  evidence: MLDiagnosticEvidence[];
  recommendedActions: string[];
  timestamp: string;
  deviatingMetrics: {
    metricName: string;
    measured: number;
    baseline: number;
    deviation: string;
    unit: string;
  }[];
}

export interface SystemEvent {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'fault' | 'success';
  boardId?: string;
  componentId?: string;
  title: string;
  description: string;
}

export interface TerminalEvent {
  id: string;
  timestamp: string;
  category: 'TEST' | 'SENSOR' | 'SIGNAL' | 'ANALYSIS' | 'MODEL' | 'RESULT' | 'SYSTEM';
  severity: 'info' | 'warning' | 'fault' | 'success';
  subsystemId?: string;
  boardId?: string;
  componentId?: string;
  message: string;
  latencyMs?: number;
}

export interface TestRunRecord {
  id: string;
  timestamp: string;
  vehicleId: string;
  subsystemId?: string;
  boardId: string;
  boardName: string;
  componentId: string;
  componentRef: string;
  testType: 'thermal_pulse_transient' | 'quiescent_baseline' | 'stress_ramp';
  durationSeconds: number;
  outcome: 'pass' | 'anomaly_detected' | 'fault_confirmed';
  anomalyCategory?: string;
  peakTemperature: number;
  recoveryTimeSeconds: number;
  mlConfidence?: number;
  stabilityTrend: 'stable' | 'deteriorating' | 'inconsistent';
}
