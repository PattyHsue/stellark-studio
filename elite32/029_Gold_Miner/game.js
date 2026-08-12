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
            this.masterGain.gain.value = 0.6; // Increased from 0.15
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn("Luxe Miner Audio failed."); }
    }

    playBGM() {
        if (!this.isReady) return;
        const trigger = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime([55, 65, 75, 65][this.beat % 4], now);
            g.gain.setValueAtTime(0.2, now); // Increased from 0.08
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 0.8);
            this.beat++;
            setTimeout(trigger, 800);
        };
        trigger();
    }

    playLaunch() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        g.gain.setValueAtTime(0.1, now); // Increased from 0.05
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    playCatch() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playPull() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [0, 0.1, 0.2].forEach((t, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880 + i * 440, now + t);
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

    emit(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                color
            });
        }
    }

    update() {
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
        this.hudScore = document.getElementById('score-val');
        this.hudTimer = document.getElementById('timer-val');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');

        // Step 3 & 4 Integration
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        
        // Step 5: AI & Difficulty Matrix
        this.difficultyFactor = 1.0;
        this.isAuto = false;
        
        // Game Configuration
        this.state = 'START';
        this.score = 0;
        this.target = 1200;
        this.timeLeft = 60;
        this.frame = 0;
        
        // Hook Configuration
        this.hook = {
            x: 0, y: 0,
            angle: Math.PI / 2,
            swingSpeed: 0.03,
            length: 50,
            baseLength: 50,
            state: 'SWINGING', // SWINGING, FIRING, RETRACTING
            speed: 8,
            caught: null
        };
        
        // World Objects
        this.items = [];
        this.stars = []; 
        
        // 2. 數據持久化 (Data Persistence)
        this.highScore = parseInt(localStorage.getItem('goldminer_highScore')) || 0;
        
        this.initEntities();
        this.initEvents();
        this.resize();
        this.gameLoop();
    }

    initEntities() {
        // Generate World Items (Gold & Rocks)
        const types = [
            { id: 'GOLD_S', val: 50, r: 15, speed: 5, color: '#f9d423' },
            { id: 'GOLD_M', val: 100, r: 25, speed: 3, color: '#f9d423' },
            { id: 'GOLD_L', val: 500, r: 45, speed: 1.5, color: '#f9d423' },
            { id: 'ROCK_S', val: 10, r: 20, speed: 2, color: '#888' },
            { id: 'ROCK_L', val: 20, r: 40, speed: 0.8, color: '#666' }
        ];

        for (let i = 0; i < 15; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            this.items.push({
                ...type,
                x: 100 + Math.random() * (window.innerWidth - 200),
                y: 250 + Math.random() * (window.innerHeight - 350)
            });
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.hook.x = this.canvas.width / 2;
        this.hook.y = 120; // Corrected offset for mobile HUD
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        
        // Non-blocking UI Interactions
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
            this.startTimer();
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };

        // Fire Hook
        window.addEventListener('mousedown', () => this.fireHook());
        window.addEventListener('touchstart', e => { e.preventDefault(); this.fireHook(); });
    }

    fireHook() {
        if (this.state === 'PLAYING' && this.hook.state === 'SWINGING') {
            this.hook.state = 'FIRING';
            this.audio.playLaunch();
        }
    }

    // 1. 偵測邏輯: AI 預判與行為對齊
    executeAutoPilot() {
        const h = this.hook;
        const target = this.items.slice().sort((a,b) => b.val - a.val)[0];
        if (!target) return;

        const targetAngle = Math.atan2(target.y - h.y, target.x - h.x);
        if (Math.abs(h.angle - targetAngle) < 0.05) {
            this.fireHook();
        }
    }

    startTimer() {
        const tick = () => {
            if (this.state !== 'PLAYING') return;
            this.timeLeft--;
            this.hudTimer.innerText = `00:${this.timeLeft.toString().padStart(2, '0')}`;
            if (this.timeLeft <= 0) this.endGame();
            else setTimeout(tick, 1000);
        };
        tick();
    }

    checkCollisions(tipX, tipY) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dist = Math.hypot(tipX - item.x, tipY - item.y);
            // Inset Hitbox logic
            if (dist < item.r) {
                this.hook.caught = item;
                this.items.splice(i, 1);
                this.hook.state = 'RETRACTING';
                this.audio.playCatch();
                this.vfx.emit(tipX, tipY, item.color, 15);
                this.shake = item.speed < 1 ? 15 : 5;
                return true;
            }
        }
        return false;
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // 3. 動態難度 (Dynamic Difficulty)
        this.difficultyFactor = 1.0 + (this.score / 2000);

        const h = this.hook;
        if (h.state === 'SWINGING') {
            if (this.isAuto) this.executeAutoPilot();
            h.angle += h.swingSpeed * this.difficultyFactor;
            if (h.angle > Math.PI * 0.8 || h.angle < Math.PI * 0.2) h.swingSpeed *= -1;
        } else if (h.state === 'FIRING') {
            h.length += h.speed;
            const tipX = h.x + Math.cos(h.angle) * h.length;
            const tipY = h.y + Math.sin(h.angle) * h.length;
            
            if (this.checkCollisions(tipX, tipY) || tipX < 0 || tipX > this.canvas.width || tipY > this.canvas.height) {
                h.state = 'RETRACTING';
            }
        } else if (h.state === 'RETRACTING') {
            const pullSpeed = h.caught ? h.caught.speed : h.speed;
            h.length -= pullSpeed;
            if (h.caught && h.caught.speed < 1) {
                this.shake = Math.sin(this.frame * 0.5) * 2;
            }
            if (h.length <= h.baseLength) {
                if (h.caught) {
                    this.score += h.caught.val;
                    this.hudScore.innerText = `$${this.score.toString().padStart(6, '0')}`;
                    this.audio.playPull();
                    this.vfx.emit(h.x, h.y, '#f9d423', 20);
                    h.caught = null;
                }
                h.length = h.baseLength;
                h.state = 'SWINGING';
                this.shake = 0;
            }
        }
        
        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.85;
        this.frame++;
    }

    draw() {
        this.ctx.fillStyle = '#01040a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Draw Underground Wall with Gradient
        const soilGrd = this.ctx.createLinearGradient(0, 100, 0, this.canvas.height);
        soilGrd.addColorStop(0, '#5c4033');
        soilGrd.addColorStop(1, '#1a1a1a');
        this.ctx.fillStyle = soilGrd;
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);

        // Draw Items with Procedural Shine & Mobile Glow
        this.items.forEach(item => {
            const grd = this.ctx.createRadialGradient(item.x - item.r/3, item.y - item.r/3, 0, item.x, item.y, item.r);
            grd.addColorStop(0, '#fff');
            grd.addColorStop(0.2, item.color);
            grd.addColorStop(1, '#000');
            
            this.ctx.fillStyle = grd;
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2; // High Visibility for Mobile
            this.ctx.shadowBlur = item.id.includes('GOLD') ? 25 : 5;
            this.ctx.shadowColor = item.color;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
        });
        this.ctx.shadowBlur = 0;

        // Draw Hook & Rope
        const h = this.hook;
        const tipX = h.x + Math.cos(h.angle) * h.length;
        const tipY = h.y + Math.sin(h.angle) * h.length;

        this.ctx.strokeStyle = '#f9d423';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.setLineDash([5, 5]); // Detailed rope texture
        this.ctx.moveTo(h.x, h.y);
        this.ctx.lineTo(tipX, tipY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Hook Tool
        this.ctx.fillStyle = '#aaa';
        this.ctx.beginPath();
        this.ctx.arc(tipX, tipY, 12, h.angle - 0.5, h.angle + 0.5, true);
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();

        if (h.caught) {
            const c = h.caught;
            const cGrd = this.ctx.createRadialGradient(tipX, tipY + c.r, 0, tipX, tipY + c.r, c.r);
            cGrd.addColorStop(0, c.color);
            cGrd.addColorStop(1, '#000');
            this.ctx.fillStyle = cGrd;
            this.ctx.beginPath();
            this.ctx.arc(tipX, tipY + c.r, c.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
        
        // 1. 粒子系統 (Particle System)
        this.vfx.draw(this.ctx);
    }

    endGame() {
        this.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('goldminer_highScore', this.highScore);
        }
        const win = this.score >= this.target;
        document.getElementById('overlay-heading').innerText = win ? 'MISSION COMPLETED' : 'CONTRACT VOID';
        document.getElementById('overlay-description').innerText = win ? 
            `恭喜！達成目標利潤：$${this.score} (最高: $${this.highScore})` : `利潤不足，合約終止。最終利潤：$${this.score}`;
        document.getElementById('init-game-btn').innerText = 'REBOOT';
        this.overlay.classList.add('active');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => new EliteEngine();
