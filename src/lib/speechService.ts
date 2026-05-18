/**
 * Speech Service for First Mate Grok's parrot voice
 */

export class SpeechService {
  private synth = window.speechSynthesis;
  private isParrotEnabled = true;

  setParrotEnabled(enabled: boolean) {
    this.isParrotEnabled = enabled;
  }

  speak(text: string) {
    if (!this.isParrotEnabled) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Pirate/Parrot settings
    utterance.pitch = 1.5;
    utterance.rate = 1.2;
    utterance.volume = 1;

    // Try to find a fitting voice (optional enhancement)
    const voices = this.synth.getVoices();
    if (voices.length > 0) {
      // Prefer some specific voices if available, but default is fine
      const preferred = voices.find(v => v.name.includes('Google') || v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    }

    this.synth.speak(utterance);
  }

  greet() {
    this.speak("SQUAWK! Welcome aboard, Captain! The treasure map is ready. Let's set sail!");
  }
}

export const speechService = new SpeechService();
