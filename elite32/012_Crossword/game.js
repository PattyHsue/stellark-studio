/**
 * ============================================================
 * 012_CROSSWORD | 填字魔方
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 * 
 * Architecture (Xavier): Clean SOLID design
 *   - PuzzleGenerator: procedural crossword layout
 *   - GridRenderer: DOM-based grid with cell interaction
 *   - ClueManager: clue display & highlighting
 *   - InputController: keyboard + virtual keyboard
 *   - AutoPilot: sequential auto-solve demo
 *   - AudioManager: procedural Web Audio SFX
 *   - VFXEngine: particle celebrations
 *   - AdManager: monetization loop for hints
 *
 * Complexity (Ada): 
 *   Grid placement: O(W * G) where W=words, G=grid cells
 *   Validation: O(1) per cell check
 * ============================================================
 */

'use strict';

/* ============================================================
 * Section 1: PUZZLE DATA — Chinese Word Bank
 * ============================================================ */
const PUZZLE_BANK = [
    {
        id: 1, gridSize: 10, title: '基礎詞彙',
        words: [
            { word: '學習', clue: '獲取知識的過程', dir: 'across' },
            { word: '科學', clue: '研究自然現象的學科', dir: 'across' },
            { word: '音樂', clue: '由旋律與節奏組成的藝術', dir: 'across' },
            { word: '數學', clue: '研究數量與形狀的學科', dir: 'across' },
            { word: '地球', clue: '我們居住的行星', dir: 'across' },
            { word: '太陽', clue: '太陽系的中心恆星', dir: 'down' },
            { word: '月亮', clue: '地球唯一的天然衛星', dir: 'down' },
            { word: '老師', clue: '傳授知識的人', dir: 'down' },
            { word: '朋友', clue: '相互信任的夥伴', dir: 'down' },
            { word: '電腦', clue: '用來處理資訊的電子設備', dir: 'down' },
            { word: '天空', clue: '抬頭可以看到的廣闊空間', dir: 'across' },
            { word: '海洋', clue: '地球上最大的水體', dir: 'down' },
        ]
    },
    {
        id: 2, gridSize: 10, title: '自然與科技',
        words: [
            { word: '森林', clue: '大量樹木聚集的地方', dir: 'across' },
            { word: '河流', clue: '自然流動的水道', dir: 'across' },
            { word: '火山', clue: '會噴發岩漿的地形', dir: 'across' },
            { word: '閃電', clue: '雷雨中的強烈放電現象', dir: 'across' },
            { word: '恐龍', clue: '已滅絕的巨大爬行動物', dir: 'across' },
            { word: '機器', clue: '自動化運作的裝置', dir: 'down' },
            { word: '衛星', clue: '繞行星運轉的天體', dir: 'down' },
            { word: '網路', clue: '連接全球電腦的系統', dir: 'down' },
            { word: '能量', clue: '做功的能力', dir: 'down' },
            { word: '冰川', clue: '由積雪壓實形成的巨大冰體', dir: 'down' },
            { word: '雷達', clue: '利用電波測距的裝置', dir: 'across' },
            { word: '宇宙', clue: '包含一切天體的無垠空間', dir: 'down' },
        ]
    },
    {
        id: 3, gridSize: 10, title: '文學與歷史',
        words: [
            { word: '唐詩', clue: '唐朝的詩歌藝術', dir: 'across' },
            { word: '故事', clue: '有情節的敘述', dir: 'across' },
            { word: '英雄', clue: '勇敢無畏的人物', dir: 'across' },
            { word: '智慧', clue: '深刻的理解與判斷力', dir: 'across' },
            { word: '寶藏', clue: '珍貴的收藏品', dir: 'across' },
            { word: '城堡', clue: '中世紀的防禦建築', dir: 'down' },
            { word: '發明', clue: '創造新事物的行為', dir: 'down' },
            { word: '戰爭', clue: '國家間的武力衝突', dir: 'down' },
            { word: '探險', clue: '前往未知地域的冒險', dir: 'down' },
            { word: '文字', clue: '記錄語言的符號系統', dir: 'down' },
            { word: '傳說', clue: '口耳相傳的古老故事', dir: 'across' },
            { word: '帝國', clue: '由皇帝統治的龐大國家', dir: 'down' },
        ]
    }
];

/* ============================================================
 * Section 2: PUZZLE GENERATOR
 * ============================================================ */
class PuzzleGenerator {
    constructor(puzzleData) {
        this.data = puzzleData;
        this.size = puzzleData.gridSize;
        this.grid = [];
        this.placedWords = [];
        this.numbers = [];
    }

