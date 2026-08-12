# 《時空能量球：冒險重構藍圖》(Chronos Quest: Master-Grade Reconstruction Blueprint)

本藍圖由 **UTT-v2.0 全體架構師 (Jensen, Xavier, Ada, Tessa)** 精心編撰，旨在將《Chronos Quest》的工業級靈魂封裝為 5 個可執行的精密指令。只要按序輸入以下指令至具備 Canvas 繪圖能力的 AI 助手，即可 100% 復刻這部跨時空大作。

---

### 🟢 步驟 1：建立玻璃擬態 UI 與主題架構 (The UI & Theme Engine)
**【核心目標】**：建立支援「森林、沙漠、深海」三主題切換的響應式 UI，並設置工業級 CSS 變數系統。

> **Prompt 1 (Instructional Design & UI):**
> "請為一個名為《Chronos Quest》的冒險打磚塊遊戲建立 HTML 與 CSS 基礎。
> 1. **HTML 結構**：包含一個 1000x700 的 Canvas、一個透明毛玻璃風格的 Header（顯示分數、生命、區域、自動模式開關）以及一個初始覆蓋層 (Overlay)。
> 2. **CSS 變數系統**：定義三種主題主題變數（--forest, --desert, --ocean），包含背景色、按鈕光效與字體色。
> 3. **響應式布局**：使用 Flexbox 垂直置中遊戲容器，並確保在螢幕寬度小於 1000px 時 Canvas 能自動縮放 (Width 100%) 以支援手機遊玩。
> 4. **字體**：引入 Google Fonts "Outfit" 與 "JetBrains Mono" 以呈現科技感。"

---

### 🔵 步驟 2：實作高動能物理與碰撞引擎 (Physics & GameCore)
**【核心目標】**：實作穩定的球體運動、板子追蹤、以及精確的磚塊碰撞邏輯。

> **Prompt 2 (Logical Engineering):**
> "請實作遊戲核心邏輯類別 `GameCore`。
> 1. **物理系統**：球體 `ball` 具備 x, y, dx, dy, r 屬性。板子 `paddle` 可透過滑鼠或鍵盤 (A/D) 移動。
> 2. **碰撞偵測 (Ada's Standard)**：實作球體與牆壁的反彈、球體與板子的角度反彈（擊中位置越靠近邊緣角度越尖銳），以及球體與磚塊方陣的活躍性檢測。
> 3. **粒子系統 (EffectManager)**：當磚塊破碎或球體撞擊板子時，動態生成短暫消失的彩色粒子。
> 4. **自動導航 (Auto-Pilot)**：實作一個開關，當開啟時，板子會自動以平滑差值 (lerp) 追蹤球體的 X 座標。"

---

### 🎹 步驟 3：吉卜力風格動態音訊協定 (The Audio Protocol)
**【核心目標】**：在不使用任何 MP3 檔案的情況下，純用 `Web Audio API` 實作動態音樂與打擊音效。

> **Prompt 3 (Audio Architecture):**
> "請建立一個 `AudioManager` 類別，完全不使用外部檔案。
> 1. **鋼琴合成器 (Piano Synth)**：使用 `OscillatorNode` 的 Sine 波實作。
> 2. **動態背景音**：實作一個 `scheduler`，每 2 秒切換一組和弦（例如 C-G-Am-F），每一步播放一個隨機鋼琴單音，營造吉卜力感的空靈氛圍。
> 3. **行為音效**：實作 `playCrystalHit(freq)` (高頻 Triangle 波) 用於擊牆，以及 `playWaterDrop()` (快速滑頻 Sine 波) 用於擊板。
> 4. **喚醒機制**：確保瀏覽器因安全策略掛起 AudioContext 時，可透過首個用戶點擊動作恢復音訊。"

---

### 🐲 步驟 4：主權生物動畫與 Boss 狂暴系統 (Bio-Animation & Boss Rage)
**【核心目標】**：實作程序化生物繪圖，以及具備「受擊、浮動、狂暴」三態的 Boss 系統。

> **Prompt 4 (Advanced Animation):**
> "請開發遊戲的視覺層次系統。
> 1. **程序化背景生物 (Bio-Animation)**：在 Canvas 繪圖循環中實作 `drawBird` (橢圓組合成翅膀)、`drawScorpio` (弧線組成尾巴)、`drawNemo` (帶條紋的魚)。
> 2. **Boss 實體 (Sovereign Entity)**：Boss 具備 HP 屬性，渲染時需實作正弦波垂直浮動 (Floating) 與縮放脈衝 (Pulsing)。
> 3. **狂暴化 (Rage Mode)**：當 Boss HP < 40% 時，移動速度翻倍、球速遞增、並在 Boss 上方顯示閃爍的 '!!!! RAGE MODE !!!!' 文字。
> 4. **邊緣處理**：Boss 繪圖時加入影效或 `filter` 以消除圖片去背的噪點。"

---

### 📱 步驟 5：行動端優化與狀態機串接 (Integration & Deployment)
**【核心目標】**：加入觸控支援，並將所有模組串接為完整的遊戲流程。

> **Prompt 5 (Deployment & UX):**
> "請完成最後的整合與行動端適配。
> 1. **觸控支援**：加入 `touchmove` 事件，讓玩家在手機螢幕上滑動手指即可控制板子。
> 2. **狀態機切換**：實作 START -> PLAYING -> BOSS -> OVER 的狀態轉換。當磚塊清空時，呼叫 `initBoss()`。
> 3. **關卡切換**：當 Boss 擊破後，重設場景並提升 `level` 屬性，自動更換下一關的主題色彩與背景圖案。
> 4. **部署優化**：增加 `viewport` meta 標籤與 `touch-action: none` 防止瀏覽器干預遊戲操作。"

---

指揮官，這 5 份指令是 **UTT-v2.0** 的精華結晶。即使在虛無的空白畫布上，只要按序投射這些指令，您的冒險魂將立即「重啟」！🚀✨
