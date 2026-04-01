/* ============================================
   QuizCraft — Question Parser
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.parser = (function() {
    'use strict';

    var MAX_QUESTIONS = 500;

    function parseQuestions(content) {
        var state = QuizCraft.state;
        state.quizData = [];

        var lines = content.split('\n').map(function(line) { return line.trim(); }).filter(function(line) { return line; });
        var currentQuestion = null;
        var collectingOptions = false;
        var collectingRationale = false;

        for (var i = 0; i < lines.length; i++) {
            if (state.quizData.length >= MAX_QUESTIONS) {
                console.warn('[QuizCraft] Question limit reached (' + MAX_QUESTIONS + '). Remaining questions ignored.');
                break;
            }

            var line = lines[i];

            if (/^\d+[\.\)]\s*.+/.test(line)) {
                if (currentQuestion && currentQuestion.answer !== '') {
                    state.quizData.push(currentQuestion);
                }
                currentQuestion = {
                    question: line.replace(/^\d+[\.\)]\s*/, ''),
                    type: 'multiple-choice',
                    options: [],
                    answer: '',
                    rawAnswer: '',
                    rationale: ''
                };
                collectingOptions = true;
                collectingRationale = false;
            }
            else if (/^[a-e][\.\)]\s*.+/i.test(line) && currentQuestion && collectingOptions) {
                currentQuestion.options.push(line);
            }
            else if (line.toLowerCase().startsWith('answer:')) {
                var answer = line.substring(7).trim();
                if (currentQuestion) {
                    currentQuestion.rawAnswer = answer;

                    if (answer.toLowerCase().includes('(select all)')) {
                        currentQuestion.type = 'select-all';
                        var cleanAnswer = answer.replace(/\(select all\)/i, '').trim();
                        currentQuestion.answer = cleanAnswer.split(',').map(function(a) {
                            return a.trim().charAt(0).toLowerCase();
                        }).sort().join(',');
                    } else if (currentQuestion.options.length === 0) {
                        if (answer.toLowerCase() === 'true' || answer.toLowerCase() === 'false') {
                            currentQuestion.type = 'true-false';
                            currentQuestion.answer = answer.toLowerCase();
                        } else {
                            currentQuestion.type = 'short-answer';
                            currentQuestion.answer = answer;
                        }
                    } else if (answer.includes(',') && currentQuestion.options.length > 0) {
                        currentQuestion.type = 'select-all';
                        currentQuestion.answer = answer.split(',').map(function(a) {
                            return a.trim().charAt(0).toLowerCase();
                        }).sort().join(',');
                    } else {
                        currentQuestion.type = 'multiple-choice';
                        currentQuestion.answer = answer.trim().charAt(0).toLowerCase();
                    }
                }
                collectingOptions = false;
            }
            else if (line.toLowerCase().startsWith('rationale:') && currentQuestion) {
                currentQuestion.rationale = line.substring(10).trim();
                collectingRationale = true;
            }
            else if (collectingRationale && currentQuestion) {
                currentQuestion.rationale += ' ' + line;
            }
        }

        if (currentQuestion && currentQuestion.answer !== '' && state.quizData.length < MAX_QUESTIONS) {
            state.quizData.push(currentQuestion);
        }
    }

    return {
        parseQuestions: parseQuestions
    };
})();
