export const WIDTH = 1280;
export const HEIGHT = 720;
export const SEED = 1;
export const STEP = 1 / 60;
export const STRIPS = [{ start: -420, end: 760 }, { start: 5900, end: 7100 }];
export const PASSES = [
  { z: 1800, x: 170 },
  { z: 3200, x: -200 },
  { z: 4650, x: 125 },
];
export const MISSIONS = [
  { name: 'Ring Run', detail: 'Eight gates • Beat the clock', time: 100 },
  { name: 'Ridge Crossing', detail: 'Three passes • Reach North Field', time: 185 },
  { name: 'Runway Landing', detail: 'Final approach • Flare and stop', time: 100 },
];
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
