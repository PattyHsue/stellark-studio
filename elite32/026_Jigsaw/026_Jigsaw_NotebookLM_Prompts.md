# 026_Jigsaw NotebookLM 教學影片腳本 (Prompt 集合)

## 影片核心概念
- **導師角色**：Jensen (熱情、充滿想像力的主講者) 搭配 Ada (專注於貝茲曲線與幾何學的分析師)
- **技術核心**：基於 Canvas 2D 的**程序化藝術生成 (Procedural Art)**、**三次貝茲曲線 (Cubic Bezier)** 的完美拼圖切割，以及解決「透明凸起邊緣」的**幾何擴展算法 (Inset Mathematical Expansion)**。
- **展示案例**：《026_Jigsaw》空中拼圖 (Sky Odyssey) 旗艦版。不依賴任何外部圖片素材，完全靠程式碼繪製出漸層夕陽與雲朵，並動態將其切割為具備物理吸附感的拼圖。

---

## 指令 1：生成教學影片摘要 (The Hook & Introduction)
> 你現在是 UTT-v2.0 首席講師 Jensen！請用充滿魔力的語氣開場。
> 「各位指揮官，說到寫拼圖遊戲，大部分的人第一步就是上網找一張圖片對吧？但在 UTT-v2.0，我們連圖片都是『算』出來的！今天，我們將在 Canvas 畫布上親手創造出名為『Sky Odyssey』的絕美夕陽，然後用傳說中的『三次貝茲曲線 (Cubic Bezier)』將這片天空完美切碎！你準備好見證純程式碼構成的幾何浪漫了嗎？Let's Code!」
> 請幫我產出一段 2 分鐘的開場白，強調「程序化生成藝術」與「貝茲曲線切割」的震撼力。

## 指令 2：拆解五大工業重構步驟 (The 5 Industrial Steps)
> 請以 UTT-v2.0 首席系統架構師 Xavier 的視角，嚴謹且有條理地拆解以下 5 個重構步驟，並為每個步驟配上一句精煉的工程箴言：
> 1. UI 架構 (毛玻璃質感與進度 HUD)
> 2. 藝術生成 (Procedural Art - Sky Odyssey 的漸層與陰影渲染)
> 3. 貝茲刀模 (BezierCutter 演算法：Tab 與 Blank 的邊緣數學)
> 4. 物理與控制 (Drag & Drop 拖曳機制與 Z-Index 陣列排序)
> 5. 整合與 AI 導航 (LERP 平滑線性插值與 AutoPilot 自動拼合)
> 語氣要求：專業、不容妥協、強調 Clean Code 與模組化的重要性。

## 指令 3：深度雙人對話腳本 (Deep Dive)
> 請設計一段 Podcast 風格的雙人對話。
> 主持人：Jensen (負責比喻與引導氣氛)
> 嘉賓：Ada (負責演算法與邏輯的精確度)
> **對話主題：Bug 的英雄旅程 —— 「隱形的拼圖凸塊 (The Invisible Tabs Bug)」**
> **Bug Context**：當我們終於寫好貝茲曲線切割邊緣時，發現拼圖凸出來的那一塊 (Tab) 竟然是透明/被裁切掉的！原因是原生的 `drawImage` 只抓取了 `w * h` 的基本矩形，忽略了貝茲曲線向外延伸的凸塊區域。
> **解決方案**：Ada 解釋我們如何利用「幾何擴展算法 (Inset Mathematical Expansion)」，將採樣區域放大 `inset = 0.25`，也就是動態計算 `sW = p.w * (1 + inset * 2)`，成功拯救了那些被切斷的凸塊！
> 請讓對話充滿火花，Jensen 可以將這個問題比喻成「穿了太小的西裝」，而 Ada 則用精確的幾何學將其完美解決！

## 指令 4：視覺化腳本分鏡與 B-Roll 建議 (Visual Storytelling B-Rolls)
> 請以視覺導演 Victor 的視角，為本教學影片設計 3 個關鍵畫面的分鏡建議 (B-Rolls)：
> 1. **天空的誕生 (Genesis of Sky Odyssey)**：快速縮時展現 Canvas 如何從線性漸層 (Linear Gradient) 開始，疊加發光的太陽與白雲，最後畫出山脈剪影的過程。
> 2. **貝茲刀網的落下 (The Bezier Strike)**：以慢動作特寫網格線上，三次貝茲曲線如何優雅地彎曲，形成互補的「凸塊 (Tab)」與「凹槽 (Blank)」。
> 3. **引力的瞬間 (The Snap Physics)**：展現玩家拖曳拼圖靠近正確位置時，系統計算出歐幾里得距離小於 30，拼圖瞬間吸附並發出清脆『喀噠』聲 (Web Audio) 的高潮瞬間。

## 指令 5：哲學總結與未來展望 (The Grand Metaphor)
> 請讓 Jensen 為整堂課做最後的哲學總結。
> 「每一塊拼圖，都有它註定的位置 (cx, cy)；在尋找位置的過程中，我們可能會偏離軌道、可能會與其他人重疊 (Z-Index)，但只要我們擁有明確的目標，並加上一點點平滑的引導 (LERP AutoPilot)，最終都能拼湊出完整的藍圖。寫程式如此，人生也是如此。」
> 請生成一段激勵人心的結語，呼籲學生們擁抱幾何數學的精確與程式設計的美感。

---

## Extra Helpful Notes
- **Color Palette**: 科技藍 (`rgba(100, 255, 218, x)`)、深邃夜空 (`#192a56`)、夕陽粉 (`#ff7675`)。
- **Pacing 節奏**: 前期展現藝術生成的「靜謐美」，中期切入數學推導的「硬派邏輯」，後期 AutoPilot 開啟時展現「全自動化歸位」的極致舒壓感。
