import { WIDTH, HEIGHT } from './config.js';

const flightKeys = new Set([
  'KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD', 'Space',
]);

export function connectInput(canvas, command, gesture) {
  const held = new Set();
  const pointer = { x: -1, y: -1 };
  let gear = false;
  function locate(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) * WIDTH / rect.width;
    pointer.y = (event.clientY - rect.top) * HEIGHT / rect.height;
  }
  window.addEventListener('keydown', event => {
    if (flightKeys.has(event.code)) event.preventDefault();
    held.add(event.code);
    if (event.repeat) return;
    gesture();
    if (event.code === 'KeyG') gear = true;
    command(event.code);
  });
  window.addEventListener('keyup', event => held.delete(event.code));
  window.addEventListener('blur', () => { held.clear(); gear = false; });
  canvas.addEventListener('pointermove', locate);
  canvas.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1; });
  canvas.addEventListener('pointerdown', event => {
    locate(event);
    canvas.focus();
    gesture();
    command('click', pointer);
  });
  return {
    pointer,
    read() {
      const input = {
        throttle: Number(held.has('KeyW')) - Number(held.has('KeyS')),
        pitch: Number(held.has('ArrowDown')) - Number(held.has('ArrowUp')),
        bank: Number(held.has('ArrowRight') || held.has('KeyD'))
          - Number(held.has('ArrowLeft') || held.has('KeyA')),
        brake: held.has('Space'),
        gear,
      };
      gear = false;
      return input;
    },
  };
}
