/**
 * 050_MahjongSolitaire - Retro Zen Silver Economy Edition
 * UTT-v2.0 Master-Grade (Connect / 連連看) Logic
 */

// --- 1. Procedural Audio Engine (Zen Frequencies & Wood Blocks) ---
class ZenAudioManager {
    constructor() { this.ctx = null; }
    init() {
        if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if(this.ctx.state === 'suspended') this.ctx.resume();
    }
    // Deep wooden knock simulation for Mahjong Tiles
    playWoodKnock() {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.1);
    }
    // Soft connection aura (Solfeggio)
    playMatchTick() {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, this.ctx.currentTime); // DNA repair freq
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + 0.6);
    }
    playWinAura() { 
        this.playMatchTick();
        setTimeout(() => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(639, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(); osc.stop(this.ctx.currentTime + 2);
        }, 300);
    }
}

// --- 2. Telemetry Matrix ---
class TelemetryMonitor {
    constructor(engine) {
        this.engine = engine;
        this.lastActionTime = Date.now();
        this.focusLevel = 100;
        this.active = true;
    }
    recordAction(type) {
        if(!this.active || this.engine.state !== 'PLAYING') return;
        const now = Date.now();
        const hesPing = now - this.lastActionTime;
        this.lastActionTime = now;
        
        if (hesPing > 12000 && type === 'wait') {
            this.focusLevel = Math.max(0, this.focusLevel - 3);
            this.engine.showTwinMessage("💡 眼花繚亂了嗎？試著從最外圍的邊緣往內找。");
            this.engine.highlightAutoHint();
        } else if (type === 'hit') {
            this.focusLevel = Math.min(100, this.focusLevel + 5);
            this.engine.hideTwinMessage();
            this.engine.clearHint();
        }
        
        document.getElementById('focus-level').innerText = this.focusLevel + "%";
        document.getElementById('focus-level').style.color = `hsl(150, 100%, ${Math.max(50, this.focusLevel * 0.8)}%)`;
    }
    stop() { this.active = false; }
}

// --- 3. Core Connect Engine ---
class MahjongConnectEngine {
    constructor() {
        this.ROWS = 6;  // Playable R
        this.COLS = 10; // Playable C
        // +2 for outer boundary pathing (0 and ROWS+1)
        this.grid = Array.from({length: this.ROWS+2}, () => Array(this.COLS+2).fill(null));
        this.tilesLeft = this.ROWS * this.COLS;
        this.audio = new ZenAudioManager();
        
        // Target 15 Unicode Mahjong characters to duplicate
        this.tileTypes = ['🀄','🀅','🀆','🀀','🀁','🀂','🀃','🀇','🀈','🀉','🀐','🀑','🀒','🀙','🀚'];
        
        this.state = 'PLAYING';
        this.selectedTile = null;
        this.isAutoPlaying = false;
        
        this.initUI();
        this.generateBoard();
        
        this.telemetry = new TelemetryMonitor(this);
        setInterval(() => this.telemetry.recordAction('wait'), 5000);
        
        this.startTime = Date.now();
        this.timer = setInterval(()=>this.updateTime(), 1000);
    }
    
    generateBoard() {
        // Create pairs
        let deck = [];
        let totalTiles = this.ROWS * this.COLS;
        let pIndex = 0;
        for(let i=0; i<totalTiles; i+=2) {
            deck.push(this.tileTypes[pIndex % this.tileTypes.length]);
            deck.push(this.tileTypes[pIndex % this.tileTypes.length]);
            pIndex++;
        }
        // Shuffle
        deck.sort(() => Math.random() - 0.5);
        deck.sort(() => Math.random() - 0.5);
        
        const bEl = document.getElementById('board');
        bEl.innerHTML = '';
        bEl.style.gridTemplateColumns = `repeat(${this.COLS}, 1fr)`;
        
        let cIdx = 0;
        for(let r=1; r<=this.ROWS; r++) {
            for(let c=1; c<=this.COLS; c++) {
                let val = deck[cIdx++];
                this.grid[r][c] = { r, c, val, active: true, el: null };
            }
        }
        
        // Render DOM tiles
        for(let r=1; r<=this.ROWS; r++) {
            for(let c=1; c<=this.COLS; c++) {
                let t = this.grid[r][c];
                let div = document.createElement('div');
                div.className = 'tile';
                div.innerText = t.val;
                div.dataset.r = r; div.dataset.c = c;
                
                div.addEventListener('mousedown', (e)=>this.handleTileClick(r,c,e));
                div.addEventListener('touchstart', (e)=>{e.preventDefault(); this.handleTileClick(r,c,e);}, {passive:false});
                
                t.el = div;
                bEl.appendChild(div);
            }
        }
    }
    
