/**
 * ============================================================
 * 009_REVERSI | 黑白棋 (Othello)
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - BoardMatrix: 8x8 State represented by discrete Enums (-1 White, 1 Black, 0 Empty).
 *  - Outflank Engine: 8-directional ray casting to locate sequence flips.
 *  - Animation Queue: setTimeout sequential delay to create a cascading spatial flip effect.
 *  - AutoPilot (Ada): Heuristic Positional Weight Matrix evaluating best spatial placement.
 * ============================================================
 */
'use strict';

class AudioManager {
    constructor() { this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.on = false; } }
    wake() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        if (t === 'place') {
            o.type = 'sine'; o.frequency.setValueAtTime(600, now); o.frequency.exponentialRampToValueAtTime(800, now+0.05);
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.05);
            o.start(now); o.stop(now+0.05);
        } else if (t === 'flip') {
            o.type = 'triangle'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(200, now+0.1);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'win') {
            o.type = 'square'; [523, 659, 784, 1047].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

const EMPTY = 0;
const BLACK = 1;
const WHITE = -1;

const WEIGHT_MATRIX = [
    [ 100, -20,  10,   5,   5,  10, -20, 100],
    [ -20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [   5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
    [   5,  -2,  -1,  -1,  -1,  -1,  -2,   5],
    [  10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [ -20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 100, -20,  10,   5,   5,  10, -20, 100]
];

const DIRS = [
    [-1,-1], [-1,0], [-1,1],
    [0,-1],          [0,1],
    [1,-1],  [1,0],  [1,1]
];

class EliteEngine {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.overlay = document.getElementById('game-overlay');
        
        this.scoreBEl = document.getElementById('val-b');
        this.scoreWEl = document.getElementById('val-w');
        this.boxB = document.getElementById('score-b');
        this.boxW = document.getElementById('score-w');
        
        this.audio = new AudioManager();
        
        this.board = Array(8).fill(0).map(() => Array(8).fill(EMPTY));
        this.gameActive = false;
        this.autoMode = false;
        this.turn = BLACK; // Black goes first
        this.animating = false;

        this._initDOM();
        this._bindEvents();
    }

    _initDOM() {
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                cell.addEventListener('click', () => this._onCellClick(r, c));
                this.boardEl.appendChild(cell);
            }
        }
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.overlay.classList.remove('active');
        
        this.board = Array(8).fill(0).map(() => Array(8).fill(EMPTY));
        this.board[3][3] = WHITE; this.board[4][4] = WHITE;
        this.board[3][4] = BLACK; this.board[4][3] = BLACK;
        
        this.turn = BLACK;
        this.gameActive = true;
        this.animating = false;
        
        this._renderBoard();
        this._updateHUD();
        
        if (this.autoMode) setTimeout(() => this._runAutoStep(), 500);
    }

    _renderBoard() {
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                cell.innerHTML = ''; // clear markers and discs
                
                if (this.board[r][c] !== EMPTY) {
                    const colorStr = this.board[r][c] === BLACK ? 'black' : 'white';
                    cell.innerHTML = `
                        <div class="disc-wrapper">
                            <div class="disc-inner" data-color="${colorStr}">
                                <div class="disc-face disc-black"></div>
                                <div class="disc-face disc-white"></div>
                            </div>
                        </div>
                    `;
                }
            }
        }
        
        // Draw Valid Moves
        if (!this.animating && this.gameActive && (!this.autoMode || this.turn !== this.getAutoModePlayer())) {
            const validMoves = this._getAllValidMoves(this.turn);
            validMoves.forEach(m => {
                const marker = document.createElement('div');
                marker.className = 'valid-move';
                document.getElementById(`cell-${m.r}-${m.c}`).appendChild(marker);
            });
        }
    }

    getAutoModePlayer() { return null; /* Not binding auto to a specific color, but below logic overrides this */ }

    _getFlips(r, c, playerTurn) {
        if (this.board[r][c] !== EMPTY) return [];
        let flipsToMake = [];
        const opp = playerTurn * -1;
        
        for (let [dr, dc] of DIRS) {
            let tr = r + dr, tc = c + dc;
            let currentLine = [];
            
            while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && this.board[tr][tc] === opp) {
                currentLine.push({r: tr, c: tc});
                tr += dr; tc += dc;
            }
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && this.board[tr][tc] === playerTurn && currentLine.length > 0) {
                flipsToMake.push(...currentLine);
            }
        }
        return flipsToMake;
    }

    _getAllValidMoves(playerTurn) {
        let moves = [];
        for (let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const flips = this._getFlips(r, c, playerTurn);
                if (flips.length > 0) moves.push({r, c, flips});
            }
        }
        return moves;
    }

    _onCellClick(r, c) {
        if (!this.gameActive || this.animating || this.autoMode) return;
        this.audio.wake();
        
        const flips = this._getFlips(r, c, this.turn);
        if (flips.length > 0) this._executeMove(r, c, flips);
    }

    _executeMove(r, c, flips) {
        this.animating = true;
        this.audio.play('place');
        
        this.board[r][c] = this.turn;
        this._renderBoard(); // render immediately clears valid marks and places new disc
        
        const colorStr = this.turn === BLACK ? 'black' : 'white';
        let cascadeDelay = 0;
        
        // Sequentially flip discs
        flips.forEach((f, idx) => {
            setTimeout(() => {
                this.board[f.r][f.c] = this.turn;
                this.audio.play('flip');
                const cell = document.getElementById(`cell-${f.r}-${f.c}`);
                const inner = cell.querySelector('.disc-inner');
                if (inner) inner.setAttribute('data-color', colorStr);
            }, 100 * (idx + 1));
            cascadeDelay = 100 * (idx + 1);
        });

        setTimeout(() => {
            this.animating = false;
            this.turn *= -1; // Switch turn
            this._updateHUD();
            this._checkGameState();
        }, cascadeDelay + 400); // 400ms buffer for final CSS anim to finish
    }

    _checkGameState() {
        const nextMoves = this._getAllValidMoves(this.turn);
        if (nextMoves.length === 0) {
            this.turn *= -1; // pass turn back
            const nextNextMoves = this._getAllValidMoves(this.turn);
            if (nextNextMoves.length === 0) {
                this._endGame();
                return;
            } else {
                this._updateHUD(); // Passed Turn
            }
        }

        this._renderBoard();
        if (this.autoMode && this.gameActive) {
            setTimeout(() => this._runAutoStep(), 500);
        }
    }

    _updateHUD() {
        let bCount = 0, wCount = 0;
        this.board.forEach(row => row.forEach(val => {
            if (val === BLACK) bCount++;
            if (val === WHITE) wCount++;
        }));
        this.scoreBEl.textContent = bCount;
        this.scoreWEl.textContent = wCount;
        
        if (this.turn === BLACK) { this.boxB.classList.add('active'); this.boxW.classList.remove('active'); }
        else { this.boxW.classList.add('active'); this.boxB.classList.remove('active'); }
    }

    _endGame() {
        this.gameActive = false;
        if(this.autoMode) this._toggleAuto();
        this.audio.play('win');

        let bCount = parseInt(this.scoreBEl.textContent);
        let wCount = parseInt(this.scoreWEl.textContent);
        
        setTimeout(() => {
            const h2 = document.getElementById('overlay-title');
            const desc = document.getElementById('overlay-desc');
            
            if(bCount > wCount) {
                h2.textContent = '🎉 黑子勝利';
            } else if (wCount > bCount) {
                h2.textContent = '🎉 白子勝利';
            } else {
                h2.textContent = '🤝 完美和局';
            }
            
            desc.innerHTML = `位置權重評估結束<br>Black: ${bCount} | White: ${wCount}`;
            document.getElementById('init-game-btn').textContent = '重置矩陣';
            this.overlay.classList.add('active');
        }, 800);
    }

    /* === AI AutoPilot === */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if(this.autoMode && this.gameActive && !this.animating) this._runAutoStep();
    }

    _runAutoStep() {
        if(!this.autoMode || !this.gameActive || this.animating) return;
        
        const moves = this._getAllValidMoves(this.turn);
        if (moves.length === 0) return; // handled by post-move loop
        
        // 1-Ply Positional Matrix Evaluator
        moves.forEach(m => {
            // Apply matrix weight to the target cell
            m.weight = WEIGHT_MATRIX[m.r][m.c];
        });

        // Sort by weight descending
        moves.sort((a,b) => b.weight - a.weight);
        
        const bestMove = moves[0];
        this._executeMove(bestMove.r, bestMove.c, bestMove.flips);
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
