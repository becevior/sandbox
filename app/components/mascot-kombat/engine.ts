// Mascot Kombat game rules. Pure state + step function; the React layer handles
// input, rendering, and sound.

export type FighterId = "moose" | "duck";

export type Action =
  | "idle"
  | "walk"
  | "jump"
  | "block"
  | "punch"
  | "kick"
  | "special"
  | "hit"
  | "dizzy"
  | "ko"
  | "win"
  | "fatality"
  | "launched";

export type Input = {
  left: boolean;
  right: boolean;
  block: boolean;
  // Edge-triggered: true only on the frame the button was pressed.
  jump: boolean;
  punch: boolean;
  kick: boolean;
  special: boolean;
};

export const NO_INPUT: Input = { left: false, right: false, block: false, jump: false, punch: false, kick: false, special: false };

export type Fighter = {
  id: FighterId;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  hp: number;
  action: Action;
  actionTime: number;
  walkPhase: number;
  attackLanded: boolean;
  specialCooldown: number;
  wins: number;
  spin: number;
};

export type Projectile = { owner: 0 | 1; x: number; y: number; vx: number; spin: number };

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };

export type Phase = "menu" | "intro" | "fight" | "finish" | "fatality" | "roundOver" | "matchOver";

// Announcer clips in public/audio/announcer (see scripts/generate-announcer.sh).
export type VoiceLine = "round1" | "round2" | "round3" | "finalRound" | "fight" | "finishHim" | "fatality" | "flawless" | "mooseWins" | "duckWins" | "draw";

export type Banner = { text: string; sub?: string; tone: "red" | "yellow" };

export type GameEvent =
  | { type: "sound"; name: "punch" | "kick" | "block" | "throw" | "jump" | "ko" | "fatality" | "whiff" }
  | { type: "say"; line: VoiceLine | null; text: string }
  | { type: "matchOver"; winner: FighterId; fatality: boolean; flawless: boolean };

export type Game = {
  phase: Phase;
  phaseTime: number;
  round: number;
  timer: number;
  fighters: [Fighter, Fighter];
  projectiles: Projectile[];
  particles: Particle[];
  banner: Banner | null;
  roundWinner: 0 | 1 | null;
  fatality: boolean;
  // An attack pressed during "Finish him!" while the winner was still airborne.
  fatalityQueued: boolean;
  shake: number;
  flash: number;
  events: GameEvent[];
};

export const STAGE_WIDTH = 1000;
export const STAGE_HEIGHT = 562;
export const FLOOR_Y = 478;
const LEFT_WALL = 70;
const RIGHT_WALL = STAGE_WIDTH - 70;
const START_X: [number, number] = [320, 680];

const ROUND_SECONDS = 60;
const WINS_NEEDED = 2;
const WALK_SPEED = 250;
const JUMP_SPEED = 900;
const GRAVITY = 2600;
const MIN_GAP = 78;
const FINISH_WINDOW = 5;

type AttackSpec = { duration: number; activeFrom: number; activeTo: number; reach: number; damage: number; knockback: number; stun: number };

const ATTACKS: Record<"punch" | "kick", AttackSpec> = {
  punch: { duration: 0.3, activeFrom: 0.08, activeTo: 0.18, reach: 108, damage: 6, knockback: 140, stun: 0.25 },
  kick: { duration: 0.48, activeFrom: 0.16, activeTo: 0.28, reach: 138, damage: 10, knockback: 240, stun: 0.36 },
};
const SPECIAL = { duration: 0.5, releaseAt: 0.24, cooldown: 1.6, speed: 580, damage: 12, height: 118 };

export const FIGHTER_INFO: Record<FighterId, { name: string; special: string; fatality: string; fur: string; feather: string }> = {
  moose: { name: "Mariner Moose", special: "Fastball", fatality: "Grand slam", fur: "#7a4a24", feather: "#c4ced4" },
  duck: { name: "Oregon Duck", special: "Spiral", fatality: "Punt", fur: "#f4f4ee", feather: "#fee123" },
};

