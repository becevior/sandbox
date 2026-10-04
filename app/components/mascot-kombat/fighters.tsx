import type { Fighter, Projectile } from "./engine";
import { FLOOR_Y } from "./engine";

// Limb angles are in degrees, measured forward from hanging straight down:
// 0 = down, 90 = straight ahead, 180 = straight up, negative = behind.
type Pose = {
  bob: number;
  lean: number;
  head: number;
  frontArm: number;
  backArm: number;
  reach: number;
  frontLeg: number;
  backLeg: number;
  spin: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Ramp up over [0, rise], hold until hold, ease back over fall.
function extension(t: number, rise: number, hold: number, fall: number) {
  if (t < rise) return t / rise;
  if (t < hold) return 1;
  return clamp01(1 - (t - hold) / fall);
}

function poseFor(f: Fighter): Pose {
  const t = f.actionTime;
  const base: Pose = { bob: Math.sin(t * 5) * 3, lean: 0, head: 0, frontArm: 70, backArm: 45, reach: 1, frontLeg: 14, backLeg: -14, spin: 0 };

  switch (f.action) {
    case "walk": {
      const s = Math.sin(f.walkPhase);
      return { ...base, bob: -Math.abs(s) * 4, frontLeg: 10 + s * 24, backLeg: -10 - s * 24, frontArm: 70 - s * 12, backArm: 45 + s * 12 };
    }
    case "jump":
      return { ...base, bob: -4, frontLeg: 75, backLeg: 30, frontArm: 125, backArm: 105 };
    case "block":
      return { ...base, lean: -6, frontArm: 158, backArm: 145, reach: 0.8, frontLeg: 20, backLeg: -20 };
    case "punch": {
      const e = extension(t, 0.08, 0.18, 0.12);
      return { ...base, bob: 0, lean: 9 * e, frontArm: 72 + 18 * e, reach: 1 + 0.5 * e, backArm: 30 };
    }
    case "kick": {
      const e = extension(t, 0.16, 0.28, 0.2);
      return { ...base, bob: 0, lean: -16 * e, frontLeg: 14 + 84 * e, backLeg: -14 - 6 * e, frontArm: 60, backArm: 25 + 50 * e };
    }
    case "special": {
      // Windmill wind-up into an overhand release.
      const arm = t < 0.2 ? lerp(70, -135, t / 0.2) : t < 0.32 ? lerp(-135, -275, (t - 0.2) / 0.12) : lerp(-275, -290, clamp01((t - 0.32) / 0.18));
      return { ...base, bob: 0, lean: t < 0.2 ? -8 : 10, frontArm: arm, reach: 1.1, backArm: 20 };
    }
    case "hit":
      return { ...base, bob: 2, lean: -16, head: -18, frontArm: 110, backArm: 135, frontLeg: 22, backLeg: -22 };
    case "dizzy": {
      const s = Math.sin(t * 4);
      return { ...base, lean: s * 10, head: -s * 16, frontArm: 18, backArm: 8, frontLeg: 10, backLeg: -10 };
    }
    case "ko": {
      const p = clamp01(t / 0.45);
      return { ...base, bob: 0, lean: -90 * p, head: -20 * p, frontArm: 160, backArm: 120, frontLeg: 30, backLeg: 0 };
    }
    case "win":
      // Fist pump out front so the arm never covers the face.
      return { ...base, bob: -Math.abs(Math.sin(t * 6)) * 10, frontArm: 100 + Math.sin(t * 12) * 14, reach: 1.15, backArm: 150, frontLeg: 10, backLeg: -10 };
    case "fatality":
      if (f.id === "moose") {
        // Bat swing: cock it back, then uppercut through.
        const arm = t < 0.3 ? lerp(70, -150, t / 0.3) : t < 0.45 ? lerp(-150, 150, (t - 0.3) / 0.15) : 150;
        return { ...base, bob: 0, lean: t < 0.3 ? -10 : 12, frontArm: arm, backArm: arm - 20, reach: 1 };
      } else {
        const leg = t < 0.3 ? lerp(14, -45, t / 0.3) : t < 0.45 ? lerp(-45, 150, (t - 0.3) / 0.15) : 150;
        return { ...base, bob: 0, lean: t < 0.3 ? 6 : -24, frontLeg: leg, backLeg: -10, frontArm: 100, backArm: 140 };
      }
    case "launched":
      return { ...base, spin: f.spin, frontArm: 165 + Math.sin(t * 30) * 20, backArm: 140, frontLeg: 70, backLeg: -40 };
    default:
      return base;
  }
}

type Palette = {
  fur: string;
  furShade: string;
  jersey: string;
  trim: string;
  pants: string;
  socks: string;
  hand: string;
  foot: string;
};

const MOOSE: Palette = { fur: "#7a4a24", furShade: "#5b3518", jersey: "#0c2c56", trim: "#00686b", pants: "#c4ced4", socks: "#0c2c56", hand: "#4a2d17", foot: "#2b1a0e" };
const DUCK: Palette = { fur: "#f4f4ee", furShade: "#cfcfc4", jersey: "#154733", trim: "#fee123", pants: "#154733", socks: "#f39a1c", hand: "#f4f4ee", foot: "#f39a1c" };

const rot = (angle: number) => `rotate(${-angle})`;

function Arm({ x, y, angle, reach, p, back, bat }: { x: number; y: number; angle: number; reach: number; p: Palette; back?: boolean; bat?: boolean }) {
  const len = 60 * reach;
  return (
    <g transform={`translate(${x} ${y}) ${rot(angle)}`} opacity={back ? 0.82 : 1}>
      <rect x={-8} y={-6} width={16} height={len + 6} rx={8} fill={back ? p.furShade : p.fur} />
      <rect x={-10} y={-8} width={20} height={26} rx={9} fill={p.jersey} />
      {bat && <path d={`M -4 ${len - 6} L 4 ${len - 6} L 10 ${len + 92} Q 0 ${len + 102} -10 ${len + 92} Z`} fill="#c98f4c" stroke="#7a5228" strokeWidth={2} />}
      <circle cx={0} cy={len} r={11} fill={p.hand} stroke="#00000033" strokeWidth={2} />
    </g>
  );
}

function Leg({ x, angle, p, back, webbed }: { x: number; angle: number; p: Palette; back?: boolean; webbed?: boolean }) {
  return (
    <g transform={`translate(${x} -84) ${rot(angle)}`} opacity={back ? 0.82 : 1}>
      {webbed ? (
        <>
          <rect x={-6} y={0} width={12} height={80} rx={6} fill={p.socks} />
          <rect x={-13} y={-6} width={26} height={30} rx={10} fill={p.pants} />
          <path d="M -8 78 L 30 80 Q 34 86 28 90 L -10 90 Q -14 84 -8 78 Z" fill={p.foot} stroke="#b86d0c" strokeWidth={2} />
        </>
      ) : (
        <>
          <rect x={-11} y={-4} width={22} height={52} rx={10} fill={p.pants} />
          <rect x={-9} y={44} width={18} height={36} rx={7} fill={p.socks} />
          <rect x={-10} y={76} width={30} height={14} rx={6} fill={p.foot} />
        </>
      )}
    </g>
  );
}

function MooseHead() {
  return (
    <g>
      {/* back antler */}
      <path d="M -8 -205 Q -16 -228 -32 -236 L -36 -254 L -42 -238 L -50 -258 L -54 -238 L -66 -250 L -64 -230 Q -54 -219 -38 -220 Q -24 -218 -16 -202 Z" fill="#bfa978" stroke="#6d5a33" strokeWidth={2} />
      <ellipse cx={-16} cy={-207} rx={7} ry={11} transform="rotate(-35 -16 -207)" fill={MOOSE.furShade} />
      <ellipse cx={2} cy={-190} rx={25} ry={23} fill={MOOSE.fur} />
      <ellipse cx={14} cy={-160} rx={8} ry={11} fill={MOOSE.furShade} />
      <path d="M 8 -202 Q 54 -204 60 -182 Q 62 -164 42 -163 Q 18 -162 6 -174 Z" fill="#a16f42" />
      <ellipse cx={52} cy={-180} rx={4} ry={2.6} fill="#2b1a0e" />
      <path d="M 30 -168 Q 42 -165 52 -169" stroke="#2b1a0e" strokeWidth={2} fill="none" strokeLinecap="round" />
      <ellipse cx={14} cy={-197} rx={5.5} ry={6} fill="#fff" />
      <circle cx={16.5} cy={-196} r={2.8} fill="#111" />
      <path d="M 6 -208 L 23 -202" stroke="#2b1a0e" strokeWidth={4} strokeLinecap="round" />
      {/* front antler */}
      <path d="M 0 -207 Q 6 -230 22 -238 L 24 -256 L 32 -240 L 40 -260 L 45 -240 L 56 -254 L 56 -232 Q 48 -220 32 -221 Q 18 -219 10 -203 Z" fill="#e0cc9a" stroke="#6d5a33" strokeWidth={2} />
    </g>
  );
}

function DuckHead() {
  return (
    <g>
      <path d="M -22 -196 Q -36 -200 -34 -188 Q -30 -190 -24 -186 Z" fill={DUCK.fur} stroke="#bdbdb2" strokeWidth={1.5} />
      <circle cx={4} cy={-192} r={26} fill={DUCK.fur} stroke="#c9c9bd" strokeWidth={2} />
      <path d="M 16 -192 Q 50 -198 62 -188 Q 65 -179 52 -176 Q 32 -173 16 -180 Z" fill="#f6b21b" stroke="#c9850a" strokeWidth={2} />
      <path d="M 22 -183 Q 40 -182 56 -182" stroke="#c9850a" strokeWidth={2} fill="none" />
      <ellipse cx={15} cy={-201} rx={6.5} ry={8.5} fill="#fff" stroke="#bdbdb2" strokeWidth={1} />
      <circle cx={18.5} cy={-199} r={3.4} fill="#111" />
      <path d="M 6 -213 L 24 -206" stroke="#111" strokeWidth={4} strokeLinecap="round" />
      {/* sailor cap */}
      <path d="M -22 -208 Q -18 -236 6 -236 Q 30 -236 32 -210 Z" fill={DUCK.jersey} />
      <rect x={-25} y={-212} width={60} height={7} rx={3} fill={DUCK.trim} />
      <circle cx={6} cy={-238} r={5} fill={DUCK.trim} />
    </g>
  );
}

function DizzyStars({ t }: { t: number }) {
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const a = t * 4 + (i * Math.PI * 2) / 3;
        return <circle key={i} cx={4 + Math.cos(a) * 30} cy={-252 + Math.sin(a) * 8} r={5} fill="#fff500" stroke="#7a6a00" strokeWidth={1.5} />;
      })}
    </g>
  );
}

