import { MISSIONS, PASSES } from './config.js';
import { advanceFlight, makePlane } from './physics.js';
import { stripAt } from './terrain.js';

export function createSortie(index, screen = 'play') {
  return { index, screen, plane: makePlane(index), elapsed: 0, checkpoint: 0,
    score: 0, softness: 0, touchdown: false, result: '', status: '' };
}

export function finishSortie(sortie, result) {
  sortie.screen = 'end';
  sortie.result = result;
  if (result === 'Mission complete') {
    const time = Math.max(0, MISSIONS[sortie.index].time - sortie.elapsed);
    sortie.score += 500 + Math.floor(time * 9 + sortie.softness * 500);
  }
}

export function updateSortie(sortie, valley, input, dt, sound) {
  const plane = sortie.plane;
  const previousZ = plane.z;
  sortie.elapsed += dt;
  if (input.gear && !plane.grounded) plane.gear = !plane.gear;
  const contact = advanceFlight(plane, input, dt, sortie.index === 1);
  if (contact) {
    sound.land(contact.softness);
    sortie.touchdown = contact.safe;
    sortie.softness = contact.softness;
    if (!contact.safe) sortie.status = 'Hard touchdown • Check airframe';
  }
  if (!plane.grounded) sortie.touchdown = false;
  if (plane.damage >= 100) {
    finishSortie(sortie, plane.fuel <= 0 ? 'Out of fuel' : 'Aircraft lost');
    return;
  }
  if (sortie.elapsed >= MISSIONS[sortie.index].time && plane.fuel > 0) {
    finishSortie(sortie, 'Time expired');
    return;
  }
  if (sortie.index === 0) {
    const ring = valley.rings[sortie.checkpoint];
    if (previousZ < ring.z && plane.z >= ring.z) {
      if (Math.hypot(plane.x - ring.x, plane.y - ring.y) <= ring.radius) {
        sortie.checkpoint++;
        sortie.score += 250;
        sortie.status = '';
        sound.ring(sortie.checkpoint);
        if (sortie.checkpoint === valley.rings.length) finishSortie(sortie, 'Mission complete');
      } else {
        sortie.status = 'Gate missed • Turn back and re-enter from the south';
      }
    }
  }
  if (sortie.index === 1) {
    const pass = PASSES[sortie.checkpoint];
    if (pass && previousZ < pass.z && plane.z >= pass.z) {
      if (Math.abs(plane.x - pass.x) < 112 && plane.y > 35 && plane.y < 255) {
        sortie.checkpoint++;
        sortie.score += 400;
        sortie.status = '';
        sound.ring(sortie.checkpoint);
      } else {
        sortie.status = 'Pass missed • Re-enter between the beacons';
      }
    }
  }
  if (plane.grounded && plane.speed < 2 && sortie.touchdown) {
    const northField = plane.z >= valley.strips[1].start && stripAt(plane.x, plane.z);
    if (northField && (sortie.index === 2 || sortie.index === 1 && sortie.checkpoint === PASSES.length)) {
      finishSortie(sortie, 'Mission complete');
    } else if (plane.fuel <= 0) {
      finishSortie(sortie, 'Out of fuel');
    }
  } else if (plane.fuel <= 0 && plane.grounded && plane.speed < 2) {
    finishSortie(sortie, 'Out of fuel');
  }
}

export function objective(sortie) {
  const { plane, index, checkpoint, status } = sortie;
  if (plane.fuel <= 0) return `Fuel exhausted • Glide toward ${plane.z < 3330 ? 'South Strip' : 'North Field'}`;
  if (sortie.screen === 'end') return sortie.result;
  if (status) return status;
  if (sortie.touchdown && index !== 0) return 'Hold Space to brake • Stay on the centerline';
  if (plane.grounded) return 'W for power • Pull with ↓ at 57 kt';
  if (index === 0) return `Gate ${Math.min(8, checkpoint + 1)} of 8 • Fly through the lit ring`;
  if (index === 1 && checkpoint < PASSES.length) return `Pass ${checkpoint + 1} of 3 • Thread the beacons`;
  return 'North Field • Gear down • Flare below 84 kt';
}
