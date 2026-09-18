/* === PRESENTATION CONTROLLER === */
class SlidePresentation {
  constructor() {
    this.slides = [...document.querySelectorAll(".slide")];
    this.stage = document.getElementById("deckStage");
    this.currentSlide = 0;
    this.importedFrame = document.getElementById('importedFrame');
    this.appendixFrame = document.getElementById('appendixFrame');
    this.externalFrames = [this.importedFrame, this.appendixFrame];
    this.externalFrames.forEach(frame => frame.addEventListener('load', () => this.renderImportedSlide()));
    this.stage.tabIndex = -1;
    // File content is the source of truth.
    this.setupStageScale();
    this.setupNavigation();
    // Use GitHub PRs to edit this presentation.
    this.showSlide(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  }
  setupStageScale() {
    const scale = () => {
      const factor = Math.min(innerWidth / 1920, innerHeight / 1080);
      this.stage.style.transform = `translate(${(innerWidth - 1920 * factor) / 2}px, ${(innerHeight - 1080 * factor) / 2}px) scale(${factor})`;
    };
    scale();
    window.addEventListener("resize", scale);
  }
  showSlide(index) {
    this.cancelTitleMotion?.();
    const next = Math.max(0, Math.min(index, this.slides.length - 1));
    const from = this.slides[this.currentSlide];
    const to = this.slides[next];
    const connected = from.classList.contains("principle-slide") && to.classList.contains("dp-input") || from.classList.contains("dp-input") && to.classList.contains("principle-slide");
    if (!connected || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.renderSlide(next);
      return;
    }
    this.animateTitle(from, to, next);
  }
  animateTitle(from, to, next) {
    const stageRect = this.stage.getBoundingClientRect();
    const scale = stageRect.width / 1920;
    const measure = el => {
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return {
        left: `${(rect.left - stageRect.left) / scale}px`,
        top: `${(rect.top - stageRect.top) / scale}px`,
        fontSize: css.fontSize,
        lineHeight: css.lineHeight,
        letterSpacing: css.letterSpacing,
        color: css.color,
        fontWeight: css.fontWeight,
        fontFamily: css.fontFamily,
        paddingLeft: css.paddingLeft,
        paddingRight: css.paddingRight
      };
    };
    const sources = [...from.querySelectorAll("[data-shared-phrase]")];
    const starts = sources.map(measure);
    this.renderSlide(next);
    const targets = sources.map(el => to.querySelector(`[data-shared-phrase="${el.dataset.sharedPhrase}"]`));
    const ends = targets.map(measure);
    const layer = document.createElement("div");
    layer.className = "shared-title-motion";
    layer.setAttribute("aria-hidden", "true");
    this.stage.appendChild(layer);
    const animations = [];
    const duration = 1000;
    const options = {
      duration,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "both"
    };
    const hidden = targets.map(el => [el, el.style.visibility]);
    targets.forEach(el => el.style.visibility = "hidden");
    sources.forEach((source, i) => {
      const moving = document.createElement("span");
      moving.className = "shared-title-phrase";
      moving.textContent = source.textContent;
      Object.assign(moving.style, starts[i]);
      layer.appendChild(moving);
      const hasMarker = targets[i].classList.contains("dp-marker-highlight");
      const arrival = hasMarker ? {
        ...ends[i],
        color: getComputedStyle(to).color
      } : ends[i];
      animations.push(moving.animate([starts[i], arrival], options));
      if (hasMarker) {
        const rect = targets[i].getBoundingClientRect();
        const marker = document.createElement("span");
        marker.className = "shared-title-marker";
        Object.assign(marker.style, {
          left: `${(rect.left - stageRect.left) / scale - 3}px`,
          top: `${(rect.top - stageRect.top) / scale + rect.height / scale * .16}px`,
          width: `${rect.width / scale + 6}px`,
          height: `${rect.height / scale * .82}px`
        });
        layer.prepend(marker);
        // Paint only after the shared text has reached its destination.
        const strokeOptions = {
          duration: 240,
          delay: duration,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "both"
        };
        const strokeFrames = [{
          clipPath: "inset(0 100% 0 0)"
        }, {
          clipPath: "inset(0 0% 0 0)"
        }];
        animations.push(marker.animate(strokeFrames, strokeOptions));
        const ink = document.createElement("span");
        ink.className = "shared-title-phrase";
        ink.textContent = targets[i].textContent;
        Object.assign(ink.style, ends[i]);
        layer.appendChild(ink);
        animations.push(ink.animate(strokeFrames, strokeOptions));
      }
    });
    const supporting = to.querySelectorAll(".dp-phone-frame, .dp-copy, .principle-before, .principle-after");
    supporting.forEach(el => animations.push(el.animate([{
      opacity: 0,
      offset: 0
    }, {
      opacity: 0,
      offset: .35
    }, {
      opacity: 1,
      offset: 1
    }], options)));
    const cleanup = () => {
      animations.forEach(animation => animation.cancel());
      hidden.forEach(([el, visibility]) => el.style.visibility = visibility);
      layer.remove();
      window.removeEventListener("resize", cleanup);
      if (this.cancelTitleMotion === cleanup) this.cancelTitleMotion = null;
    };
    this.cancelTitleMotion = cleanup;
    window.addEventListener("resize", cleanup, {
      once: true
    });
    Promise.all(animations.map(animation => animation.finished)).then(cleanup, () => {});
  }
  renderSlide(index) {
    this.cancelExtractionDemo?.();
    this.currentSlide = index;
    this.slides.forEach((slide, i) => {
      const active = i === this.currentSlide;
      slide.classList.toggle("active", active);
      slide.classList.toggle("visible", active);
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });
    const activeSlide = this.slides[this.currentSlide];
    this.renderImportedSlide();
    if (activeSlide.classList.contains('extraction-demo')) this.playExtractionDemo(activeSlide);
    clearInterval(this.choiceDemoTimer);
    const choices = [...activeSlide.querySelectorAll('.dp-choice-demo')];
    const selectChoice = (group, index) => {
      group.dataset.selected = String(index);
      group.style.setProperty('--selected', index);
      group.querySelectorAll('button').forEach((button, i) => {
        button.setAttribute('aria-pressed', String(i === index));
      });
    };
    choices.forEach(group => {
      selectChoice(group, 0);
      group.querySelectorAll('button').forEach((button, index) => {
        button.onclick = () => selectChoice(group, index);
      });
    });
    if (choices.length) {
      this.choiceDemoTimer = setInterval(() => {
        if (document.hidden) return;
        choices.forEach(group => selectChoice(group, (Number(group.dataset.selected) + 1) % 3));
      }, 5000);
    }
    document.getElementById("progress").style.width = `${(this.currentSlide + 1) / this.slides.length * 100}%`;
    try {
      history.replaceState(null, "", `#${this.currentSlide + 1}`);
    } catch (_) {}
  }
  renderImportedSlide() {
    const slide = this.slides[this.currentSlide];
    const isAppendix = slide.hasAttribute('data-appendix-index');
    const activeFrame = isAppendix ? this.appendixFrame
      : slide.hasAttribute('data-import-index') ? this.importedFrame : null;
    const wasActive = this.externalFrames.some(frame => frame.classList.contains('is-active'));
    this.externalFrames.forEach(frame => {
      const active = frame === activeFrame;
      frame.classList.toggle('is-active', active);
      if (!active) frame.contentWindow.resetSlideAnimations?.();
      frame.inert = !active;
      frame.setAttribute('aria-hidden', String(!active));
    });
    document.body.classList.toggle('is-imported', Boolean(activeFrame));
    if (isAppendix) {
      this.appendixFrame.contentWindow.render?.(
        Number(slide.dataset.appendixIndex), this.currentSlide + 1, this.slides.length
      );
    } else if (activeFrame) {
      this.importedFrame.contentWindow.render?.(
        Number(slide.dataset.importIndex),
        slide.dataset.expanded === 'true',
        slide.dataset.quote === 'true',
        this.currentSlide + 1,
        this.slides.length,
        slide.dataset.guidance === 'true'
      );
    }
    if (activeFrame) {
      activeFrame.focus();
    } else if (wasActive) {
      this.stage.focus({ preventScroll: true });
    }
  }
  playExtractionDemo(slide) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const input = slide.querySelector('[data-edit="body-12"]');
    const button = slide.querySelector('.dump-bottom b');
    const results = slide.querySelector('.task-results');
    const checks = [...results.querySelectorAll('.check')];
    const inputHTML = input.innerHTML;
    const buttonHTML = button.innerHTML;
    const timers = [];
    const schedule = (delay, action) => timers.push(setTimeout(action, delay));
    const glyphs = [];
    const fragment = document.createDocumentFragment();
    // Reserve every character's space, including the requested manual line breaks.
    [...input.childNodes].forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const character of node.textContent.replace(/^\s+|\s+$/g, '')) {
          const glyph = document.createElement('span');
          glyph.className = 'demo-glyph';
          glyph.textContent = character;
          fragment.appendChild(glyph);
          glyphs.push(glyph);
        }
      } else fragment.appendChild(node.cloneNode(true));
    });
    input.replaceChildren(fragment);
    slide.classList.add('demo-running');
    slide.dataset.demoPhase = 'typing';
    results.setAttribute('aria-hidden', 'true');
    glyphs.forEach((glyph, i) => schedule(700 + i * 36, () => glyph.classList.add('demo-typed')));
    const pressAt = 700 + glyphs.length * 36 + 750;
    schedule(pressAt, () => {
      slide.dataset.demoPhase = 'press';
      button.classList.add('demo-press');
    });
    schedule(pressAt + 280, () => {
      slide.dataset.demoPhase = 'loading';
      button.classList.remove('demo-press');
      button.classList.add('demo-loading');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = '<span class="demo-spinner" aria-hidden="true"></span>정리 중…';
    });
    const revealAt = pressAt + 1560;
    schedule(revealAt, () => {
      slide.dataset.demoPhase = 'results';
      button.classList.remove('demo-loading');
      button.removeAttribute('aria-busy');
      button.innerHTML = buttonHTML;
      slide.classList.add('demo-results');
      results.removeAttribute('aria-hidden');
    });
    checks.forEach((check, i) => schedule(revealAt + 1100 + i * 950, () => {
      check.classList.add('demo-checked');
      slide.dataset.demoPhase = i === checks.length - 1 ? 'complete' : `check-${i + 1}`;
    }));
    schedule(revealAt + 1100 + (checks.length - 1) * 950 + 400, () => {
      slide.classList.add('demo-bell-ring');
    });
    this.cancelExtractionDemo = () => {
      timers.forEach(clearTimeout);
      input.innerHTML = inputHTML;
      button.innerHTML = buttonHTML;
      button.classList.remove('demo-press', 'demo-loading');
      button.removeAttribute('aria-busy');
      results.removeAttribute('aria-hidden');
      checks.forEach(check => check.classList.remove('demo-checked'));
      slide.classList.remove('demo-running', 'demo-results', 'demo-bell-ring');
      delete slide.dataset.demoPhase;
      this.cancelExtractionDemo = null;
    };
  }
  async fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();else await document.documentElement.requestFullscreen();
    } catch (_) {
      this.toast("전체화면을 지원하는 브라우저에서 F 키를 눌러주세요.");
    }
  }
  handleNavigationKey(event) {
      if (event.target.isContentEditable || /INPUT|TEXTAREA|SELECT|VIDEO/.test(event.target.tagName)) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      if (["arrowright", "arrowdown", " ", "pagedown"].includes(key)) {
        event.preventDefault();
        this.showSlide(this.currentSlide + 1);
      } else if (["arrowleft", "arrowup", "pageup"].includes(key)) {
        event.preventDefault();
        this.showSlide(this.currentSlide - 1);
      } else if (key === "home") {
        event.preventDefault();
        this.showSlide(0);
      } else if (key === "end") {
        event.preventDefault();
        this.showSlide(this.slides.length - 1);
      } else if (key === "f") this.fullscreen();
  }
  setupNavigation() {
    document.addEventListener('keydown', event => this.handleNavigationKey(event));
    let wheelAt = 0;
    document.addEventListener("wheel", event => {
      if (Math.abs(event.deltaY) < 25) return;
      if (Date.now() - wheelAt < 650) return;
      wheelAt = Date.now();
      this.showSlide(this.currentSlide + Math.sign(event.deltaY));
    }, {
      passive: true
    });
    let touchX = 0;
    let touchY = 0;
    this.stage.addEventListener("touchstart", event => {
      touchX = event.changedTouches[0].clientX;
      touchY = event.changedTouches[0].clientY;
    }, {
      passive: true
    });
    this.stage.addEventListener("touchend", event => {
      const dx = event.changedTouches[0].clientX - touchX;
      const dy = event.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) this.showSlide(this.currentSlide + (dx < 0 ? 1 : -1));
    }, {
      passive: true
    });
  }
  toast(message) {
    const item = document.getElementById("toast");
    item.textContent = message;
    item.hidden = false;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => item.hidden = true, 2800);
  }
}
window.deck = new SlidePresentation();