const ACTION_DURATION: Partial<Record<Action, number>> = {
  punch: ATTACKS.punch.duration,
  kick: ATTACKS.kick.duration,
  special: SPECIAL.duration,
  fatality: 0.9,
};

function makeFighter(id: FighterId, index: 0 | 1): Fighter {
  return {
    id,
    name: FIGHTER_INFO[id].name,
    x: START_X[index],
    y: 0,
    vx: 0,
    vy: 0,
    facing: index === 0 ? 1 : -1,
    hp: 100,
    action: "idle",
    actionTime: 0,
    walkPhase: 0,
    attackLanded: false,
    specialCooldown: 0,
    wins: 0,
    spin: 0,
  };
}

export function createGame(): Game {
  const fighters: [Fighter, Fighter] = [makeFighter("moose", 0), makeFighter("duck", 1)];
  // Flank the menu on the title screen.
  fighters[0].x = 135;
  fighters[1].x = STAGE_WIDTH - 135;
  return {
    phase: "menu",
    phaseTime: 0,
    round: 1,
    timer: ROUND_SECONDS,
    fighters,
    projectiles: [],
    particles: [],
    banner: null,
    roundWinner: null,
    fatality: false,
    fatalityQueued: false,
    shake: 0,
    flash: 0,
    events: [],
  };
}

export function startMatch(game: Game) {
  game.round = 1;
  game.fatality = false;
  game.fighters.forEach((f) => (f.wins = 0));
  startRound(game);
}

function startRound(game: Game) {
  game.fighters.forEach((f, i) => {
    const wins = f.wins;
    Object.assign(f, makeFighter(f.id, i as 0 | 1), { wins });
  });
  game.projectiles = [];
  game.particles = [];
  game.timer = ROUND_SECONDS;
  game.roundWinner = null;
  game.fatalityQueued = false;
  setPhase(game, "intro");
  const finalRound = game.fighters.every((f) => f.wins === WINS_NEEDED - 1);
  const label = finalRound ? "Final round" : `Round ${game.round}`;
  game.banner = { text: label, tone: "yellow" };
  const line: VoiceLine | null = finalRound ? "finalRound" : game.round <= 3 ? (`round${game.round}` as VoiceLine) : null;
  game.events.push({ type: "say", line, text: label });
}

function setPhase(game: Game, phase: Phase) {
  game.phase = phase;
  game.phaseTime = 0;
}

function setAction(f: Fighter, action: Action) {
  f.action = action;
  f.actionTime = 0;
  f.attackLanded = false;
}

const isBusy = (f: Fighter) => ["punch", "kick", "special", "hit", "dizzy", "ko", "win", "fatality", "launched"].includes(f.action);
const isDown = (f: Fighter) => f.action === "ko" || f.action === "launched";

function burst(game: Game, x: number, y: number, color: string, count: number, power = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (120 + Math.random() * 320) * power;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 120,
      life: 0.5 + Math.random() * 0.5,
      color,
      size: 3 + Math.random() * 5,
    });
  }
}

function controlFighter(game: Game, f: Fighter, input: Input) {
  const grounded = f.y <= 0;
  const canAct = game.phase === "fight" || (game.phase === "finish" && f.action !== "dizzy");
  if (!canAct || isBusy(f)) return;

  // During "Finish him!" attack buttons trigger the fatality instead (see step).
  if (game.phase === "fight" && input.special && f.specialCooldown <= 0) {
    setAction(f, "special");
    if (grounded) f.vx = 0;
    return;
  }
  if (game.phase === "fight" && (input.punch || input.kick)) {
    setAction(f, input.kick ? "kick" : "punch");
    if (grounded) f.vx = 0;
    return;
  }
  if (!grounded) return;

  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (input.jump) {
    setAction(f, "jump");
    f.vy = JUMP_SPEED;
    f.vx = dir * WALK_SPEED * 1.15;
    game.events.push({ type: "sound", name: "jump" });
    return;
  }
  if (input.block) {
    if (f.action !== "block") setAction(f, "block");
    f.vx = 0;
    return;
  }
  if (dir !== 0) {
    if (f.action !== "walk") setAction(f, "walk");
    const backing = dir !== f.facing;
    f.vx = dir * WALK_SPEED * (backing ? 0.8 : 1);
  } else {
    if (f.action !== "idle") setAction(f, "idle");
    f.vx = 0;
  }
}

