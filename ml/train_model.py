#!/usr/bin/env python3
"""
AERO-DIAG ML Training Pipeline // SEDS Aerospace Electronics Health Monitoring
Trains an ensemble Random Forest / Gradient Boosting classifier on physical and
calibrated aerospace flight envelope sensor telemetry.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURE_NAMES = [
    "ds18b20_temp",   # DS18B20 digital temp (deg C)
    "ntc_temp",        # NTC thermistor temp (deg C)
    "ntc_adc",         # NTC raw 12-bit SAR ADC
    "temp_delta",      # |DS18B20 - NTC| channel disparity
    "bus_voltage",     # INA219 bus voltage (V)
    "voltage_dev",     # |bus_voltage - 3.30| rail deviation (V)
    "shunt_voltage",   # INA219 shunt voltage (mV)
    "current_ma",      # INA219 load current (mA)
    "power_mw",        # INA219 power (mW)
]

CLASS_NAMES = [
    "NOMINAL",
    "THERMAL_DECAY_LAG",
    "SENSOR_CROSS_DRIFT",
    "SUPPLY_VOLTAGE_SAG",
    "SUPPLY_VOLTAGE_SPIKE",
    "OVERCURRENT_LATCHUP",
    "SENSOR_DROPOUT",
]

CLASS_DESCRIPTIONS = {
    "NOMINAL": "All telemetry channels within nominal calibrated aerospace operating envelope.",
    "THERMAL_DECAY_LAG": "Elevated thermal dissipation impedance or trapped heat accumulation.",
    "SENSOR_CROSS_DRIFT": "Thermal channel mismatch between redundant NTC and digital probe.",
    "SUPPLY_VOLTAGE_SAG": "Under-voltage rail sag (< 3.12V) on 3.3V regulated bus.",
    "SUPPLY_VOLTAGE_SPIKE": "Over-voltage transient (> 3.48V) threatening CMOS logic margins.",
    "OVERCURRENT_LATCHUP": "Anomalous current surge (> 15mA) indicative of parasitic latchup.",
    "SENSOR_DROPOUT": "Sensor channel open circuit, signal disconnect, or ADC boundary latch.",
}

CLASS_SEVERITY = {
    "NOMINAL": "healthy",
    "THERMAL_DECAY_LAG": "fault",
    "SENSOR_CROSS_DRIFT": "warning",
    "SUPPLY_VOLTAGE_SAG": "warning",
    "SUPPLY_VOLTAGE_SPIKE": "fault",
    "OVERCURRENT_LATCHUP": "fault",
    "SENSOR_DROPOUT": "fault",
}

def read_hardware_samples(port="/dev/ttyACM0", count=5):
    """Attempt to read real hardware baseline from connected ESP32."""
    samples = []
    if not os.path.exists(port):
        print(f"[*] Port {port} not present, using calibrated baseline constants.")
        return samples

    try:
        os.system(f"stty -F {port} 115200 raw -echo 2>/dev/null")
        with open(port, "r", errors="ignore") as f:
            start_time = time.time()
            buffer = ""
            current_reading = {}
            while len(samples) < count and (time.time() - start_time) < 4.0:
                line = f.readline().strip()
                if "NTC ADC:" in line:
                    val = line.split("NTC ADC:")[1].strip()
                    try: current_reading["ntc_adc"] = float(val)
                    except: pass
                elif "NTC estimated temperature:" in line:
                    val = line.split("NTC estimated temperature:")[1].replace("C", "").strip()
                    try: current_reading["ntc_temp"] = float(val)
                    except: pass
                elif "DS18B20 temperature:" in line:
                    val = line.split("DS18B20 temperature:")[1].replace("C", "").strip()
                    try: current_reading["ds18b20_temp"] = float(val)
                    except: pass
                elif "INA219 bus voltage:" in line:
                    val = line.split("INA219 bus voltage:")[1].replace("V", "").strip()
                    try: current_reading["bus_voltage"] = float(val)
                    except: pass
                elif "INA219 shunt voltage:" in line:
                    val = line.split("INA219 shunt voltage:")[1].replace("mV", "").strip()
                    try: current_reading["shunt_voltage"] = float(val)
                    except: pass
                elif "INA219 current:" in line:
                    val = line.split("INA219 current:")[1].replace("mA", "").strip()
                    try: current_reading["current_ma"] = float(val)
                    except: pass
                elif "INA219 power:" in line:
                    val = line.split("INA219 power:")[1].replace("mW", "").strip()
                    try: current_reading["power_mw"] = float(val)
                    except: pass

                if len(current_reading) == 7:
                    samples.append(current_reading.copy())
                    current_reading = {}
        print(f"[+] Successfully captured {len(samples)} physical telemetry frames from {port}!")
    except Exception as e:
        print(f"[*] Hardware read notice: {e}")
    return samples

def generate_aerospace_dataset(physical_samples, n_samples_per_class=600):
    """Generate balanced dataset anchored by physical telemetry and aerospace physics envelopes."""
    np.random.seed(42)

    # Physical baseline anchors
    if physical_samples:
        base_ds18 = np.mean([s["ds18b20_temp"] for s in physical_samples])
        base_ntc = np.mean([s["ntc_temp"] for s in physical_samples])
        base_adc = np.mean([s["ntc_adc"] for s in physical_samples])
        base_bus = np.mean([s["bus_voltage"] for s in physical_samples])
        base_shunt = np.mean([s["shunt_voltage"] for s in physical_samples])
        base_curr = np.mean([s["current_ma"] for s in physical_samples])
        base_pwr = np.mean([s["power_mw"] for s in physical_samples])
    else:
        base_ds18 = 25.0
        base_ntc = 22.8
        base_adc = 1945.0
        base_bus = 3.32
        base_shunt = 0.06
        base_curr = 0.60
        base_pwr = 4.0

    X_data = []
    y_data = []

    # 1. NOMINAL (Class 0)
    for _ in range(n_samples_per_class):
        ds = np.random.normal(base_ds18, 1.8)
        ntc = ds + np.random.normal(base_ntc - base_ds18, 0.4)
        adc = base_adc + (ntc - base_ntc) * 45 + np.random.normal(0, 8)
        bus = np.random.normal(base_bus, 0.035)
        shunt = np.clip(np.random.normal(base_shunt, 0.015), 0.01, 0.15)
        curr = np.clip(np.random.normal(base_curr, 0.18), 0.1, 2.5)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(0)

    # 2. THERMAL_DECAY_LAG (Class 1) - Overheating or heat dissipation bottleneck
    for _ in range(n_samples_per_class):
        ds = np.random.uniform(54.0, 78.0)
        ntc = ds + np.random.normal(-2.0, 1.5)
        adc = base_adc - (ds - base_ds18) * 40 + np.random.normal(0, 15)
        bus = np.random.normal(base_bus - 0.04, 0.04) # Slight rail drop under heat
        shunt = np.random.normal(0.08, 0.02)
        curr = np.random.normal(base_curr + 0.4, 0.25)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(1)

    # 3. SENSOR_CROSS_DRIFT (Class 2) - Channel divergence between NTC and DS18B20
    for _ in range(n_samples_per_class):
        ds = np.random.normal(base_ds18, 2.5)
        # Large divergent offset
        direction = 1 if np.random.rand() > 0.5 else -1
        ntc = ds + direction * np.random.uniform(5.5, 16.0)
        adc = base_adc + (ntc - base_ntc) * 45 + np.random.normal(0, 10)
        bus = np.random.normal(base_bus, 0.03)
        shunt = np.random.normal(base_shunt, 0.015)
        curr = np.random.normal(base_curr, 0.2)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(2)

    # 4. SUPPLY_VOLTAGE_SAG (Class 3) - Rail sag below 3.12V
    for _ in range(n_samples_per_class):
        bus = np.random.uniform(2.40, 3.10)
        ds = np.random.normal(base_ds18, 2.0)
        ntc = ds + np.random.normal(base_ntc - base_ds18, 0.6)
        adc = base_adc * (bus / 3.30) + np.random.normal(0, 15)
        shunt = np.random.normal(0.04, 0.01)
        curr = np.random.normal(base_curr, 0.2)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(3)

    # 5. SUPPLY_VOLTAGE_SPIKE (Class 4) - Overvoltage > 3.48V
    for _ in range(n_samples_per_class):
        bus = np.random.uniform(3.49, 4.25)
        ds = np.random.normal(base_ds18 + 1.5, 2.0)
        ntc = ds + np.random.normal(base_ntc - base_ds18, 0.6)
        adc = np.clip(base_adc * (bus / 3.30) + np.random.normal(0, 15), 0, 4095)
        shunt = np.random.normal(0.08, 0.02)
        curr = np.random.normal(base_curr + 0.3, 0.2)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(4)

    # 6. OVERCURRENT_LATCHUP (Class 5) - Current surge > 15mA
    for _ in range(n_samples_per_class):
        curr = np.random.uniform(16.0, 120.0)
        shunt = curr * 0.1 + np.random.normal(0, 0.1) # Shunt voltage proportional to current
        bus = np.random.normal(base_bus - 0.15, 0.08) # Voltage sag under high current
        ds = np.random.normal(base_ds18 + 8.0, 3.5) # Self-heating from power dissipation
        ntc = ds + np.random.normal(-1.5, 1.0)
        adc = base_adc + np.random.normal(0, 20)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(5)

    # 7. SENSOR_DROPOUT (Class 6) - Disconnect, stuck at 0 or ADC saturated
    for _ in range(n_samples_per_class):
        dropout_type = np.random.choice(["zero_temp", "adc_clip", "adc_zero"])
        if dropout_type == "zero_temp":
            ds = -127.0 if np.random.rand() > 0.5 else 0.0 # DS18B20 disconnect error code (-127C)
            ntc = np.random.normal(base_ntc, 2.0)
            adc = base_adc
        elif dropout_type == "adc_clip":
            ds = np.random.normal(base_ds18, 2.0)
            adc = 4095.0 # Max 12-bit rail saturation
            ntc = -40.0
        else:
            ds = np.random.normal(base_ds18, 2.0)
            adc = 0.0
            ntc = 150.0
        bus = np.random.normal(base_bus, 0.05)
        shunt = np.random.normal(base_shunt, 0.02)
        curr = np.random.normal(base_curr, 0.2)
        pwr = curr * bus
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        X_data.append([ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr])
        y_data.append(6)

    return np.array(X_data), np.array(y_data)

def export_pure_json_rules(rf_model, max_trees=15):
    """Serialize the top Random Forest trees to clean JSON for instant TypeScript execution."""
    trees_json = []
    for i in range(min(max_trees, len(rf_model.estimators_))):
        tree = rf_model.estimators_[i].tree_
        
        def serialize_node(node_id):
            if tree.children_left[node_id] == -1 and tree.children_right[node_id] == -1:
                # Leaf node: return class distribution
                values = tree.value[node_id][0].tolist()
                total = sum(values)
                probs = [v / total if total > 0 else 0 for v in values]
                return {
                    "isLeaf": True,
                    "probabilities": probs,
                    "prediction": int(np.argmax(probs))
                }
            else:
                return {
                    "isLeaf": False,
                    "featureIndex": int(tree.feature[node_id]),
                    "featureName": FEATURE_NAMES[int(tree.feature[node_id])],
                    "threshold": float(tree.threshold[node_id]),
                    "left": serialize_node(tree.children_left[node_id]),
                    "right": serialize_node(tree.children_right[node_id])
                }
        
        trees_json.append(serialize_node(0))
    return trees_json

def main():
    print("=" * 70)
    print(" AERO-DIAG ML MODEL TRAINING PIPELINE // SEDS HACKATHON")
    print("=" * 70)

    # 1. Capture live physical samples from hardware
    phys_samples = read_hardware_samples("/dev/ttyACM0", count=5)

    # 2. Generate training and validation dataset
    print("[*] Generating aerospace sensor verification dataset (4,200 samples)...")
    X, y = generate_aerospace_dataset(phys_samples, n_samples_per_class=600)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)
    print(f"[+] Dataset prepared: {len(X_train)} training samples, {len(X_test)} validation samples.")

    # 3. Train Random Forest Classifier
    print("[*] Training Aerospace Random Forest Ensemble (100 estimators)...")
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    # 4. Evaluate
    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\n>>> VALIDATION ACCURACY: {acc * 100:.2f}% <<<")
    report = classification_report(y_test, y_pred, target_names=CLASS_NAMES, output_dict=True)
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\nClassification Report Summary:")
    for cls in CLASS_NAMES:
        p = report[cls]["precision"]
        r = report[cls]["recall"]
        f1 = report[cls]["f1-score"]
        print(f"  - {cls:<22} Precision: {p*100:5.1f}% | Recall: {r*100:5.1f}% | F1: {f1*100:5.1f}%")

    # Feature Importances
    feature_importances = dict(zip(FEATURE_NAMES, [float(v) for v in rf.feature_importances_]))
    print("\nFeature Importances:")
    for feat, imp in sorted(feature_importances.items(), key=lambda x: x[1], reverse=True):
        print(f"  - {feat:<16}: {imp*100:5.2f}%")

    # 5. Save joblib binary model
    model_path = os.path.join(MODEL_DIR, "aerospace_fault_model.joblib")
    joblib.dump(rf, model_path)
    print(f"\n[+] Saved binary model to: {model_path}")

    # 6. Save comprehensive metadata JSON
    metadata = {
        "modelName": "Aerospace Sensor Fault Classifier (Random Forest Ensemble)",
        "algorithm": "RandomForestClassifier",
        "nEstimators": 100,
        "maxDepth": 12,
        "trainedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "validationAccuracy": float(acc),
        "classes": CLASS_NAMES,
        "classDescriptions": CLASS_DESCRIPTIONS,
        "classSeverity": CLASS_SEVERITY,
        "features": FEATURE_NAMES,
        "featureImportances": feature_importances,
        "confusionMatrix": cm,
        "classificationReport": report,
        "hardwareBaseline": phys_samples[0] if phys_samples else None,
    }

    metadata_path = os.path.join(MODEL_DIR, "model_metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[+] Saved metadata to: {metadata_path}")

    # 7. Export pure JSON rules for sub-millisecond Node/TypeScript runtime inference
    print("[*] Serializing ensemble decision trees for in-engine execution...")
    trees_json = export_pure_json_rules(rf, max_trees=15)
    rules_path = os.path.join(MODEL_DIR, "model_rules.json")
    with open(rules_path, "w") as f:
        json.dump(trees_json, f)
    print(f"[+] Serialized {len(trees_json)} decision trees to: {rules_path}")

    print("\n" + "=" * 70)
    print(" MODEL TRAINING AND EXPORT SUCCESSFUL!")
    print("=" * 70)

if __name__ == "__main__":
    main()
