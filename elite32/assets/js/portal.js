const eliteAssets = [
    { id: "000_ChronosQuest", title: "時空打磚塊", desc: "來自 GAG_test2026 規劃", status: "active", icon: "fa-cube" },
    { id: "001_TetrisRemix", title: "俄羅斯方塊重製版", desc: "來自 GAG_test2026 規劃", status: "active", icon: "fa-shapes" },
    { id: "005_AIChess", title: "西洋棋", desc: "量子博弈 / Minimax AI", status: "active", icon: "fa-chess" },
    { id: "006_GeoGuessr", title: "世界地圖猜謎", desc: "地理資訊坐標演算法", status: "active", icon: "fa-earth-americas" },
    { id: "007_Gomoku", title: "五子棋", desc: "賽博水墨 / Heuristic AI", status: "active", icon: "fa-chess-board" },
    { id: "008_Wordle", title: "字彙英雄", desc: "Trie 字典樹結構", status: "active", icon: "fa-font" },
    { id: "009_Reversi", title: "黑白棋", desc: "矩陣權重評估演算法", status: "active", icon: "fa-circle-half-stroke" },
    { id: "010_Hidden_Object", title: "尋物大冒險", desc: "畫布圖層深度剖析", status: "active", icon: "fa-magnifying-glass" },
    { id: "011_FishingSim", title: "釣魚大師", desc: "動力學物理拋投", status: "active", icon: "fa-fish" },
    { id: "012_Crossword", title: "填字魔方", desc: "字串比對與交叉網格", status: "active", icon: "fa-table-cells-large" },
    { id: "013_Memory_Matching", title: "記憶翻牌", desc: "狀態機與排序演算法", status: "active", icon: "fa-clone" },
    { id: "014_Tank", title: "坦克大戰", desc: "碰撞箱演算引擎", status: "active", icon: "fa-truck-fast" },
    { id: "015_Calligraphy", title: "賽博書法", desc: "Shader 筆刷漸層演算", status: "active", icon: "fa-pen-nib" },
    { id: "016_2Bridge", title: "基礎橋牌教學", desc: "(已獨立拆分)", status: "active", icon: "fa-layer-group" },
    { id: "016_BridgePro", title: "專業橋牌賽事", desc: "複雜計分系統", status: "active", icon: "fa-trophy" },
    { id: "017_Tangram", title: "七巧板", desc: "多邊形碰撞與旋轉矩陣", status: "active", icon: "fa-puzzle-piece" },
    { id: "018_Pac_Man", title: "小精靈", desc: "路徑尋找演算法", status: "active", icon: "fa-ghost" },
    { id: "019_Tycoon", title: "大富翁 / 模擬經營", desc: "經濟數學模擬", status: "active", icon: "fa-coins" },
    { id: "020_Slots", title: "吃角子老虎機", desc: "亂數生成器與裝飾模式", status: "active", icon: "fa-gem" },
    { id: "021_Galaxian", title: "小蜜蜂 / 射擊", desc: "陣列管理與粒子系統", status: "active", icon: "fa-space-awesome" },
    { id: "022_Minesweeper", title: "掃雷英雄", desc: "區塊遞迴展開與機率分佈", status: "active", icon: "fa-bomb" },
    { id: "023_SpotDifference", title: "找不同", desc: "雙畫布影像對比", status: "active", icon: "fa-eye" },
    { id: "024_Chinese_Chess", title: "中式象棋", desc: "幾何路徑約束與走位引擎", status: "active", icon: "fa-chess-knight" },
    { id: "025_Texas_Holdem", title: "德州撲克", desc: "撲克機率論與決策樹", status: "active", icon: "fa-spade" },
    { id: "026_Jigsaw", title: "空中拼圖", desc: "貝茲曲線與相交物理", status: "active", icon: "fa-puzzle-piece" },
    { id: "027_Num_Dungeon", title: "數字地牢", desc: "離散數學與邏輯鎖", status: "active", icon: "fa-hashtag" },
    { id: "028_Rhythm", title: "節奏大師", desc: "音軌頻譜分析與矩陣判定", status: "active", icon: "fa-music" },
    { id: "029_Gold_Miner", title: "黃金礦工", desc: "向量拉力與重力模擬", status: "active", icon: "fa-anchor" },
    { id: "030_PvZ_Lite", title: "植物大戰殭屍Lite版", desc: "異步定時器陣列與防禦網格", status: "active", icon: "fa-leaf" },
    { id: "050_MahjongSolitaire", title: "麻將連連看", desc: "來自 GAG_test2026 規劃", status: "active", icon: "fa-border-all" },
    { id: "065_SudokuMaster", title: "數獨大師", desc: "來自 GAG_test2026 規劃", status: "active", icon: "fa-border-none" },
    { id: "098_BattleCityRemix", title: "坦克 1990 重製版", desc: "來自 GAG_test2026 規劃", status: "active", icon: "fa-truck-ramp-box" }
];

document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('assetGrid');
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Initial render
    renderCards(eliteAssets);

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filterType = e.target.dataset.filter;
            applyFilters(filterType, searchInput.value.toLowerCase());
        });
    });

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
        applyFilters(activeFilter, e.target.value.toLowerCase());
    });

    function applyFilters(statusFilter, searchTerm) {
        let filtered = eliteAssets;

        // Apply Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        // Apply Search Term
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                item.desc.toLowerCase().includes(searchTerm) ||
                item.id.toLowerCase().includes(searchTerm)
            );
        }

        renderCards(filtered);
    }

    function renderCards(data) {
        gridContainer.innerHTML = '';

        if (data.length === 0) {
            gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
                <i class="fa-solid fa-ghost fa-2x mb-3" style="margin-bottom:1rem; opacity:0.5;"></i>
                <p>No master-grade assets found matching your criteria.</p>
            </div>`;
            return;
        }

        data.forEach(asset => {
            const isPlanned = asset.status === 'planned';
            const statusClass = isPlanned ? 'status-planned' : 'status-active';
            const statusText = isPlanned ? 'PLANNED' : 'ACTIVE';
            
            // If active, it links to its folder's index.html. If planned, it does nothing (#).
            const href = isPlanned ? 'javascript:void(0);' : `./${asset.id}/index.html`;

            const card = document.createElement('a');
            card.className = 'asset-card';
            card.href = href;
            if(!isPlanned) card.target = '_blank'; // open game in new tab

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-icon">
                        <i class="fa-solid ${asset.icon}"></i>
                    </div>
                    <span class="card-status ${statusClass}">${statusText}</span>
                </div>
                <div class="card-body">
                    <div class="card-id">${asset.id.replace(/_/g, ' ')}</div>
                    <h2 class="card-title">${asset.title}</h2>
                    <p class="card-desc">${asset.desc}</p>
                </div>
                <div class="card-footer">
                    ${isPlanned ? 'Awaiting Development' : 'Launch Asset'}
                    <i class="fa-solid ${isPlanned ? 'fa-clock' : 'fa-arrow-right'}"></i>
                </div>
            `;

            // Adding a subtle stagger animation effect based on index
            card.style.animation = `fadeUp 0.5s ease forwards ${Math.random() * 0.2}s`;
            card.style.opacity = '0';

            gridContainer.appendChild(card);
        });
    }
});

// Add a simple animation dynamically
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fadeUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);
