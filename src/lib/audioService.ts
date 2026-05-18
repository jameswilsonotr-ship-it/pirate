/**
 * Procedural Audio Service for 8-bit chiptune arpeggio
 */

export class AudioService {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private interval: any = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.oscillator = this.ctx.createOscillator();
    this.oscillator2 = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();

    this.oscillator.type = 'square';
    this.oscillator2.type = 'sawtooth';
    this.gainNode.gain.setValueAtTime(0.015, this.ctx.currentTime);

    this.oscillator.connect(this.gainNode);
    this.oscillator2.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Procedural Pirate Scales
    const scales = [
      [261.63, 311.13, 392.00, 466.16], // C minor (moody pirate)
      [293.66, 349.23, 440.00, 523.25], // D minor (shanty)
      [220.00, 261.63, 329.63, 493.88], // A minor (mysterious)
    ];
    let currentScale = scales[Math.floor(Math.random() * scales.length)];

    this.oscillator.start();
    this.oscillator2.start();
    this.isPlaying = true;

    let beatCount = 0;

    this.interval = setInterval(() => {
      if (this.ctx && this.oscillator && this.oscillator2) {
        beatCount++;
        if (beatCount % 16 === 0) {
           currentScale = scales[Math.floor(Math.random() * scales.length)];
        }
        
        let freq = currentScale[Math.floor(Math.random() * currentScale.length)];
        if (Math.random() > 0.8) freq *= 2; // Octave jump

        this.oscillator.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
        this.oscillator2.frequency.setTargetAtTime(freq / 2, this.ctx.currentTime, 0.08);

        // Amplitude envelope for plucky sound
        this.gainNode?.gain.setValueAtTime(0.02, this.ctx.currentTime);
        this.gainNode?.gain.setTargetAtTime(0.005, this.ctx.currentTime, 0.1);
      }
    }, 125);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    if (this.oscillator2) {
      this.oscillator2.stop();
      this.oscillator2.disconnect();
    }
    if (this.gainNode) this.gainNode.disconnect();
    if (this.ctx) this.ctx.close();
    
    this.isPlaying = false;
    this.oscillator = null;
    this.oscillator2 = null;
    this.gainNode = null;
    this.ctx = null;
  }

  toggle() {
    if (this.isPlaying) this.stop();
    else this.start();
    return this.isPlaying;
  }
}

export const audioService = new AudioService();
