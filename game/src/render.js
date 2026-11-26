import { WIDTH, HEIGHT, MISSIONS, PASSES, clamp } from './config.js';
import { groundHeight } from './terrain.js';
import { objective } from './missions.js';

const ink = '#111b2a';
const paper = '#fff1d6';
const amber = '#ffc789';
const mint = '#8fffe1';
const menu = MISSIONS.map((_, i) => ({ x: 49, y: 318 + i * 57, w: 316, h: 49 }));
const button = { x: 50, y: 408, w: 255, h: 44 };
const shades = [
  ['#4b6771', '#536e77'], ['#566f77', '#5d777b'], ['#607c81', '#657f82'],
  ['#6e8988', '#76918e'], ['#7e9893', '#829994'], ['#8da29a', '#91a59a'],
  ['#9cab9f', '#a2aea1'], ['#aeb6a5', '#b3b9a5'],
];

export function selectionAt(point) {
  return menu.findIndex(box => inside(point, box));
}

export function actionAt(point) {
  return inside(point, button);
}

function inside(point, box) {
  return point.x >= box.x && point.x <= box.x + box.w
    && point.y >= box.y && point.y <= box.y + box.h;
}

export function createRenderer(canvas) {
  const c = canvas.getContext('2d');
  const box = (x, y, w, h, color) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  function polygon(points, fill, stroke, width = 1) {
    if (points.length < 2) return;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
  }
  function line(x, y, u, v, color, width = 1) {
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(u, v);
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  function ellipse(x, y, rx, ry, color, rotation = 0) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  }
  function label(value, x, y, color = paper, font = '600 15px monospace') {
    c.font = font;
    c.fillStyle = color;
    c.fillText(value, x, y);
  }
  function gradient(y, bottom, stops) {
    const paint = c.createLinearGradient(0, y, 0, bottom);
    stops.forEach(([position, color]) => paint.addColorStop(position, color));
    return paint;
  }

  function drawSky(valley, plane) {
    box(0, 0, WIDTH, 600, gradient(0, 440, [
      [0, '#343a64'], [.35, '#74648a'], [.68, '#e29b91'], [.86, '#ffd3a2'], [1, '#f9dda9'],
    ]));
    const sunX = 1008 - Math.sin(plane.heading) * 265;
    const light = c.createRadialGradient(sunX, 190, 16, sunX, 190, 245);
    light.addColorStop(0, '#fff4bb');
    light.addColorStop(.24, '#ffd39d88');
    light.addColorStop(1, '#ffd39d00');
    box(0, 0, WIDTH, 370, light);
    ellipse(sunX, 190, 48, 48, '#fff0ba');
    for (const cloud of valley.clouds) {
      ellipse(cloud.x, cloud.y, cloud.size, 2 + cloud.size / 27, '#ffecd22b', -.024);
      ellipse(cloud.x + 15, cloud.y + 3, cloud.size * .7, 2, '#fff7d94a');
    }
  }

  function drawRidges(valley, plane) {
    const colors = ['#ad8d9e', '#8c7f9b', '#74738f', '#5f6c85', '#4b6077'];
    valley.ridges.forEach((ridge, layer) => {
      const offset = Math.sin(plane.heading) * (78 + 46 * layer) + plane.x * layer * .028;
      const points = ridge.map(({ x, y }) => [x - offset, y + plane.pitch * 90 + layer * 3]);
      polygon([...points, [points.at(-1)[0], 561], [points[0][0], 561]], colors[layer]);
      for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i];
        const before = points[i - 1];
        const after = points[i + 1];
        if (y >= before[1] || y >= after[1]) continue;
        polygon([[x, y], [after[0], after[1]], [x + 12, 350]], '#233c5b29');
        if (layer < 2 || y > 185) continue;
        const left = [x + (before[0] - x) * .43, y + (before[1] - y) * .43];
        const right = [x + (after[0] - x) * .61, y + (after[1] - y) * .61];
        polygon([[x, y], right, [x + 11, right[1] + 8], [x + 3, right[1] + 3], left],
          layer === 4 ? '#e3c9c5' : '#d6b8bf');
      }
    });
  }

  function createCamera(plane, title) {
    const sin = Math.sin(plane.heading);
    const cos = Math.cos(plane.heading);
    const x = plane.x - sin * 98;
    const y = plane.y + 34;
    const z = plane.z - cos * 98;
    const center = title ? 740 : 640;
    const horizon = 273 + plane.pitch * 158;
    return {
      center, horizon, z,
      view(wx, wy, wz) {
        return [(wx - x) * cos - (wz - z) * sin, y - wy,
          (wx - x) * sin + (wz - z) * cos];
      },
      project([side, height, depth]) {
        return [center + side * 620 / depth, horizon + height * 620 / depth];
      },
    };
  }

  function surface(camera, points, fill, stroke) {
    const vertices = points.map(point => camera.view(...point));
    const visible = [];
    for (let i = 0; i < vertices.length; i++) {
      const from = vertices[(i + vertices.length - 1) % vertices.length];
      const to = vertices[i];
      if ((from[2] >= 12) !== (to[2] >= 12)) {
        const t = (12 - from[2]) / (to[2] - from[2]);
        visible.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, 12]);
      }
      if (to[2] >= 12) visible.push(to);
    }
    polygon(visible.map(camera.project), fill, stroke);
  }

  function drawValley(camera, plane, crossing) {
    box(0, camera.horizon, WIDTH, HEIGHT - camera.horizon, '#abb5a2');
    const far = Math.floor(plane.z / 110) * 110 + 4400;
    for (let z = far; z > plane.z - 1400; z -= 110) {
      const tone = clamp(Math.floor((z - plane.z) / 360), 0, shades.length - 1);
      for (let x = -1350; x < 1350; x += 90) {
        const w = x + 90;
        const back = z + 110;
        const color = shades[tone][Math.abs(Math.floor(x / 90) * 7 + z / 110 * 13) % 3 === 0 ? 1 : 0];
        surface(camera, [[x, groundHeight(x, z, crossing), z],
          [w, groundHeight(w, z, crossing), z],
          [w, groundHeight(w, back, crossing), back],
          [x, groundHeight(x, back, crossing), back]], color, color);
      }
      if (z > plane.z + 2400) continue;
      for (let x = -450; x <= 450; x += 75) {
        const side = x + 15 * Math.sin(z + x);
        if (Math.abs(side) < 74) continue;
        const tree = camera.view(side, groundHeight(side, z, crossing), z);
        if (tree[2] < 26) continue;
        const [u, v] = camera.project(tree);
        const size = (1700 + 600 * Math.cos(x * z)) / tree[2];
        polygon([[u - size * .4, v], [u, v - size * 1.65], [u + size * .43, v]],
          tone > 3 ? '#536b6c90' : '#293f4bcc');
      }
    }
  }

  function drawStrips(camera, strips) {
    const mark = (x, z, w, length, color, height = .35) =>
      surface(camera, [[x, height, z], [x + w, height, z],
        [x + w, height, z + length], [x, height, z + length]], color);
    for (const { start, end } of strips) {
      mark(-44, start - 8, 88, end - start + 16, '#575768', .12);
      mark(-37, start, 74, end - start, '#303748', .23);
      mark(-35, start + 5, 1.4, end - start - 10, '#f0d8ab');
      mark(33.6, start + 5, 1.4, end - start - 10, '#f0d8ab');
      for (let z = start + 110; z < end - 42; z += 88) {
        mark(-1.25, z, 2.5, 39, '#f0e3c7');
      }
      for (const z of [start + 12, end - 62]) {
        for (let x = -29; x <= 25; x += 7) mark(x, z, 3.9, 44, '#f3e0b8');
      }
      for (let z = end - 18; z >= start; z -= 52) {
        for (const x of [-40, 40]) {
          const view = camera.view(x, 1, z);
          if (view[2] < 20) continue;
          const [u, v] = camera.project(view);
          const size = clamp(790 / view[2], .7, 6);
          ellipse(u, v, size * 2.4, size * 1.6, '#ffd49839');
          ellipse(u, v, size, size * .55, '#ffe0a0');
        }
      }
    }
  }

  function drawGate(camera, gate, active, name) {
    const middle = camera.view(gate.x, gate.y, gate.z);
    if (middle[2] < 90 || middle[2] > 2200) return;
    const points = Array.from({ length: 56 }, (_, i) => {
      const theta = i * Math.PI / 28;
      return camera.project(camera.view(gate.x + Math.cos(theta) * gate.radius,
        gate.y + Math.sin(theta) * gate.radius, gate.z));
    });
    const [x, y] = camera.project(middle);
    const width = clamp(1200 / middle[2], 1.2, 4);
    const light = active ? mint : amber;
    polygon(points, active ? '#7effd918' : '#ffbe7d12', light + '38', width * 6);
    polygon(points, null, light + '77', width * 2.8);
    polygon(points, null, light, width);
    const [topX, topY] = points[14];
    line(topX, topY - 11, topX, topY, light);
    c.textAlign = 'center';
    label(name, x, y + gate.radius * 620 / middle[2] + 21, paper, '700 12px monospace');
    c.textAlign = 'left';
  }

  function drawNavigation(camera, valley, sortie) {
    if (sortie.index === 0) {
      for (let i = valley.rings.length - 1; i >= sortie.checkpoint; i--) {
        if (i <= sortie.checkpoint + 1) {
          drawGate(camera, valley.rings[i], i === sortie.checkpoint, `GATE 0${i + 1}`);
        }
      }
    }
    if (sortie.index === 1) {
      const pass = PASSES[sortie.checkpoint];
      if (pass) {
        for (const side of [-108, 108]) {
          const x = pass.x + side;
          const bottom = groundHeight(x, pass.z, true);
          const base = camera.view(x, bottom, pass.z);
          const top = camera.view(x, bottom + 68, pass.z);
          if (top[2] < 25) continue;
          const [u, v] = camera.project(top);
          line(...camera.project(base), u, v, amber, 4);
          ellipse(u, v, 10, 10, '#ffd49450');
          ellipse(u, v, 4, 4, paper);
        }
      }
    }
  }

  function drawCompass(camera, valley, sortie) {
    if (sortie.screen !== 'play') return;
    const p = sortie.plane;
    const pass = PASSES[sortie.checkpoint];
    const gate = valley.rings[sortie.checkpoint];
    const field = valley.strips[1];
    const target = sortie.index === 0 ? gate : sortie.index === 1 && pass ? pass
      : { x: 0, z: field.start };
    if (!target || p.grounded && sortie.touchdown) return;
    const [side, , depth] = camera.view(target.x, p.y, target.z);
    const angle = Math.atan2(side, depth);
    const x = 640 + clamp(angle * 295, -265, 265);
    box(345, 23, 590, 38, '#172538c9');
    line(375, 42, 905, 42, '#a5b6c390');
    for (let offset = -250; offset <= 250; offset += 25) {
      line(640 + offset, 38, 640 + offset, 46, '#c5d5d895');
    }
    line(640, 28, 640, 53, paper, 2);
    polygon([[x, 31], [x + 8, 41], [x, 52], [x - 8, 41]], mint, ink);
    const distance = Math.round(Math.hypot(target.x - p.x, target.z - p.z));
    c.textAlign = 'center';
    label(`${distance} m TO ${sortie.index === 0 ? 'GATE' : sortie.index === 1 && pass ? 'PASS' : 'RUNWAY'}`,
      640, 81, paper, '700 13px monospace');
    c.textAlign = 'left';
  }

  function drawAircraft(camera, sortie, time) {
    const p = sortie.plane;
    const x = camera.center;
    const y = camera.horizon + 179;
    if (p.grounded) ellipse(x + 16, y + 42, 117, 19, '#121b2a74', -.08);
    c.save();
    c.translate(x, y);
    c.rotate(p.bank * .94);
    c.scale(1.08, 1.08);
    if (p.gear) {
      for (const side of [-1, 1]) {
        line(side * 23, 7, side * 44, 32, '#282a36', 5);
        ellipse(side * 45, 34, 7, 11, '#202431', .18 * side);
        ellipse(side * 46, 32, 3, 5, '#78808a');
      }
      ellipse(0, 53, 4, 6, '#282d39');
    }
    ellipse(0, -37, 49, 9, '#fcebc34c', -.05);
    line(-46, -37 + Math.sin(time * 68) * 5, 46, -37 - Math.sin(time * 68) * 5, '#fff1cc9b', 2);
    polygon([[-136, -1], [-127, -13], [-29, -27], [26, -26], [129, -13],
      [140, -3], [125, 8], [30, 7], [-28, 8], [-121, 12]], '#a55554', ink, 2);
    polygon([[-136, -1], [-127, -13], [-29, -27], [26, -26], [129, -13],
      [140, -3], [39, -1], [-36, 0], [-121, 7]], '#ffb575');
    polygon([[-113, -15], [-93, -18], [-84, 4], [-106, 7]], '#fce8bf');
    polygon([[113, -15], [93, -18], [84, 3], [106, 5]], '#fce8bf');
    line(-122, -3, -28, -13, '#763f4a91');
    line(122, -3, 28, -13, '#763f4a91');
    ellipse(-133, 2, 4, 3, '#ff7976');
    ellipse(136, -1, 4, 3, mint);
    polygon([[-18, -36], [-10, -45], [9, -45], [19, -35], [23, -12], [18, 12],
      [7, 53], [-7, 54], [-19, 12], [-23, -12]], '#e39067', ink, 2);
    polygon([[-10, -43], [9, -43], [15, -35], [18, -22], [-17, -22], [-15, -33]], '#24384b');
    polygon([[-11, -40], [7, -40], [13, -33], [-13, -28]], '#93b3ba');
    line(0, -41, 1, -22, '#314354', 2);
    polygon([[-16, -13], [17, -13], [11, 16], [6, 48], [-3, 40]], '#ffd599');
    polygon([[-48, 38], [-37, 29], [-9, 26], [9, 26], [37, 29], [51, 38],
      [31, 44], [0, 42], [-32, 44]], '#f8ad74', '#472e3d', 2);
    polygon([[-5, 48], [-6, 9], [7, 17], [10, 40], [5, 49]], '#f5d09b', '#5b3a45', 2);
    ellipse(0, 49, 4, 2, '#fff6cf');
    c.restore();
  }

  function horizonInstrument(p, x, y) {
    ellipse(x, y, 47, 47, '#1e2b3d');
    c.save();
    c.beginPath();
    c.arc(x, y, 39, 0, Math.PI * 2);
    c.clip();
    c.translate(x, y);
    c.rotate(-p.bank);
    box(-61, -61, 122, 122, '#305575');
    box(-61, p.pitch * 66, 122, 65, '#875b50');
    line(-50, p.pitch * 66, 50, p.pitch * 66, paper, 2);
    for (const offset of [-23, -12, 12, 23]) {
      line(-9, offset + p.pitch * 66, 9, offset + p.pitch * 66, '#fff1d6ad');
    }
    c.restore();
    line(x - 25, y, x - 9, y, amber, 3);
    line(x + 9, y, x + 25, y, amber, 3);
    ellipse(x, y, 3.5, 3.5, amber);
  }

  function drawInstruments(sortie, muted) {
    const p = sortie.plane;
    box(0, 565, WIDTH, 155, gradient(565, 720, [[0, '#182433'], [1, '#101723']]));
    box(0, 565, WIDTH, 2, '#eed5a97f');
    box(0, 567, WIDTH, 29, '#253547');
    label(MISSIONS[sortie.index].name.toUpperCase(), 31, 586, amber);
    label(objective(sortie), 246, 586, paper);
    const remaining = Math.max(0, Math.ceil(MISSIONS[sortie.index].time - sortie.elapsed));
    const clock = `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
    label(`TIME ${clock}   PTS ${String(sortie.score).padStart(4, '0')}`, 1033, 586, mint);
    const heading = ((Math.round(p.heading * 180 / Math.PI) % 360) + 360) % 360;
    const readings = [
      ['ALT', Math.round(p.y * 3.281), 'ft'], ['SPD', Math.round(p.speed * 1.944), 'kt'],
      ['HDG', String(heading).padStart(3, '0'), '°'], ['THR', Math.round(p.throttle * 100), '%'],
    ];
    readings.forEach(([name, value, unit], i) => {
      const x = 31 + i * 150;
      box(x, 607, 139, 78, '#0b1421');
      box(x, 607, 139, 1, '#31475a');
      label(name, x + 13, 627, '#9cb2c0', '700 13px monospace');
      label(value, x + 12, 667, mint, '700 32px monospace');
      label(unit, x + 104, 666, '#abc4c8', '700 14px monospace');
    });
    horizonInstrument(p, 687, 646);
    label('ATTITUDE', 651, 708, '#9cb2c0', '700 12px monospace');
    const gauges = [['FUEL', p.fuel], ['AIRFRAME', 100 - p.damage]];
    gauges.forEach(([name, value], i) => {
      const y = 626 + i * 36;
      label(name, 756, y, '#9cb2c0', '700 13px monospace');
      label(`${Math.max(0, Math.round(value))}%`, 903, y, value < 25 ? amber : mint);
      for (let tick = 0; tick < 18; tick++) {
        box(755 + tick * 11, y + 6, 8, 7, value >= (tick + .5) * 100 / 18
          ? (value < 25 ? amber : mint) : '#2c3d4e');
      }
    });
    line(973, 608, 973, 693, '#354656');
    label(p.gear ? '● GEAR DOWN' : '○ GEAR UP', 996, 626, p.gear ? mint : '#a7b8c8');
    label(!p.grounded && p.speed < 28 ? '▲ STALL · LOWER NOSE' : p.grounded ? '● GROUND CONTACT' : '● IN FLIGHT',
      996, 652, !p.grounded && p.speed < 28 ? amber : paper);
    label(`P Pause  •  M Sound ${muted ? 'off' : 'on'}`, 996, 678, '#a7b8c8', '600 13px monospace');
    label('W/S  POWER      ↑/↓  PITCH      ←/→  BANK      G  GEAR      SPACE  BRAKE',
      32, 708, '#8d9fae', '600 12px monospace');
  }

  function drawOverlay(sortie, pointer) {
    if (sortie.screen === 'play') return;
    box(0, 0, 575, 565, (() => {
      const shade = c.createLinearGradient(0, 0, 575, 0);
      shade.addColorStop(0, '#101929f5');
      shade.addColorStop(.66, '#141d2bb9');
      shade.addColorStop(1, '#141d2b00');
      return shade;
    })());
    line(50, 57, 101, 57, amber, 2);
    label('NORTH VALLEY  /  COURIER SERVICE', 116, 62, amber, '700 13px monospace');
    if (sortie.screen === 'title') {
      label('Aurora Ridge', 45, 150, paper, '64px Georgia');
      label('Courier', 46, 226, paper, 'italic 79px Georgia');
      label('Choose a sortie', 51, 293, amber, '700 16px monospace');
      menu.forEach((b, i) => {
        const active = selectionAt(pointer) === i;
        box(b.x, b.y, b.w, b.h, active ? '#435960' : '#202d40e8');
        box(b.x, b.y, 3, b.h, active ? mint : '#9b827b');
        label(String(i + 1), b.x + 15, b.y + 30, amber, '700 19px monospace');
        label(MISSIONS[i].name, b.x + 48, b.y + 20, paper, '700 17px system-ui');
        label(MISSIONS[i].detail, b.x + 48, b.y + 39, '#c1c8cf', '12px monospace');
      });
      return;
    }
    const paused = sortie.screen === 'paused';
    const title = paused ? 'On hold' : sortie.result;
    label(title, 47, 199, paper, '46px Georgia');
    label(MISSIONS[sortie.index].name.toUpperCase(), 51, 248, amber);
    if (!paused) {
      label('SORTIE SCORE', 51, 294, '#c5c8ce');
      label(String(sortie.score).padStart(4, '0'), 47, 363, mint, '700 64px monospace');
    }
    box(button.x, button.y, button.w, button.h, actionAt(pointer) ? '#435960' : '#26374b');
    box(button.x, button.y, 3, button.h, mint);
    label(paused ? 'P   Resume flight' : 'R   Fly again', 65, 436, paper);
    if (!paused) label('1 / 2 / 3  Change sortie', 52, 484, '#d2d7db');
  }

  return function render(valley, sortie, pointer, time, muted) {
    const p = sortie.plane;
    const camera = createCamera(p, sortie.screen === 'title');
    c.save();
    c.beginPath();
    c.rect(0, 0, WIDTH, 565);
    c.clip();
    drawSky(valley, p);
    drawRidges(valley, p);
    drawValley(camera, p, sortie.index === 1);
    drawStrips(camera, valley.strips);
    drawNavigation(camera, valley, sortie);
    drawAircraft(camera, sortie, time);
    drawCompass(camera, valley, sortie);
    c.restore();
    drawOverlay(sortie, pointer);
    drawInstruments(sortie, muted);
  };
}
