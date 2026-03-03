(function () {
    const form = document.getElementById("signup-form");
    const msg = document.createElement("div");
    msg.id = "signup-message";
    msg.style.marginTop = "8px";
    form.parentNode.insertBefore(msg, form.nextSibling);

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
        msg.textContent = "";

        const email = document.getElementById("email-signup").value.trim().toLowerCase();
        const password = document.getElementById("password-signup").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (password.length < 6) {
            msg.textContent = "Password must be at least 6 characters";
            return;
        }

        if (password !== confirmPassword) {
            msg.textContent = "Passwords do not match";
            return;
        }

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: email.split("@")[0],
                    email,
                    password
                })
            });

            if (!response.ok) {
                msg.textContent = await readErrorMessage(response, "Signup failed");
                return;
            }

            msg.textContent = "Account created. Redirecting to login...";
            setTimeout(() => {
                window.location.href = "login.html";
            }, 900);
        } catch (err) {
            console.error(err);
            msg.textContent = "Cannot reach backend. Run `node server.js` and open http://localhost:3000/signup.html";
        }
    });
})();