    initUI() {
        document.getElementById('btn-shuffle').addEventListener('click', ()=>{
            this.audio.init();
            this.shuffleBoard();
        });
        document.getElementById('btn-restart').addEventListener('click', ()=>location.reload());
        
        document.getElementById('btn-guide').addEventListener('click', ()=>{
            document.getElementById('guide-modal').classList.remove('hidden');
        });
        document.getElementById('btn-close-guide').addEventListener('click', ()=>{
            document.getElementById('guide-modal').classList.add('hidden');
        });
        document.getElementById('btn-auto').addEventListener('click', ()=>{
            this.audio.init();
            this.toggleAutoPlay();
        });
        
        // Resize canvas for lines
        this.resizeLineCanvas();
        window.addEventListener('resize', ()=>this.resizeLineCanvas());
    }

    resizeLineCanvas() {
        const wrap = document.getElementById('board-wrapper');
        const cvs = document.getElementById('line-canvas');
        cvs.width = wrap.clientWidth;
        cvs.height = wrap.clientHeight;
    }
    
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const btn = document.getElementById('btn-auto');
        btn.style.background = this.isAutoPlaying ? 'var(--accent-teal)' : 'transparent';
        btn.style.color = this.isAutoPlaying ? '#000' : 'var(--accent-teal)';
        if(this.isAutoPlaying) this.runAutoPlayStep();
    }
    
    runAutoPlayStep() {
        if(!this.isAutoPlaying || this.state !== 'PLAYING') return;
        
        let match = this.hasAvailableMatch();
        if(match) {
            this.handleTileClick(match.t1.r, match.t1.c, null);
            setTimeout(() => {
                if(this.isAutoPlaying && this.state === 'PLAYING') {
                    this.handleTileClick(match.t2.r, match.t2.c, null);
                    setTimeout(() => this.runAutoPlayStep(), 800);
                }
            }, 300);
        } else {
            if(this.tilesLeft > 0) {
               this.shuffleBoard();
               setTimeout(() => this.runAutoPlayStep(), 500);
            }
        }
    }
    
    handleTileClick(r, c, e) {
        if(this.state !== 'PLAYING') return;
        let t = this.grid[r][c];
        if(!t || !t.active) return;
        
        this.audio.init();
        this.audio.playWoodKnock();
        
        if(this.selectedTile) {
            // Unselect if click same
            if(this.selectedTile.r === r && this.selectedTile.c === c) {
                t.el.classList.remove('active');
                this.selectedTile = null;
                return;
            }
            // Check Match
            let s = this.selectedTile;
            if(s.val === t.val) {
                let path = this.findPath(s.r, s.c, r, c);
                if(path) {
                    // Match Success
                    this.drawPath(path);
                    this.audio.playMatchTick();
                    this.telemetry.recordAction('hit');
                    
                    s.active = false; t.active = false;
                    s.el.classList.add('hidden'); s.el.classList.remove('active');
                    t.el.classList.add('hidden');
                    this.grid[s.r][s.c] = null;
                    this.grid[r][c] = null;
                    this.selectedTile = null;
                    
                    bgEffect.spawnGoldDust(t.el.offsetLeft + t.el.clientWidth/2, t.el.offsetTop + t.el.clientHeight/2);
                    bgEffect.spawnGoldDust(s.el.offsetLeft + s.el.clientWidth/2, s.el.offsetTop + s.el.clientHeight/2);
                    
                    this.tilesLeft -= 2;
                    if(this.tilesLeft === 0) this.checkWin();
                    else if(!this.hasAvailableMatch()) this.shuffleBoard();
                    return;
                }
            }
            // Mismatch or no path -> switch selection
            s.el.classList.remove('active');
        }
        
        // Select
        t.el.classList.add('active');
        this.selectedTile = t;
    }
    
    // O(W*H) Pathfinding algorithm with maximum 2 turns
    findPath(r1, c1, r2, c2) {
        // Try all horizontal and vertical extensions from (r1,c1) and (r2,c2)
        // If they intersect and the segments are clear -> path exists
        let pts1 = this.getCrossLines(r1, c1);
        let pts2 = this.getCrossLines(r2, c2);
        
        for(let p1 of pts1) {
            for(let p2 of pts2) {
                if(p1.r === p2.r && this.isClearRow(p1.r, p1.c, p2.c)) {
                    return [{r:r1,c:c1}, {r:p1.r,c:p1.c}, {r:p2.r,c:p2.c}, {r:r2,c:c2}];
                }
                if(p1.c === p2.c && this.isClearCol(p1.c, p1.r, p2.r)) {
                    return [{r:r1,c:c1}, {r:p1.r,c:p1.c}, {r:p2.r,c:p2.c}, {r:r2,c:c2}];
                }
            }
        }
        return null;
    }
    
    getCrossLines(r, c) {
        let pts = [];
        pts.push({r,c});
        // Up
        for(let i=r-1; i>=0; i--) { if(this.grid[i][c] && this.grid[i][c].active) break; pts.push({r:i, c}); }
        // Down
        for(let i=r+1; i<=this.ROWS+1; i++) { if(this.grid[i][c] && this.grid[i][c].active) break; pts.push({r:i, c}); }
        // Left
        for(let i=c-1; i>=0; i--) { if(this.grid[r][i] && this.grid[r][i].active) break; pts.push({r, c:i}); }
        // Right
        for(let i=c+1; i<=this.COLS+1; i++) { if(this.grid[r][i] && this.grid[r][i].active) break; pts.push({r, c:i}); }
        return pts;
    }
    
    isClearRow(r, c1, c2) {
        let min = Math.min(c1, c2), max = Math.max(c1, c2);
        for(let c=min+1; c<max; c++) { if(this.grid[r][c] && this.grid[r][c].active) return false; }
        return true;
    }
    isClearCol(c, r1, r2) {
        let min = Math.min(r1, r2), max = Math.max(r1, r2);
        for(let r=min+1; r<max; r++) { if(this.grid[r][c] && this.grid[r][c].active) return false; }
        return true;
    }
    
    drawPath(pathArr) {
        const cvs = document.getElementById('line-canvas');
        const ctx = cvs.getContext('2d');
        const bEl = document.getElementById('board');
        // Assume all tiles have same width/height
        const firstTile = document.querySelector('.tile');
        if(!firstTile) return;
        const tw = firstTile.clientWidth + 4; // Add gap
        const th = firstTile.clientHeight + 4;
        
        ctx.clearRect(0,0,cvs.width,cvs.height);
        ctx.beginPath();
        ctx.strokeStyle = '#fbbf24'; // Gold
        ctx.lineWidth = 4;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        
        for(let i=0; i<pathArr.length; i++) {
            let p = pathArr[i];
            // map logical r,c to canvas x,y. logical grid starts inside wrapper via grid.
            // Tile 1,1 is basically x: tw/2, y: th/2
            let x = (p.c - 1) * tw + tw/2;
            let y = (p.r - 1) * th + th/2;
            
            // Adjust bounds if path goes outside matrix 
            if(p.c === 0) x = -tw/2;
            if(p.c === this.COLS+1) x = this.COLS*tw + tw/2;
            if(p.r === 0) y = -th/2;
            if(p.r === this.ROWS+1) y = this.ROWS*th + th/2;

            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fade out
        let op = 1;
        const fade = setInterval(()=>{
            op -= 0.1;
            if(op <= 0) { ctx.clearRect(0,0,cvs.width,cvs.height); clearInterval(fade); return; }
            cvs.style.opacity = op;
        }, 30);
        setTimeout(() => cvs.style.opacity = 1, 350); 
    }
    
    hasAvailableMatch() {
        let tiles = [];
        for(let r=1; r<=this.ROWS; r++) {
            for(let c=1; c<=this.COLS; c++) {
                if(this.grid[r][c] && this.grid[r][c].active) tiles.push(this.grid[r][c]);
            }
        }
        for(let i=0; i<tiles.length; i++) {
            for(let j=i+1; j<tiles.length; j++) {
                if(tiles[i].val === tiles[j].val) {
                    if(this.findPath(tiles[i].r, tiles[i].c, tiles[j].r, tiles[j].c)) return {t1:tiles[i], t2:tiles[j]};
                }
            }
        }
        return false;
    }
    
    shuffleBoard() {
        if(this.state !== 'PLAYING') return;
        this.selectedTile = null;
        let activeVals = [];
        let activeSpots = [];
        
        for(let r=1; r<=this.ROWS; r++) {
            for(let c=1; c<=this.COLS; c++) {
                if(this.grid[r][c] && this.grid[r][c].active) {
                    this.grid[r][c].el.classList.remove('active');
                    this.grid[r][c].el.classList.remove('hint');
                    activeVals.push(this.grid[r][c].val);
                    activeSpots.push({r,c, el: this.grid[r][c].el});
                }
            }
        }
        activeVals.sort(()=>Math.random() - 0.5);
        
        for(let i=0; i<activeSpots.length; i++) {
            let pt = activeSpots[i];
            let nV = activeVals[i];
            pt.el.innerText = nV;
            this.grid[pt.r][pt.c] = { r:pt.r, c:pt.c, val:nV, active:true, el: pt.el };
        }
        
        // Auto-shuffle recursively if deadend
        if(activeVals.length > 0 && !this.hasAvailableMatch()) this.shuffleBoard();
    }
    
    highlightAutoHint() {
        let match = this.hasAvailableMatch();
        if(match) {
            match.t1.el.classList.add('hint');
            match.t2.el.classList.add('hint');
        }
    }
    clearHint() {
        document.querySelectorAll('.tile.hint').forEach(t=>t.classList.remove('hint'));
    }
    
    checkWin() {
        this.state = 'WIN';
        clearInterval(this.timer);
        this.telemetry.stop();
        this.audio.playWinAura();
        document.getElementById('modal-overlay').classList.remove('hidden');
    }
    
    updateTime() {
        let sec = Math.floor((Date.now() - this.startTime)/1000);
        let m = Math.floor(sec / 60).toString().padStart(2, '0');
        let s = (sec % 60).toString().padStart(2, '0');
        document.getElementById('stat-time').innerText = `淨心時辰: ${m}:${s}`;
    }
    
    showTwinMessage(msg) {
        let dlg = document.getElementById('digital-twin-dialogue');
        document.getElementById('twin-msg').innerText = msg;
        dlg.classList.remove('hidden');
        dlg.style.animation = 'none'; void dlg.offsetWidth; dlg.style.animation = 'fadeSlide 0.5s ease-out';
    }
    hideTwinMessage() { document.getElementById('digital-twin-dialogue').classList.add('hidden'); }
}

