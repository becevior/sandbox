// Music and effects are synthesized with Web Audio; the announcer is a set of
// pre-rendered clips (scripts/generate-announcer.sh).

import type { VoiceLine } from "./engine";

export type SoundName = "punch" | "kick" | "block" | "throw" | "jump" | "ko" | "fatality" | "whiff";

export type Sound = {
  play: (name: SoundName) => void;
  say: (line: VoiceLine | null, text: string) => void;
  startMusic: () => void;
  stopMusic: () => void;
  tension: () => void;
  setMuted: (muted: boolean) => void;
};

const VOICE_LINES: VoiceLine[] = ["round1", "round2", "round3", "finalRound", "fight", "finishHim", "fatality", "flawless", "mooseWins", "duckWins", "draw"];
// Every clip ends with ~0.9s of echo tail; the next line can start over it.
const VOICE_TAIL = 0.85;

// Recorded soundtrack: "arena" from ~/workplace/mk-remix/generate.py, rendered
// without its vocal shouts and with the reverb tail folded into the start so it
// loops seamlessly. Set to null (or if it fails to load) to use the synthesized
// loop below instead.
const MUSIC_TRACK: string | null = "/audio/mascot-kombat-theme.mp3";

const fetchAudio = (url: string) => fetch(url).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);

let clipFetches: Map<VoiceLine, Promise<ArrayBuffer | null>> | null = null;
let trackFetch: Promise<ArrayBuffer | null> | null = null;

// Start downloading audio before the first click so it's ready on "Round 1".
export function preloadAnnouncer() {
  if (clipFetches || typeof window === "undefined") return;
  clipFetches = new Map(VOICE_LINES.map((line) => [line, fetchAudio(`/audio/announcer/${line}.mp3`)]));
  trackFetch = MUSIC_TRACK ? fetchAudio(MUSIC_TRACK) : Promise.resolve(null);
}

// --- Music ------------------------------------------------------------------
// Original 140 BPM techno loop in A minor, 32 bars:
// A (1-8) drums + rolling bass, B (9-16) + chord stabs, C (17-24) + arpeggio,
// D (25-32) breakdown with a filter sweep back into the top.

const BPM = 140;
const STEP = 60 / BPM / 4;
const BARS = 32;
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// Two bars per chord: Am, Am, F, G (roots as MIDI notes, octave 2).
const PROGRESSION = [
  { root: 45, chord: [57, 60, 64] },
  { root: 45, chord: [57, 60, 64] },
  { root: 41, chord: [53, 57, 60] },
  { root: 43, chord: [55, 59, 62] },
];
const BASS_STEPS = [2, 3, 6, 7, 10, 11, 14, 15];
const BASS_OFFSETS = [0, 12, 0, 12, 0, 12, 7, 12];
const STAB_STEPS = [0, 3, 6, 10];
const ARP_ORDER = [0, 1, 2, 3, 2, 1, 0, 2];
const HAT_LEVELS = [0.18, 0.08, 0.5, 0.08];

