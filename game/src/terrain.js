import { PASSES, STRIPS } from './config.js';

export function createValley(seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const rings = [0, 95, 225, 90, -130, -225, -75, 100].map((x, index) => ({
    x: x + (random() - .5) * 22,
    y: 108 + Math.sin(index * .92) * 30,
    z: 870 + index * 520,
    radius: 56,
  }));
  const ridges = Array.from({ length: 5 }, (_, layer) =>
    Array.from({ length: 32 }, (_, index) => {
      const x = index * 53 - 180;
      const valley = 1 - .84 * Math.exp(-(((x - 735) / (90 + layer * 20)) ** 2));
      return { x, y: 294 - valley * (34 + layer * 31 + random() * (26 + layer * 10)) };
    }));
  const clouds = Array.from({ length: 21 }, () => ({
    x: random() * 1280, y: 54 + random() * 200, size: 25 + random() * 122,
  }));
  return { rings, ridges, clouds, strips: STRIPS };
}

export function stripAt(x, z) {
  return Math.abs(x) <= 37 && STRIPS.some(strip => z >= strip.start && z <= strip.end);
}

export function groundHeight(x, z, crossing) {
  if (stripAt(x, z)) return 0;
  const walls = Math.pow(Math.max(0, Math.abs(x) - 265) / 6, 1.28);
  const ripple = (1 + Math.cos(z * .019 + x * .012)) * 3;
  let height = walls + ripple;
  if (crossing) {
    for (const pass of PASSES) {
      const weight = Math.max(0, 1 - Math.abs(z - pass.z) / 185);
      const shoulder = Math.min(1, Math.abs(x - pass.x) / 240);
      height = Math.max(height, weight * (28 + 205 * shoulder));
    }
  }
  return height;
}
