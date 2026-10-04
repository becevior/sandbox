// Everything is synthesized with Web Audio so there are no audio files to ship.

export type SoundName = "punch" | "kick" | "block" | "throw" | "jump" | "ko" | "fatality" | "whiff";

export type Sound = {
  play: (name: SoundName) => void;
  say: (text: string) => void;
  startMusic: () => void;
  stopMusic: () => void;
  setMuted: (muted: boolean) => void;
};

const BPM = 132;
const STEP = 60 / BPM / 4; // sixteenth note
const BASS = [55, 0, 55, 0, 65.41, 0, 55, 0, 73.42, 0, 55, 0, 82.41, 0, 49, 0];

export function createSound(muted: boolean): Sound | null {
  const AudioCtx = typeof window === "undefined" ? undefined : window.AudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.6;
  master.connect(ctx.destination);
  const music = ctx.createGain();
  music.gain.value = 0.2;
  music.connect(master);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  let isMuted = muted;

  function envelope(gain: GainNode, peak: number, when: number, duration: number) {
    gain.gain.setValueAtTime(peak, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
  }

  function noise(duration: number, frequency: number, type: BiquadFilterType, peak: number, out: AudioNode = master, when = ctx.currentTime) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const gain = ctx.createGain();
    envelope(gain, peak, when, duration);
    src.connect(filter).connect(gain).connect(out);
    src.start(when);
    src.stop(when + duration + 0.05);
  }

  function tone(from: number, to: number, duration: number, type: OscillatorType, peak: number, out: AudioNode = master, when = ctx.currentTime) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(to, when + duration);
    const gain = ctx.createGain();
    envelope(gain, peak, when, duration);
    osc.connect(gain).connect(out);
    osc.start(when);
    osc.stop(when + duration + 0.05);
  }

  const effects: Record<SoundName, () => void> = {
    punch: () => { noise(0.08, 1800, "lowpass", 0.8); tone(170, 60, 0.1, "sine", 0.9); },
    kick: () => { noise(0.14, 1100, "lowpass", 1); tone(130, 40, 0.18, "sine", 1); },
    block: () => { tone(950, 700, 0.06, "square", 0.12); noise(0.05, 4000, "highpass", 0.35); },
    whiff: () => noise(0.1, 2400, "bandpass", 0.25),
    throw: () => { noise(0.2, 1400, "bandpass", 0.4); tone(500, 900, 0.12, "triangle", 0.12); },
    jump: () => tone(260, 520, 0.12, "triangle", 0.18),
    ko: () => { tone(220, 40, 0.7, "sawtooth", 0.35); noise(0.45, 600, "lowpass", 0.7); },
    fatality: () => { tone(90, 28, 1.4, "sawtooth", 0.6); noise(0.9, 900, "lowpass", 1); },
  };

  let timer: number | null = null;
  let nextTime = 0;
  let stepIndex = 0;

  function scheduleMusic() {
    while (nextTime < ctx.currentTime + 0.12) {
      const s = stepIndex % 16;
      if (s % 4 === 0) tone(150, 45, 0.16, "sine", 1, music, nextTime);
      if (s % 4 === 2) noise(0.04, 7000, "highpass", 0.35, music, nextTime);
      if (BASS[s]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = BASS[s];
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 520;
        const gain = ctx.createGain();
        envelope(gain, 0.5, nextTime, STEP * 1.8);
        osc.connect(filter).connect(gain).connect(music);
        osc.start(nextTime);
        osc.stop(nextTime + STEP * 2);
      }
      nextTime += STEP;
      stepIndex += 1;
    }
  }

  return {
    play(name) {
      if (!isMuted) effects[name]();
    },
    say(text) {
      if (isMuted || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 0.2;
      window.speechSynthesis.speak(utterance);
    },
    startMusic() {
      void ctx.resume();
      if (timer !== null) return;
      nextTime = ctx.currentTime + 0.05;
      timer = window.setInterval(scheduleMusic, 25);
    },
    stopMusic() {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    },
    setMuted(next) {
      isMuted = next;
      master.gain.setTargetAtTime(next ? 0 : 0.6, ctx.currentTime, 0.02);
      if (next && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
  };
}
