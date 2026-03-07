(function () {
    const CURRENT_USER_KEY = "syntaxstudy_current_user";
    const cards = document.querySelectorAll(".option-card[data-route]");

    function isLoggedIn() {
        try {
            const raw = localStorage.getItem(CURRENT_USER_KEY);
            const user = JSON.parse(raw || "null");
            return !!(user && typeof user.email === "string" && user.email.trim());
        } catch (err) {
            return false;
        }
    }

    function openCardRoute(card) {
        const route = card.getAttribute("data-route");
        if (!route) return;
        if (!isLoggedIn()) {
            window.location.href = "signup.html";
            return;
        }
        window.location.href = route;
    }

    cards.forEach((card) => {
        card.addEventListener("click", function () {
            openCardRoute(card);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCardRoute(card);
            }
        });
    });
})();
