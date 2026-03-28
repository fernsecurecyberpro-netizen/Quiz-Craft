/* ============================================
   QuizCraft — View Controller
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.views = (function() {
    'use strict';

    var state = QuizCraft.state;

    var VIEW_LABELS = {
        landing: 'Upload page',
        quiz: 'Quiz started',
        results: 'Quiz results'
    };

    var FOCUS_TARGETS = {
        landing: '#uploadArea',
        quiz: '.quiz-body',
        results: '.results-body'
    };

    var STEP_MAP = {
        landing: 0,
        quiz: 1,
        results: 2
    };

    function transitionTo(viewName) {
        var prev = state.currentView;
        if (prev === viewName) return;

        state.currentView = viewName;
        document.body.setAttribute('data-view', viewName);

        // Update step indicator
        updateSteps(viewName);

        // Announce to screen readers
        var announcer = document.getElementById('viewAnnouncer');
        if (announcer) {
            announcer.textContent = VIEW_LABELS[viewName] || '';
        }

        // Focus management (delayed to allow CSS transition)
        setTimeout(function() {
            var target = document.querySelector(FOCUS_TARGETS[viewName]);
            if (target) {
                target.focus({ preventScroll: true });
            }
        }, 100);

        // Scroll quiz body to top when entering quiz
        if (viewName === 'quiz') {
            var quizBody = document.querySelector('.quiz-body');
            if (quizBody) quizBody.scrollTop = 0;
        }

        // Scroll results body to top
        if (viewName === 'results') {
            var resultsBody = document.querySelector('.results-body');
            if (resultsBody) resultsBody.scrollTop = 0;
        }
    }

    function updateSteps(viewName) {
        var current = STEP_MAP[viewName] || 0;
        var steps = document.querySelectorAll('.step');
        for (var i = 0; i < steps.length; i++) {
            steps[i].classList.toggle('active', i === current);
            steps[i].classList.toggle('completed', i < current);
        }
    }

    function init() {
        // Set initial view
        document.body.setAttribute('data-view', 'landing');

        // Escape key handler for fullscreen views
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (state.currentView === 'quiz') {
                    if (confirm('Leave the quiz? Your progress will be lost.')) {
                        QuizCraft.timer.stopTimer();
                        transitionTo('landing');
                    }
                } else if (state.currentView === 'results') {
                    transitionTo('landing');
                }
            }
        });
    }

    return {
        transitionTo: transitionTo,
        init: init
    };
})();
