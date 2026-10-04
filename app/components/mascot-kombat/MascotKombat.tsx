"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import ArcadeText from "../ArcadeText";
import { posthogAppLogger } from "../../posthog-logger";
import { isPostHogEnabled } from "../../posthog-provider";
import {
  FLOOR_Y,
  NO_INPUT,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  createBrain,
  createGame,
  cpuInput,
  startMatch,
  step,
  type Game,
  type Input,
} from "./engine";
import { FighterSprite, ProjectileSprite } from "./fighters";
import { createSound, type Sound } from "./sound";
import styles from "./mascot-kombat.module.css";

type Mode = { kind: "solo"; human: 0 | 1 } | { kind: "versus" } | { kind: "watch" };

type KeyMap = Record<keyof Input, string>;
const MOOSE_KEYS: KeyMap = { left: "KeyA", right: "KeyD", jump: "KeyW", block: "KeyS", punch: "KeyF", kick: "KeyG", special: "KeyH" };
const DUCK_KEYS: KeyMap = { left: "ArrowLeft", right: "ArrowRight", jump: "ArrowUp", block: "ArrowDown", punch: "Comma", kick: "Period", special: "Slash" };
const GAME_KEYS = new Set([...Object.values(MOOSE_KEYS), ...Object.values(DUCK_KEYS)]);

const winnerProperty = (id: "moose" | "duck") => (id === "moose" ? "mariners_moose" : "oregon_duck");

function readInput(map: KeyMap, held: Set<string>, pressed: Set<string>): Input {
  return {
    left: held.has(map.left),
    right: held.has(map.right),
    block: held.has(map.block),
    jump: pressed.has(map.jump),
    punch: pressed.has(map.punch),
    kick: pressed.has(map.kick),
    special: pressed.has(map.special),
  };
}

function mergeInputs(a: Input, b: Input): Input {
  return Object.fromEntries(Object.keys(a).map((k) => [k, a[k as keyof Input] || b[k as keyof Input]])) as Input;
}

function StageBackdrop() {
  const floorTop = FLOOR_Y - 46;
  const rays = Array.from({ length: 19 }, (_, i) => i - 9);
  return (
    <g>
      <rect width={STAGE_WIDTH} height={floorTop} fill="url(#mk-wall-shade)" />
      {/* Pillars */}
      {[0, STAGE_WIDTH - 64].map((x) => (
        <g key={x}>
          <rect x={x} y={0} width={64} height={floorTop} fill="#00000055" />
          <rect x={x + (x === 0 ? 60 : 0)} y={0} width={4} height={floorTop} fill="#a0a09a55" />
        </g>
      ))}
      {/* Team banners */}
      <g transform="translate(250 0)">
        <path d="M -58 0 H 58 V 196 L 0 228 L -58 196 Z" fill="#0c2c56" stroke="#00000088" strokeWidth={3} />
        <path d="M -48 0 V 190 L 0 216 L 48 190 V 0" fill="none" stroke="#00686b" strokeWidth={5} />
        <g transform="translate(0 104)">
          <circle r={34} fill="none" stroke="#c4ced4" strokeWidth={5} />
          <path d="M 0 -46 L 8 -8 L 46 0 L 8 8 L 0 46 L -8 8 L -46 0 L -8 -8 Z" fill="#c4ced4" />
          <circle r={8} fill="#00686b" />
        </g>
      </g>
      <g transform="translate(750 0)">
        <path d="M -58 0 H 58 V 196 L 0 228 L -58 196 Z" fill="#154733" stroke="#00000088" strokeWidth={3} />
        <path d="M -48 0 V 190 L 0 216 L 48 190 V 0" fill="none" stroke="#fee123" strokeWidth={5} />
        <ellipse cx={0} cy={104} rx={28} ry={36} fill="none" stroke="#fee123" strokeWidth={14} />
      </g>
      {/* Torches */}
      {[120, STAGE_WIDTH - 120, STAGE_WIDTH / 2].map((x) => (
        <g key={x} transform={`translate(${x} ${x === STAGE_WIDTH / 2 ? 150 : 210})`}>
          <ellipse cx={0} cy={-26} rx={46} ry={56} fill="url(#mk-torch-glow)" />
          <g className={styles.flame}>
            <path d="M 0 -48 Q 16 -24 10 -8 Q 0 2 -10 -8 Q -16 -24 0 -48 Z" fill="#ff9d1a" />
            <path d="M 0 -32 Q 8 -18 5 -8 Q 0 -3 -5 -8 Q -8 -18 0 -32 Z" fill="#fff07a" />
          </g>
          <path d="M -14 -6 H 14 L 8 10 H -8 Z" fill="#3a3a36" stroke="#8a8a80" strokeWidth={2} />
          <rect x={-3} y={10} width={6} height={22} fill="#3a3a36" />
        </g>
      ))}
      {/* Floor */}
      <rect y={floorTop} width={STAGE_WIDTH} height={STAGE_HEIGHT - floorTop} fill="#1b1b19" opacity={0.62} />
      <g stroke="#8a8a80" strokeOpacity={0.28} strokeWidth={2}>
        {rays.map((i) => (
          <line key={i} x1={STAGE_WIDTH / 2 + i * 62} y1={floorTop} x2={STAGE_WIDTH / 2 + i * 150} y2={STAGE_HEIGHT} />
        ))}
        {[18, 44, 78].map((dy) => (
          <line key={dy} x1={0} y1={floorTop + dy} x2={STAGE_WIDTH} y2={floorTop + dy} />
        ))}
      </g>
      <rect y={floorTop - 3} width={STAGE_WIDTH} height={4} fill="#a0a09a" opacity={0.75} />
    </g>
  );
}

