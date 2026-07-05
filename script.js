// === 屏幕管理 ===
let currentScreen = 0;
const screens = [
    'screen-video',      // ① 视频
    'screen-meet',       // ② 相识
    'screen-argue',      // ③ 争吵
    'screen-her-letter', // ④ 她写给我的情书
    'screen-my-letter',  // ⑤ 我写给她的
    'screen-photos',     // ⑥ 她的照片
    'screen-confession'  // ⑦ 表白
];

let currentCarouselTimer = null;

function nextScreen() {
    tryPlayMusic(); // 首次点击触发音乐

    if (currentCarouselTimer && currentCarouselTimer.stop) currentCarouselTimer.stop();
    currentCarouselTimer = null;

    const cur = document.getElementById(screens[currentScreen]);
    cur.classList.remove('active');

    currentScreen++;
    if (currentScreen >= screens.length) { currentScreen = screens.length - 1; return; }

    const next = document.getElementById(screens[currentScreen]);
    next.classList.add('active');

    if (screens[currentScreen] === 'screen-meet') initMeetScreen();
    if (screens[currentScreen] === 'screen-argue') initArgueScreen();
    if (screens[currentScreen] === 'screen-her-letter') initHerLetterScreen();
    if (screens[currentScreen] === 'screen-my-letter') initMyLetterScreen();
    if (screens[currentScreen] === 'screen-photos') initPhotosScreen();
    if (screens[currentScreen] === 'screen-confession') triggerFireworks();
}

// === 背景音乐 ===
function initMusic() {
    const audio = document.getElementById('bg-music');
    audio.volume = 0.3;
    // 静默预加载
    audio.load();
}

function tryPlayMusic() {
    const audio = document.getElementById('bg-music');
    if (audio.paused) audio.play().catch(() => {});
}

// === 图片预加载 ===
const preloadCache = new Set();
function preloadImage(src) {
    if (preloadCache.has(src)) return;
    preloadCache.add(src);
    (new Image()).src = src;
}
// 所有图片路径，全局一次性预加载
const ALL_IMAGES = [
    '开头视频/1781618141689.mp4',
    '相识阶段/Screenshot_2026_0620_234856.jpg',
    '争吵图片/1780054394155.jpeg', '争吵图片/1780162064176.jpeg',
    '争吵图片/1780195043840.jpeg', '争吵图片/1781011872331.jpeg',
    '她给我的情书/情书一.jpeg', '她给我的情书/情书二.jpeg',
    '她的照片/1781870832009.jpeg', '她的照片/1781870834729.jpeg',
    '她的照片/1781879558453.jpeg', '她的照片/1781918756446.jpeg',
    '她的照片/1781931055391.jpeg', '她的照片/1781931133296.jpeg',
];
function preloadAllImages() {
    ALL_IMAGES.forEach(src => {
        if (src.endsWith('.mp4')) return; // 视频不预加载
        preloadImage(src);
    });
}

