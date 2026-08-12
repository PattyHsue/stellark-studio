# 《幾何律動：五步精密重構藍圖》(Tetris Remix: 5-Step Precision Reconstruction Blueprint)

本藍圖由 **UTT-v2.0 全體架構師** 針對《001_TetrisRemix》專門編撰，完整提煉了從 UI 美學、演算法邏輯到音效與特效的「旗艦工程標準」。
只要按順序將以下 5 個 Prompt 複製並投射給具備 Canvas 與多檔案架構能力之 AI (如 Google Antigravity)，即可 100% 精確重構出具備「自動駕駛、深空水母與諧波音訊」的工業級大作。

---

### 🟢 步驟 1：玻璃擬態 UI 架構 (The Glassmorphism UI Engine)
**【核心目標】**：建立深空漸層背景與半透明 Glassmorphism 介面，確立「旗艦級」氛圍。

> **Prompt 1 (Instructional Design & UI):**
> "請為名為《Tetris Remix》的俄羅斯方塊遊戲建立 `index.html` 與 `css/style.css` 基礎。
> 1. **深空主題 (Deep Space Theme)**：背景使用深色漸層 (如 `#0f0c29` 到 `#24243e`)。字體引入 Google Fonts 'Outfit' 與 'JetBrains Mono'以呈現科技感。
> 2. **玻璃擬態版面 (Glassmorphism)**：主視覺分為左(Hold 區)、中(10x20 遊戲主畫布，外加霓虹網格線)、右(Next 區與設定按鈕)。所有面板套用 `backdrop-filter: blur(10px)` 與微透明的白色邊框，營造深空漂浮感。
> 3. **控制器與覆蓋層控制**：加入「開始遊戲」全螢幕覆蓋層，且右側設定面板預留「輔助投射」、「自動駕駛」、「律動音樂」等迷你按鈕。
> 請提供完整的 HTML 架構與高品質的 CSS 樣式代碼。"

---

### 🔵 步驟 2：矩陣幾何引擎 (The Matrix GameCore)
**【核心目標】**：探討俄羅斯方塊碰撞、矩陣旋轉 (Rotate Matrix) 與 Wall Kick 校正的數學邏輯。

> **Prompt 2 (Algorithmic Logic):**
> "請實作遊戲核心邏輯 `js/shapes.js` 與 `js/engine.js`。
> 1. **幾何元數據 (Shapes)**：在 `shapes.js` 建立 I, J, L, O, S, T, Z 七種方塊的二維矩陣與明亮的專屬顏色 (Hex 碼)。
> 2. **陣列映射與碰撞 (Matrix & Collision)**：遊戲基於 10x20 的虛擬網格 (Grid)。請設計高效的碰撞偵測，以及當一行方陣被填滿時，將 `y` 軸切除 (splice) 並於頂部補齊零矩陣。
> 3. **三維旋轉與踢牆 (Rotation & Wall-Kick)**：實作純數學原地的矩陣翻轉 (先對角線對調，再依方向 reverse)。並加入簡易的 Wall-kick 機制，當旋轉後重疊邊界時，會嘗試平移 x 軸 $\pm 1$ 格來對齊。
> 4. **狀態解耦**：Engine.js 必須「純計算」，不可以有任何 DOM 調用。`drop()` 必須返回一個 Event 物件 (包含 landed, clearedLines 等)，以便後續 UI 處理。"

---

### 🧠 步驟 3：啟發式 AI 大腦 (The Heuristic Auto-Pilot)
**【核心目標】**：分析高度、消行、孔洞、平整度四項權重。並透過建立「絕對坐標系」解決 AI 的邏輯抖動。

> **Prompt 3 (Xavier's State Architecture & Ada's Mathematics):**
> "請實作 `js/ai.js` (啟發式 AI 大腦)，並在 `engine.js` 內確保坐標系正確。
> 1. **權重分析法 (Dellacherie System)**：實作 `TetrisAI`。針對當前盤面計算四大指標：聚合高度 (負權重)、消除行數 (正權重)、產生孔洞數 (極高負權重)、表面平整度 (中度負權重)。
> 2. **絕對基準校正 (Crucial Fix)**：為了避免 AI 在方塊落下時改變自身的最佳解而產生『抽搐與抖動』，請讓演算法在進入 `bestMove(engine)` 迴圈時，**強制讀取該形狀最初始、未經旋轉的矩陣 (Base Matrix)** 作為 0~3 次旋轉模擬的起點，確保旋轉基準的絕對性。
> 3. **移動節流 (Action Throttle)**：在主循環整合時，AI 的每一步位移需加入 `50ms` 的時間延遲，確保動作如人類般絲滑，而非 1 幀內瞬移。"

---

### 🎹 步驟 4：特效與諧波音頻 (Generative VFX & Harmonic Audio)
**【核心目標】**：實作純代碼的高能 Particle 粉碎與數學遞增合成器音效，賦予遊戲靈魂。

> **Prompt 4 (Emotional Impact & Audio Engineering):**
> "請實作 `js/audio.js` 與 `js/effects.js`，徹底打破純邏輯的極客感。
> 1. **零資產合成器 (Web Audio API)**：不使用 MP3！建立 `AudioManager`，當方塊觸底時播放低頻的 Triangle 波 (`playLand`)；更重要的是，在執行 1~4 行消行時 (`playClear(count)`)，使用 Oscillator 根據消除數發出諧波：首行頻率為 440Hz，隨後每一行的頻率皆乘以 1.2 ($freq \times 1.2^i$)，製造情緒高挺的升調感。
> 2. **衝擊粒子 (Effect Manager)**：建立基於 Canvas 繪圖的粒子系統。當方塊落地與消行時，從該方塊的顏色、座標，散發出使用 `globalAlpha` 平滑衰減、具備重力 (`vy += 0.2`) 的霓虹發光粒子。"

---

### 🧬 步驟 5：資源調度與生物背景 (Strategy Hold & Bio-Animation)
**【核心目標】**：整合一切，補全持有的「風險負載平衡」邏輯，並添加生命的氣息。

> **Prompt 5 (Visual Director & Strategic Postponement):**
> "最後一步，請實作繪圖中心 `js/renderer.js` 與總協調器 `js/main.js`。
> 1. **戰略延後 (Hold Logic)**：完成方塊「持有」功能，一回合只能使用一次。請在 UI 左側框畫出被持有的方塊。重點：將 AI 腦進化，讓 AI 會同時模擬『當前方塊』與『持有方塊』的未來期望值，若持有分數較高，則自動執行戰略切換 (Strategic Swap)！
> 2. **狀態鎖定視覺化**：當使用 Hold 後，左側 Canvas 以灰階與低不透明度顯示，指示處於冷卻階段 (Cooldown)。
> 3. **深空水母程序動畫 (Bio-Animation)**：在 `renderer.js` 的底層，在所有方塊之後，程序化地繪製 5 隻發光透明水母，利用 `Math.sin(phase)` 讓牠們呈正弦曲線緩慢漂游向上。這會為硬派的幾何計算注入充滿生命力的冷靜與深度。"
