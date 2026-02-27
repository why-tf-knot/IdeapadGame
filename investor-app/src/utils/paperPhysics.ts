/**
 * Paper Toss Physics Engine
 * 
 * Real physics simulation for paper card tossing:
 * - Newtonian gravity with configurable acceleration
 * - Air resistance (quadratic drag model)
 * - Angular momentum & damping
 * - Paper flutter (lift + turbulence)
 * - Crumple morphing based on flight progress
 * - Velocity tracking from touch history
 */

// ─── Physics Constants ──────────────────────────────────

export const PHYSICS = {
  // Gravity
  GRAVITY: 1800,              // px/s² — Earth-like downward pull
  GRAVITY_SAVE: 400,          // px/s² — lighter gravity for save arc (paper floats)

  // Air resistance (drag)
  AIR_DRAG: 1.8,              // linear drag coefficient 
  AIR_DRAG_ANGULAR: 4.0,      // angular drag coefficient
  TURBULENCE_STRENGTH: 120,   // px/s² random lateral force (paper wobble)
  TURBULENCE_FREQ: 6.0,       // Hz — how fast turbulence oscillates

  // Paper flutter (idle)
  FLUTTER_AMP_ROT: 1.2,       // degrees of idle rotation flutter
  FLUTTER_AMP_Y: 2.5,         // px of idle vertical bob
  FLUTTER_FREQ_ROT: 0.9,      // Hz rotation
  FLUTTER_FREQ_Y: 0.65,       // Hz vertical bob

  // Crumple
  CRUMPLE_MIN_SCALE: 0.22,    // smallest the paper crumples to
  CRUMPLE_SPEED: 2.5,         // how fast it crumples (multiplier on progress)

  // Drag interaction
  DRAG_SMOOTHING: 0.35,       // lerp factor — lower = smoother/laggier
  DRAG_TILT_FACTOR: 0.06,     // degrees per px/s of velocity → tilt during drag
  DRAG_MAX_TILT: 25,          // max tilt degrees during drag

  // Velocity tracking
  VELOCITY_BUFFER_SIZE: 8,    // number of touch samples
  VELOCITY_MIN_SAMPLES: 3,    // minimum samples needed for reliable velocity
  VELOCITY_MAX_AGE_MS: 150,   // discard samples older than this

  // Throw thresholds
  REJECT_MIN_DY: 100,         // minimum downward drag distance to reject
  REJECT_MIN_SPEED: 500,      // px/s — minimum downward velocity
  SAVE_MIN_DX: 120,           // minimum rightward drag distance to save
  SAVE_MIN_SPEED: 400,        // px/s — minimum rightward velocity
  SAVE_FAST_DX: 80,           // reduced distance if velocity is high
  SAVE_FAST_SPEED: 800,       // px/s — high velocity threshold

  // Terminal conditions
  OFFSCREEN_MARGIN: 200,      // px past screen edge = done

  // Spring snap-back  
  SPRING_DAMPING: 14,         // Reanimated spring damping
  SPRING_STIFFNESS: 180,      // Reanimated spring stiffness
  SPRING_MASS: 0.8,           // Reanimated spring mass
} as const;

// ─── Velocity Tracker ───────────────────────────────────

export interface VelocitySample {
  x: number;
  y: number;
  t: number; // timestamp in ms
}

/**
 * Compute release velocity from a buffer of touch samples.
 * Uses weighted linear regression over recent samples for smoothness.
 * Returns velocity in px/s.
 */
export function computeVelocity(
  samples: VelocitySample[],
  now: number,
): { vx: number; vy: number; speed: number } {
  'worklet';

  // Filter to recent samples only
  const maxAge = PHYSICS.VELOCITY_MAX_AGE_MS;
  const recent: VelocitySample[] = [];
  for (let i = 0; i < samples.length; i++) {
    if (now - samples[i].t <= maxAge) {
      recent.push(samples[i]);
    }
  }

  if (recent.length < 2) {
    return { vx: 0, vy: 0, speed: 0 };
  }

  // Weighted velocity: more recent samples get higher weight
  let totalVx = 0;
  let totalVy = 0;
  let totalWeight = 0;

  for (let i = 1; i < recent.length; i++) {
    const dt = (recent[i].t - recent[i - 1].t) / 1000; // seconds
    if (dt <= 0) continue;

    const dx = recent[i].x - recent[i - 1].x;
    const dy = recent[i].y - recent[i - 1].y;

    // Weight: newer = heavier (linear ramp)
    const age = now - recent[i].t;
    const weight = 1 - age / maxAge;

    totalVx += (dx / dt) * weight;
    totalVy += (dy / dt) * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
    return { vx: 0, vy: 0, speed: 0 };
  }

  const vx = totalVx / totalWeight;
  const vy = totalVy / totalWeight;
  const speed = Math.sqrt(vx * vx + vy * vy);

  return { vx, vy, speed };
}

// ─── Physics Step ───────────────────────────────────────

export interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;      // radians
  angularVel: number;     // radians/s
  scale: number;
  opacity: number;
  time: number;           // total elapsed seconds
}

/**
 * Step the reject-toss physics forward by dt seconds.
 * Simulates: gravity, air drag, turbulence, angular momentum, crumple.
 */
