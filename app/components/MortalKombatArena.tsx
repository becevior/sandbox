'use client';

import { useEffect, useRef, useState } from 'react';
import MarinerMoose from './MarinerMoose';
import OregonDuck from './OregonDuck';

export default function MortalKombatArena() {
  const [battleStarted, setBattleStarted] = useState(false);
  const [mooseHealth, setMooseHealth] = useState(100);
  const [duckHealth, setDuckHealth] = useState(100);
  const [winner, setWinner] = useState<string | null>(null);
  const mooseRef = useRef<HTMLDivElement>(null);
  const duckRef = useRef<HTMLDivElement>(null);
  const [fightText, setFightText] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  
  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio("/audio/mortal-kombat-theme.mp3");
    audioRef.current.volume = 0.5;
    audioRef.current.loop = true;
    
    // Add event listener for when audio is loaded
    audioRef.current.addEventListener('canplaythrough', () => {
      setAudioLoaded(true);
    });
    
    return () => {
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);
  
  const startBattle = () => {
    setBattleStarted(true);
    
    // Play theme song
    if (audioRef.current && audioLoaded) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
    
    setTimeout(() => {
      setFightText("ROUND 1");
      setTimeout(() => {
        setFightText("FIGHT!");
        setTimeout(() => {
          setFightText(null);
          simulateBattle();
        }, 1000);
      }, 1500);
    }, 500);
  };
  
  const simulateBattle = () => {
    const battleInterval = setInterval(() => {
      setMooseHealth(prev => {
        const newHealth = Math.max(0, prev - Math.floor(Math.random() * 10));
        if (newHealth === 0) {
          clearInterval(battleInterval);
          setWinner("OREGON DUCK");
          setFightText("FATALITY");
          playFatalitySound();
        }
        return newHealth;
      });
      
      setDuckHealth(prev => {
        const newHealth = Math.max(0, prev - Math.floor(Math.random() * 10));
        if (newHealth === 0) {
          clearInterval(battleInterval);
          setWinner("MARINERS MOOSE");
          setFightText("FATALITY");
          playFatalitySound();
        }
        return newHealth;
      });
    }, 500);
  };
  
  const playFatalitySound = () => {
    // Stop theme music
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Play fatality sound
    const fatalitySound = new Audio("/audio/fatality.mp3");
    fatalitySound.volume = 0.7;
    fatalitySound.play().catch(e => console.error("Fatality sound play failed:", e));
  };
  
  return (
    <div className="w-full h-screen relative overflow-hidden bg-black">
      {/* Mortal Kombat arena background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black">
        {/* Floor grid */}
        <div className="absolute bottom-0 w-full h-1/3 perspective-1000">
          <div className="absolute bottom-0 w-full h-full transform-gpu rotateX-60 bg-grid-mortal-kombat"></div>
        </div>
        
        {/* Torches and arena decoration */}
        <div className="absolute top-20 left-20 w-10 h-24">
          <div className="w-full h-4/5 bg-gray-700 rounded-t-sm"></div>
          <div className="w-full h-1/5 bg-amber-500 animate-torch-flicker"></div>
        </div>
        <div className="absolute top-20 right-20 w-10 h-24">
          <div className="w-full h-4/5 bg-gray-700 rounded-t-sm"></div>
          <div className="w-full h-1/5 bg-amber-500 animate-torch-flicker"></div>
        </div>
      </div>
      
      {/* Combat area */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Health bars */}
        <div className="absolute top-10 w-full flex justify-between px-10">
          <div className="w-1/3">
            <div className="text-white font-bold mb-1">MARINERS MOOSE</div>
            <div className="w-full bg-gray-700 h-6 rounded-sm">
              <div 
                className="bg-green-600 h-full rounded-sm transition-all duration-300"
                style={{ width: `${mooseHealth}%` }}
              ></div>
            </div>
          </div>
          <div className="w-1/3 text-right">
            <div className="text-white font-bold mb-1">OREGON DUCK</div>
            <div className="w-full bg-gray-700 h-6 rounded-sm">
              <div 
                className="bg-green-600 h-full rounded-sm float-right transition-all duration-300"
                style={{ width: `${duckHealth}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Fighters */}
        <div className="w-full flex justify-between px-32 items-end" style={{ height: '60%' }}>
          <div ref={mooseRef} className={`${battleStarted ? 'animate-fighter-stance' : ''}`}>
            <MarinerMoose />
          </div>
          <div ref={duckRef} className={`${battleStarted ? 'animate-fighter-stance' : ''} transform scale-x-[-1]`}>
            <OregonDuck />
          </div>
        </div>
        
        {/* Fight text */}
        {fightText && (
          <div className="absolute text-6xl font-extrabold text-red-600 animate-pulse drop-shadow-glow">
            {fightText}
          </div>
        )}
        
        {/* Winner announcement */}
        {winner && (
          <div className="absolute text-4xl font-extrabold text-yellow-400 top-1/3 animate-winner-text drop-shadow-glow">
            {winner} WINS!
          </div>
        )}
        
        {/* Start button */}
        {!battleStarted && (
          <button 
            onClick={startBattle}
            className="absolute bottom-20 px-8 py-4 bg-red-700 text-white font-bold text-2xl rounded-md hover:bg-red-800 transition-colors"
            disabled={!audioLoaded}
          >
            {audioLoaded ? 'START BATTLE' : 'LOADING...'}
          </button>
        )}
        
        {/* Return to home link */}
        <a 
          href="/"
          className="absolute top-5 left-5 px-4 py-2 bg-black/50 text-white text-sm rounded-md hover:bg-black/70 transition-colors"
        >
          ← Return to Home
        </a>
      </div>
    </div>
  );
} 