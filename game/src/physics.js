import { clamp } from './config.js';
import { groundHeight, stripAt } from './terrain.js';

export function makePlane(mission) {
  if (mission === 2) {
    return { x: -10, y: 37, z: 5540, heading: .02, pitch: -.045, bank: 0,
      speed: 35, vertical: -3, throttle: .14, fuel: 46, damage: 0, grounded: false, gear: true };
  }
  return { x: 0, y: 0, z: 80, heading: 0, pitch: 0, bank: 0, speed: 0,
    vertical: 0, throttle: .55, fuel: 100, damage: 0, grounded: true, gear: true };
}

export function advanceFlight(plane, input, dt, crossing) {
  plane.throttle = clamp(plane.throttle + input.throttle * dt * .66, 0, 1);
  plane.fuel = Math.max(0, plane.fuel - dt * (.1 + plane.throttle * .91));
  const power = plane.fuel > 0 ? plane.throttle : 0;
  const groundDrag = plane.grounded ? 1.4 + (input.brake ? 9 : 0) : 0;
  plane.speed = clamp(plane.speed + (power * 14 - .0026 * plane.speed ** 2
    - plane.pitch * 9 - groundDrag) * dt, 0, 76);
  const bank = plane.grounded ? 0 : input.bank * .68;
  plane.bank += (bank - plane.bank) * Math.min(1, dt * 3.8);
  const pitch = input.pitch * .24 - .025;
  plane.pitch += (pitch - plane.pitch) * Math.min(1, dt * 4);
  const authority = clamp(plane.speed / 35, 0, 1);
  plane.heading += (plane.grounded ? input.bank * .29 : plane.bank * .58) * authority * dt;
  plane.x += Math.sin(plane.heading) * plane.speed * dt;
  plane.z += Math.cos(plane.heading) * plane.speed * dt;
  const height = groundHeight(plane.x, plane.z, crossing);
  const runway = stripAt(plane.x, plane.z);
  const stall = clamp((28 - plane.speed) / 15, 0, 1);
  if (plane.grounded) {
    plane.y = height;
    if (plane.speed > 29 && plane.pitch > .065) {
      plane.grounded = false;
      plane.y += .25;
    } else if (!runway && plane.speed > 3) {
      plane.damage += dt * (8 + plane.speed * 1.8);
    }
    return null;
  }
  const sink = plane.fuel > 0 ? 1.45 : 3.4;
  const climb = plane.speed * Math.sin(plane.pitch) * (1 - stall) - sink - stall * 12
    - Math.abs(plane.bank) * 1.3;
  plane.vertical += (climb - plane.vertical) * Math.min(1, dt * 2.5);
  plane.y += plane.vertical * dt;
  if (plane.y > height) return null;

  const aligned = Math.abs(Math.sin(plane.heading)) < .22;
  const softness = clamp(1 - Math.abs(plane.vertical) / 6, 0, 1);
  const safe = runway && aligned && plane.gear && plane.speed <= 43 && softness > .12;
  plane.damage += safe ? (1 - softness) * 8 : runway && softness > 0 ? 62 : 100;
  plane.y = height;
  plane.vertical = 0;
  plane.grounded = true;
  plane.speed *= safe ? .9 : .55;
  return { softness, safe };
}
