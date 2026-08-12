class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
        this.beat = 0;
        this.bgmTimer = null;
    }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.6; // Increased from 0.12
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn("Space Audio failed to initialize."); }
    }

    // 1. 合成背景音 (低頻 Triangle 波 - 模擬星際引擎脈衝)
    playBGM() {
        if (!this.isReady || this.bgmTimer) return;
        const trigger = () => {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime([40, 45, 50, 45][this.beat % 4], now);
            g.gain.setValueAtTime(0.15, now); // Increased from 0.05
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.6);
            this.beat++;
            this.bgmTimer = setTimeout(trigger, 600);
        };
        trigger();
    }

    // 2. 行為音效: 雷射射擊 (Polymorphic Slide)
    playLaser() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        g.gain.setValueAtTime(0.1, now); // Increased from 0.05
        g.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    // 3. 行為音效: 爆炸衝擊 (Impact)
    playImpact() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // 4. 行為音效: 獲得獎勵 (Success Arpeggio)
    playSuccess() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [0, 0.08, 0.16, 0.24].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660 + i * 220, now + t);
            g.gain.setValueAtTime(0.08, now + t);
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

    emit(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color,
                gravity: 0.1
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
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
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
        
        // Game State
        this.state = 'START';
        this.score = 0;
        this.lives = 3;
        this.frame = 0;
        this.isAuto = false;
        
        // Input Management
        this.keys = {};
        this.touch = { x: 0, y: 0, active: false };
        
        // Physics Configuration
        this.inset = 4; // Inset Hitbox (內縮緩衝箱)
        
        // Entities
        this.player = {
            x: 0, y: 0,
            w: 40, h: 40,
            speed: 5,
            bullets: []
        };
        this.enemies = [];
        this.enemyBullets = [];
        this.stars = [];
        
        // 2. 數據持久化 (Data Persistence)
        this.highScore = parseInt(localStorage.getItem('galaxian_highScore')) || 0;
        this.updateHighScoreUI();
        
        this.initEntities();
        this.initEvents();
        this.resize();
        this.resetGame();
        this.gameLoop();
    }

    resetGame() {
        this.score = 0;
        this.lives = 3;
        this.frame = 0;
        this.player.bullets = [];
        this.enemyBullets = [];
        // Rebuild Swarm
        this.enemies = [];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                this.enemies.push({
                    row, col,
                    x: 0, y: 0,
                    w: 30, h: 30,
                    type: row === 0 ? 'ELITE' : 'NORMAL',
                    state: 'FORMATION',
                    vx: 0
                });
            }
        }
        this.updateHUD();
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        const hiText = `<div id="hi-score-disp" style="font-size:0.5rem; opacity:0.5; margin-top:5px; text-transform:uppercase">HI-RECORD ${String(this.highScore).padStart(6, '0')}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    initEntities() {
        // Create Starfield
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * 2000,
                y: Math.random() * 2000,
                size: Math.random() * 2,
                speed: 0.5 + Math.random() * 2
            });
        }
        
        // Build Swarm Formation
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 10; col++) {
                this.enemies.push({
                    row, col,
                    x: 0, y: 0, // Calculated in real-time
                    w: 30, h: 30,
                    type: row === 0 ? 'ELITE' : 'NORMAL',
                    state: 'FORMATION', // FORMATION, DIVING
                    angle: 0
                });
            }
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.player.x = this.canvas.width / 2 - this.player.w / 2;
        this.player.y = this.canvas.height - 100;
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        // Input Calibration: Touch/Mouse
        const handlePointer = (e) => {
            if (this.state !== 'PLAYING') return;
            const rect = this.canvas.getBoundingClientRect();
            const cx = e.touches ? e.touches[0].clientX : e.clientX;
            this.player.x = (cx - rect.left) * (this.canvas.width / rect.width) - this.player.w / 2;
            
            // 觸控即開火 (Auto-fire logic for mobile)
            if (e.touches && this.frame % 15 === 0) {
                this.player.bullets.push({ x: this.player.x + this.player.w / 2 - 2, y: this.player.y, w: 4, h: 15 });
                this.audio.playLaser();
            }
        };
        window.addEventListener('mousemove', handlePointer);
        window.addEventListener('touchstart', handlePointer, { passive: false });
        window.addEventListener('touchmove', handlePointer, { passive: false });

        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };
    }

    // 物理進階: 4-Corner Sync (四角同步) + Inset Hitbox
    isColliding(a, b) {
        const ah = {
            l: a.x + this.inset,
            r: a.x + a.w - this.inset,
            t: a.y + this.inset,
            b: a.y + a.h - this.inset
        };
        const bh = {
            l: b.x + this.inset,
            r: b.x + b.w - this.inset,
            t: b.y + this.inset,
            b: b.y + b.h - this.inset
        };
        
        return !(ah.r < bh.l || ah.l > bh.r || ah.b < bh.t || ah.t > bh.b);
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // 3. 動態難度 (Dynamic Difficulty)
        this.difficultyFactor = 1.0 + (this.score / 10000);

        this.handleMotion();
        this.updateBullets();
        this.updateSwarm();
        this.checkCollisions();
        
        // VFX & State
        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.85;

        // Stars
        this.stars.forEach(s => {
            s.y += s.speed * this.difficultyFactor;
            if (s.y > this.canvas.height) {
                s.y = -s.size;
                s.x = Math.random() * this.canvas.width;
            }
        });

        this.frame++;
    }

    handleMotion() {
        const p = this.player;
        if (this.isAuto) {
            this.executeAutoPilot();
        } else {
            if (this.keys['ArrowLeft'] || this.keys['KeyA']) p.x -= p.speed;
            if (this.keys['ArrowRight'] || this.keys['KeyD']) p.x += p.speed;
        }
        
        // Bounds
        p.x = Math.max(0, Math.min(this.canvas.width - p.w, p.x));
        
        // Auto Shooting
        if ((this.keys['Space'] || this.isAuto) && this.frame % 15 === 0) {
            p.bullets.push({ x: p.x + p.w / 2 - 2, y: p.y, w: 4, h: 15 });
            this.audio.playLaser();
        }
    }

    // 1. 偵測邏輯: AI 預判與 Lerp 平滑插值
    executeAutoPilot() {
        const p = this.player;
        let targetX = p.x;

        // 優先度: 躲避即將到來的威脅 > 獵殺最近的敵機
        const danger = this.enemyBullets.find(eb => Math.abs(eb.x - (p.x + p.w / 2)) < 80);
        const target = this.enemies.find(e => e.state === 'DIVING') || 
                       this.enemies.slice().sort((a,b) => b.y - a.y)[0];

        if (danger) {
            targetX = danger.x > p.x + p.w / 2 ? p.x - 50 : p.x + 50;
        } else if (target) {
            targetX = target.x + target.w / 2 - p.w / 2;
        }

        // 以 Lerp 插值驅動完美行為對齊
        p.x += (targetX - p.x) * 0.15;
    }

    updateSwarm() {
        // 2. 戰法策略: 定時發動衝擊型俯衝 (Diving)
        const swarmX = Math.sin(this.frame * 0.02) * 100;
        const swarmY = 150 + Math.sin(this.frame * 0.01) * 20;

        if (this.frame % Math.max(30, 100 - Math.floor(this.score/500)) === 0) {
            const potential = this.enemies.filter(e => e.state === 'FORMATION');
            if (potential.length > 0) {
                const diver = potential[Math.floor(Math.random() * potential.length)];
                diver.state = 'DIVING';
                diver.vx = (Math.random() - 0.5) * 4;
            }
        }

        this.enemies.forEach(e => {
            if (e.state === 'FORMATION') {
                e.x = (this.canvas.width / 2 - 200) + e.col * 40 + swarmX;
                e.y = swarmY + e.row * 40;
            } else if (e.state === 'DIVING') {
                e.y += 4 * this.difficultyFactor;
                e.x += e.vx;
                if (e.y > this.canvas.height) {
                    e.y = -50;
                    e.state = 'FORMATION';
                }
            }
        });
    }

    updateBullets() {
        // Player Bullets
        for (let i = this.player.bullets.length - 1; i >= 0; i--) {
            const b = this.player.bullets[i];
            b.y -= 10;
            if (b.y < -20) this.player.bullets.splice(i, 1);
        }
    }

    checkCollisions() {
        // Player Bullets vs Enemies
        this.player.bullets.forEach((b, bi) => {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                if (this.isColliding(b, e)) {
                    this.enemies.splice(i, 1);
                    this.player.bullets.splice(bi, 1);
                    this.score += e.type === 'ELITE' ? 200 : 100;
                    this.audio.playImpact();
                    this.vfx.emit(e.x + e.w/2, e.y + e.h/2, e.type === 'ELITE' ? '#ff0055' : '#00e5ff', 20);
                    this.shake = 8;
                    this.updateHUD();
                    break;
                }
            }
        });

        // Enemies vs Player
        this.enemies.forEach(e => {
            if (this.isColliding(e, this.player)) {
                this.handleDeath();
            }
        });
    }

    handleDeath() {
        this.lives--;
        this.updateHUD();
        this.shake = 20;
        this.audio.playImpact();
        if (this.lives <= 0) {
            this.state = 'GAMEOVER';
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('galaxian_highScore', this.highScore);
                this.updateHighScoreUI();
            }
            document.getElementById('overlay-heading').innerText = 'MISSION FAILED';
            document.getElementById('overlay-description').innerText = `星道損毀。最終戰功: ${this.score}`;
            document.getElementById('init-game-btn').innerText = 'START';
            document.getElementById('game-overlay').classList.add('active');
        }
    }
    updateHUD() {
        this.hudScore.innerText = String(this.score).padStart(6, '0');
        this.hudLives.innerText = '▲'.repeat(Math.max(0, this.lives));
    }

    draw() {
        this.ctx.fillStyle = '#01040a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        
        // 3. 屏幕反饋 (Camera Shake)
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            this.ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // 2. 程序化紋理 (Enemies & Player)
        this.enemies.forEach(e => {
            const color = e.type === 'ELITE' ? '#ff0055' : '#00e5ff';
            const grd = this.ctx.createLinearGradient(e.x, e.y, e.x + e.w, e.y + e.h);
            grd.addColorStop(0, '#fff');
            grd.addColorStop(0.5, color);
            grd.addColorStop(1, '#000');
            
            this.ctx.fillStyle = grd;
            this.ctx.strokeStyle = color; // 高亮度描邊 (Outline Glow)
            this.ctx.lineWidth = 1;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
            this.ctx.beginPath();
            this.ctx.moveTo(e.x + e.w / 2, e.y);
            this.ctx.lineTo(e.x + e.w, e.y + e.h);
            this.ctx.lineTo(e.x, e.y + e.h);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke(); // 渲染描邊
            this.ctx.shadowBlur = 0;
        });

        // Player (Starship - Metal Gradient)
        const p = this.player;
        const pGrd = this.ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
        pGrd.addColorStop(0, '#fff');
        pGrd.addColorStop(0.4, '#00e5ff');
        pGrd.addColorStop(1, '#004d40');

        this.ctx.fillStyle = pGrd;
        this.ctx.strokeStyle = '#fff'; // 旗艦型高亮描邊
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#00e5ff';
        this.ctx.beginPath();
        this.ctx.moveTo(p.x + p.w / 2, p.y);
        this.ctx.lineTo(p.x + p.w, p.y + p.h);
        this.ctx.lineTo(p.x + p.w / 2, p.y + p.h - 10);
        this.ctx.lineTo(p.x, p.y + p.h);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke(); // 確保玩家在小螢幕絕對可見
        this.ctx.shadowBlur = 0;

        // Bullets (Laser Bloom)
        this.player.bullets.forEach(b => {
            this.ctx.fillStyle = '#ffeb3b';
            this.ctx.strokeStyle = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ffeb3b';
            this.ctx.fillRect(b.x, b.y, b.w, b.h);
            this.ctx.strokeRect(b.x, b.y, b.w, b.h);
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
        
        // 1. 粒子系統 (Particle System)
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
