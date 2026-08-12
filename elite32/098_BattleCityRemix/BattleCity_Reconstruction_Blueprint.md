# 《鋼鐵雄心：五步精密重構藍圖》(BattleCity Remix: 5-Step Precision Reconstruction Blueprint)

本藍圖由 **UTT-v2.0 全體架構師** 針對《098_BattleCityRemix》專門編撰，完整提煉了從 UI 美學、戰場地圖引擎、碰撞死鎖修復到程序化音效的「軍工旗艦工程標準」。
只要按順序將以下 5 個 Prompt 複製並投射給具備 Canvas 與多檔案架構能力之 AI (如 Google Antigravity)，即可 100% 精確重構出具備「AutoPilot 導航、程序化爆炸音效與碰撞死鎖修復」的工業級大作。

---

### 🟢 步驟 1：鋼鐵擬態 UI 架構 (The Steel Glassmorphism UI Engine)
**【核心目標】**：建立暗黑鋼鐵主題背景與半透明 Glassmorphism HUD 介面，確立「軍工旗艦級」氛圍。

> **Prompt 1 (Instructional Design & UI):**
> "請為名為《Iron Heart Remix》的坦克大戰遊戲建立 `index.html` 與 `css/style.css` 基礎。
> 1. **鋼鐵主題 (Steel Theme)**：背景使用純黑 (`#000`)，容器使用深灰 (`#111`) 搭配極微透明白色邊框 (`rgba(255,255,255,0.05)`)。字體引入 Google Fonts 'Outfit' 以呈現現代軍工感。定義 CSS 變數系統：`--bg-steel: #1e1e1e`、`--accent-orange: #f39c12`、`--accent-fire: #e67e22`、`--glass-bg: rgba(255,255,255,0.05)`。
> 2. **玻璃擬態 HUD (Glassmorphism Header)**：頂部設計一條橫向 glass-header，使用 `backdrop-filter: blur(10px)` 與 `box-shadow: 0 4px 15px rgba(0,0,0,0.3)`。內含三個區塊：左側遊戲標題「🚜 鋼鐵雄心 IRON HEART REMIX」、中間三欄即時數據 (生命/敵方剩餘/分數)、右側兩顆迷你按鈕 (🤖 自動導航 ON/OFF + 🔄 重開局)。
> 3. **戰場區域**：中央放置 600×600 的 Canvas，外層包覆 `overflow: hidden` 與 `border: 2px solid #333` 的容器。
> 4. **覆蓋層系統**：設計「開始遊戲」與「任務失敗」兩種全螢幕覆蓋層，使用 `rgba(0,0,0,0.85)` 搭配 `backdrop-filter: blur(8px)`，內含橙色邊框的圓角卡片與 50px 圓角啟動按鈕。
> 5. **底部footer**：銘刻「FLAGSHIP REMASTERED | UTT-v2.0 INDUSTRIAL GRADE | COMMANDER PATRICIA HSU」。
> 請提供完整的 HTML 架構與高品質的 CSS 樣式代碼。"

---

### 🔵 步驟 2：20×20 戰場矩陣引擎 (The Battlefield Map Engine)
**【核心目標】**：建立 20×20 的整數陣列戰場，實現六種地形的純 Canvas 2D 程序化渲染——零 sprite、零圖片。

> **Prompt 2 (Map Architecture & Procedural Rendering):**
> "請實作戰場地圖引擎 `js/map.js`。
> 1. **地形編碼表 (Tile Index Protocol)**：建立 `BattleMap` 類別，管理 20×20 的二維整數陣列。每格 `tileSize = 600/20 = 30px`。地形代碼：0=空地（不渲染）、1=磚牆（可摧毀）、2=鋼牆（不可摧毀）、3=水域（阻擋坦克）、4=叢林（視覺遮蔽覆蓋層）、9=老鷹基地（被擊中即遊戲結束）。
> 2. **程序化磚牆渲染 (case 1)**：填充紫色 (`#8e44ad`)，內部繪製兩個錯位的半尺寸矩形產生磚紋。頂部加 2px 白色高光線 (`rgba(255,255,255,0.1)`) 模擬光照。
> 3. **程序化鋼板渲染 (case 2)**：使用三段式線性漸層 (`#bdc3c7` → `#7f8c8d` → `#2c3e50`) 從左上到右下渲染金屬質感。四個角落各繪製一顆 2×2px 的白色鉚釘 (`#ecf0f1`)。
> 4. **水域渲染 (case 3)**：填充藍色 (`#2980b9`)，中間橫線使用半透明白色描邊模擬水面折射。
> 5. **老鷹基地渲染 (case 9)**：關鍵！啟用 `shadowBlur=10, shadowColor='#f39c12'` 產生金色光暈。使用兩條 `quadraticCurveTo` 貝塞爾曲線繪製老鷹輪廓 (`#f1c40f`)，中心加一根 4×10px 的橙色核心柱 (`#d35400`)。繪製完畢後必須將 shadowBlur 歸零。
> 6. **叢林覆蓋層 (drawOverlay)**：設計獨立的 `drawOverlay()` 方法，在坦克繪製「之後」調用，以 `rgba(46, 204, 113, 0.4)` 半透明覆蓋 case 4 的格子，實現坦克隱藏效果。
> 7. **Stage 1 關卡資料**：在 main.js 中硬編碼 20×20 的二維陣列，包含合理的磚牆走廊、中央鋼鐵堡壘 (2×4 閉合矩形)、底部老鷹保護圍牆、水域障礙區、兩處叢林隱蔽區。"

