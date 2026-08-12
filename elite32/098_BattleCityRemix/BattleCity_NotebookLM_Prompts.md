# 《鋼鐵雄心：五步重構旗艦指南》(BattleCity Remix NotebookLM Video Prompts)

本手冊專為 **NotebookLM** 設計，旨在將《098_BattleCityRemix》的「坦克碰撞死鎖偵破與戰場程序化渲染」重構歷程轉化為高品質的教學影片腳本。請將本文件連同 `Core_Source.md` 以及 `main.js`、`tank.js`、`map.js`、`audio.js` 等核心代碼一併上傳至 NotebookLM 進行精製。

---

### 🎥 影片核心概念：碰撞物理學與戰場程序化渲染 (Collision Physics & Procedural Battlefield)
*   **導師角色**：Jensen (熱情、具啟發性，軍事敘事風格) 與 Ada (專精演算法與邏輯美學)
*   **技術核心**：Four-Corner Inset Collision + Grid Coordinate Transformation + Web Audio Synthesis
*   **展示案例**：具備粒子爆炸、螢幕震動、程序化音效與 AutoPilot 導航的《鋼鐵雄心 Iron Heart Remix》

---

### 🎙️ NotebookLM 指導指令 (Focus Prompts for Synthesis)

#### 指令 1：生成教學影片摘要 (The Hook & Introduction)
> "請分析上傳的《Core_Source.md》與原始碼，生成一段 2 分鐘的開場腳本（由 Jensen 負責旁白）。
> 1. **破冰提問**：'當一枚砲彈以每秒 360 像素的速度飛過戰場，電腦是如何在毫秒之間判斷它擊中的是「可摧毀的磚牆」還是「不可摧毀的鋼板」？答案藏在一個簡單的數學除法裡。'
> 2. **展示核心**：介紹這不只是一款童年《坦克大戰》的重置，這是一個結合了「程序化戰場渲染 (Procedural Battlefield)」、「四角內縮碰撞偵測 (Four-Corner Inset)」、「零音效檔案的數學音訊合成 (Procedural Audio)」以及「碰撞死鎖偵破 (Deadlock Detective Story)」的現代計算機科學大師課。
> 3. **語氣要求**：激昂、充滿軍事使命感、引人入勝，像戰爭紀錄片的旁白。"

#### 指令 2：拆解五大工業重構步驟 (The 5 Industrial Steps)
> "請將影片的主軸歸納為五個嚴謹的教學步驟，並為每個章節提煉核心重點：
> *   **步驟 1：鋼鐵擬態 UI 架構 (UI Engine)** - 解釋暗黑鋼鐵主題背景與半透明 Glassmorphism HUD 介面如何確立「軍工旗艦級」氛圍。Header 中的生命/敵方/分數三欄數據即時更新的設計哲學。
> *   **步驟 2：20×20 戰場矩陣引擎 (Map Engine)** - 探討地圖編碼系統 (0-9 整數陣列)、程序化磚牆渲染 (雙層矩形 + 高光)、鋼板漸層鉚釘、水域折射線、老鷹基地貝塞爾曲線發光的純 Canvas 繪製技術。
> *   **步驟 3：坦克工廠與碰撞死鎖偵破 (Tank Class & Deadlock Fix)** - (關鍵節點！) 分析 OOP 的「一個類別、兩種角色」設計模式。深入解構 Four-Corner Inset 碰撞偵測的 32px vs 30px 對齊難題。最精彩的：敵方坦克卡住的「碰撞死鎖」偵探故事與 `autoTurnTimer` 30 幀承諾鎖的修復。
> *   **步驟 4：程序化音效與粒子爆炸 (Procedural Audio & VFX)** - 零音效檔案！介紹鋸齒波引擎低鳴 (60Hz)、三角波砲擊衝擊 (200→10Hz)、白噪音爆炸 (400→40Hz 低通濾波) 的數學合成。以及橙色粒子系統搭配 shakeIntensity 指數衰減的螢幕震動反饋。
> *   **步驟 5：AutoPilot AI 導航與座標空間轉換 (AI & Coordinate Transform)** - 深入解析 O(1) 貪婪啟發式導航、子彈的 pixel→tile 座標空間轉換 (Math.floor 除法)、以及為何 grid-based indexing 令碰撞從 O(N²×B) 降冪至 O(B)。"

