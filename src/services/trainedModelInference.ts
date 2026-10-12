import { MODEL_RULES, MODEL_METADATA } from './modelData.ts';

export interface TelemetryFeatures {
  ds18b20Temp: number;
  ntcTemp: number;
  ntcAdc?: number;
  busVoltage: number;
  shuntVoltage?: number;
  currentMa?: number;
  powerMw?: number;
}

export interface MLInferenceResult {
  classification: string;
  classIndex: number;
  severity: 'healthy' | 'warning' | 'fault';
  confidence: number;
  description: string;
  probabilities: Record<string, number>;
  topFeatureContributors: Array<{
    name: string;
    importance: number;
    value: number;
    unit: string;
  }>;
  modelName: string;
  algorithm: string;
  validationAccuracy: number;
  timestamp: string;
  isTrainedModel: boolean;
}

interface TreeNode {
  readonly isLeaf: boolean;
  readonly probabilities?: readonly number[];
  readonly prediction?: number;
  readonly featureIndex?: number;
  readonly featureName?: string;
  readonly threshold?: number;
  readonly left?: TreeNode;
  readonly right?: TreeNode;
}

const trees: readonly TreeNode[] = MODEL_RULES as unknown as readonly TreeNode[];

function evaluateTree(node: TreeNode, featureVector: number[]): number[] {
  if (node.isLeaf) {
    return (node.probabilities ? [...node.probabilities] : [1, 0, 0, 0, 0, 0, 0]);
  }
  const fIdx = node.featureIndex ?? 0;
  const thresh = node.threshold ?? 0;
  const featVal = featureVector[fIdx];

  if (featVal <= thresh) {
    return node.left ? evaluateTree(node.left, featureVector) : [1, 0, 0, 0, 0, 0, 0];
  } else {
    return node.right ? evaluateTree(node.right, featureVector) : [1, 0, 0, 0, 0, 0, 0];
  }
}

export function runTrainedModelInference(input: TelemetryFeatures): MLInferenceResult {
  const ds18 = input.ds18b20Temp;
  const ntc = input.ntcTemp;
  const adc = input.ntcAdc ?? 1945.0;
  const tempDelta = Math.abs(ds18 - ntc);
  const bus = input.busVoltage;
  const vDev = Math.abs(bus - 3.30);
  const shunt = input.shuntVoltage ?? 0.06;
  const curr = input.currentMa ?? 0.60;
  const pwr = input.powerMw ?? (curr * bus);

  // Vector matching FEATURE_NAMES:
  // ["ds18b20_temp", "ntc_temp", "ntc_adc", "temp_delta", "bus_voltage", "voltage_dev", "shunt_voltage", "current_ma", "power_mw"]
  const vector = [ds18, ntc, adc, tempDelta, bus, vDev, shunt, curr, pwr];

  // Aggregate tree probability distributions
  const numClasses = MODEL_METADATA.classes.length;
  const aggregatedProbs = new Array(numClasses).fill(0);

  for (const tree of trees) {
    const treeProbs = evaluateTree(tree, vector);
    for (let c = 0; c < numClasses; c++) {
      aggregatedProbs[c] += (treeProbs[c] || 0) / trees.length;
    }
  }

  // Find argmax
  let maxIdx = 0;
  let maxProb = 0;
  for (let c = 0; c < numClasses; c++) {
    if (aggregatedProbs[c] > maxProb) {
      maxProb = aggregatedProbs[c];
      maxIdx = c;
    }
  }

  const className = MODEL_METADATA.classes[maxIdx] || 'NOMINAL';
  const severity = (MODEL_METADATA.classSeverity as Record<string, 'healthy' | 'warning' | 'fault'>)[className] || 'healthy';
  const description = (MODEL_METADATA.classDescriptions as Record<string, string>)[className] || '';

  const probMap: Record<string, number> = {};
  MODEL_METADATA.classes.forEach((cls: string, idx: number) => {
    probMap[cls] = aggregatedProbs[idx];
  });

  // Top feature contributors based on feature importance and deviations
  const featureList = [
    { name: 'Channel Temp Delta (|DS18B20 - NTC|)', key: 'temp_delta', val: tempDelta, unit: '°C' },
    { name: 'INA219 Rail Bus Voltage', key: 'bus_voltage', val: bus, unit: 'V' },
    { name: 'NTC 12-bit SAR ADC', key: 'ntc_adc', val: adc, unit: 'LSB' },
    { name: 'DS18B20 Digital Temp', key: 'ds18b20_temp', val: ds18, unit: '°C' },
    { name: '3.3V Rail Deviation', key: 'voltage_dev', val: vDev, unit: 'V' },
    { name: 'INA219 Load Current', key: 'current_ma', val: curr, unit: 'mA' },
  ];

  const topContributors = featureList.map(f => ({
    name: f.name,
    importance: (MODEL_METADATA.featureImportances as Record<string, number>)[f.key] || 0.1,
    value: f.val,
    unit: f.unit,
  }));

  return {
    classification: className,
    classIndex: maxIdx,
    severity,
    confidence: maxProb,
    description,
    probabilities: probMap,
    topFeatureContributors: topContributors,
    modelName: MODEL_METADATA.modelName,
    algorithm: MODEL_METADATA.algorithm,
    validationAccuracy: MODEL_METADATA.validationAccuracy,
    timestamp: new Date().toISOString(),
    isTrainedModel: true,
  };
}

export const modelMetadata = MODEL_METADATA;
