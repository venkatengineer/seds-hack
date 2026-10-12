import React, { useState } from 'react';
import { useSystem } from '../../context/SystemContext';
import { useTheme } from '../../context/ThemeContext';
import { Vehicle3DCanvas, VehicleInspectionMode } from './Vehicle3DCanvas';
import { Vehicle2DBlueprint } from './Vehicle2DBlueprint';
import { CompactBayInspector } from './CompactBayInspector';
import { MinimalControlDock } from './MinimalControlDock';
import { QuickBoardLocator } from './QuickBoardLocator';
import { SpatialHoverTooltip } from './SpatialHoverTooltip';
import { MissionContextPanel } from './MissionContextPanel';
import { SensorTestActivityBar } from './SensorTestActivityBar';
import { ProjectedVehicleAnnotation } from './ProjectedVehicleAnnotation';

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
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [fitCameraFn, setFitCameraFn] = useState<(() => void) | null>(null);
  const [resetCameraFn, setResetCameraFn] = useState<(() => void) | null>(null);

  // Projected 3D-to-screen anchor position for selected board engineering callout
  const [projectedAnchor, setProjectedAnchor] = useState<{
    x: number;
    y: number;
    visible: boolean;
    boardId: string;
  } | null>(null);

  // Active board for HUD panel: only shown when a board is selected
  const selectedBoard = boards.find(b => b.id === selectedBoardId);
  const hoveredBoard = boards.find(b => b.id === hoveredBoardId);
  const selectedSubsystem = subsystems.find(s => s.id === selectedBoard?.subsystemId);

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
            showGrid={showGrid}
            theme={theme}
            onRegisterFitCamera={fn => setFitCameraFn(() => fn)}
            onRegisterResetCamera={fn => setResetCameraFn(() => fn)}
            onProjectedAnchor={setProjectedAnchor}
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

        {/* 1. Compact Mission Overview Panel in Upper-Left (under identity) */}
        <MissionContextPanel />

        {/* 2. Quick Board Locator HUD Dropdown in Top-Left (beside mission panel) */}
        <div className="hidden sm:block">
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
        </div>

        {/* 3. Real-Time Active Sensor Thermal Test Indicator */}
        <SensorTestActivityBar />

        {/* 4. Spatially Projected 3D Engineering Annotation Callout */}
        {projectedAnchor && selectedBoard && (
          <ProjectedVehicleAnnotation
            anchor={projectedAnchor}
            board={selectedBoard}
            subsystem={selectedSubsystem}
            isDark={isDark}
          />
        )}

        {/* 5. Spatial Hover Tooltip HUD Card (when hovering an exterior marker or internal LRU) */}
        {hoveredBoard && !selectedBoard && (
          <SpatialHoverTooltip board={hoveredBoard} isDark={isDark} />
        )}

        {/* 6. Contextual Diagnostic Panel That Appears ONLY When a Board is Selected */}
        {selectedBoard && (
          <CompactBayInspector
            board={selectedBoard}
            onInspectBoard={selectBoardAndInspect}
            onFocusBoard={() => {
              // Trigger camera glide to focus on the selected board
              setSelectedBoardId(selectedBoard.id);
            }}
            onOpenTerminal={() => setCurrentTab('terminal')}
            onClose={() => {
              setSelectedBoardId('');
              setProjectedAnchor(null);
            }}
            inspectionMode={inspectionMode}
            onToggleCutaway={() => {
              setInspectionMode(prev => (prev === 'exterior' ? 'cutaway' : 'exterior'));
            }}
          />
        )}

        {/* 7. Bottom Floating Minimal Control Dock with Three Logical Groups */}
        <MinimalControlDock
          activeTabMode={activeTabMode}
          setActiveTabMode={setActiveTabMode}
          inspectionMode={inspectionMode}
          setInspectionMode={setInspectionMode}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          onFitVehicle={() => {
            if (fitCameraFn) fitCameraFn();
          }}
          onResetCamera={() => {
            if (resetCameraFn) resetCameraFn();
          }}
        />

        {/* 8. Subtle Spatial Interaction Hint in Bottom-Left */}
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