---

### 🧠 步驟 3：坦克工廠與碰撞死鎖偵破 (Tank Factory, Four-Corner Inset & Deadlock Fix)
**【核心目標】**：實作 OOP 坦克類別 (一類別雙角色)、Four-Corner Inset 碰撞偵測解決 32px vs 30px 對齊問題、並修復敵方坦克的「碰撞死鎖」Bug。

> **Prompt 3 (Xavier's OOP Architecture & Ada's Collision Mathematics):**
> "請實作 `js/tank.js` (坦克工廠) 與 `js/main.js` 中的碰撞系統。
> 1. **OOP 坦克工廠 (Tank Class)**：單一 `Tank` 類別同時產生玩家 (藍 `#3498db`, 速度 3px) 與敵人 (紅 `#ff4757`, 速度 2px)。direction 使用整數 0=上、1=右、2=下、3=左。繪製時使用 `ctx.translate` + `ctx.rotate(dir * Math.PI / 2)` 實現零三角函數旋轉。砲管固定繪製在本地座標上方，旋轉後自動指向正確方向。
> 2. **子彈系統**：每輛坦克維護 `bullets[]` 陣列。火力冷卻 800ms (`Date.now() - lastFire`)。子彈速度 6px/frame。⚠️ **重要**：子彈更新的陣列遍歷必須使用**倒序 for 迴圈** (`for(let i=bullets.length-1; i>=0; i--)`) 搭配 splice，絕對禁止 forEach + splice 反模式（違反陣列倒序消除法則）。
> 3. **Four-Corner Inset 碰撞偵測 (核心演算法)**：坦克 32×32px，地圖格子 30×30px。直接用坦克角落判斷會卡住。解法：將四個角各內縮 `inset = 4px`，形成 24×24 的有效碰撞體。四個角座標為 `(x+4, y+4), (x+28, y+4), (x+4, y+28), (x+28, y+28)`。使用 `Math.floor(corner / 30)` 轉換為格子索引，若任一角命中 `[1,2,3,9]` 則阻擋移動。
> 4. **🐛 碰撞死鎖修復 (autoTurnTimer)**：敵方坦克被阻擋時，若僅「每幀隨機換方向」會陷入「方向抖動死鎖」(在兩個被阻方向間無限振盪)。修復方案：被阻擋時隨機選新方向，但**鎖定 30 幀 (autoTurnTimer=30)** 不再改變，給予坦克「耐心」嘗試該方向。此修正必須**同時套用到 AutoPilot 和敵方 AI**，避免傳播失敗。
> 5. **子彈 vs 地形碰撞 (Coordinate Space Transform)**：將子彈的 pixel 座標透過 `Math.floor(y/30)` 轉換為 grid 座標。brick(1) → 摧毀 (`grid[r][c]=0`)、steel(2) → 子彈消失、eagle(9) → 觸發 `gameOverBase` 事件。
> 6. **子彈 vs 坦克碰撞**：簡易 AABB 範圍檢測。命中敵人 → splice 移除 + 粒子爆炸 + 螢幕震動 + 分數 +100 + 嘗試重生。"

---

### 🎹 步驟 4：程序化音效與粒子爆炸系統 (Procedural Audio Synthesis & Particle VFX)
**【核心目標】**：實作零音效檔案的 Web Audio API 即時合成三種戰場音效，以及橙色粒子搭配螢幕震動的衝擊反饋。

