console.log('[Mahjong Log] game.js: Скрипт начал выполняться.');

// Глобальные переменные
const LANG = 'ru'; 
let vkBridge = null; // Инициализируем как null, получим его позже
let gameInitialized = false; // Флаг, чтобы избежать двойного запуска

// --- НОВЫЙ БЛОК ИНИЦИАЛИЗАЦИИ ---

// 1. Пытаемся подписаться на событие от VK Bridge
document.addEventListener('vk-bridge:VKWebAppInit', () => {
    console.log('[Mahjong Log] Получено событие: VKWebAppInit.');
    
    // Получаем объект Bridge и запускаем игру
    vkBridge = window.vkBridge;
    if (!gameInitialized) {
        initializeGame();
    }
});

// 2. Запасной вариант для локального тестирования (если событие не придет)
window.onload = () => {
    console.log('[Mahjong Log] Событие window.onload сработало.');
    setTimeout(() => {
        if (!gameInitialized) {
            console.warn('[Mahjong Log] VKWebAppInit не пришло, запускаю игру в тестовом режиме.');
            // Bridge все равно может быть уже доступен
            vkBridge = window.vkBridge; 
            initializeGame();
        }
    }, 1000); // Ждем 1 секунду
};

// --- КОНЕЦ НОВОГО БЛОКА ---


// Функция инициализации всех основных компонентов игры
function initializeGame() {
    if (gameInitialized) return; // Защита от двойного вызова
    gameInitialized = true;
    
    console.log('[Mahjong Log] initializeGame: Функция запущена.');
    console.log('[Mahjong Log] initializeGame: VK Bridge объект:', vkBridge);

    // Скрываем стартовый экран перед настройкой
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
        menuScreen.style.visibility = 'hidden';
    }

    // Защита от вызова контекстного меню и выделения
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());

    // Загрузка данных игрока и локализация интерфейса
    console.log('[Mahjong Log] initializeGame: Вызов load().');
    load(); 

    // Адаптация размера игрового поля и установка обработчиков событий
    console.log('[Mahjong Log] initializeGame: Вызов autoScale() и настройка событий.');
    autoScale();
    window.addEventListener('resize', autoScale);
    window.addEventListener('orientationchange', () => setTimeout(autoScale, 200));
    window.addEventListener('blur', () => { 
        if(document.getElementById('menu-screen').style.display === 'none' && !state.isPaused) {
            togglePause(true); 
        }
    });

    disableScroll();
    console.log('[Mahjong Log] initializeGame: Инициализация завершена.');
}

const UI_STRINGS = {
    ru: {
        title: "НОВЫЙ МАДЖОНГ 2026",
        lvlInfo: "УРОВЕНЬ: ",
        play: "ИГРАТЬ",
        pause: "ПАУЗА",
        resume: "ПРОДОЛЖИТЬ",
        ach: "ДОСТИЖЕНИЯ",
        close: "ЗАКРЫТЬ",
        rankLbl: "ЗВАНИЕ: ",
        lvlShort: "УР. ",
        win: "ПОБЕДА!",
        winRank: "НОВОЕ ЗВАНИЕ!",
        next: "ДАЛЕЕ",
        stuck: "ТУПИК",
        retry: "ЗАНОВО",
        trophy: "ТРОФЕЙ: ",
        tutorial: "Собери три одинаковых плитки",
        congrats: "Поздравляем! Вы достигли уровня: ",
        rewardHintTitle: "НУЖНЫ ПОДСКАЗКИ?",
        rewardShufTitle: "НУЖНО ПЕРЕМЕШАТЬ?",
        rewardGet: "ПОЛУЧИТЬ +3",
        cancel: "ОТМЕНА"
    },
    // Английский язык оставлен на случай, если вы захотите его вернуть
    en: {
        title: "NEW MAHJONG 2026",
        lvlInfo: "LEVEL: ",
        play: "PLAY",
        pause: "PAUSE",
        resume: "RESUME",
        ach: "ACHIEVEMENTS",
        close: "CLOSE",
        rankLbl: "RANK: ",
        lvlShort: "LVL ",
        win: "VICTORY!",
        winRank: "NEW RANK!",
        next: "NEXT",
        stuck: "STUCK",
        retry: "RETRY",
        trophy: "TROPHY: ",
        tutorial: "Collect three identical tiles",
        congrats: "Congratulations! You reached rank: ",
        rewardHintTitle: "NEED HINTS?",
        rewardShufTitle: "NEED SHUFFLE?",
        rewardGet: "GET +3",
        cancel: "CANCEL"
    }
};

