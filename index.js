(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const loginLink = document.getElementById("login-link");
    const signupLink = document.getElementById("signup-link");
    const createLink = document.getElementById("create-link");
    const logoutLink = document.getElementById("logout-link");
    const startStudyingBtn = document.getElementById("start-studying-btn");

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

    updateNav();
})();
