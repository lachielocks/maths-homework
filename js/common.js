/** Theme toggle, keyboard shortcuts, konami. */
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

    function isTypingTarget(el) {
        if (!el) return false;
        const tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && !isTypingTarget(document.activeElement)) {
            const search = document.getElementById('searchInput');
            if (search) {
                e.preventDefault();
                search.focus();
                search.select();
            }
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
});
