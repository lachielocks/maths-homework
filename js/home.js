document.addEventListener('DOMContentLoaded', () => {
    const { discoverChapters, getAllUnsorted } = HomeworkUtils;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');

    let chapters = [];
    let filteredChapters = [];
    let unsortedCount = 0;
    let showUnsortedCard = true;

    function renderChapterCard(chapterNum, index) {
        return `
            <a href="chapter.html?chapter=${chapterNum}" class="chapter-card" style="animation-delay: ${index * 0.05}s">
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

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
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
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">No homework found or error loading data. Make sure data.json exists.</p>';
        }
    }

    loadData();
});
