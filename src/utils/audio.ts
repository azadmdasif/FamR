/**
 * Gentle Web Audio Synthesizer for calm chimes, timer completion bells,
 * breathing warm-up cues, and ambient background focus sounds.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSource: AudioNode | null = null;
  private isAmbientPlaying = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play a soft, warm singing-bowl chime (528 Hz / harmonic Solfeggio frequency)
   */
  playGentleChime(freq = 528, duration = 2.2) {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Primary tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Warm harmonic overtone (octave + fifth)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 1.5, now);

      // Envelopes
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Gentle completion celebration triple chime (C5 -> E5 -> G5)
   */
  playSuccessChime() {
    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.playGentleChime(freq, 1.8);
        }, idx * 160);
      });
    } catch {
      // Silently continue
    }
  }

  /**
   * Soft tick sound for checkbox toggle
   */
  playSoftTick() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore
    }
  }

  /**
   * Start soft ambient noise (brown noise or gentle hum) for focus
   */
  startAmbient(type: 'brown' | 'rain' | 'hum' = 'brown') {
    try {
      this.stopAmbient();
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown' || type === 'rain') {
          // Brown noise integration
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          data[i] = lastOut * 3.5;
        } else {
          // Soft drone
          data[i] = Math.sin(i * 0.01) * 0.05 + (Math.random() * 0.02);
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Low pass filter to make it very mellow
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = type === 'rain' ? 800 : 400;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();

      this.ambientSource = noise;
      this.ambientGain = gain;
      this.isAmbientPlaying = true;
    } catch {
      // Ambient not available
    }
  }

  stopAmbient() {
    try {
      if (this.ambientGain && this.ctx) {
        this.ambientGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      }
      setTimeout(() => {
        if (this.ambientSource) {
          try {
            (this.ambientSource as AudioBufferSourceNode).stop();
            this.ambientSource.disconnect();
          } catch {
            // Already stopped
          }
          this.ambientSource = null;
        }
        this.ambientGain = null;
        this.isAmbientPlaying = false;
      }, 500);
    } catch {
      this.ambientSource = null;
      this.isAmbientPlaying = false;
    }
  }

  getAmbientPlaying() {
    return this.isAmbientPlaying;
  }
}

export const soundManager = new SoundEffects();