// --- 4. Retro Zen Water Ripple & Gold Dust Background Engine ---
class BackgroundEffect {
    constructor() {
        this.cvs = document.getElementById('bg-canvas');
        this.ctx = this.cvs.getContext('2d');
        this.particles = [];
        this.ripples = [];
        this.resize();
        window.addEventListener('resize', ()=>this.resize());
        requestAnimationFrame(this.loop.bind(this));
    }
    resize() { this.cvs.width=window.innerWidth; this.cvs.height=window.innerHeight; }
    
    spawnGoldDust(x, y) {
        // Adjust x,y by board wrapper offset
        const wrapper = document.getElementById('board-wrapper');
        const bx = wrapper.getBoundingClientRect().left;
        const by = wrapper.getBoundingClientRect().top;
        x += bx; y += by;
        
        for(let i=0; i<15; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5 - 2,
                life: 1, color: '#fbbf24'
            });
        }
        this.ripples.push({x, y, r: 0, maxR: 150, alpha: 0.5});
    }
    
    loop() {
        this.ctx.clearRect(0,0,this.cvs.width,this.cvs.height);
        
        // Ripples
        for(let i=this.ripples.length-1; i>=0; i--) {
            let r = this.ripples[i];
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.r, 0, Math.PI*2);
            this.ctx.strokeStyle = `rgba(52, 211, 153, ${r.alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            r.r += 2; r.alpha -= 0.01;
            if(r.alpha <= 0) this.ripples.splice(i, 1);
        }
        
        // Particles
        for(let i=this.particles.length-1; i>=0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vy += 0.1; // gravity
            p.life -= 0.02;
            
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.life);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            if(p.life <= 0) this.particles.splice(i, 1);
        }
        requestAnimationFrame(this.loop.bind(this));
    }
}

const bgEffect = new BackgroundEffect();
window.onload = () => new MahjongConnectEngine();
