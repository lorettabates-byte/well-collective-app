// Procedurally generated ambient "peaceful sounds" using the Web Audio API —
// no audio files needed, loops forever, and is generated fresh in-browser.

export type AmbientSoundId =
  | "rain"
  | "thunderstorm"
  | "ocean"
  | "white-noise"
  | "pink-noise"
  | "brown-noise"
  | "wind"
  | "singing-bowl"
  | "wind-chimes"
  | "crickets";

export const AMBIENT_SOUNDS: { id: AmbientSoundId; label: string; emoji: string }[] = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "thunderstorm", label: "Thunderstorm", emoji: "⛈️" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊" },
  { id: "wind-chimes", label: "Wind Chimes", emoji: "🎐" },
  { id: "wind", label: "Wind", emoji: "🍃" },
  { id: "singing-bowl", label: "Singing Bowl", emoji: "🔔" },
  { id: "crickets", label: "Night Crickets", emoji: "🦗" },
  { id: "white-noise", label: "White Noise", emoji: "⚪" },
  { id: "pink-noise", label: "Pink Noise", emoji: "🌸" },
  { id: "brown-noise", label: "Brown Noise", emoji: "🟤" },
];

let sharedCtx: AudioContext | null = null;
function getContext(): AudioContext {
  if (!sharedCtx) {
    sharedCtx = new AudioContext();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume();
  }
  return sharedCtx;
}

function createNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
    data[i] = pink * 0.11;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function makeLfo(ctx: AudioContext, frequency: number, depth: number, target: AudioParam, base?: number) {
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = frequency;
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  // Setting .value overwrites the AudioParam's intrinsic base — only do this
  // once per param. When stacking a second LFO on the same target, omit `base`.
  if (base !== undefined) target.value = base;
  lfo.start();
  return lfo;
}

export interface AmbientSoundHandle {
  stop: () => void;
  setVolume: (v: number) => void;
}