    generate() {
        // Initialize empty grid
        this.grid = Array.from({ length: this.size }, () =>
            Array.from({ length: this.size }, () => ({ char: null, isBlack: true, number: 0, acrossIdx: -1, downIdx: -1 }))
        );
        this.placedWords = [];
        this.numbers = [];

        const words = [...this.data.words];
        // Sort by length desc for better placement
        words.sort((a, b) => b.word.length - a.word.length);

        // Place first word in center
        const first = words[0];
        const startRow = Math.floor(this.size / 2);
        const startCol = Math.floor((this.size - first.word.length) / 2);
        this._placeWord(first, startRow, startCol, first.dir === 'across' ? 'across' : 'across');
        words.splice(0, 1);

        // Try to place remaining words with intersections
        let attempts = 0;
        const maxAttempts = 500;
        let wordsToPlace = [...words];

        while (wordsToPlace.length > 0 && attempts < maxAttempts) {
            attempts++;
            let placed = false;

            for (let i = 0; i < wordsToPlace.length; i++) {
                const w = wordsToPlace[i];
                const result = this._findBestPosition(w);
                if (result) {
                    this._placeWord(w, result.row, result.col, result.dir);
                    wordsToPlace.splice(i, 1);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                // Try random placement for remaining
                const w = wordsToPlace[0];
                const result = this._findRandomPosition(w);
                if (result) {
                    this._placeWord(w, result.row, result.col, result.dir);
                    wordsToPlace.splice(0, 1);
                } else {
                    wordsToPlace.splice(0, 1); // Skip if can't place
                }
            }
        }

        this._assignNumbers();
        return { grid: this.grid, placedWords: this.placedWords, size: this.size };
    }

    _placeWord(wordData, row, col, dir) {
        const chars = wordData.word.split('');
        const positions = [];

        for (let i = 0; i < chars.length; i++) {
            const r = dir === 'across' ? row : row + i;
            const c = dir === 'across' ? col + i : col;
            this.grid[r][c].char = chars[i];
            this.grid[r][c].isBlack = false;
            positions.push({ r, c });
        }

        this.placedWords.push({
            word: wordData.word,
            clue: wordData.clue,
            dir,
            row, col,
            positions,
            solved: false
        });
    }

    _findBestPosition(wordData) {
        const chars = wordData.word.split('');
        const candidates = [];

        for (const placed of this.placedWords) {
            for (let pi = 0; pi < placed.word.length; pi++) {
                for (let wi = 0; wi < chars.length; wi++) {
                    if (placed.word[pi] === chars[wi]) {
                        // Found intersection
                        const pr = placed.positions[pi].r;
                        const pc = placed.positions[pi].c;
                        const newDir = placed.dir === 'across' ? 'down' : 'across';

                        let startR, startC;
                        if (newDir === 'across') {
                            startR = pr;
                            startC = pc - wi;
                        } else {
                            startR = pr - wi;
                            startC = pc;
                        }

                        if (this._canPlace(chars, startR, startC, newDir, { r: pr, c: pc })) {
                            candidates.push({ row: startR, col: startC, dir: newDir, intersections: 1 });
                        }
                    }
                }
            }
        }

        if (candidates.length === 0) return null;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    _findRandomPosition(wordData) {
        const chars = wordData.word.split('');
        const dirs = ['across', 'down'];

        for (let attempt = 0; attempt < 100; attempt++) {
            const dir = dirs[Math.floor(Math.random() * 2)];
            const maxR = dir === 'across' ? this.size : this.size - chars.length;
            const maxC = dir === 'across' ? this.size - chars.length : this.size;
            const row = Math.floor(Math.random() * maxR);
            const col = Math.floor(Math.random() * maxC);

            if (this._canPlace(chars, row, col, dir)) {
                return { row, col, dir };
            }
        }
        return null;
    }

    _canPlace(chars, startR, startC, dir, intersectCell = null) {
        for (let i = 0; i < chars.length; i++) {
            const r = dir === 'across' ? startR : startR + i;
            const c = dir === 'across' ? startC + i : startC;

            if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;

            const cell = this.grid[r][c];
            const isIntersect = intersectCell && r === intersectCell.r && c === intersectCell.c;

            if (cell.char !== null) {
                if (cell.char !== chars[i]) return false;
                if (!isIntersect) {
                    // Check if same direction already exists
                    if (dir === 'across' && cell.acrossIdx >= 0) return false;
                    if (dir === 'down' && cell.downIdx >= 0) return false;
                }
            } else {
                // Check adjacent cells for conflicts
                if (dir === 'across') {
                    if (r > 0 && this.grid[r - 1][c].char && !this.grid[r - 1][c].isBlack) {
                        // Adjacent non-black cell above — check if part of intersection
                        if (!isIntersect) {
                            const above = this.grid[r - 1][c];
                            if (above.downIdx >= 0) continue; // might be ok
                        }
                    }
                }
            }
        }

        // Check cell before and after word
        const beforeR = dir === 'across' ? startR : startR - 1;
        const beforeC = dir === 'across' ? startC - 1 : startC;
        if (beforeR >= 0 && beforeC >= 0 && beforeR < this.size && beforeC < this.size) {
            if (this.grid[beforeR][beforeC].char !== null) return false;
        }

        const afterR = dir === 'across' ? startR : startR + chars.length;
        const afterC = dir === 'across' ? startC + chars.length : startC;
        if (afterR >= 0 && afterC >= 0 && afterR < this.size && afterC < this.size) {
            if (this.grid[afterR][afterC].char !== null) return false;
        }

        return true;
    }

    _assignNumbers() {
        let num = 1;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = this.grid[r][c];
                if (cell.isBlack) continue;

                let needsNumber = false;
                // Check if start of across word
                for (let i = 0; i < this.placedWords.length; i++) {
                    const pw = this.placedWords[i];
                    if (pw.row === r && pw.col === c) {
                        needsNumber = true;
                        pw.number = num;
                        if (pw.dir === 'across') cell.acrossIdx = i;
                        else cell.downIdx = i;
                    }
                }

                // Also set acrossIdx/downIdx for non-start cells
                for (let i = 0; i < this.placedWords.length; i++) {
                    const pw = this.placedWords[i];
                    for (const pos of pw.positions) {
                        if (pos.r === r && pos.c === c) {
                            if (pw.dir === 'across') cell.acrossIdx = i;
                            else cell.downIdx = i;
                        }
                    }
                }

                if (needsNumber) {
                    cell.number = num;
                    num++;
                }
            }
        }
    }
}

