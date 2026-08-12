/**
 * ============================================================
 * 008_WORDLE | 字彙英雄
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier & Ada):
 *  - Trie Engine (Ada): O(L) dictionary insertions and prefix validations.
 *  - Evaluation Logic: Multi-pass marking (Correct -> Present -> Absent) to handle duplicate characters accurately.
 *  - AutoPilot Simulator (Arthur): Reduces entropy via heuristic constraint filtering ("CRANE" -> filter -> guess).
 * ============================================================
 */
'use strict';

class TrieNode {
    constructor() {
        this.children = {};
        this.isWord = false;
    }
}
class Trie {
    constructor() { this.root = new TrieNode(); }
    insert(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) node.children[char] = new TrieNode();
            node = node.children[char];
        }
        node.isWord = true;
    }
    search(word) {
        let node = this.root;
        for (let char of word) {
            if (!node.children[char]) return false;
            node = node.children[char];
        }
        return node.isWord;
    }
}

class AudioManager {
    constructor() { this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ this.on = false; } }
    wake() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        if (t === 'tap') {
            o.type = 'sine'; o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(800, now+0.05);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.05);
            o.start(now); o.stop(now+0.05);
        } else if (t === 'error') {
            o.type = 'sawtooth'; o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(100, now+0.2);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
            o.start(now); o.stop(now+0.2);
        } else if (t === 'reveal') {
            o.type = 'triangle'; o.frequency.setValueAtTime(800, now); o.frequency.linearRampToValueAtTime(1200, now+0.2);
            g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now+0.2);
            o.start(now); o.stop(now+0.2);
        } else if (t === 'win') {
            o.type = 'sine'; [523, 659, 784, 1047, 1319].forEach((f, i) => o.frequency.setValueAtTime(f, now+i*0.1));
            g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now+1.0);
            o.start(now); o.stop(now+1.0);
        }
    }
}

class EliteEngine {
    constructor() {
        this.boardEl = document.getElementById('board');
        this.overlay = document.getElementById('game-overlay');
        this.toastCon = document.getElementById('toast-container');
        
        this.audio = new AudioManager();
        this.trie = new Trie();
        
        // Curated Zero-Dependency Dictionary for Demo purposes
        this.dictionary = ['CRANE', 'AUDIO', 'SMART', 'GHOST', 'PLANT', 'QUICK', 'BROWN', 'FOXES', 'JUMPS', 'WORLD', 'LOGIC', 'PIXEL', 'ALONE', 'REACT', 'FRAME', 'SCORE', 'SWEAT', 'TRAIN', 'VITAL', 'WASTE', 'XENON', 'YACHT', 'ZEBRA'];
        this.dictionary.forEach(w => this.trie.insert(w));

        this.wordLength = 5;
        this.maxGuesses = 6;
        
        this.targetWord = '';
        this.guesses = []; // array of strings
        this.currentGuess = '';
        
        this.gameActive = false;
        this.autoMode = false;
        
        this._bindEvents();
    }

    _bindEvents() {
        document.getElementById('init-game-btn').addEventListener('click', () => this._startGame());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        
        // Physical Keyboard
        document.addEventListener('keydown', e => {
            if (!this.gameActive || this.autoMode) return;
            if (e.key === 'Enter') this._submitGuess();
            else if (e.key === 'Backspace') this._deleteLetter();
            else if (/^[a-zA-Z]$/.test(e.key)) this._addLetter(e.key.toUpperCase());
        });

        // Virtual Keyboard
        document.querySelectorAll('.key').forEach(k => {
            k.addEventListener('click', () => {
                if (!this.gameActive || this.autoMode) return;
                this.audio.wake();
                const key = k.dataset.key;
                if (key === 'Enter') this._submitGuess();
                else if (key === 'Backspace') this._deleteLetter();
                else this._addLetter(key);
            });
        });
    }

