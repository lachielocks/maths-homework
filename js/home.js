document.addEventListener('DOMContentLoaded', () => {
    const { discoverChapters } = HomeworkUtils;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');

    let chapters = [];
    let filteredChapters = [];

    function renderChapterCard(chapterNum, index) {
        return `
            <a href="chapter.html?chapter=${chapterNum}" class="chapter-card" style="animation-delay: ${index * 0.05}s">
                <span class="chapter-card-number">${chapterNum}</span>
                <h2 class="chapter-card-title">Chapter ${chapterNum}</h2>
                <span class="chapter-card-cta">View homework →</span>
            </a>
        `;
    }

    function render() {
        if (filteredChapters.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            return;
        }

        noResults.classList.add('hidden');
        grid.innerHTML = filteredChapters.map((n, i) => renderChapterCard(n, i)).join('');
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
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">No homework found or error loading data. Make sure data.json exists.</p>';
        }
    }

    loadData();
});
