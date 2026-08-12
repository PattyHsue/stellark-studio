/**
 * UTT-v2.0 Audio: Engine Hum & Combat Synthesis
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.engineFreq = 60;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playEngine() {
        if (!this.ctx) return;
        // Simple continuous hum (low freq)
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(this.engineFreq, time);
        gain.gain.setValueAtTime(0.01, time);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(time);
        this.engineOsc = osc;
    }

    playFire() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(200, time);
        o.frequency.exponentialRampToValueAtTime(10, time + 0.1);
        g.gain.setValueAtTime(0.3, time);
        g.gain.linearRampToValueAtTime(0, time + 0.1);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(time); o.stop(time+0.1);
    }

    playExplosion() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const noiseNodes = [];
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.exponentialRampToValueAtTime(40, time + 0.4);

        g.gain.setValueAtTime(0.5, time);
        g.gain.linearRampToValueAtTime(0, time + 0.4);
        source.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        source.start(time);
    }
}
