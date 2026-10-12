# AERO-DIAG // Aerospace Electronics Health Monitoring & Fault Diagnostics Console

A premium, cinematic, production-quality telemetry and diagnostics web dashboard engineered for aerospace and vehicle electronics sensor fault-detection systems.

The console continuously monitors controlled thermal pulse stimuli applied to electronics sensors, captures transient heating and cooling curves, compares them to physics-based healthy baselines, and employs machine learning to diagnose anomalies and identify potential root causes.

---

## 1. Visual Hierarchy & Architecture

The system visualizes the complete diagnostics hierarchy:

$$\text{Vehicle} \longrightarrow \text{Electronics Boards} \longrightarrow \text{Components} \longrightarrow \text{Sensor Response} \longrightarrow \text{ML Fault Diagnosis}$$

1. **Vehicle Level (`VEH-ORION-IX`)**: Suborbital and prototype testbed with 6 monitored bays, real-time health aggregation, active fault count, and mission clock.
2. **Electronics Boards Level (`BRD-01` to `BRD-06`)**:
   - `BRD-01`: Avionics Bay A - Nav Core (Guidance & IMU)
   - `BRD-02`: Flight Control Board (Actuator Driver & Resolvers)
   - `BRD-03`: Sensor Interface Board (Analog Front-End & Thermal Pulse Stimulus) — **Target Fault Demo Board**
   - `BRD-04`: Power Management Board (Synchronous Buck & LDO Regulators) — **Warning Demo Board**
   - `BRD-05`: Telemetry & Transceiver Board (S-Band Transmitter & RF LNA)
   - `BRD-06`: Thermal Monitoring Board (Precision Pulse Driver & Cryo Probes)
3. **Component Level (`U1`, `U2`, `TEMP-01`, `TEMP-02`, etc.)**:
   - Realistic PCB coordinate placements, package types (SOIC-8, TQFP-48, LGA-24, D2PAK).
   - Component Inspector with measured output, expected tolerances, and deviation bars.
4. **Sensor Response Level (Live Thermal Pulse Runner)**:
   - 7-stage lifecycle: `Ready → Pulse Initiated → Acquisition → Signal Processing → ML Inference → Diagnostics → Completed`.
   - Real-time Recharts time-series graph with 250mA stimulus window, healthy baseline curve, measured curve, tolerance envelope, and anomaly threshold markers.
5. **ML Fault Diagnosis Level**:
   - Empirical observed behavior, quantitative measured metrics, unconfirmed root-cause hypotheses, empirical evidence weights, and recommended engineering next steps.

---

## 2. Key Pages & Features

| View | Key Capabilities |
| :--- | :--- |
| **Mission Overview** | Dominant 3D Vehicle Stage with complete PBR aerospace vehicle geometry, real continuous OrbitControls with damping, 3 inspection modes (**Exterior**, **Cutaway**, **Exploded**), 2D precision engineering blueprint, minimal diagnostic status strip, and non-intrusive floating bay HUD. |
| **Vehicle Topology** | Structural tree hierarchy displaying Vehicle → Boards → Components with status filtering (All, Healthy, Warnings, Faults). |
| **Board Diagnostics** | Interactive PCB Explorer with dark substrate, gold pads, routed copper traces, silkscreen labels, zoom & pan controls, search, and deep Component Inspector. |
| **Live Telemetry** | Active thermal pulse execution simulator with 7-phase sequence, response curves (Healthy, Degraded, Stuck, Noisy, Intermittent), and stimulus protocol controls. |
| **Fault Analysis** | Detailed ML root-cause analysis console for `TEMP-02` and any component, detailing physical behavior, potential causes, evidence contribution, and verification actions. |
| **Test History** | Filterable, searchable, and sortable historical test log with side-by-side / overlaid transient curve comparison modal. |
| **System Settings** | Hardware controller bus settings (CAN-FD, MIL-STD-1553, SpaceWire, Ethernet-DAQ), ML confidence thresholds, and live interactive Fault Injection testbed. |
| **Telemetry Reports** | Official printable aerospace diagnostic report and one-click CSV telemetry export. |

---

## 3. Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8
- **Styling**: Tailwind CSS v4 with dark graphite & aerospace technical theme
- **3D Visualization**: Three.js (WebGL with orbit controls, cutaway materials, raycasting, glowing LEDs)
- **2D Schematic**: Layered SVG technical cutaway blueprint with bay callouts
- **Time-Series Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Centralized React Context (`SystemContext`) with deterministic health aggregation

---

## 4. Hardware & ML Integration Contracts

The frontend is modularized with adapters in `src/services/` to facilitate drop-in connection to physical hardware controllers and remote ML inference servers:

- **Hardware Adapter (`hardwareAdapter.ts`)**: Defines `IHardwareControllerAdapter` with `startPulseTest(cmd, onDataPoint)` and `abortPulseTest()`. Connects to CAN-FD / Ethernet-DAQ once wired.
- **Telemetry Adapter (`telemetryAdapter.ts`)**: Implements deterministic transient curves and live point-by-point streaming.
- **ML Diagnostic Adapter (`mlDiagnosticAdapter.ts`)**: Defines `IMLDiagnosticAdapter` with `inferDiagnosis(component, boardName, telemetrySeries)`, returning structured evidence, probabilities, and recommendations.

> **Simulation Notice**: The software explicitly flags simulation mode on all headers, charts, and report exports to ensure simulated data is never mistaken for flight-critical hardware telemetry.

---

## 5. Development & Build Instructions

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview
```
