/* === PRESENTATION CONTROLLER === */
            class SlidePresentation {
                constructor() {
                    this.slides = [...document.querySelectorAll(".slide")];
                    this.stage = document.getElementById("deckStage");
                    this.currentSlide = 0;
                    this.editing = false;
                    this.storageKey = "dumpy-pitch-2026-09-13-v1";
                    // File content is the source of truth.
                    this.setupStageScale();
                    this.setupNavigation();
                    // Use GitHub PRs to edit this presentation.
                    this.showSlide(Math.max(0, (parseInt(location.hash.slice(1), 10) || 1) - 1));
                    this.wakeControls();
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
                    this.currentSlide = Math.max(0, Math.min(index, this.slides.length - 1));
                    this.slides.forEach((slide, i) => {
                        const active = i === this.currentSlide;
                        slide.classList.toggle("active", active);
                        slide.classList.toggle("visible", active);
                        slide.setAttribute("aria-hidden", String(!active));
                        slide.inert = !active;
                        if (!active) {
                            slide.querySelectorAll("video").forEach((video) => video.pause());
                        }
                    });

                    const activeSlide = this.slides[this.currentSlide];
                    activeSlide.querySelectorAll("video").forEach((video) => {
                        video.muted = true;
                        video.currentTime = 0;
                        video.play().catch(() => {});
                    });

                    document.getElementById("counter").textContent =
                        `${this.currentSlide + 1} / ${this.slides.length}`;
                    document.getElementById("progress").style.width =
                        `${((this.currentSlide + 1) / this.slides.length) * 100}%`;
                    try {
                        history.replaceState(null, "", `#${this.currentSlide + 1}`);
                    } catch (_) {}
                }

                async fullscreen() {
                    try {
                        if (document.fullscreenElement) await document.exitFullscreen();
                        else await document.documentElement.requestFullscreen();
                    } catch (_) {
                        this.toast("전체화면을 지원하는 브라우저에서 F 키를 눌러주세요.");
                    }
                }

                wakeControls() {
                    document.body.classList.add("controls-awake");
                    clearTimeout(this.controlTimer);
                    this.controlTimer = setTimeout(
                        () => document.body.classList.remove("controls-awake"),
                        2500,
                    );
                }

                setupNavigation() {
                    document.getElementById("prev").onclick = () =>
                        this.showSlide(this.currentSlide - 1);
                    document.getElementById("next").onclick = () =>
                        this.showSlide(this.currentSlide + 1);
                    document.getElementById("fullButton").onclick = () => this.fullscreen();
                    document.addEventListener("mousemove", () => this.wakeControls());
                    document.addEventListener("keydown", (event) => {
                        if (event.key === "Escape") {
                            if (this.editing) this.toggleEdit();
                            return;
                        }
                        if (
                            event.target.isContentEditable ||
                            /INPUT|TEXTAREA|SELECT|VIDEO/.test(event.target.tagName)
                        )
                            return;
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
                        // Browser-local editing is disabled.
                    });
                    let wheelAt = 0;
                    document.addEventListener(
                        "wheel",
                        (event) => {
                            if (this.editing || Math.abs(event.deltaY) < 25) return;
                            if (Date.now() - wheelAt < 650) return;
                            wheelAt = Date.now();
                            this.showSlide(this.currentSlide + Math.sign(event.deltaY));
                        },
                        { passive: true },
                    );
                    let touchX = 0;
                    let touchY = 0;
                    this.stage.addEventListener(
                        "touchstart",
                        (event) => {
                            touchX = event.changedTouches[0].clientX;
                            touchY = event.changedTouches[0].clientY;
                        },
                        { passive: true },
                    );
                    this.stage.addEventListener(
                        "touchend",
                        (event) => {
                            if (this.editing) return;
                            const dx = event.changedTouches[0].clientX - touchX;
                            const dy = event.changedTouches[0].clientY - touchY;
                            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
                                this.showSlide(this.currentSlide + (dx < 0 ? 1 : -1));
                            else this.wakeControls();
                        },
                        { passive: true },
                    );
                }

                /* === LOCAL INLINE EDITING: no server or external writes === */
                restoreEdits() {
                    const bodyTexts = document.querySelectorAll(".slide-body h3, .slide-body p");
                    bodyTexts.forEach((node, i) => {
                        if (!node.dataset.edit) node.dataset.edit = `restructured-body-${i}`;
                    });
                    try {
                        const stored = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
                        document.querySelectorAll("[data-edit]").forEach((node) => {
                            if (typeof stored[node.dataset.edit] === "string")
                                node.innerHTML = stored[node.dataset.edit];
                        });
                    } catch (_) {}
                }

                setupEditor() {
                    const button = document.getElementById("editToggle");
                    const zone = document.querySelector(".edit-hotzone");
                    let hide;
                    const show = () => {
                        clearTimeout(hide);
                        button.classList.add("show");
                    };
                    const later = () => {
                        hide = setTimeout(() => {
                            if (!this.editing) button.classList.remove("show");
                        }, 400);
                    };
                    zone.addEventListener("mouseenter", show);
                    zone.addEventListener("mouseleave", later);
                    button.addEventListener("mouseenter", show);
                    button.addEventListener("mouseleave", later);
                    zone.onclick = () => this.toggleEdit();
                    button.onclick = () => this.toggleEdit();
                    this.stage.addEventListener("input", () => {
                        if (!this.editing) return;
                        const values = {};
                        document
                            .querySelectorAll("[data-edit]")
                            .forEach((node) => (values[node.dataset.edit] = node.innerHTML));
                        try {
                            localStorage.setItem(this.storageKey, JSON.stringify(values));
                        } catch (_) {
                            this.toast("브라우저 저장이 제한되어 변경사항을 저장할 수 없습니다.");
                        }
                    });
                }

                toggleEdit() {
                    this.editing = !this.editing;
                    document
                        .querySelectorAll("[data-edit]")
                        .forEach((node) => (node.contentEditable = String(this.editing)));
                    document.getElementById("editToggle").classList.toggle("active", this.editing);
                    this.toast(
                        this.editing
                            ? "편집 모드 · 변경사항은 이 브라우저에 저장됩니다. Esc로 종료"
                            : "발표 모드",
                    );
                }

                toast(message) {
                    const item = document.getElementById("toast");
                    item.textContent = message;
                    item.hidden = false;
                    clearTimeout(this.toastTimer);
                    this.toastTimer = setTimeout(() => (item.hidden = true), 2800);
                }
            }
            window.deck = new SlidePresentation();
