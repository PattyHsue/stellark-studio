/**
 * ============================================================
 * 026_JIGSAW | 空中拼圖
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Clean SOLID jigsaw implementation.
 *  - ProceduralArt: Generates "Sky Odyssey" canvas art dynamically
 *  - BezierCutter: Mathematics for standard jigsaw tabs/blanks
 *  - PieceEntity: Handles bounding box, dragging, snapping
 *  - GameController: Manages game loop, physics, UI updates
 *  - AutoPilot: LERPs pieces to correct positions automatically
 *
 * Complexity (Ada):
 *  - Rendering: O(P) per frame where P is pieces
 *  - Snapshotting paths: O(1) during setup to pre-render piece shapes
 * ============================================================
 */
'use strict';

/* ============================================================
 * S1: AUDIO MANAGER
 * ============================================================ */
class AudioManager {
    constructor() { this.ctx = null; this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.on = false; } }
    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        try {
            const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            if (t === 'pick') {
                o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                o.start(now); o.stop(now + 0.1);
            } else if (t === 'snap') {
                o.type = 'triangle'; [600, 800].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * 0.05));
                g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                o.start(now); o.stop(now + 0.2);
            } else if (t === 'win') {
                o.type = 'sine'; [523, 659, 784, 1047, 1319].forEach((f, i) => o.frequency.setValueAtTime(f, now + i * 0.1));
                g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
                o.start(now); o.stop(now + 1.2);
            }
        } catch(e) {}
    }
}

/* ============================================================
 * S2: PROCEDURAL ART GENERATOR (Sky Odyssey)
 * ============================================================ */
class ProceduralArt {
    static generate(width, height) {
        const cvs = document.createElement('canvas');
        cvs.width = width; cvs.height = height;
        const ctx = cvs.getContext('2d');
        
        // Sky Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#192a56'); // Deep blue
        grad.addColorStop(0.5, '#74b9ff'); // Light blue
        grad.addColorStop(1, '#ff7675'); // Sunset pink
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Sun
        ctx.fillStyle = '#feca57';
        ctx.shadowColor = '#ff9f43';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.6, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Clouds Draw Function
        const drawCloud = (x, y, s) => {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath();
            ctx.arc(x, y, 20*s, 0, Math.PI * 2);
            ctx.arc(x + 25*s, y - 10*s, 30*s, 0, Math.PI * 2);
            ctx.arc(x + 50*s, y, 25*s, 0, Math.PI * 2);
            ctx.fill();
        };

        drawCloud(width * 0.1, height * 0.3, 1.5);
        drawCloud(width * 0.7, height * 0.2, 2.0);
        drawCloud(width * 0.4, height * 0.8, 1.2);
        drawCloud(width * 0.8, height * 0.7, 1.8);

        // Mountains Silhouette
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height * 0.7);
        ctx.lineTo(width * 0.3, height * 0.5);
        ctx.lineTo(width * 0.6, height * 0.8);
        ctx.lineTo(width, height * 0.4);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        return cvs;
    }
}

/* ============================================================
 * S3: BEZIER CUTTER & JIGSAW LOGIC
 * ============================================================ */
