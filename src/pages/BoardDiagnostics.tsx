import React from 'react';
import { PcbExplorer } from '../components/pcb/PcbExplorer';

export const BoardDiagnostics: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <PcbExplorer />
    </div>
  );
};
