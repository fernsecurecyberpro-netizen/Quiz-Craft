/* ============================================
   QuizCraft — Centralized State
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.state = {
    quizData: [],
    userAnswers: {},
    startTime: null,
    timerInterval: null,
    totalQuizzesTaken: 0,
    currentView: 'landing',
    fileName: ''
};

// Load persisted quiz count
try {
    QuizCraft.state.totalQuizzesTaken = parseInt(localStorage.getItem('totalQuizzes') || '0', 10);
} catch (e) {
    // localStorage unavailable
}
