import React, { useState, useMemo } from 'react';
import { useSystem } from '../../context/SystemContext';
import { TestRunRecord } from '../../types/vehicle';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
} from 'lucide-react';

interface TestHistoryTableProps {
  onCompareRun?: (run: TestRunRecord) => void;
  onOpenReport?: () => void;
}

export const TestHistoryTable: React.FC<TestHistoryTableProps> = ({
  onCompareRun,
  onOpenReport,
}) => {
  const { testRuns, vehicle } = useSystem();

  const [search, setSearch] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'peakTemperature' | 'recoveryTimeSeconds'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered & sorted records
  const filteredRuns = useMemo(() => {
    return testRuns.filter(r => {
      const matchSearch =
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.componentRef.toLowerCase().includes(search.toLowerCase()) ||
        r.boardName.toLowerCase().includes(search.toLowerCase()) ||
        (r.anomalyCategory && r.anomalyCategory.toLowerCase().includes(search.toLowerCase()));

      const matchOutcome = outcomeFilter === 'all' || r.outcome === outcomeFilter;
      const matchBoard = boardFilter === 'all' || r.boardId === boardFilter;

      return matchSearch && matchOutcome && matchBoard;
    }).sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'timestamp') {
        return sortOrder === 'desc'
          ? new Date(valB as string).getTime() - new Date(valA as string).getTime()
          : new Date(valA as string).getTime() - new Date(valB as string).getTime();
      }

      return sortOrder === 'desc'
        ? (valB as number) - (valA as number)
        : (valA as number) - (valB as number);
    });
  }, [testRuns, search, outcomeFilter, boardFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'timestamp' | 'peakTemperature' | 'recoveryTimeSeconds') => {
    if (sortBy === field) {
      setSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['TestRunId', 'Timestamp', 'VehicleId', 'BoardId', 'BoardName', 'ComponentRef', 'TestType', 'Outcome', 'PeakTemp_C', 'RecoverySec', 'MLConfidence', 'StabilityTrend'];
    const rows = filteredRuns.map(r => [
      r.id,
      r.timestamp,
      r.vehicleId,
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
    link.setAttribute('download', `TEST_HISTORY_${vehicle.id}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0a0e16] border border-[#1b2536] rounded-lg p-4 space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#172234] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <span>HISTORICAL THERMAL TEST RUN ARCHIVE</span>
          </h2>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            CHRONOLOGICAL REPOSITORY OF SENSOR PULSE TRANSIENTS & ML EVALUATION LOGS
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#111724] hover:bg-[#18233a] border border-[#1f2c42] text-slate-200 transition-colors cursor-pointer"
            >
              GENERATION REPORT
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search run ID, component, board, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#0e1422] border border-[#1e2a3c] rounded pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Outcome Filter */}
        <div className="flex items-center gap-1.5 bg-[#0e1422] border border-[#1e2a3c] px-2 py-1 rounded">
          <span className="text-[10px] text-slate-500 uppercase">OUTCOME:</span>
          <select
            value={outcomeFilter}
            onChange={e => setOutcomeFilter(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer flex-1"
          >
            <option value="all">ALL OUTCOMES</option>
            <option value="pass">PASS (NOMINAL)</option>
            <option value="anomaly_detected">ANOMALY DETECTED</option>
            <option value="fault_confirmed">FAULT CONFIRMED</option>
          </select>
        </div>

        {/* Board Filter */}
        <div className="flex items-center gap-1.5 bg-[#0e1422] border border-[#1e2a3c] px-2 py-1 rounded">
          <span className="text-[10px] text-slate-500 uppercase">BOARD:</span>
          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className="bg-transparent text-slate-300 focus:outline-none cursor-pointer flex-1"
          >
            <option value="all">ALL BOARDS</option>
            <option value="BRD-01">BRD-01 (Avionics A)</option>
            <option value="BRD-02">BRD-02 (Flight Control)</option>
            <option value="BRD-03">BRD-03 (Sensor Interface)</option>
            <option value="BRD-04">BRD-04 (Power Mgmt)</option>
            <option value="BRD-05">BRD-05 (Telemetry)</option>
            <option value="BRD-06">BRD-06 (Thermal Monitoring)</option>
          </select>
        </div>
      </div>

      {/* Test Runs Table */}
      <div className="overflow-x-auto border border-[#182334] rounded">
        <table className="w-full text-left font-mono text-[11px]">
          <thead className="bg-[#0e1422] text-slate-400 border-b border-[#182334] select-none">
            <tr>
              <th
                onClick={() => toggleSort('timestamp')}
                className="p-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>RUN ID / TIMESTAMP</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-2.5">BOARD</th>
              <th className="p-2.5">COMPONENT</th>
              <th className="p-2.5">OUTCOME</th>
              <th
                onClick={() => toggleSort('peakTemperature')}
                className="p-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>PEAK TEMP</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('recoveryTimeSeconds')}
                className="p-2.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  <span>RECOVERY</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-2.5">ML CONFIDENCE</th>
              <th className="p-2.5">TREND</th>
              <th className="p-2.5 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#141c2b]">
            {filteredRuns.length > 0 ? (
              filteredRuns.map(run => {
                const isFault = run.outcome === 'fault_confirmed';
                const isWarning = run.outcome === 'anomaly_detected';

                return (
                  <tr key={run.id} className="hover:bg-[#101726] transition-colors">
                    <td className="p-2.5">
                      <div className="font-bold text-white">{run.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {run.timestamp.replace('T', ' ').replace('Z', ' UTC')}
                      </div>
                    </td>
                    <td className="p-2.5 text-slate-300 font-medium">
                      {run.boardName}
                    </td>
                    <td className="p-2.5">
                      <span className="font-bold text-cyan-300">{run.componentRef}</span>
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isFault
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-600/60'
                            : isWarning
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-600/60'
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-600/60'
                        }`}
                      >
                        {run.outcome.replace('_', ' ')}
                      </span>
                      {run.anomalyCategory && (
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                          {run.anomalyCategory}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-200 font-semibold">
                      {run.peakTemperature.toFixed(1)}°C
                    </td>
                    <td className="p-2.5 text-slate-200">
                      {run.recoveryTimeSeconds}s
                    </td>
                    <td className="p-2.5">
                      {run.mlConfidence ? (
                        <span className="text-cyan-300 font-semibold">
                          {(run.mlConfidence * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase ${
                          run.stabilityTrend === 'deteriorating'
                            ? 'text-rose-400'
                            : run.stabilityTrend === 'inconsistent'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {run.stabilityTrend}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      {onCompareRun && (
                        <button
                          onClick={() => onCompareRun(run)}
                          className="flex items-center gap-1 ml-auto px-2 py-1 rounded bg-[#131c2c] hover:bg-[#1b263b] border border-[#202e46] text-cyan-300 text-[10px] transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>COMPARE</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-6 text-center text-slate-500 italic">
                  No historical test records matched your filter query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
