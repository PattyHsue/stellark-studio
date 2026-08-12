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
        } catch (e) { console.warn("Casino Synth Audio failed."); }
    }

    playBGM() {
        if (!this.isReady || this.bgmTimer) return;
        const trigger = () => {
            if (!this.isReady) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            // 爵士貝斯藍調步進 (G1 -> C2 -> D2)
            const freqs = [49, 65.4, 73.4, 65.4];
            osc.frequency.setValueAtTime(freqs[Math.floor(now % 4)], now);
            g.gain.setValueAtTime(0.05, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(g);
            g.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 1.5);
            this.bgmTimer = setTimeout(trigger, 1500);
        };
        trigger();
    }

    playChip() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        g.gain.setValueAtTime(0.15, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playCard() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.05);
        g.gain.setValueAtTime(0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.05);
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
                decay: 0.015 + Math.random() * 0.02,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity (Chip fall)
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }
}

class HandEvaluator {
    static getScore(cards) {
        if (!cards || cards.length < 2) return 0;
        const vals = cards.map(c => "234567891TJQK A".indexOf(c.val.charAt(0))).sort((a,b) => b-a);
        const counts = {};
        vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const sortedCounts = Object.values(counts).sort((a,b) => b-a);
        
        // High Card (0), Pair (10), Two Pair (20), Three of Kind (30)...
        if (sortedCounts[0] === 4) return 70 + vals[0]; // Four of a Kind
        if (sortedCounts[0] === 3 && sortedCounts[1] === 2) return 60 + vals[0]; // Full House
        if (sortedCounts[0] === 3) return 30 + vals[0]; // Three of Kind
        if (sortedCounts[0] === 2 && sortedCounts[1] === 2) return 20 + vals[0]; // Two Pair
        if (sortedCounts[0] === 2) return 10 + vals[0]; // Pair
        return vals[0] / 15; // High Card
    }
}

class EliteEngine {
    constructor() {
        // UI Components
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.chipsHUD = document.getElementById('score-val');
        this.potHUD = document.getElementById('pot-display');
        this.overlay = document.getElementById('game-overlay');
        this.autoToggle = document.getElementById('auto-pilot-toggle');
        
        // Step 3, 4 & 5 Integration
        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.shake = 0;
        this.difficulty = 1.0;
        this.isAuto = false;
        
        // Game Configuration
        this.suits = ['♠', '♥', '♦', '♣'];
        this.values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        // Game State
        this.state = 'START'; // START, DEALING, BETTING, REVEALING, GAMEOVER
        this.phase = 'PREFLOP'; // PREFLOP, FLOP, TURN, RIVER, SHOWDOWN
        
        // Step 7: Data Persistence
        this.chips = parseInt(localStorage.getItem('texasHoldem_chips')) || 10000;
        if (this.chips < 500) this.chips = 10000; // Bankruptcy Protection
        
        this.pot = 0;
        this.currentBet = 0;
        this.frame = 0;
        this.isAuto = false;
        
        // Entities
        this.deck = [];
        this.playerHand = [];
        this.aiHand = [];
        this.communityCards = [];
        
        this.initEvents();
        this.resize();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // 1. 行動端比例重算 (Mobile Scaling)
        this.scale = Math.min(window.innerWidth / 800, window.innerHeight / 600, 1.0);
    }

    initEvents() {
        window.addEventListener('resize', () => this.resize());
        
        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.audio.playBGM();
            this.state = 'PLAYING';
            this.overlay.classList.remove('active');
            this.startNewRound();
        };

        this.autoToggle.onclick = () => {
            this.isAuto = !this.isAuto;
            this.autoToggle.classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
        };

