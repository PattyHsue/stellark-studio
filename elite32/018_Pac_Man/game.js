class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
        this.bgmTimer = null;
        this.beat = 0;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6; // Increased from 0.15
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn("Audio Context failed."); }
    }

    // 1. 合成背景音 (具備節奏感的低頻 Triangle)
    playBGM() {
        if (!this.isReady || this.bgmTimer) return;
        const trigger = () => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime([55, 55, 65.4, 43.6][this.beat % 4], now);
            g.gain.setValueAtTime(0.2, now); // Increased from 0.08
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.4);
            this.beat++;
            this.bgmTimer = setTimeout(trigger, 400);
        };
        trigger();
    }

    // 2. 行為音效: 衝擊感 (Impact) - 頻頻切換滑頻
    playImpact() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.2);
        g.gain.setValueAtTime(0.2, now); // Increased from 0.1
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 3. 行為音效: 成功 (Success) - 高頻琶音
    playSuccess() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [0, 0.1, 0.2].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880 + i * 440, now + t);
            g.gain.setValueAtTime(0.1, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.2);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + t);
            osc.stop(now + t + 0.2);
        });
    }
}

class ParticleEmitter {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                color,
                gravity: 0.15
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1.0;
    }
}

class EliteEngine {
    constructor() {
        // Step 1 UI Elements
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.hudScore = document.getElementById('score-val');
        this.hudLives = document.getElementById('lives-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');
        
        // Step 3 & 4 Integration
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        
        // Step 5: AI & Difficulty Matrix
        this.difficultyFactor = 1.0;
        this.isAuto = false;
        
        // Physics Configuration
        this.tileSize = 24;
        this.gridW = 19;
        this.gridH = 21;
        this.inset = 4; // Inset Hitbox
        
        // Game State
        this.state = 'START';
        this.score = 0;
        this.lives = 3;
        this.frame = 0;
        this.isAuto = false;
        
        // Input Management
        this.keys = {};
        this.touch = { x: 0, y: 0, active: false };
        
        // Maze Initial Template
        this.initialMaze = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
            [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,3,0,3,0,0,0,1,0,0,0,0],
            [3,3,3,0,1,0,3,3,3,3,3,3,3,0,1,0,3,3,3],
            [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
            [3,0,3,3,1,3,3,0,3,3,3,0,3,3,1,3,3,0,3],
            [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
            [3,3,3,0,1,0,3,3,3,3,3,3,3,0,1,0,3,3,3],
            [0,0,0,0,1,0,0,0,3,0,3,0,0,0,1,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
            [0,2,1,0,1,1,1,1,1,3,1,1,1,1,1,0,1,2,0],
            [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        ];
        this.maze = []; 

        // Entity Setup (Coordinates in grid units)
        this.pacman = { x: 9, y: 16, dir: 'LEFT', nextDir: 'LEFT', speed: 0.12 };
        
        // 1. 幽靈陣容整合 (Ghost Fleet Integration)
        this.ghosts = [
            { x: 9, y: 8, color: '#ff0000', dir: 'UP', speed: 0.08, state: 'NORMAL' },
            { x: 8, y: 10, color: '#ffb8ff', dir: 'LEFT', speed: 0.08, state: 'NORMAL' },
            { x: 10, y: 10, color: '#00ffff', dir: 'RIGHT', speed: 0.08, state: 'NORMAL' },
            { x: 9, y: 10, color: '#ffb852', dir: 'UP', speed: 0.08, state: 'NORMAL' }
        ];

        // 2. 數據持久化 (Data Persistence)
        this.highScore = parseInt(localStorage.getItem('pacman_highScore')) || 0;
        this.updateHighScoreUI();
        
        this.initEvents();
        this.resize();
        this.resetGame(); // Ensure maze and entities are ready
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 視窗適應 (Viewport Adaptation): 自動縮放 tileSize 以適應小螢幕
        const minDim = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.7);
        this.tileSize = Math.floor(minDim / Math.max(this.gridW, this.gridH));
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // 1. 觸控映射 (Mobile Touch Mapping)
        const handleTouch = (e) => {
            if (this.state !== 'PLAYING') return;
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const tx = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            const ty = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
            
            // 轉化為相對位移決定方向
            const ox = (this.canvas.width - this.gridW * this.tileSize) / 2;
            const oy = (this.canvas.height - this.gridH * this.tileSize) / 2;
            const px = this.pacman.x * this.tileSize + this.tileSize / 2 + ox;
            const py = this.pacman.y * this.tileSize + this.tileSize / 2 + oy;

            const dx = tx - px;
            const dy = ty - py;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.pacman.nextDir = dx > 0 ? 'RIGHT' : 'LEFT';
            } else {
                this.pacman.nextDir = dy > 0 ? 'DOWN' : 'UP';
            }
            if (e.cancelable) e.preventDefault();
        };

        this.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouch, { passive: false });

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };

        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.resetGame();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
        };
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.frame = 0;
        this.pacman = { x: 9, y: 16, dir: 'LEFT', nextDir: 'LEFT', speed: 0.12 };
        this.ghosts = [
            { x: 9, y: 8, color: '#ff0000', dir: 'UP', speed: 0.08, state: 'NORMAL' },
            { x: 8, y: 10, color: '#ffb8ff', dir: 'LEFT', speed: 0.08, state: 'NORMAL' },
            { x: 10, y: 10, color: '#00ffff', dir: 'RIGHT', speed: 0.08, state: 'NORMAL' },
            { x: 9, y: 10, color: '#ffb852', dir: 'UP', speed: 0.08, state: 'NORMAL' }
        ];
        
        // Reset Maze (Deep copy)
        this.maze = JSON.parse(JSON.stringify(this.initialMaze));
        this.updateHUD();
    }

    // 核心物理: 4-Corner Sync (四角座標同步) + Inset Hitbox
    checkCollision(x, y) {
        // 將網格座標轉換為實際像素中心進行檢測
        const corners = [
            { x: x * this.tileSize + this.inset, y: y * this.tileSize + this.inset },
            { x: (x + 1) * this.tileSize - this.inset, y: y * this.tileSize + this.inset },
            { x: x * this.tileSize + this.inset, y: (y + 1) * this.tileSize - this.inset },
            { x: (x + 1) * this.tileSize - this.inset, y: (y + 1) * this.tileSize - this.inset }
        ];

        for (const c of corners) {
            const gx = Math.floor(c.x / this.tileSize);
            const gy = Math.floor(c.y / this.tileSize);
            
            // 穿梭通道處理
            if (gx < 0 || gx >= this.gridW) continue;
            
            if (this.maze[gy] && this.maze[gy][gx] === 0) return true;
        }
        return false;
    }

    handleInput() {
        if (this.isAuto) {
            this.executeAutoPilot();
            return;
        }

        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.pacman.nextDir = 'UP';
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.pacman.nextDir = 'DOWN';
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.pacman.nextDir = 'LEFT';
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.pacman.nextDir = 'RIGHT';
    }

    // 1. 偵測邏輯: BFS + Lerp 插值預判
    executeAutoPilot() {
        const p = this.pacman;
        const curX = Math.round(p.x);
        const curY = Math.round(p.y);
        
        // 僅在接近網格中心時進行決策
        if (Math.abs(p.x - curX) > 0.05 || Math.abs(p.y - curY) > 0.05) return;

        // BFS 尋找最近路徑
        const queue = [[curX, curY, []]];
        const visited = new Set();
        let bestPath = [];

        while (queue.length > 0) {
            const [cx, cy, path] = queue.shift();
            const key = `${cx},${cy}`;
            if (visited.has(key)) continue;
            visited.add(key);

            if (this.maze[cy][cx] === 1 || this.maze[cy][cx] === 2) {
                bestPath = path;
                break;
            }

            [['UP',0,-1], ['DOWN',0,1], ['LEFT',-1,0], ['RIGHT',1,0]].forEach(([d, dx, dy]) => {
                let nx = cx + dx, ny = cy + dy;
                // Tunnel warp
                if (nx < 0) nx = this.gridW - 1;
                if (nx >= this.gridW) nx = 0;
                
                if (this.maze[ny] && this.maze[ny][nx] !== 0) {
                    queue.push([nx, ny, [...path, d]]);
                }
            });
            if (queue.length > 200) break;
        }

        if (bestPath.length > 0) p.nextDir = bestPath[0];
    }

    update() {
        if (this.state !== 'PLAYING') return;

        this.difficultyFactor = 1.0 + (this.score / 5000);
        this.handleInput();
        
        const p = this.pacman;
        const curX = Math.round(p.x);
        const curY = Math.round(p.y);

        this.updateMotion(p, curX, curY);
        this.moveGhosts();
        this.checkCollisions();
        
        this.vfx.update();

        this.checkConsumption(p, Math.round(p.x), Math.round(p.y));

        this.frame++;
    }

    moveGhosts() {
        this.ghosts.forEach((g, i) => {
            const curX = Math.round(g.x);
            const curY = Math.round(g.y);
            
            if (Math.abs(g.x - curX) < 0.05 && Math.abs(g.y - curY) < 0.05) {
                g.x = curX; g.y = curY;
                const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(d => d !== this.oppositeDir(g.dir));
                const validDirs = dirs.filter(d => this.canMove(g.x, g.y, d));
                if (validDirs.length > 0) g.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            }
            
            const gs = g.speed * this.difficultyFactor;
            if (g.dir === 'LEFT') g.x -= gs;
            if (g.dir === 'RIGHT') g.x += gs;
            if (g.dir === 'UP') g.y -= gs;
            if (g.dir === 'DOWN') g.y += gs;

            if (g.x < -0.5) g.x = this.gridW - 0.5;
            if (g.x > this.gridW - 0.5) g.x = -0.5;
        });
    }

    oppositeDir(dir) {
        return { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }[dir];
    }

    checkCollisions() {
        this.ghosts.forEach(g => {
            const dist = Math.hypot(this.pacman.x - g.x, this.pacman.y - g.y);
            if (dist < 0.6) {
                this.lives--;
                this.audio.playImpact();
                this.vfx.emit(this.pacman.x * this.tileSize, this.pacman.y * this.tileSize, '#fff', 30);
                
                if (this.lives <= 0) {
                    this.endGame('DISCONNECTED');
                } else {
                    this.pacman = { x: 9, y: 16, dir: 'LEFT', nextDir: 'LEFT', speed: 0.12 };
                }
                this.updateHUD();
            }
        });
    }

    endGame(status) {
        this.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacman_highScore', this.highScore);
            this.updateHighScoreUI();
        }
        document.getElementById('overlay-heading').innerText = status;
        document.getElementById('overlay-description').innerText = `系統鏈路損毀。終端得分: ${this.score}`;
        document.getElementById('init-game-btn').innerText = 'START';
        this.overlay.classList.add('active');
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        // 清除舊的 HI Score 顯示並更新
        const hiText = `<div id="hi-score-disp" style="font-size:0.5rem; opacity:0.5; margin-top:5px">HI ${String(this.highScore).padStart(6, '0')}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    checkConsumption(p, gx, gy) {
        if (this.maze[gy] && this.maze[gy][gx] === 1) {
            this.maze[gy][gx] = 3;
            this.score += 10;
            this.audio.playImpact();
            this.vfx.emit(p.x * this.tileSize + 12, p.y * this.tileSize + 12, '#fff', 5);
            this.updateHUD();
        } else if (this.maze[gy] && this.maze[gy][gx] === 2) {
            this.maze[gy][gx] = 3;
            this.score += 50;
            this.audio.playSuccess();
            this.vfx.emit(p.x * this.tileSize + 12, p.y * this.tileSize + 12, '#f9d423', 20);
            this.updateHUD();
        }
    }

    updateMotion(p, curX, curY) {
        if (Math.abs(p.x - curX) < 0.05 && Math.abs(p.y - curY) < 0.05) {
            if (this.canMove(curX, curY, p.nextDir)) {
                if (p.dir !== p.nextDir) {
                    p.dir = p.nextDir;
                    p.x = curX; p.y = curY;
                }
            }
        }

        const s = p.speed * this.difficultyFactor;
        if (this.canMove(p.x, p.y, p.dir)) {
            if (p.dir === 'LEFT') p.x -= s;
            if (p.dir === 'RIGHT') p.x += s;
            if (p.dir === 'UP') p.y -= s;
            if (p.dir === 'DOWN') p.y += s;
        } else {
            p.x = curX; p.y = curY;
        }

        if (p.x < -0.5) p.x = this.gridW - 0.5;
        if (p.x > this.gridW - 0.5) p.x = -0.5;
    }

    canMove(x, y, dir) {
        let tx = Math.round(x);
        let ty = Math.round(y);
        if (dir === 'LEFT') tx--;
        if (dir === 'RIGHT') tx++;
        if (dir === 'UP') ty--;
        if (dir === 'DOWN') ty++;
        
        if (tx < 0 || tx >= this.gridW) return true; // Tunnel access
        return this.maze[ty] && this.maze[ty][tx] !== 0;
    }

    updateHUD() {
        this.hudScore.innerText = String(this.score).padStart(6, '0');
    }

    draw() {
        this.ctx.fillStyle = '#020205';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const offsetX = (this.canvas.width - this.gridW * this.tileSize) / 2;
        const offsetY = (this.canvas.height - this.gridH * this.tileSize) / 2;

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        // 2. 程序化紋理 (Maze & Dots)
        for (let y = 0; y < this.gridH; y++) {
            for (let x = 0; x < this.gridW; x++) {
                const cell = this.maze[y][x];
                const cx = x * this.tileSize;
                const cy = y * this.tileSize;
                
                if (cell === 0) {
                    const grd = this.ctx.createLinearGradient(cx, cy, cx + this.tileSize, cy + this.tileSize);
                    grd.addColorStop(0, '#2196f3');
                    grd.addColorStop(1, '#0d47a1');
                    this.ctx.strokeStyle = grd;
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(cx + 4, cy + 4, this.tileSize - 8, this.tileSize - 8);
                } else if (cell === 1) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(cx + this.tileSize/2, cy + this.tileSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (cell === 2) {
                    // 發光能量球
                    const pulse = Math.abs(Math.sin(this.frame * 0.1)) * 3;
                    this.ctx.fillStyle = '#fff';
                    this.ctx.shadowBlur = 10 + pulse;
                    this.ctx.shadowColor = '#fff';
                    this.ctx.beginPath();
                    this.ctx.arc(cx + this.tileSize/2, cy + this.tileSize/2, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                }
            }
        }

        // Render Pac-Man (Neon Metal Texture)
        const px = this.pacman.x * this.tileSize + this.tileSize / 2;
        const py = this.pacman.y * this.tileSize + this.tileSize / 2;
        const pGrad = this.ctx.createRadialGradient(px, py, 2, px, py, this.tileSize/2);
        pGrad.addColorStop(0, '#fff');
        pGrad.addColorStop(0.3, '#f9d423');
        pGrad.addColorStop(1, '#ff9800');
        
        this.ctx.fillStyle = pGrad;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#f9d423';
        
        // 2. 視覺補強: 高亮度描邊 (Outline Glow)
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        const mouth = Math.abs(Math.sin(this.frame * 0.2)) * 0.25 * Math.PI;
        this.ctx.arc(px, py, this.tileSize / 2 - 2, mouth, 2 * Math.PI - mouth);
        this.ctx.lineTo(px, py);
        this.ctx.fill();
        this.ctx.stroke(); // 繪製描邊
        // 3. Draw Ghosts (Neon Glow)
        this.ghosts.forEach(g => {
            const gx = g.x * this.tileSize + this.tileSize / 2;
            const gy = g.y * this.tileSize + this.tileSize / 2;
            const r = this.tileSize / 2 - 3;
            this.ctx.fillStyle = g.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = g.color;
            this.ctx.beginPath();
            this.ctx.arc(gx, gy, r, Math.PI, 0); 
            this.ctx.lineTo(gx + r, gy + r);
            this.ctx.lineTo(gx - r, gy + r);
            this.ctx.fill();
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(gx - 4, gy - 2, 2, 0, Math.PI * 2);
            this.ctx.arc(gx + 4, gy - 2, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
        this.vfx.draw(this.ctx);
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new EliteEngine();
});
