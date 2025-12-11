document.addEventListener('DOMContentLoaded', async () => {
    // === Инициализация Telegram WebApp & Variables ===
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
    
    let appData = null;
    let currentLang = localStorage.getItem('blockman_lang') || 'ru';
    let isDark = localStorage.getItem('blockman_theme') !== 'light';
    let isDesktopView = localStorage.getItem('blockman_view') === 'desktop';

    // === WebGL Shader (Фоновая анимация) ===
    const canvas = document.getElementById('shader-canvas');
    const gl = canvas.getContext('webgl');
    let program;
    let startTime = performance.now();
    
    // Shader Initialization
    function initShaders() {
        if (!gl) return;
        
        const createShader = (type, sourceId) => {
            const shader = gl.createShader(type);
            const source = document.getElementById(sourceId).text.trim();
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const vertexShader = createShader(gl.VERTEX_SHADER, 'vertex-shader-2d');
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, 'fragment-shader-2d');

        program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        
        // Setup geometry (a simple quad)
        const positionLocation = gl.getAttribLocation(program, "a_position");
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 1, -1, -1, 1,
            -1, 1, 1, -1, 1, 1,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }
    
    // Shader Render Loop
    function renderShader(time) {
        if (!gl) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        const timeLocation = gl.getUniformLocation(program, "u_time");
        const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
        
        gl.uniform1f(timeLocation, (time - startTime) * 0.001);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(renderShader);
    }
    
    // === Данные и Настройка ===
    
    const fallbackData = {/* ... резервные данные, как в прошлом ответе ... */}; 
    
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            appData = await response.json();
        } catch (error) {
            console.warn('Используются резервные данные:', error);
            appData = fallbackData;
        }

        // Запуск после загрузки/таймаута
        setTimeout(() => {
            document.getElementById('loader').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loader').style.display = 'none';
                document.getElementById('app').classList.remove('hidden');
                document.getElementById('app').classList.add('fade-in');
            }, 500);
        }, 800);

        // Применяем настройки
        applyTheme(isDark, false);
        applyView(isDesktopView, false);
        applyContent(currentLang);
        setupLinks();
        
        if (!localStorage.getItem('discord_notified')) {
            showDiscordNotification();
        }
    }

    // === 1. Управление Темами ===
    function applyTheme(dark, animate = true) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        document.getElementById('theme-btn').innerHTML = dark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        
        // CSS Variables for Telegram
        const color = getComputedStyle(document.body).getPropertyValue('--bg-dark').trim();
        tg.setHeaderColor(color);
        tg.setBackgroundColor(color);
        localStorage.setItem('blockman_theme', dark ? 'dark' : 'light');
    }
    document.getElementById('theme-btn').addEventListener('click', () => {
        isDark = !isDark;
        applyTheme(isDark);
        haptic();
    });

    // === 2. Управление ПК-Режимом ===
    function applyView(desktop, animate = true) {
        document.body.setAttribute('data-view', desktop ? 'desktop' : 'mobile');
        localStorage.setItem('blockman_view', desktop ? 'desktop' : 'mobile');
        document.getElementById('pc-mode-btn').querySelector('i').className = desktop ? 'fa-solid fa-mobile-screen' : 'fa-solid fa-desktop';
        document.getElementById('pc-mode-btn').title = desktop ? 'Мобильный режим' : 'ПК-режим';
    }
    document.getElementById('pc-mode-btn').addEventListener('click', () => {
        isDesktopView = !isDesktopView;
        applyView(isDesktopView);
        haptic();
    });

    // === 3. Обновление Контента (Плавная смена) ===
    function applyContent(lang) {
        if (!appData || !appData.translations) return;
        const t = appData.translations[lang] || appData.translations['en'];
        
        // Ищем все элементы с data-key, независимо от их тега
        document.querySelectorAll('[data-key]').forEach(el => {
            const key = el.getAttribute('data-key');
            if (t[key]) {
                el.style.opacity = 0; // Плавное исчезновение
                
                // Таймер для смены текста и плавного появления
                setTimeout(() => {
                    // Обработка специального текста с Markdown (DC link)
                    if (key === 'desc_discord') {
                        el.innerHTML = t[key].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    } else {
                        el.innerText = t[key];
                    }
                    el.style.opacity = 1; // Плавное появление
                }, 300); 
            }
        });
        
        document.getElementById('current-lang').innerText = lang.toUpperCase();
    }
    document.querySelectorAll('.lang-dropdown div').forEach(item => {
        item.addEventListener('click', () => {
            currentLang = item.getAttribute('data-lang');
            localStorage.setItem('blockman_lang', currentLang);
            applyContent(currentLang);
            haptic();
        });
    });

    // === 4. Установка Ссылок ===
    function setupLinks() {
        if (!appData) return;
        // ... (логика установки ссылок такая же, как в прошлом ответе) ...
        const l = appData.links;
        document.getElementById('link-google').href = l.google;
        document.getElementById('link-apple').href = l.apple;
        document.getElementById('link-rustore').href = l.rustore;
        
        // Main button logic
        const mainBtn = document.getElementById('main-download-btn');
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const targetUrl = (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) ? l.apple : l.google;
        mainBtn.onclick = () => { haptic('heavy'); window.open(targetUrl, '_blank'); };
        
        // Social links
        document.getElementById('soc-discord').href = l.social.discord;
        document.getElementById('soc-youtube').href = l.social.youtube;
        document.getElementById('soc-instagram').href = l.social.instagram;
        document.getElementById('soc-telegram').href = l.social.telegram;
        document.getElementById('soc-tiktok').href = l.social.tiktok;
    }

    // === 5. Discord Notification (Fancy) ===
    function showDiscordNotification() {
        const notif = document.getElementById('discord-notif');
        
        setTimeout(() => {
            notif.classList.add('show');
            haptic('medium');
        }, 3000); // Показать через 3 секунды
        
        // Закрытие при клике
        notif.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-btn')) {
                 notif.classList.remove('show');
            } else {
                // Клик по самой нотификации - переход в Discord
                window.open(appData.links.social.discord, '_blank');
                notif.classList.remove('show');
                localStorage.setItem('discord_notified', 'true');
            }
        });
        
        // Авто-скрытие
        setTimeout(() => {
            notif.classList.remove('show');
        }, 10000);
    }
    
    // === 6. Haptic Feedback (Вибрация) ===
    function haptic(style = 'light') {
        if (tg.HapticFeedback) {
            if (style === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
            else if (style === 'medium') tg.HapticFeedback.impactOccurred('medium');
            else tg.HapticFeedback.impactOccurred('light');
        }
    }
    
    document.querySelectorAll('button, a, .lang-dropdown div, .feature-card').forEach(el => {
        el.addEventListener('touchstart', () => haptic());
    });
    
    // === Запуск ===
    initShaders();
    requestAnimationFrame(renderShader); // Запуск цикла WebGL
    loadData(); // Загрузка данных и инициализация
});
