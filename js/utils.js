/* ============================================
   QuizCraft — Utilities & Namespace
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.utils = (function() {
    'use strict';

    /**
     * Sanitize user content before HTML insertion (XSS prevention).
     * Creates a text node and extracts its HTML-safe representation.
     */
    function escapeHTML(str) {
        if (typeof str !== 'string') return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Safe localStorage getter — returns fallback in private browsing
     * or when localStorage is unavailable.
     */
    function safeGetItem(key, fallback) {
        try {
            return localStorage.getItem(key) || fallback;
        } catch (e) {
            return fallback;
        }
    }

    /**
     * Safe localStorage setter — silently fails in private browsing.
     */
    function safeSetItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // localStorage unavailable (private browsing)
        }
    }

    /**
     * Rate limiter — prevents a function from being called more than
     * once within the given interval (milliseconds).
     */
    function rateLimit(fn, minInterval) {
        var lastCall = 0;
        return function() {
            var now = Date.now();
            if (now - lastCall < minInterval) return;
            lastCall = now;
            return fn.apply(this, arguments);
        };
    }

    /**
     * Sanitize a filename for display — strips path traversal characters.
     */
    function sanitizeFilename(name) {
        if (typeof name !== 'string') return '';
        return name.replace(/[\/\\:*?"<>|]/g, '_');
    }

    /**
     * Levenshtein distance — returns the minimum number of single-character
     * edits (insertions, deletions, substitutions) to change one string into another.
     * Used for fuzzy matching on short-answer questions.
     */
    function levenshtein(a, b) {
        if (typeof a !== 'string' || typeof b !== 'string') return Infinity;
        a = a.toLowerCase().trim();
        b = b.toLowerCase().trim();
        if (a === b) return 0;
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        var matrix = [];
        for (var i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (var j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (var i = 1; i <= b.length; i++) {
            for (var j = 1; j <= a.length; j++) {
                var cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
        return matrix[b.length][a.length];
    }

    return {
        escapeHTML: escapeHTML,
        safeGetItem: safeGetItem,
        safeSetItem: safeSetItem,
        rateLimit: rateLimit,
        sanitizeFilename: sanitizeFilename,
        levenshtein: levenshtein
    };
})();
