export function createAudio() {
  let audio, output, engine, engineVolume;
  let muted = false;

  function open() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      if (!audio) {
        audio = new Context();
        output = audio.createGain();
        output.gain.value = muted ? 0 : .45;
        output.connect(audio.destination);
        engine = audio.createOscillator();
        engine.type = 'triangle';
        engineVolume = audio.createGain();
        engineVolume.gain.value = 0;
        engine.connect(engineVolume).connect(output);
        engine.start();
      }
      audio.resume().catch(() => {});
    } catch {
      audio = output = engine = engineVolume = undefined;
    }
  }

  function tone(start, finish, duration, amount, delay = 0) {
    if (!output) return;
    const voice = audio.createOscillator();
    const volume = audio.createGain();
    const at = audio.currentTime + delay;
    voice.frequency.setValueAtTime(start, at);
    voice.frequency.exponentialRampToValueAtTime(finish, at + duration);
    volume.gain.setValueAtTime(amount, at);
    volume.gain.exponentialRampToValueAtTime(.001, at + duration);
    voice.connect(volume).connect(output);
    voice.start(at);
    voice.stop(at + duration);
  }

  return {
    open,
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      if (output) output.gain.setTargetAtTime(muted ? 0 : .45, audio.currentTime, .06);
    },
    motor(plane, active) {
      if (!engineVolume) return;
      const power = active && plane.fuel > 0 ? plane.throttle : 0;
      engine.frequency.setTargetAtTime(34 + power * 64, audio.currentTime, .08);
      engineVolume.gain.setTargetAtTime(active ? power * .13 : 0, audio.currentTime, .12);
    },
    ring(index) {
      tone(420 + index * 28, 480 + index * 28, .34, .21);
      tone(690 + index * 35, 760 + index * 35, .44, .17, .075);
    },
    land(softness) { tone(100, 28, .3, .23 + (1 - softness) * .23); },
  };
}