export function FighterSprite({ fighter }: { fighter: Fighter }) {
  const pose = poseFor(fighter);
  const moose = fighter.id === "moose";
  const p = moose ? MOOSE : DUCK;
  const bat = moose && fighter.action === "fatality";
  const lift = Math.min(1, fighter.y / 400);

  return (
    <g>
      <ellipse cx={fighter.x} cy={FLOOR_Y + 2} rx={52 * (1 - lift * 0.5)} ry={9 * (1 - lift * 0.5)} fill="#000" opacity={0.35} />
      <g transform={`translate(${fighter.x} ${FLOOR_Y - fighter.y}) scale(${fighter.facing} 1)`}>
        <g transform={`rotate(${pose.spin} 0 -110)`}>
          <g transform={`rotate(${pose.lean} 0 0)`}>
            <Arm x={-8} y={-150 + pose.bob} angle={pose.backArm} reach={1} p={p} back />
            <Leg x={-9} angle={pose.backLeg} p={p} back webbed={!moose} />
            <Leg x={9} angle={pose.frontLeg} p={p} webbed={!moose} />
            <g transform={`translate(0 ${pose.bob})`}>
              <path d="M -27 -160 Q 0 -170 27 -160 L 31 -82 Q 0 -74 -31 -82 Z" fill={p.jersey} />
              <path d="M -27 -160 Q 0 -170 27 -160" stroke={p.trim} strokeWidth={5} fill="none" />
              <path d="M -31 -86 Q 0 -78 31 -86" stroke={p.trim} strokeWidth={4} fill="none" />
              {moose ? (
                <text x={0} y={-108} textAnchor="middle" fontFamily="Impact, 'Arial Narrow', sans-serif" fontSize={34} fill={p.trim} stroke="#fff" strokeWidth={1.5}>M</text>
              ) : (
                <circle cx={0} cy={-120} r={14} fill="none" stroke={p.trim} strokeWidth={7} />
              )}
              <g transform={`rotate(${pose.head} 2 -168)`}>{moose ? <MooseHead /> : <DuckHead />}</g>
              {fighter.action === "dizzy" && <DizzyStars t={fighter.actionTime} />}
            </g>
            <Arm x={10} y={-150 + pose.bob} angle={pose.frontArm} reach={pose.reach} p={p} bat={bat} />
          </g>
        </g>
      </g>
    </g>
  );
}

export function ProjectileSprite({ projectile, kind }: { projectile: Projectile; kind: "moose" | "duck" }) {
  const transform = `translate(${projectile.x} ${FLOOR_Y - projectile.y}) rotate(${projectile.spin})`;
  if (kind === "moose") {
    return (
      <g transform={transform}>
        <circle r={12} fill="#fbfbf6" stroke="#bbb" strokeWidth={1.5} />
        <path d="M -6 -10 Q 0 0 -6 10 M 6 -10 Q 0 0 6 10" stroke="#d3202a" strokeWidth={1.8} fill="none" strokeDasharray="2.5 2" />
      </g>
    );
  }
  return (
    <g transform={transform}>
      <ellipse rx={18} ry={11} fill="#7b3f1d" stroke="#4d260f" strokeWidth={1.5} />
      <path d="M -7 0 H 7 M -5 -3 V 3 M -1 -3 V 3 M 3 -3 V 3" stroke="#fff" strokeWidth={1.8} />
    </g>
  );
}
