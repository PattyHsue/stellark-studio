---
description: 觸發指令「goNotebookLM」，大幅簡化 NotebookLM 影片腳本的生成流程，向使用者提出三個關鍵問題，並自動生成繁體中文版影片腳本與五步精密重構藍圖。
---

當使用者輸入 `goNotebookLM` 時，請立即停止冗長的解釋，直接向使用者提出以下 **3 個問題**（一次問完）：

1. 🎮 **Q1 (目標專案)**：「指揮官，我們要為哪一款遊戲或專案設計 NotebookLM 教學影片？」
2. ⚔️ **Q2 (美學與邏輯)**：「這次專案中，您希望重點強調的『視覺特效 (VFX)』是什麼？背後運作的最強『演算法/數學邏輯』又是什麼？」
3. 🐛 **Q3 (Bug 英雄旅程)**：「在開發過程中，我們解決過最棘手、適合當作教學亮點的『Bug 或工程挑戰』是什麼？」

等待使用者回答這 3 個問題。收到回答後，請**直接自動生成以下 3 份文件**，並歸檔至該專案目錄：

## 📦 交付物標準 (Deliverables Standard)

### 文件 1：`{專案名}_NotebookLM_Prompts.md` — 繁體中文版影片腳本
- **語言**：繁體中文為主體（技術關鍵詞保留英文）
- **格式規範**：嚴格對齊 `001_TetrisRemix/Tetris_NotebookLM_Prompts.md` 的結構
  - 影片核心概念（導師角色 Jensen + Ada、技術核心、展示案例）
  - 指令 1：生成教學影片摘要 (The Hook & Introduction) — 破冰提問 + 展示核心 + 語氣要求
  - 指令 2：拆解五大工業重構步驟 (The 5 Industrial Steps) — 呼應重構藍圖的 5 個步驟
  - 指令 3：深度雙人對話腳本 (Deep Dive) — Podcast 風格的論點交鋒 + Bug 英雄旅程
  - 指令 4：視覺化腳本分鏡與 B-Roll 建議 (Visual Storytelling B-Rolls) — 3 個畫面分鏡
  - 指令 5：哲學總結與未來展望 (The Grand Metaphor) — 回扣主旨 + 啟發行動 + 收尾
  - Extra Helpful Notes — Bug Context、Color Palette、Pacing 節奏

### 文件 2：`{專案名}_Reconstruction_Blueprint.md` — 五步精密重構藍圖
- **語言**：繁體中文為主體（Prompt 指令內容使用英文）
- **格式規範**：嚴格對齊 `001_TetrisRemix/Tetris_Reconstruction_Blueprint.md` 的結構
  - 5 個步驟，每步包含【核心目標】與一段完整可執行的 Prompt（用 blockquote 包裹）
  - 步驟 1：UI 架構（Glassmorphism / 主題視覺）
  - 步驟 2：核心遊戲引擎（碰撞偵測 / 物理邏輯 / 地圖系統）
  - 步驟 3：AI 大腦（啟發式演算法 / AutoPilot / Bug 修正）
  - 步驟 4：特效與音頻（Particle VFX / Web Audio 程序化合成）
  - 步驟 5：整合與收尾（資源調度 / 生物動畫 / 狀態管理）
  - 每個 Prompt 必須「自含完備」— 複製給任何 AI 即可獨立重構該步驟

### 文件 3：`Core_Source.md` — 原始碼全文獻
- 包含完整原始碼、Big O 複雜度總表 (Ada)、Clean Code 審計報告 (Xavier)
- 上傳至 NotebookLM 作為 AI 學習源
