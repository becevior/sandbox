'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

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
        <Image
          src="/mariners-logo.gif"
          alt="Seattle Mariners logo"
          width={logoSize}
          height={logoSize}
          priority
        />
      </div>
    </div>
  );
}