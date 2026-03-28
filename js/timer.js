/* ============================================
   QuizCraft — Timer
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.timer = (function() {
    'use strict';

    var state = QuizCraft.state;

    function startTimer() {
        var timerText = document.getElementById('timerText');
        if (!timerText) return;

        state.startTime = Date.now();

        if (state.timerInterval) {
            clearInterval(state.timerInterval);
        }

        state.timerInterval = setInterval(function() {
            var elapsed = Math.floor((Date.now() - state.startTime) / 1000);
            var minutes = Math.floor(elapsed / 60);
            var seconds = elapsed % 60;
            timerText.textContent = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        }, 1000);
    }

    function stopTimer() {
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
    }

    return {
        startTimer: startTimer,
        stopTimer: stopTimer
    };
})();
