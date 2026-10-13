import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  VehicleSystem,
  SubsystemItem,
  PhysicalAssemblyItem,
  BoardItem,
  ComponentItem,
  HealthStatus,
  PulsePhase,
  TelemetryDataPoint,
  MLDiagnosticResult,
  SystemEvent,
  TerminalEvent,
  TestRunRecord,
} from '../types/vehicle';
import { INITIAL_VEHICLE } from '../data/mockVehicle';
import { INITIAL_SUBSYSTEMS, INITIAL_PHYSICAL_ASSEMBLIES } from '../data/mockSubsystems';
import { INITIAL_BOARDS } from '../data/mockBoards';
import { INITIAL_COMPONENTS } from '../data/mockComponents';
import { INITIAL_TEST_RUNS, INITIAL_SYSTEM_EVENTS, INITIAL_DIAGNOSTIC_RESULT_TEMP02 } from '../data/mockHistory';
import { generateThermalPulseData, SignalBehaviorMode } from '../data/mockTelemetry';
import { mlDiagnosticAdapter } from '../services/mlDiagnosticAdapter';
import { esp32Service, Esp32Telemetry } from '../services/esp32Service';

export type NavigationTab = 
  | 'overview'
  | 'topology'
  | 'pcb'
  | 'telemetry'
  | 'faults'
  | 'terminal'
  | 'history'
  | 'settings'
  | 'balloon';

const INITIAL_TERMINAL_EVENTS: TerminalEvent[] = [
  {
    id: 'TRM-01',
    timestamp: '10:42:00.850',
    category: 'SYSTEM',
    severity: 'info',
    message: 'Orion-IX Virtual Telemetry Bus synchronized (CAN/SpaceWire 10ms cycle latency).',
  },
  {
    id: 'TRM-02',
    timestamp: '10:42:01.120',
    category: 'TEST',
    severity: 'info',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'Controlled heat pulse stimulus initiated on Sensor Interface Board (TEMP-02).',
  },
  {
    id: 'TRM-03',
    timestamp: '10:42:01.145',
    category: 'SENSOR',
    severity: 'info',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'Channel TEMP-02 raw transient buffer acquired (24-bit delta-sigma ADC @ 100Hz).',
  },
  {
    id: 'TRM-04',
    timestamp: '10:42:01.220',
    category: 'SIGNAL',
    severity: 'info',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'Transient thermal decay curve extracted: Peak 68.4°C, nominal baseline 42.0°C.',
  },
  {
    id: 'TRM-05',
    timestamp: '10:42:01.310',
    category: 'ANALYSIS',
    severity: 'warning',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'Observed +28.6% deviation from healthy calibrated envelope. Decay time constant lag detected.',
  },
  {
    id: 'TRM-06',
    timestamp: '10:42:01.420',
    category: 'MODEL',
    severity: 'info',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'Edge TensorRT INT8 thermal transient inference completed (latency: 2.14ms).',
  },
  {
    id: 'TRM-07',
    timestamp: '10:42:01.430',
    category: 'RESULT',
    severity: 'fault',
    subsystemId: 'SUB-03',
    boardId: 'BRD-03',
    componentId: 'CMP-03-04',
    message: 'CONFIRMED FAULT: Abnormal thermal recovery delay (+4.2s delay). ML Confidence: 96.8% (Simulated).',
  },
];

interface SystemContextValue {
  // Navigation & Selection
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedSubsystemId: string | null;
  setSelectedSubsystemId: (id: string | null) => void;
  selectedPhysicalAssemblyId: string | null;
  setSelectedPhysicalAssemblyId: (id: string | null) => void;
  selectedBoardId: string;
  setSelectedBoardId: (id: string) => void;
  selectedComponentId: string;
  setSelectedComponentId: (id: string) => void;

  // Resolved Entities
  selectedSubsystem: SubsystemItem | undefined;
  selectedPhysicalAssembly: PhysicalAssemblyItem | undefined;
  selectedBoard: BoardItem | undefined;
  selectedComponent: ComponentItem | undefined;

  // Hierarchy Navigation Actions
  selectSubsystem: (subsystemId: string) => void;
  selectPhysicalAssemblyAndInspect: (assemblyId: string) => void;
  selectBoardAndInspect: (boardId: string) => void;
  selectComponentAndInspect: (boardId: string, componentId: string) => void;