class BezierCutter {
    static getBezierPath(ctx, x, y, width, height, shape) {
        // shape: { top: 1|-1|0, right: ... , bottom: ..., left: ... }
        // 1 = tab (out), -1 = blank (in), 0 = straight edge
        const cw = width; const ch = height;
        const inset = 0.25; // connector relative size
        
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Top Edge
        if (shape.top === 0) { ctx.lineTo(x + cw, y); }
        else {
            const dir = shape.top;
            ctx.lineTo(x + cw * 0.35, y);
            ctx.bezierCurveTo(x + cw * 0.35, y - ch * inset * dir, x + cw * 0.65, y - ch * inset * dir, x + cw * 0.65, y);
            ctx.lineTo(x + cw, y);
        }

        // Right Edge
        if (shape.right === 0) { ctx.lineTo(x + cw, y + ch); }
        else {
            const dir = shape.right;
            ctx.lineTo(x + cw, y + ch * 0.35);
            ctx.bezierCurveTo(x + cw + cw * inset * dir, y + ch * 0.35, x + cw + cw * inset * dir, y + ch * 0.65, x + cw, y + ch * 0.65);
            ctx.lineTo(x + cw, y + ch);
        }

        // Bottom Edge
        if (shape.bottom === 0) { ctx.lineTo(x, y + ch); }
        else {
            const dir = shape.bottom;
            ctx.lineTo(x + cw * 0.65, y + ch);
            ctx.bezierCurveTo(x + cw * 0.65, y + ch + ch * inset * dir, x + cw * 0.35, y + ch + ch * inset * dir, x + cw * 0.35, y + ch);
            ctx.lineTo(x, y + ch);
        }

        // Left Edge
        if (shape.left === 0) { ctx.lineTo(x, y); }
        else {
            const dir = shape.left;
            ctx.lineTo(x, y + ch * 0.65);
            ctx.bezierCurveTo(x - cw * inset * dir, y + ch * 0.65, x - cw * inset * dir, y + ch * 0.35, x, y + ch * 0.35);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
}

/* ============================================================
 * S4: ELITE ENGINE
 * ============================================================ */
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        
        this.progEl = document.getElementById('progress-val');
        this.remEl = document.getElementById('remaining-val');
        this.timeEl = document.getElementById('timer-val');
        this.diffBtns = document.querySelectorAll('.diff-btn');
        
        this.audio = new AudioManager();
        
        this.pieces = [];
        this.gameActive = false;
        this.gridSize = 3;
        this.targetW = 600;
        this.targetH = 400;
        
        this.imgCvs = null; // Procedural Art
        
        this.draggedPiece = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        
        this.autoMode = false;
        this.peekMode = false;
        this.timer = 0;
        this.timerIv = null;

        this._bindEvents();
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        
        this.diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.diffBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.gridSize = parseInt(e.target.dataset.grid);
            });
        });

        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        const peekBtn = document.getElementById('peek-btn');
        peekBtn.addEventListener('mousedown', () => this.peekMode = true);
        peekBtn.addEventListener('mouseup', () => this.peekMode = false);
        peekBtn.addEventListener('mouseleave', () => this.peekMode = false);

        peekBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.peekMode = true; });
        peekBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.peekMode = false; });

        this.canvas.addEventListener('mousedown', e => this._onDown(e));
        document.addEventListener('mousemove', e => this._onMove(e));
        document.addEventListener('mouseup', e => this._onUp(e));
        
        this.canvas.addEventListener('touchstart', e => this._onDown(e.touches[0]));
        document.addEventListener('touchmove', e => this._onMove(e.touches[0]), {passive: false});
        document.addEventListener('touchend', e => this._onUp(e));
    }

    _resize() {
        const wrap = this.canvas.parentElement;
        this.canvas.width = wrap.clientWidth;
        this.canvas.height = wrap.clientHeight;
        
        // Calculate dynamic puzzle board size
        this.targetW = Math.min(600, this.canvas.width * 0.8);
        this.targetH = this.targetW * 0.66;
        
        this.offsetX = (this.canvas.width - this.targetW) / 2;
        this.offsetY = (this.canvas.height - this.targetH) / 2 - 20;

        if (this.gameActive) this._draw();
    }

    /* --- Core Initialization --- */
    _startGame() {
        this.audio.init();
        this.audio.wake();
        this.gameActive = true;
        this.overlay.classList.remove('active');
        
        this._resize();
        this.imgCvs = ProceduralArt.generate(this.targetW, this.targetH);
        
        this._createPieces();
        this._startTimer();
        this._updateHUD();
        
        this._loop();
    }

    _createPieces() {
        this.pieces = [];
        const pw = this.targetW / this.gridSize;
        const ph = this.targetH / this.gridSize;
        
        // Generate tab/blank shapes (Random choices between -1 and 1)
        const shapes = [];
        for (let row = 0; row < this.gridSize; row++) {
            shapes[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                shapes[row][col] = {
                    top: row === 0 ? 0 : -shapes[row-1][col].bottom,
                    right: col === this.gridSize - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    bottom: row === this.gridSize - 1 ? 0 : (Math.random() > 0.5 ? 1 : -1),
                    left: col === 0 ? 0 : -shapes[row][col-1].right
                };
            }
        }

        // Create logical pieces
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Correct position in the center target area
                const cx = this.offsetX + col * pw;
                const cy = this.offsetY + row * ph;
                
                // Shuffle initial spawn positions randomly outside target bounding
                let sx, sy;
                do {
                    sx = Math.random() * (this.canvas.width - pw);
                    sy = Math.random() * (this.canvas.height - ph);
                } while(
                    // Avoid spawning directly on top of the correct assembly area
                    Math.abs(sx - this.offsetX) < this.targetW && Math.abs(sy - this.offsetY) < this.targetH
                );

                this.pieces.push({
                    id: row + '-' + col,
                    cx, cy,       // Correct pos
                    x: sx, y: sy, // Current pos
                    start: {x: sx, y: sy}, // For lerping
                    shape: shapes[row][col],
                    w: pw, h: ph,
                    col, row,
                    locked: false,
                    z: Math.random()
                });
            }
        }
    }

    /* --- Interaction / Physics --- */
    _onDown(e) {
        if (!this.gameActive || this.autoMode || this.peekMode) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Sort by Z index to grab topmost
        const sorted = [...this.pieces].sort((a,b) => b.z - a.z);
        
        for (let p of sorted) {
            if (p.locked) continue;
            // Simple bounding box check
            if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
                this.draggedPiece = p;
                this.dragOffsetX = mx - p.x;
                this.dragOffsetY = my - p.y;
                p.z = Date.now(); // bring to front
                this.audio.play('pick');
                break;
            }
        }
    }

    _onMove(e) {
        if (this.draggedPiece && !this.peekMode) {
            const rect = this.canvas.getBoundingClientRect();
            this.draggedPiece.x = (e.clientX - rect.left) - this.dragOffsetX;
            this.draggedPiece.y = (e.clientY - rect.top) - this.dragOffsetY;
        }
    }

    _onUp(e) {
        if (this.draggedPiece) {
            const p = this.draggedPiece;
            // Snap Physics
            const dist = Math.hypot(p.cx - p.x, p.cy - p.y);
            if (dist < 30) {
                p.x = p.cx;
                p.y = p.cy;
                p.locked = true;
                this.audio.play('snap');
                this._updateHUD();
                this._checkWin();
            }
            this.draggedPiece = null;
        }
    }

    /* --- Auto Pilot Logic --- */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);
    }

    _updateAutoPilot(dt) {
        if (!this.autoMode || !this.gameActive) return;
        
        // Find first unlocked piece
        let target = this.pieces.find(p => !p.locked);
        if (target) {
            // Lerp towards correct position
            target.x += (target.cx - target.x) * 0.05;
            target.y += (target.cy - target.y) * 0.05;
            
            const dist = Math.hypot(target.cx - target.x, target.cy - target.y);
            if (dist < 5) {
                target.x = target.cx;
                target.y = target.cy;
                target.locked = true;
                this.audio.play('snap');
                this._updateHUD();
                this._checkWin();
            }
        } else {
            this.autoMode = false;
            this._toggleAuto();
        }
    }

    /* --- Game Loop & Rendering --- */
    _loop() {
        if (!this.gameActive) return;
        requestAnimationFrame(() => this._loop());
        
        this._updateAutoPilot();
        this._draw();
    }

    _draw() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding box template
        ctx.strokeStyle = 'rgba(100, 255, 218, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.offsetX, this.offsetY, this.targetW, this.targetH);
        ctx.setLineDash([]);

        if (this.peekMode) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this.imgCvs, this.offsetX, this.offsetY, this.targetW, this.targetH);
            ctx.globalAlpha = 1;
        }

        // Draw Pieces
        const sorted = [...this.pieces].sort((a,b) => a.z - b.z);
        sorted.forEach(p => {
            ctx.save();
            
            // Generate exact clipping path based on bezier
            BezierCutter.getBezierPath(ctx, p.x, p.y, p.w, p.h, p.shape);
            
            if (p.locked) {
                // Remove shadow for locked pieces for seamless blending
                ctx.clip();
                this._drawPieceContent(ctx, p);
            } else {
                // Drop shadow for floating pieces
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;
                ctx.stroke(); // stroke path just for shadow
                
                ctx.shadowColor = 'transparent';
                ctx.clip();
                this._drawPieceContent(ctx, p);
                
                // Border highlight
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
                BezierCutter.getBezierPath(ctx, p.x, p.y, p.w, p.h, p.shape);
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }

    _drawPieceContent(ctx, p) {
        // Map the sub-rectangle of the procedural art
        const sx = p.col * p.w;
        const sy = p.row * p.h;
        
        // Because the bezier cutter may push OUTSIDE the basic w * h bound when tabs = 1
        // We must draw a slightly larger slice of the source image to fill tabs!
        const inset = 0.25;
        const dx = p.x - p.w * inset;
        const dy = p.y - p.h * inset;
        const sX2 = sx - p.w * inset;
        const sY2 = sy - p.h * inset;
        const sW = p.w * (1 + inset * 2);
        const sH = p.h * (1 + inset * 2);

        ctx.drawImage(this.imgCvs, sX2, sY2, sW, sH, dx, dy, sW, sH);
    }

    _checkWin() {
        if (this.pieces.every(p => p.locked)) {
            this.gameActive = false;
            clearInterval(this.timerIv);
            this.audio.play('win');
            
            setTimeout(() => {
                const title = this.overlay.querySelector('h2');
                const sub = this.overlay.querySelector('.subtitle');
                title.textContent = '🎉 拼圖完成！';
                sub.innerHTML = `
                    耗時: <strong>${this.timeEl.textContent}</strong><br>
                    難度: <strong>${this.gridSize} x ${this.gridSize}</strong>
                `;
                document.getElementById('init-game-btn').textContent = '再次挑戰';
                this.overlay.classList.add('active');
            }, 1000);
        }
    }

    _startTimer() {
        this.timer = 0;
        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            if (!this.gameActive) return;
            this.timer++;
            const m = Math.floor(this.timer / 60);
            const s = this.timer % 60;
            this.timeEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        }, 1000);
    }

    _updateHUD() {
        const locked = this.pieces.filter(p => p.locked).length;
        const total = this.pieces.length;
        const pct = Math.round((locked / total) * 100);
        this.progEl.textContent = `${pct}%`;
        this.remEl.textContent = `${total - locked}`;
    }
}

/* ============================================================
 * BOOTSTRAP
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    new EliteEngine();
});
