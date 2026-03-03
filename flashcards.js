(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const flashcardsStatus = document.getElementById("flashcards-status");
    const flashcardSelect = document.getElementById("flashcard-select");
    const flashcardPreview = document.getElementById("flashcard-preview");
    const flashcardPreviewQuestion = document.getElementById("flashcard-preview-question");
    const flashcardPreviewAnswer = document.getElementById("flashcard-preview-answer");
    let flashcards = [];

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            return JSON.parse(raw || "null");
        } catch (err) {
            return null;
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

    function renderFlashcardPreview() {
        const selectedId = flashcardSelect.value;
        const selected = flashcards.find(function (item) {
            return item.id === selectedId;
        });

        if (!selected) {
            flashcardPreview.hidden = true;
            flashcardPreview.classList.remove("flipped");
            return;
        }

        flashcardPreviewQuestion.textContent = selected.question;
        flashcardPreviewAnswer.textContent = selected.answer;
        flashcardPreview.classList.remove("flipped");
        flashcardPreview.hidden = false;
    }

    function renderFlashcardOptions() {
        flashcardSelect.innerHTML = "";

        if (flashcards.length === 0) {
            flashcardsStatus.textContent = "No flashcards yet. Create one to see it here.";
            flashcardSelect.disabled = true;
            flashcardSelect.innerHTML = "<option value=''>No flashcards available</option>";
            flashcardPreview.hidden = true;
            flashcardPreview.classList.remove("flipped");
            return;
        }

        flashcardsStatus.textContent = "Select a flashcard to preview it.";
        flashcardSelect.disabled = false;
        flashcards.forEach(function (item, idx) {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = (idx + 1) + ". " + item.question;
            flashcardSelect.appendChild(option);
        });
        flashcardSelect.selectedIndex = 0;
        renderFlashcardPreview();
    }

    async function loadFlashcardsForCurrentUser() {
        const user = getCurrentUser();
        const email = (user && user.email ? user.email : "").toLowerCase().trim();

        if (!email) {
            flashcardsStatus.textContent = "Please login first.";
            flashcardSelect.disabled = true;
            flashcardPreview.hidden = true;
            return;
        }

        flashcardsStatus.textContent = "Loading flashcards...";
        try {
            const response = await fetch("/api/flashcards?email=" + encodeURIComponent(email));
            if (!response.ok) {
                flashcardsStatus.textContent = await readErrorMessage(response, "Could not load flashcards.");
                flashcards = [];
                renderFlashcardOptions();
                return;
            }
            const data = await response.json();
            flashcards = Array.isArray(data.flashcards) ? data.flashcards : [];
            renderFlashcardOptions();
        } catch (err) {
            console.error(err);
            flashcardsStatus.textContent = "Cannot reach backend. Run node server.js.";
            flashcards = [];
            renderFlashcardOptions();
        }
    }

    flashcardSelect.addEventListener("change", function () {
        renderFlashcardPreview();
    });

    flashcardPreview.addEventListener("click", function () {
        if (flashcardPreview.hidden) return;
        flashcardPreview.classList.toggle("flipped");
    });

    flashcardPreview.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        flashcardPreview.classList.toggle("flipped");
    });

    loadFlashcardsForCurrentUser();
})();
