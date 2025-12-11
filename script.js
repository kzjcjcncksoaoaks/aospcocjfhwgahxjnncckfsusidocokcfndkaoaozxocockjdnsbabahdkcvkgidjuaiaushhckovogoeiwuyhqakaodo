document.addEventListener('DOMContentLoaded', async () => {
    // === Инициализация Telegram WebApp ===
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    
    // === Переменные ===
    let appData = null;
    let currentLang = localStorage.getItem('blockman_lang') || 'ru';
    let isDark = localStorage.getItem('blockman_theme') === 'dark'; // Запоминаем тему
    
    // === Fallback данные (для локального запуска/ошибки сети) ===
    const fallbackData = {
        links: { social: {} },
        translations: {
            ru: { loading: "Загрузка...", hero_title: "Blockman Go", feat_1_desc: "Проблема с загрузкой данных." },
            en: { loading: "Loading...", hero_title: "Blockman Go", feat_1_desc: "Data loading issue." },
            zh: { loading: "正在加载...", hero_title: "Blockman Go", feat_1_desc: "数据加载问题." }
        }
    };

    // === Загрузка Данных ===
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            appData = await response.json();
        } catch (error) {
            console.warn('Используются резервные данные:', error);
            appData = fallbackData;
        }
        
        // Применяем начальные настройки
        applyTheme(isDark, false); 
        setupLinks();

        // Показываем лоадер с начальным текстом, затем скрываем
        applyContent(currentLang, true);
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                const app = document.getElementById('app');
                app.classList.remove('hidden');
                app.classList.add('fade-in');
            }, 500);
        }, 1000); 
    }
    
    // === Применение контента с плавной анимацией ===
    function applyContent(lang, initialLoad = false) {
        if (!appData || !appData.translations) return;
        
        const t = appData.translations[lang] || appData.translations['en'];
        const elements = document.querySelectorAll('[data-key]');
        
        const map = {
            'hero_title': 'h1', 'hero_subtitle': 'p', 'desc_intro': 'p',
            'sect_features': 'h2', 'feat_1_title': 'h3', 'feat_1_desc': 'p',
            'feat_2_title': 'h3', 'feat_2_desc': 'p', 'feat_3_title': 'h3', 'feat_3_desc': 'p',
            'feat_4_title': 'h3', 'feat_4_desc': 'p',
            'sect_discord_title': 'h2', 'sect_discord_desc': 'p',
            'btn_download': 'span', 'btn_discord': 'span',
            'footer_text': 'p', 'loading': 'p'
        };

        elements.forEach(el => {
            const key = el.getAttribute('data-key');
            if (t[key]) {
                if (!initialLoad) {
                    // 1. Скрываем текст
                    el.classList.add('text-hidden'); 
                    
                    // 2. Меняем текст после задержки
                    setTimeout(() => {
                        el.innerText = t[key];
                        // 3. Показываем текст
                        el.classList.remove('text-hidden');
                    }, 200); // Задержка равна времени transition
                } else {
                     // При первой загрузке просто ставим текст
                    el.innerText = t[key];
                }
                el.classList.add('text-transition');
            }
        });
        
        document.getElementById('current-lang').innerText = lang.toUpperCase();
        localStorage.setItem('blockman_lang', lang);
        document.querySelector('html').lang = lang;
    }

    // === Настройка ссылок ===
    function setupLinks() {
        if (!appData) return;
        const l = appData.links;
        
        // Установка ссылок магазинов
        document.getElementById('link-google').href = l.google;
        document.getElementById('link-apple').href = l.apple;
        document.getElementById('link-rustore').href = l.rustore;
        
        // Кнопка Discord
        const discordBtn = document.getElementById('discord-btn');
        discordBtn.href = l.social.discord;

        // Главная кнопка установки (детектим ОС)
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mainLink = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ? l.apple : l.google;
        document.getElementById('main-download-btn').onclick = () => window.open(mainLink, '_blank');

        // Соцсети в футере
        const soc = l.social || {};
        const socMap = { 'soc-discord': soc.discord, 'soc-youtube': soc.youtube, 'soc-instagram': soc.instagram, 'soc-telegram': soc.telegram, 'soc-tiktok': soc.tiktok };
        for(const [id, url] of Object.entries(socMap)) {
            const el = document.getElementById(id);
            if(el) {
                if(url) el.href = url;
                else el.style.display = 'none'; // Скрываем, если ссылки нет
            }
        }
    }

    // === Управление Темой ===
    function applyTheme(dark, animate = true) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        document.getElementById('theme-btn').innerHTML = dark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('blockman_theme', dark ? 'dark' : 'light');

        // Обновляем цвета Telegram (для плавности используем transition)
        const color = dark ? '#0f1014' : '#f0f2f5';
        if (animate) {
             // TG API не поддерживает transition, но мы можем его вызвать
             tg.setHeaderColor(color);
             tg.setBackgroundColor(color);
        } else {
             tg.setHeaderColor(color);
             tg.setBackgroundColor(color);
        }
    }

    // === Обработчики событий (Interactions) ===
    
    // Смена языка
    document.querySelectorAll('.lang-dropdown div').forEach(item => {
        item.addEventListener('click', () => {
            applyContent(item.getAttribute('data-lang'), false);
            haptic();
        });
    });

    // Смена темы
    document.getElementById('theme-btn').addEventListener('click', () => {
        isDark = !isDark;
        applyTheme(isDark, true);
        haptic();
    });

    // Telegram Haptic Feedback (Вибрация)
    function haptic() {
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }

    // Добавляем эффект нажатия на все кнопки
    document.querySelectorAll('button, a').forEach(btn => {
        btn.addEventListener('touchstart', () => haptic());
    });

    // === Canvas Background Animation (Particles) ===
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
            if (this.y > canvas.height) this.y = 0;
            if (this.y < 0) this.y = canvas.height;
        }
        draw() {
            ctx.fillStyle = `rgba(255, 193, 7, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initParticles() {
        for (let i = 0; i < 50; i++) particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }

    // Запуск приложения
    initParticles();
    animateParticles();
    loadData();
});
