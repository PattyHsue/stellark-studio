/**
 * ============================================================
 * 011_FISHINGSIM | 釣魚大師
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Clean SOLID design
 *   - WaterRenderer: procedural wave physics + gradient sky
 *   - FishSchool: AI fish with behavioral patterns
 *   - RodPhysics: casting arc + line tension simulation
 *   - CatchEngine: random probability + rarity tiers
 *   - AutoPilot: full auto-fishing demo
 *   - AudioManager: procedural Web Audio SFX
 *   - VFXEngine: splash + sparkle particles
 *   - AdManager: monetization loop for bait refill
 *
 * Complexity (Ada):
 *   Water render: O(W) per frame, W = canvas width
 *   Fish AI: O(F) per frame, F = active fish count
 *   Catch prob: O(1) weighted random
 * ============================================================
 */

'use strict';

/* ============================================================
 * Section 1: FISH DATABASE
 * ============================================================ */
const FISH_DB = [
    { id: 'sardine',    name: '沙丁魚',   emoji: '🐟', rarity: 'common',    weight: [0.1, 0.5],  points: 50,   prob: 0.30, fight: 0.2, speed: 2.5, color: '#74b9ff' },
    { id: 'mackerel',   name: '鯖魚',     emoji: '🐠', rarity: 'common',    weight: [0.3, 1.5],  points: 80,   prob: 0.25, fight: 0.3, speed: 2.0, color: '#55efc4' },
    { id: 'sea_bream',  name: '鯛魚',     emoji: '🐡', rarity: 'uncommon',  weight: [0.5, 3.0],  points: 150,  prob: 0.18, fight: 0.5, speed: 1.8, color: '#fd79a8' },
    { id: 'squid',      name: '烏賊',     emoji: '🦑', rarity: 'uncommon',  weight: [0.2, 2.0],  points: 120,  prob: 0.12, fight: 0.4, speed: 3.0, color: '#a29bfe' },
    { id: 'tuna',       name: '鮪魚',     emoji: '🐟', rarity: 'rare',      weight: [2.0, 15.0], points: 400,  prob: 0.08, fight: 0.8, speed: 4.0, color: '#0984e3' },
    { id: 'swordfish',  name: '旗魚',     emoji: '🗡️', rarity: 'rare',      weight: [5.0, 30.0], points: 600,  prob: 0.04, fight: 0.9, speed: 4.5, color: '#6c5ce7' },
    { id: 'whale_shark',name: '鯨鯊',     emoji: '🦈', rarity: 'legendary', weight: [50, 200],   points: 2000, prob: 0.02, fight: 1.0, speed: 1.5, color: '#ffeaa7' },
    { id: 'golden_koi', name: '黃金錦鯉', emoji: '✨', rarity: 'legendary', weight: [1.0, 5.0],  points: 3000, prob: 0.01, fight: 0.6, speed: 2.0, color: '#fdcb6e' },
];

const RARITY_LABELS = {
    common: '普通', uncommon: '稀有', rare: '珍稀', legendary: '傳說'
};
const RARITY_CLASSES = {
    common: 'rarity-common', uncommon: 'rarity-uncommon', rare: 'rarity-rare', legendary: 'rarity-legendary'
};

/* ============================================================
 * Section 2: AUDIO MANAGER
 * ============================================================ */
class AudioManager {
    constructor() { this.ctx = null; this.enabled = true; }

    init() {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { this.enabled = false; }
    }

    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);

            switch (type) {
                case 'cast':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc.start(now); osc.stop(now + 0.4);
                    break;
                case 'splash':
                    // White noise burst for splash
                    const bufSize = this.ctx.sampleRate * 0.15;
                    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
                    const data = buf.getChannelData(0);
                    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
                    const src = this.ctx.createBufferSource();
                    const g2 = this.ctx.createGain();
                    src.buffer = buf; src.connect(g2); g2.connect(this.ctx.destination);
                    g2.gain.setValueAtTime(0.15, now);
                    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    src.start(now);
                    return;
                case 'bite':
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(800, now + 0.05);
                    osc.frequency.setValueAtTime(600, now + 0.1);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
                case 'reel':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(300 + Math.random() * 100, now);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                    osc.start(now); osc.stop(now + 0.06);
                    break;
                case 'catch':
                    osc.type = 'sine';
                    [523, 659, 784, 1047].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.1));
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                    osc.start(now); osc.stop(now + 0.6);
                    break;
                case 'snap':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc.start(now); osc.stop(now + 0.25);
                    break;
                case 'legendary':
                    osc.type = 'sine';
                    [523, 784, 1047, 1319, 1568].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.12));
                    gain.gain.setValueAtTime(0.18, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
                    osc.start(now); osc.stop(now + 1.0);
                    break;
            }
        } catch (e) { /* silent */ }
    }
}

