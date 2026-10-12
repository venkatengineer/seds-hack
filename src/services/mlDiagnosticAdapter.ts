import { ComponentItem, MLDiagnosticResult, TelemetryDataPoint } from '../types/vehicle';
import { INITIAL_DIAGNOSTIC_RESULT_TEMP02 } from '../data/mockHistory';

export interface IMLDiagnosticAdapter {
  inferDiagnosis(
    component: ComponentItem,
    boardName: string,
    telemetrySeries: TelemetryDataPoint[]
  ): Promise<MLDiagnosticResult>;
}

export class MLDiagnosticAdapter implements IMLDiagnosticAdapter {
  /**
   * Analyzes the measured thermal transient series and produces structured diagnostic results.
   * Future Integration Note: Replace this method with an HTTP POST to the real ML model API.
   */
  async inferDiagnosis(
    component: ComponentItem,
    _boardName: string,
    telemetrySeries: TelemetryDataPoint[]
  ): Promise<MLDiagnosticResult> {
    // Check if this component has the pre-configured critical demo fault
    if (component.referenceDesignator === 'TEMP-02' || component.id === 'CMP-03-04') {
      return {
        ...INITIAL_DIAGNOSTIC_RESULT_TEMP02,
        timestamp: new Date().toISOString(),
      };
    }

    // Inspect the telemetry points to dynamically evaluate metrics
    const peakMeasured = Math.max(...telemetrySeries.map(p => p.measuredValue));
    const peakExpected = Math.max(...telemetrySeries.map(p => p.expectedValue));
    const anomalyPointsCount = telemetrySeries.filter(p => p.anomalyDetected).length;

    if (anomalyPointsCount > 5 || component.status === 'fault') {
      return {
        id: `ML-DIAG-${Date.now()}`,
        testRunId: `TR-${Date.now().toString().slice(-4)}`,
        componentId: component.id,
        boardId: component.boardId,
        status: 'fault',
        anomalyType: 'Severe Transient Response Deviation',
        observedBehavior: `Measured peak response (${peakMeasured.toFixed(1)} ${component.unit}) diverged significantly from expected nominal peak (${peakExpected.toFixed(1)} ${component.unit}).`,
        confidence: 0.925,
        isSimulated: true,
        severity: 'critical',
        possibleCauses: [
          'Possible component sensor junction degradation or semiconductor latch.',
          'Thermal dissipation channel compromise or detachment.',
          'Intermittent bond wire impedance elevation.',
        ],
        evidence: [
          {
            id: 'EV-D1',
            description: `Divergence threshold exceeded across ${anomalyPointsCount} sample points.`,
            measuredVsExpected: `Peak: ${peakMeasured.toFixed(1)} vs Nom: ${peakExpected.toFixed(1)} ${component.unit}`,
            confidenceContribution: 0.52,
          },
          {
            id: 'EV-D2',
            description: 'Transient decay gradient outside 95% statistical envelope.',
            measuredVsExpected: 'Decay slope delta > +25%',
            confidenceContribution: 0.40,
          },
        ],
        recommendedActions: [
          'Halt high-duty operations on this board bay.',
          'Execute secondary verification sweep with independent reference channel.',
          'Schedule hardware inspection for physical solder joint integrity.',
        ],
        timestamp: new Date().toISOString(),
        deviatingMetrics: [
          {
            metricName: 'Peak Amplitude Delta',
            measured: peakMeasured,
            baseline: peakExpected,
            deviation: `+${(((peakMeasured - peakExpected) / (peakExpected || 1)) * 100).toFixed(1)}%`,
            unit: component.unit,
          },
        ],
      };
    } else if (component.status === 'warning' || anomalyPointsCount > 0) {
      return {
        id: `ML-DIAG-${Date.now()}`,
        testRunId: `TR-${Date.now().toString().slice(-4)}`,
        componentId: component.id,
        boardId: component.boardId,
        status: 'warning',
        anomalyType: 'Suspected Marginal Tolerance Shift',
        observedBehavior: 'Sensor output responded to thermal pulse but showed slight phase jitter and elevated steady-state offset.',
        confidence: 0.784,
        isSimulated: true,
        severity: 'moderate',
        possibleCauses: [
          'Ambient thermal boundary condition variation.',
          'Minor supply rail ripple causing reference jitter.',
          'Early-stage packaging stress or adhesive aging.',
        ],
        evidence: [
          {
            id: 'EV-W1',
            description: 'Marginal baseline overshoot during cooldown phase.',
            measuredVsExpected: `Recovery offset +${(peakMeasured - peakExpected).toFixed(2)} ${component.unit}`,
            confidenceContribution: 0.48,
          },
        ],
        recommendedActions: [
          'Log trend over next 5 scheduled automated cycles.',
          'Verify input supply rail stability under load.',
        ],
        timestamp: new Date().toISOString(),
        deviatingMetrics: [
          {
            metricName: 'Baseline Offset',
            measured: peakMeasured,
            baseline: peakExpected,
            deviation: '+12.4%',
            unit: component.unit,
          },
        ],
      };
    }

    // Default healthy diagnosis
    return {
      id: `ML-DIAG-${Date.now()}`,
      testRunId: `TR-${Date.now().toString().slice(-4)}`,
      componentId: component.id,
      boardId: component.boardId,
      status: 'healthy',
      anomalyType: 'Nominal Transient Conformance',
      observedBehavior: 'Measured sensor response faithfully matches the theoretical finite-element thermal rise and cooling curve within ±1.5% tolerance bounds.',
      confidence: 0.982,
      isSimulated: true,
      severity: 'low',
      possibleCauses: [
        'Normal nominal operating regime.',
        'Thermal dissipation interface and bonding intact.',
      ],
      evidence: [
        {
          id: 'EV-H1',
          description: 'Thermal rise time constant (τ_rise = 0.81s) strictly within specified 0.75 - 0.85s band.',
          measuredVsExpected: 'Measured: 0.81s | Nominal: 0.80s',
          confidenceContribution: 0.60,
        },
        {
          id: 'EV-H2',
          description: 'Residual delta post-recovery < 0.2°C.',
          measuredVsExpected: 'Quiescent baseline recovered in 4.1s',
          confidenceContribution: 0.38,
        },
      ],
      recommendedActions: [
        'No corrective action required.',
        'Retain in routine periodic monitoring matrix.',
      ],
      timestamp: new Date().toISOString(),
      deviatingMetrics: [],
    };
  }
}

export const mlDiagnosticAdapter = new MLDiagnosticAdapter();
