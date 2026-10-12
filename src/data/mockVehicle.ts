import { VehicleSystem } from '../types/vehicle';

export const INITIAL_VEHICLE: VehicleSystem = {
  id: 'VEH-ORION-IX',
  name: 'Orion-IX Suborbital & Testbed Vehicle',
  model: 'AeroTest-X3 Transatmospheric Prototype',
  serialNumber: 'SN-2026-904B',
  status: 'fault', // Triggered by BRD-03 fault in SUB-03
  healthScore: 84.6, // Derived percentage
  subsystemIds: ['SUB-01', 'SUB-02', 'SUB-03', 'SUB-04', 'SUB-05', 'SUB-06'],
  boardIds: ['BRD-01', 'BRD-02', 'BRD-03', 'BRD-04', 'BRD-05', 'BRD-06'],
  missionTime: 'T+ 04:18:22 MET',
  missionPhase: 'Pre-Launch Sensor Thermal Health Screening',
  hardwareConnection: 'simulated',
  mlInferenceStatus: 'ready',
  totalBoardsMonitored: 6,
  totalComponentsMonitored: 31,
  activeFaultsCount: 1, // CMP-03-04 (TEMP-02)
  suspectedAnomaliesCount: 1, // CMP-04-02 (VREG-02)
  testsCompletedCount: 842,
  lastDiagnosticCycle: '2026-10-12T05:02:18Z',
};
