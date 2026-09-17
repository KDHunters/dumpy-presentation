// GitHub main ce70f5d Appendix runtime, connected to the local deck controller.
(() => {
    const slides = [...document.querySelectorAll('.slide')];

    window.render = (index, number, total) => {
        slides.forEach((slide, i) => {
            const active = i === index;
            slide.classList.toggle('active', active);
            slide.classList.toggle('visible', active);
            slide.inert = !active;
            slide.setAttribute('aria-hidden', String(!active));
        });
        slides[index].querySelector('.deck-footer span:last-child').textContent = `${number} / ${total}`;
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