// === 图片轮播 ===
function initCarousel(trackId, dotsId, imagePaths, autoInterval = 3500) {
    const track = document.getElementById(trackId);
    const dots  = document.getElementById(dotsId);
    if (!track || !dots) return;
    track.innerHTML = ''; dots.innerHTML = '';

    // 立即预加载所有图片
    imagePaths.forEach(src => preloadImage(src));

    imagePaths.forEach((src, i) => {
        // wrapper + 占位
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'flex-shrink:0;width:100%;position:relative;';

        const placeholder = document.createElement('div');
        placeholder.className = 'img-placeholder';
        placeholder.textContent = '加载中...';

        const img = document.createElement('img');
        img.src = src; img.alt = '';
        img.loading = 'eager';
        img.style.cssText = 'width:100%;display:block;opacity:0;transition:opacity 0.4s;';
        img.draggable = false;
        img.onload = () => { img.style.opacity = '1'; placeholder.remove(); };
        img.onerror = () => { placeholder.textContent = '加载失败'; };

        wrapper.appendChild(placeholder);
        wrapper.appendChild(img);
        track.appendChild(wrapper);

        const dot = document.createElement('span');
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => goToSlide(i);
        dots.appendChild(dot);
    });

    let current = 0;
    let autoTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    const SWIPE_THRESHOLD = 50;

    function goToSlide(index) {
        current = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.querySelectorAll('span').forEach((s, i) => s.classList.toggle('active', i === index));
    }

    function nextSlide() { goToSlide((current + 1) % imagePaths.length); }
    function prevSlide() { goToSlide((current - 1 + imagePaths.length) % imagePaths.length); }

    // 自动轮播
    function startAuto() {
        stopAuto();
        if (imagePaths.length > 1) {
            autoTimer = setInterval(nextSlide, autoInterval);
        }
    }
    function stopAuto() {
        if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    // 触摸滑动
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchMoved = false;
        stopAuto();
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
        touchMoved = true;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
        if (!touchMoved) { startAuto(); return; }
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        // 横向滑动距离大于竖向，且超过阈值
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx < 0) nextSlide();
            else prevSlide();
        }
        setTimeout(startAuto, 2000);
    });

    // 鼠标拖拽（PC端模拟）
    let mouseDown = false, mouseStartX = 0;
    track.addEventListener('mousedown', (e) => {
        mouseDown = true; mouseStartX = e.clientX; stopAuto();
    });
    track.addEventListener('mouseup', (e) => {
        if (!mouseDown) return; mouseDown = false;
        const dx = e.clientX - mouseStartX;
        if (Math.abs(dx) > SWIPE_THRESHOLD) {
            if (dx < 0) nextSlide();
            else prevSlide();
        }
        setTimeout(startAuto, 2000);
    });
    track.addEventListener('mouseleave', () => { mouseDown = false; startAuto(); });

    // 导出全局切换函数供定时器使用
    if (currentCarouselTimer) clearInterval(currentCarouselTimer);
    currentCarouselTimer = { stop: stopAuto };

    startAuto();
}

// === ② 相识屏 - 左右布局 ===
async function initMeetScreen() {
    const images = ['相识阶段/Screenshot_2026_0620_234856.jpg'];
    initCarousel('meet-track', 'meet-dots', images, 4000);

    const container = document.getElementById('meet-text');
    const btn = document.getElementById('meet-btn');
    container.innerHTML = '<div class="typewriter-line" style="color:#93c5fd">加载中...</div>';
    btn.style.display = 'none';

    try {
        const url = encodeURI('相识阶段/相识.txt');
        console.log('[相识] fetching:', url);
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const text = await r.text();
        console.log('[相识] loaded', text.length, 'chars');

        const lines = parseDialogueText(text);
        console.log('[相识] parsed', lines.length, 'items');
        container.innerHTML = '';

        if (lines.length === 0) {
            container.innerHTML = '<div class="typewriter-line">解析不到内容</div>';
            btn.style.display = 'block';
            return;
        }

        lines.forEach((line, i) => {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'typewriter-line';
                if (line.type === 'header') el.classList.add('header');
                if (line.type === 'her') el.classList.add('her');
                if (line.type === 'me') el.classList.add('me');
                el.textContent = line.text;
                container.appendChild(el);
                container.scrollTop = container.scrollHeight;
                if (i === lines.length - 1) {
                    setTimeout(() => { btn.style.display = 'block'; }, 600);
                }
            }, i * 180);
        });
    } catch (e) {
        console.error('[相识] error:', e);
        container.innerHTML = '<div class="typewriter-line" style="color:#ff9999">加载失败: ' + e.message + '</div>';
        btn.style.display = 'block';
    }
}

