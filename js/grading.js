/* ============================================
   QuizCraft — Grading & Results
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.grading = (function() {
    'use strict';

    var utils = QuizCraft.utils;
    var state = QuizCraft.state;

    function init() {
        var submitBtn = document.getElementById('submitBtn');
        var resetBtn = document.getElementById('resetBtn');
        var resultsBackBtn = document.getElementById('resultsBackBtn');
        var retryBtn = document.getElementById('retryBtn');
        var quizBackBtn = document.getElementById('quizBackBtn');

        if (submitBtn) {
            submitBtn.addEventListener('click', handleSubmit);
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                QuizCraft.timer.stopTimer();
                QuizCraft.quiz.displayQuiz();
                QuizCraft.timer.startTimer();
            });
        }

        if (resultsBackBtn) {
            resultsBackBtn.addEventListener('click', function() {
                QuizCraft.upload.restoreUploadState();
                QuizCraft.views.transitionTo('landing');
            });
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', function() {
                QuizCraft.views.transitionTo('quiz');
                QuizCraft.quiz.displayQuiz();
                QuizCraft.timer.startTimer();
            });
        }

        if (quizBackBtn) {
            quizBackBtn.addEventListener('click', function() {
                if (confirm('Leave the quiz? Your progress will be lost.')) {
                    QuizCraft.timer.stopTimer();
                    QuizCraft.views.transitionTo('landing');
                }
            });
        }
    }

    function handleSubmit() {
        var answered = Object.keys(state.userAnswers).length;
        var unanswered = state.quizData.length - answered;
        if (unanswered > 0) {
            if (!confirm('You have ' + unanswered + ' unanswered question' + (unanswered !== 1 ? 's' : '') + '. Submit anyway?')) {
                return;
            }
        }

        QuizCraft.timer.stopTimer();

        var results = document.getElementById('results');
        if (!results) return;

        var correct = 0;
        var total = state.quizData.length;

        // Calculate score
        for (var i = 0; i < state.quizData.length; i++) {
            var q = state.quizData[i];
            var userAnswer = (state.userAnswers[i] || '').toString().toLowerCase().trim();
            var correctAnswer = q.answer.toLowerCase().trim();
            var isCorrect = false;

            if (q.type === 'short-answer') {
                if (userAnswer && correctAnswer) {
                    if (userAnswer === correctAnswer) {
                        isCorrect = true;
                    } else if (correctAnswer.length >= 4) {
                        isCorrect = utils.levenshtein(userAnswer, correctAnswer) <= 2;
                    }
                }
            } else if (q.type === 'select-all') {
                isCorrect = userAnswer === correctAnswer;
            } else if (q.type === 'multiple-choice') {
                isCorrect = userAnswer === correctAnswer;
            } else if (q.type === 'true-false') {
                isCorrect = userAnswer === correctAnswer;
            }

            if (isCorrect) correct++;
        }

        var percentage = Math.round((correct / total) * 100);
        var grade = 'F';
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';

        var elapsed = state.startTime ? Math.floor((Date.now() - state.startTime) / 1000) : 0;
        var minutes = Math.floor(elapsed / 60);
        var seconds = elapsed % 60;
        var timeStr = minutes + 'm ' + seconds + 's';

        // Build results HTML
        var feedbackHTML = '<div class="results-content">';

        // Quick stats
        feedbackHTML +=
            '<div class="quick-stats">' +
                '<div class="stat-card">' +
                    '<div class="value">' + correct + '/' + total + '</div>' +
                    '<div class="label">Correct</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="value">' + percentage + '%</div>' +
                    '<div class="label">Score</div>' +
                '</div>' +
                '<div class="stat-card">' +
                    '<div class="value">' + timeStr + '</div>' +
                    '<div class="label">Time</div>' +
                '</div>' +
            '</div>';

        // Score circle
        var circumference = 2 * Math.PI * 70;
        var offset = circumference;

        feedbackHTML +=
            '<div style="text-align: center;">' +
            '<div class="score-circle">' +
                '<svg viewBox="0 0 200 200">' +
                    '<circle cx="100" cy="100" r="70" fill="none" stroke="var(--bg-secondary)" stroke-width="10"/>' +
                    '<circle cx="100" cy="100" r="70" fill="none" stroke="url(#scoreGradient)" stroke-width="10" ' +
                        'stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" id="scoreCircle"/>' +
                    '<defs>' +
                        '<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">' +
                            '<stop offset="0%" style="stop-color:var(--accent-primary)"/>' +
                            '<stop offset="100%" style="stop-color:var(--accent-secondary)"/>' +
                        '</linearGradient>' +
                    '</defs>' +
                '</svg>' +
                '<div class="score-value">' +
                    '<h2>' + percentage + '%</h2>' +
                    '<p>Your Score</p>' +
                '</div>' +
            '</div>';

        feedbackHTML += '<div class="grade-badge ' + grade + '">' + grade + '</div>';
        feedbackHTML += '</div>';

        feedbackHTML += '<h3 style="margin: 24px 0 16px; font-family: Space Grotesk, sans-serif;">Review Your Answers</h3>';

        // Detailed feedback
        for (var i = 0; i < state.quizData.length; i++) {
            var q = state.quizData[i];
            var userAnswer = (state.userAnswers[i] || '').toString().trim();
            var correctAnswer = q.answer.trim();
            var isCorrect = false;

            // Build display text for user's answer
            var userAnswerText = userAnswer || 'No answer';
            if (q.type === 'multiple-choice' && userAnswer) {
                var userLetter = userAnswer.toLowerCase();
                for (var j = 0; j < q.options.length; j++) {
                    if (q.options[j].charAt(0).toLowerCase() === userLetter) {
                        userAnswerText = q.options[j];
                        break;
                    }
                }
            } else if (q.type === 'select-all' && userAnswer) {
                var selectedLetters = userAnswer.toLowerCase().split(',').map(function(a) { return a.trim(); });
                var selectedOptions = [];
                for (var k = 0; k < selectedLetters.length; k++) {
                    for (var j = 0; j < q.options.length; j++) {
                        if (q.options[j].charAt(0).toLowerCase() === selectedLetters[k]) {
                            selectedOptions.push(q.options[j]);
                            break;
                        }
                    }
                }
                userAnswerText = selectedOptions.length > 0 ? selectedOptions.join(', ') : 'No answer';
            } else if (q.type === 'true-false' && userAnswer) {
                userAnswerText = userAnswer.charAt(0).toUpperCase() + userAnswer.slice(1).toLowerCase();
            }

            // Build display text for correct answer
            var correctAnswerText = q.rawAnswer || q.answer;
            if (q.type === 'multiple-choice') {
                var correctLetter = correctAnswer.toLowerCase();
                for (var j = 0; j < q.options.length; j++) {
                    if (q.options[j].charAt(0).toLowerCase() === correctLetter) {
                        correctAnswerText = q.options[j];
                        break;
                    }
                }
            } else if (q.type === 'select-all') {
                var correctLetters = correctAnswer.toLowerCase().split(',').map(function(a) { return a.trim(); });
                var correctOptions = [];
                for (var k = 0; k < correctLetters.length; k++) {
                    for (var j = 0; j < q.options.length; j++) {
                        if (q.options[j].charAt(0).toLowerCase() === correctLetters[k]) {
                            correctOptions.push(q.options[j]);
                            break;
                        }
                    }
                }
                correctAnswerText = correctOptions.join(', ');
            } else if (q.type === 'true-false') {
                correctAnswerText = correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1).toLowerCase();
            }

            // Determine if answer is correct
            var userLower = userAnswer.toLowerCase().trim();
            var correctLower = correctAnswer.toLowerCase().trim();

            if (q.type === 'short-answer') {
                if (userLower && correctLower) {
                    if (userLower === correctLower) {
                        isCorrect = true;
                    } else if (correctLower.length >= 4) {
                        isCorrect = utils.levenshtein(userLower, correctLower) <= 2;
                    }
                }
            } else {
                isCorrect = userLower === correctLower;
            }

            var rationaleHTML = '';
            if (q.rationale) {
                rationaleHTML =
                    '<div class="rationale-callout">' +
                        '<span class="rationale-label">Rationale</span>' +
                        '<p>' + utils.escapeHTML(q.rationale) + '</p>' +
                    '</div>';
            }

            feedbackHTML +=
                '<div class="feedback">' +
                    '<strong>Q' + (i + 1) + ': ' + utils.escapeHTML(q.question) + '</strong>' +
                    '<p style="margin-top: 8px;">Your answer: <span class="' + (isCorrect ? 'correct-answer' : 'incorrect-answer') + '">' + utils.escapeHTML(userAnswerText) + '</span></p>' +
                    (!isCorrect ? '<p style="margin-top: 4px;">Correct answer: <span class="correct-answer">' + utils.escapeHTML(correctAnswerText) + '</span></p>' : '<p style="margin-top: 4px; color: var(--success);">\u2713 Correct!</p>') +
                    rationaleHTML +
                '</div>';
        }

        feedbackHTML += '</div>'; // close .results-content

        results.innerHTML = feedbackHTML;

        // Transition to results view
        QuizCraft.views.transitionTo('results');

        // Animate score circle after render
        var targetOffset = circumference - (percentage / 100) * circumference;
        setTimeout(function() {
            var circle = document.getElementById('scoreCircle');
            if (circle) {
                circle.setAttribute('stroke-dashoffset', targetOffset);
            }
        }, 100);

        // Update stats
        state.totalQuizzesTaken++;
        utils.safeSetItem('totalQuizzes', state.totalQuizzesTaken);
        var totalEl = document.getElementById('totalQuizzes');
        if (totalEl) totalEl.textContent = state.totalQuizzesTaken;

        if (percentage >= 80) {
            QuizCraft.effects.celebrate();
        }

        // Persist to Supabase (fire-and-forget)
        try {
            var quizTitle = state.quizData.length > 0 ? state.quizData[0].question.substring(0, 50) : 'Quiz';
            QuizCraft.db.saveQuiz(quizTitle, total).then(function(quizId) {
                if (quizId) {
                    QuizCraft.db.saveResult(quizId, correct, total, percentage, grade, elapsed).then(function() {
                        if (QuizCraft.history) {
                            QuizCraft.history.renderHistory();
                        }
                    });
                }
            });
        } catch (e) {
            console.error('[QuizCraft] Failed to persist results:', e);
        }
    }

    return {
        init: init
    };
})();
