import React, { useState } from 'react';
import { TestHistoryTable } from '../components/history/TestHistoryTable';
import { CurveComparatorModal } from '../components/history/CurveComparatorModal';
import { TestRunRecord } from '../types/vehicle';

interface TestHistoryProps {
  onOpenReport: () => void;
}

export const TestHistory: React.FC<TestHistoryProps> = ({ onOpenReport }) => {
  const [comparingRun, setComparingRun] = useState<TestRunRecord | null>(null);

  return (
    <div className="space-y-4">
      <TestHistoryTable
        onCompareRun={run => setComparingRun(run)}
        onOpenReport={onOpenReport}
      />

      {comparingRun && (
        <CurveComparatorModal
          selectedRun={comparingRun}
          onClose={() => setComparingRun(null)}
        />
      )}
    </div>
  );
};
