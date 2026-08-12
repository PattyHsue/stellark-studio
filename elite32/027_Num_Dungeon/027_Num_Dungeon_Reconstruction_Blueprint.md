# 027_Num_Dungeon 五步精密重構藍圖 (Reconstruction Blueprint)

## UTT-v2.0 旗艦級開發規範
本藍圖將數字密室 (Num Dungeon) 的建構過程拆解為五個符合 Clean Code (SOLID) 與工業標準的精確步驟。每個步驟均附帶「獨立可執行」的 AI Prompt，確保能完美重現 Master-Grade 的品質。

---

### 步驟 1：UI 架構 (Glassmorphism 與 Amber Rune 主題)
**【核心目標】**：建立基於 `Outfit` 字體與琥珀金 (`#ffab00`) 科技質感的 Glassmorphism HUD。包含無阻塞狀態覆蓋層 (Overlay Modal) 與支援自適應的 Flexbox 佈局。

> 請為 027_Num_Dungeon 建立 `index.html` 與 `style.css`。
> 要求：
> 1. 使用 CSS 變數管理色票：琥珀金 (`#ffab00`)、岩石黑 (`#1a1a1a`) 等，並實作 Glassmorphism 效果 (`backdrop-filter: blur(20px)`)。
> 2. 建立頂部 HUD (包含 LOGO、分數、生命值，以及一個 AutoPilot 切換按鈕)。
> 3. 建立置中的 Canvas 容器與一個可淡入淡出的 Overlay Modal (用於開始與結束畫面)。
> 4. 所有發光效果需使用 `text-shadow` 或 `box-shadow` 實現，字體使用 Google Fonts `Outfit`。

---

### 步驟 2：核心遊戲引擎 (網格生態與實體邏輯)
**【核心目標】**：實作 `EliteEngine` 類別，負責網格 (Grid) 生成、玩家狀態追蹤以及鍵盤/觸控移動的邊界判定與實體互動 (吃補血、打怪)。

> 在 `game.js` 中建立 `EliteEngine` 類別。
> 包含以下功能：
> 1. **狀態管理**：初始化畫布尺寸、網格配置 (10x10)，與遊戲狀態 (`START`, `PLAYING`, `GAMEOVER`)。
> 2. **地牢生成器 (`resetDungeon`)**：根據難度係數 (`difficultyFactor`)，隨機生成牆壁 (`WALL`)、敵人 (`ENEMY`, 帶數值) 與補血包 (`HEAL`)。
> 3. **移動與碰撞 (`handleMove`)**：實作 WASD 或方向鍵移動，若目標為牆壁則阻擋；若為敵人且玩家力量 $\ge$ 敵人，則吸收其數值並加分，否則扣除生命值。
> 4. **渲染迴圈 (`draw`)**：繪製網格與實體，玩家需有高亮度描邊，敵人需有呼吸光效 (`Math.sin` 實作)。

---

### 步驟 3：AI 大腦 (BFS 廣度優先尋路與 AutoPilot)
**【核心目標】**：實作 AI 自動駕駛功能，使用 BFS (廣度優先搜尋) 演算法找到最近且可戰勝的目標，並防止角色卡在牆壁死角。

> 在 `EliteEngine` 中加入 AutoPilot AI 邏輯。
> 要求：
> 1. 實作 `findPath(target)`：使用 BFS 演算法尋找從玩家到目標的最短路徑。**關鍵要求**：必須使用 `Set` 來記錄 `visited` 座標，防止迴圈爆炸與主執行緒鎖死。
> 2. 實作 `executeAutoPilot()`：掃描全圖，計算出距離玩家曼哈頓距離最近的「可戰勝敵人」或「補血包」作為 Target。
> 3. 當找到目標時，呼叫 `findPath` 取得下一步指令並移動；若無目標或被包圍，則進入隨機巡航模式。
> 4. 綁定 HTML 的 Auto-Pilot 按鈕來開關此功能。

---

### 步驟 4：特效與音頻 (Web Audio 與 Particle VFX)
**【核心目標】**：不依賴任何外部素材，純程式碼生成具有打擊感的古典共鳴 BGM、合成音效，以及吸收實體時的粒子噴發與畫面震動。

> 在 `game.js` 中新增 `AudioManager` 與 `ParticleEmitter` 類別，並整合至主引擎。
> 要求：
> 1. **AudioManager**：使用 `AudioContext` 實作。包含地心脈動 BGM (`triangle` 波，40-50Hz 交替)、打擊受傷音效 (頻率驟降的 `square` 波) 與吸收數值的上升琶音 (`sine` 波)。
> 2. **ParticleEmitter**：實作一個基於 Canvas 2D 的粒子系統，當玩家吃掉敵人或補血時，在該座標噴射對應顏色的發光粒子 (具有隨機速度與生命週期衰減)。
> 3. **Camera Shake**：在玩家受傷時觸發 `this.shake` 變數，並在 `draw()` 階段使用 `ctx.translate` 製造震動效果。

---

### 步驟 5：整合與收尾 (記憶體管理與行動端最佳化)
**【核心目標】**：修復 JavaScript 物理模擬常見的記憶體洩漏漏洞，實作本機資料持久化 (High Score)，並增強手機端滑動體驗。

> 完成 `game.js` 的最終工業化打磨。
> 要求：
> 1. **Bug 防禦 (記憶體最佳化)**：在 `ParticleEmitter` 的 `update()` 中，**必須**使用反向迴圈 (`for (let i = length - 1; i >= 0; i--)`) 來移除死亡粒子，嚴格遵守「Reverse For-Loop Splice Rule」以防畫面閃爍或崩潰。
> 2. **行動端體驗**：加入 Touch Event 監聽器，實作手勢滑動 (Swipe) 來控制上下左右移動，閾值設為 30px。
> 3. **持久化**：使用 `localStorage` 儲存並讀取 `numDungeon_highScore`，並在 HUD 品牌標題下方動態顯示歷史最高分。
