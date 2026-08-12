class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
        this.beat = 0;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6; // Increased from 0.2
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn("Lawn Audio failed."); }
    }

    playBGM() {
        if (!this.isReady) return;
        const trigger = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            // 輕快、具備節奏感的庭院背景音
            const freqs = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
            osc.frequency.setValueAtTime(freqs[this.beat % 6], now);
            g.gain.setValueAtTime(0.1, now); // Increased from 0.04
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.3);
            this.beat++;
            setTimeout(trigger, 400);
        };
        trigger();
    }

    playFire() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        g.gain.setValueAtTime(0.1, now); // Increased from 0.02
        g.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playImpact() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.2);
        g.gain.setValueAtTime(0.2, now); // Increased from 0.05
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playSuccess() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [0, 0.05, 0.1].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(659 + i * 200, now + t);
            g.gain.setValueAtTime(0.05, now + t);
            g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now + t);
            osc.stop(now + t + 0.1);
        });
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
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

class EliteEngine {
    constructor() {
        // UI Components
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.sunScore = document.getElementById('score-val');
        this.waveHUD = document.getElementById('wave-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');
        
        // Step 3 & 4 Integration
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        
        // Step 5: AI & Difficulty Matrix
        this.difficultyFactor = 1.0;
        this.isAuto = false;
        
        // Grid Configuration
        this.rows = 5;
        this.cols = 9;
        this.cellSize = 80;
        this.offsetX = 50;
        this.offsetY = 120;
        this.inset = 5; // Inset Hitbox
        
        // 2. 數據持久化 (Data Persistence)
        this.highScore = parseInt(localStorage.getItem('pvz_highScore')) || 0;
        this.updateHighScoreUI();

        this.initEvents();
        this.resize();
        this.resetGame();
        this.gameLoop();
    }

