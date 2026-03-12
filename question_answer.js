(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const QUIZ_SESSION_KEY = "syntaxstudy_quiz_session";

    const progressEl = document.getElementById("progress");
    const scoreEl = document.getElementById("score");
    const questionEl = document.getElementById("question-text");
    const optionsEl = document.getElementById("options");
    const messageEl = document.getElementById("message");
    const submitBtn = document.getElementById("submit-btn");
    const nextBtn = document.getElementById("next-btn");
    const backBtn = document.getElementById("back-btn");

    let questions = [];
    let currentIndex = 0;
    let score = 0;
    let submitted = false;

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

    function isValidMultipleChoice(item) {
        return (
            item &&
            Array.isArray(item.options) &&
            item.options.length === 4 &&
            Number.isInteger(item.correctIndex) &&
            item.correctIndex >= 0 &&
            item.correctIndex < 4
        );
    }

    function clearOptions() {
        optionsEl.innerHTML = "";
    }

    function renderOptions(item) {
        clearOptions();
        const labels = ["A", "B", "C", "D"];
        item.options.forEach(function (option, index) {
            const label = document.createElement("label");
            label.className = "option-item";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "answer-option";
            input.value = String(index);

            const badge = document.createElement("span");
            badge.className = "option-label";
            badge.textContent = labels[index] + ".";

            const text = document.createElement("span");
            text.className = "option-text";
            text.textContent = option;

            input.addEventListener("change", function () {
                const allOptions = optionsEl.querySelectorAll(".option-item");
                allOptions.forEach(function (node) {
                    node.classList.remove("selected");
                });
                label.classList.add("selected");
            });

            label.appendChild(input);
            label.appendChild(badge);
            label.appendChild(text);
            optionsEl.appendChild(label);
        });
    }

    function getSelectedIndex() {
        const selected = optionsEl.querySelector("input[name='answer-option']:checked");
        if (!selected) return null;
        const parsed = Number(selected.value);
        return Number.isInteger(parsed) ? parsed : null;
    }

    function setOptionsDisabled(disabled) {
        const inputs = optionsEl.querySelectorAll("input[name='answer-option']");
        inputs.forEach(function (input) {
            input.disabled = disabled;
        });
    }

    function render() {
        if (questions.length === 0) {
            progressEl.textContent = "Question 0 of 0";
            scoreEl.textContent = "Score: 0";
            questionEl.textContent = "No multiple-choice questions yet. Add some first.";
            clearOptions();
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        if (currentIndex >= questions.length) {
            progressEl.textContent = "Completed";
            const percent = Math.round((score / questions.length) * 100);
            scoreEl.textContent =
                "Final Score: " + score + " / " + questions.length + " (" + percent + "%)";
            questionEl.textContent = "Quiz finished.";
            messageEl.textContent = "Your accuracy was " + percent + "%. Go add more questions or retake for new random order.";
            clearOptions();
            submitBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        const item = questions[currentIndex];
        progressEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
        scoreEl.textContent = "Score: " + score;
        questionEl.textContent = item.question;
        renderOptions(item);
        submitBtn.disabled = false;
        nextBtn.disabled = true;
        messageEl.textContent = "";
        submitted = false;
    }

    submitBtn.addEventListener("click", function () {
        if (submitted || currentIndex >= questions.length) return;
        const selectedIndex = getSelectedIndex();
        if (selectedIndex === null) {
            messageEl.textContent = "Please choose an answer before submitting.";
            return;
        }
        submitted = true;

        if (selectedIndex === questions[currentIndex].correctIndex) {
            score += 1;
            messageEl.textContent = "Correct!";
        } else {
            const correctAnswer = questions[currentIndex].options[questions[currentIndex].correctIndex];
            messageEl.textContent = 'Incorrect. Correct answer: "' + correctAnswer + '"';
        }

        scoreEl.textContent = "Score: " + score;
        setOptionsDisabled(true);
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

    (async function init() {
        const email = getCurrentUserEmail();
        if (!email) {
            window.location.href = "login.html";
            return;
        }

        questions = getSessionQuestionsForUser().filter(isValidMultipleChoice);
        if (questions.length === 0) {
            try {
                questions = shuffle((await loadFlashcards()).filter(isValidMultipleChoice));
            } catch (err) {
                console.error(err);
                messageEl.textContent = "Unable to load your questions from database.";
                questions = [];
            }
        }
        render();
    })();
})();
