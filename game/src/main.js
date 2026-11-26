import { SEED, STEP } from './config.js';
import { createValley } from './terrain.js';
import { createSortie, updateSortie } from './missions.js';
import { createRenderer, selectionAt, actionAt } from './render.js';
import { createAudio } from './audio.js';
import { connectInput } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const valley = createValley(Number(params.get('seed') ?? SEED));
const canvas = document.querySelector('#flight');
const render = createRenderer(canvas);
const audio = createAudio();
const staged = stageShot(params.get('shot'), valley);
let sortie = staged ?? createSortie(0, 'title');
let accumulator = 0;
let previous = performance.now();

function command(key, point) {
  if (key === 'KeyM') audio.toggle();
  if (sortie.screen === 'title' || sortie.screen === 'end') {
    const choice = ['Digit1', 'Digit2', 'Digit3'].indexOf(key);
    if (choice >= 0) sortie = createSortie(choice);
    else if (key === 'click' && sortie.screen === 'title') {
      const index = selectionAt(point);
      if (index >= 0) sortie = createSortie(index);
    } else if (key === 'click' && actionAt(point) || key === 'KeyR' && sortie.screen === 'end') {
      sortie = createSortie(sortie.index);
    }
    return;
  }
  if (key === 'KeyR') sortie = createSortie(sortie.index);
  if (key === 'KeyP' || (key === 'click' && sortie.screen === 'paused' && actionAt(point))) {
    sortie.screen = sortie.screen === 'play' ? 'paused' : 'play';
    accumulator = 0;
  }
}

if (staged) {
  render(valley, staged, { x: -1, y: -1 }, 1.25, false);
  window.__shotReady = true;
} else {
  const input = connectInput(canvas, command, audio.open);
  function frame(now) {
    if (sortie.screen === 'play') {
      accumulator += Math.min(.1, (now - previous) / 1000);
      while (accumulator >= STEP && sortie.screen === 'play') {
        updateSortie(sortie, valley, input.read(), STEP, audio);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    previous = now;
    audio.motor(sortie.plane, sortie.screen === 'play');
    render(valley, sortie, input.pointer, sortie.elapsed, audio.muted);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
