/**
 * UTT-v2.0 Audio: Cyber-Rhythm Synthesis
 * Responsibility: Tessa (Technical Designer)
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.beatCount = 0;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    start() {
        this.isPlaying = true;
        this.tick();
    }

    stop() {
        this.isPlaying = false;
    }

    tick() {
        if (!this.isPlaying) return;
        
        const interval = (60 / this.bpm) * 1000 / 2; // Eighth notes
        this.playBeat(this.beatCount % 8);
        this.beatCount++;
        
        setTimeout(() => this.tick(), interval);
    }

    playBeat(step) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        
        // Bass Drum (Step 0, 4)
        if (step % 4 === 0) this.synthKick(time);
        
        // Hi-Hat (Step 2, 6)
        if (step % 2 === 1) this.synthHiHat(time);
        
        // Bass Line (Melodic)
        const notes = [110, 110, 164, 110, 146, 110, 130, 220]; // A2, E3...
        this.synthBass(time, notes[step]);
    }

    synthKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    synthHiHat(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000, time);
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.05);
    }

    synthBass(time, freq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.2);
    }
    
    playClear(count) {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const baseFreq = 440;
        
        for (let i = 0; i < count; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const freq = baseFreq * Math.pow(1.2, i); // Harmonic increase
            
            osc.frequency.setValueAtTime(freq, time + i * 0.05);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, time + i * 0.05 + 0.1);
            
            gain.gain.setValueAtTime(0.1, time + i * 0.05);
            gain.gain.linearRampToValueAtTime(0, time + i * 0.05 + 0.1);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(time + i * 0.05);
            osc.stop(time + i * 0.05 + 0.1);
        }
    }

    playLand() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.linearRampToValueAtTime(0, time + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
    }
}