#### 指令 3：深度雙人對話腳本 (Deep Dive: Physics vs. AI)
> "請模擬一段 NotebookLM 'Audio Overview' 風格的雙人對談 (Podcast 形式)：
> *   **討論主題**：『碰撞物理的精確性與 AI 行為的隨機性，如何在同一個迴圈中共存？』
> *   **論點交鋒**：講者 A 驚嘆於「Four-Corner Inset」在 32px vs 30px 格子不對齊時的優雅解法；講者 B 則深入分析敵方坦克「碰撞死鎖」的偵探過程——從「犯罪現場」到「30 幀承諾鎖」的修復，以及這個修正**至今仍未傳播到敵方 AI** 的真實工程教訓。
> *   **專注細節**：兩人討論 `forEach + splice` 反模式如何違反「陣列倒序消除法則」(JS Physics Pitfalls KI 鐵律一)，以及這在子彈碰撞系統中可能導致的「幽靈穿透」現象。"

#### 指令 4：視覺化腳本分鏡與 B-Roll 建議 (Visual Storytelling B-Rolls)
> "請為剪輯師提供以下畫面的 B-Roll 指示：
> 1. **畫面一 (戰場俯瞰)**：鏡頭由遠拉近 20×20 戰場。紫色磚牆排列整齊，鋼板閃爍金屬漸層，底部老鷹基地發出金色光暈。四輛紅色坦克從頂端三個出生點湧入。
> 2. **畫面二 (碰撞微距)**：藍色坦克的 Four-Corner Inset 碰撞體以半透明綠色高亮顯示。當坦克滑過磚牆拐角時，4px 的內縮空間清晰可見——這就是「不卡角」的祕密。
> 3. **畫面三 (死鎖偵破)**：慢動作重播。一輛紅色坦克困在 L 型走廊中，方向箭頭在上↑和左←之間瘋狂閃爍（死鎖狀態）。隨後 `autoTurnTimer` 啟動，箭頭穩定指向右→，坦克緩緩駛出困境——配以戲劇性的音效漸強。"

#### 指令 5：哲學總結與未來展望 (The Grand Metaphor)
> "撰寫影片的結尾語錄：
> *   **回扣主旨**：『我們重構的不是坦克大戰，我們在重構的是「如何在有限的格子世界裡，用數學賦予鋼鐵靈魂」。當每一面磚牆都由程式碼逐筆繪製、每一聲爆炸都由數學方程即時合成，你就站在了軟體工程的最前線。』
> *   **啟發行動**：『掌握了這五個步驟，你不再是遊戲的玩家。你是那個能把 593 行程式碼變成一座活生生戰場的工程指揮官。』
> *   **收尾**：請用低沉的鋸齒波引擎聲逐漸淡入沉寂，畫面暗下，只留下熒光橙色的 UTT-v2.0 標誌與「IRON HEART — COMMANDER PATRICIA HSU」字樣。"

---

### 💡 Extra Helpful Notes for Production
*   **The Tank Stuck Bug Context**: 影片中必須提及，敵方坦克在狹窄走廊會因「每幀隨機換方向」而陷入「方向抖動死鎖」。AutoPilot 透過 `autoTurnTimer = 30` 成功修復，但此修正未套用到敵方 AI——這是展示「Bug 修正傳播失敗」的完美教學切入點。
*   **The forEach+splice Anti-Pattern**: 子彈系統使用正向 forEach 搭配 splice，違反了 UTT-v2.0 知識庫中的「陣列倒序消除法則」。這是活生生的反面教材。
*   **Color Palette Tone**: 色調應鎖定在鋼鐵暗黑 (`#1e1e1e`) 到軍工橙 (`#f39c12`)，以及磚牆紫 (`#8e44ad`) 與爆炸火焰 (`#e67e22`)。
*   **Pacing (節奏)**: 步驟 1-2 應節奏明快（戰場建構的急迫感），步驟 3 應放慢節奏呈現偵探故事的戲劇性，步驟 4-5 恢復明快並以震撼的爆炸粒子收尾。
