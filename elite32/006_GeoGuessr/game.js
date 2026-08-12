/**
 * ============================================================
 * 006_GEOGUESSR | 世界探險
 * UTT-v2.0 MASTER-GRADE ENGINE | © 2026 Project Chimera
 *
 * Architecture (Xavier): Canvas world map + Haversine scoring
 * Complexity (Ada): Distance calc O(1), Map render O(P) polygons
 * ============================================================
 */
'use strict';

/* ============================================================
 * S1: WORLD MAP DATA (simplified continent polygons, lon/lat)
 * ============================================================ */
const CONTINENTS = [
    { name: 'North America', color: '#1a4a3a', points: [[-170,72],[-168,65],[-140,60],[-130,55],[-125,48],[-117,33],[-105,25],[-97,19],[-87,15],[-83,10],[-77,8],[-80,25],[-82,30],[-75,35],[-70,42],[-67,45],[-55,47],[-52,52],[-58,55],[-65,60],[-73,63],[-95,72],[-130,72],[-170,72]] },
    { name: 'South America', color: '#1a3a4a', points: [[-83,10],[-77,8],[-70,4],[-65,0],[-50,-2],[-35,-5],[-35,-20],[-40,-22],[-42,-23],[-48,-28],[-52,-33],[-58,-38],[-67,-55],[-75,-50],[-75,-42],[-72,-18],[-80,0],[-83,10]] },
    { name: 'Europe', color: '#2a3a52', points: [[-10,36],[-8,44],[0,44],[3,43],[5,46],[10,46],[15,47],[20,45],[25,36],[28,41],[30,42],[40,42],[45,48],[50,55],[60,60],[65,68],[50,70],[30,72],[15,72],[5,62],[-5,58],[-10,52],[-10,36]] },
    { name: 'Africa', color: '#3a2a1a', points: [[-17,16],[-15,28],[0,37],[10,37],[12,33],[20,32],[25,30],[32,31],[35,30],[42,12],[51,12],[51,0],[42,-2],[40,-12],[35,-24],[33,-34],[28,-34],[18,-35],[15,-28],[12,-17],[8,-5],[5,5],[0,5],[-8,5],[-17,16]] },
    { name: 'Asia', color: '#2a2a42', points: [[25,36],[30,42],[40,42],[45,48],[50,55],[60,60],[65,68],[75,72],[100,72],[130,72],[170,66],[160,55],[140,50],[130,43],[127,37],[120,30],[110,20],[105,10],[100,2],[95,6],[80,7],[75,15],[70,22],[60,25],[50,28],[42,12],[35,30],[25,36]] },
    { name: 'Oceania', color: '#1a3040', points: [[112,-10],[115,-20],[118,-25],[121,-32],[130,-33],[138,-35],[148,-38],[154,-35],[154,-28],[150,-22],[147,-16],[143,-12],[138,-12],[130,-15],[128,-15],[125,-14],[118,-15],[115,-15],[112,-10]] },
    { name: 'Antarctica', color: '#1a2a32', points: [[-180,-70],[-120,-65],[-60,-65],[0,-70],[60,-65],[120,-65],[180,-70],[180,-90],[-180,-90],[-180,-70]] },
];

/* ============================================================
 * S2: LOCATION DATABASE (25 landmarks)
 * ============================================================ */