export function playAmbientSound(id: AmbientSoundId): AmbientSoundHandle {
  const ctx = getContext();
  const master = ctx.createGain();
  master.gain.value = 0.6;
  master.connect(ctx.destination);

  const stoppers: Array<() => void> = [];
  const timers: number[] = [];
  stoppers.push(() => timers.forEach((t) => clearTimeout(t)));

  function loopingNoise(buffer: AudioBuffer): AudioBufferSourceNode {
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start();
    stoppers.push(() => src.stop());
    return src;
  }

  function scheduleRandomBursts(fn: () => void, minMs: number, maxMs: number) {
    const tick = () => {
      fn();
      const next = minMs + Math.random() * (maxMs - minMs);
      timers.push(window.setTimeout(tick, next));
    };
    timers.push(window.setTimeout(tick, minMs));
  }

  switch (id) {
    case "rain": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 800;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 5500;
      noise.connect(hp).connect(lp).connect(master);
      break;
    }
    case "thunderstorm": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 800;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 5500;
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.8;
      noise.connect(hp).connect(lp).connect(rainGain).connect(master);

      scheduleRandomBursts(() => {
        const rumble = ctx.createBufferSource();
        rumble.buffer = createNoiseBuffer(ctx, 2);
        const rumbleLp = ctx.createBiquadFilter();
        rumbleLp.type = "lowpass";
        rumbleLp.frequency.value = 120;
        const env = ctx.createGain();
        const now = ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.9, now + 0.3);
        env.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        rumble.connect(rumbleLp).connect(env).connect(master);
        rumble.start();
        rumble.stop(now + 3);
      }, 6000, 16000);
      break;
    }
    case "ocean": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      makeLfo(ctx, 0.12, 350, lp.frequency, 700);
      const waveGain = ctx.createGain();
      makeLfo(ctx, 0.12, 0.25, waveGain.gain, 0.55);
      noise.connect(lp).connect(waveGain).connect(master);
      break;
    }
    case "wind-chimes": {
      // A very quiet air bed underneath...
      const bedNoise = loopingNoise(createNoiseBuffer(ctx));
      const bedFilter = ctx.createBiquadFilter();
      bedFilter.type = "bandpass";
      bedFilter.frequency.value = 1000;
      bedFilter.Q.value = 0.5;
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.025;
      bedNoise.connect(bedFilter).connect(bedGain).connect(master);

      // ...plus randomly-triggered bell tones with slightly inharmonic overtones
      // (like real metal chimes) and long, natural decays.
      const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77]; // pentatonic-ish
      const partials = [1, 2.76, 4.18];
      scheduleRandomBursts(() => {
        const now = ctx.currentTime;
        const freq = notes[Math.floor(Math.random() * notes.length)];
        partials.forEach((mult, i) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = freq * mult;
          const env = ctx.createGain();
          const peak = 0.16 / (i + 1);
          const duration = 2.2 - i * 0.4 + Math.random() * 0.6;
          env.gain.setValueAtTime(0, now);
          env.gain.linearRampToValueAtTime(peak, now + 0.015);
          env.gain.exponentialRampToValueAtTime(0.001, now + duration);
          osc.connect(env).connect(master);
          osc.start(now);
          osc.stop(now + duration + 0.05);
        });
      }, 1000, 4000);
      break;
    }
    case "wind": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.8;
      makeLfo(ctx, 0.18, 500, bp.frequency, 600);
      noise.connect(bp).connect(master);
      break;
    }
    case "singing-bowl": {
      // A sustained meditative drone: two slightly-detuned sines beating against
      // each other (the classic "shimmer"), a quiet bell-like overtone, and a
      // very slow swell in volume — all continuous, no transients to fake.
      const baseFreq = 220;
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.value = baseFreq;
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = baseFreq + 2.5;
      const overtone = ctx.createOscillator();
      overtone.type = "sine";
      overtone.frequency.value = baseFreq * 2.76;
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.value = 0.15;

      const swellGain = ctx.createGain();
      makeLfo(ctx, 0.07, 0.1, swellGain.gain, 0.26);

      osc1.connect(swellGain);
      osc2.connect(swellGain);
      overtone.connect(overtoneGain).connect(swellGain);
      swellGain.connect(master);

      osc1.start();
      osc2.start();
      overtone.start();
      stoppers.push(() => {
        osc1.stop();
        osc2.stop();
        overtone.stop();
      });
      break;
    }
    case "crickets": {
      const bed = loopingNoise(createBrownNoiseBuffer(ctx));
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.1;
      bed.connect(bedGain).connect(master);

      // A real cricket "chirp" is a tone with a fast tremolo (~25-30Hz amplitude
      // pulsing), not a series of separate clicks — synthesize that tremolo
      // directly with a sample-accurate gain curve. Two overlapping voices at
      // different pitches/timing give a chorus feel instead of one insect.
      function chirpVoice(baseFreq: number) {
        const tick = () => {
          const now = ctx.currentTime;
          const duration = 0.7 + Math.random() * 0.6;
          const pulseHz = 24 + Math.random() * 6;
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = baseFreq + (Math.random() * 80 - 40);
          const env = ctx.createGain();

          const sampleCount = Math.ceil(duration * 100);
          const curve = new Float32Array(sampleCount);
          for (let i = 0; i < sampleCount; i++) {
            const t = (i / sampleCount) * duration;
            const phase = (t * pulseHz) % 1;
            const pulse = Math.max(0, 1 - phase * phase * 30);
            const fade = Math.min(t / 0.08, 1, (duration - t) / 0.15);
            curve[i] = pulse * 0.16 * Math.max(0, fade);
          }
          env.gain.setValueCurveAtTime(curve, now, duration);
          osc.connect(env).connect(master);
          osc.start(now);
          osc.stop(now + duration + 0.05);

          const next = 1500 + Math.random() * 4000;
          timers.push(window.setTimeout(tick, next));
        };
        timers.push(window.setTimeout(tick, 200 + Math.random() * 1500));
      }
      chirpVoice(4300);
      chirpVoice(3700);
      break;
    }
    case "white-noise": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const gain = ctx.createGain();
      gain.gain.value = 0.35;
      noise.connect(gain).connect(master);
      break;
    }
    case "pink-noise": {
      const noise = loopingNoise(createPinkNoiseBuffer(ctx));
      noise.connect(master);
      break;
    }
    case "brown-noise": {
      const noise = loopingNoise(createBrownNoiseBuffer(ctx));
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      noise.connect(gain).connect(master);
      break;
    }
  }

  return {
    stop: () => {
      stoppers.forEach((fn) => {
        try {
          fn();
        } catch {
          // already stopped
        }
      });
      master.disconnect();
    },
    setVolume: (v: number) => {
      master.gain.value = Math.max(0, Math.min(1, v));
    },
  };
}
