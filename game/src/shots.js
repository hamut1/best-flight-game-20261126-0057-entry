import { createSortie, finishSortie } from './missions.js';

export function stageShot(name, valley) {
  if (name === 'start') return createSortie(0, 'title');
  if (name === 'play') {
    const sortie = createSortie(0);
    const gate = valley.rings[2];
    sortie.checkpoint = 2;
    sortie.elapsed = 30.8;
    sortie.score = 500;
    Object.assign(sortie.plane, {
      x: gate.x - 90, y: 146, z: gate.z - 410, heading: .13, pitch: .035,
      bank: -.1, speed: 51, vertical: 1, throttle: .68, fuel: 74, gear: false, grounded: false,
    });
    return sortie;
  }
  if (name === 'landing') return createSortie(2);
  if (name === 'end') {
    const sortie = createSortie(2);
    sortie.elapsed = 27.4;
    sortie.softness = .93;
    sortie.touchdown = true;
    Object.assign(sortie.plane, {
      x: 9, y: 0, z: 6360, pitch: 0, heading: 0, speed: 0, vertical: 0,
      throttle: 0, fuel: 38, gear: true, grounded: true,
    });
    finishSortie(sortie, 'Mission complete');
    return sortie;
  }
  return null;
}
