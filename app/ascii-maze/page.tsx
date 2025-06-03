'use client';

import { useEffect, useRef } from 'react';

interface Entity {
  id: string;
  x: number;
  y: number;
  char: string;
  lastMoveTime: number;
  steps: number;
}

export default function AsciiMazePage() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Maze Configuration
    const config = {
      width: 60,
      height: 30,
      updateSpeed: 100,
      maxEntities: 1000,
      initialEntities: 1000,
      spreadProbability: 0.05,
      minSpreadDistance: 5,
      mazeChars: ['-', '|'],
      initialChar: 'a',
      attractionRadius: 5,
      attractionStrength: 0.3,
      starCount: 10,
      totalTarget: 33000000,
      seedBatchSize: 1000,
      maxActiveEntities: 1000,
      reductionStartChar: 't',
      finalChars: 2
    };

    // Maze state
    let maze: string[][] = [];
    let entities: Entity[] = [];
    let updateInterval: NodeJS.Timeout | null = null;
    let entityPaths = new Map();
    let entityPositions = new Map();
    let totalCharacters = 0;
    let stars: Entity[] = [];
    let currentHighestLetter = 'a';
    let lastLogTime = 0;

    function updateHighestLetter() {
      const highestChar = entities.reduce((highest, e) => {
        if (e.char === '*') return highest;
        return e.char > highest ? e.char : highest;
      }, 'a');
      
      if (highestChar > currentHighestLetter) {
        currentHighestLetter = highestChar;
        console.log(`Highest letter is now: ${currentHighestLetter}`);
      }
    }

    function getNextChar(char: string) {
      if (char === 'z') {
        return 'a';
      }
      return String.fromCharCode(char.charCodeAt(0) + 1);
    }

    function initMaze() {
      maze = [];
      for (let y = 0; y < config.height; y++) {
        const row = [];
        for (let x = 0; x < config.width; x++) {
          row.push(' ');
        }
        maze.push(row);
      }
      
      const gridSpacing = 6;
      
      for (let y = gridSpacing; y < config.height; y += gridSpacing) {
        let x = 0;
        while (x < config.width) {
          const wallLength = Math.floor(Math.random() * 8) + 3;
          if (Math.random() < 0.6) {
            for (let i = 0; i < wallLength && x + i < config.width; i++) {
              maze[y][x + i] = '-';
            }
          }
          const gapLength = Math.floor(Math.random() * 5) + 3;
          x += wallLength + gapLength;
        }
      }
      
      for (let x = gridSpacing; x < config.width; x += gridSpacing) {
        let y = 0;
        while (y < config.height) {
          const wallLength = Math.floor(Math.random() * 8) + 3;
          if (Math.random() < 0.6) {
            for (let i = 0; i < wallLength && y + i < config.height; i++) {
              maze[y + i][x] = '|';
            }
          }
          const gapLength = Math.floor(Math.random() * 5) + 3;
          y += wallLength + gapLength;
        }
      }
      
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          const hasHorizontalNeighbor = (x > 0 && maze[y][x-1] === '-') || (x < config.width-1 && maze[y][x+1] === '-');
          const hasVerticalNeighbor = (y > 0 && maze[y-1][x] === '|') || (y < config.height-1 && maze[y+1][x] === '|');
          if (hasHorizontalNeighbor && hasVerticalNeighbor) {
            maze[y][x] = '+';
          }
        }
      }
      
      entities = [];
      entityPaths = new Map();
      entityPositions = new Map();
      stars = [];
      totalCharacters = 0;

      const validPositions = [];
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          if (isValidMove(x, y)) {
            validPositions.push({x, y});
          }
        }
      }

      for (let i = validPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
      }

      const entityCount = Math.min(config.initialEntities, validPositions.length);
      for (let i = 0; i < entityCount; i++) {
        const pos = validPositions[i];
        const id = 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const entity = {
          id: id,
          x: pos.x,
          y: pos.y,
          char: config.initialChar,
          lastMoveTime: Date.now(),
          steps: 0
        };
        
        entities.push(entity);
        entityPaths.set(id, [{x: pos.x, y: pos.y}]);
        
        const posKey = `${pos.x},${pos.y}`;
        if (!entityPositions.has(posKey)) {
          entityPositions.set(posKey, []);
        }
        entityPositions.get(posKey).push(entity);
      }

      for (let i = 0; i < config.starCount; i++) {
        createStar();
      }
    }

    function isValidMove(x: number, y: number) {
      return x >= 0 && x < config.width && y >= 0 && y < config.height && maze[y][x] === ' ';
    }

    function createStar() {
      const validPositions = [];
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          if (isValidMove(x, y)) {
            validPositions.push({x, y});
          }
        }
      }

      if (validPositions.length > 0) {
        const pos = validPositions[Math.floor(Math.random() * validPositions.length)];
        const id = 'star_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const star = {
          id: id,
          x: pos.x,
          y: pos.y,
          char: '*',
          lastMoveTime: 0,
          steps: 0
        };
        
        entities.push(star);
        stars.push(star);
        
        const posKey = `${pos.x},${pos.y}`;
        if (!entityPositions.has(posKey)) {
          entityPositions.set(posKey, []);
        }
        entityPositions.get(posKey).push(star);
      }
    }

    function calculateTargetEntityCount() {
      const highestChar = entities.reduce((highest, entity) => {
        if (entity.char === '*') return highest;
        return entity.char > highest ? entity.char : highest;
      }, 'a');

      if (highestChar < config.reductionStartChar) {
        return config.maxActiveEntities;
      }

      const progress = highestChar.charCodeAt(0) - 'a'.charCodeAt(0);
      const totalSteps = 'z'.charCodeAt(0) - 'a'.charCodeAt(0);
      const reductionStart = config.reductionStartChar.charCodeAt(0) - 'a'.charCodeAt(0);
      
      const reductionFactor = Math.min(1, (progress - reductionStart) / (totalSteps - reductionStart));
      
      const targetCount = Math.max(
        config.finalChars,
        Math.floor(config.maxActiveEntities * (1 - reductionFactor))
      );
      
      return targetCount;
    }

    function seedNewCharacters() {
      if (totalCharacters >= config.totalTarget) return;
      
      const targetCount = calculateTargetEntityCount();
      const currentEntityCount = entities.filter(e => e.char !== '*').length;
      const availableSlots = targetCount - currentEntityCount;
      
      if (availableSlots <= 0) return;
      
      const highestChar = entities.reduce((highest, entity) => {
        if (entity.char === '*') return highest;
        return entity.char > highest ? entity.char : highest;
      }, 'a');
      
      let seedChar = highestChar;
      for (let i = 0; i < 2; i++) {
        if (seedChar === 'a') break;
        seedChar = String.fromCharCode(seedChar.charCodeAt(0) - 1);
      }
      
      const validPositions = [];
      for (let y = 0; y < config.height; y++) {
        for (let x = 0; x < config.width; x++) {
          if (isValidMove(x, y)) {
            validPositions.push({x, y});
          }
        }
      }

      const batchSize = Math.min(
        availableSlots,
        config.seedBatchSize,
        config.totalTarget - totalCharacters
      );

      for (let i = 0; i < batchSize && validPositions.length > 0; i++) {
        const posIndex = Math.floor(Math.random() * validPositions.length);
        const pos = validPositions.splice(posIndex, 1)[0];
        
        const id = 'entity_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const entity = {
          id: id,
          x: pos.x,
          y: pos.y,
          char: seedChar,
          lastMoveTime: 0,
          steps: 0
        };
        
        entities.push(entity);
        entityPaths.set(id, [{x: pos.x, y: pos.y}]);
        
        const posKey = `${pos.x},${pos.y}`;
        if (!entityPositions.has(posKey)) {
          entityPositions.set(posKey, []);
        }
        entityPositions.get(posKey).push(entity);
        
        totalCharacters++;
      }
    }

    function calculateAttraction(entity: Entity, otherEntities: Entity[]) {
      let forceX = 0;
      let forceY = 0;
      
      for (const other of otherEntities) {
        if (other.id === entity.id || other.char !== entity.char) continue;
        
        const dx = other.x - entity.x;
        const dy = other.y - entity.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < config.attractionRadius) {
          const force = config.attractionStrength / (distance * distance);
          forceX += (dx / distance) * force;
          forceY += (dy / distance) * force;
        }
      }
      
      return { forceX, forceY };
    }

    function handleCollisions(posKey: string, positionMap: Map<string, Entity[]>) {
      const entitiesAtPosition = positionMap.get(posKey) || [];
      
      if (entitiesAtPosition.length <= 1) {
        return [];
      }
      
      const entitiesToRemove = [];
      const entitiesToKeep = [];
      
      const starsAtPos = entitiesAtPosition.filter(e => e.char === '*');
      const regularEntities = entitiesAtPosition.filter(e => e.char !== '*');
      
      if (starsAtPos.length > 0 && regularEntities.length > 0) {
        for (const entity of regularEntities) {
          entity.char = getNextChar(entity.char);
          entitiesToKeep.push(entity);
        }
        
        for (const star of starsAtPos) {
          entitiesToRemove.push(star.id);
        }
        
        updateHighestLetter();
        if (currentHighestLetter < config.reductionStartChar) {
          for (let i = 0; i < starsAtPos.length; i++) {
            createStar();
          }
        }
      } else if (regularEntities.length > 0) {
        const charGroups: { [key: string]: Entity[] } = {};
        for (const entity of regularEntities) {
          if (!charGroups[entity.char]) {
            charGroups[entity.char] = [];
          }
          charGroups[entity.char].push(entity);
        }
        
        for (const char in charGroups) {
          const group = charGroups[char];
          if (group.length >= 2) {
            const survivingEntity = group[0];
            survivingEntity.char = getNextChar(char);
            entitiesToKeep.push(survivingEntity);
            
            for (let i = 1; i < group.length; i++) {
              entitiesToRemove.push(group[i].id);
            }
          } else {
            entitiesToKeep.push(group[0]);
          }
        }
        
        updateHighestLetter();
      }
      
      if (entitiesToKeep.length > 0) {
        positionMap.set(posKey, entitiesToKeep);
      } else {
        positionMap.delete(posKey);
      }
      
      return entitiesToRemove;
    }

    function moveEntities() {
      const currentPositions = new Map();
      entities.forEach(entity => {
        const posKey = `${entity.x},${entity.y}`;
        if (!currentPositions.has(posKey)) {
          currentPositions.set(posKey, []);
        }
        currentPositions.get(posKey).push(entity);
      });
      
      const removedIds = new Set();
      currentPositions.forEach((entitiesAtPos, posKey) => {
        if (entitiesAtPos.length > 1) {
          const removed = handleCollisions(posKey, currentPositions);
          removed.forEach(id => removedIds.add(id));
        }
      });
      
      entities = entities.filter(entity => !removedIds.has(entity.id));
      stars = stars.filter(star => !removedIds.has(star.id));
      
      removedIds.forEach(id => entityPaths.delete(id));
      
      const newPositions = new Map();
      const movedEntities: Entity[] = [];
      
      entities.forEach(entity => {
        const updatedEntity = {...entity};
        
        const { forceX, forceY } = calculateAttraction(entity, entities);
        
        let newX = entity.x;
        let newY = entity.y;
        
        const directions = [
          {dx: 0, dy: -1},
          {dx: 1, dy: 0},
          {dx: 0, dy: 1},
          {dx: -1, dy: 0}
        ];
        
        if (Math.abs(forceX) > 0.5 || Math.abs(forceY) > 0.5) {
          directions.unshift({dx: Math.sign(forceX), dy: Math.sign(forceY)});
        }
        
        for (let i = directions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        
        for (const dir of directions) {
          const testX = entity.x + dir.dx;
          const testY = entity.y + dir.dy;
          if (isValidMove(testX, testY)) {
            newX = testX;
            newY = testY;
            break;
          }
        }
        
        updatedEntity.x = newX;
        updatedEntity.y = newY;
        
        const path = entityPaths.get(entity.id) || [];
        path.push({x: newX, y: newY});
        if (path.length > 20) path.shift();
        entityPaths.set(entity.id, path);
        
        movedEntities.push(updatedEntity);
        
        const posKey = `${newX},${newY}`;
        if (!newPositions.has(posKey)) {
          newPositions.set(posKey, []);
        }
        newPositions.get(posKey).push(updatedEntity);
      });
      
      const postMoveRemovedIds = new Set();
      newPositions.forEach((entitiesAtPos, posKey) => {
        if (entitiesAtPos.length > 1) {
          const removed = handleCollisions(posKey, newPositions);
          removed.forEach(id => postMoveRemovedIds.add(id));
        }
      });
      
      entities = movedEntities.filter(entity => !postMoveRemovedIds.has(entity.id));
      stars = stars.filter(star => !postMoveRemovedIds.has(star.id));
      postMoveRemovedIds.forEach(id => entityPaths.delete(id));
      
      entityPositions = new Map();
      entities.forEach(entity => {
        const posKey = `${entity.x},${entity.y}`;
        if (!entityPositions.has(posKey)) {
          entityPositions.set(posKey, []);
        }
        entityPositions.get(posKey).push(entity);
      });
    }

    function updateEntities() {
      moveEntities();
      seedNewCharacters();
      
      const currentTime = Date.now();
      if (currentTime - lastLogTime >= 10000) {
        const distribution: { [key: string]: number } = {};
        let totalCount = 0;
        
        entities.forEach(entity => {
          if (!distribution[entity.char]) {
            distribution[entity.char] = 0;
          }
          distribution[entity.char]++;
          totalCount++;
        });
        
        const sortedChars = Object.keys(distribution).sort();
        const distributionStr = sortedChars.map(char => `${char}:${distribution[char]}`).join(', ');
        
        console.log(`Character Distribution (Total: ${totalCount}) - ${distributionStr}`);
        lastLogTime = currentTime;
      }
      
      const highestChar = entities.reduce((highest, entity) => {
        if (entity.char === '*') return highest;
        return entity.char > highest ? entity.char : highest;
      }, 'a');
      
      if (highestChar < config.reductionStartChar) {
        while (stars.length < config.starCount) {
          createStar();
        }
      }
    }

    function renderMaze() {
      const renderMaze = maze.map(row => [...row]);
      entities.forEach(entity => {
        if (entity.x >= 0 && entity.x < config.width && entity.y >= 0 && entity.y < config.height) {
          renderMaze[entity.y][entity.x] = entity.char;
        }
      });
      
      const hasZ = entities.some(entity => entity.char === 'z');
      let mazeString = renderMaze.map(row => row.join('')).join('\n');
      
      if (hasZ) {
        const distribution: { [key: string]: number } = {};
        entities.forEach(entity => {
          if (!distribution[entity.char]) {
            distribution[entity.char] = 0;
          }
          distribution[entity.char]++;
        });
        
        const sortedChars = Object.keys(distribution).sort();
        const distributionStr = sortedChars.map(char => `${char}:${distribution[char]}`).join(', ');
        const totalCount = entities.length;
        
        const gameOver = [];
        const centerY = Math.floor(config.height / 2);
        
        for (let i = 0; i < config.height; i++) {
          if (i === centerY - 1) {
            const text = 'GAME OVER';
            const pad = Math.floor((config.width - text.length) / 2);
            gameOver.push(' '.repeat(pad) + text + ' '.repeat(config.width - pad - text.length));
          } else if (i === centerY + 1) {
            const text = `Total: ${totalCount}`;
            const pad = Math.floor((config.width - text.length) / 2);
            gameOver.push(' '.repeat(pad) + text + ' '.repeat(config.width - pad - text.length));
          } else if (i === centerY + 2 && distributionStr.length <= config.width) {
            const pad = Math.floor((config.width - distributionStr.length) / 2);
            gameOver.push(' '.repeat(pad) + distributionStr + ' '.repeat(config.width - pad - distributionStr.length));
          } else {
            gameOver.push(' '.repeat(config.width));
          }
        }
        mazeString = gameOver.join('\n');
        if (updateInterval) {
          clearInterval(updateInterval);
          updateInterval = null;
        }
      }
      
      if (canvasRef.current) {
        canvasRef.current.textContent = mazeString;
      }
    }

    function adjustMazeDimensions() {
      if (!canvasRef.current) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const computedStyle = window.getComputedStyle(canvasRef.current);
      const fontSize = parseInt(computedStyle.fontSize);

      config.width = Math.floor(viewportWidth / (fontSize * 0.6));
      config.height = Math.floor(viewportHeight / fontSize);

      config.width = Math.max(config.width, 40);
      config.height = Math.max(config.height, 20);

      const mazeArea = config.width * config.height;
      const entityDensity = 0.1;
      config.maxEntities = Math.floor(mazeArea * entityDensity);
      config.initialEntities = config.maxEntities;
      config.maxActiveEntities = config.maxEntities;
      config.seedBatchSize = Math.min(1000, Math.floor(config.maxEntities * 0.1));

      config.starCount = Math.max(10, Math.floor(config.maxEntities * 0.01));

      initMaze();
    }

    function startAnimation() {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      updateInterval = setInterval(() => {
        updateEntities();
        renderMaze();
      }, config.updateSpeed);
    }

    function handleKeyDown(e: KeyboardEvent) {
      switch(e.key) {
        case 'ArrowUp':
          config.updateSpeed = Math.max(50, config.updateSpeed - 100);
          console.log(`Speed increased - Current speed: ${config.updateSpeed}ms`);
          if (updateInterval) {
            clearInterval(updateInterval);
            startAnimation();
          }
          break;
        case 'ArrowDown':
          config.updateSpeed = Math.min(2000, config.updateSpeed + 100);
          console.log(`Speed decreased - Current speed: ${config.updateSpeed}ms`);
          if (updateInterval) {
            clearInterval(updateInterval);
            startAnimation();
          }
          break;
        case 'f':
        case 'F':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    }

    function handleResize() {
      adjustMazeDimensions();
    }

    // Initialize
    adjustMazeDimensions();
    startAnimation();

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="ascii-maze">
      <style jsx>{`
        .ascii-maze {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #000;
          color: #0f0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          line-height: 1;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        .maze-canvas {
          white-space: pre;
          font-size: 14px;
          line-height: 1;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          font-family: 'Courier New', monospace;
          text-align: left;
          display: flex;
          align-items: stretch;
          justify-content: stretch;
        }
        .header {
          position: fixed;
          top: 10px;
          left: 10px;
          background: rgba(0, 255, 0, 0.2);
          color: #0f0;
          border: 1px solid #0f0;
          padding: 5px 10px;
          font-family: monospace;
          font-size: 12px;
          z-index: 1000;
          pointer-events: none;
        }
        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 255, 0, 0.2);
          color: #0f0;
          border: 1px solid #0f0;
          padding: 5px 10px;
          font-family: monospace;
          font-size: 12px;
          z-index: 1000;
          pointer-events: none;
        }
      `}</style>
      
      <div className="header">ASCII MAZE</div>
      <div className="controls">Use ↑↓ keys to control speed | Press F for fullscreen</div>
      <div 
        ref={canvasRef} 
        className="maze-canvas"
      />
    </div>
  );
}