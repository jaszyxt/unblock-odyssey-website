// Tiny WebAudio synth for playful feedback. Off by default; the header
// sound toggle flips `enabled`. No audio assets required.

class Sfx {
  constructor() {
    this.enabled = false;
    this.ctx = null;
  }

  _ctx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  _tone(freq, dur, { type = 'triangle', gain = 0.05, delay = 0, slide = 0 } = {}) {
    if (!this.enabled) return;
    const ctx = this._ctx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  move() { this._tone(520, 0.06, { gain: 0.035 }); }
  select() { this._tone(700, 0.04, { gain: 0.02 }); }
  blocked() { this._tone(130, 0.12, { type: 'square', gain: 0.03 }); }
  gate() {
    [523, 659, 784].forEach((f, i) => this._tone(f, 0.12, { delay: i * 0.07, gain: 0.04 }));
  }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.18, { delay: i * 0.09, gain: 0.05 }));
  }
}

export const sfx = new Sfx();
