// ============================================================================
// 017_TANGRAM — DIGITAL PRISM ENGINE
// UTT-v2.0 Master-Grade | Xavier's Clean Code Doctrine
// ============================================================================

// ---------------------------------------------------------------------------
// Module 1: AudioManager (Procedural Synthesis — Zero External Assets)
// ---------------------------------------------------------------------------
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.panner = null;
        this.isReady = false;
        this.ambientBeat = 0;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.5;

            // 立體聲平移器 (Spatial Panning)
            this.panner = this.ctx.createStereoPanner();
            this.panner.connect(this.masterGain);

            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn('AudioManager: init failed.'); }
    }

    // 生成式背景音樂: 排程禪意琶音
    startAmbient() {
        const schedule = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const freqList = [220, 246.94, 261.63, 293.66, 329.63, 392]; // A3-G4 Pentatonic
            const freq = freqList[this.ambientBeat % freqList.length];
            
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.04, now + 2);
            g.gain.linearRampToValueAtTime(0, now + 4);
            
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 4);
            
            this.ambientBeat++;
            setTimeout(schedule, 4000); // 緩慢排程
        };
        schedule();
    }

    // 輔助函式: 根據座標動態平移
    panByX(x, canvasWidth) {
        if (!this.panner) return;
        const panValue = (x / canvasWidth) * 2 - 1; // Map 0->W to -1->1
        this.panner.pan.setValueAtTime(panValue, this.ctx.currentTime);
    }

    playPickup(x, w) {
        if (!this.isReady) return;
        this.panByX(x, w);
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(990, now + 0.05);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(this.panner);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playRotate(x, w) {
        if (!this.isReady) return;
        this.panByX(x, w);
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
        g.gain.setValueAtTime(0.06, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.panner);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playPlace(x, w) {
        if (!this.isReady) return;
        this.panByX(x, w);
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.panner);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playSnap() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        // 增壓琶音反饋
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0.1, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
            osc.connect(g);
            g.connect(this.masterGain); // Snap is centered
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    playWin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            g.gain.setValueAtTime(0.2, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.6);
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

    emit(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * 5;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI,
                rotV: (Math.random() - 0.5) * 0.1,
                life: 1.0,
                decay: 0.01 + Math.random() * 0.02,
                size: 4 + Math.random() * 6,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
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
            ctx.globalAlpha = p.life * 0.7;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            const s = p.size * p.life;
            ctx.moveTo(0, -s);
            ctx.lineTo(s, s);
            ctx.lineTo(-s, s);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

// ---------------------------------------------------------------------------
// Module 3: GeometricEntity (Procedural Bio-Animation)
// ---------------------------------------------------------------------------
class GeometricEntity {
    constructor(w, h) {
        this.canvasW = w;
        this.canvasH = h;
        this.reset();
    }

    reset() {
        this.x = Math.random() * this.canvasW;
        this.y = Math.random() * this.canvasH;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 1 + Math.random() * 2;
        this.segments = 5 + Math.floor(Math.random() * 4);
        this.points = [];
        for (let i = 0; i < this.segments; i++) {
            this.points.push({ x: this.x, y: this.y });
        }
        this.hue = 200 + Math.random() * 40; // Cyan-ish
        this.phase = Math.random() * Math.PI * 2;
    }

    update(targetX, targetY, isDragging) {
        // 趨光性邏輯 (Seek dragging piece or center)
        const tx = isDragging ? targetX : this.canvasW / 2;
        const ty = isDragging ? targetY : this.canvasH / 2;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const targetAngle = Math.atan2(dy, dx);
        let angleDiff = targetAngle - this.angle;
        angleDiff = ((angleDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
        this.angle += angleDiff * 0.02;

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // 擺動邏輯 (Sine-wave physics)
        this.phase += 0.1;
        const wiggle = Math.sin(this.phase) * 0.3;
        
        // 繩索追蹤演算法 (Segment Follower)
        this.points[0] = { 
            x: this.x + Math.cos(this.angle + wiggle) * 10, 
            y: this.y + Math.sin(this.angle + wiggle) * 10 
        };
        
        for (let i = 1; i < this.segments; i++) {
            const dx = this.points[i-1].x - this.points[i].x;
            const dy = this.points[i-1].y - this.points[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const targetDist = 12;
            this.points[i].x = this.points[i-1].x - Math.cos(angle) * targetDist;
            this.points[i].y = this.points[i-1].y - Math.sin(angle) * targetDist;
        }

        // Screen wrap
        if (this.x < -100) this.reset();
        if (this.x > this.canvasW + 100) this.reset();
        if (this.y < -100) this.reset();
        if (this.y > this.canvasH + 100) this.reset();
    }

    draw(ctx) {
        ctx.save();
        ctx.strokeStyle = `hsla(${this.hue}, 80%, 60%, 0.15)`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsla(${this.hue}, 80%, 60%, 0.3)`;

        // 繪製骨架與三角側翼
        ctx.beginPath();
        for (let i = 0; i < this.segments; i++) {
            const p = this.points[i];
            const size = (this.segments - i) * 3;
            
            // 側邊三角形 (Fin-like structures)
            if (i > 0) {
                const angle = Math.atan2(p.y - this.points[i-1].y, p.x - this.points[i-1].x);
                ctx.moveTo(p.x + Math.cos(angle + Math.PI/2) * size, p.y + Math.sin(angle + Math.PI/2) * size);
                ctx.lineTo(p.x + Math.cos(angle - Math.PI/2) * size, p.y + Math.sin(angle - Math.PI/2) * size);
            }
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

// ---------------------------------------------------------------------------
// Module 3: Tangram Piece Definition
// ---------------------------------------------------------------------------

// 七巧板標準尺寸 — 基於 unit=1 的正方形 (後續按 scale 縮放)
// 每塊以相對原點的頂點定義
const TANGRAM_DEFS = [
    // 0: 大三角形 A
    { verts: [[0,0],[1,0],[0.5,0.5]], color: '#f0a030' },
    // 1: 大三角形 B
    { verts: [[0,0],[1,0],[0.5,-0.5]], color: '#e05080' },
    // 2: 中三角形
    { verts: [[0,0],[0.5,0.25],[0,0.5]], color: '#30d0b0' },
    // 3: 小三角形 A
    { verts: [[0,0],[0.5,0],[0.25,0.25]], color: '#7060e0' },
    // 4: 小三角形 B
    { verts: [[0,0],[0.5,0],[0.25,-0.25]], color: '#50b0ff' },
    // 5: 正方形
    { verts: [[0,0],[0.25,0.25],[0.5,0],[0.25,-0.25]], color: '#ff8844' },
    // 6: 平行四邊形
    { verts: [[0,0],[0.25,0.25],[0.75,0.25],[0.5,0]], color: '#d060d0' },
];

// 關卡目標: 每個關卡定義一組目標位置/旋轉 (相對於畫布中心)
const LEVELS = [
    // Tier 1: Basic Geometries (With Hints)
    { name: 'SQUARE', color: '#f0a030', targets: [
        { dx: -0.25, dy: -0.5, rot: Math.PI * 0.75 }, { dx: 0.25, dy: -0.5, rot: -Math.PI * 0.25 },
        { dx: -0.25, dy: 0, rot: Math.PI * 0.5 }, { dx: 0, dy: -0.25, rot: 0 },
        { dx: 0.25, dy: 0.25, rot: Math.PI }, { dx: 0, dy: 0, rot: Math.PI * 0.25 },
        { dx: -0.15, dy: 0.25, rot: 0 }
    ]},
    { name: 'TRIANGLE', color: '#30d0b0', targets: [
        { dx: -0.3, dy: 0.2, rot: 0 }, { dx: 0.3, dy: 0.2, rot: Math.PI },
        { dx: 0, dy: -0.1, rot: Math.PI * 0.5 }, { dx: -0.15, dy: 0.1, rot: Math.PI * 0.25 },
        { dx: 0.15, dy: 0.1, rot: -Math.PI * 0.25 }, { dx: 0, dy: 0, rot: Math.PI * 0.75 },
        { dx: 0, dy: 0.3, rot: 0 }
    ]},
    // Tier 2: Organic Shapes (Shadow Mode)
    { name: 'CAT', color: '#e05080', shadow: true, targets: [
        { dx: -0.1, dy: 0.1, rot: 0.78 }, { dx: -0.1, dy: -0.24, rot: 2.35 },
        { dx: 0.2, dy: -0.05, rot: 0 }, { dx: -0.3, dy: -0.4, rot: 0.78 },
        { dx: -0.4, dy: -0.3, rot: -0.78 }, { dx: -0.3, dy: -0.15, rot: 0 },
        { dx: 0.1, dy: 0.25, rot: 0.5 }
    ]},
    { name: 'SWAN', color: '#50b0ff', shadow: true, targets: [
        { dx: -0.2, dy: 0.3, rot: 0 }, { dx: 0.2, dy: 0.3, rot: 3.14 },
        { dx: -0.3, dy: -0.1, rot: 1.57 }, { dx: 0.2, dy: -0.5, rot: 0.78 },
        { dx: 0.3, dy: -0.4, rot: -0.78 }, { dx: 0.1, dy: -0.3, rot: 0 },
        { dx: -0.4, dy: 0.2, rot: 0.5 }
    ]},
    { name: 'RUNNER', color: '#f0a030', shadow: true, targets: [
        { dx: 0, dy: 0, rot: 2.35 }, { dx: 0.2, dy: -0.2, rot: 0.78 },
        { dx: -0.2, dy: -0.1, rot: 1.57 }, { dx: 0.5, dy: 0.3, rot: 0.78 },
        { dx: -0.4, dy: 0.5, rot: -0.78 }, { dx: 0.3, dy: -0.5, rot: 0 },
        { dx: -0.1, dy: -0.3, rot: 0.5 }
    ]}
];

// ---------------------------------------------------------------------------
// Module 4: TangramPiece Class
// ---------------------------------------------------------------------------
class TangramPiece {
    constructor(def, scale, index) {
        this.index = index;
        this.baseVerts = def.verts.map(v => [v[0] * scale, v[1] * scale]);
        this.color = def.color;
        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.targetRotation = 0;
        this.snapped = false;
        this.dragging = false;
        this.hovered = false;
        this.glowIntensity = 0;
    }

    getTransformedVerts() {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return this.baseVerts.map(([vx, vy]) => [
            this.x + vx * cos - vy * sin,
            this.y + vx * sin + vy * cos
        ]);
    }

    getCentroid() {
        const verts = this.getTransformedVerts();
        let cx = 0, cy = 0;
        verts.forEach(([x, y]) => { cx += x; cy += y; });
        return [cx / verts.length, cy / verts.length];
    }

    /**
     * Ada's Logic Gate: Polygon Containment Proof
     * Algorithm: Ray Casting (Crossing Number)
     * Time Complexity: O(N) where N is the number of vertices.
     * Rationale: For Tangram pieces (N <= 4), O(N) is essentially O(1), 
     * providing optimal real-time performance for multi-piece hit detection.
     */
    containsPoint(px, py) {
        const verts = this.getTransformedVerts();
        let inside = false;
        for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
            const [xi, yi] = verts[i];
            const [xj, yj] = verts[j];
            const intersect = ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    draw(ctx) {
        const verts = this.getTransformedVerts();

        // Glow effect
        if (this.glowIntensity > 0) {
            ctx.shadowBlur = 15 * this.glowIntensity;
            ctx.shadowColor = this.color;
        }

        ctx.beginPath();
        ctx.moveTo(verts[0][0], verts[0][1]);
        for (let i = 1; i < verts.length; i++) {
            ctx.lineTo(verts[i][0], verts[i][1]);
        }
        ctx.closePath();

        // Fill with subtle gradient
        const [cx, cy] = this.getCentroid();
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        const baseColor = this.color;
        grad.addColorStop(0, this.snapped ? baseColor : this.lighten(baseColor, 20));
        grad.addColorStop(1, baseColor);
        ctx.fillStyle = this.snapped ? this.addAlpha(baseColor, 0.85) : grad;
        ctx.fill();

        // Outline
        ctx.strokeStyle = this.hovered || this.dragging ? '#ffffff' : this.lighten(baseColor, 40);
        ctx.lineWidth = this.dragging ? 3 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    lighten(hex, amt) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.min(255, r + amt);
        g = Math.min(255, g + amt);
        b = Math.min(255, b + amt);
        return `rgb(${r},${g},${b})`;
    }

    addAlpha(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

// ---------------------------------------------------------------------------
// Module 5: EliteEngine (Core Game Loop)
// ---------------------------------------------------------------------------
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.scoreHUD = document.getElementById('score-val');
        this.levelHUD = document.getElementById('level-display');
        this.livesHUD = document.getElementById('lives-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');

        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.entities = [];
        for (let i = 0; i < 6; i++) {
            this.entities.push(new GeometricEntity(this.canvas.width, this.canvas.height));
        }

        this.state = 'START'; // START | PLAYING | COMPLETE | GAMEOVER
        this.score = 0;
        this.level = 0;
        this.hints = 3;
        this.gems = 100;
        this.isAuto = false;
        this.autoTimer = 0;
        this.pieces = []; // 關鍵初始化: 防止渲染引擎讀取 undefined
        
        // 幾何物理配置
        this.scale = 220; 
        this.snapThreshold = 30; 
        this.snapRotThreshold = Math.PI / 10;
        this.magneticPull = 0.12; 
        this.shake = 0;
        this.frame = 0;

        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.highScore = parseInt(localStorage.getItem('tangram_highScore')) || 0;
        this.savedLevel = parseInt(localStorage.getItem('tangram_currentLevel')) || 0;
        this.gems = parseInt(localStorage.getItem('tangram_gems')) || 100;
        this.updateHighScoreUI();
        this.updateHUD();

        this.initEvents();
        this.resize();
        this.gameLoop();
        this.logEvent('APP_SESSION_START', { ver: 'UTT-v2.0-Elite' });
    }

    // === BUSINESS ANALYTICS (Simulated) ===
    logEvent(ev, data = {}) {
        const timestamp = new Date().toISOString();
        console.group('%c📊 UTT BUSINESS ANALYTICS', 'color: #30d0b0; font-weight: bold;');
        console.info(`[${timestamp}] EVENT: ${ev}`);
        console.table(data);
        console.groupEnd();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.entities?.forEach(e => {
            e.canvasW = this.canvas.width;
            e.canvasH = this.canvas.height;
        });
        this.preRenderBackground();
    }

    preRenderBackground() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.bgCanvas.width = w;
        this.bgCanvas.height = h;
        const ctx = this.bgCtx;
        
        ctx.fillStyle = '#08080e';
        ctx.fillRect(0, 0, w, h);
        
        const gridSize = 60;
        ctx.strokeStyle = 'rgba(240, 160, 48, 0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    // === LEVEL MANAGEMENT ===
    loadLevel(idx) {
        this.level = idx;
        this.levelHUD.innerText = String(idx + 1).padStart(2, '0');

        const lvl = LEVELS[idx % LEVELS.length];
        this.pieces = [];

        TANGRAM_DEFS.forEach((def, i) => {
            const piece = new TangramPiece(def, this.scale, i);
            const target = lvl.targets[i];
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;

            // Set target position
            piece.targetX = cx + target.dx * this.scale;
            piece.targetY = cy + target.dy * this.scale;
            piece.targetRotation = target.rot;

            // Scramble — place randomly around edges
            const side = Math.floor(Math.random() * 4);
            const margin = 120;
            switch (side) {
                case 0: piece.x = margin + Math.random() * 150; piece.y = margin + Math.random() * (this.canvas.height - 2 * margin); break;
                case 1: piece.x = this.canvas.width - margin - Math.random() * 150; piece.y = margin + Math.random() * (this.canvas.height - 2 * margin); break;
                case 2: piece.x = margin + Math.random() * (this.canvas.width - 2 * margin); piece.y = margin + Math.random() * 100; break;
                case 3: piece.x = margin + Math.random() * (this.canvas.width - 2 * margin); piece.y = this.canvas.height - margin - Math.random() * 100; break;
            }
            piece.rotation = Math.random() * Math.PI * 2;
            this.pieces.push(piece);
        });
    }

    checkSnap(piece) {
        const dx = Math.abs(piece.x - piece.targetX);
        const dy = Math.abs(piece.y - piece.targetY);

        // 正規化旋轉差值 (Ada's Logic: Normalize to [-PI, PI])
        let drot = piece.rotation - piece.targetRotation;
        drot = ((drot % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;

        // Proximity Feedback (磁吸感知)
        const isNear = dx < this.snapThreshold * 1.5 && dy < this.snapThreshold * 1.5 && Math.abs(drot) < this.snapRotThreshold * 1.5;
        piece.nearTarget = isNear;

        if (dx < this.snapThreshold && dy < this.snapThreshold && Math.abs(drot) < this.snapRotThreshold) {
            // Magnetic Lock Animation (磁吸鎖定)
            piece.x = piece.targetX;
            piece.y = piece.targetY;
            piece.rotation = piece.targetRotation;
            piece.snapped = true;
            this.score += 500;
            this.audio.playSnap();
            
            // 粒子暴擊
            const [cx, cy] = piece.getCentroid();
            this.vfx.emit(cx, cy, piece.color, 25);
            this.shake = 5; // 輕微震動回饋
            
            this.updateHUD();
            this.checkWin();
        }
    }

    checkWin() {
        if (this.pieces.every(p => p.snapped)) {
            const reward = 50 + this.level * 25;
            this.gems += reward;
            this.score += 2000;
            this.audio.playWin();
            this.logEvent('LEVEL_COMPLETE', { level: this.level, gemsAwarded: reward });
            localStorage.setItem('tangram_gems', this.gems);

            // Emit fireworks
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.vfx.emit(
                        200 + Math.random() * (this.canvas.width - 400),
                        200 + Math.random() * (this.canvas.height - 400),
                        ['#f0a030', '#e05080', '#30d0b0', '#7060e0', '#50b0ff'][i],
                        25
                    );
                }, i * 200);
            }

            this.updateHUD();

            setTimeout(() => {
                if (this.level + 1 < LEVELS.length) {
                    this.level++;
                    localStorage.setItem('tangram_currentLevel', this.level);
                    this.loadLevel(this.level);
                } else {
                    this.showOverlay('MASTERY ACHIEVED', `全部關卡完成！終端積分: ${this.score}`, 'REPLAY');
                    this.state = 'COMPLETE';
                    localStorage.setItem('tangram_currentLevel', 0); // 重置進度
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('tangram_highScore', this.highScore);
                        this.updateHighScoreUI();
                    }
                }
            }, 1500);
        }
    }

    showOverlay(heading, desc, btnText) {
        document.getElementById('overlay-heading').innerText = heading;
        document.getElementById('overlay-description').innerText = desc;
        document.getElementById('init-game-btn').innerText = btnText;
        this.overlay.classList.add('active');
    }

    // === EVENT SYSTEM ===
    initEvents() {
        window.addEventListener('resize', () => this.resize());

        // Keyboard
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR' && this.dragPiece && !this.dragPiece.snapped) {
                this.dragPiece.rotation += Math.PI / 4;
                this.audio.playRotate(this.dragPiece.x, this.canvas.width);
            }
        });

        // Mouse
        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
        this.canvas.addEventListener('mouseup', () => this.onPointerUp());

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.onPointerDown(t.clientX, t.clientY);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.onPointerMove(t.clientX, t.clientY);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onPointerUp();
        }, { passive: false });

        // Double-click/tap to rotate
        this.canvas.addEventListener('dblclick', (e) => {
            const px = e.clientX, py = e.clientY;
            for (let i = this.pieces.length - 1; i >= 0; i--) {
                if (!this.pieces[i].snapped && this.pieces[i].containsPoint(px, py)) {
                    this.pieces[i].rotation += Math.PI / 4;
                    this.audio.playRotate();
                    break;
                }
            }
        });

        // Init button
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.startAmbient();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
            this.score = 0;
            this.hints = 3;
            this.loadLevel(this.savedLevel); // 載入儲存進度
            this.updateHUD();
        };

        // Auto toggle
        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
            this.logEvent('TOGGLE_AUTO_PILOT', { active: this.isAuto });
        };

        // GET HINTS (Monetization Interaction)
        document.getElementById('get-hints-btn').onclick = () => {
            if (this.gems >= 25) {
                this.spendGems(25, 'BUY_HINT');
                this.hints++;
                this.audio.playSnap();
                this.updateHUD();
            } else {
                this.simulateAdFlow();
            }
        };
    }

    simulateAdFlow() {
        this.logEvent('AD_FLOW_START', { trigger: 'LOW_GEMS' });
        const adOverlay = document.getElementById('ad-overlay');
        const timerText = document.getElementById('ad-timer');
        adOverlay.classList.add('active');
        
        let count = 5;
        const interval = setInterval(() => {
            count--;
            timerText.innerText = `CLOSING IN ${count}s`;
            if (count <= 0) {
                clearInterval(interval);
                adOverlay.classList.remove('active');
                this.gems += 50;
                this.logEvent('AD_WATCH_COMPLETE', { reward: 50, type: 'GEMS' });
                this.updateHUD();
                this.audio.playWin();
                localStorage.setItem('tangram_gems', this.gems);
            }
        }, 1000);
    }

    spendGems(amt, reason) {
        this.gems -= amt;
        this.logEvent('GEMS_SPENT', { amount: amt, reason: reason, currentGems: this.gems });
        localStorage.setItem('tangram_gems', this.gems);
    }

    onPointerDown(px, py) {
        if (this.state !== 'PLAYING') return;
        // Iterate top-to-bottom (last drawn = top)
        for (let i = this.pieces.length - 1; i >= 0; i--) {
            const p = this.pieces[i];
            if (!p.snapped && p.containsPoint(px, py)) {
                p.dragging = true;
                this.dragPiece = p;
                this.dragOffX = px - p.x;
                this.dragOffY = py - p.y;
                // Bring to top
                this.pieces.splice(i, 1);
                this.pieces.push(p);
                this.audio.playPickup(p.x, this.canvas.width);
                break;
            }
        }
    }

    onPointerMove(px, py) {
        if (this.dragPiece) {
            this.dragPiece.x = px - this.dragOffX;
            this.dragPiece.y = py - this.dragOffY;
        }
        // Hover detection
        this.pieces.forEach(p => {
            p.hovered = !p.snapped && p.containsPoint(px, py);
        });
    }

    onPointerUp() {
        if (this.dragPiece) {
            this.dragPiece.dragging = false;
            this.audio.playPlace(this.dragPiece.x, this.canvas.width);
            this.checkSnap(this.dragPiece);
            this.dragPiece = null;
        }
    }

    // === HUD ===
    updateHUD() {
        this.scoreHUD.innerText = String(this.score).padStart(6, '0');
        this.livesHUD.innerText = String(this.hints);
        const gemsDisp = document.getElementById('gems-display');
        if (gemsDisp) gemsDisp.innerText = String(this.gems);
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        const hiText = `<div id="hi-score-disp" style="font-size:0.55rem; opacity:0.6; margin-top:4px; color:#e05080">HI-SCORE: ${String(this.highScore).padStart(6, '0')}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    // === AI AUTO-PILOT ===
    executeAutoPilot() {
        this.autoTimer++;
        if (this.autoTimer % 3 !== 0) return; // Throttle for smooth animation

        const unsnapped = this.pieces.find(p => !p.snapped);
        if (!unsnapped) return;

        // Lerp towards target
        const lerpFactor = 0.08;
        unsnapped.x += (unsnapped.targetX - unsnapped.x) * lerpFactor;
        unsnapped.y += (unsnapped.targetY - unsnapped.y) * lerpFactor;

        // Smooth rotation lerp
        let drot = unsnapped.targetRotation - unsnapped.rotation;
        drot = ((drot % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        unsnapped.rotation += drot * lerpFactor;

        this.checkSnap(unsnapped);
    }

    // === RENDER: Target Silhouette ===
    drawTargetSilhouette() {
        const ctx = this.ctx;
        const currentLvl = LEVELS[this.level % LEVELS.length];
        const isShadow = currentLvl.shadow;

        ctx.save();
        
        // 陰影模式全局樣式
        if (isShadow) {
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 40;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        } else {
            ctx.globalAlpha = 0.08 + Math.sin(this.frame * 0.03) * 0.03;
        }

        this.pieces.forEach(p => {
            if (p.snapped) return;
            const cos = Math.cos(p.targetRotation);
            const sin = Math.sin(p.targetRotation);
            const verts = p.baseVerts.map(([vx, vy]) => [
                p.targetX + vx * cos - vy * sin,
                p.targetY + vx * sin + vy * cos
            ]);

            ctx.beginPath();
            ctx.moveTo(verts[0][0], verts[0][1]);
            for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i][0], verts[i][1]);
            ctx.closePath();
            
            if (isShadow) {
                ctx.fill(); // 填充成整塊陰影
            } else {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 6]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        ctx.restore();
    }

    // === BACKGROUND: Optimized Render ===
    drawBackground() {
        // 使用預渲染畫布節省 drawCount
        this.ctx.drawImage(this.bgCanvas, 0, 0);

        // 動態網格脈衝
        const pulse = Math.sin(this.frame * 0.02) * 0.02;
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = `rgba(240, 160, 48, ${0.03 + pulse})`;
        
        // 背景環境生物
        for (let i = 0; i < 3; i++) {
            const ax = (this.canvas.width * 0.3 * i + this.frame * 0.2) % this.canvas.width;
            const ay = this.canvas.height * 0.5 + Math.sin(this.frame * 0.01 + i) * 120;
            this.ctx.globalAlpha = 0.015;
            this.ctx.beginPath();
            this.ctx.moveTo(ax, ay - 40);
            this.ctx.lineTo(ax - 35, ay + 30);
            this.ctx.lineTo(ax + 35, ay + 30);
            this.ctx.closePath();
            this.ctx.strokeStyle = '#f0a030';
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1.0;
    }

    // === MAIN LOOP ===
    update() {
        if (this.state !== 'PLAYING') return;
        if (this.isAuto) this.executeAutoPilot();

        // 磁吸動力學與發光動畫 (Ada's Physics Logic)
        this.pieces.forEach(p => {
            // 磁吸效果: 當玩家放開物件且物件接近目標時
            if (!p.dragging && !p.snapped && p.nearTarget) {
                p.x += (p.targetX - p.x) * this.magneticPull;
                p.y += (p.targetY - p.y) * this.magneticPull;
                
                let drot = p.targetRotation - p.rotation;
                drot = ((drot % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
                p.rotation += drot * this.magneticPull;
                
                // 動態檢查是否應轉為 snapped
                this.checkSnap(p);
            }

            const targetGlow = p.hovered || p.dragging ? 1.0 : (p.snapped ? 0.6 : 0);
            p.glowIntensity += (targetGlow - p.glowIntensity) * 0.15;
        });

        // 幾何生物動畫 (Procedural Bio-Animation)
        const mouseX = this.dragPiece ? this.dragPiece.x : (this.canvas.width / 2);
        const mouseY = this.dragPiece ? this.dragPiece.y : (this.canvas.height / 2);
        this.entities.forEach(e => e.update(mouseX, mouseY, !!this.dragPiece));

        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.92;
        this.frame++;
    }

    // === RENDER: Prism Core (Boss Visual) ===
    drawPrismCore() {
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const time = this.frame * 0.01;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(time * 0.2);
        
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        const size = 150 * pulse;
        
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = '#f0a030';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.beginPath();
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.8, size * 0.5);
            ctx.lineTo(-size * 0.8, size * 0.5);
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.restore();
    }

    draw() {
        this.drawBackground();
        this.ctx.save();

        if (this.shake > 0) {
            this.ctx.translate((Math.random()-0.5)*this.shake, (Math.random()-0.5)*this.shake);
        }

        // 繪製稜鏡核心 (Prism Core)
        this.drawPrismCore();

        // Draw target silhouette
        this.drawTargetSilhouette();

        // 繪製幾何生物 (Entities in Background)
        this.entities.forEach(e => e.draw(this.ctx));

        // Draw pieces
        this.pieces.forEach(p => p.draw(this.ctx));

        // Particles on top
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
window.onload = () => new EliteEngine();