const SYMBOLS = ['🀄','🀅','🀆','🌸','🏮','🎋','🐼','🐲','🍎','💎','🍀','🌟','🔥','🌀','🐱','🐸','🦋','🌈','🍎','🍇','🍒','🍍'];

const RANKS_DB = {
    ru: ["УЧЕНИК", "ИСКАТЕЛЬ", "ПОСЛУШНИК", "МАСТЕР ВЕТРА", "ХРАНИТЕЛЬ", "АЛХИМИК", "НЕФРИТОВЫЙ ВОИН", "СТРАЖ ХРАМА", "МАСТЕР ОГНЯ", "МУДРЕЦ", "БЕЛЫЙ ЛОТОС", "ВЕЛИКИЙ МАСТЕР", "ДРАКОН", "ПОЛУБОГ", "БЕССМЕРТНЫЙ"],
    en: ["STUDENT", "SEEKER", "NOVICE", "WIND MASTER", "GUARDIAN", "ALCHEMIST", "JADE WARRIOR", "TEMPLE GUARD", "FIRE MASTER", "SAGE", "WHITE LOTUS", "GRAND MASTER", "DRAGON", "DEMIGOD", "IMMORTAL"]
};

const GIFTS_DB = {
    ru: [
        {t:"Конверт Удачи", i:"🧧"}, {t:"Китайский Фонарь", i:"🏮"}, {t:"Древний Свиток", i:"📜"}, 
        {t:"Чаша Чая", i:"🍵"}, {t:"Золотой Дракон", i:"🐉"}, {t:"Дерево Желаний", i:"🎋"}, 
        {t:"Храм Мастера", i:"🏯"}, {t:"Иероглиф Силы", i:"🉐"}, {t:"Музыка Ветра", i:"🎐"}, 
        {t:"Священная Ваза", i:"🏺"}, {t:"Золотая Рыбка", i:"🐠"}, {t:"Жемчужина", i:"🔮"}
    ],
    en: [
        {t:"Luck Envelope", i:"🧧"}, {t:"Chinese Lantern", i:"🏮"}, {t:"Ancient Scroll", i:"📜"}, 
        {t:"Cup of Tea", i:"🍵"}, {t:"Golden Dragon", i:"🐉"}, {t:"Wishing Tree", i:"🎋"}, 
        {t:"Master Temple", i:"🏯"}, {t:"Power Kanji", i:"🉐"}, {t:"Wind Chime", i:"🎐"}, 
        {t:"Sacred Vase", i:"🏺"}, {t:"Goldfish", i:"🐠"}, {t:"Pearl", i:"🔮"}
    ]
};

let state = {
    lvl: 1, score: 0, tray: [], tiles: [],
    shuf: 3, hint: 3, mute: false, ctx: null,
    myGifts: [], isPaused: false
};

let isAdLock = false; 
let activeRewardType = null; 

const SKEY = 'mahjong_2026_fixed_final_v7';

function save() {
    const d = { l: state.lvl, s: state.score, sh: state.shuf, hi: state.hint, g: state.myGifts, m: state.mute };
    localStorage.setItem(SKEY, JSON.stringify(d));
}

function load() {
    console.log('[Mahjong Log] load: Загрузка состояния игры из localStorage.');
    const rawData = localStorage.getItem(SKEY);
    const d = JSON.parse(rawData || '{"l":1,"s":0,"sh":3,"hi":3,"g":[],"m":false}');
    state.lvl = d.l; state.score = d.s; state.shuf = d.sh; state.hint = d.hi; state.myGifts = d.g;
    state.mute = d.m || false;
    
    if (state.myGifts.length > 0 && typeof state.myGifts[0] === 'object') {
        const ruGifts = GIFTS_DB.ru;
        state.myGifts = state.myGifts.map(oldGift => 
            ruGifts.findIndex(g => g.i === oldGift.i)
        ).filter(index => index !== -1);
        save();
    }

    const s = UI_STRINGS[LANG];
    document.getElementById('main-title').innerText = s.title;
    document.getElementById('save-info').innerText = s.lvlInfo + state.lvl;
    document.getElementById('play-btn').innerText = s.play;
    document.getElementById('pause-title').innerText = s.pause;
    document.getElementById('resume-btn').innerText = s.resume;
    document.getElementById('ach-title').innerText = s.ach;
    document.getElementById('ach-close-btn').innerText = s.close;
    document.getElementById('next-lvl-btn').innerText = s.next;
    document.getElementById('lose-title').innerText = s.stuck;
    document.getElementById('retry-btn').innerText = s.retry;
    document.getElementById('reward-ad-btn').querySelector('#reward-btn-text').innerText = s.rewardGet;
    document.getElementById('reward-cancel-btn').innerText = s.cancel;
    
    document.getElementById('vol-ico').innerText = state.mute ? '🔇' : '🔊';
    updateUI();

    // После применения всех текстов делаем меню видимым
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
        menuScreen.style.visibility = 'visible';
        console.log('[Mahjong Log] load: Стартовый экран сделан видимым.');
    }
}

