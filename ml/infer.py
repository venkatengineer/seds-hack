#!/usr/bin/env python3
"""
AERO-DIAG ML Model Inference Runner // SEDS Aerospace Diagnostics
Executes live inference on either manual arguments or streaming from /dev/ttyACM0.
"""

import sys
import os
import json
import argparse
import joblib
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "aerospace_fault_model.joblib")
META_PATH = os.path.join(MODEL_DIR, "model_metadata.json")

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run train_model.py first.")
    model = joblib.load(MODEL_PATH)
    with open(META_PATH, "r") as f:
        meta = json.load(f)
    return model, meta

def predict_single(features, model, meta):
    """Run prediction on a dictionary or list of features."""
    if isinstance(features, dict):
        ds = float(features.get("ds18b20_temp", 25.0))
        ntc = float(features.get("ntc_temp", 22.8))
        adc = float(features.get("ntc_adc", 1945.0))
        bus = float(features.get("bus_voltage", 3.32))
        shunt = float(features.get("shunt_voltage", 0.06))
        curr = float(features.get("current_ma", 0.6))
        pwr = float(features.get("power_mw", curr * bus))
        temp_delta = abs(ds - ntc)
        v_dev = abs(bus - 3.30)
        vec = [ds, ntc, adc, temp_delta, bus, v_dev, shunt, curr, pwr]
    else:
        vec = features

    X = np.array([vec])
    pred_idx = int(model.predict(X)[0])
    probs = model.predict_proba(X)[0].tolist()

    class_name = meta["classes"][pred_idx]
    confidence = probs[pred_idx]
    severity = meta["classSeverity"].get(class_name, "healthy")
    desc = meta["classDescriptions"].get(class_name, "")

    return {
        "classification": class_name,
        "classIndex": pred_idx,
        "confidence": float(confidence),
        "severity": severity,
        "description": desc,
        "probabilities": dict(zip(meta["classes"], [float(p) for p in probs])),
        "features": {
            "ds18b20_temp": vec[0],
            "ntc_temp": vec[1],
            "ntc_adc": vec[2],
            "temp_delta": vec[3],
            "bus_voltage": vec[4],
            "voltage_dev": vec[5],
            "shunt_voltage": vec[6],
            "current_ma": vec[7],
            "power_mw": vec[8],
        }
    }

def main():
    parser = argparse.ArgumentParser(description="AERO-DIAG ML Inference Runner")
    parser.add_argument("--live", action="store_true", help="Read directly from /dev/ttyACM0")
    parser.add_argument("--port", default="/dev/ttyACM0", help="Serial port for live mode")
    parser.add_argument("--ds18b20", type=float, default=25.0)
    parser.add_argument("--ntc", type=float, default=22.8)
    parser.add_argument("--adc", type=float, default=1945.0)
    parser.add_argument("--bus", type=float, default=3.32)
    parser.add_argument("--shunt", type=float, default=0.06)
    parser.add_argument("--current", type=float, default=0.6)
    parser.add_argument("--power", type=float, default=2.0)
    parser.add_argument("--json", action="store_true", help="Output pure JSON")

    args = parser.parse_args()
    model, meta = load_model()

    if args.live:
        from train_model import read_hardware_samples
        print(f"[*] Reading hardware sample from {args.port}...")
        samples = read_hardware_samples(args.port, count=1)
        if not samples:
            print("[!] Could not read from hardware. Using default nominal values.")
            input_dict = {
                "ds18b20_temp": args.ds18b20,
                "ntc_temp": args.ntc,
                "ntc_adc": args.adc,
                "bus_voltage": args.bus,
                "shunt_voltage": args.shunt,
                "current_ma": args.current,
                "power_mw": args.power,
            }
        else:
            input_dict = samples[0]
    else:
        input_dict = {
            "ds18b20_temp": args.ds18b20,
            "ntc_temp": args.ntc,
            "ntc_adc": args.adc,
            "bus_voltage": args.bus,
            "shunt_voltage": args.shunt,
            "current_ma": args.current,
            "power_mw": args.power,
        }

    result = predict_single(input_dict, model, meta)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("\n" + "=" * 60)
        print(" AERO-DIAG INFERENCE RESULT")
        print("=" * 60)
        print(f" Classification : {result['classification']}")
        print(f" Severity       : {result['severity'].upper()}")
        print(f" Confidence     : {result['confidence'] * 100:.2f}%")
        print(f" Description    : {result['description']}")
        print("-" * 60)
        print(" Class Probabilities:")
        for cls, prob in result["probabilities"].items():
            bar = "█" * int(prob * 30)
            print(f"  - {cls:<22} {prob*100:5.1f}% | {bar}")
        print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
