/* Local presentation data only; no app account or API is connected. */
(() => {
    const root = document.querySelector('.dp-live-schedule');
    if (!root) return;
    const track = root.querySelector('.rolling-calendar-track');
    const timeline = root.querySelector('.timeline-stack');
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const periods = [['morning', '아침'], ['afternoon', '낮'], ['evening', '밤']];
    const tasks = [
        { id: 'meeting', day: 18, period: 'morning', title: '팀 회의 참석하기', minutes: '30분+', impact: 'high', time: '10:00–10:30' },
        { id: 'laundry', day: 18, period: 'morning', title: '세탁기 돌리기', minutes: '5분', impact: 'medium', time: '' },
        { id: 'mail', day: 18, period: 'morning', title: '밀린 메일 확인하기', minutes: '15분', impact: 'medium', time: '' },
        { id: 'mentoring', day: 18, period: 'afternoon', title: '멘토링', minutes: '30분+', impact: 'high', time: '15:00–15:30' },
        { id: 'draft', day: 18, period: 'afternoon', title: '발표 초안 보내기', minutes: '30분+', impact: 'high', time: '' },
        { id: 'dentist', day: 18, period: 'afternoon', title: '치과 예약 변경 전화하기', minutes: '5분', impact: 'medium', time: '' },
    ];
    const selected = 18;
    const initialTasks = tasks.map(task => ({ ...task }));
    let completionTimers = [];
    let demoAnimations = [];
    let movingCard = null;
    let hiddenCard = null;
    function stopCompletionDemo() {
        completionTimers.forEach(clearTimeout);
        completionTimers = [];
        demoAnimations.forEach(animation => animation.cancel());
        demoAnimations = [];
        movingCard?.remove();
        movingCard = null;
        if (hiddenCard) hiddenCard.style.visibility = '';
        hiddenCard = null;
        root.querySelectorAll('.drop-over').forEach(section => section.classList.remove('drop-over'));
    }
    let expanded = 'afternoon';
    let incompleteOnly = false;
    const filter = root.querySelector('.incomplete-filter');
    filter.onclick = () => {
        incompleteOnly = !incompleteOnly;
        filter.setAttribute('aria-pressed', String(incompleteOnly));
        renderTimeline();
    };
    let dragging = null;
    const announce = text => root.querySelector('.schedule-announcement').textContent = text;
    function updateCompletion(task, done) {
        const positions = new Map([...timeline.querySelectorAll('.compact-agenda-task')].filter(card => card.getClientRects().length).map(card => [card.dataset.task, card.getBoundingClientRect().top]));
        task.done = done;
        tasks.sort((a, b) => Number(!!a.done) - Number(!!b.done));
        if (incompleteOnly) {
            renderTimeline();
        } else {
            // Preserve each card element, like the app's keyed motion layout wrappers.
            periods.forEach(([period]) => {
                const section = timeline.querySelector(`[data-period="${period}"]`);
                const list = section.querySelector('.timeline-period-tasks');
                tasks.filter(item => item.day === selected && item.period === period).forEach(item => {
                    const card = list.querySelector(`[data-task="${item.id}"]`);
                    card.classList.toggle('done', !!item.done);
                    card.querySelector('.task-check').setAttribute('aria-pressed', String(!!item.done));
                    list.appendChild(card);
                });
                const count = tasks.filter(item => item.day === selected && item.period === period && !item.done).length;
                section.querySelector('.timeline-period-summary').textContent = count ? `${count}개` : '비어 있음';
            });
        }
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const scale = root.getBoundingClientRect().width / root.offsetWidth;
            timeline.querySelectorAll('.compact-agenda-task').forEach(card => {
                const previous = positions.get(card.dataset.task);
                const distance = (previous - card.getBoundingClientRect().top) / scale;
                if (!Number.isFinite(distance) || distance === 0) return;
                demoAnimations.push(card.animate([
                    { transform: `translateY(${distance}px)` },
                    { transform: 'translateY(0)' }
                ], {duration:280, easing:'cubic-bezier(.22,1,.36,1)'}));
            });
        }
    }
    function renderTimeline() {
        // Stable partition the current order, rather than sorting the original order again.
        tasks.sort((a, b) => Number(!!a.done) - Number(!!b.done));
        root.querySelector('.schedule-date').textContent = '9월 18일';
        root.querySelector('.schedule-relative').textContent = '오늘';
        root.querySelector('.schedule-count').textContent = tasks.filter(t => t.day === selected).length;
        timeline.innerHTML = '<i class="timeline-rail" aria-hidden="true"></i>';
        periods.forEach(([id, label]) => {
            const section = document.createElement('section');
            section.className = 'timeline-period ' + (expanded === id ? 'bucket-expanded' : 'bucket-collapsed');
            section.dataset.period = id;
            section.innerHTML = `<div class="timeline-period-label"><strong>${label}</strong></div><i class="timeline-period-dot" aria-hidden="true"></i><div class="timeline-period-body"></div>`;
            const body = section.querySelector('.timeline-period-body');
            body.hidden = expanded !== id;
            const summary = document.createElement('button');
            summary.className = 'timeline-period-summary';
            summary.hidden = expanded === id;
            summary.setAttribute('aria-label', `${label} 펼치기`);
            const count = tasks.filter(t => t.day === selected && t.period === id && !t.done).length;
            summary.textContent = count ? `${count}개` : '비어 있음';
            summary.onclick = () => { expanded = id; renderTimeline(); };
            section.appendChild(summary);
            if (!tasks.some(t => t.day === selected && t.period === id && (!incompleteOnly || !t.done))) {
                const empty = document.createElement('p');
                empty.className = 'timeline-empty';
                empty.textContent = '아직 등록된 일정이 없어요.';
                body.appendChild(empty);
            }
            const taskList = document.createElement('div');
            taskList.className = 'timeline-period-tasks';
            body.appendChild(taskList);
            tasks.filter(t => t.day === selected && t.period === id && (!incompleteOnly || !t.done)).forEach(task => {
                const card = document.createElement('article');
                card.className = `compact-agenda-task${task.done ? ' done' : ''}`;
                card.draggable = false;
                card.onpointerdown = event => {
                    if (event.target.closest('button') || event.button !== 0) return;
                    const startX = event.clientX, startY = event.clientY;
                    let moved = false;
                    card.setPointerCapture(event.pointerId);
                    card.onpointermove = move => {
                        if (!moved && Math.hypot(move.clientX - startX, move.clientY - startY) < 6) return;
                        moved = true;
                        card.classList.add('dragging');
                        root.querySelectorAll('[data-period]').forEach(zone => {
                            const rect = zone.getBoundingClientRect();
                            zone.classList.toggle('drop-over', move.clientX >= rect.left && move.clientX <= rect.right && move.clientY >= rect.top && move.clientY <= rect.bottom);
                        });
                    };
                    const finish = up => {
                        const zone = root.querySelector('.drop-over');
                        if (moved && zone && up.type !== 'pointercancel') {
                            task.period = zone.dataset.period;
                            task.time = '';
                            announce(`${task.title}, ${periods.find(p => p[0] === task.period)[1]}으로 이동`);
                        }
                        card.onpointermove = card.onpointerup = card.onpointercancel = null;
                        renderTimeline();
                    };
                    card.onpointerup = card.onpointercancel = finish;
                };
                card.dataset.task = task.id;
                card.setAttribute('aria-label', `${task.title}, ${label}`);
                card.innerHTML = `<button class="task-check" aria-label="${task.title} 완료" aria-pressed="${!!task.done}"></button><div class="compact-agenda-copy"><strong>${task.title}</strong><div class="compact-task-meta"><span class="meta-chip"><i class="impact-dot ${task.impact}"></i>${task.impact === 'high' ? '중요' : '보통'}</span><span class="meta-chip"><img src="./public/icons/clock.svg" alt="" />${task.minutes}</span>${task.time ? `<span class="meta-chip"><img src="./public/icons/calendar.svg" alt="" />${task.time}</span>` : ''}</div></div>`;
                card.querySelector('button').onclick = () => updateCompletion(task, !task.done);
                card.ondragstart = event => {
                    dragging = task;
                    event.dataTransfer.setData('text/plain', task.id);
                    event.dataTransfer.effectAllowed = 'move';
                    card.classList.add('dragging');
                };
                card.ondragend = () => { dragging = null; card.classList.remove('dragging'); root.querySelectorAll('.drop-over').forEach(el => el.classList.remove('drop-over')); };
                taskList.appendChild(card);
            });
            const add = document.createElement('div');
            add.className = 'timeline-period-add';
            add.textContent = `＋ ${label}에 추가`;
            body.appendChild(add);
            section.ondragover = event => { event.preventDefault(); section.classList.add('drop-over'); };
            section.ondragleave = event => { if (!section.contains(event.relatedTarget)) section.classList.remove('drop-over'); };
            section.ondrop = event => {
                event.preventDefault();
                if (!dragging) return;
                dragging.period = id;
                // A bucket move clears the old exact time, as in the app's scheduling flow.
                dragging.time = '';
                announce(`${dragging.title}, ${label}으로 이동`);
                dragging = null;
                renderTimeline();
            };
            timeline.appendChild(section);
        });
    }
    for (let day = 14; day <= 22; day++) {
        const weekday = new Date(2026, 8, day).getDay();
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.disabled = true;
        cell.tabIndex = -1;
        cell.className = `${day === 18 ? 'today active' : ''} ${weekday === 0 ? 'sun' : ''}`;
        cell.setAttribute('aria-label', `9월 ${day}일${day === 18 ? ', 오늘' : ''}`);
        if (day === 18) cell.setAttribute('aria-current', 'date');
        cell.innerHTML = `<small>${weekdays[weekday]}</small><span>${day}</span>`;
        track.appendChild(cell);
    }
    root.addEventListener('touchstart', event => event.stopPropagation());
    root.addEventListener('touchend', event => event.stopPropagation());
    // A manual interaction takes over from the automatic presentation sequence.
    root.addEventListener('pointerdown', stopCompletionDemo, true);
    root.addEventListener('keydown', stopCompletionDemo, true);
    const slide = root.closest('.slide');
    function moveDraftToNight() {
        const source = timeline.querySelector('[data-task="draft"]');
        const night = timeline.querySelector('[data-period="evening"]');
        const rootRect = root.getBoundingClientRect();
        const scale = rootRect.width / root.offsetWidth;
        const sourceRect = source.getBoundingClientRect();
        const nightRect = night.getBoundingClientRect();
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const travel = reduced ? 0 : 1000;
        if (!reduced) {
            movingCard = source.cloneNode(true);
            movingCard.classList.add('schedule-moving-card');
            movingCard.setAttribute('aria-hidden', 'true');
            movingCard.style.cssText = `position:absolute;left:${(sourceRect.left-rootRect.left)/scale}px;top:${(sourceRect.top-rootRect.top)/scale}px;width:${sourceRect.width/scale}px;z-index:10;pointer-events:none;`;
            root.appendChild(movingCard);
            hiddenCard = source;
            source.style.visibility = 'hidden';
            night.classList.add('drop-over');
            const distance = (nightRect.top-sourceRect.top)/scale;
            demoAnimations.push(movingCard.animate([
                { transform: 'translateY(0) scale(1)', boxShadow: '0 0 0 transparent' },
                { transform: `translateY(${distance*.35}px) scale(1.035)`, offset: .4, boxShadow: '0 8px 24px #0005' },
                { transform: `translateY(${distance}px) scale(1)`, boxShadow: '0 4px 16px #0003' }
            ], {duration:travel, easing:'cubic-bezier(.22,1,.36,1)', fill:'forwards'}));
        }
        completionTimers.push(setTimeout(() => {
            const previous = new Map([...timeline.querySelectorAll('[data-period]')].map(section => [section.dataset.period, {
                flexGrow: getComputedStyle(section).flexGrow,
                flexBasis: getComputedStyle(section).flexBasis,
                marginTop: getComputedStyle(section).marginTop,
                marginBottom: getComputedStyle(section).marginBottom
            }]));
            tasks.find(task => task.id === 'draft').period = 'evening';
            expanded = 'evening';
            movingCard?.remove();
            movingCard = null;
            hiddenCard = null;
            renderTimeline();
            if (!reduced) {
                timeline.querySelectorAll('[data-period]').forEach(section => {
                    const old = previous.get(section.dataset.period);
                    const style = getComputedStyle(section);
                    demoAnimations.push(section.animate([
                        { flexGrow: old.flexGrow, flexBasis:old.flexBasis, marginTop:old.marginTop, marginBottom:old.marginBottom },
                        { flexGrow: style.flexGrow, flexBasis:style.flexBasis, marginTop:style.marginTop, marginBottom:style.marginBottom }
                    ], {duration:500,easing:'cubic-bezier(.22,1,.36,1)'}));
                });
                const landed = timeline.querySelector('[data-task="draft"]');
                demoAnimations.push(landed.animate([{opacity:0},{opacity:1}],{duration:400,delay:250,fill:'backwards'}));
            }
            announce('발표 초안 보내기를 밤으로 이동했습니다.');
        }, travel));
    }
    function addTaskToNight() {
        if (!slide.classList.contains('active')) return;
        const add = timeline.querySelector('[data-period="evening"] .timeline-period-add');
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduced) {
            demoAnimations.push(add.animate([
                { transform: 'scale(1)', background: 'transparent' },
                { transform: 'scale(.97)', background: 'rgba(224,253,117,.18)', offset: .55 },
                { transform: 'scale(1)', background: 'transparent' }
            ], { duration: 400, easing: 'ease-in-out' }));
        }
        completionTimers.push(setTimeout(() => {
            if (!slide.classList.contains('active')) return;
            tasks.push({ id: 'night-added-task', day: 18, period: 'evening', title: '내일 회의 자료 챙기기', minutes: '5분', impact: 'medium', time: '' });
            expanded = 'evening';
            renderTimeline();
            const card = timeline.querySelector('[data-task="night-added-task"]');
            if (!reduced) {
                demoAnimations.push(card.animate([
                    { opacity: 0, transform: 'translateY(12px) scale(.98)' },
                    { opacity: 1, transform: 'translateY(0) scale(1)' }
                ], { duration: 550, easing: 'cubic-bezier(.22,1,.36,1)' }));
            }
            announce('내일 회의 자료 챙기기를 밤에 추가했습니다.');
        }, 450));
    }
    function startCompletionDemo() {
        stopCompletionDemo();
        tasks.splice(0, tasks.length, ...initialTasks.map(task => ({ ...task })));
        expanded = 'afternoon';
        incompleteOnly = false;
        filter.setAttribute('aria-pressed', 'false');
        renderTimeline();
        ['mentoring', 'dentist'].forEach((id, index) => {
            completionTimers.push(setTimeout(() => {
                if (!slide.classList.contains('active')) return;
                const task = tasks.find(item => item.id === id);
                updateCompletion(task, true);
                announce(`${task.title} 완료`);
            }, 1800 + index * 1600));
        });
        completionTimers.push(setTimeout(moveDraftToNight, 5000));
        completionTimers.push(setTimeout(addTaskToNight, 7800));
    }
    let wasActive = slide.classList.contains('active');
    new MutationObserver(() => {
        const active = slide.classList.contains('active');
        if (active === wasActive) return;
        wasActive = active;
        if (active) startCompletionDemo();
        else stopCompletionDemo();
    }).observe(slide, { attributes: true, attributeFilter: ['class'] });
    if (wasActive) startCompletionDemo();
    else renderTimeline();
})();
