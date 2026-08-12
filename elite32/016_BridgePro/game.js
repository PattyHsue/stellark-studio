/**
 * =========================================================================
 * 016_BridgePro | UTT-v2.0 MASTER-GRADE ENGINE
 * Theme: STEEL BLUEPRINT — Structural Engineering Simulation
 * =========================================================================
 * Xavier's Architecture Blueprint:
 *   Module 1: AudioManager       — Procedural synthesis (Web Audio API)
 *   Module 2: ParticleEmitter    — High-fidelity VFX (Prism Shards)
 *   Module 3: EliteEngine        — Core game loop & physics
 * 
 * Ada's Complexity Report:
 *   Bridge Solver: O(N*M) Verlet Integration per frame
 *   Hit Detection: O(N) linear scan on joints
 * =========================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// Module 1: AudioManager (Procedural Synthesis — Zero Assets)
// ---------------------------------------------------------------------------
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5;
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn('AudioManager init failed.'); }
    }

    playClick() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.06);
    }

    playPlace() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(now); osc.stop(now + 0.1);
    }

    playSnap() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            g.gain.setValueAtTime(0.1, now + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.2);
        });
    }

    playBreak() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
        noise.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(g); g.connect(this.masterGain);
        noise.start(now); noise.stop(now + 0.15);
    }

    playWin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);
            g.gain.setValueAtTime(0.18, now + i * 0.12);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.12); osc.stop(now + i * 0.12 + 0.5);
        });
    }
}

// ---------------------------------------------------------------------------
// Module 2: ParticleEmitter (High-Fidelity VFX)
// ---------------------------------------------------------------------------
class ParticleEmitter {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10, type = 'shard') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = type === 'spark' ? 3 + Math.random() * 6 : 1.5 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI,
                rotV: (Math.random() - 0.5) * 0.2,
                life: 1.0,
                decay: type === 'spark' ? 0.04 : 0.015 + Math.random() * 0.02,
                size: type === 'spark' ? 2 : 4 + Math.random() * 6,
                color,
                type
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.type === 'shard') p.vy += 0.15; // Gravity
            p.vx *= 0.98;
            p.rotation += p.rotV;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            if (p.type === 'spark') {
                ctx.shadowBlur = 10;
                ctx.shadowColor = p.color;
                ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
            } else {
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size, p.size);
                ctx.lineTo(-p.size, p.size);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

// ---------------------------------------------------------------------------
// Module 3: GeometricEntity (Bio-Animation Birds)
// ---------------------------------------------------------------------------
class BirdEntity {
    constructor(w, h) {
        this.w = w; this.h = h;
        this.reset();
    }

    reset() {
        const side = Math.random() > 0.5;
        this.x = side ? -50 : this.w + 50;
        this.y = Math.random() * (this.h * 0.4);
        this.vx = side ? 1 + Math.random() * 2 : -1 - Math.random() * 2;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.phase = Math.random() * Math.PI * 2;
        this.color = `rgba(58, 143, 216, ${0.1 + Math.random() * 0.1})`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy + Math.sin(this.x * 0.05) * 0.2;
        this.phase += 0.2;
        if (this.x < -100 || this.x > this.w + 100) this.reset();
    }

    draw(ctx) {
        const wingTip = Math.sin(this.phase) * 10;
        ctx.save();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y + wingTip);
        ctx.lineTo(this.x, this.y);
        ctx.lineTo(this.x + 8, this.y + wingTip);
        ctx.stroke();
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Module 3: Bridge Data Structures
// ---------------------------------------------------------------------------
class Joint {
    constructor(x, y, fixed = false) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.fixed = fixed;
        this.selected = false;
    }
}

class Beam {
    constructor(jointA, jointB, type = 'beam') {
        this.a = jointA;
        this.b = jointB;
        this.type = type; // 'beam', 'road', 'cable'
        this.restLength = this.getLength();
        this.stress = 0;
        this.broken = false;
        this.maxStress = type === 'cable' ? 1.8 : 1.4;
    }

    getLength() {
        const dx = this.b.x - this.a.x;
        const dy = this.b.y - this.a.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getCost() {
        const len = this.restLength;
        switch (this.type) {
            case 'road': return Math.round(len * 0.8);
            case 'cable': return Math.round(len * 0.5);
            default: return Math.round(len * 0.6);
        }
    }

    getColor() {
        if (this.broken) return '#e04050';
        if (this.stress < 0.5) return '#30d08a';
        if (this.stress < 0.8) return '#f0a030';
        return '#e04050';
    }
}

// ---------------------------------------------------------------------------
// LEVEL DATA
// ---------------------------------------------------------------------------
const LEVELS = [
    {
        name: 'FIRST SPAN',
        budget: 5000,
        fixedJoints: [{ x: 0.1, y: 0.6 }, { x: 0.9, y: 0.6 }],
        roadStartX: 0.1, roadEndX: 0.9, roadY: 0.6,
        groundY: 0.85, vehicleWeight: 2.0
    },
    {
        name: 'RIVER CROSSING',
        budget: 8000,
        fixedJoints: [{ x: 0.05, y: 0.55 }, { x: 0.5, y: 0.7 }, { x: 0.95, y: 0.55 }],
        roadStartX: 0.05, roadEndX: 0.95, roadY: 0.55,
        groundY: 0.85, vehicleWeight: 2.5
    },
    {
        name: 'THE ABYSS',
        budget: 12000,
        fixedJoints: [{ x: 0.1, y: 0.4 }, { x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 }, { x: 0.9, y: 0.4 }],
        roadStartX: 0.1, roadEndX: 0.9, roadY: 0.4,
        groundY: 0.95, vehicleWeight: 3.5,
        earthquake: true // Boss Mechanic
    },
    {
        name: 'SUSPENSION PEAK',
        budget: 15000,
        fixedJoints: [{ x: 0.05, y: 0.4 }, { x: 0.95, y: 0.4 }, { x: 0.5, y: 0.1 }],
        roadStartX: 0.05, roadEndX: 0.95, roadY: 0.4,
        groundY: 0.9, vehicleWeight: 4.0
    },
    {
        name: 'DOUBLE GORGE',
        budget: 20000,
        fixedJoints: [{ x: 0.05, y: 0.5 }, { x: 0.35, y: 0.7 }, { x: 0.65, y: 0.7 }, { x: 0.95, y: 0.5 }],
        roadStartX: 0.05, roadEndX: 0.95, roadY: 0.5,
        groundY: 0.9, vehicleWeight: 5.0,
        earthquake: true
    },
    {
        name: 'ENGINEER\'S DREAM',
        budget: 25000,
        fixedJoints: [{ x: 0.1, y: 0.3 }, { x: 0.9, y: 0.3 }],
        roadStartX: 0.1, roadEndX: 0.9, roadY: 0.3,
        groundY: 0.95, vehicleWeight: 6.0,
        earthquake: true
    }
];

// ---------------------------------------------------------------------------
// Module 4: EliteEngine (Core Game Loop)
// ---------------------------------------------------------------------------
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.scoreHUD = document.getElementById('score-val');
        this.levelHUD = document.getElementById('level-display');
        this.budgetHUD = document.getElementById('budget-display');
        this.stressFill = document.getElementById('stress-fill');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');

        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.birds = [];
        this.initEcoSystem();

        // Core state
        this.state = 'START'; 
        this.score = 0;
        this.level = 0;
        this.gems = 100;
        this.joints = [];
        this.beams = [];
        this.frame = 0;
        this.shake = 0;
        this.isAuto = false;

        // Build state
        this.currentTool = 'beam';
        this.buildStart = null;
        this.hoverJoint = null;
        this.snapDist = 15;

        // Physics
        this.gravity = 0.15;
        this.iterations = 8;
        this.testVehicle = null;

        // Budget
        this.budget = 5000;
        this.spent = 0;

        // Pre-render cache
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.highScore = parseInt(localStorage.getItem('bridge_highScore')) || 0;
        this.gems = parseInt(localStorage.getItem('bridge_gems')) || 100;

        this.initEvents();
        this.resize();
        this.gameLoop();
        this.logEvent('ENGINE_INIT', { type: 'STEEL_BLUEPRINT' });
    }

    initEcoSystem() {
        for (let i = 0; i < 4; i++) {
            this.birds.push(new BirdEntity(this.canvas.width, this.canvas.height));
        }
    }

    logEvent(ev, data = {}) {
        console.group('%c📊 BRIDGE_ANALYTICS', 'color: #3a8fd8; font-weight: bold;');
        console.info(`[${new Date().toISOString()}] ${ev}`, data);
        console.groupEnd();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.preRenderBackground();
    }

    preRenderBackground() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.bgCanvas.width = w;
        this.bgCanvas.height = h;
        const ctx = this.bgCtx;

        // Deep background
        ctx.fillStyle = '#060c18';
        ctx.fillRect(0, 0, w, h);

        // Blueprint grid
        ctx.strokeStyle = 'rgba(58, 143, 216, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    // === LEVEL MANAGEMENT ===
    loadLevel(idx) {
        this.level = idx;
        this.levelHUD.innerText = String(idx + 1).padStart(2, '0');
        const lvl = LEVELS[idx % LEVELS.length];

        this.joints = [];
        this.beams = [];
        this.budget = lvl.budget;
        this.spent = 0;
        this.testVehicle = null;

        // Create fixed anchor joints
        lvl.fixedJoints.forEach(jd => {
            this.joints.push(new Joint(
                jd.x * this.canvas.width,
                jd.y * this.canvas.height,
                true
            ));
        });

        this.updateHUD();
    }

    // === EVENT HANDLING ===
    initEvents() {
        window.addEventListener('resize', () => this.resize());

        // Pointer events (unified mouse/touch)
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.state !== 'BUILD') return;
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            this.onPointerDown(px, py);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.state !== 'BUILD') return;
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            this.onPointerMove(px, py);
        });

        this.canvas.addEventListener('pointerup', (e) => {
            if (this.state !== 'BUILD') return;
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            this.onPointerUp(px, py);
        });

        // Build tool buttons
        document.querySelectorAll('.build-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTool = btn.dataset.tool;
                document.querySelectorAll('.build-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.audio.playClick();
            });
        });

        // Test button
        document.getElementById('btn-test').addEventListener('click', () => {
            if (this.state === 'BUILD') this.startTest();
            else if (this.state === 'TEST' || this.state === 'FAIL') this.stopTest();
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.loadLevel(this.level);
            this.state = 'BUILD';
            this.audio.playClick();
        });

        // Auto toggle
        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
            this.logEvent('UI_TOGGLE_AUTO', { active: this.isAuto });
        };

        // GRANT AD
        document.getElementById('get-budget-btn').onclick = () => {
            this.simulateAdFlow();
        };

        // Init button
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.state = 'BUILD';
            this.overlay.classList.remove('active');
            this.loadLevel(0);
        };
    }

    simulateAdFlow() {
        this.logEvent('AD_START', { type: 'REWARDED_GRANT' });
        this.showOverlay('GOVERNMENT GRANT', 'Secure funding by watching a promotional briefing...', 'SECURE FUNDING');
        
        const btn = this.overlay.querySelector('.overlay-btn');
        const sub = this.overlay.querySelector('.subtitle');
        btn.disabled = true;
        
        let count = 5;
        const itv = setInterval(() => {
            count--;
            btn.innerText = `SECURING... ${count}s`;
            if (count <= 0) {
                clearInterval(itv);
                this.budget += 2000;
                this.updateHUD();
                this.overlay.classList.remove('active');
                this.audio.playWin();
                this.logEvent('AD_COMPLETE', { reward: 2000 });
                btn.disabled = false;
                btn.innerText = 'BEGIN ENGINEERING';
            }
        }, 1000);
    }

    // === POINTER LOGIC ===
    findNearestJoint(px, py) {
        let closest = null;
        let minDist = this.snapDist;
        this.joints.forEach(j => {
            const dx = j.x - px;
            const dy = j.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                closest = j;
            }
        });
        return closest;
    }

    onPointerDown(px, py) {
        if (this.currentTool === 'delete') {
            this.deleteBeamAt(px, py);
            return;
        }

        const joint = this.findNearestJoint(px, py);
        if (joint) {
            this.buildStart = joint;
        } else {
            const newJoint = new Joint(px, py);
            this.joints.push(newJoint);
            this.buildStart = newJoint;
            this.audio.playClick();
        }
    }

    onPointerMove(px, py) {
        this.hoverJoint = this.findNearestJoint(px, py);
        this.mouseX = px;
        this.mouseY = py;
    }

    onPointerUp(px, py) {
        if (!this.buildStart || this.currentTool === 'delete') return;

        let endJoint = this.findNearestJoint(px, py);
        if (!endJoint || endJoint === this.buildStart) {
            if (!endJoint) {
                endJoint = new Joint(px, py);
                this.joints.push(endJoint);
            } else {
                this.buildStart = null;
                return;
            }
        }

        // Check for duplicate beams
        const exists = this.beams.some(b =>
            (b.a === this.buildStart && b.b === endJoint) ||
            (b.a === endJoint && b.b === this.buildStart)
        );

        if (!exists) {
            const beam = new Beam(this.buildStart, endJoint, this.currentTool);
            const cost = beam.getCost();

            if (this.spent + cost <= this.budget) {
                this.beams.push(beam);
                this.spent += cost;
                this.audio.playPlace();
            }
        }

        this.buildStart = null;
        this.updateHUD();
    }

    deleteBeamAt(px, py) {
        let closest = -1;
        let minDist = 12;

        this.beams.forEach((beam, idx) => {
            const mx = (beam.a.x + beam.b.x) / 2;
            const my = (beam.a.y + beam.b.y) / 2;
            const dist = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);
            if (dist < minDist) {
                minDist = dist;
                closest = idx;
            }
        });

        if (closest >= 0) {
            const beam = this.beams[closest];
            this.spent -= beam.getCost();
            this.beams.splice(closest, 1);
            this.vfx.emit(px, py, '#e04050', 8);
            this.audio.playBreak();
            this.updateHUD();
        }
    }

    // === PHYSICS: Verlet Integration ===
    startTest() {
        if (this.beams.length === 0) return;
        this.state = 'TEST';

        // Reset physics state
        this.joints.forEach(j => {
            j.prevX = j.x;
            j.prevY = j.y;
        });

        // Create vehicle
        const lvl = LEVELS[this.level % LEVELS.length];
        this.testVehicle = {
            x: lvl.roadStartX * this.canvas.width,
            y: lvl.roadY * this.canvas.height - 15,
            targetX: lvl.roadEndX * this.canvas.width,
            speed: 1.2,
            weight: lvl.vehicleWeight,
            arrived: false
        };

        document.getElementById('btn-test').innerText = '■ STOP';
    }

    stopTest() {
        this.state = 'BUILD';
        this.testVehicle = null;

        // Reset joint positions
        const lvl = LEVELS[this.level % LEVELS.length];
        this.joints.forEach((j, i) => {
            if (j.fixed && i < lvl.fixedJoints.length) {
                j.x = lvl.fixedJoints[i].x * this.canvas.width;
                j.y = lvl.fixedJoints[i].y * this.canvas.height;
            }
        });

        // Reset beam stress
        this.beams.forEach(b => { b.stress = 0; b.broken = false; });
        document.getElementById('btn-test').innerText = '▶ TEST';
    }

    updatePhysics() {
        if (this.state !== 'TEST') return;
        const groundY = LEVELS[this.level % LEVELS.length].groundY * this.canvas.height;

        // Verlet integration on joints
        this.joints.forEach(j => {
            if (j.fixed) return;
            const vx = j.x - j.prevX;
            const vy = j.y - j.prevY;
            j.prevX = j.x;
            j.prevY = j.y;
            j.x += vx * 0.99;
            j.y += vy * 0.99 + this.gravity;

            // Ground collision
            if (j.y > groundY) {
                j.y = groundY;
                j.prevY = j.y;
            }
        });

        // Constraint solving
        const curLvl = LEVELS[this.level % LEVELS.length];
        const quakeScale = (curLvl.earthquake) ? Math.sin(this.frame * 0.1) * 2 : 0;
        if (quakeScale > 1.5) this.shake = 2;

        for (let iter = 0; iter < this.iterations; iter++) {
            this.beams.forEach(beam => {
                if (beam.broken) return;
                const dx = beam.b.x - beam.a.x;
                const dy = beam.b.y - beam.a.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
                const diff = (dist - beam.restLength) / dist;
                const stress = Math.abs(dist - beam.restLength) / beam.restLength;
                
                // 動態疲勞演算
                beam.stress = stress;

                if (stress > beam.maxStress) {
                    beam.broken = true;
                    this.vfx.emit((beam.a.x + beam.b.x) / 2, (beam.a.y + beam.b.y) / 2, '#e04050', 20, 'shard');
                    this.audio.playBreak();
                    return;
                }

                const moveX = dx * diff * 0.5;
                const moveY = dy * diff * 0.5 + quakeScale * (iter / this.iterations);

                if (!beam.a.fixed) { beam.a.x += moveX; beam.a.y += moveY; }
                if (!beam.b.fixed) { beam.b.x -= moveX; beam.b.y -= moveY; }
            });
        }

        // Vehicle physics
        if (this.testVehicle && !this.testVehicle.arrived) {
            this.testVehicle.x += this.testVehicle.speed;

            // Apply weight to nearest road beam
            const v = this.testVehicle;
            this.beams.forEach(beam => {
                if (beam.type !== 'road' || beam.broken) return;
                const mx = (beam.a.x + beam.b.x) / 2;
                if (Math.abs(v.x - mx) < beam.restLength / 2) {
                    if (!beam.a.fixed) beam.a.y += v.weight * 0.1;
                    if (!beam.b.fixed) beam.b.y += v.weight * 0.1;
                }
            });

            // Check arrival
            if (v.x >= v.targetX) {
                v.arrived = true;
                this.onTestSuccess();
            }
        }

        // Update stress bar
        const maxStress = this.beams.reduce((max, b) => Math.max(max, b.stress), 0);
        this.stressFill.style.width = Math.min(maxStress / 1.4 * 100, 100) + '%';

        // Check for total bridge failure
        const allBroken = this.beams.filter(b => b.type === 'road').every(b => b.broken);
        if (allBroken && this.beams.filter(b => b.type === 'road').length > 0) {
            this.state = 'FAIL';
            this.showOverlay('STRUCTURAL FAILURE', 'The bridge collapsed. Redesign and try again.', 'REBUILD');
        }
    }

    onTestSuccess() {
        const budgetEfficiency = Math.max(0, this.budget - this.spent);
        const levelScore = 5000 + budgetEfficiency * 2;
        this.score += levelScore;
        this.audio.playWin();

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.vfx.emit(
                    200 + Math.random() * (this.canvas.width - 400),
                    100 + Math.random() * (this.canvas.height / 2),
                    ['#3a8fd8', '#f08030', '#30d08a', '#60b0ff', '#ffffff'][i], 20
                );
            }, i * 200);
        }

        setTimeout(() => {
            if (this.level + 1 < LEVELS.length) {
                this.level++;
                this.state = 'BUILD';
                this.loadLevel(this.level);
                document.getElementById('btn-test').innerText = '▶ TEST';
            } else {
                this.showOverlay('MASTER ENGINEER', `All bridges completed! Score: ${this.score}`, 'REPLAY');
                this.state = 'WIN';
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('bridge_highScore', this.highScore);
                }
            }
        }, 2000);

        this.updateHUD();
    }

    showOverlay(title, subtitle, btnText) {
        this.overlay.querySelector('h2').innerText = title;
        this.overlay.querySelector('.subtitle').innerText = subtitle;
        this.overlay.querySelector('.overlay-btn').innerText = btnText;
        this.overlay.classList.add('active');

        this.overlay.querySelector('.overlay-btn').onclick = () => {
            this.audio.init();
            this.overlay.classList.remove('active');
            this.state = 'BUILD';
            if (btnText === 'REPLAY') {
                this.score = 0;
                this.level = 0;
            }
            this.loadLevel(this.level);
            document.getElementById('btn-test').innerText = '▶ TEST';
        };
    }

    // === HUD ===
    updateHUD() {
        this.scoreHUD.innerText = String(this.score).padStart(6, '0');
        this.budgetHUD.innerText = '$' + (this.budget - this.spent);
        this.budgetHUD.style.color = (this.budget - this.spent) > this.budget * 0.3 ? '#30d08a' : '#f08030';
    }

    // === AUTO-BUILD (AI) ===
    autoBuild() {
        if (!this.isAuto || this.state !== 'BUILD') return;
        // Simple auto-bridge: connect fixed joints with intermediate supports
        const lvl = LEVELS[this.level % LEVELS.length];
        const anchors = this.joints.filter(j => j.fixed);
        if (anchors.length < 2) return;

        const a = anchors[0];
        const b = anchors[anchors.length - 1];
        const segments = 4;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = a.x + (b.x - a.x) * t;
            const y = a.y + (b.y - a.y) * t;
            if (i > 0 && i < segments) {
                const existing = this.findNearestJoint(x, y);
                if (!existing || Math.sqrt((existing.x - x) ** 2 + (existing.y - y) ** 2) > this.snapDist) {
                    this.joints.push(new Joint(x, y));
                }
            }
        }

        // Connect sequentially as road
        const sortedByX = [...this.joints].sort((a, b) => a.x - b.x);
        for (let i = 0; i < sortedByX.length - 1; i++) {
            const ja = sortedByX[i];
            const jb = sortedByX[i + 1];
            const exists = this.beams.some(beam =>
                (beam.a === ja && beam.b === jb) || (beam.a === jb && beam.b === ja)
            );
            if (!exists) {
                const beam = new Beam(ja, jb, 'road');
                if (this.spent + beam.getCost() <= this.budget) {
                    this.beams.push(beam);
                    this.spent += beam.getCost();
                }
            }
        }

        // Add support triangles
        const roadJoints = sortedByX.filter((_, i) => i % 2 === 1);
        roadJoints.forEach(j => {
            const below = new Joint(j.x, j.y + 60);
            this.joints.push(below);

            const left = this.findNearestJoint(j.x - 80, j.y);
            const right = this.findNearestJoint(j.x + 80, j.y);

            [left, right].filter(Boolean).forEach(neighbor => {
                const beam = new Beam(below, neighbor, 'beam');
                if (this.spent + beam.getCost() <= this.budget) {
                    this.beams.push(beam);
                    this.spent += beam.getCost();
                }
            });

            const brace = new Beam(j, below, 'beam');
            if (this.spent + brace.getCost() <= this.budget) {
                this.beams.push(brace);
                this.spent += brace.getCost();
            }
        });

        this.isAuto = false;
        this.autoToggle.classList.remove('active');
        document.getElementById('auto-pilot-status').innerText = 'OFF';
        this.audio.playSnap();
        this.updateHUD();
    }

    // === GAME LOOP ===
    update() {
        this.updatePhysics();
        this.vfx.update();
        this.birds.forEach(b => b.update());
        this.frame++;

        if (this.isAuto && this.state === 'BUILD' && this.beams.length === 0) {
            this.autoBuild();
        }
        if (this.shake > 0) this.shake *= 0.9;
    }

    // === RENDER ===
    drawBackground() {
        this.ctx.drawImage(this.bgCanvas, 0, 0);
    }

    drawTerrain() {
        const ctx = this.ctx;
        const lvl = LEVELS[this.level % LEVELS.length];
        const w = this.canvas.width;
        const groundY = lvl.groundY * this.canvas.height;

        // Water/chasm
        const grad = ctx.createLinearGradient(0, groundY - 40, 0, this.canvas.height);
        grad.addColorStop(0, 'rgba(10, 40, 80, 0.6)');
        grad.addColorStop(1, 'rgba(6, 12, 24, 0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, groundY, w, this.canvas.height - groundY);

        // Cliff edges
        const roadY = lvl.roadY * this.canvas.height;
        const leftX = lvl.roadStartX * w;
        const rightX = lvl.roadEndX * w;

        ctx.fillStyle = '#0c1628';
        ctx.fillRect(0, roadY, leftX, this.canvas.height - roadY);
        ctx.fillRect(rightX, roadY, w - rightX, this.canvas.height - roadY);

        // Cliff surface
        ctx.fillStyle = '#101e38';
        ctx.fillRect(0, roadY, leftX, 8);
        ctx.fillRect(rightX, roadY, w - rightX, 8);
    }

    drawBeams() {
        const ctx = this.ctx;
        this.beams.forEach(beam => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(beam.a.x, beam.a.y);
            ctx.lineTo(beam.b.x, beam.b.y);

            const color = beam.getColor();
            ctx.strokeStyle = color;
            ctx.lineWidth = beam.type === 'road' ? 5 : beam.type === 'cable' ? 2 : 3;

            if (beam.type === 'cable') ctx.setLineDash([4, 4]);
            if (beam.broken) {
                ctx.setLineDash([3, 6]);
                ctx.globalAlpha = 0.4;
            }

            ctx.shadowBlur = beam.stress > 0.5 ? 8 : 0;
            ctx.shadowColor = color;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        });
    }

    drawJoints() {
        const ctx = this.ctx;
        this.joints.forEach(j => {
            ctx.beginPath();
            ctx.arc(j.x, j.y, j.fixed ? 7 : 5, 0, Math.PI * 2);
            ctx.fillStyle = j.fixed ? '#3a8fd8' : '#f0f4f8';
            ctx.shadowBlur = j.fixed ? 12 : 4;
            ctx.shadowColor = j.fixed ? '#60b0ff' : '#ffffff';
            ctx.fill();

            if (j === this.hoverJoint && this.state === 'BUILD') {
                ctx.beginPath();
                ctx.arc(j.x, j.y, 12, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(96, 176, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
        ctx.shadowBlur = 0;
    }

    drawBuildPreview() {
        if (this.state !== 'BUILD' || !this.buildStart || !this.mouseX) return;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(this.buildStart.x, this.buildStart.y);
        ctx.lineTo(this.mouseX, this.mouseY);
        ctx.strokeStyle = 'rgba(96, 176, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawVehicle() {
        if (!this.testVehicle) return;
        const ctx = this.ctx;
        const v = this.testVehicle;

        ctx.save();
        ctx.fillStyle = '#f08030';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f08030';
        ctx.fillRect(v.x - 20, v.y - 12, 40, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(v.x - 14, v.y - 20, 10, 10);

        // Wheels
        ctx.fillStyle = '#1a2038';
        ctx.beginPath(); ctx.arc(v.x - 12, v.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(v.x + 12, v.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    draw() {
        this.drawBackground();

        this.ctx.save();
        if (this.shake > 0.1) {
            this.ctx.translate((Math.random() - 0.5) * this.shake * 4, (Math.random() - 0.5) * this.shake * 4);
        }

        this.drawTerrain();
        this.birds.forEach(b => b.draw(this.ctx));
        this.drawBeams();
        this.drawJoints();
        this.drawBuildPreview();
        this.drawVehicle();
        this.vfx.draw(this.ctx);
        this.ctx.restore();
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
