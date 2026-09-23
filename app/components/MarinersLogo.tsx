'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Position = {
  x: number;
  y: number;
};

type Direction = 'right' | 'down' | 'left' | 'up';

const LOGO_SIZE = 80;
const WALK_SPEED = 2;

export default function MarinersLogo() {
  // State to track visibility
  const [isVisible, setIsVisible] = useState(true);
  
  // Use refs to avoid state updates causing animation issues
  const positionRef = useRef<Position>({ x: 0, y: 0 });
  const directionRef = useRef<Direction>('right');
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  
  const animateWalk = useCallback(() => {
    if (!logoRef.current) return;
    
    const dimensions = dimensionsRef.current;
    const position = positionRef.current;
    let direction = directionRef.current;
    
    // Move based on current direction
    switch (direction) {
      case 'right':
        position.x += WALK_SPEED;
        if (position.x >= dimensions.width - LOGO_SIZE) {
          position.x = dimensions.width - LOGO_SIZE;
          direction = 'down';
        }
        break;
      case 'down':
        position.y += WALK_SPEED;
        if (position.y >= dimensions.height - LOGO_SIZE) {
          position.y = dimensions.height - LOGO_SIZE;
          direction = 'left';
        }
        break;
      case 'left':
        position.x -= WALK_SPEED;
        if (position.x <= 0) {
          position.x = 0;
          direction = 'up';
        }
        break;
      case 'up':
        position.y -= WALK_SPEED;
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
  }, []);

  useEffect(() => {
    // If not visible, don't run the animation
    if (!isVisible) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }
    
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
  }, [animateWalk, isVisible]);

  // If not visible, render nothing
  if (!isVisible) return null;

  // Handle click to make logo disappear
  const handleClick = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={logoRef}
      className="fixed z-50 cursor-pointer"
      onClick={handleClick}
      style={{
        left: '0px',
        top: '0px',
        width: `${LOGO_SIZE}px`,
        height: `${LOGO_SIZE}px`,
        transition: 'transform 0.2s ease-in-out'
      }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <Image
          src="/mariners-logo.gif"
          alt="Seattle Mariners logo"
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          priority
        />
      </div>
    </div>
  );
}
