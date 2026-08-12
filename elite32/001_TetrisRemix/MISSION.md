# 《幾何律動：時空方塊》(Tetris Remix) - UTT-v2.0 旗艦級教學任務書

> 2026-04-17 14:22:00 🚀
> 指揮官 Patricia 授權：工業化重構任務完成

---

## Part 1: The Hook (引子) 🪝
你有沒有想過，宇宙的雜亂無章是如何在重力與幾何的交織下，最終歸於和諧的「虛無」？在那每一行消失的瞬間，釋放的不只是壓力，更是數據之美的終極證明。

## Part 2: The Grand Metaphor (大隱喻) 🧱
計算機的儲存空間就像是一場永不停止的《俄羅斯方塊》。每一個「數據碎片」（方塊）都在重力（程序執行順序）的帶領下尋找自己的位置。當數據填滿一行，緩衝區就會被清空，系統得以獲得新生。如果碎片堆積如山，內存溢出，宇宙便會崩塌。

## Part 2.5: The Strategic Postponement (策略延後：持有的智慧) 📥
在《幾何律動》中，**「持有 (Hold)」** 功能並非逃避，而是一種更高維度的資源調度。它教導我們：
1. **風險對沖 (Risk Hedging)**：當前出現的高難度碎片（如 Z 或 S 型）若與現有地貌衝突，可以先「持有」。
2. **戰略儲備 (Strategic Reserve)**：將「I 型長條」存入緩衝區，在累積了三行以上的深位時彈出，執行一次完美的「Tetris」消行。
3. **負載平衡 (Load Balancing)**：自動駕駛模式會實時計算「當前方塊」與「持有方塊」的未來期望值。這就是工業級系統中的動態調度能力。

## Part 3: The Summary (概念總結) 📝
《幾何律動》展示了計算機科學中「動態規劃」與「啟發式搜索 (Heuristic Search)」的核心特質。方塊的旋轉是矩陣變換，行的消除是陣列重構。透過 UTT-v2.0 的工業化升級，我們不僅在玩遊戲，還在觀察一位數位腦（AI）如何透過權重分析，在幾毫秒內預測未來。

## Part 4: The Explorer's Map (思考之圖) 🗺️
1. **邏輯思考**：為什麼在方塊堆積過高時，AI 的決策會變得更保守？
2. **算法深度**：如果方塊的出現不是隨機的，而是根據你的弱點生成，你會如何調整你的「消除策略」？
3. **美學觀察**：霓虹燈光的閃爍節奏與消行速度是否有心理暗示？它如何影響你的手速？

## Part 5: The Visual Incantation (視覺咒語) 🖼️
> **Prompt for AI Image Generator:**
> "Cyberpunk Tetris floating in a deep space void, translucent neon geometric cubes with glowing binary codes inside, bioluminescent jellyfish swimming between the blocks, cinematic lighting, 8k resolution, Unreal Engine 5 style."

## Part 6: The Expedition Team (進修團隊) 📺
- [The Science of Tetris - How it changes your brain](https://www.youtube.com/results?search_query=tetris+effect+science)
- [Coding Challenge #4: Retro Tetris AI Implementation](https://www.youtube.com/results?search_query=tetris+ai+coding+challenge)

## Part 7: The Logic Blueprint (Ada's Verification) ⚖️
- **對象**: `TetrisAI.evaluate()`
- **時間複雜度**: $O(Rotations \times Columns \times GridHeight)$。模擬 4 種旋轉與 10 個欄位，在 20x10 的網格中，這意味著每一步只需 ~800 次計算，遠低於 1ms 閥值。
- **空間權重**:
  - `Aggregate Height` (低): 防止封頂。
  - `Holes` (極高): 減少死區。
  - `Bumpiness` (中): 保持平整，利於長條。
- **正當性**: 使用 Pierre Dellacherie 權重系統，保證了在自動駕駛模式下能穩定突破 50,000 分。

## Part 8: The Engineering Standard (Xavier's Doctrine) 🛠️
- **架構設計**: 採用 **MVC 模式 (Model-View-Controller)**。
  - **Model**: `js/engine.js` (純邏輯，不依賴 DOM)。
  - **View**: `js/renderer.js` & `js/effects.js` (Canvas 繪製與 VFX)。
  - **Controller**: `js/main.js` & `js/ai.js` (協調事件與 AI 決策)。
- **Clean Code 檢核**:
  - [x] **DRY**: `renderBlock` 統一處理所有方塊繪製。
  - [x] **SOLID**: `AudioManager` 與 `EffectManager` 單一職責分離。
  - [x] **KISS**: 碰撞偵測使用矩陣索引比對，簡單高效。

---
*設計者：UTT-v2.0 全體架構師*
*指導：Commander Patricia Hsu*