        // 1. 觸控映射 (Mobile Polish Swipe & Tap)
        let startX, startY;
        this.canvas.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.state !== 'PLAYING') return;
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            
            if (Math.abs(dy) > 50 && dy < 0) {
                this.handleAction('RAISE'); // 向上滑動加註
            } else if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                this.handleAction('CALL'); // 點擊跟注
            }
        }, { passive: true });

        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            if (e.code === 'KeyC') this.handleAction('CALL');
            if (e.code === 'KeyF') this.handleAction('FOLD');
            if (e.code === 'KeyR') this.handleAction('RAISE');
        });
    }

    createDeck() {
        this.deck = [];
        for (let suit of this.suits) {
            for (let val of this.values) {
                this.deck.push({ suit, val, color: (suit === '♥' || suit === '♦') ? '#ff4d4d' : '#ffffff' });
            }
        }
        // Fisher-Yates Shuffle
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    startNewRound() {
        this.phase = 'PREFLOP';
        this.pot = 0;
        this.playerHand = [];
        this.aiHand = [];
        this.communityCards = [];
        this.createDeck();
        
        // Deal internal (Play Audio)
        this.audio.playCard();
        this.playerHand.push(this.deck.pop(), this.deck.pop());
        this.aiHand.push(this.deck.pop(), this.deck.pop());
        
        this.updateHUD();
    }

    nextPhase() {
        this.audio.playCard();
        if (this.phase === 'PREFLOP') {
            this.phase = 'FLOP';
            this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
        } else if (this.phase === 'FLOP') {
            this.phase = 'TURN';
            this.communityCards.push(this.deck.pop());
        } else if (this.phase === 'TURN') {
            this.phase = 'RIVER';
            this.communityCards.push(this.deck.pop());
        } else if (this.phase === 'RIVER') {
            this.phase = 'SHOWDOWN';
            this.evaluateWinner();
        }
    }

    handleAction(action) {
        if (action === 'CALL') {
            this.audio.playChip();
            this.vfx.emit(this.canvas.width/2, this.canvas.height - 150, '#ffd700', 8);
            this.chips -= 100;
            this.pot += 100;
            this.nextPhase();
        } else if (action === 'FOLD') {
            this.startNewRound();
        } else if (action === 'RAISE') {
            this.audio.playChip();
            this.vfx.emit(this.canvas.width/2, this.canvas.height - 150, '#ffd700', 15);
            this.shake = 5;
            this.chips -= 200;
            this.pot += 200;
            this.nextPhase();
        }
        localStorage.setItem('texasHoldem_chips', this.chips);
        this.updateHUD();
    }

    evaluateWinner() {
        const playerScore = HandEvaluator.getScore([...this.playerHand, ...this.communityCards]);
        const aiScore = HandEvaluator.getScore([...this.aiHand, ...this.communityCards]);
        
        if (playerScore >= aiScore) {
            this.chips += this.pot;
            localStorage.setItem('texasHoldem_chips', this.chips);
            this.vfx.emit(this.canvas.width/2, this.canvas.height/2, '#ffd700', 50);
            this.shake = 15;
            this.pot = 0;
            alert(`Player Wins with Score ${playerScore.toFixed(1)}!`);
        } else {
            this.pot = 0;
            this.vfx.emit(this.canvas.width/2, this.canvas.height/2, '#555', 20);
            alert(`AI Wins with Score ${aiScore.toFixed(1)}!`);
        }
        this.startNewRound();
    }

    updateHUD() {
        this.chipsHUD.innerText = `$${this.chips.toLocaleString()}`;
        this.potHUD.innerText = `$${this.pot.toLocaleString()}`;
    }

    update() {
        if (this.state !== 'PLAYING') return;
        if (this.isAuto) this.executeAutoPilot();
        this.vfx.update();
        if (this.shake > 0) this.shake *= 0.85;
        this.frame++;
    }

    // 1. 偵測邏輯: AI 算牌顧問
    executeAutoPilot() {
        if (this.frame % 120 !== 0) return;
        
        const score = HandEvaluator.getScore([...this.playerHand, ...this.communityCards]);
        
        // 戰法策略: 基於牌力強度的風險決策
        if (score > 30) {
            this.handleAction('RAISE');
        } else if (score > 10) {
            this.handleAction('CALL');
        } else {
            if (this.phase === 'PREFLOP') this.handleAction('CALL');
            else this.handleAction('FOLD');
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        
        // 3. 屏幕反饋 (Camera Shake)
        if (this.shake > 0.5) {
            this.ctx.translate((Math.random() - 0.5) * this.shake / this.scale, (Math.random() - 0.5) * this.shake / this.scale);
        }

        const centerX = (this.canvas.width / 2) / this.scale;
        const centerY = (this.canvas.height / 2) / this.scale;

        // Draw Ambient Table Glow
        const tableGrd = this.ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 600);
        tableGrd.addColorStop(0, 'rgba(0, 230, 118, 0.05)');
        tableGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = tableGrd;
        this.ctx.fillRect(0, 0, this.canvas.width/this.scale, this.canvas.height/this.scale);
        
        // Draw Community Cards (With Shadow)
        this.communityCards.forEach((card, i) => {
            this.drawCard(centerX - 180 + i * 75, centerY - 60, card, true);
        });

        // Draw Player Hand
        this.playerHand.forEach((card, i) => {
            this.drawCard(centerX - 45 + i * 90, centerY + 160, card, true);
        });

        // Draw AI Hand (Hidden)
        this.aiHand.forEach((card, i) => {
            this.drawCard(centerX - 45 + i * 90, centerY - 280, card, false);
        });

        // 1. 粒子系統 (VFX Layer)
        this.vfx.draw(this.ctx);

        this.ctx.restore();
    }

    drawCard(x, y, card, revealed) {
        const w = 70, h = 100;
        
        // 2. 卡牌陰影與高亮度描邊 (3D Depth & Outline)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
        this.ctx.shadowOffsetY = 10;

        this.ctx.fillStyle = revealed ? '#fff' : '#00e676';
        this.ctx.strokeStyle = revealed ? '#ffd700' : '#69f0ae'; // 增加金色描邊
        this.ctx.lineWidth = 3;
        
        // Card Body
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 8);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;

        if (revealed) {
            this.ctx.fillStyle = card.color;
            this.ctx.font = 'bold 18px Outfit';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(card.val, x + 8, y + 25);
            this.ctx.textAlign = 'center';
            this.ctx.font = '36px Outfit';
            this.ctx.fillText(card.suit, x + w/2, y + h/2 + 15);
            
            // Subtle Card Sheen
            const sheen = this.ctx.createLinearGradient(x, y, x + w, y + h);
            sheen.addColorStop(0, 'rgba(255,255,255,0.1)');
            sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
            sheen.addColorStop(1, 'rgba(0,0,0,0.05)');
            this.ctx.fillStyle = sheen;
            this.ctx.fillRect(x, y, w, h);
        } else {
            // Card Back Pattern (Neon Aesthetic)
            this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            this.ctx.lineWidth = 1;
            for(let i=0; i<w; i+=10) {
                this.ctx.beginPath();
                this.ctx.moveTo(x+i, y);
                this.ctx.lineTo(x+i+10, y+h);
                this.ctx.stroke();
            }
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => new EliteEngine();
