// Render states from GitHub main ce70f5d. Shared iframe preserves transitions
// between consecutive scenes that expand the same underlying slide.
(() => {
    const slides = [...document.querySelectorAll('.slide')];
    let last = -1;

    window.resetSlideAnimations = () => {
        slides.forEach(slide => slide.classList.remove('active', 'visible', 'entering'));
        last = -1;
    };

    window.render = (index, expanded, quote, number, total, guidance) => {
        if (last !== index) {
            slides[index].classList.remove('active', 'visible');
            void slides[index].offsetWidth;
        }
        slides.forEach(slide => slide.classList.remove('entering'));
        if (last === 0 && index === 1) slides[index].classList.add('entering');
        last = index;

        slides.forEach((slide, i) => {
            const active = i === index;
            slide.classList.toggle('active', active);
            slide.classList.toggle('visible', active);
            slide.classList.toggle('expanded', active && expanded);
            slide.classList.toggle('guidance-expanded', active && guidance);
            slide.classList.toggle('quote-expanded', active && quote);
            slide.inert = !active;
            slide.setAttribute('aria-hidden', String(!active));
        });

        const footer = slides[index].querySelector('.deck-footer span:last-child');
        if (footer) footer.textContent = `${number} / ${total}`;
    };

    function fit() {
        const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
        document.getElementById('stage').style.transform =
            `translate(${(innerWidth - 1920 * scale) / 2}px, ${(innerHeight - 1080 * scale) / 2}px) scale(${scale})`;
    }
    window.addEventListener('resize', fit);
    fit();

    document.addEventListener('keydown', event => parent.deck?.handleNavigationKey(event));
    document.addEventListener('click', event => {
        if (!event.target.closest('video, button, a')) {
            parent.deck?.showSlide(parent.deck.currentSlide + 1);
        }
    });
    let touchX = 0;
    document.addEventListener('touchstart', event => {
        touchX = event.changedTouches[0].clientX;
    }, { passive: true });
    document.addEventListener('touchend', event => {
        const distance = event.changedTouches[0].clientX - touchX;
        if (Math.abs(distance) > 60) {
            parent.deck?.showSlide(parent.deck.currentSlide + (distance < 0 ? 1 : -1));
        }
    }, { passive: true });
})();
