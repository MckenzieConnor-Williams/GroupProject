(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const QUESTION_BANK_KEY = "syntaxstudy_question_bank";
    const QUIZ_SESSION_KEY = "syntaxstudy_quiz_session";

    const progressEl = document.getElementById("progress");
    const scoreEl = document.getElementById("score");
    const questionEl = document.getElementById("question-text");
    const answerInput = document.getElementById("answer-input");
    const messageEl = document.getElementById("message");
    const submitBtn = document.getElementById("submit-btn");
    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");

    let questions = [];
    let currentIndex = 0;
    let score = 0;
    let submitted = false;

    function normalizeAnswer(value) {
        return String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]|_/g, "")
            .replace(/\s+/g, " ");
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

    function getCurrentUserEmail() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            const user = JSON.parse(raw || "{}");
            return (user.email || "").toLowerCase().trim();
        } catch (err) {
            return "";
        }
    }

    function getUserQuestions() {
        const email = getCurrentUserEmail();
        if (!email) return [];
        try {
            const raw = localStorage.getItem(QUESTION_BANK_KEY);
            const bank = JSON.parse(raw || "{}");
            const userQuestions = bank[email];
            return Array.isArray(userQuestions) ? userQuestions : [];
        } catch (err) {
            return [];
        }
    }

    function getSessionQuestionsForUser() {
        const email = getCurrentUserEmail();
        if (!email) return [];
        try {
            const raw = localStorage.getItem(QUIZ_SESSION_KEY);
            const parsed = JSON.parse(raw || "{}");
            if (!parsed || parsed.email !== email) return [];
            return Array.isArray(parsed.questions) ? parsed.questions : [];
        } catch (err) {
            return [];
        }
    }

    function render() {
        if (questions.length === 0) {
            progressEl.textContent = "Question 0 of 0";
            scoreEl.textContent = "Score: 0";
            questionEl.textContent = "No questions in your bank yet. Add some first.";
            answerInput.disabled = true;
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        if (currentIndex >= questions.length) {
            progressEl.textContent = "Completed";
            scoreEl.textContent = "Final Score: " + score + " / " + questions.length;
            questionEl.textContent = "Quiz finished.";
            messageEl.textContent = "Great work. Go add more questions or retake for new random order.";
            answerInput.value = "";
            answerInput.disabled = true;
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const item = questions[currentIndex];
        progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
        scoreEl.textContent = "Score: " + score;
        questionEl.textContent = item.question;
        answerInput.value = "";
        answerInput.disabled = false;
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        messageEl.textContent = "";
        submitted = false;
        answerInput.focus();
    }

    submitBtn.addEventListener("click", function () {
        if (submitted || currentIndex >= questions.length) return;
        const userAnswer = normalizeAnswer(answerInput.value);
        const correctAnswer = normalizeAnswer(questions[currentIndex].answer);
        if (!userAnswer) {
            messageEl.textContent = "Please enter an answer before submitting.";
            return;
        }
        submitted = true;

        if (userAnswer === correctAnswer) {
            score += 1;
            messageEl.textContent = "Correct!";
        } else {
            messageEl.textContent = 'Incorrect. Correct answer: "' + questions[currentIndex].answer + '"';
        }

        scoreEl.textContent = "Score: " + score;
        answerInput.disabled = true;
        submitBtn.disabled = true;
        nextBtn.disabled = false;
        nextBtn.focus();
    });

    nextBtn.addEventListener("click", function () {
        if (!submitted) return;
        currentIndex += 1;
        render();
    });

    backBtn.addEventListener("click", function () {
        window.location.href = "question_page";
    });

    answerInput.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        if (!submitted) {
            submitBtn.click();
            return;
        }
        if (!nextBtn.disabled) {
            nextBtn.click();
        }
    });

    const email = getCurrentUserEmail();
    if (!email) {
        window.location.href = "login.html";
        return;
    }

    questions = getSessionQuestionsForUser();
    if (questions.length === 0) {
        questions = shuffle(getUserQuestions());
    }
    render();
})();
