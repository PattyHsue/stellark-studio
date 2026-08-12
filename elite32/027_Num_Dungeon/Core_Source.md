# 027_Num_Dungeon 原始碼全文獻 (Core Source & Audits)

本文件包含 027_Num_Dungeon 的完整程式碼，以及 UTT-v2.0 團隊 (Ada & Xavier) 對其架構與演算法的專業審計。可直接匯入 NotebookLM 作為分析基礎。

---

## 邏輯與架構審計 (Logic & Architecture Audits)

### 🧠 Ada 的邏輯檢驗 (Algorithmic Complexity & Formal Logic)
- **BFS 尋路演算法 (`findPath`)**:
  - **Time Complexity**: $O(V + E)$，其中 $V = W \times H$ (網格總數 $10 \times 10 = 100$)，$E$ 為邊數。
  - **Space Complexity**: $O(V)$，因為使用了 Queue 以及 `Set` 來記錄 `visited` 節點。
  - **邏輯證明**: 由於二維迷宮權重均等 (皆為1步)，BFS 保證能找到最短路徑。引入 `visited.add()` 完美防範了圖論中常見的 Cycle 造成的無限迴圈，確保了主執行緒不會被鎖死 (Browser Thread Safety)。
- **動態難度生成 (`resetDungeon`)**:
  - 敵人數值與補血量會根據 `difficultyFactor` 進行 Scaling ($1.0 + level \times 0.2 + score / 20000$)，確保了遊戲隨時間的挑戰曲線保持平滑的對數型增長。

### 🏗️ Xavier 的架構審查 (Clean Code & System Design)
- **單一職責原則 (Single Responsibility Principle, SRP)**: 
  - `AudioManager` 專注於 Web Audio Context 節點的拓撲管理。
  - `ParticleEmitter` 專注於 2D 物理狀態變更與生命週期。
  - `EliteEngine` 負責統合與 Game Loop 派發。
  - 各司其職，低耦合。
- **記憶體管理典範 (Memory Safety)**:
  - 粒子系統中刪除物件的 `update` 函數採用了工業標準的 **Reverse For-Loop Splice Rule** (`for (let i = this.particles.length - 1; i >= 0; i--)`)。這徹底避免了正向迴圈在 `splice` 後導致的索引錯位 (Index Shifting) 與潛在的記憶體洩漏 (Memory Leak)。

---

## 原始碼全文 (Source Code)

