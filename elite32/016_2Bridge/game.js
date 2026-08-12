/**
 * =========================================================================
 * 016_2Bridge | UTT-v2.0 MASTER-GRADE ENGINE
 * Theme: ROYAL VELVET — Contract Bridge Card Game
 * =========================================================================
 * Xavier's Architecture Blueprint:
 *   Module 1: AudioManager       — Procedural synthesis (Web Audio API)
 *   Module 2: CardDeck           — 52-card deck, shuffle, deal
 *   Module 3: BridgeHand         — HCP evaluation, suit sorting
 *   Module 4: BiddingEngine      — Standard American bidding logic
 *   Module 5: TrickEngine        — Trick-taking, trump management
 *   Module 6: EliteEngine        — Core game loop & canvas rendering
 *
 * Ada's Complexity Report:
 *   Card Sort: O(N log N) Timsort on suit/rank
 *   Bidding AI: O(1) rule-based HCP evaluation
 *   Trick Resolution: O(4) per trick, O(52) per hand
 * =========================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = ['spade', 'heart', 'diamond', 'club'];
const SUIT_COLORS = ['#2c3e50', '#c0392b', '#e67e22', '#1a5c38'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
const HCP_VALUES = { 'J': 1, 'Q': 2, 'K': 3, 'A': 4 };
const PLAYERS = ['South', 'West', 'North', 'East'];
const PLAYER_POSITIONS = { South: 'bottom', West: 'left', North: 'top', East: 'right' };

// ---------------------------------------------------------------------------
// Module 1: AudioManager (Procedural Synthesis)
// ---------------------------------------------------------------------------
class AudioManager {
    constructor() { this.ctx = null; this.masterGain = null; this.isReady = false; }

    init() {
        if (this.isReady) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
            this.masterGain.gain.value = 0.4;
            this.isReady = true;
            if (this.ctx.state === 'suspended') this.ctx.resume();
        } catch (e) { console.warn('AudioManager init failed.'); }
    }

    _playTone(freq, duration, type = 'sine', vol = 0.1) {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(g); g.connect(this.masterGain);
        osc.start(now); osc.stop(now + duration);
    }

    playCardFlip() { this._playTone(1200, 0.05, 'sine', 0.08); }
    playCardPlace() { this._playTone(600, 0.08, 'triangle', 0.1); }
    playBid() { this._playTone(880, 0.06, 'sine', 0.07); }
    playPass() { this._playTone(330, 0.1, 'triangle', 0.06); }

    playTrickWin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523, 659, 784].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(f, now + i * 0.08);
            g.gain.setValueAtTime(0.1, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.25);
        });
    }

    playGameWin() {
        if (!this.isReady) return;
        const now = this.ctx.currentTime;
        [523, 659, 784, 1047].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(f, now + i * 0.15);
            g.gain.setValueAtTime(0.15, now + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
            osc.connect(g); g.connect(this.masterGain);
            osc.start(now + i * 0.15); osc.stop(now + i * 0.15 + 0.5);
        });
    }
}

// ---------------------------------------------------------------------------
// Module 2: Card & Deck
// ---------------------------------------------------------------------------
class Card {
    constructor(suit, rank) {
        this.suit = suit;                  // 0-3 (♠♥♦♣)
        this.rank = rank;                  // '2'-'A'
        this.suitSymbol = SUITS[suit];
        this.suitName = SUIT_NAMES[suit];
        this.color = SUIT_COLORS[suit];
        this.value = RANK_VALUES[rank];
        this.hcp = HCP_VALUES[rank] || 0;
        this.faceUp = false;
        // Rendering state
        this.x = 0; this.y = 0;
        this.targetX = 0; this.targetY = 0;
        this.width = 60; this.height = 84;
        this.hover = false;
        this.selected = false;
        this.animProgress = 0;
    }

    get display() { return `${this.rank}${this.suitSymbol}`; }

    getSortValue() {
        return this.suit * 100 + this.value;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.build();
    }

    build() {
        this.cards = [];
        for (let s = 0; s < 4; s++) {
            for (const r of RANKS) {
                this.cards.push(new Card(s, r));
            }
        }
    }

    shuffle() {
        // Fisher-Yates O(N)
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        this.shuffle();
        const hands = [[], [], [], []]; // S, W, N, E
        this.cards.forEach((card, i) => {
            hands[i % 4].push(card);
        });
        // Sort each hand by suit then rank
        hands.forEach(h => h.sort((a, b) => a.getSortValue() - b.getSortValue()));
        return hands;
    }
}

// ---------------------------------------------------------------------------
// Module 3: Hand Evaluation
// ---------------------------------------------------------------------------
class HandEvaluator {
    static getHCP(hand) {
        return hand.reduce((sum, c) => sum + c.hcp, 0);
    }

    static getSuitDistribution(hand) {
        const dist = [0, 0, 0, 0];
        hand.forEach(c => dist[c.suit]++);
        return dist;
    }

    static getLongestSuit(hand) {
        const dist = this.getSuitDistribution(hand);
        let maxIdx = 0;
        for (let i = 1; i < 4; i++) {
            if (dist[i] > dist[maxIdx]) maxIdx = i;
        }
        return maxIdx;
    }

    static getDistributionPoints(hand) {
        const dist = this.getSuitDistribution(hand);
        let dp = 0;
        dist.forEach(count => {
            if (count === 0) dp += 3;       // Void
            else if (count === 1) dp += 2;  // Singleton
            else if (count === 2) dp += 1;  // Doubleton
        });
        return dp;
    }

    static getTotalPoints(hand) {
        return this.getHCP(hand) + this.getDistributionPoints(hand);
    }
}

// ---------------------------------------------------------------------------
// Module 4: Bidding Engine (Standard American Simplified)
// ---------------------------------------------------------------------------
class BiddingEngine {
    constructor() {
        this.bids = [];             // Array of { player, call }
        this.contract = null;       // { level, suit, declarer, doubled }
        this.passCount = 0;
        this.lastBid = null;        // { level, suit }
        this.dealer = 0;            // Player index
        this.currentBidder = 0;
        this.phase = 'BIDDING';     // 'BIDDING' | 'COMPLETE'
        this.doubled = false;
        this.redoubled = false;
    }

    reset(dealer) {
        this.bids = [];
        this.contract = null;
        this.passCount = 0;
        this.lastBid = null;
        this.dealer = dealer;
        this.currentBidder = dealer;
        this.phase = 'BIDDING';
        this.doubled = false;
        this.redoubled = false;
    }

    getBidOptions() {
        const options = [];
        if (this.phase !== 'BIDDING') return options;

        // Pass is always available
        options.push({ type: 'PASS' });

        // Generate level/suit bids higher than current
        const suitOrder = ['♣', '♦', '♥', '♠', 'NT'];
        const startLevel = this.lastBid ? this.lastBid.level : 1;
        const startSuitIdx = this.lastBid ? suitOrder.indexOf(this.lastBid.suit) : -1;

        for (let level = startLevel; level <= 7; level++) {
            for (let si = 0; si < 5; si++) {
                if (level === startLevel && si <= startSuitIdx) continue;
                options.push({ type: 'BID', level, suit: suitOrder[si] });
            }
        }

        // Double / Redouble
        if (this.lastBid && !this.doubled) {
            const lastBidderTeam = this.bids.filter(b => b.call.type === 'BID').slice(-1)[0];
            if (lastBidderTeam) {
                const bidderIdx = PLAYERS.indexOf(lastBidderTeam.player);
                if ((bidderIdx % 2) !== (this.currentBidder % 2)) {
                    options.push({ type: 'DOUBLE' });
                }
            }
        }
        if (this.doubled && !this.redoubled) {
            const lastDblr = this.bids.filter(b => b.call.type === 'DOUBLE').slice(-1)[0];
            if (lastDblr) {
                const dblrIdx = PLAYERS.indexOf(lastDblr.player);
                if ((dblrIdx % 2) !== (this.currentBidder % 2)) {
                    options.push({ type: 'REDOUBLE' });
                }
            }
        }

        return options;
    }

    placeBid(playerIdx, call) {
        const player = PLAYERS[playerIdx];
        this.bids.push({ player, call });

        if (call.type === 'PASS') {
            this.passCount++;
            // 4 passes in a row = deal passed out
            if (this.passCount >= 4 && !this.lastBid) {
                this.phase = 'COMPLETE';
                this.contract = null; // Passed out
                return 'PASSED_OUT';
            }
            // 3 passes after a bid = contract established
            if (this.passCount >= 3 && this.lastBid) {
                this.phase = 'COMPLETE';
                this.finalizeContract();
                return 'CONTRACT_SET';
            }
        } else {
            this.passCount = 0;
            if (call.type === 'BID') {
                this.lastBid = { level: call.level, suit: call.suit };
                this.doubled = false;
                this.redoubled = false;
            } else if (call.type === 'DOUBLE') {
                this.doubled = true;
            } else if (call.type === 'REDOUBLE') {
                this.redoubled = true;
            }
        }

        this.currentBidder = (this.currentBidder + 1) % 4;
        return 'CONTINUE';
    }

    finalizeContract() {
        if (!this.lastBid) return;
        const winningBids = this.bids.filter(b => b.call.type === 'BID' && b.call.suit === this.lastBid.suit);
        const lastWinner = winningBids[winningBids.length - 1];
        const declarerIdx = PLAYERS.indexOf(lastWinner.player);
        const team = declarerIdx % 2;
        const firstBidder = winningBids.find(b => PLAYERS.indexOf(b.player) % 2 === team);

        this.contract = {
            level: this.lastBid.level,
            suit: this.lastBid.suit,
            declarer: firstBidder ? firstBidder.player : lastWinner.player,
            declarerIdx: firstBidder ? PLAYERS.indexOf(firstBidder.player) : declarerIdx,
            doubled: this.doubled,
            redoubled: this.redoubled,
            required: this.lastBid.level + 6,
            vulnerable: false // Dynamic in P5
        };
    }

    getAIBid(hand) {
        const hcp = HandEvaluator.getHCP(hand);
        const dist = HandEvaluator.getSuitDistribution(hand);
        const options = this.getBidOptions();

        if (options.length === 0) return null;

        // P2: Refined Bidding Logic
        if (this.bids.length === 0) { // Opening
            if (hcp < 12) return options.find(o => o.type === 'PASS');
            if (hcp >= 22) return options.find(o => o.type === 'BID' && o.level === 2 && o.suit === '♣'); // Strong 2C
            if (hcp >= 15 && hcp <= 17 && this.isBalanced(dist)) return options.find(o => o.level === 1 && o.suit === 'NT');
            
            // Open 1-something
            const longest = HandEvaluator.getLongestSuit(hand);
            const suitSymbols = ['♠', '♥', '♦', '♣'];
            const bid = options.find(o => o.level === 1 && o.suit === suitSymbols[longest]);
            return bid || options.find(o => o.type === 'PASS');
        }

        // Response or Competition
        if (hcp < 6) return options.find(o => o.type === 'PASS');
        
        // Find best match in available bids
        const suitBids = options.filter(o => o.type === 'BID');
        if (suitBids.length === 0) return options.find(o => o.type === 'PASS');

        // Simple supportive bid
        if (this.lastBid) {
            const partnerBid = this.bids[this.bids.length - 2];
            if (partnerBid && partnerBid.call.type === 'BID') {
                const partnerSuit = partnerBid.call.suit;
                const partnerSuitIdx = ['♠', '♥', '♦', '♣'].indexOf(partnerSuit);
                if (partnerSuitIdx >= 0 && dist[partnerSuitIdx] >= 3) {
                    const raise = suitBids.find(o => o.suit === partnerSuit && o.level === partnerBid.call.level + 1);
                    if (raise && hcp >= 10) return raise;
                }
            }
        }

        return suitBids[0]; // Minimum available
    }

    isBalanced(dist) {
        const sorted = [...dist].sort();
        // 4-3-3-3, 4-4-3-2, 5-3-3-2
        return sorted[0] >= 2 && sorted[3] <= 5;
    }
}

// ---------------------------------------------------------------------------
// Module 5: Trick Engine
// ---------------------------------------------------------------------------
class TrickEngine {
    constructor() {
        this.trumpSuit = -1;        // -1 = NT
        this.currentTrick = [];     // Array of {playerIdx, card}
        this.leadPlayer = 0;
        this.trickCount = [0, 0, 0, 0]; // Per player
        this.nsTricks = 0;
        this.ewTricks = 0;
        this.totalTricks = 0;
        this.phase = 'PLAYING';
    }

    reset(contract, declarerIdx) {
        // Trump suit
        const suitMap = { '♠': 0, '♥': 1, '♦': 2, '♣': 3, 'NT': -1 };
        this.trumpSuit = suitMap[contract.suit] ?? -1;
        // Lead: left of declarer
        this.leadPlayer = (declarerIdx + 1) % 4;
        this.currentTrick = [];
        this.trickCount = [0, 0, 0, 0];
        this.nsTricks = 0;
        this.ewTricks = 0;
        this.totalTricks = 0;
        this.phase = 'PLAYING';
    }

    getCurrentPlayer() {
        if (this.currentTrick.length === 0) return this.leadPlayer;
        return (this.leadPlayer + this.currentTrick.length) % 4;
    }

    getPlayableCards(hand) {
        if (this.currentTrick.length === 0) return hand; // Lead: any card

        const leadSuit = this.currentTrick[0].card.suit;
        const suitCards = hand.filter(c => c.suit === leadSuit);
        return suitCards.length > 0 ? suitCards : hand; // Must follow suit
    }

    playCard(playerIdx, card) {
        this.currentTrick.push({ playerIdx, card });

        if (this.currentTrick.length === 4) {
            return this.resolveTrick();
        }
        return null; // Trick not yet complete
    }

    resolveTrick() {
        const leadSuit = this.currentTrick[0].card.suit;
        let winner = this.currentTrick[0];

        for (let i = 1; i < 4; i++) {
            const entry = this.currentTrick[i];
            const c = entry.card;
            const w = winner.card;

            if (c.suit === this.trumpSuit && w.suit !== this.trumpSuit) {
                winner = entry; // Trump beats non-trump
            } else if (c.suit === w.suit && c.value > w.value) {
                winner = entry; // Higher card of same suit
            }
        }

        this.trickCount[winner.playerIdx]++;
        if (winner.playerIdx % 2 === 0) this.nsTricks++;
        else this.ewTricks++;

        this.totalTricks++;
        this.leadPlayer = winner.playerIdx;

        const trickResult = {
            winner: winner.playerIdx,
            winnerName: PLAYERS[winner.playerIdx],
            cards: [...this.currentTrick]
        };

        this.currentTrick = [];

        if (this.totalTricks >= 13) {
            this.phase = 'COMPLETE';
        }

        return trickResult;
    }

    getAICardChoice(hand) {
        const playable = this.getPlayableCards(hand);
        if (playable.length === 0) return null;

        if (this.currentTrick.length === 0) {
            // Lead: play highest card of longest suit
            return playable[playable.length - 1];
        }

        const leadSuit = this.currentTrick[0].card.suit;
        const suitCards = playable.filter(c => c.suit === leadSuit);

        if (suitCards.length > 0) {
            // Try to win: play highest if possible
            const highest = suitCards[suitCards.length - 1];
            const currentWinnerValue = this.currentTrick.reduce((max, e) => {
                if (e.card.suit === leadSuit) return Math.max(max, e.card.value);
                return max;
            }, 0);
            if (highest.value > currentWinnerValue) return highest;
            // Otherwise play lowest
            return suitCards[0];
        }

        // Can't follow suit: trump if possible
        const trumpCards = playable.filter(c => c.suit === this.trumpSuit);
        if (trumpCards.length > 0) return trumpCards[0]; // Play lowest trump

        // Discard lowest
        return playable[0];
    }
}

// ---------------------------------------------------------------------------
// Module 6: ParticleEmitter
// ---------------------------------------------------------------------------
class ParticleEmitter {
    constructor() { this.particles = []; }

    emit(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.4;
            const speed = 1 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 2 + Math.random() * 4,
                color
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.05;
            p.vx *= 0.98;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.life * 0.6;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            ctx.restore();
        });
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }
}

// ---------------------------------------------------------------------------
// Module 7: EliteEngine (Core Game Loop)
// ---------------------------------------------------------------------------
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('stage');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('game-overlay');
        this.bidPanel = document.getElementById('bid-panel');
        this.bidLog = document.getElementById('bid-log');
        this.bidLogEntries = document.getElementById('bid-log-entries');

        this.audio = new AudioManager();
        this.vfx = new ParticleEmitter();
        this.deck = new Deck();
        this.biddingEngine = new BiddingEngine();
        this.trickEngine = new TrickEngine();

        // State
        this.state = 'START'; // START | BIDDING | PLAYING | SCORING
        this.hands = [[], [], [], []];
        this.frame = 0;
        this.isAuto = false;
        this.autoTimer = 0;
        this.scoreNS = 0;
        this.scoreEW = 0;
        this.dealer = 0;
        this.handNumber = 0;
        this.selectedCard = null;

        // Card rendering constants
        this.cardW = 58;
        this.cardH = 82;
        this.cardR = 6;

        // Pre-render cache
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.highScore = parseInt(localStorage.getItem('bridge_2_highScore')) || 0;

        this.initEvents();
        this.resize();
        this.gameLoop();
        this.logEvent('ENGINE_INIT', { theme: 'ROYAL_VELVET' });
    }

    logEvent(ev, data = {}) {
        console.group('%c📊 BRIDGE_ANALYTICS', 'color: #c9a84c; font-weight: bold;');
        console.info(`[${new Date().toISOString()}] ${ev}`, data);
        console.groupEnd();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.preRenderBackground();
    }

    preRenderBackground() {
        const w = this.canvas.width, h = this.canvas.height;
        this.bgCanvas.width = w; this.bgCanvas.height = h;
        const ctx = this.bgCtx;

        // Deep green background
        ctx.fillStyle = '#0a1610';
        ctx.fillRect(0, 0, w, h);

        // Felt table (ellipse)
        const cx = w / 2, cy = h / 2;
        const rx = Math.min(w * 0.42, 450), ry = Math.min(h * 0.38, 320);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
        grad.addColorStop(0, '#1a4a32');
        grad.addColorStop(0.7, '#0d3020');
        grad.addColorStop(1, '#0a1610');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        // Felt border (gold ring)
        ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Player position labels
        ctx.font = '600 11px Outfit';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(201, 168, 76, 0.2)';
        ctx.fillText('SOUTH (You)', cx, cy + ry - 20);
        ctx.fillText('NORTH', cx, cy - ry + 30);
        ctx.fillText('WEST', cx - rx + 50, cy + 4);
        ctx.fillText('EAST', cx + rx - 50, cy + 4);
    }

    // === DEAL ===
    startNewHand() {
        this.handNumber++;
        this.deck = new Deck();
        this.hands = this.deck.deal();
        this.hands[0].forEach(c => c.faceUp = true); // South (player) face up
        this.biddingEngine.reset(this.dealer);
        this.selectedCard = null;

        this.state = 'BIDDING';
        this.bidPanel.classList.add('visible');
        this.bidLog.classList.add('visible');
        this.bidLogEntries.innerHTML = '';
        this.updateBidPanel();
        this.updateHUD();
        this.logEvent('HAND_DEALT', { hand: this.handNumber, dealer: PLAYERS[this.dealer] });
    }

    // === BIDDING UI ===
    updateBidPanel() {
        const panel = this.bidPanel;
        panel.innerHTML = '';

        if (this.biddingEngine.currentBidder !== 0 || this.state !== 'BIDDING') return;

        const options = this.biddingEngine.getBidOptions();

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'bid-btn';

            if (opt.type === 'PASS') {
                btn.textContent = 'PASS';
                btn.classList.add('pass');
            } else if (opt.type === 'DOUBLE') {
                btn.textContent = 'X';
                btn.classList.add('double');
            } else if (opt.type === 'REDOUBLE') {
                btn.textContent = 'XX';
                btn.classList.add('redouble');
            } else {
                const suitClass = opt.suit === '♠' ? 'suit-spade' :
                                  opt.suit === '♥' ? 'suit-heart' :
                                  opt.suit === '♦' ? 'suit-diamond' :
                                  opt.suit === '♣' ? 'suit-club' : 'suit-nt';
                btn.textContent = `${opt.level}${opt.suit}`;
                btn.classList.add(suitClass);
            }

            btn.onclick = () => {
                this.humanBid(opt);
            };
            panel.appendChild(btn);
        });
    }

    humanBid(call) {
        this.processBid(0, call);
    }

    processBid(playerIdx, call) {
        const result = this.biddingEngine.placeBid(playerIdx, call);

        // Log the bid
        const entry = document.createElement('div');
        entry.className = 'bid-log-entry';
        const callDisplay = call.type === 'PASS' ? 'Pass' :
                           call.type === 'DOUBLE' ? 'X' :
                           call.type === 'REDOUBLE' ? 'XX' :
                           `${call.level}${call.suit}`;
        entry.innerHTML = `<span class="bid-log-player">${PLAYERS[playerIdx]}</span><span class="bid-log-call">${callDisplay}</span>`;
        this.bidLogEntries.appendChild(entry);
        this.bidLogEntries.scrollTop = this.bidLogEntries.scrollHeight;

        if (call.type === 'PASS') this.audio.playPass();
        else this.audio.playBid();

        if (result === 'PASSED_OUT') {
            this.showOverlay('PASSED OUT', 'No contract reached. Redealing...', 'REDEAL');
            return;
        }

        if (result === 'CONTRACT_SET') {
            const c = this.biddingEngine.contract;
            const contractStr = `${c.level}${c.suit}${c.doubled ? ' X' : ''}${c.redoubled ? ' XX' : ''} by ${c.declarer}`;
            document.getElementById('contract-display').innerText = contractStr;
            this.bidPanel.classList.remove('visible');

            this.logEvent('CONTRACT_SET', { contract: contractStr });

            // Transition to play phase
            setTimeout(() => this.startPlay(), 1200);
            return;
        }

        // Continue bidding: AI plays next turns
        if (this.biddingEngine.currentBidder !== 0) {
            this.scheduleAIBid();
        } else {
            this.updateBidPanel();
        }
    }

    scheduleAIBid() {
        setTimeout(() => {
            if (this.state !== 'BIDDING') return;
            const bidder = this.biddingEngine.currentBidder;
            const hand = this.hands[bidder];
            const aiBid = this.biddingEngine.getAIBid(hand);
            if (aiBid) {
                this.processBid(bidder, aiBid);
            }
        }, 800);
    }

    // === PLAY PHASE ===
    startPlay() {
        this.state = 'PLAYING';
        const c = this.biddingEngine.contract;
        this.trickEngine.reset(c, c.declarerIdx);

        // The dummy (partner of declarer) shows hand
        const dummyIdx = (c.declarerIdx + 2) % 4;
        this.hands[dummyIdx].forEach(card => card.faceUp = true);

        this.updateHUD();

        // If AI leads first
        const currentPlayer = this.trickEngine.getCurrentPlayer();
        if (currentPlayer !== 0) {
            this.scheduleAIPlay();
        }
    }

    scheduleAIPlay() {
        setTimeout(() => {
            if (this.state !== 'PLAYING') return;
            const currentPlayer = this.trickEngine.getCurrentPlayer();
            if (currentPlayer === 0) return; // Human's turn

            const hand = this.hands[currentPlayer];
            const card = this.trickEngine.getAICardChoice(hand);
            if (card) {
                this.playCardFromHand(currentPlayer, card);
            }
        }, 700);
    }

    playCardFromHand(playerIdx, card) {
        // Remove from hand
        const idx = this.hands[playerIdx].indexOf(card);
        if (idx === -1) return;
        this.hands[playerIdx].splice(idx, 1);
        card.faceUp = true;

        this.audio.playCardPlace();

        const result = this.trickEngine.playCard(playerIdx, card);

        if (result) {
            // Trick complete
            this.audio.playTrickWin();
            const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
            this.vfx.emit(cx, cy, result.winner % 2 === 0 ? '#c9a84c' : '#3498db', 12);

            this.logEvent('TRICK_WON', { winner: result.winnerName, trick: this.trickEngine.totalTricks });

            this.updateHUD();

            if (this.trickEngine.phase === 'COMPLETE') {
                setTimeout(() => this.scoreHand(), 1500);
                return;
            }

            // Next trick
            setTimeout(() => {
                const nextPlayer = this.trickEngine.getCurrentPlayer();
                if (nextPlayer !== 0) {
                    this.scheduleAIPlay();
                }
            }, 1200);
        } else {
            // Trick continues
            const nextPlayer = this.trickEngine.getCurrentPlayer();
            if (nextPlayer !== 0) {
                this.scheduleAIPlay();
            }
        }
    }

    // Handle human card click
    onCardClick(playerIdx, cardIdx) {
        if (this.state !== 'PLAYING') return;
        if (this.trickEngine.getCurrentPlayer() !== playerIdx) return;

        const hand = this.hands[playerIdx];
        const card = hand[cardIdx];
        const playable = this.trickEngine.getPlayableCards(hand);

        if (!playable.includes(card)) return; // Not a legal play

        this.playCardFromHand(playerIdx, card);
    }

    // === SCORING ===
    scoreHand() {
        const c = this.biddingEngine.contract;
        const declarerTeam = c.declarerIdx % 2;
        const tricksMade = declarerTeam === 0 ? this.trickEngine.nsTricks : this.trickEngine.ewTricks;
        const diff = tricksMade - c.required;
        const isVul = c.vulnerable;

        let score = 0;
        if (diff >= 0) {
            // Contract Score
            const perTrick = (c.suit === '♥' || c.suit === '♠') ? 30 : 20;
            let contractScore = (c.suit === 'NT' ? 40 + (c.level - 1) * 30 : c.level * perTrick);
            
            if (c.doubled) contractScore *= 2;
            if (c.redoubled) contractScore *= 4;

            // Overtricks
            let overtrickScore = 0;
            if (c.doubled) overtrickScore = diff * (isVul ? 200 : 100);
            else if (c.redoubled) overtrickScore = diff * (isVul ? 400 : 200);
            else overtrickScore = diff * perTrick;

            // Premiums
            let premium = 0;
            if (contractScore >= 100) premium += (isVul ? 500 : 300); // Game
            else premium += 50; // Partial

            if (c.doubled) premium += 50;
            if (c.redoubled) premium += 100;

            // Slam bonuses
            if (c.level === 6) premium += (isVul ? 750 : 500);
            if (c.level === 7) premium += (isVul ? 1500 : 1000);

            score = contractScore + overtrickScore + premium;
        } else {
            // Undertricks
            const down = Math.abs(diff);
            if (!c.doubled && !c.redoubled) {
                score = down * (isVul ? -100 : -50);
            } else {
                // Complex doubled scoring
                let penalty = (isVul ? 200 : 100);
                if (down > 1) penalty += Math.min(down - 1, 2) * (isVul ? 300 : 200);
                if (down > 3) penalty += (down - 3) * 300;
                score = -penalty * (c.redoubled ? 2 : 1);
            }
        }

        if (declarerTeam === 0) {
            if (score > 0) this.scoreNS += score;
            else this.scoreEW += Math.abs(score);
        } else {
            if (score > 0) this.scoreEW += score;
            else this.scoreNS += Math.abs(score);
        }

        this.updateHUD();
        this.logEvent('HAND_SCORED', { result: diff, score, tricks: tricksMade });

        const title = diff >= 0 ? 'CONTRACT MADE' : 'CONTRACT DEFEATED';
        const sub = diff >= 0 ? `Score: +${score} pts` : `Penalty: ${score} pts`;
        this.showOverlay(title, sub, 'NEXT DEAL');

        this.dealer = (this.dealer + 1) % 4;
        this.saveState();
    }

    saveState() {
        localStorage.setItem('bridge_2_ns', this.scoreNS);
        localStorage.setItem('bridge_2_ew', this.scoreEW);
        localStorage.setItem('bridge_2_highScore', Math.max(this.scoreNS, this.highScore));
    }

    // === HUD ===
    updateHUD() {
        document.getElementById('score-ns').innerText = this.scoreNS;
        document.getElementById('score-ew').innerText = this.scoreEW;
        document.getElementById('tricks-display').innerText =
            `${this.trickEngine.nsTricks} / ${this.trickEngine.ewTricks}`;
    }

    // === EVENT HANDLING ===
    initEvents() {
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.state !== 'PLAYING') return;
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            this.handleCanvasClick(px, py);
        });

        this.canvas.addEventListener('pointermove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            this.handleCanvasHover(px, py);
        });

        document.getElementById('auto-pilot-toggle').onclick = () => {
            this.isAuto = !this.isAuto;
            document.getElementById('auto-pilot-toggle').classList.toggle('active', this.isAuto);
            document.getElementById('auto-pilot-status').innerText = this.isAuto ? 'ON' : 'OFF';
            this.logEvent('UI_TOGGLE_AUTO', { active: this.isAuto });
        };

        document.getElementById('hint-btn').onclick = () => {
            this.simulateAdFlow();
        };

        document.getElementById('init-game-btn').onclick = () => {
            this.audio.init();
            this.overlay.classList.remove('active');
            this.startNewHand();
        };
    }

    showOverlay(title, subtitle, btnText) {
        this.overlay.querySelector('h2').innerText = title;
        this.overlay.querySelector('.subtitle').innerText = subtitle;
        this.overlay.querySelector('.overlay-btn').innerText = btnText;
        this.overlay.classList.add('active');

        this.overlay.querySelector('.overlay-btn').onclick = () => {
            this.audio.init();
            this.overlay.classList.remove('active');
            this.startNewHand();
        };
    }

    showHint() {
        if (this.state === 'PLAYING' && this.trickEngine.getCurrentPlayer() === 0) {
            const hand = this.hands[0];
            const card = this.trickEngine.getAICardChoice(hand);
            if (card) {
                const idx = hand.indexOf(card);
                this.selectedCard = idx;
                setTimeout(() => { this.selectedCard = null; }, 2000);
            }
        } else if (this.state === 'BIDDING' && this.biddingEngine.currentBidder === 0) {
            const bid = this.biddingEngine.getAIBid(this.hands[0]);
            if (bid) {
                const display = bid.type === 'PASS' ? 'Pass' : `${bid.level}${bid.suit}`;
                console.log(`%c💡 HINT: Consider bidding ${display}`, 'color: #c9a84c; font-size: 14px;');
            }
        }
    }

    // === CANVAS INTERACTION ===
    getHandLayout(playerIdx) {
        const w = this.canvas.width, h = this.canvas.height;
        const hand = this.hands[playerIdx];
        const count = hand.length;
        const cards = [];

        if (playerIdx === 0) { // South (bottom)
            const totalW = Math.min(count * 34, w * 0.65);
            const startX = (w - totalW) / 2;
            const y = h - this.cardH - 30;
            hand.forEach((c, i) => {
                cards.push({ card: c, x: startX + i * (totalW / count), y, idx: i });
            });
        } else if (playerIdx === 2) { // North (top)
            const totalW = Math.min(count * 30, w * 0.55);
            const startX = (w - totalW) / 2;
            const y = 75;
            hand.forEach((c, i) => {
                cards.push({ card: c, x: startX + i * (totalW / count), y, idx: i });
            });
        } else if (playerIdx === 1) { // West (left)
            const totalH = Math.min(count * 22, h * 0.5);
            const startY = (h - totalH) / 2;
            const x = 20;
            hand.forEach((c, i) => {
                cards.push({ card: c, x, y: startY + i * (totalH / count), idx: i, rotated: true });
            });
        } else { // East (right)
            const totalH = Math.min(count * 22, h * 0.5);
            const startY = (h - totalH) / 2;
            const x = w - this.cardW - 20;
            hand.forEach((c, i) => {
                cards.push({ card: c, x, y: startY + i * (totalH / count), idx: i, rotated: true });
            });
        }

        return cards;
    }

    handleCanvasClick(px, py) {
        const layout = this.getHandLayout(0);
        // Check from last (top of stack) to first
        for (let i = layout.length - 1; i >= 0; i--) {
            const l = layout[i];
            if (px >= l.x && px <= l.x + this.cardW && py >= l.y && py <= l.y + this.cardH) {
                this.onCardClick(0, l.idx);
                return;
            }
        }
    }

    handleCanvasHover(px, py) {
        if (this.state !== 'PLAYING') return;
        const layout = this.getHandLayout(0);
        this.hands[0].forEach(c => c.hover = false);
        for (let i = layout.length - 1; i >= 0; i--) {
            const l = layout[i];
            if (px >= l.x && px <= l.x + this.cardW && py >= l.y && py <= l.y + this.cardH) {
                l.card.hover = true;
                break;
            }
        }
    }

    // === AUTO PLAY ===
    updateAuto() {
        if (!this.isAuto) return;

        this.autoTimer++;
        if (this.autoTimer < 40) return;
        this.autoTimer = 0;

        if (this.state === 'BIDDING' && this.biddingEngine.currentBidder === 0) {
            const bid = this.biddingEngine.getAIBid(this.hands[0]);
            if (bid) this.humanBid(bid);
        } else if (this.state === 'PLAYING' && this.trickEngine.getCurrentPlayer() === 0) {
            const card = this.trickEngine.getAICardChoice(this.hands[0]);
            if (card) {
                const idx = this.hands[0].indexOf(card);
                this.onCardClick(0, idx);
            }
        }
    }

    // === GAME LOOP ===
    update() {
        this.vfx.update();
        this.updateAuto();
        this.frame++;
    }

    // === RENDERING ===
    drawCard(ctx, x, y, card, faceUp, isHover = false, isSelected = false) {
        const w = this.cardW, h = this.cardH, r = this.cardR;

        // Card shadow
        ctx.save();
        ctx.shadowBlur = isHover ? 18 : 6;
        ctx.shadowColor = isHover ? 'rgba(201, 168, 76, 0.35)' : 'rgba(0, 0, 0, 0.3)';
        ctx.shadowOffsetY = isHover ? 6 : 2;

        // Card body
        ctx.fillStyle = faceUp ? '#faf6ef' : '#1a3528';
        ctx.strokeStyle = faceUp ? 'rgba(0,0,0,0.08)' : 'rgba(201, 168, 76, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y - (isHover ? 8 : 0), w, h, r);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        if (faceUp && card) {
            // Rank + Suit
            ctx.font = '700 14px Outfit';
            ctx.fillStyle = card.color;
            ctx.textAlign = 'left';
            ctx.fillText(card.rank, x + 5, y - (isHover ? 8 : 0) + 16);

            ctx.font = '400 12px Outfit';
            ctx.fillText(card.suitSymbol, x + 5, y - (isHover ? 8 : 0) + 30);

            // Center suit (large)
            ctx.font = '400 28px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(card.suitSymbol, x + w / 2, y - (isHover ? 8 : 0) + h / 2 + 8);

            // Selected highlight
            if (isSelected) {
                ctx.strokeStyle = '#c9a84c';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x - 1, y - (isHover ? 9 : 1), w + 2, h + 2, r);
                ctx.stroke();
            }
        } else if (!faceUp) {
            // Card back design
            ctx.strokeStyle = 'rgba(201, 168, 76, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(x + 6, y + 6, w - 12, h - 12, 3);
            ctx.stroke();

            // Diamond pattern
            ctx.fillStyle = 'rgba(201, 168, 76, 0.06)';
            for (let dy = 10; dy < h - 10; dy += 12) {
                for (let dx = 10; dx < w - 10; dx += 12) {
                    ctx.fillRect(x + dx, y + dy, 4, 4);
                }
            }
        }
    }

    drawHand(playerIdx) {
        const layout = this.getHandLayout(playerIdx);
        layout.forEach((l, i) => {
            const isSelected = playerIdx === 0 && i === this.selectedCard;
            this.drawCard(this.ctx, l.x, l.y, l.card, l.card.faceUp, l.card.hover, isSelected);
        });
    }

    drawCurrentTrick() {
        const trick = this.trickEngine.currentTrick;
        if (trick.length === 0) return;

        const cx = this.canvas.width / 2, cy = this.canvas.height / 2;
        const offsets = [
            { x: cx - this.cardW / 2, y: cy + 15 },       // South
            { x: cx - this.cardW - 20, y: cy - this.cardH / 2 }, // West
            { x: cx - this.cardW / 2, y: cy - this.cardH - 15 }, // North
            { x: cx + 20, y: cy - this.cardH / 2 }         // East
        ];

        trick.forEach(entry => {
            const pos = offsets[entry.playerIdx];
            this.drawCard(this.ctx, pos.x, pos.y, entry.card, true);
        });
    }

    drawTrickCounter() {
        if (this.state !== 'PLAYING') return;
        const ctx = this.ctx;
        const cx = this.canvas.width / 2, cy = this.canvas.height / 2;

        ctx.font = '600 10px Outfit';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(201, 168, 76, 0.3)';
        ctx.fillText(`NS: ${this.trickEngine.nsTricks}  EW: ${this.trickEngine.ewTricks}`, cx, cy - 55);
    }

    draw() {
        // Background
        this.ctx.drawImage(this.bgCanvas, 0, 0);

        this.ctx.save();

        // Draw all 4 hands
        for (let i = 0; i < 4; i++) {
            this.drawHand(i);
        }

        this.drawCurrentTrick();
        this.drawTrickCounter();
        this.vfx.draw(this.ctx);

        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
window.addEventListener('load', () => new EliteEngine());
