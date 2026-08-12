# 026_Jigsaw 原始碼全文獻 (Core Source & Audits)

本文件包含 026_Jigsaw 的完整程式碼，以及 UTT-v2.0 團隊 (Ada & Xavier) 對其架構與演算法的專業審計。可直接匯入 NotebookLM 作為分析基礎。

---

## 邏輯與架構審計 (Logic & Architecture Audits)

### 🧠 Ada 的邏輯檢驗 (Algorithmic Complexity & Formal Logic)
- **渲染與碰撞偵測 (Rendering & Hit Detection)**:
  - **Time Complexity**: $O(P)$ 每一幀，其中 $P$ 是拼圖的總數量 ($N \times N$)。
  - **Z-Index 排序**: 在 `mousedown` 事件中尋找最上層的目標時，使用了 `[...this.pieces].sort((a,b) => b.z - a.z)`。排序複雜度為 $O(P \log P)$，由於 $P$ 最大僅為 25 (5x5)，因此在主執行緒中效能極佳。
- **幾何擴展算法 (The Inset Expansion Logic)**:
  - 核心難點在於 `drawImage` 的 Source 採樣。因為貝茲曲線 (Bezier) 構造的凸塊超越了原本的寬度 `W` 與高度 `H`。藉由將採樣框擴大 `(1 + inset * 2)` 並將起始點偏移 `-W * inset`，完美覆蓋了所有數學上的凸出面積，證明了「空間補償」在圖形學上的絕對必要性。

### 🏗️ Xavier 的架構審查 (Clean Code & System Design)
- **單一職責與模組分離 (SOLID)**: 
  - `ProceduralArt`: 完全純粹的無狀態工廠 (Stateless Factory)，負責生成影像並回傳 Canvas。
  - `BezierCutter`: 只負責純數學的 Context 路徑操作，絕不干涉渲染與遊戲邏輯。
  - `EliteEngine`: 作為總指揮，處理 State 狀態機與 DOM 事件派發。
  - 這種高度解耦的架構，使得如果我們明天想換一張圖片，只需抽換 `ProceduralArt`，而底層的物理與裁切邏輯完全不需修改 (Open-Closed Principle)。

---

## 原始碼全文 (Source Code)

