class AudioEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.layers = {};
    this.masterGain = null;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx.resume();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;

    // Safety net: retry resume on any future interaction
    const nudge = () => {
      if (this.ctx.state === 'suspended') this.ctx.resume();
    };
    document.addEventListener('click', nudge, { once: true });
    document.addEventListener('keydown', nudge, { once: true });
  }

  // Gentle brown noise
  createNoise() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (last + (0.01 * white)) / 1.01;
      last = data[i];
      data[i] *= 1.5;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
  }

  // Soft cricket texture - filtered noise, not oscillator
  createCrickets() {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    const noise = this.createNoise();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 15;
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 4;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    noise.connect(filter);
    filter.connect(gain);
    noise.start();
    lfo.start();
    return { output: gain, gain, source: noise };
  }

  // Water clicking - soft noise bursts
  createClicking() {
    const interval = { id: null };
    const click = () => {
      if (!this.ctx) return;
      const bufLen = Math.floor(this.ctx.sampleRate * 0.06);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const env = Math.exp(-i / (bufLen * 0.08));
        d[i] = (Math.random() * 2 - 1) * env * 0.6;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 250 + Math.random() * 150;
      filter.Q.value = 3;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.5;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start();
    };
    return {
      start: (rate = 800) => { interval.id = setInterval(click, rate + Math.random() * 400); },
      stop: () => clearInterval(interval.id),
      setRate: (rate) => { clearInterval(interval.id); interval.id = setInterval(click, rate + Math.random() * (rate * 0.5)); }
    };
  }

  // Bone ticks - tiny delicate taps
  createBoneTicks() {
    const tick = () => {
      if (!this.ctx) return;
      const bufLen = Math.floor(this.ctx.sampleRate * 0.025);
      const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const env = Math.exp(-i / (bufLen * 0.04));
        d[i] = (Math.random() * 2 - 1) * env * 0.1;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 600 + Math.random() * 300;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.25;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      src.start();
    };
    return { tick };
  }

  // Deep hum - barely there
  createHum() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.value = 48;
    filter.type = 'lowpass';
    filter.frequency.value = 80;
    gain.gain.value = 0;
    osc.connect(filter);
    filter.connect(gain);
    osc.start();
    return { output: gain, osc, gain };
  }

  // Wind - very gentle
  createWind() {
    const noise = this.createNoise();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    filter.Q.value = 0.5;
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    noise.connect(filter);
    filter.connect(gain);
    gain.gain.value = 0;
    noise.start();
    lfo.start();
    return { output: gain, gain, source: noise };
  }

  fadeIn(gainNode, target, duration = 2) {
    gainNode.gain.setValueAtTime(gainNode.gain.value, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(target, this.ctx.currentTime + duration);
  }

  fadeOut(gainNode, duration = 2) {
    gainNode.gain.setValueAtTime(gainNode.gain.value, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
  }

  // Apply a crossfade to a buffer so it loops seamlessly
  crossfadeLoop(buffer, fadeDuration = 1) {
    const fadeLen = Math.floor(fadeDuration * buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      const len = data.length;
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        data[len - fadeLen + i] = data[len - fadeLen + i] * (1 - t) + data[i] * t;
      }
    }
  }

  // Load an audio file and return a promise resolving to an AudioBuffer
  async loadSound(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.ctx.decodeAudioData(arrayBuffer);
  }

  // Play a loaded buffer, returning source + gain nodes for control
  playBuffer(buffer, { loop = false, volume = 0, fadeIn = 0 } = {}) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
    if (fadeIn > 0 && volume === 0) {
      // caller will fade in manually
    } else if (fadeIn > 0) {
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fadeIn);
    }
    return { source, gain };
  }
}
