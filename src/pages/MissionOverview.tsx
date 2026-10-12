import React from 'react';
import { VehicleVisualization } from '../components/vehicle/VehicleVisualization';

interface MissionOverviewProps {
  onOpenReport?: () => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = () => {
  return (
    <div className="w-full h-full relative">
      <VehicleVisualization />
    </div>
  );
};
