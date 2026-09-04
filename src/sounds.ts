let audioCtx: AudioContext | null = null;
let audioReady = false;
let pendingMusic = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initAudio() {
  if (audioReady) return;
  const handler = () => {
    if (audioReady) return;
    audioReady = true;
    getCtx();
    document.removeEventListener("click", handler);
    document.removeEventListener("touchstart", handler);
    if (pendingMusic) {
      pendingMusic = false;
      doStartMusic();
    }
  };
  document.addEventListener("click", handler, { once: false });
  document.addEventListener("touchstart", handler, { once: false });
}

let roundMusic: HTMLAudioElement | null = null;

function doStartMusic() {
  try {
    stopRoundMusic();
    roundMusic = new Audio("/aviator-music.mp3");
    roundMusic.volume = 0.35;
    roundMusic.loop = true;
    roundMusic.play().catch(() => {});
  } catch (e) {}
}

export function startRoundMusic() {
  if (!audioReady) {
    pendingMusic = true;
    return;
  }
  doStartMusic();
}

export function stopRoundMusic() {
  try {
    if (roundMusic) {
      roundMusic.pause();
      roundMusic.currentTime = 0;
      roundMusic = null;
    }
  } catch (e) {}
}

export function fadeOutMusic(duration: number = 300) {
  try {
    if (roundMusic) {
      const vol = roundMusic.volume;
      const steps = 10;
      const step = vol / steps;
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (roundMusic) {
          roundMusic.volume = Math.max(0, vol - step * i);
        }
        if (i >= steps) {
          clearInterval(interval);
          stopRoundMusic();
        }
      }, duration / steps);
    }
  } catch (e) {
    stopRoundMusic();
  }
}

export function playCrashSound() {
  try {
    const ctx = getCtx();

    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(2000, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.8);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(300, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.12, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export function playCashoutSound() {
  try {
    const ctx = getCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.25);
    });
  } catch (e) {}
}

export function playBetSound() {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

export function playWaitingTick(elapsed: number) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const elapsedSec = elapsed / 1000;
    const freq = 300 + (elapsedSec % 5) * 80;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}