const LOCATIONS = [
    { name: '台北101', country: '台灣', lat: 25.0340, lon: 121.5645, emoji: '🏙️',
      clue: '這座摩天大樓曾是世界最高建築，位於一座以夜市聞名的亞洲城市。',
      hints: ['它有一個巨大的風阻尼球', '所在城市有著名的小籠包'] },
    { name: '艾菲爾鐵塔', country: '法國', lat: 48.8584, lon: 2.2945, emoji: '🗼',
      clue: '這座鐵製高塔建於1889年，是浪漫之都最具代表性的地標。',
      hints: ['位於塞納河畔', '每年有七百萬人造訪'] },
    { name: '自由女神像', country: '美國', lat: 40.6892, lon: -74.0445, emoji: '🗽',
      clue: '這座綠色雕像是法國贈送的禮物，矗立在一個繁忙港口的小島上。',
      hints: ['位於北美洲東岸', '她手持火炬與獨立宣言'] },
    { name: '金字塔', country: '埃及', lat: 29.9792, lon: 31.1342, emoji: '🏛️',
      clue: '這些巨大的三角形建築是古代七大奇蹟中唯一留存的，位於非洲北部的沙漠中。',
      hints: ['旁邊有一座獅身人面像', '建於四千多年前'] },
    { name: '萬里長城', country: '中國', lat: 40.4319, lon: 116.5704, emoji: '🧱',
      clue: '這是人類歷史上最長的建築結構，蜿蜒穿越北方的山脈和草原。',
      hints: ['全長超過兩萬公里', '始建於秦朝'] },
    { name: '泰姬瑪哈陵', country: '印度', lat: 27.1751, lon: 78.0421, emoji: '🕌',
      clue: '這座白色大理石陵墓是一位皇帝為紀念摯愛的妻子所建造。',
      hints: ['位於南亞的一條河畔', '被聯合國列為世界遺產'] },
    { name: '馬丘比丘', country: '秘魯', lat: -13.1631, lon: -72.5450, emoji: '🏔️',
      clue: '這座「失落的城市」座落在南美洲高山上，是印加帝國的遺跡。',
      hints: ['海拔約2430公尺', '1911年被美國探險家發現'] },
    { name: '雪梨歌劇院', country: '澳洲', lat: -33.8568, lon: 151.2153, emoji: '🎭',
      clue: '這座帆船造型的建築物位於南半球一座美麗的海港旁。',
      hints: ['位於大洋洲的最大城市', '白色貝殼狀屋頂'] },
    { name: '富士山', country: '日本', lat: 35.3606, lon: 138.7274, emoji: '🗻',
      clue: '這座完美的錐形火山是東亞一個島國最高峰和精神象徵。',
      hints: ['海拔3776公尺', '被列為世界文化遺產'] },
    { name: '巨石陣', country: '英國', lat: 51.1789, lon: -1.8262, emoji: '🪨',
      clue: '這些巨大的石頭環排列成圓形，建於五千年前，位於歐洲西部島國的草原上。',
      hints: ['可能與天文觀測有關', '位於威爾特郡'] },
    { name: '聖家堂', country: '西班牙', lat: 41.4036, lon: 2.1744, emoji: '⛪',
      clue: '這座未完工的大教堂由天才建築師高迪設計，位於歐洲南部的地中海城市。',
      hints: ['已建造超過140年', '位於加泰隆尼亞地區'] },
    { name: '克里姆林宮', country: '俄羅斯', lat: 55.7520, lon: 37.6175, emoji: '🏰',
      clue: '這座紅色城堡是世界上國土面積最大的國家的政治中心。',
      hints: ['旁邊有紅場', '位於莫斯科河畔'] },
    { name: '比薩斜塔', country: '義大利', lat: 43.7230, lon: 10.3966, emoji: '🗼',
      clue: '這座白色鐘樓因地基不均而傾斜，成為歐洲南部的著名地標。',
      hints: ['傾斜角度約3.97度', '建於12世紀'] },
    { name: '吳哥窟', country: '柬埔寨', lat: 13.4125, lon: 103.8670, emoji: '🛕',
      clue: '這是世界上最大的宗教建築群，隱藏在東南亞的熱帶叢林中。',
      hints: ['建於12世紀高棉帝國', '日出景觀舉世聞名'] },
    { name: '尼加拉瀑布', country: '加拿大/美國', lat: 43.0799, lon: -79.0747, emoji: '🌊',
      clue: '這組壯觀的瀑布位於北美洲兩個國家的交界處，水量驚人。',
      hints: ['每秒超過280萬公升水流過', '橫跨美加邊境'] },
    { name: '好望角', country: '南非', lat: -34.3568, lon: 18.4740, emoji: '🌊',
      clue: '這個岬角位於非洲大陸的最南端附近，是大西洋與印度洋交會的象徵。',
      hints: ['15世紀葡萄牙航海家發現', '位於開普半島'] },
    { name: '聖索菲亞大教堂', country: '土耳其', lat: 41.0086, lon: 28.9802, emoji: '🕌',
      clue: '這座橫跨歐亞兩洲城市中的宏偉建築，先後作為教堂、清真寺和博物館使用。',
      hints: ['建於537年', '位於博斯普魯斯海峽旁'] },
    { name: '佩特拉古城', country: '約旦', lat: 30.3285, lon: 35.4444, emoji: '🏚️',
      clue: '這座「玫瑰紅城」是一座在岩石峭壁中雕刻而成的古老城市。',
      hints: ['新七大奇蹟之一', '位於中東沙漠地區'] },
    { name: '復活節島', country: '智利', lat: -27.1127, lon: -109.3497, emoji: '🗿',
      clue: '這座偏遠的太平洋小島以其神秘的巨大石像聞名世界。',
      hints: ['石像稱為摩艾', '是世界上最偏遠的有人島之一'] },
    { name: '北極光觀測站', country: '冰島', lat: 64.1466, lon: -21.9426, emoji: '🌌',
      clue: '這個位於北大西洋的島國以溫泉、冰川和壯麗的極光聞名。',
      hints: ['人口僅約37萬', '擁有世界上最古老的議會'] },
];

