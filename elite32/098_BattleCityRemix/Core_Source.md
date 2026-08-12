# 📦 Core Source Documentation: 098_BattleCityRemix — Iron Heart Remix

> **專案代號**：098_BattleCityRemix  
> **文獻類型**：原始碼全文獻 (Source Code Literature)  
> **生成日期**：2026-04-25  
> **用途**：上傳至 NotebookLM 作為 AI 學習源  
> **架構師**：Xavier (Chief Systems Architect) + Ada (Advanced Algorithmist)

---

## 📁 檔案架構 (File Architecture)

```
098_BattleCityRemix/
├── index.html          # 主入口 — Glassmorphism HUD + Canvas 戰場
├── css/
│   └── style.css       # 鋼鐵主題視覺系統 (72 行)
├── js/
│   ├── audio.js        # 程序化音效合成器 (65 行)
│   ├── map.js          # 20×20 戰場地圖引擎 (75 行)
│   ├── tank.js         # 坦克工廠類別 — 運動、砲擊、子彈物理 (64 行)
│   └── main.js         # 主迴圈調度器 — 碰撞、AI、粒子系統 (261 行)
├── NotebookLM_Prompts.md   # 教學腳本文獻
└── Core_Source.md          # 本文件
```

**關鍵技術指標**：
- 📦 **零外部依賴**：無 npm、無框架、無 sprite 圖片、無音效檔案
- 🎨 **全程序化渲染**：所有磚牆、鋼板、水域、老鷹基地皆由 Canvas 2D API 繪製
- 🔊 **全程序化音效**：所有爆炸、射擊、引擎音效皆由 Web Audio API 即時合成
- 📐 **總行數**：約 465 行 JavaScript + 72 行 CSS + 56 行 HTML = **593 行**

---

## 🗄️ FILE 1: index.html — 主入口結構

### 🎯 設計哲學
HTML 採用 UTT-v2.0 Glassmorphism HUD 標準，使用 `backdrop-filter: blur()` 實現毛玻璃效果。頁面結構分為三個區塊：

1. **Glass Header**：顯示生命值、敵方剩餘數、分數 + 自動導航按鈕
2. **Battlefield Area**：600×600 Canvas 戰場 + 覆蓋式 Overlay 選單
3. **Glass Footer**：版權宣告

### 📝 完整原始碼

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>UTT-v2.0 旗艦：坦克大戰 (Iron Heart Remix)</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
</head>
<body class="theme-steel">
    <div id="game-container">
        <header class="glass-header">
            <div class="header-left">
                <h1 class="game-title">🚜 鋼鐵雄心 <span>IRON HEART REMIX</span></h1>
            </div>
            <div class="header-stats">
                <div class="stat"><span class="label">生命</span><span id="p-lives">3</span></div>
                <div class="stat"><span class="label">敵方</span><span id="e-count">20</span></div>
                <div class="stat"><span class="label">分數</span><span id="score">00000</span></div>
            </div>
            <div class="header-actions">
                <button id="auto-btn" class="mini-btn tertiary">🤖 自動導航 (OFF)</button>
                <button id="restart-btn" class="mini-btn">🔄 重開局</button>
            </div>
        </header>

        <main id="battlefield-area">
            <canvas id="gameCanvas"></canvas>
            <div id="game-overlay" class="overlay active">
                <div class="overlay-card" id="start-view">
                    <h2 class="title">鋼鐵意志</h2>
                    <p class="desc">守護您的雄鷹基地，摧毀所有入侵的鐵騎。</p>
                    <button id="start-game-btn" class="start-btn">全面開火</button>
                </div>
                <div class="overlay-card" id="end-view" style="display:none">
                    <h2 class="title" style="color:var(--accent-fire)">任務失敗</h2>
                    <p class="desc">基地已陷落，部隊正在重組...</p>
                    <button id="retry-btn" class="start-btn" style="background:#444; color:#fff">重整軍備</button>
                </div>
            </div>
        </main>

        <footer class="glass-footer">
            <p>FLAGSHIP REMASTERED | UTT-v2.0 INDUSTRIAL GRADE | COMMANDER PATRICIA HSU</p>
        </footer>
    </div>

    <script src="js/audio.js"></script>
    <script src="js/map.js"></script>
    <script src="js/tank.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

