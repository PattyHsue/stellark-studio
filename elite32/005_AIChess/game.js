/**
 * ============================================================
 * 005_AICHESS | 西洋棋
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - Virtual Grid: 8x8 Board Array for discrete O(1) lookups.
 *  - Rendering: Pieces are absolutely positioned via CSS transform limits (0% - 87.5%) for fluid UX.
 *  - Pseudo-Legal Engine: High-speed threat generation missing complex King-Safety logic (for O(1) performance). Capture King = Win.
 *  - AI Engine: Minimax algorithm with Alpha-Beta pruning, Depth=3 via setTimeout yielding.
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
        if (t === 'move') {
            o.type = 'sine'; o.frequency.setValueAtTime(500, now); o.frequency.exponentialRampToValueAtTime(100, now+0.1);
            g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.1);
            o.start(now); o.stop(now+0.1);
        } else if (t === 'capture') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(50, now+0.2);
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
            o.start(now); o.stop(now+0.2);
        } else if (t === 'win') {
            o.type = 'triangle'; [523, 659, 784, 1047, 1319].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

// 0: Empty. Positive: White. Negative: Black.
// 10: Pawn, 30: Knight, 31: Bishop, 50: Rook, 90: Queen, 900: King
const PIECES = {
    P: 10, N: 30, B: 31, R: 50, Q: 90, K: 900
};
const CHARS = {
    10: '♙', 30: '♘', 31: '♗', 50: '♖', 90: '♕', 900: '♔',
    '-10': '♟', '-30': '♞', '-31': '♝', '-50': '♜', '-90': '♛', '-900': '♚'
};
const INITIAL_BOARD = [
    [-50, -30, -31, -90, -900, -31, -30, -50],
    [-10, -10, -10, -10, -10, -10, -10, -10],
    [  0,   0,   0,   0,    0,   0,   0,   0],
    [  0,   0,   0,   0,    0,   0,   0,   0],
    [  0,   0,   0,   0,    0,   0,   0,   0],
    [  0,   0,   0,   0,    0,   0,   0,   0],
    [ 10,  10,  10,  10,   10,  10,  10,  10],
    [ 50,  30,  31,  90,  900,  31,  30,  50]
];

class EliteEngine {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.piecesLayer = document.getElementById('pieces-layer');
        this.overlay = document.getElementById('game-overlay');
        this.infoMsg = document.getElementById('turn-display');
        
        this.audio = new AudioManager();
        
        this.gameActive = false;
        this.autoMode = false;
        this.turn = 1; // 1 for White, -1 for Black
        
        this.board = [];
        this.selectedSquare = null;
        this.validMovesCache = []; // list of {r, c, isCapture}
        
        this._initDOM();
        this._bindEvents();
    }

    _initDOM() {
        // Draw 64 squares visually
        this.boardEl.innerHTML = '';
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const sq = document.createElement('div');
                sq.className = `square ${(r+c)%2===0 ? 'light' : 'dark'}`;
                sq.id = `sq-${r}-${c}`;
                sq.addEventListener('click', () => this._onSquareClick(r, c));
                this.boardEl.appendChild(sq);
            }
        }
        this.boardEl.appendChild(this.piecesLayer);
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.overlay.classList.remove('active');
        
        this.gameActive = true;
        this.autoMode = false;
        this.turn = 1;
        this.selectedSquare = null;
        this._clearValidMarks();
        
        this.board = INITIAL_BOARD.map(row => [...row]);
        this._syncDOM();
        this._updateHUD();
    }

    _syncDOM() {
        this.piecesLayer.innerHTML = '';
        for(let r=0; r<8; r++) {
            for(let c=0; c<8; c++) {
                const val = this.board[r][c];
                if (val !== 0) {
                    const el = document.createElement('div');
                    el.className = `piece ${val > 0 ? 'white' : 'black'}`;
                    el.textContent = CHARS[val.toString()];
                    el.id = `p-${r}-${c}`;
                    el.style.transform = `translate(${c * 100}%, ${r * 100}%)`;
                    // Pass click down to the underlying square
                    el.style.pointerEvents = 'none'; 
                    this.piecesLayer.appendChild(el);
                }
            }
        }
    }

    _updatePiecePositionDOM(oldR, oldC, newR, newC) {
        const pEl = document.getElementById(`p-${oldR}-${oldC}`);
        if(pEl) {
            pEl.id = `p-${newR}-${newC}`;
            pEl.style.transform = `translate(${newC * 100}%, ${newR * 100}%)`;
        }
    }

    _removePieceDOM(r, c) {
        const pEl = document.getElementById(`p-${r}-${c}`);
        if(pEl) pEl.classList.add('captured');
    }

    // Logic Generation
    _getValidMoves(boardState, r, c) {
        const val = boardState[r][c];
        if (val === 0) return [];
        const color = Math.sign(val);
        const type = Math.abs(val);
        let moves = [];

        const addMove = (nr, nc) => {
            if(nr<0 || nr>7 || nc<0 || nc>7) return false;
            const target = boardState[nr][nc];
            if (target === 0) { moves.push({r: nr, c: nc, isCapture: false}); return true; }
            if (Math.sign(target) !== color) { moves.push({r: nr, c: nc, isCapture: true}); return false; }
            return false;
        };

        const rayCast = (dirs) => {
            dirs.forEach(([dr, dc]) => {
                let nr=r+dr, nc=c+dc;
                while(addMove(nr, nc) && boardState[nr][nc]===0) { nr+=dr; nc+=dc; }
            });
        };

        if (type === PIECES.P) {
            const dir = color === 1 ? -1 : 1;
            const startRank = color === 1 ? 6 : 1;
            // Forward 1
            if (r+dir>=0 && r+dir<=7 && boardState[r+dir][c] === 0) {
                moves.push({r: r+dir, c: c, isCapture: false});
                // Forward 2
                if (r === startRank && boardState[r+dir*2][c] === 0) {
                    moves.push({r: r+dir*2, c: c, isCapture: false});
                }
            }
            // Capture diag
            if(r+dir>=0 && r+dir<=7) {
                for (let dc of [-1, 1]) {
                    if (c+dc>=0 && c+dc<=7) {
                        const target = boardState[r+dir][c+dc];
                        if (target !== 0 && Math.sign(target) !== color) {
                            moves.push({r: r+dir, c: c+dc, isCapture: true});
                        }
                    }
                }
            }
        }
        else if (type === PIECES.N) {
            const dirs = [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]];
            dirs.forEach(([dr, dc]) => addMove(r+dr, c+dc));
        }
        else if (type === PIECES.B) rayCast([[1,1],[1,-1],[-1,1],[-1,-1]]);
        else if (type === PIECES.R) rayCast([[1,0],[-1,0],[0,1],[0,-1]]);
        else if (type === PIECES.Q) rayCast([[1,1],[1,-1],[-1,1],[-1,-1], [1,0],[-1,0],[0,1],[0,-1]]);
        else if (type === PIECES.K) {
            const dirs = [[1,1],[1,-1],[-1,1],[-1,-1], [1,0],[-1,0],[0,1],[0,-1]];
            dirs.forEach(([dr, dc]) => addMove(r+dr, c+dc));
        }
        return moves;
    }

    _onSquareClick(r, c) {
        if (!this.gameActive || (this.autoMode && this.turn === -this.turn)) return; // Allow Auto to self-play, block human clicks if auto is fast
        this.audio.wake();

        const val = this.board[r][c];

        // Is it a valid move click?
        const move = this.validMovesCache.find(m => m.r === r && m.c === c);
        if (move && this.selectedSquare) {
            this._executeMove(this.selectedSquare.r, this.selectedSquare.c, r, c, move.isCapture);
            return;
        }

        // Is it a piece selection?
        this._clearValidMarks();
        this.selectedSquare = null;

        if (val !== 0 && Math.sign(val) === this.turn) {
            this.selectedSquare = {r, c};
            const pEl = document.getElementById(`p-${r}-${c}`);
            if(pEl) pEl.classList.add('selected');
            
            this.validMovesCache = this._getValidMoves(this.board, r, c);
            this.validMovesCache.forEach(m => {
                const sq = document.getElementById(`sq-${m.r}-${m.c}`);
                if (m.isCapture) sq.classList.add('valid-capture');
                else sq.classList.add('valid-move');
            });
        }
    }

    _clearValidMarks() {
        if(this.selectedSquare) {
            const pEl = document.getElementById(`p-${this.selectedSquare.r}-${this.selectedSquare.c}`);
            if(pEl) pEl.classList.remove('selected');
        }
        document.querySelectorAll('.square').forEach(sq => {
            sq.classList.remove('valid-move', 'valid-capture');
        });
        this.validMovesCache = [];
    }

    _executeMove(fromR, fromC, toR, toC, isCapture) {
        this._clearValidMarks();
        this.selectedSquare = null;

        const pieceVal = this.board[fromR][fromC];
        const targetVal = this.board[toR][toC];
        
        let queenUpgrade = false;
        if(Math.abs(pieceVal) === PIECES.P && (toR === 0 || toR === 7)) queenUpgrade = true;

        if (targetVal !== 0) {
            this._removePieceDOM(toR, toC);
            this.audio.play('capture');
        } else {
            this.audio.play('move');
        }

        // Apply Logic
        this.board[toR][toC] = queenUpgrade ? PIECES.Q * Math.sign(pieceVal) : pieceVal;
        this.board[fromR][fromC] = 0;
        
        // Apply DOM
        this._updatePiecePositionDOM(fromR, fromC, toR, toC);
        if (queenUpgrade) {
            const pEl = document.getElementById(`p-${toR}-${toC}`);
            if(pEl) pEl.textContent = CHARS[(PIECES.Q * Math.sign(pieceVal)).toString()];
        }

        // Win Condition Simplified: Capture King
        if (Math.abs(targetVal) === PIECES.K) {
            this._endGame(this.turn);
            return;
        }

        this.turn *= -1;
        this._updateHUD();

        if (this.autoMode && this.gameActive) {
            setTimeout(() => this._runAutoStep(), 300); // 300ms delay for aesthetics
        }
    }

    _updateHUD() {
        this.infoMsg.className = `turn-indicator ${this.turn === 1 ? 'white-turn' : 'black-turn'}`;
        this.infoMsg.textContent = this.turn === 1 ? '♙ 蒼穹 (WHITE) 回合' : '♟ 霓夢 (BLACK) 回合';
    }

    _endGame(winner) {
        this.gameActive = false;
        if(this.autoMode) this._toggleAuto();
        this.audio.play('win');

        setTimeout(() => {
            const h2 = document.getElementById('overlay-title');
            h2.className = winner === 1 ? 'win-text' : 'lose-text';
            h2.textContent = winner === 1 ? '🎉 白棋勝利' : '💀 黑棋勝利';
            document.getElementById('overlay-desc').innerHTML = `敵方主帥已遭挾持<br>演算終結`;
            document.getElementById('init-game-btn').textContent = '重置矩陣';
            this.overlay.classList.add('active');
        }, 1200);
    }

    /* === AI Minimax with Alpha Beta Pruning === */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if(this.autoMode && this.gameActive) {
            setTimeout(() => this._runAutoStep(), 500);
        }
    }

    _evaluateBoard(boardState) {
        let score = 0;
        for(let r=0; r<8; r++){
            for(let c=0; c<8; c++){
                score += boardState[r][c]; // Direct sum, White is positive, Black is negative
            }
        }
        // Small bias to randomness avoids repetitive oscillating moves
        return score + (Math.random() - 0.5) * 5; 
    }

    _generateAllMoves(boardState, color) {
        let allMoves = [];
        for(let r=0; r<8; r++){
            for(let c=0; c<8; c++){
                if(boardState[r][c] !== 0 && Math.sign(boardState[r][c]) === color) {
                    const moves = this._getValidMoves(boardState, r, c);
                    moves.forEach(m => allMoves.push({fromR: r, fromC: c, toR: m.r, toC: m.c, isCapture: m.isCapture}));
                }
            }
        }
        // Heuristic: Check captures first for better alpha-beta pruning
        return allMoves.sort((a,b) => (b.isCapture?1:0) - (a.isCapture?1:0));
    }

    _minimax(boardState, depth, alpha, beta, isMaximizing) {
        // Did anyone win? (Simplified: check if King is missing)
        let whiteK=false, blackK=false;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            if(boardState[r][c] === PIECES.K) whiteK = true;
            if(boardState[r][c] === -PIECES.K) blackK = true;
        }
        if(!whiteK) return -99999;
        if(!blackK) return 99999;
        
        if (depth === 0) return this._evaluateBoard(boardState);

        const color = isMaximizing ? 1 : -1;
        const moves = this._generateAllMoves(boardState, color);
        
        if (moves.length === 0) return this._evaluateBoard(boardState);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let m of moves) {
                // Apply move to cloned board
                let simBoard = boardState.map(row => [...row]);
                simBoard[m.toR][m.toC] = simBoard[m.fromR][m.fromC];
                simBoard[m.fromR][m.fromC] = 0;
                
                let ev = this._minimax(simBoard, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, ev);
                alpha = Math.max(alpha, ev);
                if (beta <= alpha) break; // Prune
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let m of moves) {
                let simBoard = boardState.map(row => [...row]);
                simBoard[m.toR][m.toC] = simBoard[m.fromR][m.fromC];
                simBoard[m.fromR][m.fromC] = 0;
                
                let ev = this._minimax(simBoard, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, ev);
                beta = Math.min(beta, ev);
                if (beta <= alpha) break; // Prune
            }
            return minEval;
        }
    }

    _runAutoStep() {
        if(!this.autoMode || !this.gameActive) return;

        setTimeout(() => { // Free UI thread explicitly
            const isMaximizing = this.turn === 1;
            const moves = this._generateAllMoves(this.board, this.turn);
            
            if(moves.length === 0) return; // Stalemate?

            let bestScore = isMaximizing ? -Infinity : Infinity;
            let bestMove = moves[0];

            for (let m of moves) {
                let simBoard = this.board.map(row => [...row]);
                simBoard[m.toR][m.toC] = simBoard[m.fromR][m.fromC];
                simBoard[m.fromR][m.fromC] = 0;
                
                // Depth 3 is highly responsive for JS on modern devices.
                const score = this._minimax(simBoard, 3, -Infinity, Infinity, !isMaximizing);
                
                if (isMaximizing) {
                    if (score > bestScore) { bestScore = score; bestMove = m; }
                } else {
                    if (score < bestScore) { bestScore = score; bestMove = m; }
                }
            }

            // Highlight chosen piece
            const pEl = document.getElementById(`p-${bestMove.fromR}-${bestMove.fromC}`);
            if(pEl) pEl.classList.add('selected');

            setTimeout(() => {
                if(!this.gameActive) return;
                this._executeMove(bestMove.fromR, bestMove.fromC, bestMove.toR, bestMove.toC, bestMove.isCapture);
            }, 300);
        }, 50); // Small yielding gap
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