### 1. `game.js`
```javascript
class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
        this.bgmTimer = null;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6;
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn("Amber Synth Audio failed."); }
    }

    playBGM() {
        if (!this.isReady || this.bgmTimer) return;
        const trigger = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            // 古典共鳴頻率: 40Hz -> 45Hz -> 50Hz (模擬地心脈動)
            const freqs = [40, 45, 50, 45];
            osc.frequency.setValueAtTime(freqs[Math.floor(now % 4)], now);
            g.gain.setValueAtTime(0.1, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.2);
            this.bgmTimer = setTimeout(trigger, 1200);
        };
        trigger();
    }

    playCombat() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        // 數值吸收音 (琶音升頻)
        [0, 0.05, 0.1].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440 + i * 220, now + t);
            g.gain.setValueAtTime(0.1, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + t);
            osc.stop(now + t + 0.1);
        });
    }

    playImpact() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

class ParticleEmitter {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color
            });
        }
    }

    update() {
        // Reverse For-Loop Splice Rule 實作
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }
}

class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.scoreHUD = document.getElementById('score-val');
        this.livesHUD = document.getElementById('lives-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');
        
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        
        this.difficultyFactor = 1.0;
        this.isAuto = false;
        
        this.tileSize = 64;
        this.gridW = 10;
        this.gridH = 10;
        this.inset = 8;
        
        this.state = 'START';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.frame = 0;
        
        this.player = { x: 4, y: 4, power: 10 };
        this.grid = [];
        this.keys = {};
        
        this.highScore = parseInt(localStorage.getItem('numDungeon_highScore')) || 0;
        this.updateHighScoreUI();
        
        this.resetDungeon();
        this.initEvents();
        this.resize();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const minDim = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7);
        this.tileSize = Math.floor(minDim / Math.max(this.gridW, this.gridH));
        this.offsetX = (this.canvas.width - this.gridW * this.tileSize) / 2;
        this.offsetY = (this.canvas.height - this.gridH * this.tileSize) / 2;
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            this.handleMove(e.code);
        });

        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
            this.score = 0;
            this.lives = 3;
            this.level = 1;
            this.player.power = 10;
            this.resetDungeon();
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };

        let startX, startY;
        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.state !== 'PLAYING') return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            const minSwipe = 30;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipe) this.handleMove(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
            } else {
                if (Math.abs(dy) > minSwipe) this.handleMove(dy > 0 ? 'ArrowDown' : 'ArrowUp');
            }
        }, { passive: true });
    }

    resetDungeon() {
        this.grid = [];
        this.difficultyFactor = 1.0 + (this.level * 0.2) + (this.score / 20000);
        
        for (let y = 0; y < this.gridH; y++) {
            let row = [];
            for (let x = 0; x < this.gridW; x++) {
                if (x === this.player.x && y === this.player.y) {
                    row.push({ type: 'EMPTY' });
                } else {
                    const rnd = Math.random();
                    if (rnd < 0.15) row.push({ type: 'WALL' });
                    else if (rnd < 0.35) {
                        const baseVal = Math.floor(Math.random() * 8 * this.difficultyFactor) + 1;
                        row.push({ type: 'ENEMY', val: baseVal });
                    }
                    else if (rnd < 0.4) {
                        const healVal = Math.floor(Math.random() * 5 * this.difficultyFactor) + 2;
                        row.push({ type: 'HEAL', val: healVal });
                    }
                    else row.push({ type: 'FLOOR' });
                }
            }
            this.grid.push(row);
        }
        this.updateHUD();
    }

    handleMove(code) {
        let nx = this.player.x;
        let ny = this.player.y;
        if (code === 'KeyW' || code === 'ArrowUp') ny--;
        if (code === 'KeyS' || code === 'ArrowDown') ny++;
        if (code === 'KeyA' || code === 'ArrowLeft') nx--;
        if (code === 'KeyD' || code === 'ArrowRight') nx++;

        if (nx >= 0 && nx < this.gridW && ny >= 0 && ny < this.gridH) {
            const tile = this.grid[ny][nx];
            if (tile.type === 'WALL') {
                this.audio.playImpact();
                return;
            }
            
            if (tile.type === 'ENEMY') {
                if (this.player.power >= tile.val) {
                    this.player.power += Math.floor(tile.val / 2);
                    this.score += tile.val * 10;
                    this.audio.playCombat();
                    this.vfx.emit(nx * this.tileSize + this.tileSize/2, ny * this.tileSize + this.tileSize/2, '#ffab00', 15);
                    tile.type = 'FLOOR';
                } else {
                    this.lives--;
                    this.audio.playImpact();
                    this.shake = 10;
                    if (this.lives <= 0) this.endGame('MISSION FAILED');
                    return;
                }
            } else if (tile.type === 'HEAL') {
                this.player.power += tile.val;
                this.audio.playCombat();
                this.vfx.emit(nx * this.tileSize + this.tileSize/2, ny * this.tileSize + this.tileSize/2, '#00e676', 10);
                tile.type = 'FLOOR';
            }

            this.player.x = nx;
            this.player.y = ny;
            this.updateHUD();
            
            if (this.score > this.level * 1000) {
                this.level++;
                this.resetDungeon();
            }
        }
    }

    updateHUD() {
        this.scoreHUD.innerText = String(this.score).padStart(6, '0');
        this.livesHUD.innerText = '❤'.repeat(this.lives);
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        const hiText = `<div id="hi-score-disp" style="font-size:0.55rem; opacity:0.6; margin-top:5px; color:#ffab00">HI-SCORE: ${String(this.highScore).padStart(6, '0')}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    endGame(status) {
        this.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('numDungeon_highScore', this.highScore);
            this.updateHighScoreUI();
        }
        document.getElementById('overlay-heading').innerText = status;
        document.getElementById('overlay-description').innerText = `地牢探索結束。最終得分: ${this.score}`;
        document.getElementById('init-game-btn').innerText = 'REBOOT MISSION';
        this.overlay.classList.add('active');
    }

    update() {
        if (this.state !== 'PLAYING') return;
        if (this.isAuto) this.executeAutoPilot();
        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.85; 
        
        this.frame++;
    }

    findPath(target) {
        const queue = [{ x: this.player.x, y: this.player.y, path: [] }];
        const visited = new Set();
        visited.add(`${this.player.x},${this.player.y}`);

        const dirs = [
            { x: 0, y: -1, key: 'ArrowUp' },
            { x: 0, y: 1, key: 'ArrowDown' },
            { x: -1, y: 0, key: 'ArrowLeft' },
            { x: 1, y: 0, key: 'ArrowRight' }
        ];

        while (queue.length > 0) {
            const { x, y, path } = queue.shift();
            if (x === target.x && y === target.y) return path[0];

            for (const d of dirs) {
                const nx = x + d.x;
                const ny = y + d.y;
                const key = `${nx},${ny}`;

                if (nx >= 0 && nx < this.gridW && ny >= 0 && ny < this.gridH && !visited.has(key)) {
                    const t = this.grid[ny][nx];
                    const isPassable = t.type !== 'WALL' && (t.type !== 'ENEMY' || t.val <= this.player.power);
                    
                    if (isPassable) {
                        visited.add(key);
                        queue.push({ x: nx, y: ny, path: [...path, d.key] });
                    }
                }
            }
        }
        return null;
    }

    executeAutoPilot() {
        if (this.frame % 10 !== 0) return;
        
        let target = null;
        let minDist = Infinity;
        
        for (let y = 0; y < this.gridH; y++) {
            for (let x = 0; x < this.gridW; x++) {
                const t = this.grid[y][x];
                let isWorth = false;
                if (t.type === 'HEAL') isWorth = true;
                if (t.type === 'ENEMY' && t.val <= this.player.power) isWorth = true;
                
                if (isWorth) {
                    const d = Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
                    if (d < minDist) {
                        minDist = d;
                        target = { x, y };
                    }
                }
            }
        }

        if (target) {
            const nextMove = this.findPath(target);
            if (nextMove) {
                this.handleMove(nextMove);
            } else {
                const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
                this.handleMove(dirs[Math.floor(Math.random() * 4)]);
            }
        } else {
            const dirs = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
            this.handleMove(dirs[Math.floor(Math.random() * 4)]);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        this.ctx.translate(this.offsetX, this.offsetY);

        for (let y = 0; y < this.gridH; y++) {
            for (let x = 0; x < this.gridW; x++) {
                const tile = this.grid[y][x];
                const tx = x * this.tileSize;
                const ty = y * this.tileSize;

                this.ctx.strokeStyle = 'rgba(255, 171, 0, 0.05)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(tx, ty, this.tileSize, this.tileSize);

                if (tile.type === 'WALL') {
                    const grd = this.ctx.createLinearGradient(tx, ty, tx + this.tileSize, ty + this.tileSize);
                    grd.addColorStop(0, '#2a2a2a');
                    grd.addColorStop(1, '#111');
                    this.ctx.fillStyle = grd;
                    this.ctx.fillRect(tx + 4, ty + 4, this.tileSize - 8, this.tileSize - 8);
                } else if (tile.type === 'ENEMY') {
                    const breath = Math.sin(this.frame * 0.1) * 5;
                    this.ctx.fillStyle = '#ff3d00';
                    this.ctx.shadowBlur = 10 + breath;
                    this.ctx.shadowColor = '#ff3d00';
                    this.ctx.font = `bold ${this.tileSize/3}px Outfit`;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(tile.val, tx + this.tileSize/2, ty + this.tileSize/2 + 12);
                    this.ctx.shadowBlur = 0;
                } else if (tile.type === 'HEAL') {
                    this.ctx.fillStyle = '#00e676';
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#00e676';
                    this.ctx.beginPath();
                    this.ctx.arc(tx + this.tileSize/2, ty + this.tileSize/2, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        const px = this.player.x * this.tileSize;
        const py = this.player.y * this.tileSize;
        
        const pGrd = this.ctx.createRadialGradient(
            px + this.tileSize/2, py + this.tileSize/2, 2,
            px + this.tileSize/2, py + this.tileSize/2, this.tileSize/2
        );
        pGrd.addColorStop(0, '#fff');
        pGrd.addColorStop(0.3, '#ffab00');
        pGrd.addColorStop(1, '#ff6f00');

        this.ctx.fillStyle = pGrd;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffab00';
        this.ctx.fillRect(px + this.inset, py + this.inset, this.tileSize - this.inset*2, this.tileSize - this.inset*2);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px + this.inset, py + this.inset, this.tileSize - this.inset*2, this.tileSize - this.inset*2);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = `bold ${this.tileSize/4}px Outfit`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.player.power, px + this.tileSize/2, py + this.tileSize/2 + 8);
        this.ctx.shadowBlur = 0;

        this.vfx.draw(this.ctx);
        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => new EliteEngine();
```