// === ③ 争吵屏 ===
async function initArgueScreen() {
    const images = ['1780054394155.jpeg','1780162064176.jpeg',
                    '1780195043840.jpeg','1781011872331.jpeg']
        .map(f => '争吵图片/' + f);
    initCarousel('argue-track', 'argue-dots', images, 4000);

    const container = document.getElementById('argue-chat');
    const btn = document.getElementById('argue-btn');
    container.innerHTML = '<div class="chat-bubble section-header">加载中...</div>';
    btn.style.display = 'none';

    try {
        const url = encodeURI('争吵图片/争吵.txt');
        console.log('[争吵] fetching:', url);
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const text = await r.text();
        console.log('[争吵] loaded', text.length, 'chars');

        const bubbles = parseDialogueText(text);
        console.log('[争吵] parsed', bubbles.length, 'items');
        container.innerHTML = '';

        if (bubbles.length === 0) {
            container.innerHTML = '<div class="chat-bubble section-header">解析不到对话内容</div>';
            btn.style.display = 'block';
            return;
        }

        bubbles.forEach((b, i) => {
            setTimeout(() => {
                const el = document.createElement('div');
                if (b.type === 'header') {
                    el.className = 'chat-bubble section-header';
                } else {
                    el.className = `chat-bubble ${b.type}`;
                }
                el.textContent = b.text;
                container.appendChild(el);
                container.scrollTop = container.scrollHeight;
                if (i === bubbles.length - 1) {
                    setTimeout(() => { btn.style.display = 'block'; }, 500);
                }
            }, i * 450);
        });
    } catch (e) {
        console.error('[争吵] error:', e);
        container.innerHTML = '<div class="chat-bubble section-header" style="color:#ff9999">加载失败: ' + e.message + '</div>';
        btn.style.display = 'block';
    }
}

// === 通用文本解析器 ===
function parseDialogueText(raw) {
    const result = [];
    const lines = raw.split(/\r?\n/);
    for (let line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 分隔线
        if (/^━+$/.test(trimmed)) { result.push({ type: 'header', text: '' }); continue; }
        // 章节标题：【xxx】
        if (trimmed.startsWith('【') && trimmed.endsWith('】')) {
            result.push({ type: 'header', text: trimmed.replace(/^【|】$/g, '') }); continue;
        }
        // 大标题
        if (/^(第一次|第二次|第三次|三次|写在最后)/.test(trimmed)) {
            result.push({ type: 'header', text: trimmed }); continue;
        }
        // 她说话
        if (trimmed.startsWith('一只柚子呀')) {
            const col = trimmed.indexOf('：');
            const asc = trimmed.indexOf(':');
            const idx = (col >= 0 ? col : asc) + 1;
            result.push({ type: 'she', text: trimmed.substring(idx) }); continue;
        }
        // 他说话
        if (trimmed.startsWith('我在等你哦')) {
            const col = trimmed.indexOf('：');
            const asc = trimmed.indexOf(':');
            const idx = (col >= 0 ? col : asc) + 1;
            result.push({ type: 'me', text: trimmed.substring(idx) }); continue;
        }

        // 续行：以全角空格或半角空格开头，追加到上一条
        if (result.length > 0 && /^[\s\u3000]/.test(line) && trimmed.length > 0) {
            const last = result[result.length - 1];
            if (last.type === 'she' || last.type === 'me' || last.type === 'text') {
                last.text += trimmed;
                continue;
            }
        }

        // 普通叙事文字
        if (trimmed.length > 2) {
            result.push({ type: 'text', text: trimmed });
        }
    }
    return result;
}

// === ④ 她写给我的情书 ===
function initHerLetterScreen() {
    initCarousel('her-letter-track', 'her-letter-dots',
        ['她给我的情书/情书一.jpeg', '她给我的情书/情书二.jpeg'], 4000);
}

// === ⑤ 我写给她的情书 ===
function initMyLetterScreen() {
    const container = document.getElementById('my-letter-content');
    const btn = document.getElementById('my-letter-btn');
    container.innerHTML = ''; btn.style.display = 'none';

    // 尝试从文件读取
    fetch(encodeURI('我写给她的/情书.txt')).then(r => {
        if (r.ok) return r.text();
        throw new Error('文件不存在');
    }).then(text => {
        const lines = text.split(/\r?\n/);
        typeOutLetter(lines);
    }).catch(() => {
        typeOutLetter(MY_LETTER_PLACEHOLDER);
    });

    function typeOutLetter(lines) {
        let displayIndex = 0;
        lines.forEach((text, i) => {
            if (text.trim()) {
                const idx = displayIndex++;
                setTimeout(() => {
                    const el = document.createElement('div');
                    el.className = 'letter-line';
                    el.textContent = text;
                    container.appendChild(el);
                    container.scrollTop = container.scrollHeight;
                    if (idx >= displayIndex - 1 && i >= lines.length - 3) {
                        setTimeout(() => { btn.style.display = 'block'; triggerFireworks(); }, 500);
                    }
                }, idx * 800);
            } else {
                // 空行作为间距
                const idx = displayIndex++;
                setTimeout(() => {
                    const el = document.createElement('div');
                    el.className = 'letter-line';
                    el.style.height = '0.6em';
                    container.appendChild(el);
                    container.scrollTop = container.scrollHeight;
                }, idx * 800);
            }
        });
    }
}

