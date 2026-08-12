/* ═══════════════════════════════════════════════════════════════════
   CHRONOS QUEST — Procedural Audio Engine
   Architect: Arthur (Audio/Synergy)
   ─────────────────────────────────────────────────────────────────
   No external assets. 100% synthesized via Web Audio API.
   "Ghibli Ambient" algorithmic composition architecture.
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.bgmTimer = null;
    
    // Ghibli ethereal progression: C, G, Am, F
    // Notes stored as MIDI note numbers.
    this.chordProgression = [
      [60, 64, 67, 72, 76], // C major (C4, E4, G4, C5, E5)
      [55, 59, 62, 67, 71], // G major (G3, B3, D4, G4, B4)
      [57, 60, 64, 69, 72], // A minor (A3, C4, E4, A4, C5)
      [53, 57, 60, 65, 69], // F major (F3, A3, C4, F4, A4)
    ];
    this.currentChordIndex = 0;
    this.lastChordTime = 0;
  }

  /**
   * Must be called during a user interaction (e.g. click).
   */
  async initOrResume() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5; // Overall volume
      this.masterGain.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  /**
   * Core piano synthesizer: simple sine wave with a percussive envelope.
   */
  playPianoNote(freq, time, duration = 2.0, volume = 0.3) {
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine'; // Pure tone for ethereal piano
    osc.frequency.setValueAtTime(freq, time);

    // Percussive envelope
    gain.gain.setValueAtTime(0, time);
    // Fast attack
    gain.gain.linearRampToValueAtTime(volume, time + 0.02);
    // Exponential decay to simulate piano string
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Procedural Background Music Scheduler
   * Changes chord every 2 seconds, plays random arpeggios.
   */
  startBGM() {
    if (!this.ctx) return;
    this.stopBGM(); // Ensure no duplicates
    this._scheduleNextNote();
  }

  stopBGM() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  _scheduleNextNote() {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Change chord every 2 seconds
    if (now - this.lastChordTime >= 2.0) {
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chordProgression.length;
      this.lastChordTime = now;
      
      // Play a root chord softly when chord changes to build atmosphere
      const chord = this.chordProgression[this.currentChordIndex];
      this.playPianoNote(this.midiToFreq(chord[0] - 12), now, 3.0, 0.15); // Bass note
      this.playPianoNote(this.midiToFreq(chord[0]), now, 3.0, 0.1);
      this.playPianoNote(this.midiToFreq(chord[1]), now + 0.05, 3.0, 0.1);
      this.playPianoNote(this.midiToFreq(chord[2]), now + 0.1, 3.0, 0.1);
    }

    // Pick a random note from the current chord for arpeggiation
    const chord = this.chordProgression[this.currentChordIndex];
    const randomNote = chord[Math.floor(Math.random() * chord.length)];
    // Sometimes play an octave higher for twinkle
    const octaveShift = Math.random() > 0.7 ? 12 : 0;
    const freq = this.midiToFreq(randomNote + octaveShift);
    
    // Play with gentle volume
    this.playPianoNote(freq, now, 2.0, 0.15 + Math.random() * 0.1);

    // Schedule next note randomly between 150ms and 400ms
    const nextInterval = 150 + Math.random() * 250;
    this.bgmTimer = setTimeout(() => this._scheduleNextNote(), nextInterval);
  }

  /**
   * SFX: Hitting a brick/wall. Uses Triangle wave for a crystal hit feeling.
   */
  playCrystalHit(baseScale = 1.0) {
    if (!this.ctx || this.isMuted) return;
    
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Frequency mapped to combo or position via baseScale
    const freq = 600 * baseScale + Math.random() * 100;
    osc.frequency.setValueAtTime(freq, time);
    
    // Sharp hit envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /**
   * SFX: Hitting the paddle. Fast frequency sliding sine wave resembling a water drop/bubble.
   */
  playWaterDrop() {
    if (!this.ctx || this.isMuted) return;
    
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    
    // Sweep frequency up rapidly
    osc.frequency.setValueAtTime(300, time);
    osc.frequency.exponentialRampToValueAtTime(800, time + 0.1);

    // Volume envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.3, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  /** Toggle global mute */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      // Smoothly ramp to avoid clicking
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.5, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }
}

// Expose globally for GameCore
window.AudioManager = AudioManager;
