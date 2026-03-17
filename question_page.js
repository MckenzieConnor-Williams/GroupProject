(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";

    const form = document.getElementById("question-form");
    const questionInput = document.getElementById("question-input");
    const answerInput = document.getElementById("answer-input");
    const questionsTitle = document.getElementById("questions-title");
    const emptyState = document.getElementById("questions-empty");
    const list = document.getElementById("questions-list");
    const viewFlashcardsBtn = document.getElementById("view-flashcards-btn");
    let flashcards = [];

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

    function renderQuestions() {
        questionsTitle.textContent = "Your Flashcards (" + flashcards.length + ")";
        list.innerHTML = "";

        if (flashcards.length === 0) {
            emptyState.hidden = false;
            list.hidden = true;
            return;
        }

        emptyState.hidden = true;
        list.hidden = false;

        flashcards.forEach(function (item, idx) {
            const card = document.createElement("article");
            card.className = "question-item";
            card.innerHTML =
                "<h3>Q" + (idx + 1) + ": " + item.question + "</h3>" +
                "<p><strong>Answer:</strong> " + item.answer + "</p>" +
                "<div class='question-item-actions'>" +
                "<button type='button' class='question-action-btn edit-btn' data-id='" + item.id + "'>Edit</button>" +
                "<button type='button' class='question-action-btn delete-btn' data-id='" + item.id + "'>Delete</button>" +
                "</div>";
            list.appendChild(card);
        });
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (!question || !answer) {
            alert("Please enter both a question and an answer.");
            return;
        }

        try {
            const response = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: email,
                    question: question,
                    answer: answer
                })
            });

            if (!response.ok) {
                alert(await readErrorMessage(response, "Failed to save flashcard"));
                return;
            }

            const data = await response.json();
            if (data.flashcard && !isMultipleChoice(data.flashcard)) {
                flashcards.unshift(data.flashcard);
            } else {
                flashcards = (await loadFlashcards()).filter(function (item) {
                    return !isMultipleChoice(item);
                });
            }

            renderQuestions();
            form.reset();
            questionInput.focus();
        } catch (err) {
            console.error(err);
            alert("Cannot reach backend. Run `node server.js` on http://localhost:3000");
        }
    });

    viewFlashcardsBtn?.addEventListener("click", function () {
        window.location.href = "flashcards";
    });

    list.addEventListener("click", async function (event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const id = target.getAttribute("data-id");
        if (!id) return;

        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        if (target.classList.contains("delete-btn")) {
            if (!confirm("Delete this flashcard?")) return;
            try {
                const response = await fetch(
                    "/api/flashcards/" + encodeURIComponent(id) + "?userEmail=" + encodeURIComponent(email),
                    { method: "DELETE" }
                );
                if (!response.ok) {
                    alert(await readErrorMessage(response, "Failed to delete flashcard"));
                    return;
                }
                flashcards = flashcards.filter(function (item) {
                    return item.id !== id;
                });
                renderQuestions();
            } catch (err) {
                console.error(err);
                alert("Cannot reach backend. Run `node server.js` on http://localhost:3000");
            }
            return;
        }

        if (target.classList.contains("edit-btn")) {
            const existing = flashcards.find(function (item) {
                return item.id === id;
            });
            if (!existing) return;

            const nextQuestion = prompt("Edit question:", existing.question);
            if (nextQuestion === null) return;
            const nextAnswer = prompt("Edit answer:", existing.answer);
            if (nextAnswer === null) return;

            const trimmedQuestion = nextQuestion.trim();
            const trimmedAnswer = nextAnswer.trim();

            if (!trimmedQuestion || !trimmedAnswer) {
                alert("Both question and answer are required.");
                return;
            }

            try {
                const response = await fetch("/api/flashcards/" + encodeURIComponent(id), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userEmail: email,
                        question: trimmedQuestion,
                        answer: trimmedAnswer
                    })
                });
                if (!response.ok) {
                    alert(await readErrorMessage(response, "Failed to update flashcard"));
                    return;
                }
                const data = await response.json();
                const updated = data.flashcard;
                if (updated && !isMultipleChoice(updated)) {
                    flashcards = flashcards.map(function (item) {
                        return item.id === id ? updated : item;
                    });
                }
                renderQuestions();
            } catch (err) {
                console.error(err);
                alert("Cannot reach backend. Run `node server.js` on http://localhost:3000");
            }
        }
    });

    (async function init() {
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        try {
            flashcards = (await loadFlashcards()).filter(function (item) {
                return !isMultipleChoice(item);
            });
            renderQuestions();
        } catch (err) {
            console.error(err);
            alert("Unable to load flashcards from database.");
            renderQuestions();
        }
    })();
})();
