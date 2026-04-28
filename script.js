document.addEventListener('DOMContentLoaded', () => {
    // Theme logic
    const themes = ['auto', 'light', 'dark'];
    let currentThemeIndex = 0;
    const themeToggle = document.getElementById('themeToggle');
    const icons = {
        'auto': document.getElementById('icon-auto'),
        'light': document.getElementById('icon-light'),
        'dark': document.getElementById('icon-dark')
    };

    function applyTheme() {
        const theme = themes[currentThemeIndex];
        if (theme === 'auto') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem('theme', theme);
        
        // Update icons
        Object.keys(icons).forEach(k => {
            if (k === theme) {
                icons[k].classList.remove('hidden');
            } else {
                icons[k].classList.add('hidden');
            }
        });
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes.includes(savedTheme)) {
        currentThemeIndex = themes.indexOf(savedTheme);
    }
    applyTheme();

    themeToggle.addEventListener('click', () => {
        currentThemeIndex = (currentThemeIndex + 1) % themes.length;
        applyTheme();
    });

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
    
    // Lightbox pagination
    const lbPagination = document.getElementById('lightboxPagination');
    const lbPrevBtn = document.getElementById('lbPrevBtn');
    const lbNextBtn = document.getElementById('lbNextBtn');
    const lbPageInfo = document.getElementById('lbPageInfo');

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 12;
    
    let currentLightboxItem = null;
    let currentPartIndex = 0;

    function groupData(data) {
        const groups = new Map();
        
        data.forEach(item => {
            const match = item.title.match(/^(.*?)(?:\s*-?\s*(?:Part|Pt)\s*(\d+))?$/i);
            const baseTitle = match[1].trim() || item.title;
            const partNum = match[2] ? parseInt(match[2], 10) : 1;
            
            if (!groups.has(baseTitle)) {
                groups.set(baseTitle, {
                    title: baseTitle,
                    mtime: item.mtime,
                    parts: []
                });
            }
            
            const group = groups.get(baseTitle);
            group.parts.push({
                ...item,
                partNum
            });
            
            if (item.mtime > group.mtime) {
                group.mtime = item.mtime;
            }
        });
        
        const result = Array.from(groups.values()).map(group => {
            group.parts.sort((a, b) => a.partNum - b.partNum);
            return group;
        });
        
        result.sort((a, b) => b.mtime - a.mtime);
        return result;
    }

    // Fetch data
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const rawData = await response.json();
            allData = groupData(rawData);
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
            <div class="card" tabindex="0" data-index="${startIndex + index}" style="animation-delay: ${index * 0.05}s">
                <div class="card-image-wrapper">
                    <img src="${item.parts[0].path}" alt="${item.title}" class="card-image" loading="lazy">
                    ${item.parts.length > 1 ? `<div class="parts-badge">${item.parts.length} Parts</div>` : ''}
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
        const newText = `Page ${currentPage} of ${totalPages}`;
        if (pageInfo.textContent === newText) {
            prevBtn.disabled = currentPage === 1;
            nextBtn.disabled = currentPage === totalPages;
            return;
        }
        
        pageInfo.classList.add('flip-out');
        setTimeout(() => {
            pageInfo.textContent = newText;
            pageInfo.style.transition = 'none';
            pageInfo.style.transform = 'rotateX(-90deg)';
            
            // force reflow
            void pageInfo.offsetWidth;
            
            pageInfo.style.transition = '';
            pageInfo.classList.remove('flip-out');
            pageInfo.style.transform = '';
        }, 150);

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
    function renderLightboxPart() {
        const part = currentLightboxItem.parts[currentPartIndex];
        lightboxImg.src = part.path;
        lightboxImg.alt = currentLightboxItem.title;
        
        const titleText = currentLightboxItem.parts.length > 1 
            ? `${currentLightboxItem.title} (Part ${currentPartIndex + 1} of ${currentLightboxItem.parts.length})`
            : currentLightboxItem.title;
            
        lightboxTitle.textContent = titleText;
        
        if (currentLightboxItem.parts.length > 1) {
            lbPagination.classList.remove('hidden');
            lbPrevBtn.disabled = currentPartIndex === 0;
            lbNextBtn.disabled = currentPartIndex === currentLightboxItem.parts.length - 1;
            
            const newText = `Part ${currentPartIndex + 1} of ${currentLightboxItem.parts.length}`;
            if (lbPageInfo.textContent !== newText) {
                lbPageInfo.classList.add('flip-out');
                setTimeout(() => {
                    lbPageInfo.textContent = newText;
                    lbPageInfo.style.transition = 'none';
                    lbPageInfo.style.transform = 'rotateX(-90deg)';
                    void lbPageInfo.offsetWidth;
                    lbPageInfo.style.transition = '';
                    lbPageInfo.classList.remove('flip-out');
                    lbPageInfo.style.transform = '';
                }, 150);
            } else {
                lbPageInfo.textContent = newText;
            }
        } else {
            lbPagination.classList.add('hidden');
        }
    }

    function openLightbox(index) {
        const item = filteredData[index];
        if (!item) return;
        
        currentLightboxItem = item;
        currentPartIndex = 0;
        
        lbPageInfo.textContent = currentLightboxItem.parts.length > 1 ? `Part 1 of ${currentLightboxItem.parts.length}` : 'Part 1';
        
        renderLightboxPart();
        
        void lightbox.offsetWidth; // Force reflow
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind lightbox
        lightboxClose.focus();
    }

    lbPrevBtn.addEventListener('click', () => {
        if (currentPartIndex > 0) {
            currentPartIndex--;
            renderLightboxPart();
        }
    });

    lbNextBtn.addEventListener('click', () => {
        if (currentLightboxItem && currentPartIndex < currentLightboxItem.parts.length - 1) {
            currentPartIndex++;
            renderLightboxPart();
        }
    });

    function closeLightbox() {
        lightbox.classList.remove('active');
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

    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
        
        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        if (key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                document.body.classList.toggle('konami');
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
            if (key === 'ArrowUp') konamiIndex = 1;
        }
    });

    // Init
    loadData();
});
