(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const statusEl = document.getElementById("status");
    const attemptsEl = document.getElementById("attempts");
    const refreshBtn = document.getElementById("refresh-btn");

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

    function formatDate(iso) {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return "";
        return date.toLocaleString();
    }

    function renderAttempts(attempts) {
        attemptsEl.innerHTML = "";

        if (!attempts.length) {
            statusEl.textContent = "No short-answer attempts yet.";
            return;
        }

        statusEl.textContent = "Showing " + attempts.length + " attempts.";

        attempts.forEach(function (attempt, index) {
            const card = document.createElement("article");
            card.className = "attempt-card";

            const header = document.createElement("div");
            header.className = "attempt-header";

            const title = document.createElement("div");
            title.className = "attempt-title";
            title.textContent = "Attempt " + (index + 1);

            const meta = document.createElement("div");
            meta.className = "attempt-meta";
            meta.textContent =
                "Score: " + attempt.score + " / " + attempt.total +
                (attempt.createdAt ? " • " + formatDate(attempt.createdAt) : "");

            header.appendChild(title);
            header.appendChild(meta);

            const list = document.createElement("ul");
            list.className = "answer-list";

            (attempt.answers || []).forEach(function (answer) {
                const item = document.createElement("li");
                item.className = "answer-item";

                const q = document.createElement("p");
                q.className = "answer-question";
                q.textContent = answer.question;

                const userRow = document.createElement("p");
                userRow.className = "answer-row";
                userRow.innerHTML = "<strong>Your answer:</strong> " + (answer.userAnswer || "");

                const correctRow = document.createElement("p");
                correctRow.className = "answer-row";
                correctRow.innerHTML = "<strong>Correct answer:</strong> " + (answer.correctAnswer || "");

                const resultRow = document.createElement("p");
                resultRow.className = answer.isCorrect ? "answer-correct" : "answer-incorrect";
                resultRow.textContent = answer.isCorrect ? "Correct" : "Incorrect";

                item.appendChild(q);
                item.appendChild(userRow);
                item.appendChild(correctRow);
                item.appendChild(resultRow);

                list.appendChild(item);
            });

            card.appendChild(header);
            card.appendChild(list);
            attemptsEl.appendChild(card);
        });
    }

    async function loadAttempts() {
        const email = getCurrentUserEmail();
        if (!email) {
            statusEl.textContent = "Please login first.";
            return;
        }

        statusEl.textContent = "Loading attempts...";
        try {
            const response = await fetch("/api/short-answer/attempts?email=" + encodeURIComponent(email));
            if (!response.ok) {
                statusEl.textContent = await readErrorMessage(response, "Unable to load attempts.");
                renderAttempts([]);
                return;
            }
            const data = await response.json();
            const attempts = Array.isArray(data.attempts) ? data.attempts : [];
            renderAttempts(attempts);
        } catch (err) {
            console.error(err);
            statusEl.textContent = "Cannot reach backend. Run node server.js.";
        }
    }

    refreshBtn.addEventListener("click", function () {
        loadAttempts();
    });

    loadAttempts();
})();
