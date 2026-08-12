/**
 * 065_SudokuMaster - The "Zen-Active" Silver Economy Edition
 * Built on UTT-v2.0 Elite_32_Industrializer (v3.0 Supercharged)
 * Implementations: Procedural Binaural Audio, Non-blocking FSM, AHP_Telemetry_Monitor
 */

// --- 1. Procedural Audio Engine (Zen Frequencies) ---
class ZenAudioManager {
    constructor() {
        this.ctx = null;
    }
    init() {
        if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if(this.ctx.state === 'suspended') this.ctx.resume();
    }
    playTone(freq = 432, type = 'sine', duration = 0.5, vol = 0.1) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Attack & Release for extreme relaxing feel (Alpha Brainwaves)
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
    playInputTone() { this.playTone(396, 'sine', 0.8, 0.15); } // Solfeggio frequency for liberation
    playErrorTone() { this.playTone(150, 'triangle', 0.5, 0.05); } // Soft error, not harsh
    playWinAura() { 
        this.playTone(528, 'sine', 3, 0.2); // Solfeggio for repair
        setTimeout(()=>this.playTone(639, 'sine', 3, 0.1), 500); 
    }
}

// --- 2. Telemetry Matrix (Neuro-Adaptive Monitor) ---
class TelemetryMonitor {
    constructor(uiController) {
        this.ui = uiController;
        this.lastActionTime = Date.now();
        this.focusLevel = 100;
        this.active = true;
    }
    recordAction(type) {
        const now = Date.now();
        const hesPing = now - this.lastActionTime;
        this.lastActionTime = now;
        
        // Neuro-adaptive guidance: if hesitation > 12s, provide passive therapeutic assist
        if (hesPing > 12000 && type === 'wait') {
            this.focusLevel = Math.max(0, this.focusLevel - 5);
            this.ui.showTwinMessage("💡 需要點幫助嗎？邏輯就像解結，不用急，我們慢慢來找破綻。");
            this.ui.highlightSafestCell();
        } else if (type === 'hit') {
            this.focusLevel = Math.min(100, this.focusLevel + 2);
            this.ui.clearSafestCell();
            this.ui.hideTwinMessage();
        }
        
        document.getElementById('focus-level').innerText = this.focusLevel + "%";
        // Color shifts to cyan when active, dims when focus drops
        document.getElementById('focus-level').style.color = `hsl(190, 100%, ${Math.max(50, this.focusLevel * 0.8)}%)`;
    }
    stop() { this.active = false; }
}

// --- 3. Core Engine & FSM ---
class SudokuEngine {
    constructor() {
        this.state = 'INIT'; // INIT, PLAYING, WIN
        this.board = Array(81).fill(0);
        // A solvable master board for standard testing
        this.solution = [
            4,3,5, 2,6,9, 7,8,1,
            6,8,2, 5,7,1, 4,9,3,
            1,9,7, 8,3,4, 5,6,2,
            
            8,2,6, 1,9,5, 3,4,7,
            3,7,4, 6,8,2, 9,1,5,
            9,5,1, 7,4,3, 6,2,8,
            
            5,1,9, 3,2,6, 8,7,4,
            2,4,8, 9,5,7, 1,3,6,
            7,6,3, 4,1,8, 2,5,9
        ];
        this.givenMask = Array(81).fill(false);
        this.history = [];
        this.activeCell = -1;
        this.audio = new ZenAudioManager();
        
        this.initUI();
        this.generatePuzzle(35); // Remove 35 cells for a highly accessible "Zen Easy" feel
        this.state = 'PLAYING';
        this.telemetry = new TelemetryMonitor(this);
        
        // Background loop for telemetry checks
        setInterval(() => {
            if(this.state === 'PLAYING') this.telemetry.recordAction('wait');
        }, 5000);
        
        this.startTime = Date.now();
        this.timer = setInterval(()=>this.updateTime(), 1000);
    }
    
    generatePuzzle(emptyCount) {
        this.board = [...this.solution];
        // Randomly mask emptyCount cells
        let count = 0;
        let shuffledIndexes = Array.from({length:81}, (_,i)=>i).sort(()=>Math.random()-0.5);
        for(let i=0; i<81; i++) {
            if(count >= emptyCount) break;
            this.board[shuffledIndexes[i]] = 0;
            count++;
        }
        this.board.forEach((val, i) => { if(val !== 0) this.givenMask[i] = true; });
        this.renderGrid();
    }
    
