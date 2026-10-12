import { TelemetryDataPoint } from '../types/vehicle';
import { generateThermalPulseData, SignalBehaviorMode } from '../data/mockTelemetry';

export interface TelemetryStreamConfig {
  mode: SignalBehaviorMode;
  baselineTemp: number;
  noiseLevel: number;
  samplingIntervalMs: number;
}

export class TelemetryAdapter {
  /**
   * Generates a deterministic simulated test run curve
   */
  getTransientProfile(mode: SignalBehaviorMode = 'healthy', baseline: number = 25.0): TelemetryDataPoint[] {
    return generateThermalPulseData(mode, baseline, 20.0, 0.2);
  }

  /**
   * Simulates real-time live streaming point-by-point
   */
  streamTransientRun(
    mode: SignalBehaviorMode,
    baseline: number,
    onPoint: (point: TelemetryDataPoint, progressPercent: number) => void,
    onComplete: (allPoints: TelemetryDataPoint[]) => void,
    onAbort?: () => void
  ): () => void {
    const fullProfile = this.getTransientProfile(mode, baseline);
    let currentIndex = 0;
    let isCancelled = false;

    const interval = setInterval(() => {
      if (isCancelled) {
        clearInterval(interval);
        onAbort?.();
        return;
      }

      if (currentIndex < fullProfile.length) {
        const point = fullProfile[currentIndex];
        const progress = Math.round(((currentIndex + 1) / fullProfile.length) * 100);
        onPoint(point, progress);
        currentIndex++;
      } else {
        clearInterval(interval);
        onComplete(fullProfile);
      }
    }, 120); // 120ms per data point for responsive simulation (~6 seconds total test)

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }
}

export const telemetryAdapter = new TelemetryAdapter();
