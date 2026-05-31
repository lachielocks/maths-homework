document.addEventListener('DOMContentLoaded', () => {
    const {
        discoverChapters,
        getAllUnsorted,
        getChapterAccent,
        getSiteStats,
        getRecentlyAdded
    } = HomeworkUtils;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');
    const statsBar = document.getElementById('statsBar');
    const recentSection = document.getElementById('recentSection');
    const recentGrid = document.getElementById('recentGrid');

    let chapters = [];
    let filteredChapters = [];
    let unsortedCount = 0;
    let showUnsortedCard = true;
    let recentItems = [];

    function formatRelativeTime(ms) {
        const diff = Date.now() - ms;
        const days = Math.floor(diff / 86400000);
        if (days < 1) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    function renderChapterCard(chapterNum, index) {
        const accent = getChapterAccent(chapterNum);
        return `
            <a href="chapter.html?chapter=${chapterNum}" class="chapter-card" data-chapter="${chapterNum}"
               style="--chapter-accent: ${accent.css}; --chapter-accent-hover: ${accent.cssHover}; --chapter-ring: ${accent.ring}; animation-delay: ${index * 0.05}s">
                <span class="chapter-card-number">${chapterNum}</span>
                <h2 class="chapter-card-title">Chapter ${chapterNum}</h2>
                <span class="chapter-card-cta">View homework →</span>
            </a>
        `;
    }

    function renderUnsortedCard(index) {
        const countLabel = unsortedCount > 0 ? `${unsortedCount} item${unsortedCount === 1 ? '' : 's'}` : 'Empty';
        return `
            <a href="unsorted.html" class="chapter-card chapter-card--unsorted" style="animation-delay: ${index * 0.05}s">
                <span class="chapter-card-label" aria-hidden="true">?</span>
                <h2 class="chapter-card-title">Unsorted Work</h2>
                <span class="chapter-card-cta">${countLabel} →</span>
            </a>
        `;
    }

    function renderRecentCard(item, index) {
        return `
            <div class="card card--recent" tabindex="0" data-index="${index}" style="animation-delay: ${index * 0.04}s">
                <div class="card-image-wrapper">
                    <img src="${item.parts[0].path}" alt="${item.title}" class="card-image" loading="lazy">
                    <span class="recent-badge">${formatRelativeTime(item.mtime)}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                </div>
            </div>
        `;
    }

    function renderStats(stats) {
        statsBar.innerHTML = `
            <div class="stat"><span class="stat-value">${stats.sheets}</span><span class="stat-label">Sheets</span></div>
            <div class="stat"><span class="stat-value">${stats.exercises}</span><span class="stat-label">Exercises</span></div>
            <div class="stat"><span class="stat-value">${stats.chapters}</span><span class="stat-label">Chapters</span></div>
            <div class="stat"><span class="stat-value">${stats.unsorted}</span><span class="stat-label">Unsorted</span></div>
        `;
    }

    function renderRecent() {
        if (recentItems.length === 0) {
            recentSection.classList.add('hidden');
            return;
        }
        recentSection.classList.remove('hidden');
        recentGrid.innerHTML = recentItems.map(renderRecentCard).join('');
        HomeworkLightbox.bindCards(recentGrid, () => recentItems);
    }

    function matchesUnsortedSearch(query) {
        return !query ||
            query.includes('unsorted') ||
            query.includes('year 10') ||
            query.includes('year10');
    }

    function render() {
        const query = searchInput.value.toLowerCase().trim();
        const chapterCards = filteredChapters.map((n, i) => renderChapterCard(n, i));
        const unsortedVisible = showUnsortedCard && matchesUnsortedSearch(query);
        const unsortedCard = unsortedVisible ? [renderUnsortedCard(chapterCards.length)] : [];

        const html = [...chapterCards, ...unsortedCard].join('');

        if (!html) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        grid.innerHTML = html;
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            filteredChapters = [...chapters];
        } else {
            filteredChapters = chapters.filter(n =>
                String(n).includes(query) ||
                `chapter ${n}`.includes(query)
            );
        }
        render();
    });

    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const rawData = await response.json();
            chapters = discoverChapters(rawData);
            filteredChapters = [...chapters];
            unsortedCount = getAllUnsorted(rawData).length;
            showUnsortedCard = true;
            recentItems = getRecentlyAdded(rawData, 6);
            renderStats(getSiteStats(rawData));
            renderRecent();
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">No homework found or error loading data. Make sure data.json exists.</p>';
        }
    }

    loadData();
});
