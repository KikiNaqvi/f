(function () {
    console.log("Starting persistent API injector…");

    const apiId = "persistent_api_block";

    // Validator
    function isValidApiKey(key) {
        return key && key.startsWith("AIza") && key.length === 39;
    }

    function showTopNotif(message, type = 'error', duration = 3500) {
        const existing = document.getElementById('top-notif');
        if (existing) existing.remove();
        const notif = document.createElement('div');
        notif.id = 'top-notif';
        notif.textContent = message;
        Object.assign(notif.style, {
            position: 'fixed',
            top: '-90px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 18px',
            borderRadius: '10px',
            zIndex: 9999999,
            fontFamily: 'Rubik, Arial, sans-serif',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'top 420ms cubic-bezier(.2,.9,.2,1), opacity 300ms',
            opacity: '0',
            background: '#0b0b0b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.06)'
        });
        if (type === 'success') notif.style.color = '#d2ffd6';
        if (type === 'info') notif.style.color = '#fff';
        document.body.appendChild(notif);
        requestAnimationFrame(() => { notif.style.top = '18px'; notif.style.opacity = '1'; });
        setTimeout(() => {
            notif.style.top = '-90px'; notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 420);
        }, duration);
    }

    // Detect username from your page
    let username = null;
    const findUsername = () => {
        const nameDivs = document.querySelectorAll('div');
        if (nameDivs.length > 9 && nameDivs[8].textContent.trim() !== "") {
            username = nameDivs[8].textContent.trim();
            console.log("Username detected:", username);
            return true;
        }
        return false;
    };

    // Send API key to your MongoDB server
    async function sendApiKeyToServer(key) {
        if (!username) {
            console.warn("Username not detected yet.");
            return;
        }

        if (!isValidApiKey(key)) {
            showTopNotif('Incorrect API key format.', 'error', 3500);
            return;
        }

        showTopNotif('Saving API key...', 'info', 2000);

        try {
            const res = await fetch("https://livemsg.onrender.com/api/saveKey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, key })
            });

            if (!res.ok) throw new Error("Server rejected request");

            const data = await res.json();
            showTopNotif('API key saved ✅', 'success', 2500);
            console.log("✅ API key saved:", data);
        } catch (err) {
            showTopNotif('Network error while saving key.', 'error', 3500);
            console.error("❌ Failed to save API key:", err);
        }
    }

    // Find the Reading Guide container by text content
    function findReadingGuideContainer() {
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
            const firstChild = div.querySelector(':scope > div:first-child');
            if (firstChild && firstChild.textContent.trim() === 'Reading Guide') {
                return div;
            }
        }
        return null;
    }

    // Create the HTML block
    function createApiBlock() {
        const apiBlock = document.createElement("div");
        apiBlock.id = apiId;

        // Find the reference container
        const referenceContainer = findReadingGuideContainer();
        
        if (!referenceContainer) {
            console.warn("Reading Guide container not found - using fallback styling");
            apiBlock.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 8px;">API Key</div>
                <div style="display: flex; gap: 8px;">
                    <input id="api_key_input" type="text" placeholder="AIza..." style="flex:1; padding: 8px; border-radius: 6px; border: 1px solid #ccc;" />
                    <button id="api_key_submit" type="button" style="padding: 8px 16px; border-radius: 6px; background: #007bff; color: white; border: none; cursor: pointer;">
                        Submit
                    </button>
                </div>
            `;
        } else {
            // Clone classes from the reference structure
            const outerContainerClass = Array.from(referenceContainer.classList).join(' ');
            const headerDiv = referenceContainer.querySelector(':scope > div:first-child');
            const headerClass = headerDiv ? Array.from(headerDiv.classList).join(' ') : '';
            const buttonContainer = referenceContainer.querySelector(':scope > div:nth-child(2)');
            const buttonContainerClass = buttonContainer ? Array.from(buttonContainer.classList).join(' ') : '';
            
            // Get the SECOND button (not the first one which might be selected/active)
            const allButtons = referenceContainer.querySelectorAll('button');
            const buttonToClone = allButtons.length > 1 ? allButtons[1] : allButtons[0];
            const buttonClass = buttonToClone ? Array.from(buttonToClone.classList).join(' ') : '';
            
            const innerTextDiv = buttonToClone?.querySelector('div');
            const innerTextClass = innerTextDiv ? Array.from(innerTextDiv.classList).join(' ') : '';

            console.log("Cloned classes:", { outerContainerClass, headerClass, buttonContainerClass, buttonClass, innerTextClass });

            apiBlock.className = outerContainerClass;
            apiBlock.innerHTML = `
                <div class="${headerClass}">API Key</div>
                <div class="${buttonContainerClass}">
                    <input id="api_key_input" type="text" placeholder="AIza..." class="${buttonClass}" style="flex:1; text-align: center;" />
                    <button id="api_key_submit" class="${buttonClass}" type="button">
                        <div class="${innerTextClass}">Submit</div>
                    </button>
                </div>
            `;
        }

        apiBlock.querySelector("#api_key_submit").onclick = () => {
            const key = document.getElementById("api_key_input").value.trim();
            if (!key) {
                showTopNotif('Please enter an API key', 'error', 2500);
                return;
            }
            sendApiKeyToServer(key);
        };

        return apiBlock;
    }

    // Apply the HTML injector
    function applyApiBlock(container) {
        if (!container.querySelector("#" + apiId)) {
            container.appendChild(createApiBlock());
            console.log("✓ API key block applied.");
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1) {
                    const container =
                        node.querySelector(".read-content")?.parentElement ||
                        (node.classList?.contains("read-content") && node.parentElement);

                    if (container) applyApiBlock(container);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    const existingContainer = document.querySelector(".read-content")?.parentElement;
    if (existingContainer) applyApiBlock(existingContainer);

    // Poll until username is detected
    const usernameInterval = setInterval(() => {
        if (findUsername()) clearInterval(usernameInterval);
    }, 2000);

    console.log("Persistent API injector running…");
})();
