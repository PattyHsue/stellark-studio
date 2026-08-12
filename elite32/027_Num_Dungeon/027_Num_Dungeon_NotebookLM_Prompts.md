# 027_Num_Dungeon NotebookLM 教學影片腳本 (Prompt 集合)

## 影片核心概念
- **導師角色**：Jensen (熱情、具啟發性的主講者) 搭配 Ada (專注於數學邏輯與演算法嚴謹度的分析師)
- **技術核心**：基於 BFS (廣度優先搜尋) 的 AI AutoPilot 尋路邏輯、Web Audio 頻率合成技術、以及粒子系統的記憶體最佳化 (Reverse For-Loop Splice Rule)。
- **展示案例**：《027_Num_Dungeon》數字密室旗艦版，展現如何從基礎的陣列操作，升華至具有強烈打擊感與自動化尋路大腦的精緻 Web 遊戲。

---

## 指令 1：生成教學影片摘要 (The Hook & Introduction)
> 你現在是 UTT-v2.0 首席講師 Jensen！請用充滿活力與啟發性的語氣開場。
> 「各位指揮官，你有想過我們如何在瀏覽器中，不依賴任何外部圖片與音檔，純粹靠著『程式碼的魔法』，打造出一個有呼吸感、有靈魂的數字地牢嗎？今天，我們不僅要教你寫出 027_Num_Dungeon，還要讓它擁有自己的『大腦』！我們將深入剖析 BFS 尋路演算法，以及如何利用 Web Audio 敲打出震撼的打擊感！準備好進入純粹邏輯與視覺特效的極致領域了嗎？Let's Code!」
> 請幫我產出一段 2 分鐘的開場白，並確保帶出「粒子特效」與「BFS 自動導航」的亮點。

## 指令 2：拆解五大工業重構步驟 (The 5 Industrial Steps)
> 請以 UTT-v2.0 首席系統架構師 Xavier 的視角，嚴謹且有條理地拆解以下 5 個重構步驟，並為每個步驟配上一句精煉的工程箴言：
> 1. UI 架構 (Amber Rune HUD 與 Glassmorphism)
> 2. 核心引擎 (網格生態與實體碰撞邏輯)
> 3. AI 大腦 (BFS 廣度優先尋路與 AutoPilot)
> 4. 特效與音頻 (Web Audio 古典共鳴頻率與 Particle VFX)
> 5. 記憶體與收尾 (Reverse For-Loop 記憶體守護與行動端觸控最佳化)
> 語氣要求：專業、不容妥協、強調 Clean Code (SOLID) 的重要性。

## 指令 3：深度雙人對話腳本 (Deep Dive)
> 請設計一段 Podcast 風格的雙人對話。
> 主持人：Jensen (負責比喻與引導氣氛)
> 嘉賓：Ada (負責演算法與邏輯的精確度)
> **對話主題：Bug 的英雄旅程 —— 記憶體洩漏與無限迴圈的深淵**
> **Bug Context**：在早期開發 AutoPilot 與粒子系統時，我們遭遇了嚴重的瀏覽器崩潰。首先是 AI 尋路在複雜地牢中陷入死角，導致主執行緒鎖死；其次是粒子特效的陣列在頻繁繪製中產生記憶體洩漏。
> **解決方案**：Ada 解釋我們如何引入 `Set` 紀錄 `visited` 節點來優化 BFS，確保 Time Complexity 穩定在 O(V+E)；並點出 JavaScript 物理模擬的必殺技「Reverse For-Loop Splice Rule (反向迴圈刪除法)」，完美斬斷了陣列錯位的記憶體問題。
> 請讓對話充滿火花，Ada 可以稍微吐槽一開始暴力的寫法，Jensen 則將這些解法包裝成工程師的破關必殺技！

## 指令 4：視覺化腳本分鏡與 B-Roll 建議 (Visual Storytelling B-Rolls)
> 請以視覺導演 Victor 的視角，為本教學影片設計 3 個關鍵畫面的分鏡建議 (B-Rolls)：
> 1. **琥珀色光暈的誕生 (The Amber Glow)**：展現 Glassmorphism 與 Neon Rune 質感的 UI 渲染過程，特寫玩家方塊周圍的「高亮度描邊」。
> 2. **AI 的思考脈絡 (The Brain of BFS)**：利用動畫呈現 BFS 演算法在網格中像水波一樣擴散，尋找最近敵人的演算法具象化畫面。
> 3. **粒子的毀滅與重生 (Particle Impact)**：慢動作展現玩家吃掉數字時，粒子噴射並伴隨畫面震動 (Camera Shake) 的衝擊感，配合音頻頻率的視覺波形。

## 指令 5：哲學總結與未來展望 (The Grand Metaphor)
> 請讓 Jensen 為整堂課做最後的哲學總結。
> 「我們在網格中找尋最短路徑，不就像是我們在混亂的程式碼中尋求最佳解嗎？BFS 告訴我們，只要一步一腳印地向外探索，並且『不要重複走過冤枉路 (Visited Set)』，最終一定能找到那個過關的出口。而反向迴圈 (Reverse For-Loop) 則提醒我們，有些時候，『倒過來思考』反而能避開陣列崩潰的陷阱。」
> 請生成一段激勵人心的結語，呼籲學生們不只寫能跑的 code，更要寫出優雅、有韌性的系統。

---

## Extra Helpful Notes
- **Color Palette**: 琥珀金 (`#ffab00`)、烈焰紅 (`#ff3d00`)、治癒綠 (`#00e676`)、岩石黑 (`#1a1a1a`)。
- **Pacing 節奏**: 影片前半段偏向懸疑與解謎 (探索數字地牢的規則)，後半段在開啟 AutoPilot 後轉為高燃快節奏，展現演算法接管畫面的視覺衝擊。