// === ⑥ 她的照片 ===
function initPhotosScreen() {
    const dir = '她的照片/';
    const names = ['1781870832009.jpeg','1781870834729.jpeg','1781879558453.jpeg',
                   '1781918756446.jpeg','1781931055391.jpeg','1781931133296.jpeg'];
    initCarousel('photos-track', 'photos-dots', names.map(n => dir + n), 3000);
}

// === ⑦ 表白 ===
function handleYes() {
    triggerFireworks();
    triggerHeartExplosion();
}

// === 爱心飘落 ===
function createHearts() {
    const container = document.getElementById('hearts-container');
    setInterval(() => {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.textContent = '💙';
        heart.style.left = Math.random() * 100 + '%';
        heart.style.animationDuration = (2 + Math.random() * 2) + 's';
        heart.style.opacity = 0.3 + Math.random() * 0.7;
        container.appendChild(heart);
        setTimeout(() => heart.remove(), 4000);
    }, 800);
}

function triggerHeartExplosion() {
    const container = document.getElementById('hearts-container');
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = '💙';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.top = Math.random() * 100 + '%';
            heart.style.fontSize = (1 + Math.random() * 2) + 'em';
            heart.style.animationDuration = (2 + Math.random() * 2) + 's';
            heart.style.opacity = 0.5 + Math.random() * 0.5;
            container.appendChild(heart);
            setTimeout(() => heart.remove(), 4000);
        }, i * 50);
    }
}

// === 烟火 ===
function triggerFireworks() {
    const container = document.getElementById('fireworks');
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    for (let burst = 0; burst < 3; burst++) {
        setTimeout(() => {
            for (let i = 0; i < 30; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                const angle = (i / 30) * Math.PI * 2;
                const dist = 150 + Math.random() * 100;
                p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
                p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
                p.style.left = cx + 'px'; p.style.top = cy + 'px';
                container.appendChild(p);
                setTimeout(() => p.remove(), 1000);
            }
        }, burst * 300);
    }
}

// === 初始化 ===
window.addEventListener('load', () => {
    createHearts();
    initMusic();
    // 延迟一点预加载图片，优先让首屏加载
    setTimeout(preloadAllImages, 1000);
});

// === 我写给她的情书占位内容 ===
const MY_LETTER_PLACEHOLDER = [
    "亲爱的你：",
    "",
    "从5月26日那天收到你的信开始，",
    "我的世界就变得不一样了。",
    "",
    "你的勇敢，让我震撼。",
    "一个女孩子，",
    "仅仅因为看了我写的一些文字，",
    "就敢写那么长一封信给一个陌生人。",
    "这样的勇气，我自问做不到。",
    "",
    "你的真诚，让我沦陷。",
    "你说你大大咧咧，风风火火，",
    "像四川的火锅一样火辣。",
    "可你写的每一段文字，",
    "都细腻得让我反复读好几遍。",
    "",
    "我们吵过架，差点走散过，",
    "但每一次，都是你拉住了我。",
    "你说你会陪我长大，",
    "你说我们必须纠缠在一起。",
    "你知道吗，听到这些话的时候，",
    "我在屏幕这边笑了好久。",
    "",
    "你喜欢吃辣，我喜欢吃辣。",
    "你打直球，我学着打直球。",
    "你希望我依赖你，",
    "而我，一直在找那个可以让我",
    "放心依赖的人。",
    "",
    "所以，我想问——",
    "",
    "你愿意做我女朋友吗？",
    "",
    "　　　　　　　　何杰韬"
];