/* ============================================================
 * Section 3: AUDIO MANAGER
 * ============================================================ */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { this.enabled = false; }
    }

    wake() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(type) {
        if (!this.enabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);

            switch (type) {
                case 'type':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now); osc.stop(now + 0.08);
                    break;
                case 'correct':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(523, now);
                    osc.frequency.setValueAtTime(659, now + 0.1);
                    osc.frequency.setValueAtTime(784, now + 0.2);
                    gain.gain.setValueAtTime(0.12, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    osc.start(now); osc.stop(now + 0.35);
                    break;
                case 'wordComplete':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(523, now);
                    osc.frequency.setValueAtTime(659, now + 0.08);
                    osc.frequency.setValueAtTime(784, now + 0.16);
                    osc.frequency.setValueAtTime(1047, now + 0.24);
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now); osc.stop(now + 0.5);
                    break;
                case 'wrong':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.setValueAtTime(150, now + 0.1);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.start(now); osc.stop(now + 0.15);
                    break;
                case 'hint':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now); osc.stop(now + 0.3);
                    break;
                case 'levelUp':
                    osc.type = 'sine';
                    [523, 659, 784, 1047, 1319].forEach((f, i) => {
                        osc.frequency.setValueAtTime(f, now + i * 0.1);
                    });
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                    osc.start(now); osc.stop(now + 0.8);
                    break;
            }
        } catch (e) { /* silent fail */ }
    }
}

/* ============================================================
 * Section 4: VFX ENGINE (Particles)
 * ============================================================ */
class VFXEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.running = false;
        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    emit(x, y, count = 20, color = '#e8a855') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                life: 1,
                decay: 0.015 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color,
                char: '✦✧◆◇★☆'.charAt(Math.floor(Math.random() * 6))
            });
        }
        if (!this.running) this._loop();
    }

    emitFireworks(x, y) {
        const colors = ['#e8a855', '#6b8c5a', '#4a7a9b', '#c0864a', '#f0c060'];
        colors.forEach(c => this.emit(x, y, 8, c));
    }

    _loop() {
        this.running = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.08;
            p.life -= p.decay;

            if (p.life <= 0) return false;

            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.font = `${p.size}px serif`;
            this.ctx.fillText(p.char, p.x, p.y);
            return true;
        });

        this.ctx.globalAlpha = 1;

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this._loop());
        } else {
            this.running = false;
        }
    }
}

/* ============================================================
 * Section 5: AD MANAGER (Monetization Loop)
 * ============================================================ */
class AdManager {
    constructor() {
        this.overlay = document.getElementById('ad-overlay');
        this.timerEl = document.getElementById('ad-timer');
        this.callback = null;
    }