  // Domain Entities
  vehicle: VehicleSystem;
  subsystems: SubsystemItem[];
  physicalAssemblies: PhysicalAssemblyItem[];
  boards: BoardItem[];
  components: ComponentItem[];
  getBoardComponents: (boardId: string) => ComponentItem[];
  getSubsystemBoards: (subsystemId: string) => BoardItem[];
  getSubsystemAssemblies: (subsystemId: string) => PhysicalAssemblyItem[];

  // Live Thermal Pulse Testing Lifecycle
  pulsePhase: PulsePhase;
  isTesting: boolean;
  testProgress: number;
  elapsedTestTimeSeconds: number;
  liveTelemetryPoints: TelemetryDataPoint[];
  currentDiagnosticResult: MLDiagnosticResult | null;
  startLiveTest: (targetBoardId?: string, targetCompId?: string, behaviorMode?: SignalBehaviorMode) => void;
  stopLiveTest: () => void;

  // History & Terminal Events
  testRuns: TestRunRecord[];
  systemEvents: SystemEvent[];
  terminalEvents: TerminalEvent[];
  clearTerminalEvents: () => void;

  // Demo Controls & Fault Injection
  injectComponentFault: (compId: string, status: HealthStatus, anomaly?: string) => void;
  resetDemoState: () => void;
  simulationNotice: string;

  // Live Hardware ESP32 Integration
  esp32Connected: boolean;
  esp32Telemetry: Esp32Telemetry | null;
}

const SystemContext = createContext<SystemContextValue | undefined>(undefined);