/* ============================================================
 * Section 3: VFX ENGINE
 * ============================================================ */
class VFXEngine {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
    }

    emitSplash(x, y) {
        for (let i = 0; i < 18; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 4, color: `hsla(195, 80%, ${60 + Math.random() * 30}%, `
            });
        }
    }

    emitSparkle(x, y, color = '#ffeaa7') {
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
                life: 1, decay: 0.015 + Math.random() * 0.015,
                size: 2 + Math.random() * 3, color: color.replace(')', ',').replace('rgb', 'rgba') || `hsla(45, 90%, 70%, `
            });
        }
    }

    emitBubbles(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -0.5 - Math.random() * 1.5,
                life: 1, decay: 0.008 + Math.random() * 0.01,
                size: 2 + Math.random() * 5,
                color: 'hsla(195, 70%, 70%, ',
                isBubble: true
            });
        }
    }

    update() {
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (!p.isBubble) p.vy += 0.12;
            p.life -= p.decay;
            if (p.life <= 0) return false;

            this.ctx.globalAlpha = p.life;
            if (p.isBubble) {
                this.ctx.strokeStyle = p.color + p.life + ')';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = p.color + p.life + ')';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                this.ctx.fill();
            }
            return true;
        });
        this.ctx.globalAlpha = 1;
    }
}

/* ============================================================
 * Section 4: AD MANAGER
 * ============================================================ */
class AdManager {
    constructor() {
        this.overlay = document.getElementById('ad-overlay');
        this.timerEl = document.getElementById('ad-timer');
    }

    show(reward) {
        return new Promise(resolve => {
            this.overlay.classList.add('active');
            let sec = 5;
            this.timerEl.textContent = `${sec} 秒後關閉`;
            const iv = setInterval(() => {
                sec--;
                this.timerEl.textContent = sec > 0 ? `${sec} 秒後關閉` : '✓ 感謝觀看！';
                if (sec <= 0) {
                    clearInterval(iv);
                    setTimeout(() => {
                        this.overlay.classList.remove('active');
                        resolve(reward);
                    }, 600);
                }
            }, 1000);
        });
    }
}

/* ============================================================
 * Section 5: ELITE ENGINE (Main Controller)
 * ============================================================ */
class EliteEngine {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');

        // DOM refs
        this.scoreEl = document.getElementById('score-val');
        this.catchCountEl = document.getElementById('catch-count');
        this.baitEl = document.getElementById('bait-display');
        this.maxSizeEl = document.getElementById('max-size');
        this.autoStatusEl = document.getElementById('auto-pilot-status');
        this.tensionFill = document.getElementById('tension-bar-fill');
        this.actionBtn = document.getElementById('action-btn');
        this.catchInfo = document.getElementById('catch-info');
        this.catchEmoji = document.getElementById('catch-emoji');
        this.catchName = document.getElementById('catch-name');
        this.catchDetails = document.getElementById('catch-details');
        this.catchRarity = document.getElementById('catch-rarity');
        this.overlayEl = document.getElementById('game-overlay');
        this.overlayBtn = document.getElementById('init-game-btn');
        this.collectionPanel = document.getElementById('collection-panel');
        this.collectionList = document.getElementById('collection-list');

        // Subsystems
        this.audio = new AudioManager();
        this.vfx = new VFXEngine(this.ctx);
        this.adManager = new AdManager();

        // Game state
        this.state = 'idle'; // idle | casting | waiting | biting | reeling | caught | snapped
        this.score = 0;
        this.catches = 0;
        this.bait = 10;
        this.maxWeight = 0;
        this.autoMode = false;
        this.autoTimer = null;
        this.collection = {};
        this.gameActive = false;

        // Physics
        this.rodX = 0; this.rodY = 0;
        this.hookX = 0; this.hookY = 0;
        this.hookTargetX = 0; this.hookTargetY = 0;
        this.castProgress = 0;
        this.lineAngle = 0;
        this.tension = 0;
        this.bobberY = 0;
        this.bobberBaseY = 0;

