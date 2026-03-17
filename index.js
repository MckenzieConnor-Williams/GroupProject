(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const loginLink = document.getElementById("login-link");
    const signupLink = document.getElementById("signup-link");
    const createLink = document.getElementById("create-link");
    const logoutLink = document.getElementById("logout-link");
    const startStudyingBtn = document.getElementById("start-studying-btn");
    const toolsToggle = document.getElementById("study-tools-toggle");
    const toolsMenu = document.getElementById("study-tools-menu");
    const viewFlashcardsLink = document.getElementById("view-flashcards-link");
    const createFlashcardsLink = document.getElementById("create-flashcards-link");
    const createQuizLink = document.getElementById("create-quiz-link");
    const takeFreeAnswerLink = document.getElementById("take-free-answer-link");

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            const parsed = JSON.parse(raw || "null");
            if (!parsed || typeof parsed !== "object") return null;
            return parsed;
        } catch (err) {
            return null;
        }
    }

    function isLoggedIn() {
        const user = getCurrentUser();
        return !!(user && typeof user.email === "string" && user.email.trim());
    }

    function setVisible(el, show) {
        if (!el) return;
        el.style.display = show ? "inline-block" : "none";
    }

    function updateNav() {
        const loggedIn = isLoggedIn();
        if (loggedIn) {
            setVisible(loginLink, false);
            setVisible(signupLink, false);
            setVisible(createLink, true);
            setVisible(logoutLink, true);
            createLink?.setAttribute("href", "question_page");
            return;
        }

        setVisible(loginLink, true);
        setVisible(signupLink, true);
        setVisible(createLink, false);
        setVisible(logoutLink, false);
        createLink?.setAttribute("href", "signup.html");
    }

    createLink?.addEventListener("click", function (event) {
        if (!isLoggedIn()) {
            event.preventDefault();
            window.location.href = "signup.html";
        }
    });

    logoutLink?.addEventListener("click", function (event) {
        event.preventDefault();
        localStorage.removeItem(CURRENT_USER_KEY);
        updateNav();
        window.location.href = "index.html";
    });

    startStudyingBtn?.addEventListener("click", function () {
        if (isLoggedIn()) {
            window.location.href = "question_page";
            return;
        }
        window.location.href = "signup.html";
    });

    toolsToggle?.addEventListener("click", function () {
        const expanded = toolsToggle.getAttribute("aria-expanded") === "true";
        toolsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        toolsMenu.classList.toggle("open", !expanded);
    });

    function requireLoginForTool(event) {
        if (isLoggedIn()) return;
        event.preventDefault();
        window.location.href = "signup.html";
    }

    viewFlashcardsLink?.addEventListener("click", requireLoginForTool);
    createFlashcardsLink?.addEventListener("click", requireLoginForTool);
    createQuizLink?.addEventListener("click", requireLoginForTool);
    takeFreeAnswerLink?.addEventListener("click", requireLoginForTool);

    document.addEventListener("click", function (event) {
        if (!toolsMenu || !toolsToggle) return;
        if (!toolsMenu.classList.contains("open")) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (toolsToggle.contains(target) || toolsMenu.contains(target)) return;
        toolsMenu.classList.remove("open");
        toolsToggle.setAttribute("aria-expanded", "false");
    });

    updateNav();
})();