    _startGame() {
        this.audio.init(); this.audio.wake();
        this.gameActive = true;
        this.overlay.classList.remove('active');
        
        this.targetWord = this.dictionary[Math.floor(Math.random() * this.dictionary.length)];
        this.guesses = [];
        this.currentGuess = '';
        
        // Reset Board UI
        this.boardEl.innerHTML = '';
        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'board-row';
            row.id = `row-${i}`;
            for (let j = 0; j < this.wordLength; j++) {
                const t = document.createElement('div');
                t.className = 'tile';
                t.innerHTML = `<div class="tile-face tile-front"></div><div class="tile-face tile-back"></div>`;
                row.appendChild(t);
            }
            this.boardEl.appendChild(row);
        }

        // Reset Keys UI
        document.querySelectorAll('.key').forEach(k => k.removeAttribute('data-state'));
    }

    _updateRowUI() {
        const row = document.getElementById(`row-${this.guesses.length}`);
        if (!row) return;
        const tiles = row.querySelectorAll('.tile');
        for (let i = 0; i < this.wordLength; i++) {
            const letter = this.currentGuess[i] || '';
            const tFront = tiles[i].querySelector('.tile-front');
            const tBack = tiles[i].querySelector('.tile-back');
            const oldLetter = tFront.textContent;
            
            tFront.textContent = letter;
            tBack.textContent = letter;
            
            if (letter) {
                tiles[i].setAttribute('data-state', 'active');
                if(!oldLetter) this.audio.play('tap'); // only play sound if a new letter was added
            } else {
                tiles[i].removeAttribute('data-state');
            }
        }
    }

    _addLetter(letter) {
        if (this.currentGuess.length < this.wordLength) {
            this.currentGuess += letter;
            this._updateRowUI();
        }
    }

    _deleteLetter() {
        if (this.currentGuess.length > 0) {
            this.currentGuess = this.currentGuess.slice(0, -1);
            this._updateRowUI();
        }
    }

    _showToast(msg) {
        this.audio.play('error');
        const t = document.createElement('div');
        t.className = 'toast'; t.textContent = msg;
        this.toastCon.appendChild(t);
        setTimeout(() => t.classList.add('show'), 10);
        setTimeout(() => {
            t.classList.remove('show');
            setTimeout(() => t.remove(), 300);
        }, 1500);
    }

    _submitGuess() {
        if (this.currentGuess.length !== this.wordLength) {
            this._showToast('長度不足');
            this._shakeRow();
            return;
        }
        if (!this.trie.search(this.currentGuess)) {
            this._showToast('不在詞彙庫中');
            this._shakeRow();
            return;
        }

        const guess = this.currentGuess;
        this.guesses.push(guess);
        this.currentGuess = '';
        
        this._evaluateGuessAndAnimate(guess, this.guesses.length - 1);
    }

    _shakeRow() {
        const row = document.getElementById(`row-${this.guesses.length}`);
        row.classList.remove('shake');
        void row.offsetWidth; // trigger reflow
        row.classList.add('shake');
    }

    _evaluateGuessAndAnimate(guess, rowIndex) {
        this.gameActive = false; // block input during animation
        
        const row = document.getElementById(`row-${rowIndex}`);
        const tiles = row.querySelectorAll('.tile');
        
        let tArray = this.targetWord.split('');
        let gArray = guess.split('');
        let res = Array(this.wordLength).fill('absent');

        // Pass 1: Correct (Green)
        for (let i = 0; i < this.wordLength; i++) {
            if (gArray[i] === tArray[i]) {
                res[i] = 'correct';
                tArray[i] = null; // consume target letter
                gArray[i] = null; // consume guess letter
            }
        }
        // Pass 2: Present (Yellow)
        for (let i = 0; i < this.wordLength; i++) {
            if (gArray[i] && tArray.includes(gArray[i])) {
                res[i] = 'present';
                tArray[tArray.indexOf(gArray[i])] = null;
            }
        }

        // Animate
        tiles.forEach((t, i) => {
            setTimeout(() => {
                t.setAttribute('data-state', res[i]);
                this._updateKeycolor(guess[i], res[i]);
                this.audio.play('reveal');
                
                if (i === this.wordLength - 1) {
                    // Animation complete sequence
                    setTimeout(() => this._postSubmitCheck(guess), 300);
                }
            }, i * 250);
        });
    }

    _updateKeycolor(letter, state) {
        const k = document.querySelector(`.key[data-key="${letter}"]`);
        if (!k) return;
        const cur = k.getAttribute('data-state');
        if (cur === 'correct') return; // never downgrade green
        if (cur === 'present' && state === 'absent') return; // never downgrade yellow
        k.setAttribute('data-state', state);
    }

    _postSubmitCheck(guess) {
        if (guess === this.targetWord) {
            this._endGame(true);
        } else if (this.guesses.length >= this.maxGuesses) {
            this._endGame(false);
        } else {
            this.gameActive = true;
            if(this.autoMode) setTimeout(() => this._runAutoStep(), 500);
        }
    }

    _endGame(win) {
        this.gameActive = false;
        if(this.autoMode) this._toggleAuto();
        this.audio.play(win ? 'win' : 'error');
        
        setTimeout(() => {
            const h2 = document.getElementById('overlay-title');
            const sec = document.getElementById('overlay-secret');
            document.getElementById('overlay-desc').textContent = '字典樹與色彩回饋機制';
            
            h2.className = win ? 'win-text' : 'lose-text';
            h2.textContent = win ? '🎉 解析成功' : '💀 解析失敗';
            sec.style.display = 'block';
            sec.textContent = this.targetWord;
            
            document.getElementById('init-game-btn').textContent = '重置詞庫';
            this.overlay.classList.add('active');
        }, 1500);
    }

    /* === AI AutoPilot === */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        const s = document.getElementById('auto-pilot-status');
        const t = document.getElementById('auto-pilot-toggle');
        s.textContent = this.autoMode ? 'ON' : 'OFF';
        t.classList.toggle('active', this.autoMode);

        if(this.autoMode && this.gameActive && this.currentGuess === '') this._runAutoStep();
    }

    _runAutoStep() {
        if(!this.autoMode || !this.gameActive) return;

        let nextWord = '';
        if (this.guesses.length === 0) {
            nextWord = 'CRANE'; // Hardcoded entropy-optimal first guess
            if(!this.dictionary.includes(nextWord)) nextWord = this.dictionary[0];
        } else {
            // Heuristic evaluation filter
            const possible = this.dictionary.filter(word => this._isValidConstraint(word));
            if(possible.length > 0) nextWord = possible[0];
            else nextWord = this.dictionary[Math.floor(Math.random()*this.dictionary.length)]; // Fallback
        }

        // Simulate typing
        let typeIdx = 0;
        const typeInterval = setInterval(() => {
            if(!this.autoMode || !this.gameActive) { clearInterval(typeInterval); return; }
            this._addLetter(nextWord[typeIdx]);
            this.audio.play('tap');
            typeIdx++;
            if (typeIdx >= this.wordLength) {
                clearInterval(typeInterval);
                setTimeout(() => { if(this.autoMode) this._submitGuess(); }, 300);
            }
        }, 150);
    }

    _isValidConstraint(word) {
        // Evaluate if 'word' would produce the exact same color pattern as what we've received historically
        for (let r = 0; r < this.guesses.length; r++) {
            const guess = this.guesses[r];
            const resultTiles = document.getElementById(`row-${r}`).querySelectorAll('.tile');
            
            let tArray = word.split('');
            let gArray = guess.split('');
            let res = Array(this.wordLength).fill('absent');
            
            // Re-simulate evaluation
            for(let i=0; i<this.wordLength; i++) {
                if(gArray[i] === tArray[i]) {
                    res[i] = 'correct'; tArray[i] = null; gArray[i] = null;
                }
            }
            for(let i=0; i<this.wordLength; i++) {
                if(gArray[i] && tArray.includes(gArray[i])) {
                    res[i] = 'present'; tArray[tArray.indexOf(gArray[i])] = null;
                }
            }
            
            // Compare simulation against actuality
            for(let i=0; i<this.wordLength; i++) {
                if (res[i] !== resultTiles[i].getAttribute('data-state')) return false;
            }
        }
        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