        // Water
        this.waterLevel = 0;
        this.waveTime = 0;
        this.waves = [];

        // Fish
        this.fish = [];
        this.currentFish = null;
        this.biteTimer = 0;
        this.reelProgress = 0;

        // Frame
        this.lastTime = 0;
        this.animId = null;

        // Persistence
        this.highScore = parseInt(localStorage.getItem('fishing_highScore') || '0');

        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._bindEvents();
    }

    _resize() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
        this.waterLevel = this.H * 0.38;
        this.rodX = this.W * 0.2;
        this.rodY = this.waterLevel - 30;
    }

    _bindEvents() {
        this.overlayBtn.addEventListener('click', () => this._startGame());
        this.actionBtn.addEventListener('click', () => this._actionPress());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        document.getElementById('bait-btn').addEventListener('click', () => this._refillBait());
        document.getElementById('collection-toggle').addEventListener('click', () => {
            this.collectionPanel.classList.toggle('open');
        });
        document.addEventListener('pointerdown', () => this.audio.wake(), { once: true });
    }

    /* --- Start Game --- */
    _startGame() {
        this.audio.init();
        this.audio.wake();
        this.gameActive = true;
        this.state = 'idle';
        this.score = 0;
        this.catches = 0;
        this.bait = 10;
        this.maxWeight = 0;
        this.tension = 0;
        this.collection = {};
        this.fish = [];
        this._spawnFish(8);
        this._updateHUD();
        this._updateCollection();
        this.overlayEl.classList.remove('active');
        this.actionBtn.textContent = '拋竿';
        this.actionBtn.style.display = 'block';

        if (this.animId) cancelAnimationFrame(this.animId);
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    }

    /* --- Main Loop --- */
    _loop(ts) {
        const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;
        this.waveTime += dt;

        this._updatePhysics(dt);
        this._updateFishAI(dt);
        this._render();
        this.vfx.update();

        if (this.gameActive) {
            this.animId = requestAnimationFrame(t => this._loop(t));
        }
    }

    /* --- Physics Update --- */
    _updatePhysics(dt) {
        // Wave generation
        if (this.state !== 'idle') {
            this.bobberY = this.bobberBaseY + Math.sin(this.waveTime * 2.5) * 3 + Math.sin(this.waveTime * 1.3) * 2;
        }

        // Casting animation
        if (this.state === 'casting') {
            this.castProgress += dt * 3;
            if (this.castProgress >= 1) {
                this.castProgress = 1;
                this.state = 'waiting';
                this.hookX = this.hookTargetX;
                this.hookY = this.hookTargetY;
                this.bobberBaseY = this.hookY;
                this.bobberY = this.bobberBaseY;
                this.biteTimer = 2 + Math.random() * 5;
                this.audio.play('splash');
                this.vfx.emitSplash(this.hookX, this.waterLevel);
            } else {
                // Arc trajectory
                const t = this.castProgress;
                this.hookX = this.rodX + (this.hookTargetX - this.rodX) * t;
                this.hookY = this.rodY + (this.hookTargetY - this.rodY) * t - Math.sin(t * Math.PI) * 120;
            }
        }

        // Waiting for bite
        if (this.state === 'waiting') {
            this.biteTimer -= dt;
            // Periodic bubbles
            if (Math.random() < 0.02) {
                this.vfx.emitBubbles(this.hookX + (Math.random() - 0.5) * 40, this.bobberY + 10, 2);
            }

            if (this.biteTimer <= 0) {
                this._triggerBite();
            }
        }

        // Fish biting — bobber bobs violently
        if (this.state === 'biting') {
            this.biteTimer -= dt;
            this.bobberY = this.bobberBaseY + Math.sin(this.waveTime * 15) * 8;
            if (this.biteTimer <= 0) {
                // Fish got away
                this.state = 'waiting';
                this.biteTimer = 3 + Math.random() * 4;
                this.currentFish = null;
            }
        }

        // Reeling
        if (this.state === 'reeling' && this.currentFish) {
            // Fish fights back
            const fight = this.currentFish.template.fight;
            this.tension += (fight * 0.8 + Math.sin(this.waveTime * 3) * fight * 0.3) * dt * 60;
            this.tension -= dt * 20; // Natural decay
            this.tension = Math.max(0, Math.min(100, this.tension));

            // Update tension bar visual
            this.tensionFill.style.width = this.tension + '%';
            this.tensionFill.className = '';
            if (this.tension > 80) this.tensionFill.className = 'danger';
            else if (this.tension > 55) this.tensionFill.className = 'warning';

            // Reel progress
            this.reelProgress += dt * (0.3 - fight * 0.15);

            // Move hook toward rod
            const dx = this.rodX - this.hookX;
            const dy = this.rodY - this.hookY;
            this.hookX += dx * dt * 0.5;
            this.hookY += dy * dt * 0.3;
            this.bobberY = this.hookY;

            // Fish pulls sideways
            this.hookX += Math.sin(this.waveTime * 4) * fight * 30 * dt;

            this.audio.play('reel');

            if (this.tension >= 100) {
                this._lineSnap();
            } else if (this.reelProgress >= 1) {
                this._catchFish();
            }
        }
    }

    /* --- Fish AI --- */
    _spawnFish(count) {
        for (let i = 0; i < count; i++) {
            const template = FISH_DB[Math.floor(Math.random() * FISH_DB.length)];
            this.fish.push({
                x: Math.random() * this.W,
                y: this.waterLevel + 30 + Math.random() * (this.H - this.waterLevel - 60),
                vx: (Math.random() - 0.5) * template.speed * 40,
                vy: 0,
                size: 8 + Math.random() * 12,
                template,
                turnTimer: 2 + Math.random() * 4,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    _updateFishAI(dt) {
        this.fish.forEach(f => {
            f.phase += dt * 3;
            f.x += f.vx * dt;
            f.y += Math.sin(f.phase) * 0.3;

            // Turn timer
            f.turnTimer -= dt;
            if (f.turnTimer <= 0) {
                f.vx = (Math.random() - 0.5) * f.template.speed * 40;
                f.turnTimer = 2 + Math.random() * 5;
            }

            // Wrap around
            if (f.x < -50) f.x = this.W + 50;
            if (f.x > this.W + 50) f.x = -50;

            // Keep in water
            f.y = Math.max(this.waterLevel + 20, Math.min(this.H - 20, f.y));
        });
    }

    /* --- Bite Logic --- */
    _triggerBite() {
        // Weighted random fish selection
        const roll = Math.random();
        let cumProb = 0;
        let selected = FISH_DB[0];
        for (const f of FISH_DB) {
            cumProb += f.prob;
            if (roll <= cumProb) { selected = f; break; }
        }

        const weight = selected.weight[0] + Math.random() * (selected.weight[1] - selected.weight[0]);
        this.currentFish = {
            template: selected,
            weight: Math.round(weight * 10) / 10
        };

        this.state = 'biting';
        this.biteTimer = 2 + Math.random() * 1.5; // Window to react
        this.audio.play('bite');

        // Auto mode: auto-reel after short delay
        if (this.autoMode) {
            setTimeout(() => {
                if (this.state === 'biting') this._startReeling();
            }, 300 + Math.random() * 500);
        }
    }

    _startReeling() {
        if (this.state !== 'biting') return;
        this.state = 'reeling';
        this.reelProgress = 0;
        this.tension = 20;
        this.actionBtn.textContent = '收線中...';
        this.actionBtn.classList.add('reeling');
    }

    _catchFish() {
        this.state = 'caught';
        const fish = this.currentFish;
        const template = fish.template;

        this.score += template.points;
        this.catches++;
        if (fish.weight > this.maxWeight) this.maxWeight = fish.weight;

        // Update collection
        if (!this.collection[template.id]) {
            this.collection[template.id] = { ...template, count: 0, maxWeight: 0 };
        }
        this.collection[template.id].count++;
        if (fish.weight > this.collection[template.id].maxWeight) {
            this.collection[template.id].maxWeight = fish.weight;
        }

        // Sound
        if (template.rarity === 'legendary') this.audio.play('legendary');
        else this.audio.play('catch');

        // VFX
        this.vfx.emitSparkle(this.rodX, this.rodY - 30,
            template.rarity === 'legendary' ? 'rgba(251, 191, 36,' : 'rgba(46, 213, 115,');

        // Display catch info
        this.catchEmoji.textContent = template.emoji;
        this.catchName.textContent = template.name;
        this.catchDetails.textContent = `重量: ${fish.weight} kg | 得分: +${template.points}`;
        this.catchRarity.textContent = RARITY_LABELS[template.rarity];
        this.catchRarity.className = 'fish-rarity ' + RARITY_CLASSES[template.rarity];
        this.catchInfo.classList.add('visible');

        // Reset
        this.tension = 0;
        this.tensionFill.style.width = '0%';
        this.tensionFill.className = '';
        this.actionBtn.classList.remove('reeling');
        this._updateHUD();
        this._updateCollection();

        // Hide catch info and reset
        setTimeout(() => {
            this.catchInfo.classList.remove('visible');
            this.currentFish = null;
            this.state = 'idle';
            this.bait--;
            this._updateHUD();
            this.actionBtn.textContent = '拋竿';

            if (this.bait <= 0) {
                this._gameOver();
            } else if (this.autoMode) {
                setTimeout(() => {
                    if (this.autoMode && this.gameActive) this._actionPress();
                }, 800);
            }
        }, 2000);
    }

    _lineSnap() {
        this.state = 'snapped';
        this.audio.play('snap');
        this.tension = 0;
        this.tensionFill.style.width = '0%';
        this.tensionFill.className = '';
        this.actionBtn.classList.remove('reeling');

        this.vfx.emitSplash(this.hookX, this.bobberY);

        this.currentFish = null;
        this.bait--;
        this._updateHUD();

        this.actionBtn.textContent = '斷線了！';

        setTimeout(() => {
            this.state = 'idle';
            this.actionBtn.textContent = '拋竿';
            if (this.bait <= 0) {
                this._gameOver();
            } else if (this.autoMode) {
                setTimeout(() => {
                    if (this.autoMode && this.gameActive) this._actionPress();
                }, 500);
            }
        }, 1500);
    }

    /* --- Action Button --- */
    _actionPress() {
        if (!this.gameActive) return;

        switch (this.state) {
            case 'idle':
                if (this.bait <= 0) return;
                this._cast();
                break;
            case 'biting':
                this._startReeling();
                break;
            case 'reeling':
                // Press to reduce tension
                this.tension = Math.max(0, this.tension - 8);
                break;
        }
    }

    _cast() {
        this.state = 'casting';
        this.castProgress = 0;
        this.hookTargetX = this.W * 0.4 + Math.random() * this.W * 0.35;
        this.hookTargetY = this.waterLevel + 10 + Math.random() * 20;
        this.hookX = this.rodX;
        this.hookY = this.rodY;
        this.actionBtn.textContent = '等待上鉤...';
        this.audio.play('cast');
    }

    /* --- Auto Mode --- */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        this.autoStatusEl.textContent = this.autoMode ? 'ON' : 'OFF';
        document.getElementById('auto-pilot-toggle').classList.toggle('active', this.autoMode);

        if (this.autoMode && this.gameActive && this.state === 'idle') {
            this._actionPress();
        }

        // Auto tension management
        if (this.autoMode) {
            this.autoTimer = setInterval(() => {
                if (this.state === 'reeling' && this.tension > 50) {
                    this.tension = Math.max(0, this.tension - 12);
                }
            }, 200);
        } else {
            clearInterval(this.autoTimer);
        }
    }

    /* --- Bait Refill --- */
    async _refillBait() {
        const reward = await this.adManager.show('bait');
        if (reward) {
            this.bait += 5;
            this._updateHUD();
        }
    }

    /* --- Game Over --- */
    _gameOver() {
        this.gameActive = false;
        if (this.autoMode) {
            this.autoMode = false;
            clearInterval(this.autoTimer);
            this.autoStatusEl.textContent = 'OFF';
            document.getElementById('auto-pilot-toggle').classList.remove('active');
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fishing_highScore', String(this.highScore));
        }

        this.actionBtn.style.display = 'none';

        setTimeout(() => {
            const h2 = this.overlayEl.querySelector('h2');
            const sub = this.overlayEl.querySelector('.subtitle');
            h2.textContent = '🎣 釣魚結束！';
            sub.innerHTML = `
                總分: <strong>${this.score.toLocaleString()}</strong><br>
                捕獲: <strong>${this.catches} 條</strong><br>
                最大魚獲: <strong>${this.maxWeight} kg</strong><br>
                最高分: <strong>${this.highScore.toLocaleString()}</strong>
            `;
            this.overlayBtn.textContent = '再次出海';
            this.overlayEl.classList.add('active');
        }, 500);
    }

    /* --- HUD --- */
    _updateHUD() {
        this.scoreEl.textContent = String(this.score).padStart(6, '0');
        this.catchCountEl.textContent = this.catches;
        this.baitEl.textContent = this.bait;
        this.maxSizeEl.textContent = this.maxWeight > 0 ? this.maxWeight + 'kg' : '--';
    }

    /* --- Collection --- */
    _updateCollection() {
        this.collectionList.innerHTML = '';
        const entries = Object.values(this.collection).sort((a, b) => {
            const order = { legendary: 0, rare: 1, uncommon: 2, common: 3 };
            return (order[a.rarity] || 3) - (order[b.rarity] || 3);
        });

        if (entries.length === 0) {
            this.collectionList.innerHTML = '<p style="font-size:0.7rem; opacity:0.4; text-align:center; margin-top:20px">尚未捕獲任何魚類</p>';
            return;
        }

        entries.forEach(f => {
            const div = document.createElement('div');
            div.className = 'collection-item';
            div.innerHTML = `
                <span class="c-emoji">${f.emoji}</span>
                <span class="c-name">${f.name}</span>
                <span class="c-count">×${f.count} | ${f.maxWeight}kg</span>
            `;
            this.collectionList.appendChild(div);
        });
    }

    /* ============================================================
     * Section 6: RENDERING
     * ============================================================ */
    _render() {
        const { ctx, W, H } = this;
        ctx.clearRect(0, 0, W, H);

        this._drawSky();
        this._drawWater();
        this._drawFish();
        this._drawRod();
        this._drawLine();
        this._drawBobber();
        this._drawUI();
    }

    _drawSky() {
        const { ctx, W, waterLevel } = this;
        // Gradient sky with stars
        const grad = ctx.createLinearGradient(0, 0, 0, waterLevel);
        grad.addColorStop(0, '#0a0e1a');
        grad.addColorStop(0.4, '#0d1b38');
        grad.addColorStop(0.7, '#1a3556');
        grad.addColorStop(1, '#2a5a80');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, waterLevel);

        // Stars
        const starSeed = 42;
        for (let i = 0; i < 60; i++) {
            const sx = ((i * 137 + starSeed) % W);
            const sy = ((i * 97 + starSeed * 2) % (waterLevel * 0.7));
            const brightness = 0.3 + Math.sin(this.waveTime * 0.5 + i) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fillRect(sx, sy, 1.5, 1.5);
        }

        // Moon
        ctx.fillStyle = 'rgba(255, 248, 220, 0.9)';
        ctx.beginPath();
        ctx.arc(W * 0.8, waterLevel * 0.25, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 248, 220, 0.1)';
        ctx.beginPath();
        ctx.arc(W * 0.8, waterLevel * 0.25, 45, 0, Math.PI * 2);
        ctx.fill();

        // Moon reflection on water
        ctx.fillStyle = 'rgba(255, 248, 220, 0.04)';
        ctx.fillRect(W * 0.75, waterLevel, W * 0.1, this.H - waterLevel);
    }

    _drawWater() {
        const { ctx, W, H, waterLevel } = this;

        // Water body gradient
        const grad = ctx.createLinearGradient(0, waterLevel, 0, H);
        grad.addColorStop(0, 'rgba(13, 40, 71, 0.95)');
        grad.addColorStop(0.3, 'rgba(8, 32, 64, 0.97)');
        grad.addColorStop(1, 'rgba(4, 18, 48, 1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, waterLevel, W, H - waterLevel);

        // Wave surface
        ctx.beginPath();
        ctx.moveTo(0, waterLevel);
        for (let x = 0; x <= W; x += 3) {
            const y = waterLevel
                + Math.sin(x * 0.015 + this.waveTime * 1.5) * 4
                + Math.sin(x * 0.03 + this.waveTime * 2.2) * 2
                + Math.sin(x * 0.008 + this.waveTime * 0.8) * 5;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(W, waterLevel - 5);
        ctx.lineTo(0, waterLevel - 5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(34, 170, 221, 0.15)';
        ctx.fill();

        // Light caustics (underwater shimmer)
        for (let i = 0; i < 8; i++) {
            const cx = (i * 130 + Math.sin(this.waveTime * 0.7 + i) * 50) % W;
            const cy = waterLevel + 50 + i * 40;
            const r = 30 + Math.sin(this.waveTime + i) * 15;
            ctx.fillStyle = `rgba(68, 221, 255, ${0.02 + Math.sin(this.waveTime * 1.5 + i) * 0.01})`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, r, r * 0.4, Math.sin(this.waveTime * 0.3 + i) * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _drawFish() {
        const { ctx } = this;
        this.fish.forEach(f => {
            ctx.save();
            ctx.translate(f.x, f.y);
            const dir = f.vx >= 0 ? 1 : -1;
            ctx.scale(dir, 1);

            // Fish body
            ctx.fillStyle = f.template.color;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-f.size, 0);
            ctx.lineTo(-f.size - 6, -5);
            ctx.lineTo(-f.size - 6, 5);
            ctx.closePath();
            ctx.fill();

            // Eye
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(f.size * 0.5, -2, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
        ctx.globalAlpha = 1;
    }

    _drawRod() {
        const { ctx, rodX, rodY, waterLevel } = this;

        // Fisherman (simple silhouette)
        ctx.fillStyle = '#1a1a2e';
        // Body
        ctx.fillRect(rodX - 25, rodY - 50, 15, 55);
        // Head
        ctx.beginPath();
        ctx.arc(rodX - 18, rodY - 58, 10, 0, Math.PI * 2);
        ctx.fill();
        // Hat
        ctx.fillRect(rodX - 30, rodY - 68, 24, 4);

        // Rod
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rodX - 12, rodY - 35);
        ctx.quadraticCurveTo(rodX + 30, rodY - 80, rodX + 60, rodY - 60);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rodX + 60, rodY - 60);
        ctx.lineTo(rodX + 90, rodY - 45);
        ctx.stroke();

        // Rod tip glow
        ctx.fillStyle = 'rgba(232, 168, 85, 0.4)';
        ctx.beginPath();
        ctx.arc(rodX + 90, rodY - 45, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawLine() {
        const { ctx, rodX, rodY, hookX, hookY } = this;
        if (this.state === 'idle' || this.state === 'snapped') return;

        const tipX = rodX + 90;
        const tipY = rodY - 45;

        ctx.strokeStyle = this.state === 'reeling'
            ? `rgba(255, ${Math.max(100, 255 - this.tension * 2)}, ${Math.max(50, 200 - this.tension * 2)}, 0.7)`
            : 'rgba(200, 200, 220, 0.5)';
        ctx.lineWidth = this.state === 'reeling' ? 2 : 1;
        ctx.setLineDash(this.state === 'reeling' ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);

        // Slight curve in line
        const midX = (tipX + hookX) / 2;
        const midY = (tipY + (this.bobberY || hookY)) / 2 + 15;
        ctx.quadraticCurveTo(midX, midY, hookX, this.bobberY || hookY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    _drawBobber() {
        const { ctx, hookX, bobberY } = this;
        if (this.state === 'idle' || this.state === 'casting' || this.state === 'snapped' || this.state === 'caught') return;

        const y = bobberY;
        // Bobber
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.ellipse(hookX, y - 4, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(hookX, y - 9, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Exclamation for biting
        if (this.state === 'biting') {
            ctx.fillStyle = '#fffa65';
            ctx.font = 'bold 22px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('❗', hookX, y - 25);

            // Glow ring
            ctx.strokeStyle = 'rgba(255, 250, 101, 0.3)';
            ctx.lineWidth = 2;
            const ringR = 15 + Math.sin(this.waveTime * 10) * 5;
            ctx.beginPath();
            ctx.arc(hookX, y, ringR, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    _drawUI() {
        const { ctx, W, H } = this;

        // State text
        if (this.state === 'waiting') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.font = '300 14px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('等待魚兒上鉤...', W / 2, H - 100);
        } else if (this.state === 'biting') {
            ctx.fillStyle = 'rgba(255, 250, 101, 0.8)';
            ctx.font = 'bold 18px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('🎣 有魚上鉤！點擊收線！', W / 2, H - 100);
        } else if (this.state === 'reeling') {
            ctx.fillStyle = 'rgba(255, 159, 67, 0.7)';
            ctx.font = '600 14px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('持續點擊降低張力！', W / 2, H - 100);
        }
    }
}

/* ============================================================
 * Section 7: BOOTSTRAP
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const engine = new EliteEngine();
});