function autoScale() {
    const stage = document.getElementById('stage');
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scale = Math.min(ww / 900, wh / 1600);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function playSfx(type) {
    if (state.mute || state.isPaused) return;
    if (!state.ctx) state.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = state.ctx.currentTime;
    const g = state.ctx.createGain(); g.connect(state.ctx.destination);
    if (type === 'tap') {
        const o = state.ctx.createOscillator(); o.connect(g);
        o.frequency.setValueAtTime(600, now); o.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        g.gain.setValueAtTime(0.1, now); o.start(); o.stop(now + 0.1);
    } else if (type === 'match') {
        [523, 659, 783].forEach((f, i) => {
            const o = state.ctx.createOscillator(); o.connect(g);
            o.frequency.value = f; g.gain.setValueAtTime(0.1, now + i*0.06);
            g.gain.linearRampToValueAtTime(0, now + 0.4);
            o.start(now + i*0.06); o.stop(now + 0.5);
        });
    }
}

function startLevel() {
    console.log(`[Mahjong Log] startLevel: Старт уровня ${state.lvl}.`);
    document.querySelectorAll('.overlay').forEach(o => {
        if (o.id !== 'pause-screen') o.style.display = 'none';
    });
    const s = UI_STRINGS[LANG];
    document.getElementById('ui-lvl').innerText = s.lvlShort + state.lvl;
    document.getElementById('ui-score').innerText = state.score;
    
    let rIdx = Math.floor((state.lvl - 1) / 3);
    const ranks = RANKS_DB[LANG];
    document.getElementById('rank-txt').innerText = ranks[Math.min(rIdx, ranks.length-1)];
    
    if (state.lvl === 1) {
        const tut = document.getElementById('tutorial-hint');
        tut.innerText = s.tutorial;
        tut.style.display = 'block';
        const hideTut = () => {
            tut.style.display = 'none';
            document.removeEventListener('touchstart', hideTut);
            document.removeEventListener('mousedown', hideTut);
        };
        document.addEventListener('touchstart', hideTut);
        document.addEventListener('mousedown', hideTut);
    }
    
    updateUI();
    buildBoard();
    save();
}

function handleLevelTransition(action) {
    if (isAdLock) return;
    isAdLock = true;
    document.getElementById('win-screen').style.display = 'none';
    document.getElementById('lose-screen').style.display = 'none';
    let hasProceeded = false;
    const proceed = () => {
        if (hasProceeded) return;
        hasProceeded = true;
        isAdLock = false;
        if (action === 'next') state.lvl++;
        startLevel();
    };

    if (!vkBridge || !vkBridge.supports('VKWebAppShowNativeAds')) {
        console.warn('[Mahjong Log] handleLevelTransition: VK Bridge или реклама не поддерживаются, пропускаю показ.');
        resumeGame();
        proceed();
        return;
    }

    vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'interstitial' })
        .then(data => {
            console.log('[Mahjong Log] handleLevelTransition: Результат показа рекламы:', data);
            resumeGame();
            proceed();
        })
        .catch(error => {
            console.error('[Mahjong Log] handleLevelTransition: Ошибка показа рекламы. Все равно продолжаем.', error);
            resumeGame();
            proceed();
        });
}

