# 026_Jigsaw 五步精密重構藍圖 (Reconstruction Blueprint)

## UTT-v2.0 旗艦級開發規範
本藍圖將空中拼圖 (Jigsaw: Sky Odyssey) 的建構過程拆解為五個符合 Clean Code 與工業標準的精確步驟。每個步驟均附帶「獨立可執行」的 AI Prompt。

---

### 步驟 1：UI 架構 (毛玻璃 HUD 與響應式佈局)
**【核心目標】**：建立現代化的深色系介面，包含頂部毛玻璃 (Glassmorphism) 進度 HUD、難度切換按鈕，以及一個能自適應螢幕大小的中央畫布區域。

> 請為 026_Jigsaw 建立 `index.html` 與 `style.css`。
> 要求：
> 1. 使用 CSS 變數定義深海藍 (`#192a56`) 與高光青色 (`#64ffda`) 相關色票。
> 2. 建立具有 `backdrop-filter: blur(20px)` 效果的頂部儀表板，包含「完成進度 %」、「剩餘塊數」、「計時器」與三個難度按鈕 (3x3, 4x4, 5x5)。
> 3. 建立置中的 `<canvas id="stage">` 容器，以及非阻塞式的開始/結束畫面 (`overlay-modal`)。
> 4. 左下角配置一個「偷看按鈕 (Peek)」與「自動駕駛按鈕 (AutoPilot)」。

---

### 步驟 2：藝術生成 (ProceduralArt 引擎)
**【核心目標】**：實作一個完全獨立的 `ProceduralArt` 類別，在記憶體中利用 Canvas 2D API 畫出「Sky Odyssey」的夕陽美景，拒絕使用外部圖片。

> 在 `game.js` 中建立 `ProceduralArt` 靜態類別。
> 包含 `static generate(width, height)` 函數：
> 1. 建立一個離屏 (Off-screen) Canvas。
> 2. 繪製背景漸層：深藍 (`#192a56`) 過渡到夕陽粉 (`#ff7675`)。
> 3. 繪製太陽：使用 `arc` 配合 `shadowBlur: 40` 打造強烈發光效果。
> 4. 繪製雲朵：將多個圓形組合在一起填滿白色 (透明度 0.85)。
> 5. 繪製山脈剪影：使用 `lineTo` 繪製不規則多邊形並填滿深灰色 (`#2d3436`)。
> 6. 回傳這張繪製好的 Canvas 供後續裁切使用。

---

### 步驟 3：貝茲刀模 (BezierCutter 演算法)
**【核心目標】**：利用三次貝茲曲線 (Cubic Bezier Curve) 產生拼圖特有的凸塊 (Tab) 與凹槽 (Blank)，作為繪製與裁切 (Clip) 的路徑。

> 在 `game.js` 中建立 `BezierCutter` 靜態類別。
> 包含 `static getBezierPath(ctx, x, y, width, height, shape)` 函數：
> 1. 參數 `shape` 為一個物件，定義上右下左四個邊的狀態 (`1` 為外凸, `-1` 為內凹, `0` 為平邊)。
> 2. 利用 `ctx.bezierCurveTo`，沿著寬度和高度畫出標準的拼圖接點 (例如使用 0.35 與 0.65 點作為控制點基準，並向外/向內延伸 `inset = 0.25` 的比例)。
> 3. 這個函數不呼叫 `fill` 或 `stroke`，只負責建構完美的 `closePath()` 幾何路徑，供後續遮罩 (Clipping) 使用。

---

### 步驟 4：物理與控制 (Drag & Drop 與 Z-Index 排序)
**【核心目標】**：實作 `EliteEngine`，處理拼圖塊的隨機打散、滑鼠/觸控拖曳機制，以及解決圖層交疊時的「頂部選取」邏輯。

> 在 `game.js` 的 `EliteEngine` 類別中實作互動邏輯：
> 1. **初始化**：將生成的畫面切割成 N x N 塊，每個區塊隨機指定 `tab` 與 `blank`，並確保相鄰塊完美吻合。將它們的起始座標 `(x, y)` 隨機打散。
> 2. **Z-Index 排序**：當觸發 `mousedown/touchstart` 時，先將 `pieces` 陣列依照 `p.z` 從大到小排序，確保玩家永遠抓起「最上層」的那塊拼圖。
> 3. **拖曳更新**：記錄滑鼠偏移量 `dragOffsetX/Y`，在 `mousemove` 中更新座標。
> 4. **吸附物理**：在 `mouseup` 時計算與目標座標 `(cx, cy)` 的距離，若小於 30px，則瞬間歸位 (`p.locked = true`) 並播放 Web Audio 音效。

---

### 步驟 5：渲染擴展與 AutoPilot 整合
**【核心目標】**：修復「隱形的拼圖凸塊 (Invisible Tabs Bug)」，並加入基於 LERP (線性插值) 的 AutoPilot 自動駕駛展示功能。

> 完成 `game.js` 的最終工業化打磨。
> 要求：
> 1. **渲染擴展 (Bug 修正)**：在 `_drawPieceContent` 中，當使用 `drawImage` 切割來源圖片時，裁切範圍的寬高必須是 `p.w * (1 + inset * 2)`，並往左上偏移，否則凸塊 (Tab) 區域會被切斷變成透明！
> 2. **陰影分離**：未鎖定的拼圖需畫出陰影與青色發光邊框，已鎖定的拼圖則取消邊框與陰影，讓畫面無縫接合。
> 3. **AutoPilot**：在 `_updateAutoPilot` 迴圈中，找到第一個未鎖定的拼圖，使用 `p.x += (p.cx - p.x) * 0.05` 平滑移動至解答位置，營造極致舒壓的自動解謎視覺效果。
