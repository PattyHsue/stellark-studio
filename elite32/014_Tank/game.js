/**
 * 014_Tank 1990: Elite Industrial Engine
 * Architect: UTT-v2.0 (Xavier & Ada & Arthur)
 * Version: 2.0.0-Tactical
 * Standards: 4-Corner Sync, Inset Hitbox, Non-blocking UI
 */

"use strict";

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
            this.masterGain.gain.value = 0.6; // Increased from 0.15
            this.isReady = true;
            console.log("Audio Matrix Initialized.");
        } catch (e) {
            console.warn("Audio Context failed to initialize.");
        }
    }

    // 1. 合成背景音 (具備節奏感的低頻 Triangle)
    playBGM() {
        if (!this.isReady || this.bgmTimer) return;
        
        const playBeat = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            
            osc.type = 'triangle';
            // 戰術節奏: A1 -> A1 -> E2 (模擬坦克引擎與聲納)
            const notes = [55, 55, 82.4]; 
            const freq = notes[Math.floor(now % 3)];
            
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0.1, now); // Increased from 0.04
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.5);
            
            this.bgmTimer = setTimeout(playBeat, 500); // 120 BPM
        };
        playBeat();
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    // 2. 行為音效: 射擊 (波形切換滑頻)
    playShoot() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        
        g.gain.setValueAtTime(0.2, now); // Increased from 0.1
        g.gain.linearRampToValueAtTime(0, now + 0.1);
        
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 彈頭擊中 (頻率向下滑動 + 噪聲模擬)
    playImpact() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);
        
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 3. 勝利/升級音效 (高頻琶音)
    playSuccess() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.1);
            g.gain.setValueAtTime(0.1, now + i * 0.1);
            g.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.2);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }

    playExplode() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        g.gain.setValueAtTime(0.3, now);
        g.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
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
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8 - 2, // 向上噴發
                size: Math.random() * 4 + 2,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                color,
                gravity: 0.15 // 物理重力
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity; // 應用重力
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
            ctx.shadowBlur = 0;
        });
        ctx.globalAlpha = 1.0;
    }
}