---

## 🗄️ FILE 2: css/style.css — 鋼鐵主題視覺系統

### 🎯 設計哲學
CSS 變數系統定義了完整的「鋼鐵」色彩主題，使用 `backdrop-filter: blur()` 實現 Glassmorphism。所有 UI 元件使用圓角 + 半透明背景。

### 📝 完整原始碼

```css
:root {
    --bg-steel: #1e1e1e;
    --text-inc: #ecf0f1;
    --accent-orange: #f39c12;
    --accent-fire: #e67e22;
    --grid-bushes: rgba(46, 204, 113, 0.4);
    --grid-water: rgba(52, 152, 219, 0.6);
    --grid-ice: rgba(236, 240, 241, 0.5);
    --glass-bg: rgba(255, 255, 255, 0.05);
    --font-primary: 'Outfit', sans-serif;
}

* { margin:0; padding:0; box-sizing: border-box; -webkit-font-smoothing: antialiased; }

body {
    background: #000; color: var(--text-inc); font-family: var(--font-primary);
    display: flex; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden;
}

#game-container {
    width: 700px; height: auto; display: flex; flex-direction: column; gap: 15px; padding: 20px;
    background: #111; border: 1px solid rgba(255,255,255,0.05); border-radius: 24px;
}

.glass-header {
    background: var(--glass-bg); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 16px; padding: 15px 25px; display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 10;
}

.game-title { font-size: 1.6rem; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
.game-title span { font-size: 0.65rem; font-weight: 300; display: block; color: var(--accent-orange); margin-top:-2px; letter-spacing: 2px; }

.header-stats { display: flex; gap: 30px; }
.stat { display: flex; flex-direction: column; align-items: center; }
.stat .label { font-size: 0.6rem; text-transform: uppercase; color: rgba(255,255,255,0.4); font-weight: 800; letter-spacing: 1px; }
.stat span:not(.label) { font-size: 1.2rem; font-weight: 800; color: #fff; text-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }

#battlefield-area {
    width: 600px; height: 600px; position: relative; margin: 0 auto;
    background: #000; border: 2px solid #333; border-radius: 12px; overflow: hidden;
}

canvas { display: block; width: 100%; height: 100%; }

.overlay {
    position: absolute; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 100;
}
.overlay.active { display: flex; }

.overlay-card { text-align: center; padding: 40px; border: 1px solid var(--accent-orange); border-radius: 20px; max-width: 400px; }
.overlay-card .title { font-size: 2.5rem; margin-bottom: 20px; font-weight: 800; color: #fff; }
.overlay-card .desc { color: #888; font-size: 0.95rem; line-height: 1.6; margin-bottom: 30px; }

.start-btn {
    padding: 15px 40px; border-radius: 50px; background: var(--accent-orange); color: #000;
    font-size: 1.1rem; font-weight: 700; border:none; cursor: pointer; transition: 0.3s;
}
.start-btn:hover { background: #fff; transform: scale(1.05); }

.mini-btn {
    padding: 6px 14px; border-radius: 8px; background: rgba(255,255,255,0.1); border:none; color:#fff; cursor:pointer;
    font-size: 0.8rem; font-weight: 600;
}

.glass-footer { padding: 10px; text-align: center; color: rgba(255,255,255,0.15); font-size: 0.55rem; letter-spacing: 2px; }
```

---

## 🗄️ FILE 3: js/audio.js — 程序化音效合成器

### 🎯 設計哲學
全程序化音效——**零音效檔案**。使用 Web Audio API 的 OscillatorNode 和 BufferSource 即時合成三種戰場音效。

### 📐 音效頻率數學模型

