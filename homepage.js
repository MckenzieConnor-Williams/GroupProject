let studyTool = document.getElementById("studytool");
let studyToolDiv = document.getElementById("dropdown-div-studytools");

let topics = document.getElementById("topics");
let topicsDiv = document.getElementById("dropdown-div-topics");

let signupBtn = document.getElementById("signup-btn");

(function () {
    const cards = document.querySelectorAll(".option-card[data-route]");

    if (signupBtn) {
        signupBtn.onclick = () => {
            window.location.href = "signup.html";
        };
    }

    if (studyTool) {
        studyTool.onclick = () => {
            if (studyToolDiv && studyToolDiv.style.display === "block") {
                studyToolDiv.style.display = "none";
            } else if (studyToolDiv) {
                studyToolDiv.style.display = "block";
                if (topicsDiv) {
                    topicsDiv.style.display = "none";
                }
            }
        };
    }

    if (topics) {
        topics.onclick = () => {
            if (topicsDiv && topicsDiv.style.display === "block") {
                topicsDiv.style.display = "none";
            } else if (topicsDiv) {
                topicsDiv.style.display = "block";
                if (studyToolDiv) {
                    studyToolDiv.style.display = "none";
                }
            }
        };
    }

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