### 1. `game.js`
```javascript
/**
 * ============================================================
 * 026_JIGSAW | 空中拼圖
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Clean SOLID jigsaw implementation.
 *  - ProceduralArt: Generates "Sky Odyssey" canvas art dynamically
 *  - BezierCutter: Mathematics for standard jigsaw tabs/blanks
 *  - GameController: Manages game loop, physics, UI updates
 *  - AutoPilot: LERPs pieces to correct positions automatically
 * ============================================================
 */
'use strict';

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

class ProceduralArt {
    static generate(width, height) {
        const cvs = document.createElement('canvas');
        cvs.width = width; cvs.height = height;
        const ctx = cvs.getContext('2d');
        
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#192a56'); 
        grad.addColorStop(0.5, '#74b9ff'); 
        grad.addColorStop(1, '#ff7675'); 
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#feca57';
        ctx.shadowColor = '#ff9f43';
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(width * 0.5, height * 0.6, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

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

class BezierCutter {
    static getBezierPath(ctx, x, y, width, height, shape) {
        const cw = width; const ch = height;
        const inset = 0.25; 
        
        ctx.beginPath();
        ctx.moveTo(x, y);

        if (shape.top === 0) { ctx.lineTo(x + cw, y); }
        else {
            const dir = shape.top;
            ctx.lineTo(x + cw * 0.35, y);
            ctx.bezierCurveTo(x + cw * 0.35, y - ch * inset * dir, x + cw * 0.65, y - ch * inset * dir, x + cw * 0.65, y);
            ctx.lineTo(x + cw, y);
        }

        if (shape.right === 0) { ctx.lineTo(x + cw, y + ch); }
        else {
            const dir = shape.right;
            ctx.lineTo(x + cw, y + ch * 0.35);
            ctx.bezierCurveTo(x + cw + cw * inset * dir, y + ch * 0.35, x + cw + cw * inset * dir, y + ch * 0.65, x + cw, y + ch * 0.65);
            ctx.lineTo(x + cw, y + ch);
        }

        if (shape.bottom === 0) { ctx.lineTo(x, y + ch); }
        else {
            const dir = shape.bottom;
            ctx.lineTo(x + cw * 0.65, y + ch);
            ctx.bezierCurveTo(x + cw * 0.65, y + ch + ch * inset * dir, x + cw * 0.35, y + ch + ch * inset * dir, x + cw * 0.35, y + ch);
            ctx.lineTo(x, y + ch);
        }

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
        
        this.imgCvs = null; 
        this.draggedPiece = null;
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
        this.targetW = Math.min(600, this.canvas.width * 0.8);
        this.targetH = this.targetW * 0.66;
        this.offsetX = (this.canvas.width - this.targetW) / 2;
        this.offsetY = (this.canvas.height - this.targetH) / 2 - 20;
        if (this.gameActive) this._draw();
    }

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

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cx = this.offsetX + col * pw;
                const cy = this.offsetY + row * ph;
                let sx, sy;
                do {
                    sx = Math.random() * (this.canvas.width - pw);
                    sy = Math.random() * (this.canvas.height - ph);
                } while(Math.abs(sx - this.offsetX) < this.targetW && Math.abs(sy - this.offsetY) < this.targetH);

                this.pieces.push({
                    id: row + '-' + col, cx, cy, x: sx, y: sy,
                    shape: shapes[row][col], w: pw, h: ph, col, row, locked: false, z: Math.random()
                });
            }
        }
    }

    _onDown(e) {
        if (!this.gameActive || this.autoMode || this.peekMode) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const sorted = [...this.pieces].sort((a,b) => b.z - a.z);
        
        for (let p of sorted) {
            if (p.locked) continue;
            if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
                this.draggedPiece = p;
                this.dragOffsetX = mx - p.x;
                this.dragOffsetY = my - p.y;
                p.z = Date.now();
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

    _toggleAuto() {
        this.autoMode = !this.autoMode;
        document.getElementById('auto-pilot-status').textContent = this.autoMode ? 'ON' : 'OFF';
        document.getElementById('auto-pilot-toggle').classList.toggle('active', this.autoMode);
    }

    _updateAutoPilot() {
        if (!this.autoMode || !this.gameActive) return;
        let target = this.pieces.find(p => !p.locked);
        if (target) {
            target.x += (target.cx - target.x) * 0.05;
            target.y += (target.cy - target.y) * 0.05;
            if (Math.hypot(target.cx - target.x, target.cy - target.y) < 5) {
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

    _loop() {
        if (!this.gameActive) return;
        requestAnimationFrame(() => this._loop());
        this._updateAutoPilot();
        this._draw();
    }

    _draw() {
        const { ctx, canvas } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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

        const sorted = [...this.pieces].sort((a,b) => a.z - b.z);
        sorted.forEach(p => {
            ctx.save();
            BezierCutter.getBezierPath(ctx, p.x, p.y, p.w, p.h, p.shape);
            
            if (p.locked) {
                ctx.clip();
                this._drawPieceContent(ctx, p);
            } else {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 3;
                ctx.shadowOffsetY = 3;
                ctx.stroke(); 
                
                ctx.shadowColor = 'transparent';
                ctx.clip();
                this._drawPieceContent(ctx, p);
                
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(100, 255, 218, 0.5)';
                BezierCutter.getBezierPath(ctx, p.x, p.y, p.w, p.h, p.shape);
                ctx.stroke();
            }
            ctx.restore();
        });
    }

    _drawPieceContent(ctx, p) {
        const sx = p.col * p.w;
        const sy = p.row * p.h;
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
                this.overlay.querySelector('h2').textContent = '🎉 拼圖完成！';
                this.overlay.querySelector('.subtitle').innerHTML = `耗時: <strong>${this.timeEl.textContent}</strong><br>難度: <strong>${this.gridSize} x ${this.gridSize}</strong>`;
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
            this.timeEl.textContent = `${String(Math.floor(this.timer / 60)).padStart(2,'0')}:${String(this.timer % 60).padStart(2,'0')}`;
        }, 1000);
    }

    _updateHUD() {
        const locked = this.pieces.filter(p => p.locked).length;
        this.progEl.textContent = `${Math.round((locked / this.pieces.length) * 100)}%`;
        this.remEl.textContent = `${this.pieces.length - locked}`;
    }
}

document.addEventListener('DOMContentLoaded', () => new EliteEngine());
```