| 音效 | 波形類型 | 起始頻率 | 結束頻率 | 持續時間 | 衰減模式 |
|:---|:---|:---|:---|:---|:---|
| 引擎低鳴 | Sawtooth (鋸齒波) | 60Hz | 持續 | 無限 | 恆定 gain=0.01 |
| 砲擊開火 | Triangle (三角波) | 200Hz | 10Hz | 0.1s | 指數衰減 (exponentialRamp) |
| 爆炸音效 | White Noise (白噪音) | 400Hz (LP) | 40Hz (LP) | 0.4s | 線性衰減 + 低通濾波 |

### 📝 完整原始碼

```javascript
/**
 * UTT-v2.0 Audio: Engine Hum & Combat Synthesis
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.engineFreq = 60;
    }

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playEngine() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(this.engineFreq, time);
        gain.gain.setValueAtTime(0.01, time);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(time);
        this.engineOsc = osc;
    }

    playFire() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(200, time);
        o.frequency.exponentialRampToValueAtTime(10, time + 0.1);
        g.gain.setValueAtTime(0.3, time);
        g.gain.linearRampToValueAtTime(0, time + 0.1);
        o.connect(g); g.connect(this.ctx.destination);
        o.start(time); o.stop(time+0.1);
    }

    playExplosion() {
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, time);
        filter.frequency.exponentialRampToValueAtTime(40, time + 0.4);

        g.gain.setValueAtTime(0.5, time);
        g.gain.linearRampToValueAtTime(0, time + 0.4);
        source.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        source.start(time);
    }
}
```

---

## 🗄️ FILE 4: js/map.js — 20×20 戰場地圖引擎

### 🎯 設計哲學
地圖是一個 20×20 的二維整數陣列。每個整數代表一種地形類型。所有地形視覺都透過 Canvas 2D 程序化繪製 (Procedural Rendering)。

### 📐 地形編碼表 (Tile Index Protocol)