function buildBoard() {
    const area = document.getElementById('play-area'); area.innerHTML = '';
    state.tray = []; state.tiles = [];
    let trips = (state.lvl === 1) ? 4 : (10 + Math.floor(state.lvl * 1.5));
    let pool = [];
    for(let i=0; i<trips; i++) {
        let sym = SYMBOLS[Math.floor(Math.random() * Math.min(6 + state.lvl, SYMBOLS.length))];
        pool.push(sym, sym, sym);
    }
    pool.sort(() => Math.random() - 0.5).forEach((sym, i) => {
        const el = document.createElement('div'); el.className = 'tile'; el.innerText = sym;
        const x = 60 + Math.random() * 670; 
        const y = 250 + Math.random() * 800; 
        const r = (Math.random() * 12) - 6;
        el.style.left = x+'px'; el.style.top = y+'px'; el.style.zIndex = i + 10; el.style.transform = `rotate(${r}deg)`;
        const obj = { sym, el, x, y, z: i+10, dead: false };
        el.onclick = () => onSelect(obj);
        area.appendChild(el); state.tiles.push(obj);
    });
    updateLocks();
}

function updateLocks() {
    state.tiles.forEach(t1 => {
        if(t1.dead) return;
        let lock = false;
        for(let t2 of state.tiles) {
            if(!t2.dead && t2.z > t1.z) {
                if(Math.abs(t1.x - t2.x) < 95 && Math.abs(t1.y - t2.y) < 135) { lock = true; break; }
            }
        }
        t1.locked = lock; t1.el.classList.toggle('locked', lock);
    });
}

function onSelect(tile) {
    if (tile.locked || state.tray.length >= 8 || state.isPaused) return;
    playSfx('tap');
    
    state.tiles.forEach(t => t.el.classList.remove('hint-on'));
    
    tile.dead = true;
    state.tray.push(tile);
    state.tray.sort((a,b) => a.sym.localeCompare(b.sym));
    renderTray(); updateLocks();
    setTimeout(checkMatches, 400);
}

function renderTray() {
    const trayBox = document.getElementById('tray-ui');
    state.tray.forEach((t, i) => {
        if (i < trayBox.children.length) {
            const slot = trayBox.children[i];
            t.el.style.left = (trayBox.offsetLeft + slot.offsetLeft + 5) + 'px';
            t.el.style.top = (trayBox.offsetTop + 15) + 'px';
            t.el.style.zIndex = 2000 + i;
            t.el.style.transform = 'rotate(0deg) scale(0.95)';
        }
    });
}

function checkMatches() {
    const counts = {};
    state.tray.forEach(t => counts[t.sym] = (counts[t.sym] || 0) + 1);
    for(let s in counts) {
        if(counts[s] >= 3) {
            playSfx('match');
            let removedCount = 0;
            const toRemove = [];
            const toKeep = [];
            
            state.tray.forEach(t => {
                if (t.sym === s && removedCount < 3) {
                    toRemove.push(t);
                    removedCount++;
                } else {
                    toKeep.push(t);
                }
            });

            toRemove.forEach(t => { t.el.style.transform = 'scale(0)'; setTimeout(() => t.el.remove(), 300); });
            state.tray = toKeep;

            state.score += 500; 
            document.getElementById('ui-score').innerText = state.score;
            save(); 
            setTimeout(() => {
                renderTray();
                if(state.tiles.every(t => t.dead) && state.tray.length === 0) showWin();
            }, 150);
            
            return;
        }
    }
    if(state.tray.length >= 8) document.getElementById('lose-screen').style.display = 'flex';
}

function showWin() {
    const s = UI_STRINGS[LANG];
    const winS = document.getElementById('win-screen');
    const giftIcon = document.getElementById('gift-icon');
    const giftName = document.getElementById('gift-name');
    const winTitle = document.getElementById('win-title-txt');
    if (state.lvl % 3 === 0) {
        let rIdx = Math.floor(state.lvl / 3);
        const ranks = RANKS_DB[LANG];
        let nextRank = ranks[Math.min(rIdx, ranks.length-1)];
        winTitle.innerText = s.winRank;
        giftIcon.innerText = "📜";
        giftName.innerText = s.congrats + nextRank;
    } else {
        winTitle.innerText = s.win;
        const gifts = GIFTS_DB[LANG];
        const giftIndex = (state.lvl - 1) % gifts.length;
        const gift = gifts[giftIndex];
        
        giftIcon.innerText = gift.i;
        giftName.innerText = s.trophy + gift.t;
        
        if (!state.myGifts.includes(giftIndex)) {
            state.myGifts.push(giftIndex);
        }
    }
    winS.style.display = 'flex';
    save();
}

