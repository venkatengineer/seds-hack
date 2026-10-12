import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { Vehicle3DCanvas, VehicleInspectionMode } from './Vehicle3DCanvas';
import { Vehicle2DBlueprint } from './Vehicle2DBlueprint';
import { CompactBayInspector } from './CompactBayInspector';
import { MinimalControlDock } from './MinimalControlDock';
import { QuickBoardLocator } from './QuickBoardLocator';
import { SpatialHoverTooltip } from './SpatialHoverTooltip';

export const VehicleVisualization: React.FC = () => {
  const {
    subsystems,
    physicalAssemblies,
    boards,
    selectedSubsystemId,
    setSelectedSubsystemId,
    selectedBoardId,
    setSelectedBoardId,
    selectBoardAndInspect,
    setCurrentTab,
  } = useSystem();
  const { theme, isDark } = useTheme();

  const [activeTabMode, setActiveTabMode] = useState<'3d' | '2d'>('3d');
  const [inspectionMode, setInspectionMode] = useState<VehicleInspectionMode>('exterior');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [fitCameraFn, setFitCameraFn] = useState<(() => void) | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

  // Active board for HUD panel: only shown when a board is selected
  const selectedBoard = boards.find(b => b.id === selectedBoardId);
  const hoveredBoard = boards.find(b => b.id === hoveredBoardId);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Main 3D / 2D Viewport Canvas */}
      <div className="relative w-full h-full">
        {activeTabMode === '3d' ? (
          <Vehicle3DCanvas
            boards={boards}
            subsystems={subsystems}
            physicalAssemblies={physicalAssemblies}
            selectedBoardId={selectedBoardId}
            selectedSubsystemId={selectedSubsystemId}
            onSelectBoard={boardId => {
              setSelectedBoardId(boardId || '');
            }}
            onSelectSubsystem={subsystemId => {
              setSelectedSubsystemId(subsystemId);
            }}
            hoveredBoardId={hoveredBoardId}
            setHoveredBoardId={setHoveredBoardId}
            inspectionMode={inspectionMode}
            autoRotate={autoRotate}
            theme={theme}
            onRegisterFitCamera={fn => setFitCameraFn(() => fn)}
            onRegisterResetCamera={fn => setResetCameraFn(() => fn)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <Vehicle2DBlueprint
              boards={boards}
              selectedBoardId={selectedBoardId}
              onSelectBoard={boardId => {
                setSelectedBoardId(boardId);
              }}
              hoveredBoardId={hoveredBoardId}
              setHoveredBoardId={setHoveredBoardId}
              onSwitchTo3D={() => setActiveTabMode('3d')}
            />
          </div>
        )}

        {/* Quick Board Locator HUD Dropdown in Top-Left */}
        <QuickBoardLocator
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={boardId => {
            setSelectedBoardId(boardId || '');
          }}
          hoveredBoardId={hoveredBoardId}
          setHoveredBoardId={setHoveredBoardId}
          isDark={isDark}
        />

        {/* Spatial Hover Tooltip HUD Card (when hovering an exterior marker or internal LRU) */}
        {hoveredBoard && !selectedBoard && (
          <SpatialHoverTooltip board={hoveredBoard} isDark={isDark} />
        )}

        {/* Selected Board Progressive Disclosure Inspector Panel */}
        {selectedBoard && (
          <CompactBayInspector
            board={selectedBoard}
            onInspectBoard={selectBoardAndInspect}
            onOpenTerminal={() => setCurrentTab('terminal')}
            onClose={() => setSelectedBoardId('')}
            inspectionMode={inspectionMode}
            onToggleCutaway={() => {
              setInspectionMode(prev => (prev === 'exterior' ? 'cutaway' : 'exterior'));
            }}
          />
        )}

        {/* Bottom Floating Minimal Control Dock */}
        <MinimalControlDock
          activeTabMode={activeTabMode}
          setActiveTabMode={setActiveTabMode}
          inspectionMode={inspectionMode}
          setInspectionMode={setInspectionMode}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          onFitVehicle={() => {
            if (fitCameraFn) fitCameraFn();
          }}
          onResetCamera={() => {
            if (resetCameraFn) resetCameraFn();
          }}
        />

        {/* Subtle Spatial Interaction Hint in Bottom-Left */}
        <div
          className={`absolute bottom-6 left-6 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-[10px] pointer-events-none backdrop-blur-md border ${
            isDark
              ? 'bg-slate-950/70 border-slate-800 text-slate-400'
              : 'bg-white/80 border-slate-200 text-slate-600 shadow-sm'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>DRAG TO ORBIT • SCROLL TO ZOOM • SELECT AVIONICS BAY</span>
        </div>
      </div>
    </div>
  );
};
