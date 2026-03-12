(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const QUIZ_SESSION_KEY = "syntaxstudy_quiz_session";

    const form = document.getElementById("question-form");
    const questionInput = document.getElementById("question-input");
    const optionInputs = Array.from(document.querySelectorAll("[data-option-index]"));
    const correctOptionInputs = Array.from(document.querySelectorAll("input[name='correct-option']"));
    const questionsTitle = document.getElementById("questions-title");
    const emptyState = document.getElementById("questions-empty");
    const list = document.getElementById("questions-list");
    const takeQuizBtn = document.getElementById("take-quiz-btn");
    const seedBtn = document.getElementById("seed-btn");
    let flashcards = [];

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

    function renderQuestions() {
        questionsTitle.textContent = "Your Questions (" + flashcards.length + ")";
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
            const hasOptions = isValidMultipleChoice(item);
            let optionsMarkup = "";
            if (hasOptions) {
                const labels = ["A", "B", "C", "D"];
                optionsMarkup =
                    "<ul class='option-list'>" +
                    item.options
                        .map(function (option, optionIndex) {
                            const isCorrect = optionIndex === item.correctIndex;
                            return (
                                "<li>" +
                                "<span class='option-badge'>" +
                                labels[optionIndex] +
                                "</span>" +
                                "<span class='" +
                                (isCorrect ? "option-correct" : "") +
                                "'>" +
                                option +
                                "</span>" +
                                (isCorrect ? " (correct)" : "") +
                                "</li>"
                            );
                        })
                        .join("") +
                    "</ul>";
            }
            card.innerHTML =
                "<h3>Q" + (idx + 1) + ": " + item.question + "</h3>" +
                (hasOptions
                    ? optionsMarkup
                    : "<p><strong>Answer:</strong> " + item.answer + "</p>") +
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
        const options = optionInputs.map(function (input) {
            return input.value.trim();
        });
        const correctRadio = correctOptionInputs.find(function (input) {
            return input.checked;
        });
        const correctIndex = correctRadio ? Number(correctRadio.value) : null;
        const hasEmptyOption = options.some(function (value) {
            return !value;
        });

        if (!question || hasEmptyOption || correctIndex === null || Number.isNaN(correctIndex)) {
            alert("Please enter a question, four options, and select the correct answer.");
            return;
        }

        try {
            const response = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: email,
                    question: question,
                    options: options,
                    correctIndex: correctIndex
                })
            });

            if (!response.ok) {
                alert(await readErrorMessage(response, "Failed to save flashcard"));
                return;
            }

            const data = await response.json();
            if (data.flashcard && isValidMultipleChoice(data.flashcard)) {
                flashcards.unshift(data.flashcard);
            } else {
                flashcards = (await loadFlashcards()).filter(isValidMultipleChoice);
            }

            renderQuestions();
            form.reset();
            correctOptionInputs.forEach(function (input) {
                input.checked = false;
            });
            questionInput.focus();
        } catch (err) {
            console.error(err);
            alert("Cannot reach backend. Run `node server.js` on http://localhost:3000");
        }
    });

    takeQuizBtn.addEventListener("click", function () {
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        if (flashcards.length === 0) {
            alert("You need at least one multiple-choice question before starting a quiz.");
            return;
        }

        const randomQuestions = shuffle(flashcards);
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

    const sampleQuestions = [
        {
            question: "What is the time complexity of binary search on a sorted array?",
            options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
            correctIndex: 1
        },
        {
            question: "Which data structure follows FIFO (first in, first out) order?",
            options: ["Stack", "Queue", "Binary tree", "Hash table"],
            correctIndex: 1
        },
        {
            question: "Which protocol provides reliable, ordered delivery on the Internet?",
            options: ["UDP", "TCP", "IP", "ICMP"],
            correctIndex: 1
        },
        {
            question: "In SQL, which clause filters rows before aggregation?",
            options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
            correctIndex: 0
        },
        {
            question: "What does CPU stand for?",
            options: ["Central Processing Unit", "Computer Program Utility", "Core Performance Unit", "Central Peripheral Unit"],
            correctIndex: 0
        },
        {
            question: "Which algorithm finds the shortest path in a graph with non-negative edge weights?",
            options: ["Kruskal's algorithm", "Dijkstra's algorithm", "Prim's algorithm", "Bellman-Ford algorithm"],
            correctIndex: 1
        },
        {
            question: "Which concept allows a subclass to provide a specific implementation of a method?",
            options: ["Encapsulation", "Inheritance", "Method overriding", "Composition"],
            correctIndex: 2
        },
        {
            question: "Which type of memory is volatile?",
            options: ["ROM", "SSD", "RAM", "Hard disk"],
            correctIndex: 2
        }
    ];

    seedBtn.addEventListener("click", async function () {
        const email = getCurrentUserEmail();
        if (!email) {
            alert("Please login first.");
            window.location.href = "login.html";
            return;
        }

        seedBtn.disabled = true;
        const originalLabel = seedBtn.textContent;
        seedBtn.textContent = "Adding sample questions...";

        try {
            const response = await fetch("/api/flashcards/seed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userEmail: email,
                    questions: sampleQuestions
                })
            });

            if (!response.ok) {
                alert(await readErrorMessage(response, "Failed to add sample questions"));
                seedBtn.disabled = false;
                seedBtn.textContent = originalLabel;
                return;
            }

            flashcards = (await loadFlashcards()).filter(isValidMultipleChoice);
            renderQuestions();
        } catch (err) {
            console.error(err);
            alert("Cannot reach backend. Run `node server.js` on http://localhost:3000");
        } finally {
            seedBtn.disabled = false;
            seedBtn.textContent = originalLabel;
        }
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
            const nextOptions = Array.isArray(existing.options) ? existing.options.slice() : ["", "", "", ""];
            const labels = ["A", "B", "C", "D"];
            for (let idx = 0; idx < labels.length; idx += 1) {
                const nextOption = prompt("Edit option " + labels[idx] + ":", nextOptions[idx]);
                if (nextOption === null) return;
                nextOptions[idx] = nextOption.trim();
            }
            const defaultCorrect =
                Number.isInteger(existing.correctIndex) && existing.correctIndex >= 0 && existing.correctIndex < 4
                    ? String(existing.correctIndex + 1)
                    : "1";
            const nextCorrect = prompt("Which option is correct? Enter 1-4 or A-D.", defaultCorrect);
            if (nextCorrect === null) return;

            const trimmedQuestion = nextQuestion.trim();
            const trimmedOptions = nextOptions.map(function (value) {
                return String(value || "").trim();
            });
            const hasEmptyOption = trimmedOptions.some(function (value) {
                return !value;
            });
            const upper = String(nextCorrect || "").trim().toUpperCase();
            let nextCorrectIndex = null;
            if (upper === "A" || upper === "B" || upper === "C" || upper === "D") {
                nextCorrectIndex = ["A", "B", "C", "D"].indexOf(upper);
            } else {
                const numeric = Number(upper);
                if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) {
                    nextCorrectIndex = numeric - 1;
                }
            }

            if (!trimmedQuestion || hasEmptyOption || nextCorrectIndex === null) {
                alert("Question, four options, and a valid correct option are required.");
                return;
            }

            try {
                const response = await fetch("/api/flashcards/" + encodeURIComponent(id), {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userEmail: email,
                        question: trimmedQuestion,
                        options: trimmedOptions,
                        correctIndex: nextCorrectIndex
                    })
                });
                if (!response.ok) {
                    alert(await readErrorMessage(response, "Failed to update flashcard"));
                    return;
                }
                const data = await response.json();
                const updated = data.flashcard;
                if (updated && isValidMultipleChoice(updated)) {
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
            flashcards = (await loadFlashcards()).filter(isValidMultipleChoice);
            renderQuestions();
        } catch (err) {
            console.error(err);
            alert("Unable to load flashcards from database.");
            renderQuestions();
        }
    })();
})();