    show(reward) {
        return new Promise(resolve => {
            this.overlay.classList.add('active');
            let sec = 5;
            this.timerEl.textContent = `${sec} 秒後關閉`;
            const iv = setInterval(() => {
                sec--;
                this.timerEl.textContent = sec > 0 ? `${sec} 秒後關閉` : '✓ 感謝觀看！';
                if (sec <= 0) {
                    clearInterval(iv);
                    setTimeout(() => {
                        this.overlay.classList.remove('active');
                        resolve(reward);
                    }, 600);
                }
            }, 1000);
        });
    }
}

/* ============================================================
 * Section 6: ELITE ENGINE (Main Controller)
 * ============================================================ */
class EliteEngine {
    constructor() {
        // DOM refs
        this.gridEl = document.getElementById('crossword-grid');
        this.acrossCluesEl = document.getElementById('across-clues');
        this.downCluesEl = document.getElementById('down-clues');
        this.kbPanel = document.getElementById('keyboard-panel');
        this.scoreEl = document.getElementById('score-val');
        this.accuracyEl = document.getElementById('accuracy-val');
        this.levelEl = document.getElementById('level-display');
        this.timerEl = document.getElementById('timer-display');
        this.hintCountEl = document.getElementById('hint-count');
        this.autoStatusEl = document.getElementById('auto-pilot-status');
        this.overlayEl = document.getElementById('game-overlay');
        this.overlayBtn = document.getElementById('init-game-btn');
        this.overlayHeading = this.overlayEl.querySelector('h2');
        this.overlayDesc = this.overlayEl.querySelector('.subtitle');

        // Subsystems
        this.audio = new AudioManager();
        this.vfx = new VFXEngine(document.getElementById('vfx-canvas'));
        this.adManager = new AdManager();

        // Game state
        this.puzzle = null;
        this.userGrid = [];
        this.activeCell = null;
        this.activeDir = 'across';
        this.activeWordIdx = -1;
        this.score = 0;
        this.level = 0;
        this.hints = 3;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.timerValue = 300;
        this.timerInterval = null;
        this.autoMode = false;
        this.autoInterval = null;
        this.gameActive = false;

        // Persistence
        this.highScore = parseInt(localStorage.getItem('crossword_highScore') || '0');

        this._bindEvents();
        this._buildKeyboard();
    }

    /* --- Event Binding --- */
    _bindEvents() {
        this.overlayBtn.addEventListener('click', () => this._startGame());

        document.getElementById('hint-btn').addEventListener('click', () => this._useHint());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());

