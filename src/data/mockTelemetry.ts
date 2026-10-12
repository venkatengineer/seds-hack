import { TelemetryDataPoint } from '../types/vehicle';

export type SignalBehaviorMode = 'healthy' | 'degraded_decay' | 'stuck' | 'noisy' | 'intermittent';

/**
 * Generates realistic thermal pulse transient curve data.
 * Pulse applied between t = 1.0s and t = 3.5s (duration 2.5s).
 * Total duration: 10.0 seconds, sampled at 0.2s increments (51 points).
 */
export function generateThermalPulseData(
  mode: SignalBehaviorMode = 'healthy',
  baselineTemp: number = 25.0,
  peakTempIncrease: number = 20.0,
  noiseLevel: number = 0.25
): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const totalDuration = 10.0;
  const step = 0.2;
  const pulseStart = 1.0;
  const pulseEnd = 3.5;

  for (let t = 0; t <= totalDuration + 0.001; t += step) {
    const elapsed = parseFloat(t.toFixed(1));
    const isPulseActive = elapsed >= pulseStart && elapsed <= pulseEnd;

    // Standard healthy expected response curve (exponential heating followed by Newton cooling)
    let expectedTemp = baselineTemp;
    if (elapsed < pulseStart) {
      expectedTemp = baselineTemp;
    } else if (elapsed <= pulseEnd) {
      // Heating phase: 1 - exp(-k * dt)
      const dt = elapsed - pulseStart;
      expectedTemp = baselineTemp + peakTempIncrease * (1 - Math.exp(-dt / 0.8));
    } else {
      // Cooling phase: Peak * exp(-k * dt) + baseline
      const dt = elapsed - pulseEnd;
      const peakReached = baselineTemp + peakTempIncrease * (1 - Math.exp(-(pulseEnd - pulseStart) / 0.8));
      expectedTemp = baselineTemp + (peakReached - baselineTemp) * Math.exp(-dt / 1.6);
    }

    // Expected confidence envelope (+/- 2.5 deg)
    const lowerThreshold = parseFloat((expectedTemp - 2.5).toFixed(2));
    const upperThreshold = parseFloat((expectedTemp + 2.5).toFixed(2));

    // Simulated measured curve based on behavior mode
    let measuredTemp = expectedTemp;
    let anomalyFlag = false;

    switch (mode) {
      case 'healthy':
        // Small realistic thermal noise
        const healthyNoise = (Math.sin(elapsed * 4) * 0.15 + (Math.random() - 0.5) * noiseLevel);
        measuredTemp = expectedTemp + healthyNoise;
        break;

      case 'degraded_decay':
        // Degraded sensor: thermal decay lag (poor thermal dissipation bond)
        if (elapsed < pulseStart) {
          measuredTemp = baselineTemp + (Math.random() - 0.5) * 0.2;
        } else if (elapsed <= pulseEnd) {
          // Overshoot due to heat trapping
          const dt = elapsed - pulseStart;
          measuredTemp = baselineTemp + (peakTempIncrease * 1.35) * (1 - Math.exp(-dt / 0.7));
        } else {
          // Severely delayed cooling: decay constant is 4.8s instead of 1.6s
          const dt = elapsed - pulseEnd;
          const peak = baselineTemp + (peakTempIncrease * 1.35) * (1 - Math.exp(-(pulseEnd - pulseStart) / 0.7));
          measuredTemp = baselineTemp + (peak - baselineTemp) * Math.exp(-dt / 4.8);
        }
        measuredTemp += (Math.random() - 0.5) * noiseLevel;
        // Anomaly flagged if outside threshold bounds
        if (measuredTemp > upperThreshold || (elapsed > 4.5 && measuredTemp > baselineTemp + 3.0)) {
          anomalyFlag = true;
        }
        break;

      case 'stuck':
        // Sensor stuck / disconnected / zero sensitivity to pulse
        measuredTemp = baselineTemp + (Math.random() - 0.5) * 0.1;
        if (elapsed > 1.5 && elapsed < 8.0) {
          anomalyFlag = true;
        }
        break;

      case 'noisy':
        // High electrical noise or loose bond wire
        const erraticJitter = (Math.sin(elapsed * 12) * 3.5 + (Math.random() - 0.5) * 4.2);
        measuredTemp = expectedTemp + erraticJitter;
        if (Math.abs(erraticJitter) > 2.8) {
          anomalyFlag = true;
        }
        break;

      case 'intermittent':
        // Occasional signal dropout / spiking
        measuredTemp = expectedTemp + (Math.random() - 0.5) * 0.3;
        if ((elapsed >= 2.0 && elapsed <= 2.6) || (elapsed >= 5.2 && elapsed <= 5.8)) {
          measuredTemp = baselineTemp - 8.0; // Dropout
          anomalyFlag = true;
        }
        break;
    }

    points.push({
      elapsedSeconds: elapsed,
      measuredValue: parseFloat(measuredTemp.toFixed(2)),
      expectedValue: parseFloat(expectedTemp.toFixed(2)),
      lowerThreshold,
      upperThreshold,
      pulseActive: isPulseActive,
      anomalyDetected: anomalyFlag,
    });
  }

  return points;
}
