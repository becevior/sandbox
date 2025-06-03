'use client';

import { useRef } from 'react';

export default function OregonDuck() {
  const duckRef = useRef<HTMLDivElement>(null);
  
  // Size of the duck
  const duckSize = 80;

  return (
    <div
      ref={duckRef}
      className="pointer-events-none"
      style={{
        width: `${duckSize}px`,
        height: `${duckSize}px`
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Duck body - Green */}
          <ellipse cx="50" cy="55" rx="40" ry="35" fill="#037F41" />
          
          {/* Duck head */}
          <circle cx="50" cy="30" r="25" fill="#037F41" />
          
          {/* Duck eye */}
          <circle cx="40" cy="25" r="5" fill="#ffffff" />
          <circle cx="40" cy="25" r="2" fill="#000000" />
          
          {/* Duck bill */}
          <path d="M50 35 L75 30 L75 40 L50 45 Z" fill="#FFC517" />
          
          {/* Duck feet */}
          <path d="M30 85 L20 95 L40 95 L35 85" fill="#FFC517" />
          <path d="M70 85 L60 95 L80 95 L75 85" fill="#FFC517" />
          
          {/* Oregon "O" */}
          <circle cx="50" cy="55" r="15" fill="#FFC517" stroke="#037F41" strokeWidth="3" />
          <circle cx="50" cy="55" r="7" fill="#037F41" />
        </svg>
      </div>
    </div>
  );
} 