(function () {
    const cards = document.querySelectorAll(".option-card[data-route]");

    function openRoute(card) {
        const route = card.getAttribute("data-route");
        if (!route) return;
        window.location.href = route;
    }

    cards.forEach((card) => {
        card.addEventListener("click", function () {
            openRoute(card);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openRoute(card);
            }
        });
    });
})();
