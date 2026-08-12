---
description: UTT 遊戲學院課程製作捷徑 (發車前詢問 3 個核心問題)
---
當使用者輸入 `gogame` 時，直接拋出以下 3 問，不需解釋：

1. **🎯 目標遊戲：** 本次要製作哪款 Elite 32 遊戲的教學？（例如：`013_MemoryMatching`）
2. **📹 影片焦點：** 這支 2-3 分鐘影片聚焦在 5-Step 的哪個步驟？
3. **👶 初學者挑戰：** 影片尾段要設計什麼動手改造挑戰給學員？

取得答案後，立刻：
- 呼叫 `.agents/skills/Elite_32_Industrializer/SKILL.md`
- 產出 NotebookLM 影片腳本 (中文旁白 + 時間軸)
- 更新 `course_materials/Elite32_Course_Tracker.md`

⚠️ 所有檔案寫入本地 `.agents/` 目錄，嚴禁操作 `C:\Users\...` 全域路徑。
