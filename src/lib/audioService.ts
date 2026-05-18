/**
 * Audio Service for 8-bit chiptune arpeggio
 */

export class AudioService {
  private ctx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private interval: any = null;
  private isPlaying = false;

  start() {
    if (this.isPlaying) return;
    
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.oscillator = this.ctx.createOscillator();
    this.gainNode = this.ctx.createGain();

    this.oscillator.type = 'square';
    this.gainNode.gain.setValueAtTime(0.02, this.ctx.currentTime);

    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    let index = 0;

    this.oscillator.start();
    this.isPlaying = true;

    this.interval = setInterval(() => {
      if (this.oscillator && this.ctx) {
        this.oscillator.frequency.setTargetAtTime(notes[index], this.ctx.currentTime, 0.05);
        index = (index + 1) % notes.length;
      }
    }, 200);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
    }
    if (this.gainNode) this.gainNode.disconnect();
    if (this.ctx) this.ctx.close();
    
    this.isPlaying = false;
    this.oscillator = null;
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
