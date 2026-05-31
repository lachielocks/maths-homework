document.addEventListener('DOMContentLoaded', () => {
    const {
        discoverChapters,
        getAllUnsorted,
        getChapterAccent,
        getSiteStats
    } = HomeworkUtils;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');
    const statsBar = document.getElementById('statsBar');

    let chapters = [];
    let filteredChapters = [];
    let unsortedCount = 0;
    let showUnsortedCard = true;

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

    function renderStats(stats) {
        statsBar.innerHTML = `
            <div class="stats-bar__counts">
                <div class="stat">
                    <span class="stat-value">${stats.exercises}</span>
                    <span class="stat-label">Exercises</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${stats.chapters}</span>
                    <span class="stat-label">Chapters</span>
                </div>
            </div>
            <p class="stats-note">
                <svg class="stats-info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <span>Since Term 2 Year 9</span>
            </p>
        `;
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
            renderStats(getSiteStats(rawData));
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">No homework found or error loading data. Make sure data.json exists.</p>';
        }
    }

    loadData();
});