    resetGame() {
        this.sun = 100;
        this.wave = 1;
        this.frame = 0;
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.updateHUD();
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        const hiText = `<div id="hi-score-disp" style="font-size:0.5rem; opacity:0.5; margin-top:5px; text-transform:uppercase">RECORD WAVE: ${this.highScore}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = Math.min(600, window.innerHeight);
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        
        const handleInteraction = (e) => {
            e.preventDefault();
            this.handleCanvasClick(e.touches ? e.touches[0] : e);
        };

        this.canvas.addEventListener('click', handleInteraction);
        this.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
        
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.resetGame();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };
    }

    handleCanvasClick(e) {
        if (this.state !== 'PLAYING') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

        // Sun Collection
        this.suns.forEach((sun, i) => {
            const dist = Math.hypot(sun.x - x, sun.y - y);
            if (dist < 40) {
                this.sun += 25;
                this.audio.playSuccess();
                this.suns.splice(i, 1);
                this.updateHUD();
            }
        });

        // Plant Placement
        const gridX = Math.floor((x - this.offsetX) / this.cellSize);
        const gridY = Math.floor((y - this.offsetY) / this.cellSize);

        if (gridX >= 0 && gridX < this.cols && gridY >= 0 && gridY < this.rows) {
            const exists = this.plants.find(p => p.gx === gridX && p.gy === gridY);
            if (!exists && this.sun >= 50) {
                this.plants.push({
                    gx: gridX, gy: gridY,
                    x: this.offsetX + gridX * this.cellSize + this.cellSize/2,
                    y: this.offsetY + gridY * this.cellSize + this.cellSize/2,
                    w: 50, h: 50,
                    hp: 5, cooldown: 100, lastShot: 0,
                    type: 'PEASHOOTER'
                });
                this.sun -= 50;
                this.updateHUD();
            }
        }
    }

    updateHUD() {
        this.sunScore.innerText = String(this.sun).padStart(6, '0');
        this.waveHUD.innerText = `${this.wave} / ${this.maxWaves}`;
    }

    // 2. 物理進階: 4-Corner Sync + Inset Hitbox
    isColliding(a, b) {
        const ax1 = a.x - a.w/2 + this.inset, ax2 = a.x + a.w/2 - this.inset;
        const ay1 = a.y - a.h/2 + this.inset, ay2 = a.y + a.h/2 - this.inset;
        const bx1 = b.x - b.w/2 + this.inset, bx2 = b.x + b.w/2 - this.inset;
        const by1 = b.y - b.h/2 + this.inset, by2 = b.y + b.h/2 - this.inset;
        
        return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
    }

    // 1. 偵測邏輯: AI 預判與行為對齊
    executeAutoPilot() {
        // 自動收集陽光
        for (let i = this.suns.length - 1; i >= 0; i--) {
            this.sun += 25;
            this.audio.playSuccess();
            this.suns.splice(i, 1);
            this.updateHUD();
        }

        // 戰術輔助: 自動部署植物
        if (this.sun >= 50 && this.frame % 120 === 0) {
            // 尋找受威脅最重的行 (Zombie 最接近左側的行)
            const threatenedLane = this.zombies.sort((a,b) => a.x - b.x)[0];
            const targetLane = threatenedLane ? Math.floor((threatenedLane.y - this.offsetY) / this.cellSize) : Math.floor(Math.random() * this.rows);
            
            // 在該行尋找空位
            for (let c = 0; c < this.cols; c++) {
                if (!this.plants.find(p => p.gx === c && p.gy === targetLane)) {
                    this.placePlant(c, targetLane);
                    break;
                }
            }
        }
    }

    placePlant(gx, gy) {
        this.plants.push({
            gx, gy,
            x: this.offsetX + gx * this.cellSize + this.cellSize/2,
            y: this.offsetY + gy * this.cellSize + this.cellSize/2,
            w: 50, h: 50,
            hp: 5, cooldown: 100, lastShot: 0,
            type: 'PEASHOOTER'
        });
        this.sun -= 50;
        this.updateHUD();
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // 3. 動態難度 (Dynamic Difficulty)
        this.difficultyFactor = 1.0 + (this.frame / 6000);
        if (this.frame % 3600 === 0) this.wave++;

        if (this.isAuto) this.executeAutoPilot();

        // Projectile Updates
        this.projectiles.forEach((p, pi) => {
            p.x += 7;
            if (p.x > this.canvas.width) this.projectiles.splice(pi, 1);
        });

        // Plant Logic (Shooting)
        this.plants.forEach(p => {
            if (this.frame - p.lastShot > p.cooldown) {
                const zombieInRow = this.zombies.some(z => Math.abs(z.y - p.y) < 20 && z.x > p.x);
                if (zombieInRow) {
                    this.projectiles.push({ x: p.x + 20, y: p.y, w: 10, h: 10, speed: 7 });
                    this.audio.playFire();
                    p.lastShot = this.frame;
                }
            }
        });

        // Zombie Spawning
        const spawnRate = Math.max(100, 300 - (this.wave * 20));
        if (this.frame % spawnRate === 0) {
            const lane = Math.floor(Math.random() * this.rows);
            this.zombies.push({
                x: this.canvas.width + 50,
                y: this.offsetY + lane * this.cellSize + this.cellSize/2,
                w: 60, h: 80,
                hp: 3 * this.difficultyFactor,
                speed: (0.5 + (this.wave * 0.1)) * this.difficultyFactor,
                isEating: false
            });
        }

        // Zombie Logic
        this.zombies.forEach((z, zi) => {
            let collidedWithPlant = false;
            this.plants.forEach((p, pi) => {
                if (this.isColliding(z, p)) {
                    collidedWithPlant = true;
                    if (this.frame % 60 === 0) {
                        p.hp--;
                        this.vfx.emit(p.x, p.y, '#4CAF50', 5);
                    }
                    if (p.hp <= 0) {
                        this.plants.splice(pi, 1);
                        this.shake = 10; // 屏幕震動
                    }
                }
            });

            if (!collidedWithPlant) {
                z.x -= z.speed;
            }

            // Projectile vs Zombie
            this.projectiles.forEach((p, pi) => {
                if (this.isColliding(p, z)) {
                    this.projectiles.splice(pi, 1);
                    z.hp--;
                    this.audio.playImpact();
                    this.vfx.emit(p.x, p.y, '#ccff33', 3);
                    if (z.hp <= 0) {
                        this.vfx.emit(z.x, z.y, '#9C27B0', 20);
                        this.zombies.splice(zi, 1);
                        this.sun += 10;
                        this.updateHUD();
                    }
                }
            });

            // GameOver Check
            if (z.x < this.offsetX - 20) {
                this.endGame('INVASION SUCCESSFUL', '僵屍已進入房內，防線潰散。');
            }
        });

        // Periodic Sun Drop
        if (this.frame % 400 === 0) {
            this.suns.push({
                x: Math.random() * (this.canvas.width - 200) + 100,
                y: 0,
                targetY: Math.random() * (this.canvas.height - 200) + 100,
                vx: (Math.random() - 0.5) * 2,
                vy: 2
            });
        }

        this.suns.forEach((s, i) => {
            if (s.y < s.targetY) {
                s.y += s.vy;
                s.x += s.vx;
            }
        });

        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.85;
        this.frame++;
    }

    endGame(head, desc) {
        this.state = 'GAMEOVER';
        if (this.wave > this.highScore) {
            this.highScore = this.wave;
            localStorage.setItem('pvz_highScore', this.highScore);
            this.updateHighScoreUI();
        }
        document.getElementById('overlay-heading').innerText = head;
        document.getElementById('overlay-description').innerText = desc;
        document.getElementById('init-game-btn').innerText = 'RETRY';
        this.overlay.classList.add('active');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // 3. 屏幕反饋 (Camera Shake)
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Draw Lawn Background
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.ctx.fillStyle = (r + c) % 2 === 0 ? '#1b4332' : '#2d6a4f';
                this.ctx.fillRect(this.offsetX + c * this.cellSize, this.offsetY + r * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Draw Plants (Radial Gradient)
        this.plants.forEach(p => {
            const grd = this.ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, p.w/2);
            grd.addColorStop(0, '#aacc00');
            grd.addColorStop(1, '#4CAF50');
            this.ctx.fillStyle = grd;
            this.ctx.strokeStyle = '#fff'; // 行動端高亮描邊
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#4CAF50';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.w/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke(); // 渲染描邊
            this.ctx.shadowBlur = 0;
        });

        // Draw Projectiles (Neon Glow)
        this.projectiles.forEach(pr => {
            this.ctx.fillStyle = '#ccff33';
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ccff33';
            this.ctx.beginPath();
            this.ctx.arc(pr.x, pr.y, pr.w/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        });

        // Draw Zombies (Metallic/Industrial Gradient)
        this.zombies.forEach(z => {
            const grd = this.ctx.createLinearGradient(z.x-z.w/2, z.y-z.h/2, z.x-z.w/2, z.y+z.h/2);
            grd.addColorStop(0, '#9C27B0');
            grd.addColorStop(1, '#4a148c');
            this.ctx.fillStyle = grd;
            this.ctx.fillRect(z.x - z.w/2, z.y - z.h/2, z.w, z.h);
            this.ctx.strokeStyle = '#fff'; // 小螢幕強對比描邊
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(z.x - z.w/2, z.y - z.h/2, z.w, z.h);
        });

        // Draw Suns (Divine Radial Glow)
        this.suns.forEach(s => {
            const grd = this.ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 15);
            grd.addColorStop(0, '#fff3e0');
            grd.addColorStop(0.5, '#FFC107');
            grd.addColorStop(1, 'rgba(255, 193, 7, 0)');
            this.ctx.fillStyle = grd;
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#FFC107';
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });

        // 1. 粒子系統 (Particle System)
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
