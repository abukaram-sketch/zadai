
import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-xl transition-all duration-700">
      <div className="text-center px-8 w-full max-w-xs">
        <div className="relative w-16 h-16 mx-auto mb-10">
          <div className="absolute inset-0 border-[2px] border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-[2px] border-t-slate-900 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-slate-400 font-medium tracking-widest uppercase text-[9px] leading-relaxed px-4">{message}</p>
        
        {/* Decorative background element */}
        <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-slate-50 rounded-full -z-10 blur-3xl opacity-50"></div>
        <div className="fixed -top-20 -left-20 w-64 h-64 bg-slate-50 rounded-full -z-10 blur-3xl opacity-50"></div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
