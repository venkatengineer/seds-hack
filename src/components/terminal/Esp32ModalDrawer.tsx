import React, { useEffect } from 'react';
import { Esp32SerialTerminal } from './Esp32SerialTerminal';
import { useTheme } from '../../context/ThemeContext';
import { X, Maximize2, ExternalLink } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

interface Esp32ModalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Esp32ModalDrawer: React.FC<Esp32ModalDrawerProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { setCurrentTab } = useSystem();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl h-[85vh] max-h-[720px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden relative ${
          isDark
            ? 'bg-[#060910] border-cyan-800/50 shadow-cyan-950/40 text-slate-100'
            : 'bg-slate-50 border-slate-300 shadow-slate-900/30 text-slate-900'
        }`}
      >
        {/* Modal Window Top Header Bar */}
        <div
          className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-[#080d16] border-[#182335]' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-bold tracking-wider">
              HARDWARE TELEMETRY STREAM // ESP32-S3
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline">
              ASTRA-IST SENSOR PAYLOAD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                setCurrentTab('terminal');
              }}
              title="Open in Full Terminal Tab"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold text-cyan-400 hover:text-white border-cyan-800/60 hover:bg-cyan-900/30 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="hidden sm:inline">FULL VIEW</span>
            </button>
            <button
              onClick={onClose}
              title="Close Terminal Window (Esc)"
              className="p-1.5 rounded-lg border border-transparent hover:border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Window Body */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <Esp32SerialTerminal compact={false} onClose={onClose} />
        </div>
      </div>
    </div>
  );
};
