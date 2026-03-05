(function () {
    const form = document.getElementById("login-form");
    let msg = document.getElementById("login-message");
    if (!msg) {
        msg = document.createElement("div");
        msg.id = "login-message";
        msg.style.marginTop = "8px";
        form.parentNode.insertBefore(msg, form.nextSibling);
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

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.textContent = "Checking credentials...";

        const email = document.getElementById("email-login").value.trim().toLowerCase();
        const password = document.getElementById("password-login").value;

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                msg.textContent = await readErrorMessage(response, "Login failed");
                return;
            }

            const data = await response.json();
            const displayName = (data.user && data.user.name) || email;
            localStorage.setItem(
                "syntaxstudy_current_user",
                JSON.stringify({
                    name: displayName,
                    email
                })
            );
            msg.textContent = `Welcome, ${displayName}! Redirecting...`;
            setTimeout(() => {
                window.location.href = "index.html";
            }, 800);
        } catch (err) {
            console.error(err);
            msg.textContent = "Cannot reach backend. Run `node server.js` and open http://localhost:3000/login.html";
        }
    });
})();