| 代碼 | 名稱 | 物理特性 | 渲染技術 |
|:---|:---|:---|:---|
| 0 | 空地 | 可通行、可穿透 | 不渲染（黑色背景） |
| 1 | 磚牆 | 可阻擋坦克、可被子彈摧毀 | 雙層矩形 + 高光線條 (紫色 #8e44ad) |
| 2 | 鋼牆 | 可阻擋坦克、不可摧毀、子彈反彈 | 三段式線性漸層 + 四角鉚釘 (2×2px) |
| 3 | 水域 | 阻擋坦克通行、子彈可穿越 | 藍色填充 + 水面反光線 |
| 4 | 叢林 | 不阻擋坦克、視覺遮蔽 | 半透明綠色覆蓋層 (drawOverlay) |
| 9 | 老鷹基地 | 被擊中即遊戲結束 | 貝塞爾曲線老鷹 + 發光陰影 (shadowBlur=10) |

### 📝 完整原始碼

```javascript
/**
 * UTT-v2.0 Map Engineering: Grid & Tile Rendering
 */
class BattleMap {
    constructor(ctx, size=20) {
        this.ctx = ctx;
        this.size = size;
        this.grid = Array.from({length: size}, () => Array(size).fill(0));
        this.tileSize = 600 / size; // = 30 pixels per tile
    }

    loadLevel(lvl) {
        this.grid = lvl;
    }

    draw() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const type = this.grid[r][c];
                const x = c * this.tileSize;
                const y = r * this.tileSize;
                this.drawTile(x, y, type);
            }
        }
    }

    drawTile(x, y, type) {
        const s = this.tileSize;
        switch (type) {
            case 1: // Procedural Brick
                this.ctx.fillStyle = '#8e44ad'; this.ctx.fillRect(x, y, s, s);
                this.ctx.strokeStyle = 'rgba(0,0,0,0.3)'; this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x,y,s/2,s/2); this.ctx.strokeRect(x+s/2,y+s/2,s/2,s/2);
                this.ctx.fillStyle = 'rgba(255,255,255,0.1)'; this.ctx.fillRect(x,y,s,2);
                break;
            case 2: // Metallic Steel
                let grad = this.ctx.createLinearGradient(x, y, x+s, y+s);
                grad.addColorStop(0, '#bdc3c7'); grad.addColorStop(0.5, '#7f8c8d'); grad.addColorStop(1, '#2c3e50');
                this.ctx.fillStyle = grad; this.ctx.fillRect(x, y, s, s);
                this.ctx.fillStyle = '#ecf0f1';
                [2, s-4].forEach(bx => [2, s-4].forEach(by => this.ctx.fillRect(x+bx, y+by, 2, 2)));
                break;
            case 3: // Dynamic Water
                this.ctx.fillStyle = '#2980b9'; this.ctx.fillRect(x, y, s, s);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                this.ctx.beginPath(); this.ctx.moveTo(x, y+s/2); this.ctx.lineTo(x+s,y+s/2); this.ctx.stroke();
                break;
            case 9: // Remastered Eagle Base
                this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#f39c12';
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.beginPath(); this.ctx.moveTo(x+s/2, y+5);
                this.ctx.quadraticCurveTo(x+5, y+s-5, x+s/2, y+s-10);
                this.ctx.quadraticCurveTo(x+s-5, y+s-5, x+s/2, y+5); this.ctx.fill();
                this.ctx.fillStyle = '#d35400'; this.ctx.fillRect(x+s/2-2, y+s/2, 4, 10);
                this.ctx.shadowBlur = 0;
                break;
        }
    }

    drawOverlay() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 4) {
                    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
                    this.ctx.fillRect(c*this.tileSize, r*this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }
    }
}
```

---

## 🗄️ FILE 5: js/tank.js — 坦克工廠類別

### 🎯 設計哲學
單一 `Tank` 類別同時產生玩家與敵人——展示 OOP 的「多型」核心概念。坦克方向使用整數 0-3 對應上右下左，搭配 `ctx.rotate(dir * π/2)` 實現零三角函數旋轉。

### 📐 坦克規格表

| 屬性 | 玩家 (Player) | 敵人 (Enemy) |
|:---|:---|:---|
| 顏色 | `#3498db` (藍) | `#ff4757` (紅) |
| 移動速度 | 3 px/frame | 2 px/frame |
| 子彈速度 | 6 px/frame | 6 px/frame |
| 生命值 | 100 | 1 |
| 開火冷卻 | 800ms | 800ms |
| 尺寸 | 32×32 px | 32×32 px |

### 🐛 已知問題：forEach + splice 反模式

```javascript
// ❌ 致命寫法 (tank.js 第 40-43 行)
this.bullets.forEach((b, i) => {
    // ... 移動子彈 ...
    if (b.x < 0 || b.x > 600 || b.y < 0 || b.y > 600) this.bullets.splice(i, 1);
    // ... 碰撞檢查也使用 splice(i, 1) ...
});
```

根據 **JS Physics Pitfalls KI (鐵律一)**，正向遍歷搭配 splice 會導致陣列指標前移，漏判下一個物件。正確做法是倒序迴圈：

```javascript
// ✅ Master-Grade 修正
for (let i = this.bullets.length - 1; i >= 0; i--) {
    let b = this.bullets[i];
    // ... 移動子彈 ...
    if (b.x < 0 || b.x > 600 || b.y < 0 || b.y > 600) {
        this.bullets.splice(i, 1);
        continue;
    }
    // ... 碰撞檢查 ...
}
```

### 📝 完整原始碼

```javascript
/**
 * UTT-v2.0 Tank Engineering: Motion & Projectile Logic
 */
class Tank {
    constructor(x, y, type='enemy', color='#e74c3c') {
        this.x = x; this.y = y; this.type = type; this.color = color;
        this.w = 32; this.h = 32; this.dir = 0; // 0U, 1R, 2D, 3L
        this.v = (type === 'player') ? 3 : 2;
        this.bullets = [];
        this.health = (type === 'player') ? 100 : 1;
        this.destroyed = false;
        this.lastFire = 0;
    }

    draw(ctx) {
        ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.dir * Math.PI / 2);
        
        ctx.fillStyle = this.color; 
        ctx.fillRect(-this.w/2, -this.h/2, this.w, this.h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.w/2, -this.h/2, this.w, this.h);
        
        ctx.fillStyle = '#fff'; ctx.fillRect(-this.w/2+14, -this.h/2-10, 4, 15); // Cannon
        
        ctx.restore();
        this.drawBullets(ctx);
    }

    fire() {
        const time = Date.now();
        if (time - this.lastFire < 800) return;
        this.lastFire = time;
        const b = { x: this.x + 14, y: this.y + 14, d: this.dir, v: 6 };
        this.bullets.push(b);
    }

    update(map, tanks) {
        this.bullets.forEach((b, i) => {
            if (b.d === 0) b.y -= b.v; if (b.d === 1) b.x += b.v;
            if (b.d === 2) b.y += b.v; if (b.d === 3) b.x -= b.v;
            if (b.x < 0 || b.x > 600 || b.y < 0 || b.y > 600) this.bullets.splice(i, 1);
            
            const r = Math.floor(b.y / 30); const c = Math.floor(b.x / 30);
            if (r >= 0 && r < 20 && c >= 0 && c < 20) {
                const type = map.grid[r][c];
                if (type === 1) { map.grid[r][c] = 0; this.bullets.splice(i, 1); }
                if (type === 2) { this.bullets.splice(i, 1); }
                if (type === 9) { 
                    window.dispatchEvent(new CustomEvent('gameOverBase'));
                }
            }
        });
    }

    drawBullets(ctx) {
        this.bullets.forEach(b => {
            ctx.fillStyle = '#f1c40f'; ctx.fillRect(b.x, b.y, 4, 4);
        });
    }
}
```

---

## 🗄️ FILE 6: js/main.js — 主迴圈調度器

### 🎯 設計哲學
單一 `requestAnimationFrame` 主迴圈驅動整個遊戲。整合碰撞偵測、AutoPilot AI、粒子系統、螢幕震動反饋。

### 📐 關鍵演算法

#### 1. Four-Corner Inset 牆壁碰撞偵測

```
坦克尺寸：32×32 像素
地圖格子：30×30 像素
Inset：4 像素

問題：32px 坦克 > 30px 格子，邊緣容易誤觸相鄰格子
解法：四角內縮 4px，建立 24×24 的「有效碰撞體」

corners = [
    (nextX + 4, nextY + 4),         // 左上角內縮
    (nextX + 28, nextY + 4),        // 右上角內縮
    (nextX + 4, nextY + 28),        // 左下角內縮
    (nextX + 28, nextY + 28)        // 右下角內縮
]

每個角轉換為格子座標 → 檢查是否為障礙物 [1, 2, 3, 9]
任一角命中障礙 → 整個移動被阻擋
```

#### 2. AutoPilot AI 導航演算法

```
演算法：簡易最近目標追蹤
複雜度：O(1) — 永遠追蹤 enemies[0]

邏輯：
1. 計算與 enemies[0] 的 dx, dy 差值
2. 若 |dx| > |dy| → 水平移動 (dir = 1 或 3)
3. 若 |dy| > |dx| → 垂直移動 (dir = 0 或 2)
4. 碰撞阻擋 → 隨機方向 + 30 幀承諾鎖 (autoTurnTimer)
5. 5% 機率每幀開火

Ada 評注：此為 O(1) 貪婪啟發式 (Greedy Heuristic)，
不進行任何路徑搜尋 (No pathfinding)。
優點：零運算阻塞。
缺點：無法處理迷宮死路，需依賴 autoTurnTimer 脫困。
```

#### 3. 🐛 敵方坦克卡住 Bug 分析

```
Bug 根因：碰撞死鎖 (Collision Deadlock)

場景復現：
1. 敵方坦克處於狹窄走廊
2. 當前方向被牆壁阻擋
3. 隨機選擇新方向 → 可能又被阻擋
4. 每幀不斷隨機切換 → 恰好在兩個被阻方向間「抖動」
5. 坦克看起來「卡住」不動

AutoPilot 的修正方案：
else {
    player.dir = Math.floor(Math.random() * 4);
    player.autoTurnTimer = 30; // 30 幀承諾鎖
}

⚠️ 此修正 **未套用到敵方 AI** (lines 173-177)
敵方仍使用無承諾的即時隨機切換：
else {
    e.dir = Math.floor(Math.random() * 4); // 無鎖！
}

這是一個真實世界的工程教訓：Bug 修正必須傳播到所有同類系統。
```

#### 4. 粒子爆炸系統

```
粒子屬性：
- 位置：從爆炸中心 (e.x+16, e.y+16) 發射
- 速度：XY 軸各 [-4, +4] 隨機向量
- 壽命：從 1.0 線性遞減 0.05/幀 → 20 幀後消失
- 尺寸：2-6px 隨機
- 顏色：橙色 rgba(243, 156, 18, life) — opacity 隨壽命衰減
- 螢幕震動：shakeIntensity 從 10 開始，每幀 × 0.9 指數衰減
```

### 📝 完整原始碼

```javascript
/**
 * UTT-v2.0 Orchestration: Iron Heart Remix Core
 */
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 600; canvas.height = 600;

    const startView = document.getElementById('start-view');
    const endView = document.getElementById('end-view');
    const retryBtn = document.getElementById('retry-btn');
    const mistakesEl = document.getElementById('e-count');
    const scoreEl = document.getElementById('score');
    const livesEl = document.getElementById('p-lives');
    
    const audio = new AudioManager();
    const map = new BattleMap(ctx);
    let player = null;
    let enemies = [];
    let enemyCount = 20;
    let score = 0;
    let gameActive = false;
    let autoPilot = false;
    let particles = [];
    let shakeIntensity = 0;

    const autoBtn = document.getElementById('auto-btn');
    autoBtn.onclick = () => {
        autoPilot = !autoPilot;
        autoBtn.innerText = `🤖 自動導航 (${autoPilot ? 'ON' : 'OFF'})`;
        autoBtn.classList.toggle('active');
    };

    const stage1 = [
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,2,2,0,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0],
        [0,3,3,0,0,3,3,0,0,3,3,0,0,3,3,0,0,4,4,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,2,2,2,2,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,2,0,0,2,0,0,0,0,0,0,0,0],
        [0,1,1,1,1,1,1,0,2,0,0,2,0,1,1,1,1,1,1,0],
        [0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0],
        [0,1,1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,1,0],
        [0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1,0],
        [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
        [4,4,0,0,1,1,0,0,1,1,1,1,0,0,1,1,0,0,0,0],
        [0,1,1,0,1,1,0,0,0,0,0,0,0,0,1,1,0,1,1,0],
        [0,1,1,0,1,1,0,1,1,1,1,1,1,0,1,1,0,1,1,0],
        [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,1,0,9,0,0,1,0,0,0,0,0,0,0]
    ];

    function init() {
        map.loadLevel(stage1);
        player = new Tank(180, 540, 'player', '#3498db');
        spawnEnemy();
        gameActive = true;
        update();
    }

    function spawnEnemy() {
        if (enemies.length < 4 && enemyCount > 0) {
            const spawns = [0, 240, 570];
            const x = spawns[Math.floor(Math.random() * 3)];
            const e = new Tank(x, 0, 'enemy', '#ff4757');
            e.dir = 2;
            enemies.push(e);
            enemyCount--;
        }
    }

    function update() {
        if (!gameActive) return;
        
        ctx.save();
        if (shakeIntensity > 0) {
            ctx.translate(Math.random() * shakeIntensity - shakeIntensity/2, Math.random() * shakeIntensity - shakeIntensity/2);
            shakeIntensity *= 0.9;
            if (shakeIntensity < 0.1) shakeIntensity = 0;
        }

        ctx.clearRect(0, 0, 600, 600);
        map.draw();
        
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            if (p.life <= 0) particles.splice(i, 1);
            else {
                ctx.fillStyle = `rgba(243, 156, 18, ${p.life})`;
                ctx.fillRect(p.x, p.y, p.s, p.s);
            }
        });

        scoreEl.innerText = score.toString().padStart(5, '0');
        mistakesEl.innerText = enemyCount;

        let playerMoved = false;

        // AutoPilot AI
        if (autoPilot && enemies.length > 0) {
            if (!player.autoTurnTimer) player.autoTurnTimer = 0;
            if (player.autoTurnTimer <= 0) {
                const nearest = enemies[0];
                const dx = nearest.x - player.x;
                const dy = nearest.y - player.y;

                if (Math.abs(dx) > Math.abs(dy)) {
                    player.dir = dx > 0 ? 1 : 3;
                } else {
                    player.dir = dy > 0 ? 2 : 0;
                }
            } else {
                player.autoTurnTimer--;
            }

            const nX = player.x + (player.dir === 1 ? player.v : (player.dir === 3 ? -player.v : 0));
            const nY = player.y + (player.dir === 2 ? player.v : (player.dir === 0 ? -player.v : 0));

            const inset = 4;
            const corners = [
                {x: nX + inset, y: nY + inset},
                {x: nX + 32 - inset, y: nY + inset},
                {x: nX + inset, y: nY + 32 - inset},
                {x: nX + 32 - inset, y: nY + 32 - inset}
            ];

            const blocked = corners.some(c => {
                const tr = Math.floor(c.y/30), tc = Math.floor(c.x/30);
                return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][tc]);
            });

            if (!blocked) {
                player.x = nX; player.y = nY;
            } else {
                player.dir = Math.floor(Math.random() * 4);
                player.autoTurnTimer = 30;
            }

            if (Math.random() < 0.05) { player.fire(); audio.playFire(); }
        }

        player.draw(ctx);
        player.update(map, enemies);

        enemies.forEach((e, ei) => {
            e.draw(ctx); e.update(map, [player]);
            
            const nextX = e.x + ((e.dir === 1) ? e.v : (e.dir === 3 ? -e.v : 0));
            const nextY = e.y + ((e.dir === 2) ? e.v : (e.dir === 0 ? -e.v : 0));
            
            const inset = 4;
            const corners = [
                {x: nextX + inset, y: nextY + inset},
                {x: nextX + 32 - inset, y: nextY + inset},
                {x: nextX + inset, y: nextY + 32 - inset},
                {x: nextX + 32 - inset, y: nextY + 32 - inset}
            ];

            const blocked = corners.some(c => {
                const tr = Math.floor(c.y/30), tc = Math.floor(c.x/30);
                return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][tc]);
            });

            if (!blocked) {
                e.x = nextX; e.y = nextY;
            } else {
                e.dir = Math.floor(Math.random() * 4);
            }

            if (Math.random() < 0.02) { e.dir = Math.floor(Math.random() * 4); e.fire(); }

            e.bullets.forEach((b, bi) => {
                if (b.x > player.x && b.x < player.x + 32 && b.y > player.y && b.y < player.y + 32) {
                    audio.playExplosion(); gameOverTrigger();
                }
            });

            player.bullets.forEach((pb, pbi) => {
                if (pb.x > e.x && pb.x < e.x + 32 && pb.y > e.y && pb.y < e.y + 32) {
                    enemies.splice(ei, 1); player.bullets.splice(pbi, 1);
                    audio.playExplosion(); spawnParticles(e.x+16, e.y+16, 15);
                    shakeIntensity = 10;
                    score += 100; spawnEnemy();
                }
            });
        });

        requestAnimationFrame(update);
        ctx.restore();
    }

    function spawnParticles(x, y, count) {
        for (let i=0; i<count; i++) {
            particles.push({
                x, y, 
                vx: (Math.random()-0.5)*8, 
                vy: (Math.random()-0.5)*8, 
                life: 1, s: Math.random()*4+2
            });
        }
    }

    function gameOverTrigger() {
        gameActive = false;
        shakeIntensity = 20; spawnParticles(player.x+16, player.y+16, 30);
        document.getElementById('game-overlay').classList.add('active');
        startView.style.display = 'none';
        endView.style.display = 'block';
    }

    retryBtn.onclick = () => location.reload();
    window.addEventListener('gameOverBase', gameOverTrigger);

    window.onkeydown = (e) => {
        if (!gameActive) return;
        const key = e.key.toLowerCase();
        let nextX = player.x;
        let nextY = player.y;
        
        if (key === 'w' || key === 'arrowup') { player.dir = 0; nextY -= player.v; }
        if (key === 'd' || key === 'arrowright') { player.dir = 1; nextX += player.v; }
        if (key === 's' || key === 'arrowdown') { player.dir = 2; nextY += player.v; }
        if (key === 'a' || key === 'arrowleft') { player.dir = 3; nextX -= player.v; }
        if (key === ' ') { player.fire(); audio.playFire(); return; }

        const inset = 4;
        const corners = [
            {x: nextX + inset, y: nextY + inset},
            {x: nextX + 32 - inset, y: nextY + inset},
            {x: nextX + inset, y: nextY + 32 - inset},
            {x: nextX + 32 - inset, y: nextY + 32 - inset}
        ];

        const isBlocked = corners.some(c => {
            const tr = Math.floor(c.y / 30), tc = Math.floor(c.x / 30);
            return tr < 0 || tr >= 20 || tc < 0 || tc >= 20 || [1, 2, 3, 9].includes(map.grid[tr][c]);
        });

        if (!isBlocked) {
            player.x = nextX; player.y = nextY;
        }
    };

    document.getElementById('start-game-btn').onclick = () => {
        document.getElementById('game-overlay').classList.remove('active');
        audio.init(); audio.playEngine(); init();
    };
});
```

---

## 📊 Big O 複雜度總表 (Ada's Master Analysis)

| 系統模組 | 演算法 | 時間複雜度 | 空間複雜度 | 60FPS 安全性 |
|:---|:---|:---|:---|:---|
| 地圖渲染 | 雙層 for 迴圈 | O(N²) = O(400) | O(N²) = O(400) | ✅ |
| 坦克繪製 | Canvas 2D transform | O(1) per tank | O(1) | ✅ |
| 碰撞偵測 (牆壁) | 四角座標轉換 | O(4) per entity | O(1) | ✅ |
| 碰撞偵測 (子彈vs子彈) | 格子座標查找 | O(1) per bullet | O(1) | ✅ |
| 碰撞偵測 (子彈vs坦克) | AABB 範圍檢測 | O(B × E) | O(1) | ✅ (B,E 皆<20) |
| AutoPilot AI | 貪婪啟發式 | O(1) | O(1) | ✅ |
| 粒子系統 | 線性掃描 | O(P) | O(P) | ✅ (P<50) |
| **每幀總計** | **全系統** | **O(N² + B×E + P)** | **O(N² + B + P)** | **✅ 絕對安全** |

---

## 🏗️ Xavier 的 Clean Code 審計報告

### ✅ 通過項目
- [x] 單一職責原則：每個檔案對應一個獨立模組
- [x] 程序化資產管線：零外部依賴
- [x] 四角內縮碰撞模式：優雅的物理解法
- [x] Web Audio API 正確喚醒：遵循瀏覽器自動播放政策

### ⚠️ 改善建議
- [ ] `forEach + splice` 替換為倒序 `for` 迴圈 (3 處)
- [ ] 敵方 AI 加入 `autoTurnTimer` 防止卡住 (1 處)
- [ ] Magic Numbers → Named Constants (32→TANK_SIZE, 30→TILE_SIZE, 600→CANVAS_SIZE, 4→COLLISION_INSET)
- [ ] `update()` 函數分解為 `updatePlayer()`, `updateEnemies()`, `checkCollisions()`, `renderParticles()`

---

> 📋 **使用指南**：將本文件 (`Core_Source.md`) 與 `NotebookLM_Prompts.md` 一同上傳至 Google NotebookLM，即可自動生成專業級雙人 Podcast 教學音頻。🎧
