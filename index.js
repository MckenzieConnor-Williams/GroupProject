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

    function getCurrentUser() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            return JSON.parse(raw || "null");
        } catch (err) {
            return null;
        }
    }

    function isLoggedIn() {
        const user = getCurrentUser();
        return !!(user && user.email);
    }

    function updateNav() {
        if (isLoggedIn()) {
            loginLink.style.display = "none";
            signupLink.style.display = "none";
            logoutLink.style.display = "inline-block";
            createLink.setAttribute("href", "question_page");
            return;
        }

        loginLink.style.display = "inline-block";
        signupLink.style.display = "inline-block";
        logoutLink.style.display = "none";
        createLink.setAttribute("href", "signup.html");
    }

    createLink.addEventListener("click", function (event) {
        if (!isLoggedIn()) {
            event.preventDefault();
            window.location.href = "signup.html";
        }
    });

    logoutLink.addEventListener("click", function (event) {
        event.preventDefault();
        localStorage.removeItem(CURRENT_USER_KEY);
        updateNav();
        window.location.href = "index.html";
    });

    startStudyingBtn.addEventListener("click", function () {
        if (isLoggedIn()) {
            window.location.href = "question_page";
            return;
        }
        window.location.href = "signup.html";
    });

    toolsToggle.addEventListener("click", function () {
        const expanded = toolsToggle.getAttribute("aria-expanded") === "true";
        toolsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        toolsMenu.classList.toggle("open", !expanded);
    });

    function requireLoginForTool(event) {
        if (isLoggedIn()) return;
        event.preventDefault();
        window.location.href = "signup.html";
    }

    viewFlashcardsLink.addEventListener("click", requireLoginForTool);
    createFlashcardsLink.addEventListener("click", requireLoginForTool);
    createQuizLink.addEventListener("click", requireLoginForTool);

    document.addEventListener("click", function (event) {
        if (!toolsMenu.classList.contains("open")) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (toolsToggle.contains(target) || toolsMenu.contains(target)) return;
        toolsMenu.classList.remove("open");
        toolsToggle.setAttribute("aria-expanded", "false");
    });

    updateNav();
})();