export function stepRejectPhysics(
  state: PhysicsState,
  dt: number,
  screenHeight: number,
): PhysicsState {
  'worklet';

  const t = state.time + dt;

  // Gravity
  let vy = state.vy + PHYSICS.GRAVITY * dt;

  // Air resistance (linear drag model — simpler and more stable than quadratic)
  let vx = state.vx * Math.max(0, 1 - PHYSICS.AIR_DRAG * dt);
  vy = vy * Math.max(0, 1 - PHYSICS.AIR_DRAG * 0.3 * dt); // less drag vertically (gravity dominates)

  // Turbulence — paper wobbles sideways
  const turbulence = Math.sin(t * PHYSICS.TURBULENCE_FREQ * 2 * Math.PI) * PHYSICS.TURBULENCE_STRENGTH;
  vx += turbulence * dt;

  // Position
  const x = state.x + vx * dt;
  const y = state.y + vy * dt;

  // Angular momentum
  // Initial angular velocity comes from release, plus turbulence-driven wobble
  let angularVel = state.angularVel;
  angularVel += Math.sin(t * 4.5) * 2.0 * dt; // flutter wobble
  angularVel *= Math.max(0, 1 - PHYSICS.AIR_DRAG_ANGULAR * dt);
  const rotation = state.rotation + angularVel * dt;

  // Crumple: scale shrinks as paper falls, accelerating
  const fallProgress = Math.min(1, Math.max(0, (y - 0) / screenHeight));
  const crumpleProgress = Math.pow(fallProgress, 0.7) * PHYSICS.CRUMPLE_SPEED;
  const scale = Math.max(
    PHYSICS.CRUMPLE_MIN_SCALE,
    1 - crumpleProgress * (1 - PHYSICS.CRUMPLE_MIN_SCALE),
  );

  // Opacity: fade out in the last 30% of fall
  const fadeStart = 0.6;
  const opacity = fallProgress > fadeStart
    ? Math.max(0, 1 - (fallProgress - fadeStart) / (1 - fadeStart))
    : 1;

  return { x, y, vx, vy, rotation, angularVel, scale, opacity, time: t };
}

/**
 * Step the save-toss physics forward by dt seconds.
 * Simulates: lighter gravity (paper arc), air drag, spin, perspective shrink.
 */
export function stepSavePhysics(
  state: PhysicsState,
  dt: number,
  screenWidth: number,
): PhysicsState {
  'worklet';

  const t = state.time + dt;

  // Lighter gravity — paper floats more on horizontal toss
  let vy = state.vy + PHYSICS.GRAVITY_SAVE * dt;

  // Air resistance
  let vx = state.vx * Math.max(0, 1 - PHYSICS.AIR_DRAG * 0.5 * dt);
  vy = vy * Math.max(0, 1 - PHYSICS.AIR_DRAG * 0.4 * dt);

  // Slight lift effect (paper gets air under it)
  const liftPhase = Math.max(0, 1 - t * 2); // strong in first 0.5s
  vy -= 200 * liftPhase * dt;

  // Position
  const x = state.x + vx * dt;
  const y = state.y + vy * dt;

  // Angular momentum — paper flips as it flies right  
  let angularVel = state.angularVel;
  angularVel += Math.sin(t * 3.0) * 1.5 * dt; // gentle wobble
  angularVel *= Math.max(0, 1 - PHYSICS.AIR_DRAG_ANGULAR * 0.5 * dt);
  const rotation = state.rotation + angularVel * dt;

  // Perspective shrink: card gets smaller as it "moves away"
  const flyProgress = Math.min(1, Math.max(0, x / screenWidth));
  const scale = Math.max(0.4, 1 - flyProgress * 0.55);

  // Opacity: fade in last portion
  const fadeStart = 0.5;
  const opacity = flyProgress > fadeStart
    ? Math.max(0, 1 - (flyProgress - fadeStart) / (1 - fadeStart))
    : 1;

  return { x, y, vx, vy, rotation, angularVel, scale, opacity, time: t };
}

// ─── Helpers ────────────────────────────────────────────

/** Degrees to radians */
export function deg2rad(deg: number): number {
  'worklet';
  return deg * (Math.PI / 180);
}

/** Radians to degrees */
export function rad2deg(rad: number): number {
  'worklet';
  return rad * (180 / Math.PI);
}

/** Clamp a value between min and max */
export function clamp(val: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, val));
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

/** Compute idle flutter rotation in degrees */
export function flutterRotation(elapsedSec: number): number {
  'worklet';
  return (
    Math.sin(elapsedSec * PHYSICS.FLUTTER_FREQ_ROT * 2 * Math.PI) * PHYSICS.FLUTTER_AMP_ROT +
    Math.sin(elapsedSec * 1.37 * 2 * Math.PI) * PHYSICS.FLUTTER_AMP_ROT * 0.4
  );
}

/** Compute idle flutter Y offset in px */
export function flutterY(elapsedSec: number): number {
  'worklet';
  return Math.sin(elapsedSec * PHYSICS.FLUTTER_FREQ_Y * 2 * Math.PI) * PHYSICS.FLUTTER_AMP_Y;
}
