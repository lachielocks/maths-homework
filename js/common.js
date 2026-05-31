/** Theme toggle and lightbox — shared across pages. */
document.addEventListener('DOMContentLoaded', () => {
    const themes = ['auto', 'light', 'dark'];
    let currentThemeIndex = 0;
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icons = {
            auto: document.getElementById('icon-auto'),
            light: document.getElementById('icon-light'),
            dark: document.getElementById('icon-dark')
        };

        function applyTheme() {
            const theme = themes[currentThemeIndex];
            if (theme === 'auto') {
                document.documentElement.removeAttribute('data-theme');
            } else {
                document.documentElement.setAttribute('data-theme', theme);
            }
            localStorage.setItem('theme', theme);
            Object.keys(icons).forEach(k => {
                if (icons[k]) {
                    icons[k].classList.toggle('hidden', k !== theme);
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
    }

    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxClose = document.getElementById('lightboxClose');
    const lbPagination = document.getElementById('lightboxPagination');
    const lbPrevBtn = document.getElementById('lbPrevBtn');
    const lbNextBtn = document.getElementById('lbNextBtn');
    const lbPageInfo = document.getElementById('lbPageInfo');

    let currentLightboxItem = null;
    let currentPartIndex = 0;
    let lightboxDataSource = [];

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
            lbPageInfo.textContent = `Part ${currentPartIndex + 1} of ${currentLightboxItem.parts.length}`;
        } else {
            lbPagination.classList.add('hidden');
        }
    }

    function openLightbox(index, dataSource) {
        lightboxDataSource = dataSource || [];
        const item = lightboxDataSource[index];
        if (!item) return;

        currentLightboxItem = item;
        currentPartIndex = 0;
        renderLightboxPart();

        void lightbox.offsetWidth;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { lightboxImg.src = ''; }, 300);
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

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            closeLightbox();
        }
    });

    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
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

    window.HomeworkLightbox = {
        open: openLightbox,
        bindCards(container, getDataSource) {
            container.querySelectorAll('.card').forEach(card => {
                const handler = () => {
                    const ds = typeof getDataSource === 'function' ? getDataSource() : getDataSource;
                    openLightbox(parseInt(card.dataset.index, 10), ds);
                };
                card.addEventListener('click', handler);
                card.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handler();
                    }
                });
            });
        }
    };
});