function HealthBar({ hp, name, wins, side }: { hp: number; name: string; wins: number; side: "left" | "right" }) {
  return (
    <div className={`${styles.player} ${styles[side]}`}>
      <div className={styles.bar} role="meter" aria-label={`${name} health`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hp)}>
        <div className={styles.barFill} style={{ width: `${hp}%` }} />
        <ArcadeText className={styles.barName} text={name} fluid />
      </div>
      <div className={styles.wins} aria-label={`${wins} round${wins === 1 ? "" : "s"} won`}>
        {Array.from({ length: wins }, (_, i) => <span key={i} className={styles.medallion} />)}
      </div>
    </div>
  );
}

function KeyHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className={styles.hint}>
      {keys.map((k) => <kbd key={k}>{k}</kbd>)}
      {label}
    </span>
  );
}

const MOOSE_HINTS = [
  { keys: ["A", "D"], label: "move" },
  { keys: ["W"], label: "jump" },
  { keys: ["S"], label: "block" },
  { keys: ["F"], label: "punch" },
  { keys: ["G"], label: "kick" },
  { keys: ["H"], label: "throw" },
];
const DUCK_HINTS = [
  { keys: ["←", "→"], label: "move" },
  { keys: ["↑"], label: "jump" },
  { keys: ["↓"], label: "block" },
  { keys: [","], label: "punch" },
  { keys: ["."], label: "kick" },
  { keys: ["/"], label: "throw" },
];

const TOUCH_BUTTONS: { code: string; label: string; group: "move" | "attack" }[] = [
  { code: MOOSE_KEYS.left, label: "◀", group: "move" },
  { code: MOOSE_KEYS.jump, label: "▲", group: "move" },
  { code: MOOSE_KEYS.right, label: "▶", group: "move" },
  { code: MOOSE_KEYS.block, label: "Block", group: "move" },
  { code: MOOSE_KEYS.punch, label: "Punch", group: "attack" },
  { code: MOOSE_KEYS.kick, label: "Kick", group: "attack" },
  { code: MOOSE_KEYS.special, label: "Throw", group: "attack" },
];

