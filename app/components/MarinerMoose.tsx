'use client';

import { useEffect, useRef } from 'react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'right' | 'down' | 'left' | 'up';

export default function MarinersLogo() {
  // Use refs to avoid state updates causing animation issues
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const directionRef = useRef<Direction>('right');
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  
  // Size of the logo
  const logoSize = 80;
  // Walking speed (pixels per animation frame)
  const speed = 2;

  // Animation function
  const animateWalk = () => {
    if (!logoRef.current) return;
    
    const dimensions = dimensionsRef.current;
    const position = positionRef.current;
    let direction = directionRef.current;
    
    // Move based on current direction
    switch (direction) {
      case 'right':
        position.x += speed;
        if (position.x >= dimensions.width - logoSize) {
          position.x = dimensions.width - logoSize;
          direction = 'down';
        }
        break;
      case 'down':
        position.y += speed;
        if (position.y >= dimensions.height - logoSize) {
          position.y = dimensions.height - logoSize;
          direction = 'left';
        }
        break;
      case 'left':
        position.x -= speed;
        if (position.x <= 0) {
          position.x = 0;
          direction = 'up';
        }
        break;
      case 'up':
        position.y -= speed;
        if (position.y <= 0) {
          position.y = 0;
          direction = 'right';
        }
        break;
    }
    
    directionRef.current = direction;
    
    // Apply styles directly to the DOM element
    logoRef.current.style.left = `${position.x}px`;
    logoRef.current.style.top = `${position.y}px`;
    logoRef.current.style.transform = direction === 'left' ? 'scaleX(-1)' : '';
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animateWalk);
  };

  useEffect(() => {
    // Get window dimensions
    const updateDimensions = () => {
      dimensionsRef.current = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    };
    
    // Initialize dimensions
    updateDimensions();
    
    // Update dimensions when window resizes
    window.addEventListener('resize', updateDimensions);
    
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animateWalk);
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={logoRef}
      className="fixed pointer-events-none z-50"
      style={{
        left: '0px',
        top: '0px',
        width: `${logoSize}px`,
        height: `${logoSize}px`,
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        {/* Seattle Mariners logo - compass style */}
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          {/* Outer circle */}
          <circle cx="50" cy="50" r="48" fill="#0C2C56" />
          <circle cx="50" cy="50" r="45" fill="#ffffff" />
          <circle cx="50" cy="50" r="42" fill="#0C2C56" />
          
          {/* Inner circle */}
          <circle cx="50" cy="50" r="30" fill="#ffffff" />
          <circle cx="50" cy="50" r="28" fill="#005C5C" />
          <circle cx="50" cy="50" r="10" fill="#ffffff" />
          
          {/* Compass points - N E S W */}
          <path d="M50 5 L53 20 L50 25 L47 20 Z" fill="#ffffff" />  {/* North */}
          <path d="M95 50 L80 53 L75 50 L80 47 Z" fill="#ffffff" />  {/* East */}
          <path d="M50 95 L47 80 L50 75 L53 80 Z" fill="#ffffff" />  {/* South */}
          <path d="M5 50 L20 47 L25 50 L20 53 Z" fill="#ffffff" />   {/* West */}
          
          {/* Diagonal compass points - NE SE SW NW */}
          <path d="M80 20 L70 28 L65 25 L73 17 Z" fill="#ffffff" />  {/* Northeast */}
          <path d="M80 80 L73 73 L65 75 L70 82 Z" fill="#ffffff" />  {/* Southeast */}
          <path d="M20 80 L27 72 L25 65 L17 73 Z" fill="#ffffff" />  {/* Southwest */}
          <path d="M20 20 L27 28 L25 35 L17 27 Z" fill="#ffffff" />  {/* Northwest */}
          
          {/* Compass 'S' */}
          <text x="41" y="55" fontFamily="Arial" fontSize="12" fontWeight="bold" fill="#ffffff">S</text>
        </svg>
      </div>
    </div>
  );
}