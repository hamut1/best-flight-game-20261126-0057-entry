[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/hamut1/best-flight-game-20261126-0057-entry/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/hamut1/best-flight-game-20261126-0057-entry/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

# Aurora Ridge Courier

Fly a prop courier through a mountain valley at dawn. Watch your airspeed in turns, budget fuel, and aim for a soft touchdown.

- **Ring Run** — Take off and fly through eight gates in order before time expires.
- **Ridge Crossing** — Thread three marked mountain passes and stop on the runway at North Field.
- **Runway Landing** — Start on final approach. Line up, flare, touch down below 84 kt, and brake to a stop.

Choose with **1**, **2**, **3**, or the mouse. **W/S** changes throttle. **↓** pulls the nose up and **↑** lowers it. Bank or steer with **←/→** or **A/D**. **G** toggles landing gear in flight. Hold **Space** to brake on the ground. **P** pauses, **M** toggles sound, and **R** restarts the sortie.

For takeoff, raise power and pull gently at 57 kt. Release the pitch key as you approach the altitude you want. On final, pull briefly just above the strip to soften the touchdown.

Run with Node.js 22.18 or later.

```sh
node serve.ts
```

Open http://localhost:8080 in a desktop browser.

To build the competition dossier locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
