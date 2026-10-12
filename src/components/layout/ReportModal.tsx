import React from 'react';
import { useSystem } from '../../context/SystemContext';
import { X, Printer, Download, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const {
    vehicle,
    boards,
    components,
    testRuns,
    currentDiagnosticResult,
  } = useSystem();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['TestRunId', 'Timestamp', 'VehicleId', 'BoardId', 'BoardName', 'ComponentRef', 'TestType', 'Outcome', 'PeakTemp_C', 'RecoverySec', 'MLConfidence', 'StabilityTrend'];
    const rows = testRuns.map(r => [
      r.id,
      r.timestamp,
      r.vehicleId,
      r.boardId,
      `"${r.boardName}"`,
      r.componentRef,
      r.testType,
      r.outcome,
      r.peakTemperature,
      r.recoveryTimeSeconds,
      r.mlConfidence ? (r.mlConfidence * 100).toFixed(1) + '%' : 'N/A',
      r.stabilityTrend,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AERO_TELEMETRY_DIAGNOSTICS_${vehicle.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0c1017] border border-[#1e2738] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:m-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="p-4 border-b border-[#1c2433] flex items-center justify-between bg-[#080b11]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wide text-white uppercase font-mono">
              OFFICIAL TELEMETRY & SENSOR HEALTH DIAGNOSTIC REPORT
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#141b29] hover:bg-[#1c263a] border border-[#232f46] text-slate-200 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>PRINT REPORT</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-600/50 text-cyan-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 font-sans text-xs">
          {/* Metadata Banner */}
          <div className="p-4 rounded bg-[#090d14] border border-[#1a2333] grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
            <div>
              <div className="text-slate-500 uppercase">VEHICLE IDENTIFIER</div>
              <div className="text-white font-semibold">{vehicle.id}</div>
              <div className="text-slate-400 text-[10px]">{vehicle.name}</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase">SYSTEM HEALTH SCORE</div>
              <div className={`font-semibold ${vehicle.status === 'fault' ? 'text-rose-400' : 'text-emerald-400'}`}>
                {vehicle.healthScore}% ({vehicle.status.toUpperCase()})
              </div>
              <div className="text-slate-400 text-[10px]">{vehicle.activeFaultsCount} Faults / {vehicle.suspectedAnomaliesCount} Anom.</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase">TIMESTAMP (UTC)</div>
              <div className="text-slate-300">{vehicle.lastDiagnosticCycle}</div>
              <div className="text-amber-400 text-[10px]">SIMULATION MODE ACTIVE</div>
            </div>
            <div>
              <div className="text-slate-500 uppercase">TEST RUN COUNT</div>
              <div className="text-slate-200">{vehicle.testsCompletedCount} Verified Runs</div>
              <div className="text-slate-400 text-[10px]">{components.length} Monitored Sensors</div>
            </div>
          </div>

          {/* Active ML Diagnostic Section */}
          {currentDiagnosticResult && (
            <div className="p-4 rounded bg-[#101522] border border-[#232f48] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1c263c] pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-slate-100 uppercase tracking-wide font-mono">
                    CRITICAL FAULT ANALYSIS: {currentDiagnosticResult.componentId}
                  </span>
                </div>
                <div className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-600/50 text-rose-300">
                  ML CONFIDENCE: {(currentDiagnosticResult.confidence * 100).toFixed(1)}% (SIMULATED)
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-mono">Observed Behavior: </span>
                <span className="text-slate-200">{currentDiagnosticResult.observedBehavior}</span>
              </div>
              <div>
                <div className="text-slate-400 font-mono mb-1">Identified Potential Root Causes:</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {currentDiagnosticResult.possibleCauses.map((cause, idx) => (
                    <li key={idx}>{cause}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-slate-400 font-mono mb-1">Recommended Verification Procedures:</div>
                <ul className="list-disc pl-5 space-y-1 text-cyan-200">
                  {currentDiagnosticResult.recommendedActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Boards Breakdown Table */}
          <div>
            <h3 className="font-mono text-xs uppercase text-slate-400 font-semibold mb-2">
              MONITORED ELECTRONICS BOARDS STATUS
            </h3>
            <table className="w-full text-left font-mono text-[11px] border border-[#1c2433]">
              <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1c2433]">
                <tr>
                  <th className="p-2">BOARD ID</th>
                  <th className="p-2">NAME</th>
                  <th className="p-2">LOCATION / BAY</th>
                  <th className="p-2">STATUS</th>
                  <th className="p-2">TEMP (°C)</th>
                  <th className="p-2">SENSORS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171f2e]">
                {boards.map(b => (
                  <tr key={b.id} className="hover:bg-[#111724]">
                    <td className="p-2 text-cyan-300 font-semibold">{b.id}</td>
                    <td className="p-2 text-white">{b.name}</td>
                    <td className="p-2 text-slate-400">{b.slot.bayName}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        b.status === 'fault'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-600/50'
                          : b.status === 'warning'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-600/50'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/50'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300">{b.temperatureCelsius.toFixed(1)}°C</td>
                    <td className="p-2 text-slate-400">{b.monitoredSensorsCount} Channels</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Test History Log Table */}
          <div>
            <h3 className="font-mono text-xs uppercase text-slate-400 font-semibold mb-2">
              RECENT TEST RUN TELEMETRY LOG
            </h3>
            <table className="w-full text-left font-mono text-[11px] border border-[#1c2433]">
              <thead className="bg-[#0e131d] text-slate-400 border-b border-[#1c2433]">
                <tr>
                  <th className="p-2">RUN ID</th>
                  <th className="p-2">TIMESTAMP</th>
                  <th className="p-2">COMPONENT</th>
                  <th className="p-2">OUTCOME</th>
                  <th className="p-2">PEAK TEMP</th>
                  <th className="p-2">RECOVERY</th>
                  <th className="p-2">TREND</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171f2e]">
                {testRuns.slice(0, 6).map(r => (
                  <tr key={r.id} className="hover:bg-[#111724]">
                    <td className="p-2 text-slate-400">{r.id}</td>
                    <td className="p-2 text-slate-400">{r.timestamp.split('T')[1].replace('Z', '')}</td>
                    <td className="p-2 text-cyan-300 font-semibold">{r.componentRef}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        r.outcome === 'fault_confirmed'
                          ? 'text-rose-400'
                          : r.outcome === 'anomaly_detected'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}>
                        {r.outcome.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300">{r.peakTemperature.toFixed(1)}°C</td>
                    <td className="p-2 text-slate-300">{r.recoveryTimeSeconds}s</td>
                    <td className="p-2 text-slate-400 capitalize">{r.stabilityTrend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#080b11] border-t border-[#1c2433] flex items-center justify-between font-mono text-[11px] text-slate-500">
          <span>CLASSIFICATION: TECHNICAL SEDS HACKATHON EVALUATION</span>
          <span>AERO-DIAG V2.4 / SIMULATED HARNESS</span>
        </div>
      </div>
    </div>
  );
};