/* ============================================================
 * S3: AUDIO
 * ============================================================ */
class AudioManager {
    constructor() { this.ctx = null; this.on = true; }
    init() { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.on = false; } }
    wake() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
    play(t) {
        if (!this.on || !this.ctx) return;
        try {
            const now = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            if (t === 'pin') { o.type='sine'; o.frequency.setValueAtTime(1200,now); o.frequency.exponentialRampToValueAtTime(800,now+0.1); g.gain.setValueAtTime(0.08,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.12); o.start(now); o.stop(now+0.12); }
            else if (t === 'correct') { o.type='sine'; [523,659,784,1047].forEach((f,i)=>o.frequency.setValueAtTime(f,now+i*0.08)); g.gain.setValueAtTime(0.12,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.5); o.start(now); o.stop(now+0.5); }
            else if (t === 'perfect') { o.type='sine'; [523,659,784,1047,1319,1568].forEach((f,i)=>o.frequency.setValueAtTime(f,now+i*0.08)); g.gain.setValueAtTime(0.15,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.8); o.start(now); o.stop(now+0.8); }
            else if (t === 'end') { o.type='triangle'; [784,659,523].forEach((f,i)=>o.frequency.setValueAtTime(f,now+i*0.15)); g.gain.setValueAtTime(0.1,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.6); o.start(now); o.stop(now+0.6); }
        } catch(e){}
    }
}

/* ============================================================
 * S4: ELITE ENGINE
 * ============================================================ */
class EliteEngine {
    constructor() {
        this.canvas = document.getElementById('map-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score-val');
        this.roundEl = document.getElementById('round-val');
        this.timerEl = document.getElementById('timer-val');
        this.autoStatusEl = document.getElementById('auto-pilot-status');
        this.clueEmoji = document.getElementById('clue-emoji');
        this.clueText = document.getElementById('clue-text');
        this.clueHints = document.getElementById('clue-hints');
        this.roundIndicator = document.getElementById('round-indicator');
        this.confirmBtn = document.getElementById('confirm-btn');
        this.resultPanel = document.getElementById('result-panel');
        this.resultDist = document.getElementById('result-distance');
        this.resultLoc = document.getElementById('result-location');
        this.resultPts = document.getElementById('result-points');
        this.nextBtn = document.getElementById('next-btn');
        this.overlayEl = document.getElementById('game-overlay');
        this.overlayBtn = document.getElementById('init-game-btn');

        this.audio = new AudioManager();

        this.score = 0;
        this.round = 0;
        this.totalRounds = 5;
        this.timer = 30;
        this.timerIv = null;
        this.autoMode = false;
        this.gameActive = false;
        this.guessPlaced = false;
        this.guessLat = 0;
        this.guessLon = 0;
        this.currentLoc = null;
        this.usedIndices = [];
        this.pins = [];
        this.highScore = parseInt(localStorage.getItem('geo_highScore') || '0');

        this._resize();
        window.addEventListener('resize', () => { this._resize(); this._renderMap(); this._drawPins(); });

        this.overlayBtn.addEventListener('click', () => this._startGame());
        this.canvas.addEventListener('click', (e) => this._mapClick(e));
        this.confirmBtn.addEventListener('click', () => this._confirmGuess());
        this.nextBtn.addEventListener('click', () => this._nextRound());
        document.getElementById('auto-pilot-toggle').addEventListener('click', () => this._toggleAuto());
        document.addEventListener('pointerdown', () => this.audio.wake(), { once: true });
    }

    _resize() {
        const p = this.canvas.parentElement;
        this.canvas.width = p.clientWidth;
        this.canvas.height = p.clientHeight;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
    }

    /* --- Projection: lon/lat → canvas x/y (Equirectangular) --- */
    _project(lon, lat) {
        const x = ((lon + 180) / 360) * this.W;
        const y = ((90 - lat) / 180) * this.H;
        return { x, y };
    }

    _unproject(x, y) {
        const lon = (x / this.W) * 360 - 180;
        const lat = 90 - (y / this.H) * 180;
        return { lat, lon };
    }