class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        
        // 核心配置
        this.tileSize = 40;
        this.inset = 4;
        this.state = 'START';
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isAuto = false;
        
        // 屏幕反饋: 畫面震動
        this.shakeAmount = 0;

        // 實體池
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.map = [];

        // 輸入校準
        this.keys = {};
        this.touch = { active: false, x: 0, y: 0 };
        
        this.initEvents();
        this.resize();
        this.showOverlay('BATTLE CITY', '守護基地，殲滅敵軍');
        this.loop();
    }

    resize() {
        const oldW = this.canvas.width;
        const oldH = this.canvas.height;
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 視窗適應: 如果正在遊戲中，重新計算縮放比例或重啟佈局
        if (this.state === 'PLAYING') {
            this.initLevel(); 
        }
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // 1. 觸控映射 (Mobile Polish)
        const handlePointer = (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.cancelable) e.preventDefault(); // 防止滾動干擾
            
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // 坐標轉換: 屏幕 -> Canvas
            this.touch.x = (clientX - rect.left) * (this.canvas.width / rect.width);
            this.touch.y = (clientY - rect.top) * (this.canvas.height / rect.height);
            this.touch.active = true;

            // 移動端搖桿邏輯: 根據觸控位置決定方向
            const p = this.player;
            const dx = this.touch.x - p.x - p.w/2;
            const dy = this.touch.y - p.y - p.h/2;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.keys['ArrowLeft'] = dx < -20;
                this.keys['ArrowRight'] = dx > 20;
                this.keys['ArrowUp'] = false;
                this.keys['ArrowDown'] = false;
            } else {
                this.keys['ArrowUp'] = dy < -20;
                this.keys['ArrowDown'] = dy > 20;
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
            }
        };

        window.addEventListener('mousedown', handlePointer);
        window.addEventListener('touchstart', handlePointer, { passive: false });
        
        const stopPointer = () => {
            this.touch.active = false;
            this.keys['ArrowUp'] = this.keys['ArrowDown'] = this.keys['ArrowLeft'] = this.keys['ArrowRight'] = false;
        };
        window.addEventListener('mouseup', stopPointer);
        window.addEventListener('touchend', stopPointer);

        document.getElementById('auto-toggle').onclick = () => {
            this.isAuto = !this.isAuto;
            document.getElementById('auto-toggle').classList.toggle('active', this.isAuto);
            document.getElementById('auto-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };

        document.getElementById('start-btn').onclick = () => {
            this.audio.init();
            this.startGame();
        };
    }

    startGame() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.initLevel();
        this.state = 'PLAYING';
        document.getElementById('overlay').classList.add('hidden');
        this.updateHUD();
    }

    initLevel() {
        this.enemies = [];
        this.bullets = [];
        this.map = [];
        
        // 簡單的地圖生成 (未來可讀取資料庫)
        const cols = Math.floor(this.canvas.width / this.tileSize);
        const rows = Math.floor(this.canvas.height / this.tileSize);
        
        for (let y = 0; y < rows; y++) {
            let row = [];
            for (let x = 0; x < cols; x++) {
                // 簡易邊界與隨機磚塊
                const isWall = x === 0 || x === cols - 1 || y === 2 || y === rows - 1;
                const isRandomBrick = Math.random() < 0.15 && y > 3;
                row.push((isWall || isRandomBrick) ? 1 : 0); // 1: Brick, 0: Empty
            }
            this.map.push(row);
        }

        // 初始化玩家
        this.player = {
            x: Math.floor(cols / 2) * this.tileSize,
            y: (rows - 2) * this.tileSize,
            w: this.tileSize,
            h: this.tileSize,
            dir: 'UP',
            speed: 3,
            cooldown: 0,
            color: '#ffcc00'
        };

        // 初始化敵人
        for (let i = 0; i < 3; i++) {
            this.spawnEnemy();
        }
    }

    spawnEnemy() {
        const cols = this.map[0].length;
        this.enemies.push({
            x: (1 + Math.floor(Math.random() * (cols - 2))) * this.tileSize,
            y: 3 * this.tileSize,
            w: this.tileSize,
            h: this.tileSize,
            dir: 'DOWN',
            speed: 2 * (1 + (this.score / 10000)), // 動態難度初調
            cooldown: 0,
            color: '#ff2d55',
            moveTimer: 0
        });
    }

    // 4-Corner Sync 碰撞偵測 (針對地圖)
    checkMapCollision(x, y, w, h) {
        // 動態難度影嚮: 隨著分數提高，碰撞緩衝(Inset)會微幅縮減，增加精確度要求
        const diffInset = Math.max(1, this.inset - (this.score / 5000));
        const points = [
            { x: x + diffInset, y: y + diffInset }, // TL
            { x: x + w - diffInset, y: y + diffInset }, // TR
            { x: x + diffInset, y: y + h - diffInset }, // BL
            { x: x + w - diffInset, y: y + h - diffInset } // BR
        ];

        for (let p of points) {
            const gridX = Math.floor(p.x / this.tileSize);
            const gridY = Math.floor(p.y / this.tileSize);
            if (this.map[gridY] && this.map[gridY][gridX] === 1) return true;
        }
        return false;
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // 核心更新
        this.handlePlayerInput();
        this.updateEnemies();
        this.updateBullets();
        this.vfx.update();

        // 震動衰減
        if (this.shakeAmount > 0) {
            this.shakeAmount *= 0.9;
            if (this.shakeAmount < 0.1) this.shakeAmount = 0;
        }

        // 定期產生敵人 (難度影嚮頻率)
        if (Math.random() < 0.005 * (1 + (this.score / 5000))) {
            if (this.enemies.length < 5) this.spawnEnemy();
        }

        // 檢查勝負條件
        if (this.enemies.length === 0 && this.score > 0) {
            this.state = 'VICTORY';
            this.showOverlay('VICTORY', '區域肅清完成，晉升下一戰區。');
        }
    }

    handlePlayerInput() {
        let dx = 0, dy = 0;
        let moving = false;
        let targetDir = this.player.dir;

        if (this.isAuto) {
            // 🤖 AUTO-PILOT: 智慧導航插件
            this.executeAutoPilot();
        } else {
            // 手動模式
            if (this.keys['KeyW'] || this.keys['ArrowUp']) { dy = -this.player.speed; targetDir = 'UP'; moving = true; }
            else if (this.keys['KeyS'] || this.keys['ArrowDown']) { dy = this.player.speed; targetDir = 'DOWN'; moving = true; }
            else if (this.keys['KeyA'] || this.keys['ArrowLeft']) { dx = -this.player.speed; targetDir = 'LEFT'; moving = true; }
            else if (this.keys['KeyD'] || this.keys['ArrowRight']) { dx = this.player.speed; targetDir = 'RIGHT'; moving = true; }

            if (moving) {
                this.player.dir = targetDir;
                if (!this.checkMapCollision(this.player.x + dx, this.player.y + dy, this.player.w, this.player.h)) {
                    this.player.x += dx;
                    this.player.y += dy;
                }
            }

            if (this.keys['Space'] && this.player.cooldown <= 0) {
                this.fireBullet(this.player);
                this.player.cooldown = 20;
            }
        }

        if (this.player.cooldown > 0) this.player.cooldown--;
    }

    // 🤖 Auto-Pilot 核心演算法
    executeAutoPilot() {
        const p = this.player;
        let target = null;
        let minPlayerDist = Infinity;

        // 1. 偵測最近的敵軍
        this.enemies.forEach(e => {
            const d = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
            if (d < minPlayerDist) {
                minPlayerDist = d;
                target = e;
            }
        });

        if (target) {
            // 2. 平滑插值 (Lerp) 與 行為對齊
            const lerpSpeed = 0.15;
            
            // 優先對齊 X 或 Y 軸以便開火
            if (Math.abs(target.x - p.x) < 10) {
                // 已在大致同一直線 (Vertical)
                p.x += (target.x - p.x) * lerpSpeed; // 精準對齊
                p.dir = target.y < p.y ? 'UP' : 'DOWN';
                if (p.cooldown <= 0) {
                    this.fireBullet(p);
                    p.cooldown = 25;
                }
            } else if (Math.abs(target.y - p.y) < 10) {
                // 已在大致同一直線 (Horizontal)
                p.y += (target.y - p.y) * lerpSpeed;
                p.dir = target.x < p.x ? 'LEFT' : 'RIGHT';
                if (p.cooldown <= 0) {
                    this.fireBullet(p);
                    p.cooldown = 25;
                }
            } else {
                // 巡航模式: 朝目標前進 (簡單路徑尋找)
                const moveDx = target.x > p.x ? p.speed : -p.speed;
                const moveDy = target.y > p.y ? p.speed : -p.speed;
                
                // 優先移動差距較大的軸
                if (Math.abs(target.x - p.x) > Math.abs(target.y - p.y)) {
                    p.dir = target.x > p.x ? 'RIGHT' : 'LEFT';
                    if (!this.checkMapCollision(p.x + moveDx, p.y, p.w, p.h)) p.x += moveDx;
                    else if (!this.checkMapCollision(p.x, p.y + moveDy, p.w, p.h)) { p.y += moveDy; p.dir = target.y > p.y ? 'DOWN' : 'UP'; }
                } else {
                    p.dir = target.y > p.y ? 'DOWN' : 'UP';
                    if (!this.checkMapCollision(p.x, p.y + moveDy, p.w, p.h)) p.y += moveDy;
                    else if (!this.checkMapCollision(p.x + moveDx, p.y, p.w, p.h)) { p.x += moveDx; p.dir = target.x > p.x ? 'RIGHT' : 'LEFT'; }
                }
            }
        }
    }

    updateEnemies() {
        this.enemies.forEach(e => {
            let dx = 0, dy = 0;
            if (e.dir === 'UP') dy = -e.speed;
            if (e.dir === 'DOWN') dy = e.speed;
            if (e.dir === 'LEFT') dx = -e.speed;
            if (e.dir === 'RIGHT') dx = e.speed;

            if (!this.checkMapCollision(e.x + dx, e.y + dy, e.w, e.h)) {
                e.x += dx;
                e.y += dy;
            } else {
                // 隨機轉向
                const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                e.dir = dirs[Math.floor(Math.random() * dirs.length)];
            }

            if (e.cooldown <= 0) {
                if (Math.random() < 0.02) this.fireBullet(e);
                e.cooldown = 60;
            }
            if (e.cooldown > 0) e.cooldown--;
        });
    }

    fireBullet(owner) {
        let bx = owner.x + owner.w / 2;
        let by = owner.y + owner.h / 2;
        let bvx = 0, bvy = 0;
        const bSpeed = 8;

        if (owner.dir === 'UP') bvy = -bSpeed;
        if (owner.dir === 'DOWN') bvy = bSpeed;
        if (owner.dir === 'LEFT') bvx = -bSpeed;
        if (owner.dir === 'RIGHT') bvx = bSpeed;

        this.bullets.push({
            x: bx, y: by, vx: bvx, vy: bvy,
            owner: owner === this.player ? 'PLAYER' : 'ENEMY',
            radius: 3
        });
        this.audio.playShoot();
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx;
            b.y += b.vy;

            // 地圖碰撞 (4-Corner Sync 簡化版為單點檢查)
            const gx = Math.floor(b.x / this.tileSize);
            const gy = Math.floor(b.y / this.tileSize);

            if (this.map[gy] && this.map[gy][gx] === 1) {
                this.map[gy][gx] = 0; // 破壞磚塊
                this.vfx.emit(b.x, b.y, '#ffcc00', 10);
                this.audio.playExplode();
                this.shakeAmount = 4; // 觸發畫面震動
                this.bullets.splice(i, 1);
                continue;
            }

            // 邊界檢查
            if (b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 實體碰撞
            if (b.owner === 'PLAYER') {
                this.enemies.forEach((enemy, eIdx) => {
                    if (this.rectIntersect(b.x, b.y, 4, 4, enemy.x + this.inset, enemy.y + this.inset, enemy.w - this.inset*2, enemy.h - this.inset*2)) {
                        this.vfx.emit(enemy.x + enemy.w/2, enemy.y + enemy.h/2, '#ff2d55', 20);
                        this.audio.playExplode();
                        this.shakeAmount = 8; // 強力震動
                        this.enemies.splice(eIdx, 1);
                        this.bullets.splice(i, 1);
                        this.score += 500;
                        this.updateHUD();
                    }
                });
            } else {
                if (this.rectIntersect(b.x, b.y, 4, 4, this.player.x + this.inset, this.player.y + this.inset, this.player.w - this.inset*2, this.player.h - this.inset*2)) {
                    this.lives--;
                    this.updateHUD();
                    this.vfx.emit(this.player.x + this.player.w/2, this.player.y + this.player.h/2, '#ffffff', 30);
                    this.audio.playExplode();
                    this.shakeAmount = 12; // 玩家受創重震
                    this.bullets.splice(i, 1);
                    if (this.lives <= 0) {
                        this.state = 'GAMEOVER';
                        this.showOverlay('MISSION FAILED', '戰報：基地已毀，數據已封存。');
                    } else {
                        this.initLevel(); // 重啟當前場景
                    }
                }
            }
        }
    }

    rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x2 < x1 + w1 && x1 < x2 + w2 && y2 < y1 + h1 && y1 < y2 + h2;
    }

    updateHUD() {
        document.getElementById('score').innerText = String(this.score).padStart(6, '0');
        document.getElementById('lives').innerText = '❤'.repeat(Math.max(0, this.lives));
    }

    showOverlay(title, msg) {
        document.getElementById('overlay-title').innerText = title;
        document.getElementById('overlay-msg').innerText = msg;
        document.getElementById('start-btn').innerText = this.state === 'START' ? 'INITIALIZE MISSION' : 'RETRY MISSION';
        document.getElementById('overlay').classList.remove('hidden');
    }

    draw() {
        // 背景
        this.ctx.fillStyle = '#0a0a0c';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state !== 'PLAYING') return;

        this.ctx.save();
        
        // 1. 屏幕反饋: 畫面震動 translate
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount;
            const sy = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(sx, sy);
        }

        // 2. 繪製地圖: 程序化金屬/霓虹紋理
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1) {
                    const bx = x * this.tileSize;
                    const by = y * this.tileSize;
                    
                    // 金屬質感漸變
                    const grad = this.ctx.createLinearGradient(bx, by, bx + this.tileSize, by + this.tileSize);
                    grad.addColorStop(0, '#555');
                    grad.addColorStop(0.5, '#222');
                    grad.addColorStop(1, '#444');
                    
                    this.ctx.fillStyle = grad;
                    this.ctx.fillRect(bx, by, this.tileSize - 1, this.tileSize - 1);
                    
                    // 霓虹邊緣
                    this.ctx.strokeStyle = 'rgba(255, 204, 0, 0.2)';
                    this.ctx.strokeRect(bx + 2, by + 2, this.tileSize - 5, this.tileSize - 5);
                }
            }
        }

        // 3. 繪製玩家: 霓虹金屬質感
        const pGrad = this.ctx.createRadialGradient(
            this.player.x + this.player.w/2, this.player.y + this.player.h/2, 5,
            this.player.x + this.player.w/2, this.player.y + this.player.h/2, 25
        );
        pGrad.addColorStop(0, '#fff');
        pGrad.addColorStop(0.4, '#ffcc00');
        pGrad.addColorStop(1, '#cc9900');

        this.ctx.fillStyle = pGrad;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ffcc00';
        this.ctx.fillRect(this.player.x + this.inset, this.player.y + this.inset, this.player.w - this.inset*2, this.player.h - this.inset*2);
        
        // 視覺補強: 高亮度描邊 (Outline Glow)
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.player.x + this.inset, this.player.y + this.inset, this.player.w - this.inset*2, this.player.h - this.inset*2);
        
        this.ctx.shadowBlur = 0;
        
        // 砲管 (金屬感)
        this.ctx.fillStyle = '#fff';
        const cx = this.player.x + this.player.w / 2;
        const cy = this.player.y + this.player.h / 2;
        if (this.player.dir === 'UP') this.ctx.fillRect(cx - 3, this.player.y, 6, 20);
        if (this.player.dir === 'DOWN') this.ctx.fillRect(cx - 3, this.player.y + this.player.h - 20, 6, 20);
        if (this.player.dir === 'LEFT') this.ctx.fillRect(this.player.x, cy - 3, 20, 6);
        if (this.player.dir === 'RIGHT') this.ctx.fillRect(this.player.x + this.player.w - 20, cy - 3, 20, 6);

        // 4. 繪製敵人
        this.enemies.forEach(e => {
            const eGrad = this.ctx.createLinearGradient(e.x, e.y, e.x + e.w, e.y + e.h);
            eGrad.addColorStop(0, '#ff2d55');
            eGrad.addColorStop(1, '#880022');
            this.ctx.fillStyle = eGrad;
            this.ctx.fillRect(e.x + this.inset, e.y + this.inset, e.w - this.inset*2, e.h - this.inset*2);
            
            // 敵人高亮度描邊
            this.ctx.strokeStyle = '#ff2d55';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ff2d55';
            this.ctx.strokeRect(e.x + this.inset, e.y + this.inset, e.w - this.inset*2, e.h - this.inset*2);
            this.ctx.shadowBlur = 0;
        });

        // 5. 繪製子彈 (發光體)
        this.bullets.forEach(b => {
            this.ctx.fillStyle = b.owner === 'PLAYER' ? '#ffcc00' : '#fff';
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // 6. VFX
        this.vfx.draw(this.ctx);

        this.ctx.restore();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

window.addEventListener('load', () => {
    new EliteEngine();
});
