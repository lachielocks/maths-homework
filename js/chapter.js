document.addEventListener('DOMContentLoaded', () => {
    const {
        belongsToChapter,
        groupData,
        sortChapterHomework
    } = HomeworkUtils;

    const params = new URLSearchParams(window.location.search);
    const chapterNum = parseInt(params.get('chapter'), 10);

    const grid = document.getElementById('grid');
    const unsortedGrid = document.getElementById('unsortedGrid');
    const unsortedSection = document.getElementById('unsortedSection');
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

    pageTitle.textContent = `Chapter ${chapterNum}`;
    breadcrumbChapter.textContent = `Chapter ${chapterNum}`;
    document.title = `Chapter ${chapterNum} — Lachie's Maths Homework`;

    let allData = [];
    let chapterMain = [];
    let chapterUnsorted = [];
    let searchAllWork = false;
    let filteredMain = [];
    let filteredUnsorted = [];
    let flatDisplayList = [];
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

    function rebuildFlatList() {
        flatDisplayList = [...filteredMain, ...filteredUnsorted];
    }

    function applySearch(query) {
        const q = query.toLowerCase().trim();
        const pool = searchAllWork ? allData : [...chapterMain, ...chapterUnsorted];

        if (!q) {
            filteredMain = [...chapterMain];
            filteredUnsorted = [...chapterUnsorted];
        } else {
            const matched = pool.filter(item => item.title.toLowerCase().includes(q));
            if (searchAllWork) {
                filteredMain = matched;
                filteredUnsorted = [];
                unsortedSection.classList.add('hidden');
            } else {
                const mainSet = new Set(chapterMain.map(i => i.title));
                const unsortedSet = new Set(chapterUnsorted.map(i => i.title));
                filteredMain = matched.filter(i => mainSet.has(i.title));
                filteredUnsorted = matched.filter(i => unsortedSet.has(i.title));
                unsortedSection.classList.toggle('hidden', filteredUnsorted.length === 0);
            }
        }
        rebuildFlatList();
        currentPage = 1;
        render();
    }

    function renderUnsorted() {
        if (searchAllWork || filteredUnsorted.length === 0) {
            unsortedSection.classList.add('hidden');
            unsortedGrid.innerHTML = '';
            return;
        }
        unsortedSection.classList.remove('hidden');
        unsortedGrid.innerHTML = filteredUnsorted.map((item, i) =>
            renderCard(item, filteredMain.length + i)
        ).join('');
        HomeworkLightbox.bindCards(unsortedGrid, () => flatDisplayList);
    }

    function updatePagination(totalPages) {
        const newText = `Page ${currentPage} of ${totalPages}`;
        pageInfo.textContent = newText;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    function render() {
        if (flatDisplayList.length === 0) {
            grid.innerHTML = '';
            unsortedGrid.innerHTML = '';
            unsortedSection.classList.add('hidden');
            noResults.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        pagination.classList.remove('hidden');

        const mainOnly = searchAllWork ? flatDisplayList : filteredMain;
        const totalPages = Math.max(1, Math.ceil(mainOnly.length / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const pageData = mainOnly.slice(startIndex, startIndex + itemsPerPage);

        grid.innerHTML = pageData.map((item, i) =>
            renderCard(item, startIndex + i)
        ).join('');

        HomeworkLightbox.bindCards(grid, () => flatDisplayList);
        renderUnsorted();
        updatePagination(totalPages);
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
        const mainOnly = searchAllWork ? flatDisplayList : filteredMain;
        const totalPages = Math.ceil(mainOnly.length / itemsPerPage);
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
                unsortedSection.classList.add('hidden');
                return;
            }
            const grouped = groupData(chapterRaw);
            const { main, unsorted } = sortChapterHomework(grouped, chapterNum);

            allData = groupData(rawData);
            chapterMain = main;
            chapterUnsorted = unsorted;
            filteredMain = [...main];
            filteredUnsorted = [...unsorted];
            rebuildFlatList();
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">Error loading homework.</p>';
            pagination.classList.add('hidden');
        }
    }

    loadData();
});