function landHit(game: Game, attacker: Fighter, defender: Fighter, damage: number, knockback: number, stun: number, heavy: boolean) {
  const hitX = (attacker.x + defender.x) / 2;
  const hitY = FLOOR_Y - Math.max(defender.y + 120, 90);
  const blocking = defender.action === "block" && defender.y <= 0 && defender.facing === -attacker.facing;
  const dir = Math.sign(defender.x - attacker.x) || attacker.facing;

  if (blocking) {
    defender.hp = Math.max(0, defender.hp - damage * 0.15);
    defender.vx = dir * knockback * 0.5;
    game.events.push({ type: "sound", name: "block" });
    burst(game, hitX, hitY, "#bfe8ff", 6, 0.6);
  } else {
    defender.hp = Math.max(0, defender.hp - damage);
    setAction(defender, "hit");
    defender.actionTime = -stun + 0.25; // hit lasts 0.25s + extra stun
    defender.vx = dir * knockback;
    if (defender.y > 0) defender.vy = Math.max(defender.vy, 300);
    game.events.push({ type: "sound", name: heavy ? "kick" : "punch" });
    burst(game, hitX, hitY, FIGHTER_INFO[defender.id].fur, heavy ? 14 : 8);
    burst(game, hitX, hitY, "#fff6a8", heavy ? 6 : 3, 0.7);
    game.shake = Math.max(game.shake, heavy ? 10 : 5);
  }

  if (defender.hp <= 0) knockOut(game, game.fighters.indexOf(attacker) as 0 | 1);
}

function knockOut(game: Game, winnerIndex: 0 | 1) {
  const winner = game.fighters[winnerIndex];
  const loser = game.fighters[1 - winnerIndex];
  loser.hp = 0;
  game.projectiles = [];
  if (winner.wins + 1 >= WINS_NEEDED) {
    setAction(loser, "dizzy");
    loser.vx = 0;
    if (winner.action !== "jump") setAction(winner, "idle");
    setPhase(game, "finish");
    game.roundWinner = winnerIndex;
    game.banner = { text: "Finish him!", sub: `Press any attack for the ${FIGHTER_INFO[winner.id].fatality.toLowerCase()}`, tone: "red" };
    game.events.push({ type: "say", line: "finishHim", text: "Finish him!" });
    return;
  }
  setAction(loser, "ko");
  game.events.push({ type: "sound", name: "ko" });
  endRound(game, winnerIndex, false);
}

function endRound(game: Game, winnerIndex: 0 | 1 | null, fatality: boolean) {
  game.roundWinner = winnerIndex;
  game.projectiles = [];
  if (winnerIndex === null) {
    setPhase(game, "roundOver");
    game.banner = { text: "Draw", tone: "yellow" };
    game.events.push({ type: "say", line: "draw", text: "Draw" });
    return;
  }
  const winner = game.fighters[winnerIndex];
  winner.wins += 1;
  if (!fatality) setAction(winner, "win");
  winner.vx = 0;
  const flawless = winner.hp >= 100;
  const matchOver = winner.wins >= WINS_NEEDED;
  setPhase(game, matchOver ? "matchOver" : "roundOver");
  const winText = `${winner.id === "moose" ? "Moose" : "Duck"} wins`;
  game.banner = fatality
    ? { text: "Fatality", sub: FIGHTER_INFO[winner.id].fatality, tone: "red" }
    : { text: winText, sub: flawless ? "Flawless victory" : undefined, tone: "yellow" };
  if (!fatality) {
    announceWinner(game, winner);
    if (flawless) game.events.push({ type: "say", line: "flawless", text: "Flawless victory" });
  }
  if (matchOver) game.events.push({ type: "matchOver", winner: winner.id, fatality, flawless });
}

