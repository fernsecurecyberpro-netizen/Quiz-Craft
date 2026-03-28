/* ============================================
   QuizCraft — Quiz Display & Interaction
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.quiz = (function() {
    'use strict';

    var utils = QuizCraft.utils;
    var state = QuizCraft.state;

    function displayQuiz() {
        var quizArea = document.getElementById('quizArea');
        if (!quizArea) {
            console.error('[QuizCraft] Quiz: quizArea not found');
            return;
        }

        var html = '<div class="quiz-container" role="form" aria-label="Quiz questions">';

        for (var i = 0; i < state.quizData.length; i++) {
            var q = state.quizData[i];
            var qId = 'question-' + i;
            html += '<div class="question-block" style="animation-delay: ' + (i * 0.08) + 's" role="group" aria-labelledby="' + qId + '">';
            html += '<span class="question-number">Question ' + (i + 1) + ' of ' + state.quizData.length + '</span>';
            html += '<div class="question-text" id="' + qId + '">' + utils.escapeHTML(q.question) + '</div>';

            if (q.type === 'multiple-choice') {
                html += '<div role="radiogroup" aria-labelledby="' + qId + '">';
                for (var j = 0; j < q.options.length; j++) {
                    var letter = q.options[j].charAt(0).toLowerCase();
                    html += '<label class="option">';
                    html += '<input type="radio" name="q' + i + '" value="' + letter + '" onchange="selectAnswer(' + i + ', \'' + letter + '\')" aria-label="' + utils.escapeHTML(q.options[j]) + '">';
                    html += '<span>' + utils.escapeHTML(q.options[j]) + '</span>';
                    html += '</label>';
                }
                html += '</div>';
            } else if (q.type === 'select-all') {
                html += '<p style="color: var(--accent-primary); font-size: 14px; font-weight: 600; margin-bottom: 12px;">Select all that apply:</p>';
                html += '<div role="group" aria-labelledby="' + qId + '">';
                for (var j = 0; j < q.options.length; j++) {
                    var letter = q.options[j].charAt(0).toLowerCase();
                    html += '<label class="option">';
                    html += '<input type="checkbox" name="q' + i + '" value="' + letter + '" onchange="selectMultipleAnswers(' + i + ', \'' + letter + '\')" aria-label="' + utils.escapeHTML(q.options[j]) + '">';
                    html += '<span>' + utils.escapeHTML(q.options[j]) + '</span>';
                    html += '</label>';
                }
                html += '</div>';
            } else if (q.type === 'true-false') {
                html += '<div role="radiogroup" aria-labelledby="' + qId + '">';
                html += '<label class="option">';
                html += '<input type="radio" name="q' + i + '" value="true" onchange="selectAnswer(' + i + ', \'true\')" aria-label="True">';
                html += '<span>True</span>';
                html += '</label>';
                html += '<label class="option">';
                html += '<input type="radio" name="q' + i + '" value="false" onchange="selectAnswer(' + i + ', \'false\')" aria-label="False">';
                html += '<span>False</span>';
                html += '</label>';
                html += '</div>';
            } else {
                html += '<input type="text" class="text-input" placeholder="Type your answer..." oninput="selectAnswer(' + i + ', this.value)" aria-labelledby="' + qId + '">';
            }

            html += '</div>';
        }

        html += '</div>';
        quizArea.innerHTML = html;
        state.userAnswers = {};

        // Update question counter
        updateCounter();
        updateProgress();

        // Set up intersection observer for question tracking
        setupQuestionTracking();
    }

    function setupQuestionTracking() {
        var questions = document.querySelectorAll('.question-block');
        var counter = document.getElementById('questionCounter');
        if (!counter || !questions.length || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function(entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    var idx = Array.prototype.indexOf.call(questions, entries[i].target);
                    if (idx >= 0) {
                        counter.textContent = (idx + 1) + ' / ' + questions.length;
                    }
                }
            }
        }, {
            root: document.querySelector('.quiz-body'),
            threshold: 0.5
        });

        for (var i = 0; i < questions.length; i++) {
            observer.observe(questions[i]);
        }
    }

    function updateCounter() {
        var counter = document.getElementById('questionCounter');
        if (counter) {
            counter.textContent = '1 / ' + state.quizData.length;
        }
    }

    function selectAnswer(index, answer) {
        state.userAnswers[index] = answer;
        updateProgress();

        if (state.quizData[index] && state.quizData[index].type !== 'short-answer') {
            var options = document.querySelectorAll('input[name="q' + index + '"]');
            for (var i = 0; i < options.length; i++) {
                if (options[i].checked) {
                    options[i].parentElement.classList.add('selected');
                } else {
                    options[i].parentElement.classList.remove('selected');
                }
            }
        }
    }

    function selectMultipleAnswers(index, letter) {
        var checkboxes = document.querySelectorAll('input[name="q' + index + '"]');
        var selectedAnswers = [];

        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                selectedAnswers.push(checkboxes[i].value.toLowerCase());
                checkboxes[i].parentElement.classList.add('selected');
            } else {
                checkboxes[i].parentElement.classList.remove('selected');
            }
        }

        state.userAnswers[index] = selectedAnswers.sort().join(',');
        updateProgress();
    }

    function updateProgress() {
        var progressFill = document.getElementById('progressFill');
        if (!progressFill) return;

        var answered = Object.keys(state.userAnswers).length;
        var total = state.quizData.length;
        var percentage = total > 0 ? (answered / total) * 100 : 0;
        progressFill.style.width = percentage + '%';
    }

    return {
        displayQuiz: displayQuiz,
        selectAnswer: selectAnswer,
        selectMultipleAnswers: selectMultipleAnswers,
        updateProgress: updateProgress
    };
})();
