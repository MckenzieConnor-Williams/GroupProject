(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";

    const progressEl = document.getElementById("progress");
    const scoreEl = document.getElementById("score");
    const questionEl = document.getElementById("question-text");
    const answerInput = document.getElementById("answer-input");
    const submitBtn = document.getElementById("submit-btn");
    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");
    const messageEl = document.getElementById("message");

    let questions = [];
    let currentIndex = 0;
    let score = 0;
    let submitted = false;
    let attemptSaved = false;
    const answers = [];

    function normalizeAnswer(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
    }

    function isMultipleChoice(item) {
        return (
            item &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            Number.isInteger(item.correctIndex) &&
            item.correctIndex >= 0 &&
            item.correctIndex < 4
        );
    }

    function getCurrentUserEmail() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            const user = JSON.parse(raw || "{}");
            return (user.email || "").toLowerCase().trim();
        } catch (err) {
            return "";
        }
    }

    async function readErrorMessage(response, fallback) {
        const text = await response.text();
        try {
            const parsed = JSON.parse(text);
            return parsed.message || fallback;
        } catch (err) {
            return text || fallback;
        }
    }

    async function loadFlashcards() {
        const email = getCurrentUserEmail();
        if (!email) return [];

        const response = await fetch("/api/flashcards?email=" + encodeURIComponent(email));
        if (!response.ok) {
            throw new Error(await readErrorMessage(response, "Failed to load flashcards"));
        }

        const data = await response.json();
        return Array.isArray(data.flashcards) ? data.flashcards : [];
    }

    function shuffle(array) {
        const arr = array.slice();
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    }

    async function saveAttempt() {
        if (attemptSaved || answers.length === 0) return;
        attemptSaved = true;

        const email = getCurrentUserEmail();
        if (!email) return;

        try {
            const response = await fetch("/api/free-answer/attempts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: email,
                    score: score,
                    total: questions.length,
                    answers: answers
                })
            });
            if (!response.ok) {
                const errorMessage = await readErrorMessage(response, "Failed to save attempt");
                console.error(errorMessage);
            }
        } catch (err) {
            console.error(err);
        }
    }

    function updateUI() {
        if (questions.length === 0) {
            questionEl.textContent = "No free-answer flashcards yet. Create some first.";
            progressEl.textContent = "Question 0 of 0";
            scoreEl.textContent = "Score: 0";
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            answerInput.disabled = true;
            return;
        }

        if (currentIndex >= questions.length) {
            const percent = Math.round((score / questions.length) * 100);
            questionEl.textContent = "Quiz Complete!";
            messageEl.textContent =
                "Final Score: " + score + " / " + questions.length + " (" + percent + "%)";
            progressEl.textContent = "Question " + questions.length + " of " + questions.length;
            scoreEl.textContent = "Score: " + score;
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            answerInput.disabled = true;
            saveAttempt();
            return;
        }

        const item = questions[currentIndex];
        questionEl.textContent = item.question;
        progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
        scoreEl.textContent = "Score: " + score;
        messageEl.textContent = "";
        messageEl.className = "message";
        answerInput.value = "";
        answerInput.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        submitted = false;
        answerInput.focus();
    }

    submitBtn.addEventListener("click", function () {
        if (submitted || currentIndex >= questions.length) return;
        const item = questions[currentIndex];
        const userAnswerRaw = answerInput.value;
        const userAnswer = normalizeAnswer(userAnswerRaw);
        const correctAnswer = normalizeAnswer(item.answer);

        if (!userAnswer) {
            messageEl.textContent = "Please enter an answer.";
            messageEl.className = "message";
            return;
        }

        const isCorrect = userAnswer === correctAnswer;

        answers.push({
            flashcardId: item.id,
            question: item.question,
            correctAnswer: item.answer,
            userAnswer: userAnswerRaw.trim(),
            isCorrect: isCorrect
        });

        submitted = true;
        answerInput.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;

        if (isCorrect) {
            score += 1;
            messageEl.textContent = "Correct!";
            messageEl.className = "message correct";
        } else {
            messageEl.textContent = "Incorrect. Correct answer: " + item.answer;
            messageEl.className = "message incorrect";
        }
        scoreEl.textContent = "Score: " + score;
    });

    nextBtn.addEventListener("click", function () {
        if (currentIndex >= questions.length) return;
        currentIndex += 1;
        updateUI();
    });

    backBtn.addEventListener("click", function () {
        window.location.href = "index.html";
    });

    (async function init() {
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        try {
            const all = await loadFlashcards();
            questions = shuffle(all.filter(function (item) {
                return !isMultipleChoice(item);
            }));
            updateUI();
        } catch (err) {
            console.error(err);
            messageEl.textContent = "Unable to load your flashcards.";
        }
    })();
})();
