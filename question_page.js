(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const QUESTION_BANK_KEY = "syntaxstudy_question_bank";
    const QUIZ_SESSION_KEY = "syntaxstudy_quiz_session";

    const form = document.getElementById("question-form");
    const questionInput = document.getElementById("question-input");
    const answerInput = document.getElementById("answer-input");
    const questionsTitle = document.getElementById("questions-title");
    const emptyState = document.getElementById("questions-empty");
    const list = document.getElementById("questions-list");
    const takeQuizBtn = document.getElementById("take-quiz-btn");

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

    function getBankMap() {
        try {
            const raw = localStorage.getItem(QUESTION_BANK_KEY);
            const parsed = JSON.parse(raw || "{}");
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (err) {
            return {};
        }
    }

    function setBankMap(nextMap) {
        localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(nextMap));
    }

    function getUserQuestions() {
        const email = getCurrentUserEmail();
        if (!email) return [];
        const bank = getBankMap();
        const questions = bank[email];
        return Array.isArray(questions) ? questions : [];
    }

    function saveUserQuestions(questions) {
        const email = getCurrentUserEmail();
        if (!email) return;
        const bank = getBankMap();
        bank[email] = questions;
        setBankMap(bank);
    }

    function renderQuestions() {
        const questions = getUserQuestions();
        questionsTitle.textContent = "Your Questions (" + questions.length + ")";
        list.innerHTML = "";

        if (questions.length === 0) {
            emptyState.hidden = false;
            list.hidden = true;
            return;
        }

        emptyState.hidden = true;
        list.hidden = false;

        questions.forEach(function (item, idx) {
            const card = document.createElement("article");
            card.className = "question-item";
            card.innerHTML =
                "<h3>Q" + (idx + 1) + ": " + item.question + "</h3>" +
                "<p><strong>Answer:</strong> " + item.answer + "</p>";
            list.appendChild(card);
        });
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();
        if (!question || !answer) return;

        const questions = getUserQuestions();
        questions.push({ question: question, answer: answer });
        saveUserQuestions(questions);
        renderQuestions();
        form.reset();
        questionInput.focus();
    });

    takeQuizBtn.addEventListener("click", function () {
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const randomQuestions = shuffle(getUserQuestions());
        localStorage.setItem(
            QUIZ_SESSION_KEY,
            JSON.stringify({
                email: email,
                questions: randomQuestions,
                createdAt: Date.now()
            })
        );
        window.location.href = "question_answer";
    });

    renderQuestions();
})();