        // Physical keyboard
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));

        // Wake audio on first interaction
        document.addEventListener('pointerdown', () => this.audio.wake(), { once: true });
    }

    /* --- Build Virtual Keyboard --- */
    _buildKeyboard() {
        // Common Chinese characters for crossword input
        const keys = [
            '學', '習', '科', '老', '師', '朋', '友', '電', '腦', '太',
            '陽', '月', '亮', '天', '空', '海', '洋', '地', '球', '音',
            '樂', '數', '森', '林', '河', '流', '火', '山', '閃', '雷',
            '恐', '龍', '機', '器', '衛', '星', '網', '路', '能', '量',
            '冰', '川', '達', '宇', '宙', '唐', '詩', '故', '事', '英',
            '雄', '智', '慧', '寶', '藏', '城', '堡', '發', '明', '戰',
            '爭', '探', '險', '文', '字', '傳', '說', '帝', '國', '人',
        ];

        this.kbPanel.innerHTML = '';
        keys.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = ch;
            btn.addEventListener('click', () => this._inputChar(ch));
            this.kbPanel.appendChild(btn);
        });

        // Action keys
        const delBtn = document.createElement('button');
        delBtn.className = 'key-btn key-action';
        delBtn.textContent = '⌫ 刪除';
        delBtn.addEventListener('click', () => this._deleteChar());
        this.kbPanel.appendChild(delBtn);

        const switchBtn = document.createElement('button');
        switchBtn.className = 'key-btn key-action';
        switchBtn.textContent = '⇄ 切換方向';
        switchBtn.addEventListener('click', () => this._switchDirection());
        this.kbPanel.appendChild(switchBtn);
    }

    /* --- Start Game --- */
    _startGame() {
        this.audio.init();
        this.audio.wake();
        this.level++;
        this.hints = 3;
        this.timerValue = 300;
        this.totalAttempts = 0;
        this.correctAttempts = 0;
        this.activeCell = null;
        this.activeWordIdx = -1;
        this.gameActive = true;

        const puzzleIdx = (this.level - 1) % PUZZLE_BANK.length;
        const gen = new PuzzleGenerator(PUZZLE_BANK[puzzleIdx]);
        this.puzzle = gen.generate();

        // Init user grid (empty)
        this.userGrid = Array.from({ length: this.puzzle.size }, () =>
            Array.from({ length: this.puzzle.size }, () => '')
        );

        this._renderGrid();
        this._renderClues();
        this._updateHUD();
        this._startTimer();

        this.overlayEl.classList.remove('active');
        this.levelEl.textContent = String(this.level).padStart(2, '0');
        this.hintCountEl.textContent = this.hints;

        // Update keyboard with relevant chars
        this._updateKeyboard();
    }

    /* --- Update Keyboard with puzzle-relevant chars --- */
    _updateKeyboard() {
        const charSet = new Set();
        this.puzzle.placedWords.forEach(pw => {
            pw.word.split('').forEach(ch => charSet.add(ch));
        });

        // Add some distractors
        const allChars = ['人', '大', '小', '中', '上', '下', '左', '右', '前', '後',
            '日', '水', '木', '金', '土', '風', '雨', '雪', '花', '草'];
        while (charSet.size < 42) {
            const r = allChars[Math.floor(Math.random() * allChars.length)];
            charSet.add(r);
        }

        const chars = [...charSet].sort(() => Math.random() - 0.5);
        this.kbPanel.innerHTML = '';
        chars.forEach(ch => {
            const btn = document.createElement('button');
            btn.className = 'key-btn';
            btn.textContent = ch;
            btn.addEventListener('click', () => this._inputChar(ch));
            this.kbPanel.appendChild(btn);
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'key-btn key-action';
        delBtn.textContent = '⌫ 刪除';
        delBtn.addEventListener('click', () => this._deleteChar());
        this.kbPanel.appendChild(delBtn);

        const switchBtn = document.createElement('button');
        switchBtn.className = 'key-btn key-action';
        switchBtn.textContent = '⇄ 方向';
        switchBtn.addEventListener('click', () => this._switchDirection());
        this.kbPanel.appendChild(switchBtn);
    }

    /* --- Render Grid --- */
    _renderGrid() {
        const { grid, size } = this.puzzle;
        this.gridEl.innerHTML = '';
        this.gridEl.style.gridTemplateColumns = `repeat(${size}, 42px)`;
        this.gridEl.style.gridTemplateRows = `repeat(${size}, 42px)`;

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellData = grid[r][c];
                const div = document.createElement('div');
                div.className = 'cell' + (cellData.isBlack ? ' black' : '');
                div.dataset.row = r;
                div.dataset.col = c;

                if (!cellData.isBlack) {
                    if (cellData.number > 0) {
                        const numSpan = document.createElement('span');
                        numSpan.className = 'cell-number';
                        numSpan.textContent = cellData.number;
                        div.appendChild(numSpan);
                    }

                    const charSpan = document.createElement('span');
                    charSpan.className = 'cell-char';
                    charSpan.textContent = '';
                    div.appendChild(charSpan);

                    div.addEventListener('click', () => this._selectCell(r, c));
                }

                this.gridEl.appendChild(div);
            }
        }
    }

    /* --- Render Clues --- */
    _renderClues() {
        // Clear previous
        this.acrossCluesEl.innerHTML = '<h4>📖 橫向提示</h4>';
        this.downCluesEl.innerHTML = '<h4>📜 縱向提示</h4>';

        this.puzzle.placedWords.forEach((pw, idx) => {
            if (!pw.number) return;
            const item = document.createElement('div');
            item.className = 'clue-item';
            item.dataset.wordIdx = idx;
            item.innerHTML = `
                <span class="clue-num">${pw.number}.</span>
                <span class="clue-text">${pw.clue} (${pw.word.length}字)</span>
            `;
            item.addEventListener('click', () => this._selectWord(idx));

            if (pw.dir === 'across') {
                this.acrossCluesEl.appendChild(item);
            } else {
                this.downCluesEl.appendChild(item);
            }
        });
    }

    /* --- Cell Selection --- */
    _selectCell(r, c) {
        if (!this.gameActive) return;
        const { grid } = this.puzzle;
        const cellData = grid[r][c];
        if (cellData.isBlack) return;

        // If clicking same cell, toggle direction
        if (this.activeCell && this.activeCell.r === r && this.activeCell.c === c) {
            this._switchDirection();
            return;
        }

        this.activeCell = { r, c };

        // Determine which word this cell belongs to
        if (this.activeDir === 'across' && cellData.acrossIdx >= 0) {
            this.activeWordIdx = cellData.acrossIdx;
        } else if (this.activeDir === 'down' && cellData.downIdx >= 0) {
            this.activeWordIdx = cellData.downIdx;
        } else if (cellData.acrossIdx >= 0) {
            this.activeDir = 'across';
            this.activeWordIdx = cellData.acrossIdx;
        } else if (cellData.downIdx >= 0) {
            this.activeDir = 'down';
            this.activeWordIdx = cellData.downIdx;
        }

        this._updateHighlights();
    }

    _selectWord(idx) {
        if (!this.gameActive) return;
        const pw = this.puzzle.placedWords[idx];
        this.activeDir = pw.dir;
        this.activeWordIdx = idx;
        this.activeCell = { r: pw.row, c: pw.col };

        // Find first empty cell in word
        for (const pos of pw.positions) {
            if (!this.userGrid[pos.r][pos.c]) {
                this.activeCell = { r: pos.r, c: pos.c };
                break;
            }
        }

        this._updateHighlights();
    }

    _updateHighlights() {
        // Clear all highlights
        document.querySelectorAll('.cell').forEach(el => {
            el.classList.remove('active', 'highlighted');
        });

        // Highlight word cells
        if (this.activeWordIdx >= 0) {
            const pw = this.puzzle.placedWords[this.activeWordIdx];
            pw.positions.forEach(pos => {
                const el = this.gridEl.querySelector(`[data-row='${pos.r}'][data-col='${pos.c}']`);
                if (el) el.classList.add('highlighted');
            });
        }

        // Highlight active cell
        if (this.activeCell) {
            const el = this.gridEl.querySelector(`[data-row='${this.activeCell.r}'][data-col='${this.activeCell.c}']`);
            if (el) el.classList.add('active');
        }

        // Highlight active clue
        document.querySelectorAll('.clue-item').forEach(el => el.classList.remove('active-clue'));
        if (this.activeWordIdx >= 0) {
            const clueEl = document.querySelector(`.clue-item[data-word-idx='${this.activeWordIdx}']`);
            if (clueEl) {
                clueEl.classList.add('active-clue');
                clueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    /* --- Input Handling --- */
    _handleKeyDown(e) {
        if (!this.gameActive || !this.activeCell) return;

        if (e.key === 'ArrowUp') { this._moveActive(0, -1); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { this._moveActive(0, 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { this._moveActive(-1, 0); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { this._moveActive(1, 0); e.preventDefault(); }
        else if (e.key === 'Backspace' || e.key === 'Delete') { this._deleteChar(); e.preventDefault(); }
        else if (e.key === 'Tab') { this._switchDirection(); e.preventDefault(); }
    }

    _inputChar(char) {
        if (!this.gameActive || !this.activeCell) return;
        const { r, c } = this.activeCell;
        const { grid } = this.puzzle;
        if (grid[r][c].isBlack) return;

        this.userGrid[r][c] = char;
        this.totalAttempts++;

        // Render char
        const cellEl = this.gridEl.querySelector(`[data-row='${r}'][data-col='${c}']`);
        const charSpan = cellEl.querySelector('.cell-char');
        charSpan.textContent = char;

        // Check correctness
        const correct = grid[r][c].char === char;
        if (correct) {
            this.correctAttempts++;
            this.score += 100;
            this.audio.play('correct');
        } else {
            cellEl.classList.add('incorrect');
            this.audio.play('wrong');
            setTimeout(() => cellEl.classList.remove('incorrect'), 400);
        }

        // Check word completion
        this._checkWordComplete();
        this._updateHUD();

        // Move to next cell
        this._advanceCell();
    }

    _deleteChar() {
        if (!this.activeCell) return;
        const { r, c } = this.activeCell;
        this.userGrid[r][c] = '';
        const cellEl = this.gridEl.querySelector(`[data-row='${r}'][data-col='${c}']`);
        const charSpan = cellEl.querySelector('.cell-char');
        charSpan.textContent = '';
        cellEl.classList.remove('correct');
        this.audio.play('type');
    }

    _advanceCell() {
        if (!this.activeCell || this.activeWordIdx < 0) return;
        const pw = this.puzzle.placedWords[this.activeWordIdx];
        const { r, c } = this.activeCell;

        // Find current position index in word
        const posIdx = pw.positions.findIndex(p => p.r === r && p.c === c);
        if (posIdx < pw.positions.length - 1) {
            const next = pw.positions[posIdx + 1];
            this.activeCell = { r: next.r, c: next.c };
        }
        this._updateHighlights();
    }

    _moveActive(dx, dy) {
        if (!this.activeCell) return;
        const { grid, size } = this.puzzle;
        let nr = this.activeCell.r + dy;
        let nc = this.activeCell.c + dx;

        if (nr >= 0 && nr < size && nc >= 0 && nc < size && !grid[nr][nc].isBlack) {
            this.activeCell = { r: nr, c: nc };
            // Update active word based on direction
            const cellData = grid[nr][nc];
            if (dx !== 0) {
                this.activeDir = 'across';
                if (cellData.acrossIdx >= 0) this.activeWordIdx = cellData.acrossIdx;
            } else {
                this.activeDir = 'down';
                if (cellData.downIdx >= 0) this.activeWordIdx = cellData.downIdx;
            }
            this._updateHighlights();
        }
    }

    _switchDirection() {
        this.activeDir = this.activeDir === 'across' ? 'down' : 'across';
        if (this.activeCell) {
            const { grid } = this.puzzle;
            const cellData = grid[this.activeCell.r][this.activeCell.c];
            if (this.activeDir === 'across' && cellData.acrossIdx >= 0) {
                this.activeWordIdx = cellData.acrossIdx;
            } else if (this.activeDir === 'down' && cellData.downIdx >= 0) {
                this.activeWordIdx = cellData.downIdx;
            }
        }
        this._updateHighlights();
    }

    /* --- Word Completion Check --- */
    _checkWordComplete() {
        let allSolved = true;

        this.puzzle.placedWords.forEach((pw, idx) => {
            if (pw.solved) return;

            let wordCorrect = true;
            let allFilled = true;
            for (const pos of pw.positions) {
                const userChar = this.userGrid[pos.r][pos.c];
                if (!userChar) { allFilled = false; wordCorrect = false; break; }
                if (userChar !== this.puzzle.grid[pos.r][pos.c].char) wordCorrect = false;
            }

            if (wordCorrect && allFilled) {
                pw.solved = true;
                this.score += 500;
                this.audio.play('wordComplete');

                // Visual feedback
                pw.positions.forEach(pos => {
                    const el = this.gridEl.querySelector(`[data-row='${pos.r}'][data-col='${pos.c}']`);
                    if (el) {
                        el.classList.add('correct', 'word-complete');
                    }
                });

                // Mark clue as solved
                const clueEl = document.querySelector(`.clue-item[data-word-idx='${idx}']`);
                if (clueEl) clueEl.classList.add('solved');

                // VFX
                const midPos = pw.positions[Math.floor(pw.positions.length / 2)];
                const midEl = this.gridEl.querySelector(`[data-row='${midPos.r}'][data-col='${midPos.c}']`);
                if (midEl) {
                    const rect = midEl.getBoundingClientRect();
                    this.vfx.emit(rect.left + rect.width / 2, rect.top + rect.height / 2, 15, '#27ae60');
                }
            }

            if (!pw.solved) allSolved = false;
        });

        if (allSolved) {
            this._levelComplete();
        }
    }

    /* --- Hint System --- */
    async _useHint() {
        if (!this.gameActive) return;

        if (this.hints <= 0) {
            // Trigger ad for more hints
            const reward = await this.adManager.show('hints');
            if (reward) {
                this.hints += 3;
                this.hintCountEl.textContent = this.hints;
                this.audio.play('hint');
            }
            return;
        }

        // Find an unsolved cell to reveal
        let revealed = false;
        for (const pw of this.puzzle.placedWords) {
            if (pw.solved) continue;
            for (const pos of pw.positions) {
                const userChar = this.userGrid[pos.r][pos.c];
                const correctChar = this.puzzle.grid[pos.r][pos.c].char;
                if (userChar !== correctChar) {
                    this.userGrid[pos.r][pos.c] = correctChar;
                    const el = this.gridEl.querySelector(`[data-row='${pos.r}'][data-col='${pos.c}']`);
                    const charSpan = el.querySelector('.cell-char');
                    charSpan.textContent = correctChar;
                    el.classList.add('correct');
                    this.hints--;
                    this.hintCountEl.textContent = this.hints;
                    this.audio.play('hint');

                    // VFX
                    const rect = el.getBoundingClientRect();
                    this.vfx.emit(rect.left + rect.width / 2, rect.top + rect.height / 2, 8, '#4a7a9b');

                    revealed = true;
                    break;
                }
            }
            if (revealed) break;
        }

        this._checkWordComplete();
        this._updateHUD();
    }

    /* --- Auto Mode --- */
    _toggleAuto() {
        this.autoMode = !this.autoMode;
        this.autoStatusEl.textContent = this.autoMode ? 'ON' : 'OFF';
        document.getElementById('auto-pilot-toggle').classList.toggle('active', this.autoMode);

        if (this.autoMode) {
            this._runAutoSolve();
        } else {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    }

    _runAutoSolve() {
        if (this.autoInterval) clearInterval(this.autoInterval);

        // Build queue of cells to fill
        const queue = [];
        for (const pw of this.puzzle.placedWords) {
            if (pw.solved) continue;
            for (const pos of pw.positions) {
                if (this.userGrid[pos.r][pos.c] !== this.puzzle.grid[pos.r][pos.c].char) {
                    queue.push({ r: pos.r, c: pos.c, char: this.puzzle.grid[pos.r][pos.c].char, wordIdx: this.puzzle.placedWords.indexOf(pw) });
                }
            }
        }

        let qi = 0;
        this.autoInterval = setInterval(() => {
            if (!this.autoMode || qi >= queue.length || !this.gameActive) {
                clearInterval(this.autoInterval);
                this.autoInterval = null;
                if (this.autoMode) {
                    this.autoMode = false;
                    this.autoStatusEl.textContent = 'OFF';
                    document.getElementById('auto-pilot-toggle').classList.remove('active');
                }
                return;
            }

            const item = queue[qi];
            this.activeCell = { r: item.r, c: item.c };
            this.activeWordIdx = item.wordIdx;
            this._updateHighlights();

            setTimeout(() => {
                this._inputChar(item.char);
            }, 150);

            qi++;
        }, 450);
    }

    /* --- Timer --- */
    _startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            if (!this.gameActive) return;
            this.timerValue--;

            const mins = Math.floor(this.timerValue / 60);
            const secs = this.timerValue % 60;
            this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

            if (this.timerValue <= 30) {
                this.timerEl.classList.add('timer-critical');
            }

            if (this.timerValue <= 0) {
                clearInterval(this.timerInterval);
                this._gameOver();
            }
        }, 1000);
    }

    /* --- Level Complete --- */
    _levelComplete() {
        this.gameActive = false;
        clearInterval(this.timerInterval);

        if (this.autoMode) {
            this.autoMode = false;
            clearInterval(this.autoInterval);
            this.autoStatusEl.textContent = 'OFF';
            document.getElementById('auto-pilot-toggle').classList.remove('active');
        }

        // Time bonus
        const timeBonus = this.timerValue * 10;
        this.score += timeBonus;

        // High score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('crossword_highScore', String(this.highScore));
        }

        this._updateHUD();
        this.audio.play('levelUp');

        // Grand fireworks
        setTimeout(() => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.vfx.emitFireworks(
                        100 + Math.random() * (window.innerWidth - 200),
                        100 + Math.random() * (window.innerHeight - 200)
                    );
                }, i * 300);
            }
        }, 200);

        // Show overlay
        setTimeout(() => {
            this.overlayHeading.textContent = '🎉 過關！';
            const accuracy = this.totalAttempts > 0
                ? Math.round((this.correctAttempts / this.totalAttempts) * 100) : 100;
            this.overlayDesc.innerHTML = `
                分數: <strong>${this.score.toLocaleString()}</strong><br>
                正確率: <strong>${accuracy}%</strong><br>
                時間獎勵: <strong>+${timeBonus.toLocaleString()}</strong><br>
                最高分: <strong>${this.highScore.toLocaleString()}</strong>
            `;
            this.overlayBtn.textContent = '下一關';
            this.overlayEl.classList.add('active');
        }, 1500);
    }

    /* --- Game Over --- */
    _gameOver() {
        this.gameActive = false;

        if (this.autoMode) {
            this.autoMode = false;
            clearInterval(this.autoInterval);
            this.autoStatusEl.textContent = 'OFF';
            document.getElementById('auto-pilot-toggle').classList.remove('active');
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('crossword_highScore', String(this.highScore));
        }

        this.audio.play('wrong');

        this.overlayHeading.textContent = '⏰ 時間到！';
        this.overlayDesc.innerHTML = `
            最終分數: <strong>${this.score.toLocaleString()}</strong><br>
            最高分: <strong>${this.highScore.toLocaleString()}</strong>
        `;
        this.overlayBtn.textContent = '重新挑戰';
        this.level = 0;
        this.score = 0;
        this.overlayEl.classList.add('active');
    }

    /* --- HUD Update --- */
    _updateHUD() {
        this.scoreEl.textContent = String(this.score).padStart(6, '0');
        const accuracy = this.totalAttempts > 0
            ? Math.round((this.correctAttempts / this.totalAttempts) * 100) : 100;
        this.accuracyEl.textContent = accuracy + '%';
    }
}

/* ============================================================
 * Section 7: BOOTSTRAP
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    const engine = new EliteEngine();
});
