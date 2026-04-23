document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('grid');
    const searchInput = document.getElementById('searchInput');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');
    
    // Lightbox elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxClose = document.getElementById('lightboxClose');

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 12;

    // Fetch data
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            allData = await response.json();
            filteredData = [...allData];
            render();
        } catch (error) {
            console.error('Error loading data:', error);
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No homework found or error loading data. Make sure data.json exists.</p>';
            pagination.classList.add('hidden');
        }
    }

    // Render grid
    function render() {
        if (filteredData.length === 0) {
            grid.innerHTML = '';
            noResults.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        pagination.classList.remove('hidden');

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        grid.innerHTML = pageData.map((item, index) => `
            <div class="card" tabindex="0" data-index="${startIndex + index}">
                <div class="card-image-wrapper">
                    <img src="${item.path}" alt="${item.title}" class="card-image" loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${item.title}</h3>
                </div>
            </div>
        `).join('');

        // Add click and keyboard events for lightbox
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', () => openLightbox(card.dataset.index));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openLightbox(card.dataset.index);
                }
            });
        });

        updatePagination(totalPages);
    }

    function updatePagination(totalPages) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // Event Listeners
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredData = allData.filter(item => 
            item.title.toLowerCase().includes(query)
        );
        currentPage = 1; // Reset to first page on search
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

    // Lightbox Logic
    function openLightbox(index) {
        const item = filteredData[index];
        if (!item) return;
        
        lightboxImg.src = item.path;
        lightboxImg.alt = item.title;
        lightboxTitle.textContent = item.title;
        
        lightbox.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind lightbox
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = '';
        }, 300); // clear after fade out
    }

    lightboxClose.addEventListener('click', closeLightbox);
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
            closeLightbox();
        }
    });

    // Init
    loadData();
});
