document.addEventListener('DOMContentLoaded', () => {
    const {
        belongsToChapter,
        groupData,
        sortChapterHomework
    } = HomeworkUtils;

    const params = new URLSearchParams(window.location.search);
    const chapterNum = parseInt(params.get('chapter'), 10);

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const searchScopeBtn = document.getElementById('searchScopeBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    const pageTitle = document.getElementById('pageTitle');
    const breadcrumbChapter = document.getElementById('breadcrumbChapter');

    if (!chapterNum || Number.isNaN(chapterNum)) {
        window.location.href = 'index.html';
        return;
    }

    const { getChapterAccent } = HomeworkUtils;
    const accent = getChapterAccent(chapterNum);

    pageTitle.textContent = `Chapter ${chapterNum}`;
    breadcrumbChapter.textContent = `Chapter ${chapterNum}`;
    document.title = `Chapter ${chapterNum} — Lachie's Maths Homework`;
    document.documentElement.style.setProperty('--accent-color', accent.css);
    document.documentElement.style.setProperty('--accent-hover', accent.cssHover);
    document.documentElement.style.setProperty('--focus-ring', accent.ring);
    document.documentElement.dataset.chapter = String(chapterNum);

    let allData = [];
    let chapterItems = [];
    let searchAllWork = false;
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 12;

    function renderCard(item, index) {
        return `
            <div class="card" tabindex="0" data-index="${index}" style="animation-delay: ${(index % itemsPerPage) * 0.05}s">
                <div class="card-image-wrapper">
                    <img src="${item.parts[0].path}" alt="${item.title}" class="card-image" loading="lazy">
                    ${(item.parts.length > 1 || item.halfLesson) ? `
                        <div class="card-badges">
                            ${item.parts.length > 1 ? `<div class="parts-badge">${item.parts.length} Parts</div>` : ''}
                            ${item.halfLesson ? `<div class="parts-badge">Only Half Because of Missed Lesson</div>` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                </div>
            </div>
        `;
    }

    function applySearch(query) {
        const q = query.toLowerCase().trim();
        const pool = searchAllWork ? allData : chapterItems;

        filteredData = q
            ? pool.filter(item => item.title.toLowerCase().includes(q))
            : [...pool];
        currentPage = 1;
        render();
    }

    function render() {
        if (filteredData.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        pagination.classList.remove('hidden');

        const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

        grid.innerHTML = pageData.map((item, i) =>
            renderCard(item, startIndex + i)
        ).join('');

        HomeworkLightbox.bindCards(grid, () => filteredData);

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    searchInput.addEventListener('input', (e) => applySearch(e.target.value));

    searchScopeBtn.addEventListener('click', () => {
        searchAllWork = !searchAllWork;
        searchScopeBtn.classList.toggle('active', searchAllWork);
        searchScopeBtn.setAttribute('aria-pressed', String(searchAllWork));
        searchScopeBtn.title = searchAllWork
            ? 'Searching all homework — click to search this chapter only'
            : 'Searching this chapter only — click to search all homework';
        searchInput.placeholder = searchAllWork
            ? 'Search all homework...'
            : `Search Chapter ${chapterNum}...`;
        applySearch(searchInput.value);
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            render();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const rawData = await response.json();
            const chapterRaw = rawData.filter(item => belongsToChapter(item, chapterNum));
            if (chapterRaw.length === 0) {
                grid.innerHTML = '<p class="load-error">No homework for this chapter yet.</p>';
                pagination.classList.add('hidden');
                return;
            }
            const grouped = groupData(chapterRaw);
            const { main } = sortChapterHomework(grouped, chapterNum);

            allData = groupData(rawData);
            chapterItems = main;
            filteredData = [...main];
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">Error loading homework.</p>';
            pagination.classList.add('hidden');
        }
    }

    loadData();
});