export function createSound(muted: boolean): Sound | null {
  const AudioCtx = typeof window === "undefined" ? undefined : window.AudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const now = () => ctx.currentTime;
  let isMuted = muted;

  const master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.8;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.ratio.value = 12;
  master.connect(limiter).connect(ctx.destination);

  // Shared reverb (generated impulse) and a dotted-eighth delay.
  const reverb = ctx.createConvolver();
  const impulse = ctx.createBuffer(2, ctx.sampleRate * 2, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = impulse.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  }
  reverb.buffer = impulse;
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.35;
  reverb.connect(reverbReturn).connect(master);

  // Music bus: everything -> tension filter -> duck (under the announcer) -> master.
  const musicBus = ctx.createGain();
  musicBus.gain.value = 0.55;
  const tensionFilter = ctx.createBiquadFilter();
  tensionFilter.type = "lowpass";
  tensionFilter.frequency.value = 18000;
  const duck = ctx.createGain();
  musicBus.connect(tensionFilter).connect(duck).connect(master);

  // Bass and stabs pump against the kick.
  const pump = ctx.createGain();
  pump.connect(musicBus);

  const delay = ctx.createDelay(1);
  delay.delayTime.value = STEP * 3;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.38;
  const delayTone = ctx.createBiquadFilter();
  delayTone.type = "lowpass";
  delayTone.frequency.value = 2400;
  delay.connect(delayTone).connect(feedback).connect(delay);
  delayTone.connect(musicBus);

  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) noiseData[i] = Math.random() * 2 - 1;

  function env(gain: AudioParam, peak: number, when: number, decay: number, attack = 0.002) {
    gain.setValueAtTime(0.0001, when);
    gain.linearRampToValueAtTime(peak, when + attack);
    gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  }

  function noise(when: number, decay: number, type: BiquadFilterType, freq: number, peak: number, out: AudioNode, q = 0.7) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    env(g.gain, peak, when, decay);
    src.connect(filter).connect(g).connect(out);
    src.start(when, Math.random() * 0.5);
    src.stop(when + decay + 0.05);
    return g;
  }

  function sweep(when: number, from: number, to: number, decay: number, type: OscillatorType, peak: number, out: AudioNode) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, when);
    osc.frequency.exponentialRampToValueAtTime(to, when + decay);
    const g = ctx.createGain();
    env(g.gain, peak, when, decay);
    osc.connect(g).connect(out);
    osc.start(when);
    osc.stop(when + decay + 0.05);
  }

  function saws(when: number, notes: number[], decay: number, peak: number, cutoff: number, out: AudioNode, detune = 9) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(cutoff, when);
    filter.frequency.exponentialRampToValueAtTime(Math.max(200, cutoff / 5), when + decay);
    const g = ctx.createGain();
    env(g.gain, peak, when, decay, 0.004);
    filter.connect(g).connect(out);
    for (const n of notes) {
      for (const d of [-detune, detune]) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = midi(n);
        osc.detune.value = d;
        osc.connect(filter);
        osc.start(when);
        osc.stop(when + decay + 0.05);
      }
    }
    return g;
  }

  // --- Drums ---
  function kickDrum(when: number) {
    sweep(when, 160, 42, 0.32, "sine", 1, musicBus);
    noise(when, 0.012, "highpass", 3000, 0.4, musicBus);
    pump.gain.setValueAtTime(0.25, when);
    pump.gain.linearRampToValueAtTime(1, when + STEP * 2.2);
  }
  function clap(when: number) {
    for (const offset of [0, 0.011, 0.022]) noise(when + offset, offset === 0.022 ? 0.16 : 0.02, "bandpass", 1400, 0.7, musicBus, 1.6);
    noise(when, 0.2, "bandpass", 1400, 0.25, reverb, 1.2);
  }
  function hat(when: number, level: number, open: boolean) {
    noise(when, open ? 0.14 : 0.03, "highpass", 8000, level, musicBus);
  }
  function crash(when: number) {
    noise(when, 1.6, "highpass", 5000, 0.35, musicBus);
    noise(when, 1.2, "highpass", 4000, 0.2, reverb);
  }
  function riser(when: number, length: number) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(300, when);
    filter.frequency.exponentialRampToValueAtTime(9000, when + length);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.35, when + length);
    src.connect(filter).connect(g).connect(musicBus);
    src.start(when);
    src.stop(when + length);
  }

  // --- Recorded track (optional) ---
  let track: AudioBufferSourceNode | null = null;
  let musicGeneration = 0;
  const trackBuffer: Promise<AudioBuffer | null> = (trackFetch ?? Promise.resolve(null))
    .then((data) => (data ? ctx.decodeAudioData(data.slice(0)) : null))
    .catch(() => null);

  // --- Sequencer ---
  let timer: number | null = null;
  let nextTime = 0;
  let step = 0;

  function scheduleStep(when: number, index: number) {
    const s = index % 16;
    const bar = Math.floor(index / 16) % BARS;
    const section = Math.floor(bar / 8); // 0 A, 1 B, 2 C, 3 D
    const chord = PROGRESSION[Math.floor(bar / 2) % 4];
    const breakdown = section === 3;
    const lastBarOfSection = bar % 8 === 7;

    if (s === 0 && bar % 8 === 0) crash(when);
    if (!breakdown && s % 4 === 0) kickDrum(when);
    if (breakdown && bar >= 28 && s % 4 === 0) kickDrum(when);
    if (lastBarOfSection && s >= 12 && !breakdown) kickDrum(when); // fill
    if (!breakdown && (s === 4 || s === 12)) clap(when);
    if (!breakdown || bar >= 28) hat(when, HAT_LEVELS[s % 4], s % 4 === 2);

    const bassIndex = BASS_STEPS.indexOf(s);
    if (bassIndex >= 0 && !(breakdown && bar < 28)) {
      saws(when, [chord.root - 12 + BASS_OFFSETS[bassIndex]], STEP * 1.6, 0.32, 900, pump, 4);
    }
    if ((section === 1 || section === 2 || breakdown) && STAB_STEPS.includes(s)) {
      const stab = saws(when, chord.chord, breakdown ? 0.5 : 0.22, breakdown ? 0.12 : 0.16, breakdown ? 1500 : 3200, pump);
      stab.connect(delay);
      stab.connect(reverb);
    }
    if (section === 2 || (breakdown && bar >= 26)) {
      const notes = [...chord.chord, chord.chord[0] + 12];
      const note = notes[ARP_ORDER[s % 8]] + 12;
      const lead = ctx.createOscillator();
      lead.type = "square";
      lead.frequency.value = midi(note);
      const g = ctx.createGain();
      env(g.gain, 0.07, when, STEP * 0.9);
      lead.connect(g);
      g.connect(musicBus);
      g.connect(delay);
      lead.start(when);
      lead.stop(when + STEP);
    }
    if (bar === BARS - 1 && s === 0) riser(when, STEP * 16);
  }

  function schedule() {
    while (nextTime < now() + 0.12) {
      scheduleStep(nextTime, step);
      nextTime += STEP;
      step += 1;
    }
  }

  // --- Effects ---
  function hitBody(peak: number, low: number, crunch: number) {
    const t = now();
    const pitch = 0.9 + Math.random() * 0.2;
    sweep(t, low * pitch, 38, 0.16, "sine", peak, master);
    noise(t, 0.09, "bandpass", crunch * pitch, peak * 0.9, master, 1.2);
    noise(t, 0.03, "highpass", 4000, peak * 0.5, master);
    sweep(t, 220 * pitch, 90, 0.06, "square", peak * 0.18, master);
  }
  function gong(t: number, peak: number) {
    for (const [ratio, level, decay] of [[1, 1, 3], [2.32, 0.5, 2.2], [3.17, 0.35, 1.6], [4.53, 0.2, 1.1], [0.5, 0.6, 3.4]]) {
      const osc = ctx.createOscillator();
      osc.frequency.value = 73 * ratio;
      const g = ctx.createGain();
      env(g.gain, peak * level, t, decay, 0.01);
      osc.connect(g);
      g.connect(master);
      g.connect(reverb);
      osc.start(t);
      osc.stop(t + decay + 0.1);
    }
  }

  const effects: Record<SoundName, () => void> = {
    punch: () => hitBody(0.8, 190, 1600),
    kick: () => hitBody(1, 140, 1100),
    block: () => {
      const t = now();
      sweep(t, 1200, 800, 0.07, "square", 0.12, master);
      noise(t, 0.06, "highpass", 5000, 0.4, master);
    },
    whiff: () => {
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 2;
      const t = now();
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(3000, t + 0.12);
      const g = ctx.createGain();
      env(g.gain, 0.25, t, 0.13, 0.03);
      src.connect(filter).connect(g).connect(master);
      src.start(t);
      src.stop(t + 0.2);
    },
    throw: () => {
      const t = now();
      noise(t, 0.25, "bandpass", 1200, 0.4, master, 2);
      sweep(t, 400, 1100, 0.18, "triangle", 0.12, master);
    },
    jump: () => sweep(now(), 240, 520, 0.12, "triangle", 0.16, master),
    ko: () => {
      const t = now();
      sweep(t, 120, 30, 0.9, "sine", 1, master);
      noise(t, 0.6, "lowpass", 700, 0.8, master);
      noise(t, 0.8, "lowpass", 1500, 0.4, reverb);
    },
    fatality: () => {
      const t = now();
      stopMusicNow();
      sweep(t, 90, 24, 1.8, "sawtooth", 0.5, master);
      noise(t, 1.2, "lowpass", 900, 1, master);
      gong(t + 0.05, 0.5);
    },
  };

  // --- Announcer ---
  const clips = new Map<VoiceLine, Promise<AudioBuffer | null>>();
  preloadAnnouncer();
  clipFetches?.forEach((fetching, line) => {
    clips.set(line, fetching.then((data) => (data ? ctx.decodeAudioData(data.slice(0)) : null)).catch(() => null));
  });
  const voice = ctx.createGain();
  voice.gain.value = 1;
  voice.connect(master);
  const voiceVerb = ctx.createGain();
  voiceVerb.gain.value = 0.25;
  voice.connect(voiceVerb).connect(reverb);
  let voiceFree = 0;
  let voiceQueue: Promise<void> = Promise.resolve();

  function speakFallback(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 0.2;
    window.speechSynthesis.speak(utterance);
  }

  function playClip(buffer: AudioBuffer) {
    const start = Math.max(now() + 0.01, voiceFree);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(voice);
    src.start(start);
    voiceFree = start + Math.max(0.3, buffer.duration - VOICE_TAIL);
    // Duck the music under the line.
    duck.gain.cancelScheduledValues(start);
    duck.gain.setTargetAtTime(0.35, start, 0.03);
    duck.gain.setTargetAtTime(1, voiceFree, 0.25);
  }

  function stopMusicNow() {
    musicGeneration += 1;
    if (timer !== null) window.clearInterval(timer);
    timer = null;
    track?.stop();
    track = null;
  }

  return {
    play(name) {
      if (!isMuted) effects[name]();
    },
    say(line, text) {
      if (isMuted) return;
      const clip = line ? clips.get(line) : undefined;
      if (line === "round1" || line === "finalRound") gong(now(), 0.25);
      if (!clip) {
        speakFallback(text);
        return;
      }
      // Keep lines in order even if a clip is still decoding.
      voiceQueue = voiceQueue.then(() => clip).then((buffer) => {
        if (isMuted) return;
        if (buffer) playClip(buffer);
        else speakFallback(text);
      });
    },
    startMusic() {
      void ctx.resume();
      tensionFilter.frequency.cancelScheduledValues(now());
      tensionFilter.frequency.setValueAtTime(18000, now());
      if (timer !== null || track) return;
      const generation = ++musicGeneration;
      void trackBuffer.then((buffer) => {
        if (generation !== musicGeneration) return; // stopped while loading
        if (buffer) {
          track = ctx.createBufferSource();
          track.buffer = buffer;
          track.loop = true;
          track.connect(musicBus);
          track.start();
          return;
        }
        nextTime = now() + 0.05;
        step = 0;
        timer = window.setInterval(schedule, 25);
      });
    },
    stopMusic: stopMusicNow,
    tension() {
      // "Finish him!": close the filter on the music.
      tensionFilter.frequency.setTargetAtTime(500, now(), 0.4);
    },
    setMuted(next) {
      isMuted = next;
      master.gain.setTargetAtTime(next ? 0 : 0.8, now(), 0.02);
      if (next && "speechSynthesis" in window) window.speechSynthesis.cancel();
    },
  };
}