function announceWinner(game: Game, winner: Fighter) {
  game.events.push({ type: "say", line: winner.id === "moose" ? "mooseWins" : "duckWins", text: `${winner.name} wins` });
}

function startFatality(game: Game, winnerIndex: 0 | 1) {
  const winner = game.fighters[winnerIndex];
  const loser = game.fighters[1 - winnerIndex];
  // Step in close so the swing connects.
  winner.x = loser.x - winner.facing * 95;
  winner.y = 0;
  winner.vx = 0;
  winner.vy = 0;
  setAction(winner, "fatality");
  setPhase(game, "fatality");
  game.banner = null;
  game.fatality = true;
}

function updateFatality(game: Game) {
  const winnerIndex = game.roundWinner as 0 | 1;
  const winner = game.fighters[winnerIndex];
  const loser = game.fighters[1 - winnerIndex];
  if (loser.action !== "launched" && winner.actionTime >= 0.42) {
    setAction(loser, "launched");
    loser.vx = winner.facing * 1150;
    loser.vy = 1500;
    game.flash = 1;
    game.shake = 22;
    game.events.push({ type: "sound", name: "fatality" });
    burst(game, loser.x, FLOOR_Y - 130, FIGHTER_INFO[loser.id].fur, 40, 1.6);
    burst(game, loser.x, FLOOR_Y - 130, "#ffe14d", 20, 1.3);
  }
  if (game.phaseTime >= 1.6 && !game.banner) {
    game.banner = { text: "Fatality", sub: FIGHTER_INFO[winner.id].fatality, tone: "red" };
    game.events.push({ type: "say", line: "fatality", text: "Fatality" });
  }
  if (game.phaseTime >= 3.6) {
    setAction(winner, "win");
    game.roundWinner = null;
    endRound(game, winnerIndex, true);
    game.banner = { text: `${winner.id === "moose" ? "Moose" : "Duck"} wins`, sub: "Fatality", tone: "yellow" };
    announceWinner(game, winner);
  }
}

function physics(f: Fighter, dt: number) {
  f.x += f.vx * dt;
  if (f.y > 0 || f.vy > 0) {
    f.vy -= GRAVITY * dt;
    f.y += f.vy * dt;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      if (f.action === "jump") setAction(f, "idle");
      if (f.action !== "walk") f.vx = 0;
    }
  } else if (f.action === "hit" || f.action === "ko" || f.action === "block") {
    f.vx *= Math.pow(0.002, dt);
  }
  if (f.action !== "launched") f.x = Math.min(RIGHT_WALL, Math.max(LEFT_WALL, f.x));
}

function updateAttack(game: Game, f: Fighter, opponent: Fighter, index: 0 | 1) {
  if (f.action === "punch" || f.action === "kick") {
    const spec = ATTACKS[f.action];
    const active = f.actionTime >= spec.activeFrom && f.actionTime <= spec.activeTo;
    if (active && !f.attackLanded && !isDown(opponent)) {
      const dx = (opponent.x - f.x) * f.facing;
      const dy = Math.abs(opponent.y - f.y);
      if (dx > 0 && dx <= spec.reach && dy < 120) {
        f.attackLanded = true;
        landHit(game, f, opponent, spec.damage, spec.knockback, spec.stun, f.action === "kick");
      }
    }
    if (f.actionTime > spec.activeTo && !f.attackLanded) {
      f.attackLanded = true;
      game.events.push({ type: "sound", name: "whiff" });
    }
  }
  if (f.action === "special" && !f.attackLanded && f.actionTime >= SPECIAL.releaseAt) {
    f.attackLanded = true;
    f.specialCooldown = SPECIAL.cooldown;
    game.projectiles.push({ owner: index, x: f.x + f.facing * 55, y: f.y + SPECIAL.height, vx: f.facing * SPECIAL.speed, spin: 0 });
    game.events.push({ type: "sound", name: "throw" });
  }
}

