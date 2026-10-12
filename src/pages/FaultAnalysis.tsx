import React from 'react';
import { useSystem } from '../context/SystemContext';
import { useTheme } from '../context/ThemeContext';
import { MLFaultDiagnosisPanel } from '../components/diagnostics/MLFaultDiagnosisPanel';
import { DiagnosticTimeline } from '../components/diagnostics/DiagnosticTimeline';
import { AlertOctagon, Cpu, ShieldAlert, ChevronDown, CheckCircle2 } from 'lucide-react';

export const FaultAnalysis: React.FC = () => {
  const {
    currentDiagnosticResult,
    components,
    selectedComponentId,
    setSelectedComponentId,
    selectedBoardId,
    setSelectedBoardId,
    setCurrentTab,
  } = useSystem();
  const { isDark } = useTheme();

  return (
    <div className="space-y-4 text-xs">
      {/* Component Switcher Header */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 font-mono ${
        isDark ? 'bg-[#0a0e16] border-[#1b2536]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-500" />
          <h2 className={`text-sm font-semibold tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>
            MACHINE LEARNING FAULT DIAGNOSTICS & ROOT-CAUSE EXPLANATION
          </h2>
        </div>

        {/* Component Selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-400 uppercase">INSPECT SENSOR:</label>
          <div className="relative">
            <select
              value={selectedComponentId}
              onChange={e => {
                const targetComp = components.find(c => c.id === e.target.value);
                if (targetComp) {
                  setSelectedComponentId(targetComp.id);
                  setSelectedBoardId(targetComp.boardId);
                }
              }}
              className={`appearance-none border font-mono text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer ${
                isDark ? 'bg-[#0e1420] border-[#223048] text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {components.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.boardId}] {c.referenceDesignator} — {c.name} ({c.status.toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: ML Diagnostic Panel + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Comprehensive ML Diagnostic Explanation Panel */}
        <div className="lg:col-span-2">
          <MLFaultDiagnosisPanel
            diagnosticResult={currentDiagnosticResult}
            onNavigateToPcb={() => setCurrentTab('pcb')}
            onNavigateToHistory={() => setCurrentTab('history')}
          />
        </div>

        {/* Right 1 Col: Diagnostic Occurrence Timeline */}
        <div className="lg:col-span-1">
          <DiagnosticTimeline />
        </div>
      </div>
    </div>
  );
};
