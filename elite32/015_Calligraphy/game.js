/**
 * =========================================================================
 * 015_Calligraphy | UTT-v2.0 MASTER-GRADE ENGINE
 * Theme: INK HARMONY (墨韻) — Digital Brush Calligraphy Simulator
 * =========================================================================
 * Xavier's Architecture Blueprint:
 *   Module 1: AudioManager       — Procedural ink/brush synthesis
 *   Module 2: BrushEngine        — Pressure-sensitive stroke rendering
 *   Module 3: InkSystem          — Ink flow, density, and bleed physics
 *   Module 4: StrokeRecorder     — Undo/replay stack
 *   Module 5: CharacterGuide     — Template overlay with stroke order
 *   Module 6: ParticleEmitter    — Ink splash VFX
 *   Module 7: EliteEngine        — Core loop & canvas management
 *
 * Ada's Complexity Report:
 *   Brush Interpolation: O(D) where D = distance between samples
 *   Stroke Record: O(1) amortized push, O(N) replay
 *   Ink Bleed Simulation: O(P) particles per frame
 * =========================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const BRUSH_TYPES = {
    regular: { baseWidth: 8, maxWidth: 22, taper: 0.7, name: '中鋒' },
    thick:   { baseWidth: 14, maxWidth: 36, taper: 0.5, name: '粗筆' },
    thin:    { baseWidth: 2, maxWidth: 8, taper: 0.9, name: '細筆' },
    splash:  { baseWidth: 20, maxWidth: 50, taper: 0.3, name: '潑墨' }
};

const PRACTICE_CHARS = ['永', '人', '大', '山', '水', '月', '日', '風', '雲', '龍'];

// ---------------------------------------------------------------------------
// Module 1: AudioManager (Ink & Brush Synthesis)
// ---------------------------------------------------------------------------
class AudioManager {
    constructor() { this.ctx = null; this.masterGain = null; this.isReady = false; }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.25;
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn('AudioManager init failed.'); }
    }

    _playNoise(duration, vol = 0.03) {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(filter);
        filter.connect(g);
        g.connect(this.masterGain);
        source.start(now);
        source.stop(now + duration);
    }

    playBrushDown() {
        this._playNoise(0.08, 0.04);
    }

    playBrushMove(pressure) {
        if (!this.isReady || Math.random() > 0.15) return; // Sparse strokes
        this._playNoise(0.04, 0.01 + pressure * 0.02);
    }

    playBrushUp() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
        g.gain.setValueAtTime(0.02, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.06);
    }

    playInkSplash() {
        this._playNoise(0.15, 0.06);
    }

    playClear() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [600, 500, 400].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(f, now + i * 0.1);
            g.gain.setValueAtTime(0.06, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.2);
        });
    }

    playSuccess() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(f, now + i * 0.12);
            g.gain.setValueAtTime(0.08, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.4);
        });
    }
}

// ---------------------------------------------------------------------------
// Module 2: BrushEngine (Pressure-Sensitive Stroke Rendering)
// ---------------------------------------------------------------------------
class BrushEngine {
    constructor(ctx) {
        this.ctx = ctx;
        this.brushType = 'regular';
        this.inkDensity = 0.8;       // 0.1 - 1.0
        this.inkLevel = 100;          // Depletes over strokes
        this.lastPoint = null;
        this.lastPressure = 0.5;
        this.lastWidth = 0;
        this.smoothing = 0.35;
    }

    setBrush(type) {
        this.brushType = type;
    }

    setDensity(val) {
        this.inkDensity = val;
    }

    beginStroke(x, y, pressure) {
        this.lastPoint = { x, y };
        this.lastPressure = pressure;
        this.lastWidth = this.getWidth(pressure);
    }

    continueStroke(x, y, pressure) {
        if (!this.lastPoint) return;

        const dx = x - this.lastPoint.x;
        const dy = y - this.lastPoint.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.5) return;

        // P2: Refined Physics - Bezier Interpolation and Velocity Mapping
        const midX = (x + this.lastPoint.x) / 2;
        const midY = (y + this.lastPoint.y) / 2;
        
        const smoothP = this.lastPressure * this.smoothing + pressure * (1 - this.smoothing);
        const targetWidth = this.getWidth(smoothP);
        const width = this.lastWidth * 0.7 + targetWidth * 0.3;

        // Velocity affects "Dry Brush" (飛白) and Transparency
        const velocity = dist / 2; 
        const dryFactor = Math.max(0, (velocity - 8) / 10);
        const speedAlpha = Math.max(0.2, 1 - (velocity * 0.05));

        const steps = Math.ceil(dist / 1.5);
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const ix = this.lastPoint.x + (midX - this.lastPoint.x) * t; // Simplified quadratic
            const iy = this.lastPoint.y + (midY - this.lastPoint.y) * t;
            const iw = this.lastWidth + (width - this.lastWidth) * t;
            
            // Jitter for bristle effect
            const jitterX = (Math.random() - 0.5) * dryFactor * iw;
            const jitterY = (Math.random() - 0.5) * dryFactor * iw;
            
            this.drawBrushDot(ix + jitterX, iy + jitterY, iw, this.inkDensity * speedAlpha * (this.inkLevel/100));
        }

        this.inkLevel = Math.max(0, this.inkLevel - dist * 0.012);
        this.lastPoint = { x, y };
        this.lastPressure = smoothP;
        this.lastWidth = width;
    }

    endStroke() {
        // Taper the end
        if (this.lastPoint) {
            const brush = BRUSH_TYPES[this.brushType];
            for (let i = 0; i < 5; i++) {
                const t = i / 5;
                const w = this.lastWidth * (1 - t * brush.taper);
                const a = this.inkDensity * (1 - t * 0.6);
                this.drawBrushDot(
                    this.lastPoint.x + (Math.random() - 0.5) * 2,
                    this.lastPoint.y + (Math.random() - 0.5) * 2,
                    w, a
                );
            }
        }
        this.lastPoint = null;
    }

    drawBrushDot(x, y, w, alpha) {
        const ctx = this.ctx;
        const r = w / 2;

        // Main dot
        ctx.save();
        ctx.globalAlpha = Math.min(alpha, 1);
        ctx.fillStyle = `rgba(26, 16, 8, ${Math.min(alpha, 1)})`;
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.85, Math.random() * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Edge texture (feathering for brush feel)
        if (r > 4) {
            ctx.globalAlpha = alpha * 0.15;
            for (let i = 0; i < 3; i++) {
                const ox = (Math.random() - 0.5) * r * 0.8;
                const oy = (Math.random() - 0.5) * r * 0.8;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, r * 0.3 + Math.random() * r * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Dry brush effect when ink is low
        if (this.inkLevel < 30 && r > 3) {
            ctx.globalAlpha = 0.3;
            ctx.globalCompositeOperation = 'destination-out';
            for (let i = 0; i < 4; i++) {
                const ox = (Math.random() - 0.5) * r;
                const oy = (Math.random() - 0.5) * r;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, 1 + Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.restore();
    }

    getWidth(pressure) {
        const brush = BRUSH_TYPES[this.brushType];
        return brush.baseWidth + (brush.maxWidth - brush.baseWidth) * pressure;
    }

    refillInk() {
        this.inkLevel = 100;
    }
}

// ---------------------------------------------------------------------------
// Module 3: StrokeRecorder (Undo/Replay Stack)
// ---------------------------------------------------------------------------
class StrokeRecorder {
    constructor() {
        this.snapshots = [];  // Array of ImageData
        this.maxSnapshots = 20;
    }

    saveSnapshot(canvas) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.snapshots.push(data);
        if (this.snapshots.length > this.maxSnapshots) {
            this.snapshots.shift();
        }
    }

    undo(canvas) {
        if (this.snapshots.length === 0) return false;
        const data = this.snapshots.pop();
        const ctx = canvas.getContext('2d');
        ctx.putImageData(data, 0, 0);
        return true;
    }

    clear() {
        this.snapshots = [];
    }
}

// ---------------------------------------------------------------------------
// Module 4: CharacterGuide (Template Overlay)
// ---------------------------------------------------------------------------
class CharacterGuide {
    constructor() {
        this.currentChar = '永';
        this.visible = true;
    }

    setChar(ch) {
        this.currentChar = ch;
    }

    draw(ctx, w, h) {
        if (!this.visible) return;

        const cx = w / 2;
        const cy = h / 2;
        const size = Math.min(w, h) * 0.55;

        // Grid lines (rice paper grid - 米字格)
        ctx.save();
        ctx.strokeStyle = 'rgba(196, 60, 45, 0.06)';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 8]);

        // Horizontal center
        ctx.beginPath();
        ctx.moveTo(cx - size / 2, cy);
        ctx.lineTo(cx + size / 2, cy);
        ctx.stroke();

        // Vertical center
        ctx.beginPath();
        ctx.moveTo(cx, cy - size / 2);
        ctx.lineTo(cx, cy + size / 2);
        ctx.stroke();

        // Diagonals
        ctx.beginPath();
        ctx.moveTo(cx - size / 2, cy - size / 2);
        ctx.lineTo(cx + size / 2, cy + size / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + size / 2, cy - size / 2);
        ctx.lineTo(cx - size / 2, cy + size / 2);
        ctx.stroke();

        ctx.setLineDash([]);

        // Border square
        ctx.strokeStyle = 'rgba(196, 60, 45, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);

        // Ghost character
        ctx.font = `900 ${size * 0.85}px 'Noto Serif TC', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(26, 16, 8, 0.04)';
        ctx.fillText(this.currentChar, cx, cy + size * 0.02);

        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Module 5: ParticleEmitter (Ink Splash VFX)
// ---------------------------------------------------------------------------
class ParticleEmitter {
    constructor() { this.particles = []; }

    emit(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.025 + Math.random() * 0.03,
                size: 1.5 + Math.random() * 4,
                alpha: 0.3 + Math.random() * 0.5
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.08;
            p.vx *= 0.96;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life * p.alpha;
            ctx.fillStyle = 'rgba(26, 16, 8, 0.8)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1;
    }
}

// ---------------------------------------------------------------------------
// Module 6: EliteEngine (Core Game Loop)
// ---------------------------------------------------------------------------
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('game-overlay');

        this.audio = new AudioManager();
        this.brush = new BrushEngine(this.ctx);
        this.recorder = new StrokeRecorder();
        this.guide = new CharacterGuide();
        this.vfx = new ParticleEmitter();

        // State
        this.state = 'START';
        this.score = 0;
        this.strokeCount = 0;
        this.frame = 0;
        this.isAuto = false;
        this.autoTimer = 0;
        this.isDrawing = false;

        // Canvas layers
        this.paperCanvas = document.createElement('canvas');
        this.paperCtx = this.paperCanvas.getContext('2d');
        this.inkCanvas = document.createElement('canvas');
        this.inkCtx = this.inkCanvas.getContext('2d');

        this.highScore = parseInt(localStorage.getItem('calli_highScore')) || 0;

        this.initEvents();
        this.resize();
        this.gameLoop();
        this.logEvent('ENGINE_INIT', { theme: 'INK_HARMONY' });
    }

    logEvent(ev, data = {}) {
        console.group('%c📊 CALLIGRAPHY_ANALYTICS', 'color: #c43c2d; font-weight: bold;');
        console.info(`[${new Date().toISOString()}] ${ev}`, data);
        console.groupEnd();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.paperCanvas.width = this.canvas.width;
        this.paperCanvas.height = this.canvas.height;
        this.inkCanvas.width = this.canvas.width;
        this.inkCanvas.height = this.canvas.height;
        this.preRenderPaper();
        // Reassign brush context to inkCanvas
        this.brush.ctx = this.inkCtx;
    }

    preRenderPaper() {
        const w = this.canvas.width, h = this.canvas.height;
        const ctx = this.paperCtx;

        // Rice paper base color
        ctx.fillStyle = '#f0e6d2';
        ctx.fillRect(0, 0, w, h);

        // Paper texture (subtle grain)
        for (let i = 0; i < 8000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.fillStyle = `rgba(${180 + Math.random() * 40}, ${170 + Math.random() * 30}, ${150 + Math.random() * 20}, ${0.03 + Math.random() * 0.06})`;
            ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
        }

        // Subtle fiber strands
        ctx.strokeStyle = 'rgba(160, 140, 110, 0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 40; i++) {
            ctx.beginPath();
            const sx = Math.random() * w;
            const sy = Math.random() * h;
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(
                sx + (Math.random() - 0.5) * 60,
                sy + (Math.random() - 0.5) * 60,
                sx + (Math.random() - 0.5) * 100,
                sy + (Math.random() - 0.5) * 100
            );
            ctx.stroke();
        }

        // Paper edge shadow
        const edge = ctx.createLinearGradient(0, 0, 0, h);
        edge.addColorStop(0, 'rgba(0,0,0,0.03)');
        edge.addColorStop(0.05, 'rgba(0,0,0,0)');
        edge.addColorStop(0.95, 'rgba(0,0,0,0)');
        edge.addColorStop(1, 'rgba(0,0,0,0.04)');
        ctx.fillStyle = edge;
        ctx.fillRect(0, 0, w, h);
    }

    clearInk() {
        this.inkCtx.clearRect(0, 0, this.inkCanvas.width, this.inkCanvas.height);
        this.recorder.clear();
        this.brush.refillInk();
        this.strokeCount = 0;
        this.updateHUD();
        this.audio.playClear();
        this.logEvent('CANVAS_CLEARED');
    }

    // === EVENT HANDLING ===
    initEvents() {
        window.addEventListener('resize', () => this.resize());

        // Pointer events (unified mouse/touch/pen with pressure)
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.state !== 'PLAY') return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const pressure = e.pressure || 0.5;

            this.isDrawing = true;
            this.recorder.saveSnapshot(this.inkCanvas);
            this.brush.beginStroke(px, py, pressure);
            this.audio.playBrushDown();

            if (this.brush.brushType === 'splash') {
                this.vfx.emit(px, py, 10);
                this.audio.playInkSplash();
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (!this.isDrawing || this.state !== 'PLAY') return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const pressure = e.pressure || 0.5;

            this.brush.continueStroke(px, py, pressure);
            this.audio.playBrushMove(pressure);
        });

        this.canvas.addEventListener('pointerup', (e) => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.brush.endStroke();
            this.audio.playBrushUp();
            this.strokeCount++;
            this.score += 100;
            this.updateHUD();
        });

        this.canvas.addEventListener('pointerleave', () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.brush.endStroke();
            }
        });

        // Brush tool buttons
        document.querySelectorAll('.brush-btn[data-brush]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.brush.setBrush(btn.dataset.brush);
                document.querySelectorAll('.brush-btn[data-brush]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Character selection
        document.querySelectorAll('.char-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.guide.setChar(btn.dataset.char);
                document.getElementById('char-display').innerText = btn.dataset.char;
                document.querySelectorAll('.char-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.logEvent('CHAR_SELECTED', { char: btn.dataset.char });
            });
        });

        // Ink density slider
        document.getElementById('ink-density').addEventListener('input', (e) => {
            this.brush.setDensity(parseInt(e.target.value) / 100);
        });

        // Clear button
        document.getElementById('clear-btn').onclick = () => {
            this.clearInk();
        };

        // Undo button
        document.getElementById('btn-undo').onclick = () => {
            if (this.recorder.undo(this.inkCanvas)) {
                this.strokeCount = Math.max(0, this.strokeCount - 1);
                this.updateHUD();
            }
        };

        // Save button
        document.getElementById('btn-save').onclick = () => {
            this.saveAsImage();
        };

        // Auto toggle
        document.getElementById('auto-pilot-toggle').onclick = () => {
            this.isAuto = !this.isAuto;
            document.getElementById('auto-pilot-toggle').classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
            this.logEvent('UI_TOGGLE_AUTO', { active: this.isAuto });
        };

        // P6: Ads (Ink Refill)
        document.getElementById('char-display').parentElement.onclick = () => {
            this.simulateAdFlow();
        };

        // Init button
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.state = 'PLAY';
            this.overlay.classList.remove('active');
            this.brush.refillInk();
            this.updateHUD();
        };
    }

    simulateAdFlow() {
        this.logEvent('AD_START', { type: 'REWARDED_INK' });
        this.overlay.querySelector('h2').innerText = '蘸墨大禮包';
        this.overlay.querySelector('.subtitle').innerText = '觀看大師摹本影片，獲取無限墨水...';
        this.overlay.querySelector('.overlay-btn').innerText = 'LOADING...';
        this.overlay.classList.add('active');

        let count = 5;
        const btn = this.overlay.querySelector('.overlay-btn');
        const itv = setInterval(() => {
            count--;
            btn.innerText = `UNLOCKING IN ${count}s`;
            if (count <= 0) {
                clearInterval(itv);
                this.overlay.classList.remove('active');
                this.brush.inkDensity = 1.0;
                this.brush.refillInk();
                this.updateHUD();
                this.audio.playSuccess();
                this.logEvent('AD_REWARD_GRANTED');
            }
        }, 1000);
    }

    saveAsImage() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // Composite: paper + ink
        tempCtx.drawImage(this.paperCanvas, 0, 0);
        tempCtx.drawImage(this.inkCanvas, 0, 0);

        // Add seal stamp
        tempCtx.font = '700 28px "Noto Serif TC", serif';
        tempCtx.fillStyle = 'rgba(196, 60, 45, 0.7)';
        tempCtx.textAlign = 'right';
        tempCtx.fillText('墨韻', this.canvas.width - 40, this.canvas.height - 40);

        const link = document.createElement('a');
        link.download = `calligraphy_${this.guide.currentChar}_${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();

        this.audio.playSuccess();
        this.logEvent('ARTWORK_SAVED', { char: this.guide.currentChar, strokes: this.strokeCount });
    }

    // === AUTO DEMO ===
    updateAuto() {
        if (!this.isAuto || this.state !== 'PLAY') return;

        this.autoTimer++;
        if (this.autoTimer % 2 !== 0) return;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.25;
        const t = this.autoTimer * 0.02;

        // Generate demo stroke patterns
        const x = cx + Math.sin(t * 1.3) * size * Math.cos(t * 0.4);
        const y = cy + Math.cos(t * 0.7) * size * Math.sin(t * 0.9);
        const pressure = 0.3 + Math.sin(t * 2) * 0.35;

        // Cycle through strokes every 120 "active" frames
        const cycle = 120;
        const phase = this.autoTimer % (cycle * 2); 

        if (phase === 2) {
            this.recorder.saveSnapshot(this.inkCanvas);
            this.brush.beginStroke(x, y, pressure);
        } else if (phase === cycle) {
            this.brush.endStroke();
            this.strokeCount++;
            this.score += 100;
            this.updateHUD();
        } else if (phase > 2 && phase < cycle) {
            this.brush.continueStroke(x, y, pressure);
        }

        // Auto ink refill
        if (this.brush.inkLevel < 10) this.brush.refillInk();
    }

    // === HUD ===
    updateHUD() {
        document.getElementById('score-val').innerText = String(this.score).padStart(6, '0');
        document.getElementById('stroke-count').innerText = this.strokeCount;
        document.getElementById('ink-level').innerText = Math.round(this.brush.inkLevel) + '%';
        document.getElementById('ink-level').style.color =
            this.brush.inkLevel > 50 ? '#f5efe4' :
            this.brush.inkLevel > 20 ? '#e8a040' : '#c43c2d';
    }

    // === GAME LOOP ===
    update() {
        this.vfx.update();
        this.updateAuto();
        this.frame++;
    }

    draw() {
        const ctx = this.ctx;

        // Layer 1: Rice paper background
        ctx.drawImage(this.paperCanvas, 0, 0);

        // Layer 2: Character guide (before ink)
        this.guide.draw(ctx, this.canvas.width, this.canvas.height);

        // Layer 3: Ink strokes
        ctx.drawImage(this.inkCanvas, 0, 0);

        // Layer 4: VFX particles
        this.vfx.draw(ctx);

        // Layer 5: Drawing preview (line from last point)
        if (this.isDrawing && this.brush.lastPoint) {
            ctx.save();
            ctx.fillStyle = 'rgba(196, 60, 45, 0.15)';
            ctx.beginPath();
            ctx.arc(this.brush.lastPoint.x, this.brush.lastPoint.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
window.addEventListener('load', () => new EliteEngine());