> **Prompt 4 (Audio Engineering & Emotional Impact):**
> "請實作 `js/audio.js` 與粒子系統，徹底打破靜態遊戲的沉悶。
> 1. **零資產合成器 (Web Audio API)**：不使用任何 MP3 或音效檔案！建立 `AudioManager` 類別。
>    - **引擎低鳴 (playEngine)**：Sawtooth 鋸齒波、頻率 60Hz、gain=0.01 (微弱)、無限持續。呼叫後存入 `this.engineOsc` 以便後續控制。
>    - **砲擊衝擊 (playFire)**：Triangle 三角波、起始 200Hz → 指數衰減至 10Hz、持續 0.1 秒、gain 從 0.3 線性衰減至 0。
>    - **爆炸音效 (playExplosion)**：產生 0.4 秒的白噪音 Buffer (`Math.random() * 2 - 1`)，通過 BiquadFilter lowpass (400Hz → 40Hz 指數衰減)，gain 從 0.5 線性衰減至 0。每次爆炸因隨機性而音色略有不同。
>    - **瀏覽器自動播放政策**：AudioContext 必須在使用者點擊「全面開火」按鈕時才初始化 (`init()`)。
> 2. **橙色粒子系統 (spawnParticles)**：爆炸時從中心座標發射 15 顆粒子。屬性：XY 速度各 `[-4, +4]` 隨機、壽命從 1.0 每幀遞減 0.05、尺寸 2-6px 隨機。顏色固定橙色 `rgba(243, 156, 18, life)` 搭配 alpha 隨壽命衰減。
> 3. **螢幕震動反饋 (Screen Shake)**：命中敵人時 `shakeIntensity = 10`、自機被擊中時 `shakeIntensity = 20`。每幀透過 `ctx.translate(random, random)` 偏移畫布，intensity 以 `×0.9` 指數衰減歸零。"

---

### 🧬 步驟 5：AutoPilot AI 導航與最終整合 (AutoPilot Heuristic & Final Assembly)
**【核心目標】**：整合自動導航的 O(1) 貪婪啟發式、敵方 AI 行為、重生系統、HUD 即時更新。

> **Prompt 5 (AI Navigation & Full Orchestration):**
> "最後一步，請在 `js/main.js` 中完成 AutoPilot AI 與全系統整合。
> 1. **O(1) 貪婪啟發導航 (AutoPilot)**：切換按鈕控制 `autoPilot` 布林值。啟用後，每幀計算與 `enemies[0]` 的 dx/dy 差值，若 |dx|>|dy| 則水平追蹤 (dir=1 或 3)，反之垂直追蹤 (dir=0 或 2)。碰撞阻擋時隨機方向 + 30 幀承諾鎖。5% 機率每幀自動開火。
> 2. **敵方 AI 行為**：同時維持最多 4 輛敵方坦克。三個出生點 (x=0, 240, 570) 頂端生成，初始面朝下 (dir=2)。2% 機率每幀隨機換方向並開火。碰撞阻擋時同樣使用 30 幀承諾鎖（對齊步驟 3 的 Bug 修正）。
> 3. **重生調度 (Spawn Manager)**：總共 20 輛敵人。每消滅一輛立即嘗試補充至場上 4 輛。HUD 即時更新剩餘敵方數與分數 (5 位數字前補零)。
> 4. **遊戲結束條件**：①敵方子彈命中玩家 → gameOverTrigger()。②老鷹基地被任何子彈擊中 → 透過 `CustomEvent('gameOverBase')` 觸發。結束時顯示「任務失敗」覆蓋層，30 粒子大爆炸，shakeIntensity=20。
> 5. **鍵盤操控 (Manual Control)**：WASD/方向鍵控制方向與移動，空白鍵開火。每次按鍵先計算 nextX/nextY，通過 Four-Corner Inset 碰撞檢測後才更新座標。
> 6. **requestAnimationFrame 主迴圈順序**：shake 偏移 → clearRect → 地圖繪製 → 粒子更新 → HUD 更新 → AutoPilot 邏輯 → 玩家繪製/更新 → 敵方繪製/更新/碰撞 → requestAnimationFrame → ctx.restore。"

---

### 📊 五步依賴鏈 (Dependency Chain)

```
步驟 1 (UI)  →  純視覺，無邏輯依賴
     ↓
步驟 2 (Map) →  依賴步驟 1 的 Canvas 容器
     ↓
步驟 3 (Tank & Collision) →  依賴步驟 2 的 grid 陣列
     ↓
步驟 4 (Audio & VFX) →  依賴步驟 3 的碰撞事件
     ↓
步驟 5 (AI & Integration) →  整合所有模組，完成閉環
```
