document.addEventListener('DOMContentLoaded', async () => {
    // === Инициализация Telegram WebApp ===
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    
    // Настройка цветов системного хедера
    tg.setHeaderColor(getComputedStyle(document.body).getPropertyValue('--bg-dark').trim());
    tg.setBackgroundColor(getComputedStyle(document.body).getPropertyValue('--bg-dark').trim());

    // === Переменные ===
    let appData = null;
    let currentLang = localStorage.getItem('blockman_lang') || 'ru';
    let isDark = true;

    // === Fallback данные (если json не загрузится локально/ошибка сети) ===
    const fallbackData = {
        links: {
            google: "https://play.google.com/store/apps/details?id=com.sandboxol.blockymods",
            apple: "https://apps.apple.com/us/app/blockman-go/id1426189000",
            rustore: "https://www.rustore.ru",
            social: {}
        },
        translations: {
            ru: { hero_title: "Blockman Go", hero_subtitle: "Ошибка загрузки", feat_1_desc: "Пожалуйста, проверьте интернет" },
            en: { hero_title: "Blockman Go", hero_subtitle: "Load Error", feat_1_desc: "Check internet connection" },
            zh: { hero_title: "Blockman Go", hero_subtitle: "加载错误", feat_1_desc: "检查互联网" }
        }
    };

    // === Загрузка Данных ===
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            appData = await response.json();
        } catch (error) {
            console.warn('Используются резервные данные (CORS или ошибка):', error);
            appData = fallbackData;
        }
        
        // Скрываем лоадер и показываем контент
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                const app = document.getElementById('app');
                app.classList.remove('hidden');
                app.classList.add('fade-in');
            }, 500);
        }, 1000); // Имитация загрузки для красоты

        applyContent(currentLang);
        setupLinks();
    }

    // === Применение контента ===
    function applyContent(lang) {
        if (!appData || !appData.translations) return;
        const t = appData.translations[lang] || appData.translations['en'];
        
        // Маппинг ID элементов к ключам JSON
        const map = {
            'hero-title': 'hero_title',
            'hero-subtitle': 'hero_subtitle',
            'btn-install-text': 'btn_install',
            'sect-features-title': 'sect_features',
            'feat-1-title': 'feat_1_title',
            'feat-1-desc': 'feat_1_desc',
            'feat-2-title': 'feat_2_title',
            'feat-2-desc': 'feat_2_desc',
            'feat-3-title': 'feat_3_title',
            'feat-3-desc': 'feat_3_desc',
            'footer-text': 'footer_text',
            'loader-text': 'loading'
        };

        for (const [id, key] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (el && t[key]) {
                // Анимация смены текста
                el.style.opacity = 0;
                setTimeout(() => {
                    el.innerText = t[key];
                    el.style.opacity = 1;
                }, 200);
            }
        }
        
        document.getElementById('current-lang').innerText = lang.toUpperCase();
    }

    // === Настройка ссылок ===
    function setupLinks() {
        if (!appData) return;
        const l = appData.links;
        
        document.getElementById('link-google').href = l.google;
        document.getElementById('link-apple').href = l.apple;
        document.getElementById('link-rustore').href = l.rustore;
        
        // Главная кнопка ведет на Google Play по умолчанию (или можно детектить ОС)
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            document.getElementById('main-download-btn').onclick = () => window.open(l.apple, '_blank');
        } else {
            document.getElementById('main-download-btn').onclick = () => window.open(l.google, '_blank');
        }

        const soc = l.social || {};
        const socMap = { 'soc-discord': soc.discord, 'soc-youtube': soc.youtube, 'soc-telegram': soc.telegram, 'soc-tiktok': soc.tiktok };
        
        for(const [id, url] of Object.entries(socMap)) {
            const el = document.getElementById(id);
            if(el) {
                if(url) el.href = url;
                else el.style.display = 'none';
            }
        }
    }

    // === Обработчики событий (Interactions) ===
    
    // Смена языка
    document.querySelectorAll('.lang-dropdown div').forEach(item => {
        item.addEventListener('click', () => {
            currentLang = item.getAttribute('data-lang');
            localStorage.setItem('blockman_lang', currentLang);
            applyContent(currentLang);
            haptic();
        });
    });

    // Смена темы
    document.getElementById('theme-btn').addEventListener('click', () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.getElementById('theme-btn').innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        
        // Обновляем цвет хедера Telegram
        const color = isDark ? '#0f1014' : '#f0f2f5';
        tg.setHeaderColor(color);
        tg.setBackgroundColor(color);
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

    // Запуск
    initParticles();
    animateParticles();
    loadData();
});
