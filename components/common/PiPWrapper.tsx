'use client';

import { useState, ReactNode } from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';

interface PiPWrapperProps {
  children: ReactNode;
  title?: string;
  onClose?: () => void;
  defaultMinimized?: boolean;
}

export default function PiPWrapper({ 
  children, 
  title = "Konsultasi Berlangsung", 
  onClose,
  defaultMinimized = false 
}: PiPWrapperProps) {
  const [isMinimized, setIsMinimized] = useState(defaultMinimized);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-[0_20px_50px_rgba(11,31,58,0.2)] border border-gray-100 z-[100] overflow-hidden animate-popIn flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_50px_rgba(74,159,212,0.25)]">
        <div className="bg-[#0B1F3A] text-white px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(false)}>
          <span className="font-medium text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {title}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="text-white/70 hover:text-white transition-colors"
            >
              <Maximize2 size={16} />
            </button>
            {onClose && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-white/70 hover:text-red-400 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
        {/* Render children in minimized mode but scaled down.
            We render it so the video/chat connection stays alive. */}
        <div className="h-48 relative overflow-hidden bg-gray-900">
          <div className="absolute inset-0 pointer-events-none" style={{ transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%', height: '125%' }}>
            {children}
          </div>
          {/* Overlay to catch clicks and restore */}
          <div className="absolute inset-0 z-10 cursor-pointer" onClick={() => setIsMinimized(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden animate-fadeIn">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Minimize2 size={18} />
            <span className="hidden sm:inline">Minimize (PiP)</span>
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
  );
}
