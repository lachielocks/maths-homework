document.addEventListener('DOMContentLoaded', () => {
    const { getAllUnsorted } = HomeworkUtils;

    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');

    let allUnsorted = [];
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

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filteredData = query
            ? allUnsorted.filter(item => item.title.toLowerCase().includes(query))
            : [...allUnsorted];
        currentPage = 1;
        render();
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
            allUnsorted = getAllUnsorted(rawData);
            filteredData = [...allUnsorted];
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p class="load-error">Error loading homework.</p>';
            pagination.classList.add('hidden');
        }
    }

    loadData();
});
