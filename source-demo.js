(() => {
    const root = document.querySelector('.dp-source-demo');
    if (!root) return;
    const slide = root.closest('.slide');
    const card = root.querySelector('.mentoring-review');
    const detail = card.querySelector('.review-card-expanded');
    const source = root.querySelector('.review-source');
    const mark = source.querySelector('.source-mark-continuous');
    const strokes = document.createElement('div');
    strokes.className = 'source-strokes';
    strokes.setAttribute('aria-hidden', 'true');
    source.appendChild(strokes);
    let timers = [];
    function drawStrokes() {
        // Inline fragments follow the actual line wrapping at the fixed slide size.
        const bounds = source.getBoundingClientRect();
        const scale = bounds.width / source.offsetWidth;
        const fragments = [...mark.getClientRects()].filter(rect => rect.width > 0);
        const totalWidth = fragments.reduce((sum, rect) => sum + rect.width, 0);
        let delay = 150;
        strokes.replaceChildren();
        fragments.forEach(rect => {
            const stroke = document.createElement('span');
            const duration = 1000 * rect.width / totalWidth;
            stroke.className = 'source-stroke';
            Object.assign(stroke.style, {
                left: `${(rect.left - bounds.left) / scale - source.clientLeft}px`,
                top: `${(rect.top - bounds.top) / scale - source.clientTop}px`,
                width: `${rect.width / scale}px`,
                height: `${rect.height / scale}px`,
            });
            stroke.style.setProperty('--stroke-duration', `${duration}ms`);
            stroke.style.setProperty('--stroke-delay', `${delay}ms`);
            strokes.appendChild(stroke);
            delay += duration + 70;
        });
    }
    function cancel() { timers.forEach(clearTimeout); timers = []; }
    function setOpen(open) {
        if (open) {
            drawStrokes();
            void strokes.offsetWidth;
        }
        card.classList.toggle('is-highlighted', open);
        card.setAttribute('aria-expanded', String(open));
        detail.setAttribute('aria-hidden', String(!open));
        root.classList.toggle('source-highlighted', open);
    }
    function play() {
        cancel();
        card.classList.remove('review-press');
        root.classList.add('source-reset');
        setOpen(false);
        void root.offsetHeight;
        root.classList.remove('source-reset');
        timers.push(setTimeout(() => card.classList.add('review-press'), 1800));
        timers.push(setTimeout(() => { card.classList.remove('review-press'); setOpen(true); }, 2100));
    }
    card.onclick = () => { cancel(); card.classList.remove('review-press'); setOpen(card.getAttribute('aria-expanded') !== 'true'); };
    card.onkeydown = event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); event.stopPropagation(); card.click();
    };
    let active = slide.classList.contains('active');
    new MutationObserver(() => {
        const next = slide.classList.contains('active');
        if (next === active) return;
        active = next;
        if (active) {
            play();
        } else {
            cancel();
            setOpen(false);
        }
    }).observe(slide, {attributes:true, attributeFilter:['class']});
    document.fonts.ready.then(() => {
        if (card.getAttribute('aria-expanded') === 'true') drawStrokes();
    });
    setOpen(false);
    if (active) play();
})();
