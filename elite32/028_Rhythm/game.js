class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isReady = false;
        this.beat = 0;
        this.nextNoteTime = 0;
        this.bpm = 120;
        this.lookahead = 0.1; // Seconds
        this.scheduleInterval = 25; // MS
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
        } catch (e) { console.warn("Synth Audio failed."); }
    }

    // 工業級時鐘排程: 確保節奏毫秒不差
    scheduler() {
        if (!this.isReady || this.state !== 'PLAYING') return;
        while (this.nextNoteTime < this.ctx.currentTime + this.lookahead) {
            this.scheduleNote(this.nextNoteTime);
            this.advanceNote();
        }
        setTimeout(() => this.scheduler(), this.scheduleInterval);
    }

    advanceNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += 0.5 * secondsPerBeat; // 8th notes
        this.beat++;
    }

    scheduleNote(time) {
        // Kick Drum
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        g.gain.setValueAtTime(0.3, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.1);

        // Arpeggio Synth
        const melod = this.ctx.createOscillator();
        const melG = this.ctx.createGain();
        melod.type = 'triangle';
        const notes = [261.63, 329.63, 392.00, 523.25, 587.33, 659.25];
        melod.frequency.setValueAtTime(notes[this.beat % notes.length], time);
        melG.gain.setValueAtTime(0.06, time);
        melG.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        melod.connect(melG);
        melG.connect(this.masterGain);
        melod.start(time);
        melod.stop(time + 0.3);
    }

    playHit() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playMiss() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
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
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.04,
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
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // 效能優化: 不透明畫布
        this.scoreHUD = document.getElementById('score-val');
        this.comboHUD = document.getElementById('combo-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');
        
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        
        // 核心邏輯
        this.difficultyFactor = 1.0;
        this.isAuto = false;
        this.fever = 0;
        this.isFeverMode = false;
        
        // 節奏配置
        this.lanes = 4;
        this.laneWidth = 85; 
        this.judgmentLineY = 0; 
        this.noteSize = 40;
        this.baseSpeed = 6;
        this.speed = 6;
        this.judgmentWindow = 50; 
        
        // 遊戲狀態
        this.state = 'START';
        this.score = 0;
        this.combo = 0;
        this.lives = 10;
        this.frame = 0;
        
        // 實體與視覺
        this.notes = [];
        this.judgments = []; // "PERFECT", "GREAT" 等文字佇列
        this.keys = { 'KeyD': false, 'KeyF': false, 'KeyJ': false, 'KeyK': false };
        this.laneKeys = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
        this.spectrum = new Array(30).fill(0); // 背景頻譜模擬數據
        
        this.highScore = parseInt(localStorage.getItem('rhythm_highScore')) || 0;
        this.updateHighScoreUI();
        
        this.initEvents();
        this.resize();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.judgmentLineY = this.canvas.height - 100;
        this.offsetX = (this.canvas.width - this.lanes * this.laneWidth) / 2;
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        
        window.addEventListener('keydown', (e) => {
            if (this.laneKeys.includes(e.code)) {
                if (!this.keys[e.code]) this.handleNoteHit(this.laneKeys.indexOf(e.code));
                this.keys[e.code] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.laneKeys.includes(e.code)) this.keys[e.code] = false;
        });

        // 1. 觸控映射 (Mobile Polish)
        const handleInteraction = (e) => {
            e.preventDefault();
            const touches = e.touches || [e];
            for (let i = 0; i < touches.length; i++) {
                const t = touches[i];
                const rect = this.canvas.getBoundingClientRect();
                const tx = (t.clientX - rect.left) * (this.canvas.width / rect.width);
                const lane = Math.floor((tx - this.offsetX) / this.laneWidth);
                if (lane >= 0 && lane < this.lanes) this.handleNoteHit(lane);
            }
        };

        this.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const tx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const lane = Math.floor((tx - this.offsetX) / this.laneWidth);
            if (lane >= 0 && lane < this.lanes) this.handleNoteHit(lane);
        });

        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.audioState = 'PLAYING';
            this.audio.nextNoteTime = this.audio.ctx.currentTime;
            this.audio.scheduler(); // 啟動背景排程

            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
            this.score = 0;
            this.combo = 0;
            this.lives = 10;
            this.fever = 0;
            this.isFeverMode = false;
            this.notes = [];
            this.judgments = [];
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };
    }

    handleNoteHit(lane) {
        if (this.state !== 'PLAYING') return;
        
        let hitNote = null;
        let minHitDist = Infinity;

        for (const n of this.notes) {
            if (n.lane === lane && !n.processed) {
                const dist = Math.abs(n.y - this.judgmentLineY);
                if (dist < this.judgmentWindow && dist < minHitDist) {
                    minHitDist = dist;
                    hitNote = n;
                }
            }
        }

        if (hitNote) {
            const accuracy = 1.0 - (minHitDist / this.judgmentWindow);
            let type = 'GREAT';
            let bonus = 1;
            
            if (accuracy > 0.75) {
                type = 'PERFECT';
                bonus = 1.5;
                this.vfx.emit(this.offsetX + lane * this.laneWidth + this.laneWidth/2, this.judgmentLineY, '#00f2ff', 20);
            } else {
                this.vfx.emit(this.offsetX + lane * this.laneWidth + this.laneWidth/2, this.judgmentLineY, '#fff', 10);
            }

            const points = Math.floor((100 + this.combo * 2) * bonus * (this.isFeverMode ? 2 : 1));
            this.score += points;
            this.combo++;
            this.fever = Math.min(100, this.fever + 2.0);
            this.audio.playHit();
            
            hitNote.processed = true;
            this.addJudgmentText(type, lane);
            this.updateHUD();
        } else if (!this.isAuto) {
            this.triggerMiss();
        }
    }

    addJudgmentText(text, lane) {
        this.judgments.push({
            text,
            x: this.offsetX + lane * this.laneWidth + this.laneWidth/2,
            y: this.judgmentLineY - 50,
            life: 1.0,
            color: text === 'PERFECT' ? '#00f2ff' : '#ffffff'
        });
    }

    triggerMiss() {
        this.combo = 0;
        this.fever = Math.max(0, this.fever - 10);
        this.lives--;
        this.audio.playMiss();
        this.shake = 12;
        this.addJudgmentText('MISS', 1.5); // Center-ish
        this.updateHUD();
        if (this.lives <= 0) this.endGame();
    }

    updateHUD() {
        this.scoreHUD.innerText = String(this.score).padStart(6, '0');
        this.comboHUD.innerText = String(this.combo).padStart(3, '0');
        const integrity = Math.max(0, this.lives * 10);
        document.getElementById('lives-display').innerText = `${integrity}%`;
        
        // 狂熱模式視覺同步
        if (this.fever >= 100 && !this.isFeverMode) {
            this.isFeverMode = true;
            this.shake = 20;
        } else if (this.fever <= 0 && this.isFeverMode) {
            this.isFeverMode = false;
        }
    }

    updateHighScoreUI() {
        const brand = document.getElementById('brand-title');
        const hiText = `<div id="hi-score-disp" style="font-size:0.55rem; opacity:0.6; margin-top:5px; color:#ff00ff">HI-SCORE: ${String(this.highScore).padStart(6, '0')}</div>`;
        const existing = document.getElementById('hi-score-disp');
        if (existing) existing.remove();
        brand.innerHTML += hiText;
    }

    endGame() {
        this.state = 'GAMEOVER';
        this.audio.state = 'GAMEOVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('rhythm_highScore', this.highScore);
            this.updateHighScoreUI();
        }
        document.getElementById('overlay-heading').innerText = 'SESSION ENDED';
        document.getElementById('overlay-description').innerText = `數位同步中斷。終端積分: ${this.score}`;
        document.getElementById('init-game-btn').innerText = 'REBOOT SYNC';
        this.overlay.classList.add('active');
    }

    // 1. 偵測邏輯: AI 預判與行為對齊
    executeAutoPilot() {
        this.notes.forEach(n => {
            if (!n.processed) {
                // 完美插值判定: 當音符中心點接近判定線時觸發
                if (Math.abs(n.y - this.judgmentLineY) < this.speed / 2) {
                    this.handleNoteHit(n.lane);
                }
            }
        });
    }

    update() {
        if (this.state !== 'PLAYING') return;

        // Fever Mode 衰減
        if (this.isFeverMode) {
            this.fever -= 0.3;
            if (this.fever <= 0) this.isFeverMode = false;
        }

        this.difficultyFactor = 1.0 + (this.score / 15000);
        this.speed = this.baseSpeed * this.difficultyFactor;

        if (this.isAuto) this.executeAutoPilot();

        // Note Spawning
        const spawnInterval = Math.max(12, Math.floor(35 / this.difficultyFactor));
        if (this.frame % spawnInterval === 0) {
            this.notes.push({ lane: Math.floor(Math.random() * this.lanes), y: -60, processed: false });
        }

        // Logic: Notes
        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            n.y += this.speed;
            if (!n.processed && n.y > this.judgmentLineY + this.judgmentWindow) {
                n.processed = true;
                this.triggerMiss();
            }
            if (n.y > this.canvas.height + 100) this.notes.splice(i, 1);
        }

        // Logic: Judgments (Text animations)
        for (let i = this.judgments.length - 1; i >= 0; i--) {
            const j = this.judgments[i];
            j.y -= 1.5;
            j.life -= 0.03;
            if (j.life <= 0) this.judgments.splice(i, 1);
        }

        // 模擬背景頻譜
        this.spectrum = this.spectrum.map((v, idx) => {
            const target = Math.random() * (this.isFeverMode ? 150 : 60);
            return v + (target - v) * 0.2;
        });

        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.9;
        this.frame++;
    }

    draw() {
        // 背景填充 (黑色深淵)
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // 1. 背景頻譜 (Visualizer)
        const barW = this.canvas.width / this.spectrum.length;
        this.ctx.fillStyle = this.isFeverMode ? 'rgba(255, 238, 0, 0.1)' : 'rgba(0, 242, 255, 0.05)';
        this.spectrum.forEach((h, i) => {
            this.ctx.fillRect(i * barW, this.canvas.height, barW - 2, -h);
            this.ctx.fillRect(i * barW, 0, barW - 2, h * 0.5);
        });

        // 2. 軌道繪製
        for (let i = 0; i < this.lanes; i++) {
            const x = this.offsetX + i * this.laneWidth;
            this.ctx.strokeStyle = this.isFeverMode ? 'rgba(255, 238, 0, 0.2)' : 'rgba(0, 242, 255, 0.15)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, 0, this.laneWidth, this.canvas.height);
            
            if (this.keys[this.laneKeys[i]]) {
                const grd = this.ctx.createLinearGradient(x, this.canvas.height, x, 0);
                const col = this.isFeverMode ? '255, 238, 0' : '0, 242, 255';
                grd.addColorStop(0, `rgba(${col}, 0.3)`);
                grd.addColorStop(1, `rgba(${col}, 0)`);
                this.ctx.fillStyle = grd;
                this.ctx.fillRect(x, 0, this.laneWidth, this.canvas.height);
            }
        }

        // 3. 判定線 (Pulse on Fever)
        const pulse = Math.sin(this.frame * 0.2) * 2;
        this.ctx.strokeStyle = this.isFeverMode ? '#ffee00' : '#ff00ff';
        this.ctx.lineWidth = 4 + pulse;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = this.ctx.strokeStyle;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX - 20, this.judgmentLineY);
        this.ctx.lineTo(this.offsetX + this.lanes * this.laneWidth + 20, this.judgmentLineY);
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 4. 音符渲染 (Neon Style)
        this.notes.forEach(n => {
            if (!n.processed) {
                const x = this.offsetX + n.lane * this.laneWidth + (this.laneWidth - this.noteSize) / 2;
                const grd = this.ctx.createLinearGradient(x, n.y, x, n.y + 20);
                grd.addColorStop(0, '#fff');
                grd.addColorStop(1, this.isFeverMode ? '#ffee00' : '#00f2ff');
                this.ctx.fillStyle = grd;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = grd.addColorStop;
                this.ctx.fillRect(x, n.y, this.noteSize, 20);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x, n.y, this.noteSize, 20);
                this.ctx.shadowBlur = 0;
            }
        });

        // 5. 打擊文字 (Floating Judgments)
        this.judgments.forEach(j => {
            this.ctx.globalAlpha = j.life;
            this.ctx.fillStyle = j.color;
            this.ctx.font = `bold ${24 + (1.0 - j.life) * 20}px 'Outfit'`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(j.text, j.x, j.y);
        });
        this.ctx.globalAlpha = 1.0;

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