export const SystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation & Selection
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  const [selectedSubsystemId, setSelectedSubsystemId] = useState<string | null>(null);
  const [selectedPhysicalAssemblyId, setSelectedPhysicalAssemblyId] = useState<string | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('CMP-03-04'); // TEMP-02

  // Entities
  const [vehicle, setVehicle] = useState<VehicleSystem>(INITIAL_VEHICLE);
  const [subsystems, setSubsystems] = useState<SubsystemItem[]>(INITIAL_SUBSYSTEMS);
  const [physicalAssemblies, setPhysicalAssemblies] = useState<PhysicalAssemblyItem[]>(INITIAL_PHYSICAL_ASSEMBLIES);
  const [boards, setBoards] = useState<BoardItem[]>(INITIAL_BOARDS);
  const [components, setComponents] = useState<ComponentItem[]>(INITIAL_COMPONENTS);

  // Live Testing State
  const [pulsePhase, setPulsePhase] = useState<PulsePhase>('ready');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testProgress, setTestProgress] = useState<number>(0);
  const [elapsedTestTimeSeconds, setElapsedTestTimeSeconds] = useState<number>(0);
  const [liveTelemetryPoints, setLiveTelemetryPoints] = useState<TelemetryDataPoint[]>(() => 
    generateThermalPulseData('degraded_decay', 25.0)
  );
  const [currentDiagnosticResult, setCurrentDiagnosticResult] = useState<MLDiagnosticResult | null>(
    INITIAL_DIAGNOSTIC_RESULT_TEMP02
  );

  // History & Terminal
  const [testRuns, setTestRuns] = useState<TestRunRecord[]>(INITIAL_TEST_RUNS);
  const [systemEvents, setSystemEvents] = useState<SystemEvent[]>(INITIAL_SYSTEM_EVENTS);
  const [terminalEvents, setTerminalEvents] = useState<TerminalEvent[]>(INITIAL_TERMINAL_EVENTS);

  // Live Hardware ESP32 Integration
  const [esp32Connected, setEsp32Connected] = useState<boolean>(() => esp32Service.getStatus().connected);
  const [esp32Telemetry, setEsp32Telemetry] = useState<Esp32Telemetry | null>(() => esp32Service.getTelemetry());

  useEffect(() => {
    const unsubStatus = esp32Service.subscribeStatus(s => {
      setEsp32Connected(s.connected);
    });

    const unsubTelemetry = esp32Service.subscribeTelemetry(t => {
      setEsp32Telemetry(t);
      if (t.ds18b20Temp !== null || t.busVoltage !== null) {
        setBoards(prevBoards =>
          prevBoards.map(b => {
            if (b.id === 'BRD-03') {
              return {
                ...b,
                temperatureCelsius: t.ds18b20Temp ?? b.temperatureCelsius,
                voltageRailV: t.busVoltage ?? b.voltageRailV,
              };
            }
            return b;
          })
        );

        setComponents(prevComps =>
          prevComps.map(c => {
            if (c.id === 'CMP-03-04' && t.ds18b20Temp !== null) {
              return {
                ...c,
                latestMeasuredResponse: t.ds18b20Temp,
              };
            }
            if (c.id === 'CMP-03-03' && t.ntcTemp !== null) {
              return {
                ...c,
                latestMeasuredResponse: t.ntcTemp,
              };
            }
            return c;
          })
        );
      }
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
    };
  }, []);

  // Active Entity Resolution
  const selectedSubsystem = useMemo(() => {
    if (selectedSubsystemId) return subsystems.find(s => s.id === selectedSubsystemId);
    if (selectedBoardId) {
      const b = boards.find(b => b.id === selectedBoardId);
      if (b) return subsystems.find(s => s.id === b.subsystemId);
    }
    return undefined;
  }, [subsystems, selectedSubsystemId, selectedBoardId, boards]);

  const selectedPhysicalAssembly = useMemo(() => {
    if (selectedPhysicalAssemblyId) return physicalAssemblies.find(p => p.id === selectedPhysicalAssemblyId);
    if (selectedBoardId) {
      const b = boards.find(b => b.id === selectedBoardId);
      if (b) return physicalAssemblies.find(p => p.id === b.physicalAssemblyId);
    }
    return undefined;
  }, [physicalAssemblies, selectedPhysicalAssemblyId, selectedBoardId, boards]);

  const selectedBoard = useMemo(() => {
    return boards.find(b => b.id === selectedBoardId) || boards[0];
  }, [boards, selectedBoardId]);

  const selectedComponent = useMemo(() => {
    return components.find(c => c.id === selectedComponentId) || 
      components.find(c => c.boardId === selectedBoardId) || 
      components[0];
  }, [components, selectedComponentId, selectedBoardId]);

  // Query Helpers
  const getBoardComponents = (boardId: string) => {
    return components.filter(c => c.boardId === boardId);
  };

  const getSubsystemBoards = (subsystemId: string) => {
    return boards.filter(b => b.subsystemId === subsystemId);
  };

  const getSubsystemAssemblies = (subsystemId: string) => {
    return physicalAssemblies.filter(p => p.subsystemId === subsystemId);
  };

  // Synchronize Health Aggregation:
  // Component status -> Board status -> Physical Assembly status -> Subsystem status -> Vehicle status
  useEffect(() => {
    // 1. Recalculate board statuses
    const updatedBoards = boards.map(board => {
      const bComps = components.filter(c => c.boardId === board.id);
      const hasFault = bComps.some(c => c.status === 'fault');
      const hasWarning = bComps.some(c => c.status === 'warning');

      let newStatus: HealthStatus = 'healthy';
      if (hasFault) newStatus = 'fault';
      else if (hasWarning) newStatus = 'warning';

      return {
        ...board,
        status: newStatus,
      };
    });

    // 2. Recalculate physical assembly statuses
    const updatedAssemblies = physicalAssemblies.map(assembly => {
      const associatedBoard = updatedBoards.find(b => b.id === assembly.boardId);
      return {
        ...assembly,
        status: associatedBoard?.status || 'healthy',
      };
    });

    // 3. Recalculate subsystem statuses
    const updatedSubsystems = subsystems.map(subsystem => {
      const sBoards = updatedBoards.filter(b => b.subsystemId === subsystem.id);
      const hasFault = sBoards.some(b => b.status === 'fault');
      const hasWarning = sBoards.some(b => b.status === 'warning');

      let newStatus: HealthStatus = 'healthy';
      if (hasFault) newStatus = 'fault';
      else if (hasWarning) newStatus = 'warning';

      return {
        ...subsystem,
        status: newStatus,
      };
    });

    // 4. Recalculate vehicle health
    const faultsCount = updatedBoards.filter(b => b.status === 'fault').length;
    const warningsCount = updatedBoards.filter(b => b.status === 'warning').length;
    const totalComps = components.length;
    const faultyComps = components.filter(c => c.status === 'fault').length;
    const warningComps = components.filter(c => c.status === 'warning').length;

    let healthPercent = 100;
    if (totalComps > 0) {
      healthPercent = Math.max(
        0,
        Math.round(100 - (faultyComps * 18 + warningComps * 7))
      );
    }

    let vehicleStatus: HealthStatus = 'healthy';
    if (faultsCount > 0) vehicleStatus = 'fault';
    else if (warningsCount > 0) vehicleStatus = 'warning';

    setBoards(updatedBoards);
    setPhysicalAssemblies(updatedAssemblies);
    setSubsystems(updatedSubsystems);
    setVehicle(prev => ({
      ...prev,
      status: vehicleStatus,
      healthScore: healthPercent,
      activeFaultsCount: faultsCount,
      suspectedAnomaliesCount: warningsCount,
      totalComponentsMonitored: totalComps,
      totalBoardsMonitored: updatedBoards.length,
    }));
  }, [components]);

  // Hierarchy Navigation Helpers
  const selectSubsystem = (subsystemId: string) => {
    setSelectedSubsystemId(subsystemId);
    const sub = subsystems.find(s => s.id === subsystemId);
    if (sub && sub.boardIds.length > 0) {
      setSelectedBoardId(sub.boardIds[0]);
    }
  };

  const selectPhysicalAssemblyAndInspect = (assemblyId: string) => {
    setSelectedPhysicalAssemblyId(assemblyId);
    const assembly = physicalAssemblies.find(p => p.id === assemblyId);
    if (assembly) {
      setSelectedSubsystemId(assembly.subsystemId);
      setSelectedBoardId(assembly.boardId);
    }
  };

  const selectBoardAndInspect = (boardId: string) => {
    setSelectedBoardId(boardId);
    const b = boards.find(board => board.id === boardId);
    if (b) {
      setSelectedSubsystemId(b.subsystemId);
      setSelectedPhysicalAssemblyId(b.physicalAssemblyId);
    }
    const boardComps = components.filter(c => c.boardId === boardId);
    if (boardComps.length > 0) {
      const target = boardComps.find(c => c.status === 'fault') || 
                     boardComps.find(c => c.status === 'warning') || 
                     boardComps[0];
      setSelectedComponentId(target.id);
    }
    setCurrentTab('pcb');
  };

  const selectComponentAndInspect = (boardId: string, componentId: string) => {
    setSelectedBoardId(boardId);
    setSelectedComponentId(componentId);
    setCurrentTab('pcb');
  };

  const clearTerminalEvents = () => {
    setTerminalEvents([]);
  };

  // Live Test Execution Lifecycle with Structured Terminal Events
  useEffect(() => {
    if (!isTesting) return;

    let stepTimer: ReturnType<typeof setTimeout> | undefined;
    const targetComp = components.find(c => c.id === selectedComponentId) || selectedComponent;
    const targetBoard = boards.find(b => b.id === targetComp?.boardId) || selectedBoard;

    let mode: SignalBehaviorMode = 'healthy';
    if (targetComp?.status === 'fault') mode = 'degraded_decay';
    else if (targetComp?.status === 'warning') mode = 'noisy';

    const fullProfile = generateThermalPulseData(mode, 25.0);
    const totalSteps = fullProfile.length;
    let stepIndex = 0;

    const addTerminalLog = (category: TerminalEvent['category'], severity: TerminalEvent['severity'], message: string, latencyMs?: number) => {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const newEvent: TerminalEvent = {
        id: `TRM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: timeStr,
        category,
        severity,
        subsystemId: targetBoard?.subsystemId,
        boardId: targetBoard?.id,
        componentId: targetComp?.id,
        message,
        latencyMs,
      };
      setTerminalEvents(prev => [...prev, newEvent]);
    };

    setPulsePhase('pulse_initiated');
    setLiveTelemetryPoints([fullProfile[0]]);
    addTerminalLog('TEST', 'info', `Thermal pulse stimulus initiated on ${targetComp?.referenceDesignator || 'Sensor'} (${targetBoard?.name || 'Board'}).`);

    const interval = setInterval(() => {
      stepIndex += 1;
      const progressPct = Math.round((stepIndex / totalSteps) * 100);
      setTestProgress(progressPct);
      setElapsedTestTimeSeconds(Number((stepIndex * 0.2).toFixed(1)));

      if (stepIndex < totalSteps) {
        setLiveTelemetryPoints(fullProfile.slice(0, stepIndex + 1));

        if (stepIndex === Math.floor(totalSteps * 0.2)) {
          setPulsePhase('acquisition');
          addTerminalLog('SENSOR', 'info', `Channel ${targetComp?.sensorChannels[0]?.name || 'RTD-1'} acquired from 24-bit delta-sigma ADC @ 100Hz.`);
        } else if (stepIndex === Math.floor(totalSteps * 0.45)) {
          setPulsePhase('signal_processing');
          addTerminalLog('SIGNAL', 'info', `Transient thermal response window captured: Peak ${Math.max(...fullProfile.slice(0, stepIndex).map(p => p.measuredValue)).toFixed(1)}°C.`);
        } else if (stepIndex === Math.floor(totalSteps * 0.70)) {
          setPulsePhase('ml_inference');
          addTerminalLog('ANALYSIS', 'info', `Comparing transient signature against healthy baseline envelope...`);
        } else if (stepIndex === Math.floor(totalSteps * 0.85)) {
          addTerminalLog('MODEL', 'info', `TensorRT INT8 neural inference completed (cycle latency: 2.18ms).`, 2.18);
        }
      } else {
        clearInterval(interval);
        setIsTesting(false);
        setPulsePhase('diagnostic_result');

        if (targetComp) {
          mlDiagnosticAdapter.inferDiagnosis(targetComp, targetBoard?.name || 'Board', fullProfile).then((result: MLDiagnosticResult) => {
            setCurrentDiagnosticResult(result);
            setPulsePhase('completed');

            const outcomeSeverity = result.status === 'fault' ? 'fault' : result.status === 'warning' ? 'warning' : 'success';
            addTerminalLog(
              'RESULT',
              outcomeSeverity,
              `${result.status.toUpperCase()}: ${result.anomalyType}. ML Confidence: ${(result.confidence * 100).toFixed(1)}% (Simulated).`
            );

            // Append Test Run Record
            const newRun: TestRunRecord = {
              id: `RUN-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString(),
              vehicleId: vehicle.id,
              subsystemId: targetBoard?.subsystemId,
              boardId: targetComp.boardId,
              boardName: targetBoard?.name || 'Board',
              componentId: targetComp.id,
              componentRef: targetComp.referenceDesignator,
              testType: 'thermal_pulse_transient',
              durationSeconds: 10.0,
              outcome: result.status === 'fault' ? 'fault_confirmed' : result.status === 'warning' ? 'anomaly_detected' : 'pass',
              anomalyCategory: result.anomalyType,
              peakTemperature: Math.max(...fullProfile.map(p => p.measuredValue)),
              recoveryTimeSeconds: result.status === 'fault' ? 8.8 : 4.2,
              mlConfidence: result.confidence,
              stabilityTrend: result.status === 'fault' ? 'deteriorating' : 'stable',
            };
            setTestRuns(prev => [newRun, ...prev]);

            // Append System Event
            const newEvt: SystemEvent = {
              id: `EVT-${Date.now().toString().slice(-4)}`,
              timestamp: new Date().toISOString(),
              severity: outcomeSeverity,
              boardId: targetComp.boardId,
              componentId: targetComp.id,
              title: result.status === 'fault' ? 'Fault Confirmed by ML Model' : 'Diagnostic Test Complete',
              description: `Thermal pulse evaluation finished on ${targetComp.referenceDesignator}. Result: ${result.status.toUpperCase()} (${(result.confidence * 100).toFixed(1)}% ML confidence).`,
            };
            setSystemEvents(prev => [newEvt, ...prev]);

            setVehicle(v => ({
              ...v,
              testsCompletedCount: v.testsCompletedCount + 1,
              lastDiagnosticCycle: new Date().toISOString(),
            }));
          });
        }
      }
    }, 130);

    return () => {
      clearInterval(interval);
      if (stepTimer) clearTimeout(stepTimer);
    };
  }, [isTesting]);

  const startLiveTest = (targetBoardId?: string, targetCompId?: string) => {
    const finalBoardId = targetBoardId || selectedBoardId || 'BRD-03';
    setSelectedBoardId(finalBoardId);
    const finalCompId = targetCompId || selectedComponentId || 'CMP-03-04';
    setSelectedComponentId(finalCompId);
    setIsTesting(true);
    setTestProgress(0);
    setElapsedTestTimeSeconds(0);
    setPulsePhase('ready');
  };

  const stopLiveTest = () => {
    setIsTesting(false);
    setPulsePhase('ready');
  };

  // Fault Injection Control
  const injectComponentFault = (compId: string, status: HealthStatus, anomaly?: string) => {
    setComponents(prev => prev.map(c => {
      if (c.id === compId) {
        return {
          ...c,
          status,
          anomalyCategory: anomaly as any,
          observedDeviationPercent: status === 'fault' ? 28.6 : status === 'warning' ? 12.8 : 1.2,
          latestMeasuredResponse: status === 'fault' ? 68.4 : status === 'warning' ? 58.7 : 38.5,
          latestTestTimestamp: new Date().toISOString(),
        };
      }
      return c;
    }));

    const comp = components.find(c => c.id === compId);
    if (comp) {
      const now = new Date();
      const timeStr = `${now.toTimeString().split(' ')[0]}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      const newTermEvt: TerminalEvent = {
        id: `TRM-INJ-${Date.now()}`,
        timestamp: timeStr,
        category: 'SYSTEM',
        severity: status === 'fault' ? 'fault' : status === 'warning' ? 'warning' : 'info',
        boardId: comp.boardId,
        componentId: comp.id,
        message: `Fault injection shift: ${comp.referenceDesignator} set to ${status.toUpperCase()} (${anomaly || 'manual override'}).`,
      };
      setTerminalEvents(prev => [...prev, newTermEvt]);
    }
  };

  const resetDemoState = () => {
    setSubsystems(INITIAL_SUBSYSTEMS);
    setPhysicalAssemblies(INITIAL_PHYSICAL_ASSEMBLIES);
    setBoards(INITIAL_BOARDS);
    setComponents(INITIAL_COMPONENTS);
    setVehicle(INITIAL_VEHICLE);
    setSelectedSubsystemId(null);
    setSelectedPhysicalAssemblyId(null);
    setSelectedBoardId('');
    setSelectedComponentId('CMP-03-04');
    setLiveTelemetryPoints(generateThermalPulseData('degraded_decay', 25.0));
    setCurrentDiagnosticResult(INITIAL_DIAGNOSTIC_RESULT_TEMP02);
    setTestRuns(INITIAL_TEST_RUNS);
    setSystemEvents(INITIAL_SYSTEM_EVENTS);
    setTerminalEvents(INITIAL_TERMINAL_EVENTS);
    setIsTesting(false);
    setPulsePhase('ready');
    setTestProgress(0);
  };

  return (
    <SystemContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedSubsystemId,
        setSelectedSubsystemId,
        selectedPhysicalAssemblyId,
        setSelectedPhysicalAssemblyId,
        selectedBoardId,
        setSelectedBoardId,
        selectedComponentId,
        setSelectedComponentId,
        selectedSubsystem,
        selectedPhysicalAssembly,
        selectedBoard,
        selectedComponent,
        selectSubsystem,
        selectPhysicalAssemblyAndInspect,
        selectBoardAndInspect,
        selectComponentAndInspect,
        vehicle,
        subsystems,
        physicalAssemblies,
        boards,
        components,
        getBoardComponents,
        getSubsystemBoards,
        getSubsystemAssemblies,
        pulsePhase,
        isTesting,
        testProgress,
        elapsedTestTimeSeconds,
        liveTelemetryPoints,
        currentDiagnosticResult,
        startLiveTest,
        stopLiveTest,
        testRuns,
        systemEvents,
        terminalEvents,
        clearTerminalEvents,
        injectComponentFault,
        resetDemoState,
        simulationNotice: 'Simulated Flight Hardware & Edge ML Model (Virtual CAN Bus Link @ 10ms cycle latency)',
        esp32Connected,
        esp32Telemetry,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = (): SystemContextValue => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
