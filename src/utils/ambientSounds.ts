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
  | "campfire"
  | "stream"
  | "crickets";

export const AMBIENT_SOUNDS: { id: AmbientSoundId; label: string; emoji: string }[] = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "thunderstorm", label: "Thunderstorm", emoji: "⛈️" },
  { id: "ocean", label: "Ocean Waves", emoji: "🌊" },
  { id: "stream", label: "Babbling Stream", emoji: "💧" },
  { id: "wind", label: "Wind", emoji: "🍃" },
  { id: "campfire", label: "Campfire", emoji: "🔥" },
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

function makeLfo(ctx: AudioContext, frequency: number, depth: number, target: AudioParam, base: number) {
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = frequency;
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain);
  lfoGain.connect(target);
  target.value = base;
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
    case "stream": {
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.6;
      makeLfo(ctx, 0.9, 900, bp.frequency, 2800);
      noise.connect(bp).connect(master);
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
    case "campfire": {
      const bed = loopingNoise(createPinkNoiseBuffer(ctx));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.25;
      bed.connect(lp).connect(bedGain).connect(master);

      scheduleRandomBursts(() => {
        const crackle = ctx.createBufferSource();
        crackle.buffer = createNoiseBuffer(ctx, 0.1);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 2000;
        const env = ctx.createGain();
        const now = ctx.currentTime;
        env.gain.setValueAtTime(0.7, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        crackle.connect(hp).connect(env).connect(master);
        crackle.start();
        crackle.stop(now + 0.15);
      }, 150, 900);
      break;
    }
    case "crickets": {
      const bed = loopingNoise(createBrownNoiseBuffer(ctx));
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.12;
      bed.connect(bedGain).connect(master);

      scheduleRandomBursts(() => {
        const now = ctx.currentTime;
        for (let i = 0; i < 4; i++) {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 4200 + Math.random() * 400;
          const env = ctx.createGain();
          const t = now + i * 0.09;
          env.gain.setValueAtTime(0, t);
          env.gain.linearRampToValueAtTime(0.15, t + 0.01);
          env.gain.linearRampToValueAtTime(0, t + 0.06);
          osc.connect(env).connect(master);
          osc.start(t);
          osc.stop(t + 0.07);
        }
      }, 1200, 3500);
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
