/** Lightbox with zoom, pan, compare, download, and keyboard controls. */
(function () {
    const LIGHTBOX_HTML = `
    <div id="lightbox" class="lightbox" aria-modal="true" role="dialog" aria-label="Homework viewer">
        <button type="button" id="lightboxClose" class="lightbox-close" aria-label="Close">
            <div class="math-grid">
                <span class="sym-plus">+</span>
                <span class="sym-minus">-</span>
                <span class="sym-times">&times;</span>
                <span class="sym-div">&divide;</span>
            </div>
        </button>
        <div class="lightbox-toolbar" role="toolbar" aria-label="Image controls">
            <button type="button" id="lbZoomOut" class="lb-tool-btn" aria-label="Zoom out">−</button>
            <button type="button" id="lbZoomReset" class="lb-tool-btn lb-zoom-label" aria-label="Reset zoom">100%</button>
            <button type="button" id="lbZoomIn" class="lb-tool-btn" aria-label="Zoom in">+</button>
            <span class="lb-toolbar-divider" aria-hidden="true"></span>
            <button type="button" id="lbCompare" class="lb-tool-btn hidden" aria-pressed="false">Compare parts</button>
            <a id="lbOpen" class="lb-tool-btn lb-tool-link" href="#" target="_blank" rel="noopener">Open</a>
            <a id="lbDownload" class="lb-tool-btn lb-tool-link" href="#" download>Download</a>
        </div>
        <div class="lightbox-content">
            <div id="lbViewport" class="lightbox-viewport">
                <div class="lightbox-pane" id="lbPaneA" data-pane="a">
                    <div class="lightbox-pan-layer" id="lbPanA">
                        <img id="lightboxImg" src="" alt="">
                    </div>
                    <span class="lightbox-pane-label hidden" id="lbLabelA"></span>
                </div>
                <div class="lightbox-pane hidden" id="lbPaneB" data-pane="b">
                    <div class="lightbox-pan-layer" id="lbPanB">
                        <img id="lightboxImg2" src="" alt="">
                    </div>
                    <span class="lightbox-pane-label" id="lbLabelB"></span>
                </div>
            </div>
            <p class="lightbox-hint" id="lbHint">Scroll or pinch to zoom · Drag to pan · ← → change part</p>
            <h2 id="lightboxTitle"></h2>
            <div class="lightbox-compare-pick hidden" id="lbComparePick">
                <label for="lbCompareSelect">Compare with</label>
                <select id="lbCompareSelect" class="lb-compare-select"></select>
            </div>
            <div class="pagination-container lightbox-pagination hidden" id="lightboxPagination">
                <button type="button" id="lbPrevBtn" class="btn" aria-label="Previous part">Previous</button>
                <span id="lbPageInfo" class="page-info">Part 1</span>
                <button type="button" id="lbNextBtn" class="btn" aria-label="Next part">Next</button>
            </div>
        </div>
    </div>`;

    function injectLightbox() {
        const existing = document.getElementById('lightbox');
        if (existing?.querySelector('#lbViewport')) return;
        existing?.remove();
        document.body.insertAdjacentHTML('beforeend', LIGHTBOX_HTML);
    }

    injectLightbox();

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxImg2 = document.getElementById('lightboxImg2');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxClose = document.getElementById('lightboxClose');
    const lbPagination = document.getElementById('lightboxPagination');
    const lbPrevBtn = document.getElementById('lbPrevBtn');
    const lbNextBtn = document.getElementById('lbNextBtn');
    const lbPageInfo = document.getElementById('lbPageInfo');
    const lbViewport = document.getElementById('lbViewport');
    const lbPaneA = document.getElementById('lbPaneA');
    const lbPaneB = document.getElementById('lbPaneB');
    const lbPanA = document.getElementById('lbPanA');
    const lbPanB = document.getElementById('lbPanB');
    const lbLabelA = document.getElementById('lbLabelA');
    const lbLabelB = document.getElementById('lbLabelB');
    const lbCompare = document.getElementById('lbCompare');
    const lbZoomIn = document.getElementById('lbZoomIn');
    const lbZoomOut = document.getElementById('lbZoomOut');
    const lbZoomReset = document.getElementById('lbZoomReset');
    const lbOpen = document.getElementById('lbOpen');
    const lbDownload = document.getElementById('lbDownload');
    const lbHint = document.getElementById('lbHint');
    const lbComparePick = document.getElementById('lbComparePick');
    const lbCompareSelect = document.getElementById('lbCompareSelect');

    let currentLightboxItem = null;
    let currentPartIndex = 0;
    let lightboxDataSource = [];
    let compareMode = false;
    let compareRightIndex = 1;

    const panState = {
        a: { scale: 1, x: 0, y: 0 },
        b: { scale: 1, x: 0, y: 0 }
    };

    function currentPart() {
        return currentLightboxItem?.parts[currentPartIndex];
    }

    function applyTransform(paneKey) {
        const layer = paneKey === 'a' ? lbPanA : lbPanB;
        const s = panState[paneKey];
        layer.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.scale})`;
    }

    function resetPan(paneKey) {
        panState[paneKey] = { scale: 1, x: 0, y: 0 };
        applyTransform(paneKey);
        updateZoomLabel();
    }

    function resetAllPan() {
        resetPan('a');
        resetPan('b');
    }

    function updateZoomLabel() {
        const pct = Math.round(panState.a.scale * 100);
        lbZoomReset.textContent = `${pct}%`;
    }

    function setZoom(paneKey, delta) {
        const s = panState[paneKey];
        const next = Math.min(5, Math.max(0.5, s.scale + delta));
        s.scale = next;
        applyTransform(paneKey);
        if (paneKey === 'a') updateZoomLabel();
    }

    function updateFileActions(part) {
        if (!part) return;
        lbOpen.href = part.path;
        lbDownload.href = part.path;
        const name = part.filename || part.path.split('/').pop();
        lbDownload.download = name || 'homework';
    }

    function updateCompareUI() {
        const multi = currentLightboxItem && currentLightboxItem.parts.length > 1;
        lbCompare.classList.toggle('hidden', !multi);
        lbViewport.classList.toggle('compare', compareMode && multi);
        lbPaneB.classList.toggle('hidden', !compareMode || !multi);
        lbLabelA.classList.toggle('hidden', !compareMode || !multi);
        lbCompare.setAttribute('aria-pressed', String(compareMode));
        lbComparePick.classList.toggle('hidden', !compareMode || !multi || currentLightboxItem.parts.length < 3);

        if (compareMode && multi) {
            if (compareRightIndex === currentPartIndex) {
                compareRightIndex = currentPartIndex === 0 ? 1 : 0;
            }
            const partA = currentLightboxItem.parts[currentPartIndex];
            const partB = currentLightboxItem.parts[compareRightIndex];
            lightboxImg.src = partA.path;
            lightboxImg2.src = partB.path;
            lightboxImg.alt = `${currentLightboxItem.title} part ${currentPartIndex + 1}`;
            lightboxImg2.alt = `${currentLightboxItem.title} part ${compareRightIndex + 1}`;
            lbLabelA.textContent = `Part ${currentPartIndex + 1}`;
            lbLabelB.textContent = `Part ${compareRightIndex + 1}`;
            updateFileActions(partA);
        }
    }

    function fillCompareSelect() {
        if (!currentLightboxItem || currentLightboxItem.parts.length < 3) return;
        lbCompareSelect.innerHTML = currentLightboxItem.parts
            .map((_, i) => {
                if (i === currentPartIndex) return '';
                return `<option value="${i}" ${i === compareRightIndex ? 'selected' : ''}>Part ${i + 1}</option>`;
            })
            .join('');
    }

    function renderLightboxPart() {
        const part = currentPart();
        if (!part) return;

        if (!compareMode) {
            lightboxImg.src = part.path;
            lightboxImg.alt = currentLightboxItem.title;
            updateFileActions(part);
        } else {
            updateCompareUI();
        }

        const titleText = currentLightboxItem.parts.length > 1
            ? `${currentLightboxItem.title} (Part ${currentPartIndex + 1} of ${currentLightboxItem.parts.length})`
            : currentLightboxItem.title;
        lightboxTitle.textContent = titleText;

        const multi = currentLightboxItem.parts.length > 1;
        if (multi && !compareMode) {
            lbPagination.classList.remove('hidden');
            lbPrevBtn.disabled = currentPartIndex === 0;
            lbNextBtn.disabled = currentPartIndex === currentLightboxItem.parts.length - 1;
            lbPageInfo.textContent = `Part ${currentPartIndex + 1} of ${currentLightboxItem.parts.length}`;
        } else {
            lbPagination.classList.add('hidden');
        }

        updateCompareUI();
        fillCompareSelect();
    }

    function openLightbox(index, dataSource) {
        lightboxDataSource = dataSource || [];
        const item = lightboxDataSource[index];
        if (!item) return;

        currentLightboxItem = item;
        currentPartIndex = 0;
        compareMode = false;
        compareRightIndex = item.parts.length > 1 ? 1 : 0;
        resetAllPan();
        renderLightboxPart();

        void lightbox.offsetWidth;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        lightboxClose.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        compareMode = false;
        document.body.style.overflow = '';
        setTimeout(() => {
            lightboxImg.src = '';
            lightboxImg2.src = '';
        }, 300);
    }

    function goPart(delta) {
        if (!currentLightboxItem || compareMode) return;
        const next = currentPartIndex + delta;
        if (next < 0 || next >= currentLightboxItem.parts.length) return;
        currentPartIndex = next;
        resetPan('a');
        renderLightboxPart();
    }

    function setupPan(layer, paneKey) {
        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startPanX = 0;
        let startPanY = 0;

        layer.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const s = panState[paneKey];
            startPanX = s.x;
            startPanY = s.y;
            layer.setPointerCapture(e.pointerId);
        });

        layer.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const s = panState[paneKey];
            s.x = startPanX + (e.clientX - startX);
            s.y = startPanY + (e.clientY - startY);
            applyTransform(paneKey);
        });

        layer.addEventListener('pointerup', () => { dragging = false; });
        layer.addEventListener('pointercancel', () => { dragging = false; });

        layer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.15 : 0.15;
            setZoom(paneKey, delta);
        }, { passive: false });
    }

    setupPan(lbPanA, 'a');
    setupPan(lbPanB, 'b');

    lbZoomIn.addEventListener('click', () => setZoom('a', 0.25));
    lbZoomOut.addEventListener('click', () => setZoom('a', -0.25));
    lbZoomReset.addEventListener('click', () => resetPan('a'));

    lbCompare.addEventListener('click', () => {
        compareMode = !compareMode;
        resetAllPan();
        renderLightboxPart();
    });

    lbCompareSelect.addEventListener('change', () => {
        compareRightIndex = parseInt(lbCompareSelect.value, 10);
        resetPan('b');
        updateCompareUI();
    });

    lbPrevBtn.addEventListener('click', () => goPart(-1));
    lbNextBtn.addEventListener('click', () => goPart(1));

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.target.matches('input, textarea, select')) return;

        if (e.key === 'Escape') {
            closeLightbox();
            return;
        }
        if (compareMode) return;

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goPart(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            goPart(1);
        } else if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            setZoom('a', 0.25);
        } else if (e.key === '-') {
            e.preventDefault();
            setZoom('a', -0.25);
        } else if (e.key === '0') {
            e.preventDefault();
            resetPan('a');
        } else if (e.key === 'c' && currentLightboxItem?.parts.length > 1) {
            e.preventDefault();
            compareMode = true;
            resetAllPan();
            renderLightboxPart();
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
})();
