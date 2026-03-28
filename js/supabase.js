/* ============================================
   QuizCraft — Supabase REST Client
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.db = (function() {
    'use strict';

    var SUPABASE_URL = 'https://jvkmibulcbbmukojsxjm.supabase.co';
    var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2a21pYnVsY2JibXVrb2pzeGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjkzNDgsImV4cCI6MjA5MDMwNTM0OH0.CG4PdnnvC_VQhsJN2eFf0R1_Ey1t4fhxjqO4OFdcPfE';

    function headers() {
        return {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    }

    /**
     * Save a quiz record and return its ID.
     */
    function saveQuiz(title, questionCount) {
        return fetch(SUPABASE_URL + '/rest/v1/quizzes', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                title: title,
                question_count: questionCount,
                user_id: QuizCraft.utils.getUserId()
            })
        })
        .then(function(res) {
            if (!res.ok) throw new Error('Failed to save quiz: ' + res.status);
            return res.json();
        })
        .then(function(data) {
            return data[0] && data[0].id;
        })
        .catch(function(err) {
            console.error('[QuizCraft] DB saveQuiz error:', err);
            return null;
        });
    }

    /**
     * Save a quiz result.
     */
    function saveResult(quizId, score, total, percentage, grade, timeSeconds) {
        if (!quizId) return Promise.resolve(null);

        return fetch(SUPABASE_URL + '/rest/v1/quiz_results', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                quiz_id: quizId,
                score: score,
                total: total,
                percentage: percentage,
                grade: grade,
                time_seconds: timeSeconds,
                user_id: QuizCraft.utils.getUserId()
            })
        })
        .then(function(res) {
            if (!res.ok) throw new Error('Failed to save result: ' + res.status);
            return res.json();
        })
        .then(function(data) {
            return data[0];
        })
        .catch(function(err) {
            console.error('[QuizCraft] DB saveResult error:', err);
            return null;
        });
    }

    /**
     * Get quiz history (results joined with quiz titles).
     */
    function getHistory(limit) {
        limit = limit || 10;

        var userId = QuizCraft.utils.getUserId();
        return fetch(SUPABASE_URL + '/rest/v1/quiz_results?select=id,score,total,percentage,grade,time_seconds,completed_at,quizzes(title,question_count)&user_id=eq.' + encodeURIComponent(userId) + '&order=completed_at.desc&limit=' + limit, {
            method: 'GET',
            headers: headers()
        })
        .then(function(res) {
            if (!res.ok) throw new Error('Failed to fetch history: ' + res.status);
            return res.json();
        })
        .catch(function(err) {
            console.error('[QuizCraft] DB getHistory error:', err);
            return [];
        });
    }

    return {
        saveQuiz: saveQuiz,
        saveResult: saveResult,
        getHistory: getHistory
    };
})();
