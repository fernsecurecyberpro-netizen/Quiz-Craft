/* ============================================
   QuizCraft — File Upload Handling
   ============================================ */

window.QuizCraft = window.QuizCraft || {};

QuizCraft.upload = (function() {
    'use strict';

    var utils = QuizCraft.utils;
    var state = QuizCraft.state;
    var parser = QuizCraft.parser;

    var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    var FILE_READ_TIMEOUT = 10000; // 10 seconds

    function init() {
        var uploadArea = document.getElementById('uploadArea');
        var fileInput = document.getElementById('fileInput');
        var generateBtn = document.getElementById('generateBtn');
        var uploadNewBtn = document.getElementById('uploadNewBtn');

        if (!uploadArea || !fileInput) {
            console.error('[QuizCraft] Upload: required DOM elements not found');
            return;
        }

        uploadArea.addEventListener('click', function(e) {
            e.stopPropagation();
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                rateLimitedHandleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', function(e) {
            e.stopPropagation();
            if (e.target.files.length > 0) {
                rateLimitedHandleFile(e.target.files[0]);
            }
        });

        // Launch Quiz button
        if (generateBtn) {
            generateBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (state.quizData.length === 0) {
                    alert('No questions found!');
                    return;
                }
                QuizCraft.views.transitionTo('quiz');
                QuizCraft.quiz.displayQuiz();
                QuizCraft.timer.startTimer();
            });
        }

        // Upload New File button
        if (uploadNewBtn) {
            uploadNewBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                restoreUploadState();
            });
        }
    }

    // Rate-limit file handling to 1 per second
    var rateLimitedHandleFile = utils.rateLimit(handleFile, 1000);

    function handleFile(file) {
        var uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        // File size validation
        if (file.size > MAX_FILE_SIZE) {
            displayUploadError('File too large. Maximum size is 5MB.');
            return;
        }

        var fileName = file.name.toLowerCase();
        state.fileName = file.name;

        // Show loading state
        uploadArea.innerHTML = '<div class="loading-spinner"></div><h3 style="margin-top: 20px;">Processing...</h3>';

        if (fileName.endsWith('.txt')) {
            handleTextFile(file);
        } else if (fileName.endsWith('.docx')) {
            handleWordFile(file);
        } else if (fileName.endsWith('.pdf')) {
            handlePdfFile(file);
        } else if (fileName.endsWith('.doc')) {
            displayUploadError('Old .doc format not supported. Please save as .docx');
        } else {
            displayUploadError('Unsupported file type. Please use TXT, DOCX, or PDF');
        }
    }

    function handleTextFile(file) {
        var reader = new FileReader();
        var timeout = setTimeout(function() {
            reader.abort();
            displayUploadError('File read timed out. Please try again.');
        }, FILE_READ_TIMEOUT);

        reader.onload = function(e) {
            clearTimeout(timeout);
            try {
                parser.parseQuestions(e.target.result);
                showReadyState(file.name);
            } catch (err) {
                console.error('[QuizCraft] Parse error:', err);
                displayUploadError('Failed to parse questions from file.');
            }
        };
        reader.onerror = function() {
            clearTimeout(timeout);
            displayUploadError('Failed to read file.');
        };
        reader.readAsText(file);
    }

    function handleWordFile(file) {
        if (typeof mammoth === 'undefined') {
            displayUploadError('Word support not available. Library failed to load.');
            return;
        }

        var reader = new FileReader();
        var timeout = setTimeout(function() {
            reader.abort();
            displayUploadError('File read timed out. Please try again.');
        }, FILE_READ_TIMEOUT);

        reader.onload = function(e) {
            clearTimeout(timeout);
            mammoth.extractRawText({ arrayBuffer: e.target.result })
                .then(function(result) {
                    try {
                        parser.parseQuestions(result.value);
                        showReadyState(file.name);
                    } catch (err) {
                        console.error('[QuizCraft] Parse error:', err);
                        displayUploadError('Failed to parse questions from document.');
                    }
                })
                .catch(function() {
                    displayUploadError('Error reading Word document.');
                });
        };
        reader.onerror = function() {
            clearTimeout(timeout);
            displayUploadError('Failed to read file.');
        };
        reader.readAsArrayBuffer(file);
    }

    function handlePdfFile(file) {
        if (typeof pdfjsLib === 'undefined') {
            displayUploadError('PDF support not available. Library failed to load.');
            return;
        }

        // Configure worker if not already set
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        var reader = new FileReader();
        var timeout = setTimeout(function() {
            reader.abort();
            displayUploadError('File read timed out. Please try again.');
        }, FILE_READ_TIMEOUT);

        reader.onload = function(e) {
            clearTimeout(timeout);
            var typedArray = new Uint8Array(e.target.result);

            pdfjsLib.getDocument({ data: typedArray }).promise
                .then(function(pdf) {
                    var totalPages = pdf.numPages;
                    var textPromises = [];

                    for (var p = 1; p <= totalPages; p++) {
                        textPromises.push(
                            pdf.getPage(p).then(function(page) {
                                return page.getTextContent();
                            }).then(function(content) {
                                return content.items.map(function(item) {
                                    return item.str;
                                }).join(' ');
                            })
                        );
                    }

                    return Promise.all(textPromises);
                })
                .then(function(pages) {
                    var fullText = pages.join('\n');
                    try {
                        parser.parseQuestions(fullText);
                        showReadyState(file.name);
                    } catch (err) {
                        console.error('[QuizCraft] PDF parse error:', err);
                        displayUploadError('Failed to parse questions from PDF.');
                    }
                })
                .catch(function(err) {
                    console.error('[QuizCraft] PDF read error:', err);
                    displayUploadError('Error reading PDF file.');
                });
        };
        reader.onerror = function() {
            clearTimeout(timeout);
            displayUploadError('Failed to read file.');
        };
        reader.readAsArrayBuffer(file);
    }

    function showReadyState(fileName) {
        var uploadCard = document.querySelector('.upload-card');
        var readyCard = document.getElementById('readyCard');
        var readyTitle = document.getElementById('readyTitle');
        var readySubtitle = document.getElementById('readySubtitle');

        if (!readyCard) return;

        var safeName = utils.escapeHTML(utils.sanitizeFilename(fileName));

        if (state.quizData.length > 0) {
            if (uploadCard) uploadCard.style.display = 'none';
            readyCard.style.display = 'block';
            if (readyTitle) readyTitle.textContent = safeName;
            if (readySubtitle) {
                readySubtitle.textContent = state.quizData.length + ' question' + (state.quizData.length !== 1 ? 's' : '') + ' found';
            }
        } else {
            // No questions found — show error
            displayUploadError('No questions found. Check the format and try again.');
        }
    }

    function displayUploadError(message) {
        var uploadArea = document.getElementById('uploadArea');
        if (!uploadArea) return;

        uploadArea.innerHTML =
            '<div class="upload-icon">\u274c</div>' +
            '<h3>Error</h3>' +
            '<p style="color: var(--error); margin-top: 12px;">' + utils.escapeHTML(message || 'Failed to read file') + '</p>' +
            '<p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">Please try a different file</p>' +
            '<button class="btn btn-secondary" style="margin-top: 16px; font-size: 14px; padding: 10px 20px;" onclick="restoreUploadArea()">' +
                '<span class="btn-icon">\ud83d\udce4</span>' +
                '<span>Try Again</span>' +
            '</button>';
    }

    function restoreUploadState() {
        var uploadCard = document.querySelector('.upload-card');
        var readyCard = document.getElementById('readyCard');
        var fileInput = document.getElementById('fileInput');

        // Show upload card, hide ready card
        if (uploadCard) uploadCard.style.display = 'block';
        if (readyCard) readyCard.style.display = 'none';

        // Reset state
        state.quizData = [];
        state.fileName = '';

        // Reset file input
        if (fileInput) fileInput.value = '';

        // Restore upload area content
        restoreUploadArea();
    }

    function restoreUploadArea() {
        var uploadArea = document.getElementById('uploadArea');
        var fileInput = document.getElementById('fileInput');
        if (!uploadArea) return;

        uploadArea.innerHTML =
            '<div class="upload-icon">\ud83d\udcc4</div>' +
            '<h3>Drag & Drop Your File</h3>' +
            '<p>or click to browse</p>' +
            '<div class="file-types">' +
                '<span class="file-type-badge">TXT</span>' +
                '<span class="file-type-badge">DOCX</span>' +
                '<span class="file-type-badge">PDF</span>' +
            '</div>';

        state.quizData = [];

        // Re-attach click handler to trigger file input
        if (fileInput) {
            uploadArea.addEventListener('click', function(e) {
                e.stopPropagation();
                fileInput.click();
            });
        }
    }

    return {
        init: init,
        restoreUploadArea: restoreUploadArea,
        restoreUploadState: restoreUploadState
    };
})();