    initUI() {
        this.gridEl = document.getElementById('sudoku-grid');
        for(let i=0; i<81; i++) {
            let c = document.createElement('div');
            c.className = 'cell';
            c.dataset.idx = i;
            // Native multi-platform hook mapping
            c.addEventListener('mousedown', (e) => this.selectCell(i, e));
            c.addEventListener('touchstart', (e) => { e.preventDefault(); this.selectCell(i, e); });
            this.gridEl.appendChild(c);
        }
        
        // Fat-finger friendly numpads
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.audio.init(); 
                if(btn.dataset.action === 'clear') this.inputNum(0);
                else this.inputNum(parseInt(btn.dataset.val));
            });
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.audio.init(); 
                if(btn.dataset.action === 'clear') this.inputNum(0);
                else this.inputNum(parseInt(btn.dataset.val));
            });
        });
        
        // Unlimited Undo System 
        document.getElementById('btn-undo').addEventListener('click', ()=>this.undo());
        document.getElementById('btn-undo').addEventListener('touchstart', (e)=>{ e.preventDefault(); this.undo();});
        
        // Master Loop restarts
        document.getElementById('btn-restart').addEventListener('click', ()=>location.reload());
    }
    
    selectCell(idx, e) {
        this.audio.init(); // Warm up WebAudio 
        if(this.state !== 'PLAYING') return;
        if(this.givenMask[idx]) return;
        this.activeCell = idx;
        this.renderGrid();
    }
    
    inputNum(val) {
        if(this.activeCell === -1 || this.state !== 'PLAYING') return;
        
        // Store history vector (O(1) stack memory)
        this.history.push({ idx: this.activeCell, prev: this.board[this.activeCell] });
        
        this.board[this.activeCell] = val;
        
        // Zen validation: Do not lock the board, just glow red.
        if(val !== 0 && val !== this.solution[this.activeCell]) {
            this.audio.playErrorTone();
            this.telemetry.recordAction('miss');
        } else if (val !== 0) {
            this.audio.playInputTone();
            this.telemetry.recordAction('hit');
            this.checkWin();
        }
        this.renderGrid();
    }
    
    undo() {
        if(this.history.length === 0 || this.state !== 'PLAYING') return;
        let last = this.history.pop();
        this.board[last.idx] = last.prev;
        this.renderGrid();
    }
    
    checkWin() {
        if(this.board.every((v, i) => v === this.solution[i])) {
            this.state = 'WIN';
            clearInterval(this.timer);
            this.telemetry.stop();
            this.audio.playWinAura();
            this.showTwinMessage("太出色了！您的大腦前額葉已經完全被點燃，這是最棒的認知活化！");
            document.getElementById('modal-overlay').classList.remove('hidden');
        }
    }
    
    renderGrid() {
        const cells = this.gridEl.children;
        for(let i=0; i<81; i++) {
            cells[i].className = 'cell';
            if(this.givenMask[i]) cells[i].classList.add('given');
            if(i === this.activeCell) {
                cells[i].classList.add('active');
                cells[i].innerHTML = `<div style="transform: scale(1.1); transition: 0.2s;">${this.board[i] || ''}</div>`;
            } else {
                cells[i].innerText = this.board[i] === 0 ? '' : this.board[i];
            }
            
            // Error mapping (Immediate soft feedback)
            if(!this.givenMask[i] && this.board[i] !== 0 && this.board[i] !== this.solution[i]) {
                cells[i].classList.add('error');
            }
        }
    }
    
    updateTime() {
        let sec = Math.floor((Date.now() - this.startTime)/1000);
        let m = Math.floor(sec / 60).toString().padStart(2, '0');
        let s = (sec % 60).toString().padStart(2, '0');
        document.getElementById('stat-time').innerText = `計時: ${m}:${s}`;
    }
    
    showTwinMessage(msg) {
        let dlg = document.getElementById('digital-twin-dialogue');
        document.getElementById('twin-msg').innerText = msg;
        dlg.classList.remove('hidden');
        dlg.style.animation = 'none';
        void dlg.offsetWidth; // trigger reflow
        dlg.style.animation = 'fadeSlide 0.5s ease-out';
    }

    hideTwinMessage() {
        let dlg = document.getElementById('digital-twin-dialogue');
        if(!dlg.classList.contains('hidden')) {
            dlg.style.animation = 'fadeSlide 0.5s reverse';
            setTimeout(() => dlg.classList.add('hidden'), 480);
        }
    }
    
    highlightSafestCell() {
        this.clearSafestCell();
        for(let i=0; i<81; i++) {
            if(this.board[i] === 0) {
                this.gridEl.children[i].classList.add('hint');
                break;
            }
        }
    }

    clearSafestCell() {
        for(let i=0; i<81; i++) { this.gridEl.children[i].classList.remove('hint'); }
    }
}

// --- 4. Visual Aesthetics Engine (Zen Aura Dynamics) ---
const zc = document.getElementById('zen-canvas');
const zctx = zc.getContext('2d');
let time = 0;

function drawZenBGAura() {
    zc.width = window.innerWidth;
    zc.height = window.innerHeight;
    const cx = zc.width/2; const cy = zc.height/2;
    
    // Slow breathing procedural aura for deep relaxation
    const pulse = Math.sin(time * 0.5) * 60 + 250;
    const grad = zctx.createRadialGradient(cx, cy, 0, cx, cy, pulse);
    grad.addColorStop(0, 'rgba(20, 184, 166, 0.08)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)'); // fade into background
    zctx.fillStyle = grad;
    zctx.fillRect(0,0, zc.width, zc.height);
    
    time += 0.01;
    requestAnimationFrame(drawZenBGAura);
}

// Boot Sequence
window.onload = () => {
    drawZenBGAura();
    new SudokuEngine();
};
