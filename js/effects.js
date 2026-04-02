/* ============================================
   QuizCraft — Visual Effects, Theme & Init
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.effects = (function() {
    'use strict';

    var utils = QuizCraft.utils;
    var state = QuizCraft.state;

    function createCodeRain() {
        var codeRain = document.getElementById('codeRain');
        if (!codeRain) return;

        var chars = '01\u30a2\u30a4\u30a6\u30a8\u30aa\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30ca\u30cb\u30cc\u30cd\u30ce{}[]<>/';
        var columns = Math.min(Math.floor(window.innerWidth / 20), 30);

        for (var i = 0; i < columns; i++) {
            var span = document.createElement('span');
            span.className = 'code-rain';
            span.textContent = chars.charAt(Math.floor(Math.random() * chars.length));
            span.style.left = (i * 20) + 'px';
            span.style.animationDuration = (Math.random() * 3 + 2) + 's';
            span.style.animationDelay = (Math.random() * 2) + 's';
            codeRain.appendChild(span);
        }
    }

    // Pause code rain when tab is not visible
    function initVisibilityHandler() {
        document.addEventListener('visibilitychange', function() {
            var bg = document.querySelector('.animated-bg');
            if (!bg) return;
            if (document.hidden) {
                bg.style.animationPlayState = 'paused';
            } else {
                bg.style.animationPlayState = 'running';
            }
        });
    }

    // Rate-limited celebrate — 2 second cooldown
    var _celebrateImpl = function() {
        var colors = ['#00f5ff', '#7b2ff7', '#00ff88', '#ffa502'];

        for (var i = 0; i < 50; i++) {
            (function(idx) {
                setTimeout(function() {
                    var confetti = document.createElement('div');
                    confetti.className = 'confetti';
                    confetti.style.left = Math.random() * 100 + '%';
                    confetti.style.top = '-10px';
                    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                    confetti.style.animationDelay = Math.random() * 0.5 + 's';
                    document.body.appendChild(confetti);
                    confetti.addEventListener('animationend', function() { confetti.remove(); });
                }, idx * 30);
            })(i);
        }
    };
    var celebrate = utils.rateLimit(_celebrateImpl, 2000);

    function initTheme() {
        var themeToggle = document.getElementById('themeToggle');
        var themeIcon = document.getElementById('themeIcon');
        if (!themeToggle || !themeIcon) return;

        var savedTheme = utils.safeGetItem('theme', 'dark');

        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeIcon.textContent = '\u2600\ufe0f';
        }

        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('light-mode');
            var isLight = document.body.classList.contains('light-mode');
            themeIcon.textContent = isLight ? '\u2600\ufe0f' : '\ud83c\udf19';
            utils.safeSetItem('theme', isLight ? 'light' : 'dark');
        });
    }

    function initQuizCounter() {
        var totalEl = document.getElementById('totalQuizzes');
        if (totalEl) {
            totalEl.textContent = state.totalQuizzesTaken;
        }
    }

    // Main initialization — called on window load
    function initApp() {
        try {
            initTheme();
        } catch (e) {
            console.error('[QuizCraft] Theme init failed:', e);
        }

        try {
            createCodeRain();
        } catch (e) {
            console.error('[QuizCraft] Code rain init failed:', e);
        }

        try {
            initVisibilityHandler();
        } catch (e) {
            console.error('[QuizCraft] Visibility handler init failed:', e);
        }

        try {
            initQuizCounter();
        } catch (e) {
            console.error('[QuizCraft] Quiz counter init failed:', e);
        }

        try {
            QuizCraft.views.init();
        } catch (e) {
            console.error('[QuizCraft] Views init failed:', e);
        }

        try {
            QuizCraft.upload.init();
        } catch (e) {
            console.error('[QuizCraft] Upload init failed:', e);
        }

        try {
            QuizCraft.grading.init();
        } catch (e) {
            console.error('[QuizCraft] Grading init failed:', e);
        }

        try {
            QuizCraft.history.renderHistory();
        } catch (e) {
            console.error('[QuizCraft] History init failed:', e);
        }
    }

    return {
        createCodeRain: createCodeRain,
        celebrate: celebrate,
        initTheme: initTheme,
        initApp: initApp
    };
})();

// --- Expose global handlers ---
window.restoreUploadArea = QuizCraft.upload.restoreUploadArea;
window.restoreUploadState = QuizCraft.upload.restoreUploadState;

// --- Boot the app ---
window.addEventListener('load', QuizCraft.effects.initApp);