export default function MascotKombat() {
  const gameRef = useRef<Game>(createGame());
  const [, setFrame] = useState(0);
  const [mode, setMode] = useState<Mode | null>(null);
  const [paused, setPaused] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const modeRef = useRef(mode);
  const pausedRef = useRef(paused);
  const soundRef = useRef<Sound | null>(null);
  const held = useRef(new Set<string>());
  const pressed = useRef(new Set<string>());
  const brains = useRef([createBrain(), createBrain()]);
  const calmMotion = useRef(false);

  modeRef.current = mode;
  pausedRef.current = paused;

  useEffect(() => {
    calmMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stored = window.localStorage.getItem("mascot-kombat-sound");
    if (stored === "off") setSoundOn(false);
  }, []);

  const buildInputs = useCallback((dt: number): [Input, Input] => {
    const game = gameRef.current;
    const current = modeRef.current;
    const moose = readInput(MOOSE_KEYS, held.current, pressed.current);
    const duck = readInput(DUCK_KEYS, held.current, pressed.current);
    if (!current) return [NO_INPUT, NO_INPUT];
    if (current.kind === "versus") return [moose, duck];
    const cpu = (i: 0 | 1) => cpuInput(game, i, brains.current[i], dt);
    if (current.kind === "watch") return [cpu(0), cpu(1)];
    const human = mergeInputs(moose, duck);
    return current.human === 0 ? [human, cpu(1)] : [cpu(0), human];
  }, []);

  const handleEvents = useCallback(() => {
    const game = gameRef.current;
    const sound = soundRef.current;
    for (const event of game.events) {
      if (event.type === "sound") sound?.play(event.name);
      if (event.type === "say") {
        sound?.say(event.text);
        setAnnouncement(event.text);
      }
      if (event.type === "matchOver") {
        sound?.stopMusic();
        const current = modeRef.current;
        if (isPostHogEnabled) {
          posthog.capture("battle_completed", {
            winner: winnerProperty(event.winner),
            mode: current?.kind,
            fatality: event.fatality,
            flawless: event.flawless,
          });
        }
        posthogAppLogger.battleCompleted(winnerProperty(event.winner));
      }
    }
    game.events = [];
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) {
        step(gameRef.current, buildInputs(dt), dt);
        handleEvents();
      }
      pressed.current.clear();
      setFrame((n) => n + 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [buildInputs, handleEvents]);

  const begin = useCallback((next: Mode) => {
    if (!soundRef.current) soundRef.current = createSound(!soundOn);
    brains.current = [createBrain(), createBrain()];
    held.current.clear();
    setMode(next);
    setPaused(false);
    startMatch(gameRef.current);
    soundRef.current?.startMusic();
    if (isPostHogEnabled) {
      posthog.capture("battle_started", {
        mode: next.kind,
        player_fighter: next.kind === "solo" ? (next.human === 0 ? "mariners_moose" : "oregon_duck") : undefined,
      });
    }
    posthogAppLogger.battleStarted();
  }, [soundOn]);

  const quitToMenu = useCallback(() => {
    soundRef.current?.stopMusic();
    gameRef.current = createGame();
    setMode(null);
    setPaused(false);
    setAnnouncement("");
  }, []);

  const togglePause = useCallback(() => {
    const phase = gameRef.current.phase;
    if (!modeRef.current || phase === "menu" || phase === "matchOver") return;
    setPaused((was) => {
      if (was) soundRef.current?.startMusic();
      else soundRef.current?.stopMusic();
      return !was;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundOn((was) => {
      const next = !was;
      soundRef.current?.setMuted(!next);
      window.localStorage.setItem("mascot-kombat-sound", next ? "on" : "off");
      return next;
    });
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (typing) return;
      if (event.code === "Escape" || event.code === "KeyP") {
        togglePause();
        return;
      }
      if (event.code === "KeyM") {
        toggleSound();
        return;
      }
      if (!GAME_KEYS.has(event.code) || !modeRef.current) return;
      event.preventDefault();
      held.current.add(event.code);
      if (!event.repeat) pressed.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => held.current.delete(event.code);
    const clear = () => held.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [togglePause, toggleSound]);

  useEffect(() => () => soundRef.current?.stopMusic(), []);

  const game = gameRef.current;
  const [moose, duck] = game.fighters;
  const shake = calmMotion.current ? 0 : game.shake;
  const shakeX = shake ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * shake : 0;
  const banner = game.banner;
  const inMatch = mode !== null;
  const timer = Math.ceil(game.timer).toString().padStart(2, "0");

  const pressTouch = (code: string) => {
    held.current.add(code);
    pressed.current.add(code);
  };
  const releaseTouch = (code: string) => held.current.delete(code);

  return (
    <main className={styles.screen}>
      <h1 className="sr-only">Mascot Kombat: Mariner Moose versus Oregon Duck</h1>
      <p className="sr-only" aria-live="assertive">{announcement}</p>

      <div className={styles.stage}>
        <svg className={styles.world} viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} aria-hidden="true">
          <defs>
            <linearGradient id="mk-wall-shade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#000" stopOpacity={0.62} />
              <stop offset="1" stopColor="#000" stopOpacity={0.15} />
            </linearGradient>
            <radialGradient id="mk-torch-glow">
              <stop offset="0" stopColor="#ffb347" stopOpacity={0.45} />
              <stop offset="1" stopColor="#ffb347" stopOpacity={0} />
            </radialGradient>
          </defs>
          <g transform={`translate(${shakeX} ${shakeY})`}>
            <StageBackdrop />
            {[moose, duck]
              .slice()
              .sort((a, b) => (a.action === "fatality" ? 1 : b.action === "fatality" ? -1 : 0))
              .map((f) => <FighterSprite key={f.id} fighter={f} />)}
            {game.projectiles.map((p, i) => <ProjectileSprite key={i} projectile={p} kind={game.fighters[p.owner].id} />)}
            {game.particles.map((p, i) => (
              <rect key={i} x={p.x} y={p.y} width={p.size} height={p.size} fill={p.color} opacity={Math.min(1, p.life * 2)} />
            ))}
          </g>
          {game.flash > 0 && !calmMotion.current && <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#c8102e" opacity={game.flash * 0.55} />}
        </svg>

        {inMatch && (
          <div className={styles.hud}>
            <HealthBar hp={moose.hp} name="Mariner Moose" wins={moose.wins} side="left" />
            <div className={styles.timer} aria-label={`${timer} seconds left`}>
              <ArcadeText text={timer} fluid className={styles.timerText} />
            </div>
            <HealthBar hp={duck.hp} name="Oregon Duck" wins={duck.wins} side="right" />
          </div>
        )}

        {inMatch && banner && (
          <div className={`${styles.banner} ${styles[banner.tone]}`} key={`${banner.text}-${game.round}`}>
            <ArcadeText text={banner.text} fluid className={styles.bannerText} />
            {banner.sub && <ArcadeText text={banner.sub} fluid className={styles.bannerSub} />}
          </div>
        )}

        {!inMatch && (
          <div className={styles.menu}>
            <ArcadeText text="Mascot Kombat" fluid className={styles.title} />
            <p className={styles.matchup}>Mariner Moose vs. Oregon Duck</p>
            <div className={styles.modes}>
              <button type="button" className={styles.modeButton} onClick={() => begin({ kind: "solo", human: 0 })} autoFocus>
                <ArcadeText text="Play as Moose" fluid />
                <span className="sr-only">Play as Mariner Moose against the computer</span>
              </button>
              <button type="button" className={styles.modeButton} onClick={() => begin({ kind: "solo", human: 1 })}>
                <ArcadeText text="Play as Duck" fluid />
                <span className="sr-only">Play as Oregon Duck against the computer</span>
              </button>
              <button type="button" className={`${styles.modeButton} ${styles.keyboardOnly}`} onClick={() => begin({ kind: "versus" })}>
                <ArcadeText text="2 Players" fluid />
                <span className="sr-only">Two players on one keyboard</span>
              </button>
              <button type="button" className={styles.modeButton} onClick={() => begin({ kind: "watch" })}>
                <ArcadeText text="Watch" fluid />
                <span className="sr-only">Watch the computer fight itself</span>
              </button>
            </div>
          </div>
        )}

        {inMatch && game.phase === "matchOver" && (
          <div className={styles.endActions}>
            <button type="button" className={styles.modeButton} onClick={() => mode && begin(mode)} autoFocus>
              <ArcadeText text="Rematch" fluid />
                <span className="sr-only">Rematch</span>
            </button>
            <button type="button" className={styles.modeButton} onClick={quitToMenu}>
              <ArcadeText text="Menu" fluid />
                <span className="sr-only">Menu</span>
            </button>
          </div>
        )}

        {paused && (
          <div className={styles.pause}>
            <ArcadeText text="Paused" fluid className={styles.bannerText} />
            <div className={styles.endActions}>
              <button type="button" className={styles.modeButton} onClick={togglePause} autoFocus>
                <ArcadeText text="Resume" fluid />
                <span className="sr-only">Resume</span>
              </button>
              <button type="button" className={styles.modeButton} onClick={quitToMenu}>
                <ArcadeText text="Menu" fluid />
                <span className="sr-only">Menu</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {inMatch && mode.kind !== "watch" && (
        <div className={styles.touchPad} aria-label="Touch controls">
          {(["move", "attack"] as const).map((group) => (
            <div key={group} className={styles[group]}>
              {TOUCH_BUTTONS.filter((b) => b.group === group).map((b) => (
                <button
                  key={b.code}
                  type="button"
                  className={styles.touchButton}
                  onPointerDown={(e) => { e.preventDefault(); pressTouch(b.code); }}
                  onPointerUp={() => releaseTouch(b.code)}
                  onPointerLeave={() => releaseTouch(b.code)}
                  onPointerCancel={() => releaseTouch(b.code)}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <Link href="/" className={styles.footerLink}>Home</Link>
        <div className={styles.hints}>
          {inMatch && mode.kind !== "watch" ? (
            <>
              {(mode.kind === "versus" || mode.human === 0) && (
                <span className={styles.hintGroup}>
                  {mode.kind === "versus" && <strong>Moose</strong>}
                  {MOOSE_HINTS.map((h) => <KeyHint key={h.label} {...h} />)}
                </span>
              )}
              {(mode.kind === "versus" || mode.human === 1) && (
                <span className={styles.hintGroup}>
                  {mode.kind === "versus" && <strong>Duck</strong>}
                  {DUCK_HINTS.map((h) => <KeyHint key={h.label} {...h} />)}
                </span>
              )}
              <KeyHint keys={["Esc"]} label="pause" />
            </>
          ) : (
            <span>Best of three rounds. Finish the job with a throw.</span>
          )}
        </div>
        <button type="button" className={styles.footerLink} onClick={toggleSound} aria-pressed={soundOn}>
          Sound {soundOn ? "on" : "off"}
        </button>
      </div>
    </main>
  );
}
