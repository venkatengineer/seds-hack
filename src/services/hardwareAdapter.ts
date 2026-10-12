/**
 * Hardware Controller Adapter Interface
 * 
 * Future Integration Contract:
 * When connecting to real aerospace test hardware, implement this interface
 * pointing to real CAN-bus / Ethernet / Serial DAQ controllers.
 * 
 * Note: Never claim physical heat is generated when operating in simulation mode.
 */

export interface HardwarePulseCommand {
  boardId: string;
  componentId: string;
  pulseDurationMs: number;
  injectionCurrentMa: number;
  samplingIntervalMs: number;
}

export interface HardwareConnectionInfo {
  mode: 'connected' | 'disconnected' | 'simulated';
  controllerIp?: string;
  busType: 'CAN-FD' | 'MIL-STD-1553' | 'SpaceWire' | 'Ethernet-DAQ' | 'Simulated-VBus';
  latencyMs: number;
  firmwareVersion: string;
  simulatedPulseNotice: string;
}

export interface IHardwareControllerAdapter {
  getConnectionInfo(): HardwareConnectionInfo;
  startPulseTest(cmd: HardwarePulseCommand, onDataPoint: (pt: any) => void): Promise<boolean>;
  abortPulseTest(): Promise<boolean>;
  isTestRunning(): boolean;
}

export class SimulatedHardwareAdapter implements IHardwareControllerAdapter {
  private running: boolean = false;
  private abortRequested: boolean = false;

  getConnectionInfo(): HardwareConnectionInfo {
    return {
      mode: 'simulated',
      busType: 'Simulated-VBus',
      latencyMs: 1.2,
      firmwareVersion: 'SIM-v2.4.0-AERO',
      simulatedPulseNotice: 'PROTOTYPE SIMULATION ACTIVE: Software thermal pulse emulation only. Real thermal stimulus will be commanded via physical DAQ when hardware is wired.',
    };
  }

  async startPulseTest(
    cmd: HardwarePulseCommand, 
    _onDataPoint: (pt: any) => void
  ): Promise<boolean> {
    this.running = true;
    this.abortRequested = false;
    return true;
  }

  async abortPulseTest(): Promise<boolean> {
    this.abortRequested = true;
    this.running = false;
    return true;
  }

  isTestRunning(): boolean {
    return this.running;
  }
}

export const hardwareAdapter = new SimulatedHardwareAdapter();