function openRewardModal(type) {
    if (state.isPaused) return;
    activeRewardType = type;
    const s = UI_STRINGS[LANG];
    document.getElementById('reward-title').innerText = (type === 'hint') ? s.rewardHintTitle : s.rewardShufTitle;
    document.getElementById('reward-modal').style.display = 'flex';
    togglePause(true);
}

function closeRewardModal() {
    document.getElementById('reward-modal').style.display = 'none';
    activeRewardType = null;
    togglePause(false);
}

function watchRewardAd() {
    if (isAdLock) return;
    isAdLock = true;

    if (!vkBridge || !vkBridge.supports('VKWebAppShowNativeAds')) {
        console.warn('[Mahjong Log] watchRewardAd: VK Bridge или реклама не поддерживаются, пропускаю.');
        isAdLock = false;
        closeRewardModal();
        return;
    }
    
    vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
        .then(data => {
            console.log('[Mahjong Log] watchRewardAd: Результат показа:', data);
            if (data.result === true) {
                if (activeRewardType === 'hint') state.hint += 3;
                if (activeRewardType === 'shuf') state.shuf += 3;
                save();
                updateUI();
            }
        })
        .catch(error => {
            console.error('[Mahjong Log] watchRewardAd: Ошибка показа рекламы.', error);
        })
        .finally(() => {
            isAdLock = false;
            closeRewardModal();
        });
}

function shuffleBoard() {
    if(state.shuf <= 0) {
        openRewardModal('shuf');
        return;
    }
    if(state.isPaused) return;
    
    state.tiles.forEach(t => t.el.classList.remove('hint-on'));
    
    state.shuf--; 
    updateUI(); 
    save(); 
    state.tiles.filter(t => !t.dead).forEach(t => {
        t.x = 60 + Math.random() * 670; 
        t.y = 250 + Math.random() * 800;
        t.el.style.left = t.x+'px'; el.style.top = t.y+'px';
    });
    updateLocks();
}

function getHint() {
    if(state.hint <= 0) {
        openRewardModal('hint');
        return;
    }
    if(state.isPaused) return;
    const acc = state.tiles.filter(t => !t.dead && !t.locked);
    if(acc.length === 0) return;
    
    let targetSym = null;
    const traySyms = new Set(state.tray.map(t => t.sym));

    for (const sym of traySyms) {
        if (acc.some(t => t.sym === sym)) {
            targetSym = sym;
            break;
        }
    }
    if (!targetSym && acc.length > 0) {
        targetSym = acc[0].sym;
    }

    if (targetSym) {
        state.hint--; 
        updateUI(); 
        save(); 
        acc.filter(t => t.sym === targetSym).forEach(t => t.el.classList.add('hint-on'));
    }
}

function updateUI() {
    const bShuf = document.getElementById('b-shuf');
    const bHint = document.getElementById('b-hint');
    bShuf.innerText = (state.shuf > 0) ? state.shuf : "+";
    bHint.innerText = (state.hint > 0) ? state.hint : "+";
}

function toggleAudio() {
    state.mute = !state.mute;
    document.getElementById('vol-ico').innerText = state.mute ? '🔇' : '🔊';
    save();
}

function openAch() {
    if (state.isPaused) return;
    const s = UI_STRINGS[LANG];
    const grid = document.getElementById('gift-grid');
    grid.innerHTML = '';

    const currentLangGifts = GIFTS_DB[LANG];
    state.myGifts.forEach(giftIndex => {
        const giftData = currentLangGifts[giftIndex];
        if (giftData) {
            const card = document.createElement('div');
            card.className = 'gift-card';
            card.innerHTML = `<span>${giftData.i}</span><p>${giftData.t}</p>`;
            grid.appendChild(card);
        }
    });
    
    document.getElementById('ach-rank').innerText = s.rankLbl + document.getElementById('rank-txt').innerText;
    document.getElementById('achievements-screen').style.display = 'flex';
    togglePause(true);
}

function closeAch() { 
    document.getElementById('achievements-screen').style.display = 'none';
    togglePause(false);
}

function togglePause(val) { 
    if (val === state.isPaused) return;
    state.isPaused = val; 
    document.getElementById('pause-screen').style.display = val ? 'flex' : 'none'; 
}

function resumeGame() { 
    if (document.getElementById('reward-modal').style.display === 'none' && document.getElementById('achievements-screen').style.display === 'none') {
        togglePause(false); 
    }
}

function disableScroll() {
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    document.addEventListener('wheel', e => e.preventDefault(), { passive: false });
}