function finishAction(f: Fighter) {
  const duration = f.action === "hit" ? 0.25 : ACTION_DURATION[f.action];
  if (duration !== undefined && f.actionTime >= duration && f.action !== "fatality") {
    setAction(f, f.y > 0 ? "jump" : "idle");
  }
}

function updateProjectiles(game: Game, dt: number) {
  const [a, b] = game.fighters;
  for (const p of game.projectiles) {
    p.x += p.vx * dt;
    p.spin += dt * 900 * Math.sign(p.vx);
  }
  // Opposing throws cancel each other out.
  const p0 = game.projectiles.find((p) => p.owner === 0);
  const p1 = game.projectiles.find((p) => p.owner === 1);
  if (p0 && p1 && Math.abs(p0.x - p1.x) < 40) {
    burst(game, (p0.x + p1.x) / 2, FLOOR_Y - p0.y, "#ffffff", 12);
    game.events.push({ type: "sound", name: "block" });
    game.projectiles = game.projectiles.filter((p) => p !== p0 && p !== p1);
  }
  game.projectiles = game.projectiles.filter((p) => {
    const attacker = p.owner === 0 ? a : b;
    const target = p.owner === 0 ? b : a;
    if (!isDown(target) && Math.abs(p.x - target.x) < 42 && target.y < 70 && game.phase === "fight") {
      landHit(game, attacker, target, SPECIAL.damage, 200, 0.3, true);
      return false;
    }
    return p.x > -60 && p.x < STAGE_WIDTH + 60;
  });
}

function separate(game: Game) {
  const [a, b] = game.fighters;
  if (isDown(a) || isDown(b)) return;
  const dx = b.x - a.x;
  if (Math.abs(dx) < MIN_GAP && Math.abs(a.y - b.y) < 110) {
    const push = (MIN_GAP - Math.abs(dx)) / 2;
    const dir = Math.sign(dx) || 1;
    a.x -= dir * push;
    b.x += dir * push;
    if (a.x < LEFT_WALL) { b.x += LEFT_WALL - a.x; a.x = LEFT_WALL; }
    if (b.x > RIGHT_WALL) { a.x -= b.x - RIGHT_WALL; b.x = RIGHT_WALL; }
    if (b.x < LEFT_WALL) { a.x += LEFT_WALL - b.x; b.x = LEFT_WALL; }
    if (a.x > RIGHT_WALL) { b.x -= a.x - RIGHT_WALL; a.x = RIGHT_WALL; }
  }
}

export function step(game: Game, inputs: [Input, Input], dt: number) {
  game.phaseTime += dt;
  game.shake = Math.max(0, game.shake - dt * 40);
  game.flash = Math.max(0, game.flash - dt * 2.5);
  const [a, b] = game.fighters;

  for (const f of game.fighters) {
    f.actionTime += dt;
    f.specialCooldown = Math.max(0, f.specialCooldown - dt);
    if (f.action === "walk") f.walkPhase += dt * 11;
    if (f.action === "launched") f.spin += dt * 900 * Math.sign(f.vx);
  }

  if (game.phase === "intro") {
    if (game.phaseTime >= 1.4 && game.banner?.text !== "Fight!") {
      game.banner = { text: "Fight!", tone: "red" };
      game.events.push({ type: "say", line: "fight", text: "Fight!" });
      setPhase(game, "fight");
    }
  } else if (game.phase === "fight") {
    if (game.phaseTime > 0.9 && game.banner?.text === "Fight!") game.banner = null;
    game.timer = Math.max(0, game.timer - dt);
    if (game.timer === 0) {
      const winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1;
      if (winner !== null) setAction(game.fighters[1 - winner], "ko");
      endRound(game, winner, false);
    }
  } else if (game.phase === "finish") {
    const winnerIndex = game.roundWinner as 0 | 1;
    const winner = game.fighters[winnerIndex];
    const input = inputs[winnerIndex];
    if (input.punch || input.kick || input.special) game.fatalityQueued = true;
    if (game.fatalityQueued && winner.y <= 0) {
      startFatality(game, winnerIndex);
    } else if (game.phaseTime >= FINISH_WINDOW) {
      const loser = game.fighters[1 - winnerIndex];
      setAction(loser, "ko");
      game.events.push({ type: "sound", name: "ko" });
      game.roundWinner = null;
      endRound(game, winnerIndex, false);
    }
  } else if (game.phase === "fatality") {
    updateFatality(game);
  } else if (game.phase === "roundOver") {
    if (game.phaseTime >= 3.2) {
      game.round += 1;
      startRound(game);
    }
  }

  // Face each other unless mid-air or mid-move.
  for (const [f, other] of [[a, b], [b, a]] as const) {
    if (f.y <= 0 && !isBusy(f) && !isDown(other)) f.facing = other.x >= f.x ? 1 : -1;
  }

  controlFighter(game, a, inputs[0]);
  controlFighter(game, b, inputs[1]);

  for (const f of game.fighters) physics(f, dt);
  separate(game);

  if (game.phase === "fight" || game.phase === "finish") {
    updateAttack(game, a, b, 0);
    updateAttack(game, b, a, 1);
  }
  updateProjectiles(game, dt);
  for (const f of game.fighters) finishAction(f);

  for (const p of game.particles) {
    p.x += p.vx * dt;
    p.y -= p.vy * dt;
    p.vy -= 1400 * dt;
    p.life -= dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0 && p.y < FLOOR_Y + 10);
}

