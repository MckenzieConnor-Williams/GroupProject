const form = document.getElementById("question-form");
const questionInput = document.getElementById("question-input");
const answerInput = document.getElementById("answer-input");
const questionsTitle = document.getElementById("questions-title");
const emptyState = document.getElementById("questions-empty");
const list = document.getElementById("questions-list");
const takeQuizBtn = document.getElementById("take-quiz-btn");
const questions = [];

function renderQuestions() {
    questionsTitle.textContent = "Your Questions (" + questions.length + ")";
    list.innerHTML = "";

    if (questions.length === 0) {
        emptyState.hidden = false;
        list.hidden = true;
        return;
    }

    emptyState.hidden = true;
    list.hidden = false;

    questions.forEach((item, idx) => {
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
    const question = questionInput.value.trim();
    const answer = answerInput.value.trim();

    if (!question || !answer) {
        return;
    }

    questions.push({ question: question, answer: answer });
    renderQuestions();
    form.reset();
    questionInput.focus();
});

takeQuizBtn.addEventListener("click", function () {
    window.location.href = "quiz.html";
});

renderQuestions();
        