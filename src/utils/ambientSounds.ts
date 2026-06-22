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
    case "stream": {
      // Bright, busy bandpassed noise bed (the constant trickle)...
      const noise = loopingNoise(createNoiseBuffer(ctx));
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.1;
      makeLfo(ctx, 0.7, 600, bp.frequency, 3200);
      const lfo2 = makeLfo(ctx, 2.3, 350, bp.frequency);
      stoppers.push(() => lfo2.stop());
      const bedGain = ctx.createGain();
      bedGain.gain.value = 0.5;
      noise.connect(bp).connect(bedGain).connect(master);

      // ...plus frequent bright "droplet" plinks for the bubbling texture.
      scheduleRandomBursts(() => {
        const now = ctx.currentTime;
        const drop = ctx.createBufferSource();
        drop.buffer = createNoiseBuffer(ctx, 0.05);
        const dropBp = ctx.createBiquadFilter();
        dropBp.type = "bandpass";
        dropBp.frequency.value = 3200 + Math.random() * 3200;
        dropBp.Q.value = 6 + Math.random() * 6;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.5, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        drop.connect(dropBp).connect(env).connect(master);
        drop.start();
        drop.stop(now + 0.05);
      }, 30, 130);
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
      // Low rumbling "whoosh" bed that breathes slightly, like air feeding a fire...
      const bed = loopingNoise(createPinkNoiseBuffer(ctx));
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 350;
      const bedGain = ctx.createGain();
      makeLfo(ctx, 0.3, 0.08, bedGain.gain, 0.22);
      bed.connect(lp).connect(bedGain).connect(master);

      // ...plus irregular pops and crackles at varied pitch/length, the way real
      // embers snap unevenly rather than on a steady clock.
      scheduleRandomBursts(() => {
        const now = ctx.currentTime;
        const isPop = Math.random() < 0.3;
        const crackle = ctx.createBufferSource();
        crackle.buffer = createNoiseBuffer(ctx, 0.2);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = isPop ? 600 + Math.random() * 400 : 1800 + Math.random() * 2200;
        const bp = ctx.createBiquadFilter();
        bp.type = "peaking";
        bp.frequency.value = hp.frequency.value * 1.4;
        bp.Q.value = 3;
        bp.gain.value = 6;
        const env = ctx.createGain();
        const duration = isPop ? 0.08 + Math.random() * 0.05 : 0.02 + Math.random() * 0.04;
        const peak = isPop ? 0.9 : 0.45 + Math.random() * 0.3;
        env.gain.setValueAtTime(peak, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + duration);
        crackle.connect(hp).connect(bp).connect(env).connect(master);
        crackle.start();
        crackle.stop(now + duration + 0.02);

        // Crackles often arrive in little clusters of 2-3 quick snaps.
        if (Math.random() < 0.4) {
          const extra = ctx.createBufferSource();
          extra.buffer = createNoiseBuffer(ctx, 0.1);
          const extraHp = ctx.createBiquadFilter();
          extraHp.type = "highpass";
          extraHp.frequency.value = 2000 + Math.random() * 2000;
          const extraEnv = ctx.createGain();
          const t = now + 0.04 + Math.random() * 0.06;
          extraEnv.gain.setValueAtTime(0.3, t);
          extraEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          extra.connect(extraHp).connect(extraEnv).connect(master);
          extra.start(t);
          extra.stop(t + 0.04);
        }
      }, 120, 700);
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
