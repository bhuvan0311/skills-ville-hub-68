import React from 'react';
import watermarkLogo from '@/assets/skills-ville-watermark.svg';

export function BrandWatermark() {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
      aria-hidden="true"
    >
      <img 
        src={watermarkLogo} 
        alt="" 
        className="w-[60vw] max-w-[600px] h-auto opacity-[0.03] grayscale select-none"
        draggable={false}
      />
    </div>
  );
}