    /* --- Haversine distance (km) --- */
    _haversine(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /* --- Score from distance --- */
    _calcScore(distKm) {
        if (distKm < 50) return 5000;
        if (distKm < 150) return 4500;
        if (distKm < 300) return 4000;
        if (distKm < 600) return 3000;
        if (distKm < 1000) return 2000;
        if (distKm < 2000) return 1000;
        if (distKm < 4000) return 500;
        return Math.max(0, 200 - Math.floor(distKm / 100));
    }

    /* --- Render World Map --- */
    _renderMap() {
        const { ctx, W, H } = this;
        // Ocean
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0d1f3c');
        grad.addColorStop(0.5, '#0a1830');
        grad.addColorStop(1, '#081428');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let lon = -180; lon <= 180; lon += 30) {
            const { x } = this._project(lon, 0);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let lat = -90; lat <= 90; lat += 30) {
            const { y } = this._project(0, lat);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Special lines
        // Equator
        ctx.strokeStyle = 'rgba(0, 201, 167, 0.08)';
        ctx.lineWidth = 1;
        const eq = this._project(0, 0);
        ctx.beginPath(); ctx.moveTo(0, eq.y); ctx.lineTo(W, eq.y); ctx.stroke();

        // Continents
        CONTINENTS.forEach(c => {
            ctx.fillStyle = c.color;
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            c.points.forEach((p, i) => {
                const { x, y } = this._project(p[0], p[1]);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    }

    _drawPins() {
        const { ctx } = this;
        this.pins.forEach(pin => {
            const { x, y } = this._project(pin.lon, pin.lat);
            // Pin shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(x, y + 2, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Pin body
            ctx.fillStyle = pin.color;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x - 8, y - 12, x - 8, y - 22, x, y - 26);
            ctx.bezierCurveTo(x + 8, y - 22, x + 8, y - 12, x, y);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            // Pin dot
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(x, y - 18, 3, 0, Math.PI * 2); ctx.fill();
            // Label
            if (pin.label) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = '600 10px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(pin.label, x, y - 32);
            }
        });
    }

    _drawLine(lon1, lat1, lon2, lat2, color) {
        const p1 = this._project(lon1, lat1);
        const p2 = this._project(lon2, lat2);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /* --- Game Flow --- */
    _startGame() {
        this.audio.init();
        this.score = 0;
        this.round = 0;
        this.usedIndices = [];
        this.pins = [];
        this.gameActive = true;
        this.overlayEl.classList.remove('active');
        this._updateHUD();
        this._nextRound();
    }

    _nextRound() {
        this.round++;
        if (this.round > this.totalRounds) {
            this._endGame();
            return;
        }

        this.resultPanel.classList.remove('visible');
        this.guessPlaced = false;
        this.confirmBtn.disabled = true;
        this.pins = [];
        this.timer = 30;

        // Pick random location
        let idx;
        do { idx = Math.floor(Math.random() * LOCATIONS.length); }
        while (this.usedIndices.includes(idx));
        this.usedIndices.push(idx);
        this.currentLoc = LOCATIONS[idx];

        // Update clue panel
        this.clueEmoji.textContent = this.currentLoc.emoji;
        this.clueText.textContent = this.currentLoc.clue;
        this.roundIndicator.textContent = `第 ${this.round} 回合 / 共 ${this.totalRounds} 回合`;
        this.clueHints.innerHTML = '';
        this.currentLoc.hints.forEach(h => {
            const div = document.createElement('div');
            div.className = 'clue-hint';
            div.textContent = '💡 ' + h;
            this.clueHints.appendChild(div);
        });

        this._updateHUD();
        this._renderMap();
        this._startTimer();

        // Auto mode: guess after delay
        if (this.autoMode) {
            setTimeout(() => {
                if (!this.gameActive || this.guessPlaced) return;
                const loc = this.currentLoc;
                // Add some randomness to auto guess
                const jitterLat = (Math.random() - 0.5) * 6;
                const jitterLon = (Math.random() - 0.5) * 8;
                this.guessLat = loc.lat + jitterLat;
                this.guessLon = loc.lon + jitterLon;
                this.guessPlaced = true;
                this.pins = [{ lat: this.guessLat, lon: this.guessLon, color: '#ff6b6b', label: '猜測' }];
                this._renderMap();
                this._drawPins();
                this.confirmBtn.disabled = false;
                this.audio.play('pin');
                setTimeout(() => {
                    if (this.gameActive) this._confirmGuess();
                }, 800);
            }, 1500);
        }
    }

    _mapClick(e) {
        if (!this.gameActive || this.resultPanel.classList.contains('visible')) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const { lat, lon } = this._unproject(mx, my);

        this.guessLat = lat;
        this.guessLon = lon;
        this.guessPlaced = true;
        this.pins = [{ lat, lon, color: '#ff6b6b', label: '猜測' }];
        this._renderMap();
        this._drawPins();
        this.confirmBtn.disabled = false;
        this.audio.play('pin');
    }

    _confirmGuess() {
        if (!this.guessPlaced || !this.currentLoc) return;
        clearInterval(this.timerIv);

        const loc = this.currentLoc;
        const dist = this._haversine(this.guessLat, this.guessLon, loc.lat, loc.lon);
        const pts = this._calcScore(dist);
        this.score += pts;

        // Add correct pin
        this.pins.push({ lat: loc.lat, lon: loc.lon, color: '#2ed573', label: loc.name });
        this._renderMap();
        this._drawLine(this.guessLon, this.guessLat, loc.lon, loc.lat, 'rgba(255,165,0,0.5)');
        this._drawPins();

        // Result panel
        this.resultDist.textContent = Math.round(dist).toLocaleString() + ' km';
        this.resultLoc.textContent = `${loc.emoji} ${loc.name}，${loc.country}`;
        this.resultPts.textContent = `+${pts.toLocaleString()} 分`;
        this.resultPanel.classList.add('visible');

        if (dist < 150) this.audio.play('perfect');
        else this.audio.play('correct');

        this._updateHUD();

        // Auto next
        if (this.autoMode) {
            setTimeout(() => {
                if (this.gameActive) this._nextRound();
            }, 2200);
        }
    }

    _startTimer() {
        clearInterval(this.timerIv);
        this.timerIv = setInterval(() => {
            this.timer--;
            const m = Math.floor(this.timer / 60);
            const s = this.timer % 60;
            this.timerEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
            if (this.timer <= 10) this.timerEl.style.color = '#ff4757';
            else this.timerEl.style.color = '';

            if (this.timer <= 0) {
                clearInterval(this.timerIv);
                if (!this.guessPlaced) {
                    // Auto-place random guess
                    this.guessLat = (Math.random() - 0.5) * 140;
                    this.guessLon = (Math.random() - 0.5) * 340;
                    this.guessPlaced = true;
                }
                this._confirmGuess();
            }
        }, 1000);
    }

    _toggleAuto() {
        this.autoMode = !this.autoMode;
        this.autoStatusEl.textContent = this.autoMode ? 'ON' : 'OFF';
        document.getElementById('auto-pilot-toggle').classList.toggle('active', this.autoMode);

        if (this.autoMode && this.gameActive && !this.guessPlaced) {
            setTimeout(() => {
                if (!this.gameActive || this.guessPlaced) return;
                const loc = this.currentLoc;
                const jLat = (Math.random() - 0.5) * 6;
                const jLon = (Math.random() - 0.5) * 8;
                this.guessLat = loc.lat + jLat;
                this.guessLon = loc.lon + jLon;
                this.guessPlaced = true;
                this.pins = [{ lat: this.guessLat, lon: this.guessLon, color: '#ff6b6b', label: '猜測' }];
                this._renderMap();
                this._drawPins();
                this.confirmBtn.disabled = false;
                this.audio.play('pin');
                setTimeout(() => this._confirmGuess(), 600);
            }, 1000);
        }
    }

    _endGame() {
        this.gameActive = false;
        clearInterval(this.timerIv);
        this.resultPanel.classList.remove('visible');

        if (this.autoMode) {
            this.autoMode = false;
            this.autoStatusEl.textContent = 'OFF';
            document.getElementById('auto-pilot-toggle').classList.remove('active');
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('geo_highScore', String(this.highScore));
        }

        this.audio.play('end');

        const h2 = this.overlayEl.querySelector('h2');
        const sub = this.overlayEl.querySelector('.subtitle');
        h2.textContent = '🌍 探險結束！';
        const avg = Math.round(this.score / this.totalRounds);
        sub.innerHTML = `
            總分: <strong>${this.score.toLocaleString()}</strong><br>
            平均每回合: <strong>${avg.toLocaleString()} 分</strong><br>
            最高分: <strong>${this.highScore.toLocaleString()}</strong>
        `;
        this.overlayBtn.textContent = '再次探險';
        this.overlayEl.classList.add('active');
    }

    _updateHUD() {
        this.scoreEl.textContent = String(this.score).padStart(6, '0');
        this.roundEl.textContent = `${this.round}/${this.totalRounds}`;
    }
}

/* ============================================================
 * S5: BOOTSTRAP
 * ============================================================ */
document.addEventListener('DOMContentLoaded', () => { new EliteEngine(); });
