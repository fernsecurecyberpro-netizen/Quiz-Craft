/* ============================================
   QuizCraft — Quiz History Panel
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.history = (function() {
    'use strict';

    var utils = QuizCraft.utils;

    function formatDate(isoString) {
        var d = new Date(isoString);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return m + 'm ' + s + 's';
    }

    function renderHistory() {
        var container = document.getElementById('historyArea');
        if (!container) return;

        container.innerHTML = '<div class="loading-spinner" style="margin: 20px auto;"></div>';

        QuizCraft.db.getHistory(10).then(function(results) {
            if (!results || results.length === 0) {
                container.innerHTML =
                    '<div class="empty-state" style="padding: 32px;">' +
                        '<div class="empty-state-icon" style="font-size: 48px;">📊</div>' +
                        '<h3 style="font-size: 18px;">No History Yet</h3>' +
                        '<p>Complete a quiz to see your results here.</p>' +
                    '</div>';
                return;
            }

            var html = '<div class="history-table-wrapper"><table class="history-table" role="table">';
            html += '<thead><tr>' +
                '<th scope="col">Quiz</th>' +
                '<th scope="col">Score</th>' +
                '<th scope="col">Grade</th>' +
                '<th scope="col">Time</th>' +
                '<th scope="col">Date</th>' +
            '</tr></thead><tbody>';

            for (var i = 0; i < results.length; i++) {
                var r = results[i];
                var title = (r.quizzes && r.quizzes.title) ? r.quizzes.title : 'Quiz';
                var gradeClass = r.grade || 'F';

                html += '<tr>' +
                    '<td>' + utils.escapeHTML(title) + '</td>' +
                    '<td>' + r.score + '/' + r.total + ' (' + r.percentage + '%)</td>' +
                    '<td><span class="history-grade grade-' + gradeClass + '">' + utils.escapeHTML(r.grade) + '</span></td>' +
                    '<td>' + formatTime(r.time_seconds) + '</td>' +
                    '<td>' + formatDate(r.completed_at) + '</td>' +
                '</tr>';
            }

            html += '</tbody></table></div>';
            container.innerHTML = html;
        });
    }

    return {
        renderHistory: renderHistory
    };
})();