// --- Computer opponent -------------------------------------------------------

export type CpuBrain = { cooldown: number; holdBlock: number; dir: number };

export const createBrain = (): CpuBrain => ({ cooldown: 0.6, holdBlock: 0, dir: 0 });

export function cpuInput(game: Game, index: 0 | 1, brain: CpuBrain, dt: number): Input {
  const me = game.fighters[index];
  const foe = game.fighters[1 - index];
  const input: Input = { ...NO_INPUT };
  brain.cooldown -= dt;
  brain.holdBlock -= dt;

  if (game.phase === "finish") {
    if (game.roundWinner === index && game.phaseTime > 1.1) input.special = true;
    return input;
  }
  if (game.phase !== "fight" || me.action === "hit") return input;

  const dist = Math.abs(foe.x - me.x);
  const toward = foe.x > me.x ? 1 : -1;
  const incoming = game.projectiles.find((p) => p.owner !== index && Math.sign(me.x - p.x) === Math.sign(p.vx) && Math.abs(p.x - me.x) < 260);
  const foeAttacking = ["punch", "kick"].includes(foe.action) && dist < 170;

  if (brain.holdBlock > 0) {
    input.block = true;
    return input;
  }
  if (incoming && brain.cooldown <= 0) {
    brain.cooldown = 0.4;
    if (Math.random() < 0.55) input.jump = true;
    else brain.holdBlock = 0.45;
    return input;
  }
  if (foeAttacking && brain.cooldown <= 0 && Math.random() < 0.35) {
    brain.holdBlock = 0.35;
    brain.cooldown = 0.3;
    return input;
  }

  if (brain.cooldown <= 0) {
    brain.cooldown = 0.18 + Math.random() * 0.3;
    const roll = Math.random();
    if (dist > 320) {
      if (roll < 0.28 && me.specialCooldown <= 0) input.special = true;
      else brain.dir = toward;
    } else if (dist > 140) {
      if (roll < 0.15) { input.jump = true; brain.dir = toward; }
      else if (roll < 0.25 && me.specialCooldown <= 0) input.special = true;
      else brain.dir = toward;
    } else {
      if (roll < 0.42) input.punch = true;
      else if (roll < 0.74) input.kick = true;
      else if (roll < 0.86) brain.dir = -toward;
      else brain.holdBlock = 0.3;
      if (roll < 0.74) brain.dir = 0;
    }
  }
  // Jump-in kick when coming down near the opponent.
  if (me.y > 40 && me.vy < 0 && dist < 150 && me.action === "jump") input.kick = true;

  if (brain.dir === 1) input.right = true;
  if (brain.dir === -1) input.left = true;
  return input;
}
