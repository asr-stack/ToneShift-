const API = "http://127.0.0.1:8000/api";

async function getHistory() {
    const email = localStorage.getItem("userEmail");

    const res = await fetch(`${API}/history/?email=${email}`);
    const data = await res.json();

    return data.history || [];
}

async function saveToHistory(original, translated, tone) {
    const email = localStorage.getItem("userEmail");

    const res = await fetch(`${API}/save/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email,
            original,
            translated,
            tone
        })
    });

    const data = await res.json();
    console.log(data);
    return data;
}

// Authentication functions
function isAuthenticated() {
    return localStorage.getItem("isLoggedIn") === "true";
}

function checkAuthentication() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // update nav with stored userName if available
    if (isAuthenticated()) {
        const storedName = localStorage.getItem("userName");
        const navProfileName = document.querySelector('.profile-name');
        if (navProfileName && storedName) navProfileName.textContent = storedName;
        const navProfileImage = document.querySelector('.profile-image-nav');
        if (navProfileImage && storedName) navProfileImage.textContent = storedName.charAt(0).toUpperCase();
    }

    // Allow access to login page without authentication
    if (currentPage === 'login.html') {
        // If already logged in, redirect to home
        if (isAuthenticated()) {
            // Small delay to prevent redirect loops
            localStorage.setItem("userEmail", email);
            localStorage.setItem("isLoggedIn", "true");

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
        return;
    }
    
    // For all other pages (including profile), require authentication
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}


function logoutUser() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    window.location.href = 'login.html';
}



function deleteAccount() {
    // Show an in-site modal (floating) for confirmation instead of native confirm()
    if (document.querySelector('.delete-account-modal')) return; // already open

    const modal = document.createElement('div');
    modal.className = 'modal delete-account-modal show';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h3>Delete Account</h3>
        <p>Are you sure you want to delete your account? This will remove all your data including translation history and cannot be undone.</p>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
            <button id="cancel-delete" class="btn-secondary">Cancel</button>
            <button id="confirm-delete" class="btn-danger">Delete Account</button>
        </div>
    `;

    modal.appendChild(overlay);
    modal.appendChild(content);
    document.body.appendChild(modal);

    const confirmBtn = content.querySelector('#confirm-delete');
    const cancelBtn = content.querySelector('#cancel-delete');

    function closeModal() {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        document.removeEventListener('keydown', onKey);
    }

    function onKey(e) {
        if (e.key === 'Escape') closeModal();
    }

    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', onKey);

    confirmBtn.addEventListener('click', async () => {
        await fetch(`${API}/users/delete/`, {
         method: "POST",
        headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
        email: localStorage.getItem("userEmail")
        })
    });

localStorage.clear();
window.location.href = "login.html";
        // optional: show a short success message then redirect
        const success = document.createElement('div');
        success.className = 'modal-content';
        success.innerHTML = '<h3>Account deleted</h3><p>Your account and data have been removed.</p>';
        // replace content with success message
        content.innerHTML = success.innerHTML;
        setTimeout(() => {
            closeModal();
            window.location.href = 'login.html';
        }, 900);
    });
}

function updateNavigation() {
    const isLoggedIn = isAuthenticated();
    
    // Update login/logout button based on auth status
    const loginLinks = document.querySelectorAll('#auth-link');
    loginLinks.forEach(loginLink => {
        if (loginLink) {
            // Remove old event listeners by cloning
            const newLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLink, loginLink);
            
            if (isLoggedIn) {
                newLink.textContent = 'Logout';
                newLink.href = '#';
                newLink.classList.remove('active');
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    logoutUser();
                });
            } else {
                newLink.textContent = 'Login';
                newLink.href = 'login.html';
            }
        }
    });
    
    // Show/hide profile link based on auth status
    const profileLinks = document.querySelectorAll('#profile-link, a[href="profile.html"]');
    profileLinks.forEach(profileLink => {
        if (profileLink) {
            const parentLi = profileLink.closest('li');
            if (parentLi) {
                if (isLoggedIn) {
                    parentLi.style.display = 'list-item';
                } else {
                    parentLi.style.display = 'none';
                }
            }
        }
    });
}

// Run authentication check and navigation update on page load
(function() {
    // Check authentication immediately (synchronous check)
    checkAuthentication();
    
    // Update navigation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavigation);
        document.addEventListener('DOMContentLoaded', setupMobileNav);
    } else {
        updateNavigation();
        setupMobileNav();
    }
})();

// Mobile navigation toggle: insert a hamburger button and wire it up
function setupMobileNav() {
    try {
        const navContainer = document.querySelector('.navbar .nav-container');
        if (!navContainer) return;
        // avoid adding multiple toggles
        if (navContainer.querySelector('.nav-toggle')) return;

        const menu = navContainer.querySelector('.nav-menu');
        if (!menu) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        toggle.innerHTML = '&#9776;'; // hamburger

        // place toggle before the menu (so it's visible on small screens)
        navContainer.insertBefore(toggle, menu);

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
            toggle.classList.toggle('open');
        });

        // close menu when a link is clicked
        menu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                menu.classList.remove('open');
                toggle.classList.remove('open');
            });
        });

        // close on outside click
        document.addEventListener('click', (ev) => {
            if (!navContainer.contains(ev.target)) {
                menu.classList.remove('open');
                toggle.classList.remove('open');
            }
        });

        // ensure menu closes when resizing to large screens
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                menu.classList.remove('open');
                toggle.classList.remove('open');
            }
        });
    } catch (err) {
        // non-fatal
        console.warn('setupMobileNav error', err);
    }
}

// Collapsible desktop nav: collapsed by default, hover to expand, click to pin
function setupCollapsibleNav() {
    try {
        const root = document.documentElement;
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        const collapsedWidth = getComputedStyle(root).getPropertyValue('--nav-collapsed-width') || '56px';
        const expandedWidth = getComputedStyle(root).getPropertyValue('--nav-width') || '220px';

        // create mini button if missing
        let mini = navbar.querySelector('.nav-mini');
        if (!mini) {
            mini = document.createElement('button');
            mini.type = 'button';
            mini.className = 'nav-mini';
            mini.setAttribute('aria-label', 'Open navigation');
            // three lines icon
            mini.innerHTML = '<span style="line-height:0;display:block">&#9776;</span>';
            // insert near top of nav
            const insertBefore = navbar.querySelector('.nav-menu') || navbar.querySelector('.nav-container');
            navbar.insertBefore(mini, insertBefore);
        }

        let pinned = false;

        function collapse() {
            navbar.classList.add('collapsed');
            navbar.classList.remove('expanded');
            root.style.setProperty('--nav-width', collapsedWidth);
        }

        function expand() {
            navbar.classList.remove('collapsed');
            navbar.classList.add('expanded');
            root.style.setProperty('--nav-width', expandedWidth);
        }

        // Initialize: collapse on wide screens
        function initState() {
            if (window.innerWidth > 768) {
                collapse();
            } else {
                // on mobile keep normal nav
                navbar.classList.remove('collapsed');
                root.style.setProperty('--nav-width', expandedWidth);
            }
        }

        // Hover to expand when not pinned
        navbar.addEventListener('mouseenter', () => {
            if (window.innerWidth <= 768) return;
            if (!pinned) expand();
        });

        navbar.addEventListener('mouseleave', () => {
            if (window.innerWidth <= 768) return;
            if (!pinned) collapse();
        });

        // clicking mini toggles pinned state
        mini.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 768) return;
            pinned = !pinned;
            if (pinned) {
                expand();
                mini.classList.add('open');
                mini.setAttribute('aria-pressed', 'true');
            } else {
                collapse();
                mini.classList.remove('open');
                mini.setAttribute('aria-pressed', 'false');
            }
        });

        // clicking a nav link will collapse again if not pinned
        navbar.querySelectorAll('.nav-menu a').forEach(a => {
            a.addEventListener('click', () => {
                if (window.innerWidth > 768 && !pinned) collapse();
            });
        });

        // respond to resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                // restore default
                navbar.classList.remove('collapsed');
                root.style.setProperty('--nav-width', expandedWidth);
                pinned = false;
                if (mini) mini.style.display = 'none';
            } else {
                if (mini) mini.style.display = '';
                initState();
            }
        });

        // initial
        initState();
    } catch (err) {
        console.warn('setupCollapsibleNav error', err);
    }
}

// initialize both nav systems
document.addEventListener('DOMContentLoaded', () => {
    setupCollapsibleNav();
});


// Page-specific functionality
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

if (currentPage === 'index.html' || currentPage === '') {
    // Home page functionality
    const translateBtn = document.getElementById('translate-btn');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const toneSelect = document.getElementById('tone-select');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const saveBtn = document.getElementById('save-btn');
    
    if (translateBtn) {
        translateBtn.addEventListener('click', async () => {
            const text = inputText.value;
            const tone = toneSelect.value;
            
            if (!text.trim()) {
                // Show warning animation
                inputText.style.animation = 'none';
                setTimeout(() => {
                    inputText.style.animation = 'fadeInUp 0.3s ease';
                }, 10);
                return;
            }
            
            // Add loading state
            translateBtn.classList.add('loading');
            translateBtn.textContent = 'Translating...';
            
            // Simulate slight delay for better UX
            await new Promise(resolve => setTimeout(resolve, 300));
            
            try {
                const res = await fetch(`${API}/translate/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    text,
                    tone,
                    email: localStorage.getItem("userEmail")
                })
            });

                const data = await res.json();

                if (res.ok) {
                    outputText.value = data.translated;

                    if (data.message) {
                        alert(data.message);
                        }
                } else {
                    outputText.value = "Translation failed.";
            }

        } catch (error) {
            outputText.value = "Server error.";
    }
            
            // Add success animation to output
            outputText.style.animation = 'none';
            setTimeout(() => {
                outputText.style.animation = 'fadeInUp 0.5s ease';
            }, 10);
            
            // Remove loading state
            translateBtn.classList.remove('loading');
            translateBtn.textContent = 'Translate Now';
        });
        
        // Allow Enter key to translate
        inputText.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                translateBtn.click();
            }
        });
    }
    
    // Add live character counter
    if (inputText) {
        inputText.addEventListener('input', () => {
            const charCount = inputText.value.length;
            inputText.style.borderColor = charCount > 500 ? '#ec4899' : '';
        });
    }
    
    // Real-time tone selection feedback
    if (toneSelect) {
        toneSelect.addEventListener('change', () => {
            // Visual pulse on tone change
            toneSelect.style.borderColor = '#6366f1';
            setTimeout(() => {
                toneSelect.style.borderColor = '';
            }, 300);
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!outputText.value) return;
            
            try {
                // Use modern Clipboard API
                await navigator.clipboard.writeText(outputText.value);
                
                // Visual feedback
                copyBtn.textContent = '✓ Copied!';
                copyBtn.style.background = '#10b981';
                copyBtn.style.color = 'white';
                
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                }, 2000);
            } catch (err) {
                // Fallback for older browsers
                outputText.select();
                document.execCommand('copy');
                
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                }, 2000);
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Add smooth fade out effect
            inputText.style.opacity = '0.5';
            outputText.style.opacity = '0.5';
            
            setTimeout(() => {
                inputText.value = '';
                outputText.value = '';
                inputText.style.opacity = '1';
                outputText.style.opacity = '1';
            }, 200);
        });
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const original = inputText.value;
            const translated = outputText.value;
            const tone = toneSelect.value;
            
            if (original && translated) {
                const res = await saveToHistory(original, translated, tone);

                if (res && res.duplicate) {
                    const toast = document.createElement('div');
                    toast.className = 'toast toast-error';
                    toast.setAttribute('role', 'status');
                    toast.setAttribute('aria-live', 'polite');
                    toast.textContent = 'Already saved to history';
                    document.body.appendChild(toast);
                    requestAnimationFrame(() => toast.classList.add('show'));
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => {
                            if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
                        }, 300);
                    }, 2000);
                } else {
                    // Stronger visual feedback: disable button + toast notification
                    saveBtn.classList.add('btn-success');
                    // also apply inline styles to guarantee visibility
                    saveBtn.style.background = '#10b981';
                    saveBtn.style.color = 'white';
                    saveBtn.style.borderColor = '#059669';
                    saveBtn.style.boxShadow = 'none';
                    saveBtn.style.opacity = '1';
                    saveBtn.textContent = "✓ Saved!";
                    saveBtn.disabled = true;

                    setTimeout(() => {
                        saveBtn.classList.remove('btn-success');
                        // clear inline styles to restore original look
                        saveBtn.style.background = '';
                        saveBtn.style.color = '';
                        saveBtn.style.borderColor = '';
                        saveBtn.style.boxShadow = '';
                        saveBtn.style.opacity = '';
                        saveBtn.textContent = "Save to History";
                        saveBtn.disabled = false;
                    }, 2000);

                    const toast = document.createElement('div');
                    toast.className = 'toast toast-success';
                    toast.setAttribute('role', 'status');
                    toast.setAttribute('aria-live', 'polite');
                    toast.textContent = 'Saved to history';
                    document.body.appendChild(toast);

                    // trigger show animation
                    requestAnimationFrame(() => toast.classList.add('show'));

                    // restore button after short delay
                    setTimeout(() => {
                        toast.classList.remove('show');
                        saveBtn.disabled = false;
                        saveBtn.removeAttribute('aria-busy');
                        // remove toast after fade
                        setTimeout(() => {
                            if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
                        }, 300);
                    }, 2000);
                }
            } else {
                // Show error feedback as a toast
                const toastErr = document.createElement('div');
                toastErr.className = 'toast toast-error';
                toastErr.setAttribute('role', 'alert');
                toastErr.textContent = 'Need input and translation to save';
                document.body.appendChild(toastErr);
                requestAnimationFrame(() => toastErr.classList.add('show'));
                setTimeout(() => {
                    toastErr.classList.remove('show');
                    setTimeout(() => {
                        if (toastErr && toastErr.parentNode) toastErr.parentNode.removeChild(toastErr);
                    }, 300);
                }, 2000);
            }
        });
    }
}

if (currentPage === 'history.html') {
    // History page functionality
    const historyContainer = document.getElementById('history-container');
    const emptyState = document.getElementById('empty-state');
    const clearHistoryBtn = document.getElementById('clear-history');
    const filterTone = document.getElementById('filter-tone');
    
    async function displayHistory() {
        let history = await getHistory();
        const filter = filterTone.value;
        
        if (filter !== 'all') {
            history = history.filter(item => item.tone === filter);
        }
        
        if (history.length === 0) {
            emptyState.style.display = 'block';
            historyContainer.innerHTML = '';
            historyContainer.appendChild(emptyState);
            return;
        }
        
        emptyState.style.display = 'none';
        historyContainer.innerHTML = '';
        
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            historyItem.innerHTML = `
                <button class="delete-btn btn-danger" data-index="${index}">X</button>
                <div class="history-item-header">
                    <span class="tone-badge ${item.tone}">${item.tone}</span>
                    <span class="history-time">${formattedDate}</span>
                </div>
                <div class="history-original">Original: "${item.original}"</div>
                <div class="history-translated">Translated: "${item.translated}"</div>
            `;
            
            historyContainer.appendChild(historyItem);
        });
        
        // Add delete functionality
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
            const index = parseInt(btn.dataset.index);

        await fetch(`${API}/history/delete/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: localStorage.getItem("userEmail"),
                index: index
            })
        });

            displayHistory();
            });
        });
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', async () => {
            // If there are no history items, show a brief message and do nothing
            const existingHistory = await getHistory();
            if (!existingHistory || existingHistory.length === 0) {
                // Show a modal popup similar to the clear confirmation when there's nothing to clear
                if (document.querySelector('.history-empty-modal')) return;

                const modal = document.createElement('div');
                modal.className = 'modal history-empty-modal show';

                const overlay = document.createElement('div');
                overlay.className = 'modal-overlay';

                const content = document.createElement('div');
                content.className = 'modal-content';
                content.innerHTML = `
                    <h3>No Translations</h3>
                    <p>There are no saved translations to clear.</p>
                    <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                        <button id="close-empty" class="btn-primary">OK</button>
                    </div>
                `;

                modal.appendChild(overlay);
                modal.appendChild(content);
                document.body.appendChild(modal);

                const closeBtn = content.querySelector('#close-empty');
                function closeModal() {
                    if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
                    document.removeEventListener('keydown', onKey);
                }
                function onKey(e) {
                    if (e.key === 'Escape') closeModal();
                }

                closeBtn.addEventListener('click', closeModal);
                overlay.addEventListener('click', closeModal);
                document.addEventListener('keydown', onKey);

                return;
            }
            // Create a floating modal using existing modal styles
            if (document.querySelector('.history-modal')) return; // already open

            const modal = document.createElement('div');
            modal.className = 'modal history-modal show';

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            const content = document.createElement('div');
            content.className = 'modal-content';
            content.innerHTML = `
                <h3>Clear All History</h3>
                <p>Are you sure you want to clear all translation history? This action cannot be undone.</p>
                <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                    <button id="confirm-clear" class="btn-danger">Clear All</button>
                    <button id="cancel-clear" class="btn-secondary">Cancel</button>
                </div>
            `;

            modal.appendChild(overlay);
            modal.appendChild(content);
            document.body.appendChild(modal);

            // Focus management
            const confirmBtn = content.querySelector('#confirm-clear');
            const cancelBtn = content.querySelector('#cancel-clear');
            confirmBtn.focus();

            function closeModal() {
                if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
                document.removeEventListener('keydown', onKey);
            }

            function onKey(e) {
                if (e.key === 'Escape') closeModal();
            }

            // Wire actions
        confirmBtn.addEventListener('click', async () => {

            await fetch(`${API}/history/clear/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                email: localStorage.getItem("userEmail")
            })
        });

        displayHistory();

        content.innerHTML = '<h3>All history cleared!</h3>';
        setTimeout(closeModal, 1500);
    });

            cancelBtn.addEventListener('click', () => {
                closeModal();
            });

            overlay.addEventListener('click', closeModal);
            document.addEventListener('keydown', onKey);
        });
    }
    
    if (filterTone) {
        filterTone.addEventListener('change', displayHistory);
    }
    
    displayHistory();
}

if (currentPage === 'login.html') {
    // Login page functionality
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const messageDiv = document.getElementById('message');
    const authTabs = document.querySelectorAll('.auth-tab');
    const signinContainer = document.getElementById('signin-form-container');
    const signupContainer = document.getElementById('signup-form-container');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Simple email format validator
    function isValidEmail(email) {
        if (!email) return false;
        // Basic RFC 5322-ish pattern (sufficient for client-side validation)
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Tab switching functionality
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active form container
            signinContainer.classList.remove('active');
            signupContainer.classList.remove('active');
            
            if (targetTab === 'signin') {
                signinContainer.classList.add('active');
            } else {
                signupContainer.classList.add('active');
            }
            
            // Clear any messages
            messageDiv.className = 'message';
            messageDiv.textContent = '';
        });
    });
    
    // Auto-fill saved credentials if they exist
    window.addEventListener('DOMContentLoaded', () => {
        // Preserve support for earlier checkbox-based toggles
        document.querySelectorAll('input.toggle-password[type="checkbox"]').forEach(cb => {
            const targetId = cb.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            cb.addEventListener('change', () => {
                input.type = cb.checked ? 'text' : 'password';
            });
        });

        // Eye button toggles
        document.querySelectorAll('.toggle-password-btn').forEach(btn => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            btn.addEventListener('click', () => {
                const isText = input.type === 'text';
                input.type = isText ? 'password' : 'text';
                btn.setAttribute('aria-pressed', String(!isText));
                btn.classList.toggle('visible', !isText);
                // Toggle icon between eye and eye-off
                if (btn.classList.contains('visible')) {
                    btn.innerHTML = `
                        <svg class="eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.44 21.44 0 0 1 5.06-6.94"></path>
                            <path d="M1 1l22 22"></path>
                        </svg>`;
                } else {
                    btn.innerHTML = `
                        <svg class="eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>`;
                }
            });
        });
        // Live validation feedback for email fields
        function showEmailFeedback(input, valid) {
            if (!input) return;
            // find or create feedback element inside the same form-group
            let container = input.closest('.form-group') || input.parentNode;
            let fb = container.querySelector('.email-feedback');
            if (!fb) {
                fb = document.createElement('div');
                fb.className = 'email-feedback';
                fb.style.fontSize = '0.875rem';
                fb.style.marginTop = '6px';
                container.appendChild(fb);
            }
            if (input.value.trim() === '') {
                fb.textContent = '';
                input.style.borderColor = '';
                return;
            }
            fb.textContent = valid ? 'Looks good' : 'Please enter a valid email address';
            fb.style.color = valid ? '#10b981' : '#ef4444';
            input.style.borderColor = valid ? '#10b981' : '#ef4444';
        }

        // Live validation feedback for signup password and confirmation
        function showSignupPasswordFeedback(pwInput, confirmInput) {
            if (!pwInput) return;
            const pwContainer = pwInput.closest('.form-group') || pwInput.parentNode;
            let pwFb = pwContainer.querySelector('.password-feedback');
            if (!pwFb) {
                pwFb = document.createElement('div');
                pwFb.className = 'password-feedback';
                pwFb.style.fontSize = '0.875rem';
                pwFb.style.marginTop = '6px';
                pwContainer.appendChild(pwFb);
            }

            const val = pwInput.value || '';
            if (val.trim() === '') {
                pwFb.textContent = '';
                pwInput.style.borderColor = '';
            } else if (val.length < 8) {
                pwFb.textContent = 'Password is too short (min 8 characters)';
                pwFb.style.color = '#ef4444';
                pwInput.style.borderColor = '#ef4444';
            } else {
                // check other requirements
                const rules = [
                    {regex: /[A-Z]/, msg: 'one uppercase letter'},
                    {regex: /\d/, msg: 'one number'},
                    {regex: /[^A-Za-z0-9]/, msg: 'one special character'}
                ];
                const missing = rules.filter(r => !r.regex.test(val)).map(r => r.msg);
                if (missing.length) {
                    pwFb.textContent = 'Needs ' + missing.join(', ');
                    pwFb.style.color = '#ef4444';
                    pwInput.style.borderColor = '#ef4444';
                } else {
                    pwFb.textContent = 'Password looks good';
                    pwFb.style.color = '#10b981';
                    pwInput.style.borderColor = '#10b981';
                }
            }

            if (confirmInput) {
                const confContainer = confirmInput.closest('.form-group') || confirmInput.parentNode;
                let confFb = confContainer.querySelector('.confirm-feedback');
                if (!confFb) {
                    confFb = document.createElement('div');
                    confFb.className = 'confirm-feedback';
                    confFb.style.fontSize = '0.875rem';
                    confFb.style.marginTop = '6px';
                    confContainer.appendChild(confFb);
                }

                const confVal = confirmInput.value || '';
                if (confVal.trim() === '') {
                    confFb.textContent = '';
                    confirmInput.style.borderColor = '';
                } else if (val === confVal) {
                    confFb.textContent = 'Passwords match';
                    confFb.style.color = '#10b981';
                    confirmInput.style.borderColor = '#10b981';
                } else {
                    confFb.textContent = 'Passwords do not match';
                    confFb.style.color = '#ef4444';
                    confirmInput.style.borderColor = '#ef4444';
                }
            }
        }

        const signupEmailInput = document.getElementById('signup-email');
        if (emailInput) {
            // initial validation for autofill
            showEmailFeedback(emailInput, isValidEmail(emailInput.value.trim()));
            emailInput.addEventListener('input', (e) => {
                showEmailFeedback(emailInput, isValidEmail(e.target.value.trim()));
            });
        }

        if (signupEmailInput) {
            showEmailFeedback(signupEmailInput, isValidEmail(signupEmailInput.value.trim()));
            signupEmailInput.addEventListener('input', (e) => {
                showEmailFeedback(signupEmailInput, isValidEmail(e.target.value.trim()));
            });

            // signup password live feedback
            const signupPw = document.getElementById('signup-password');
            const signupConfirm = document.getElementById('signup-confirm-password');
            if (signupPw) {
                showSignupPasswordFeedback(signupPw, signupConfirm);
                signupPw.addEventListener('input', () => {
                    showSignupPasswordFeedback(signupPw, signupConfirm);
                });
            }
            if (signupConfirm) {
                signupConfirm.addEventListener('input', () => {
                    showSignupPasswordFeedback(signupPw, signupConfirm);
                });
            }
        }
    });
    
    // Sign In Form Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

         if (!email || !password) {
             messageDiv.className = 'message error';
            messageDiv.textContent = 'Please fill in all fields.';
             return;
         }

         try {
                const res = await fetch(`${API}/users/login/`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ email, password })
             });

            const data = await res.json();

             if (res.ok) {
                localStorage.setItem("userEmail", email);
                localStorage.setItem("isLoggedIn", "true");
                // store name for navbar across pages
                if (data.name) {
                    localStorage.setItem("userName", data.name);
                }
                // save timestamps for immediate usage
                if (data.creationDate) {
                    localStorage.setItem("creationDate", data.creationDate);
                }
                if (data.loginDate) {
                    localStorage.setItem("loginDate", data.loginDate);
                }

                messageDiv.className = 'message success';
                messageDiv.textContent = 'Login successful! Redirecting...';

             setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
          } else {
             messageDiv.className = 'message error';
             messageDiv.textContent = data.error || "Invalid credentials.";
         }

         } catch (error) {
          messageDiv.className = 'message error';
            messageDiv.textContent = 'Server error. Try again.';
            }
        });
    }
    
    // Sign Up Form Handler
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Please fill in all fields.';
            return;
        }
        // validate password strength
        const pwRules = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!pwRules.test(password)) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Password must be 8+ characters, include a capital letter, number, and special character.';
            return;
        }

        try {
            const res = await fetch(`${API}/users/register/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
             });

            const data = await res.json();

           if (res.ok) {
                 // 🔐 Automatically log the user in
                localStorage.setItem("userEmail", email);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userName", name);
                const navProfileName = document.querySelector('.profile-name');
                if (navProfileName) navProfileName.textContent = name;

                 messageDiv.className = 'message success';
                 messageDiv.textContent = 'Account created! Redirecting...';

                 setTimeout(() => {
                  window.location.href = 'index.html';  // go to homepage instead of login
              }, 1000);
            } else {
                messageDiv.className = 'message error';
                messageDiv.textContent = data.error || "Registration failed.";
            }

        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Server error.';
            }
        });
    }
    
}

if (currentPage === 'contact.html') {
    // Contact page functionality
    const contactForm = document.getElementById('contact-form');
    const messageDiv = document.getElementById('contact-message-display');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;

        const res = await fetch(`${API}/contact/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, subject, message })
        });

        const data = await res.json();

        if (res.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = "Message sent successfully!";
            contactForm.reset();
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = data.error || "Failed to send message.";
        }
    });
}
}

if (currentPage === 'profile.html') {
    // Profile page functionality
    window.addEventListener('DOMContentLoaded', async () => {
        const email = localStorage.getItem("userEmail");

        const res = await fetch(`${API}/users/profile/?email=${email}`);
        const data = await res.json();
        const user = data.user;
        
        if (!user || !user.email) {
            window.location.href = 'login.html';
            return;
        }
        
        // Display user information
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileDate = document.getElementById('profile-date');
        const avatarInitial = document.getElementById('avatar-initial');
        
        const infoName = document.getElementById('info-name');
        const infoEmail = document.getElementById('info-email');
        const infoDate = document.getElementById('info-date');
        const infoLastLogin = document.getElementById('info-last-login');
        
        // Set avatar initial
        if (user.name) {
            avatarInitial.textContent = user.name.charAt(0).toUpperCase();
        } else if (user.email) {
            avatarInitial.textContent = user.email.charAt(0).toUpperCase();
        }
        
        // Set profile information
        if (profileName) profileName.textContent = user.name || 'User';
        if (profileEmail) profileEmail.textContent = user.email;
        if (infoName) infoName.textContent = user.name || 'Not set';
        if (infoEmail) infoEmail.textContent = user.email;
        
        // Format dates
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                 month: 'long', 
                day: 'numeric' 
            });
        };
        
        if (user.creationDate) {
            if (profileDate) profileDate.textContent = `Member since: ${formatDate(user.creationDate)}`;
            if (infoDate) infoDate.textContent = formatDate(user.creationDate);
            if (infoLastLogin) infoLastLogin.textContent = formatDate(user.loginDate || user.creationDate);
        } else {
            if (profileDate) profileDate.textContent = 'Member since: Recently';
            if (infoDate) infoDate.textContent = 'Recently';
            if (infoLastLogin) infoLastLogin.textContent = 'Recently';
        }
        
        // Update nav profile name and avatar
        const navProfileName = document.querySelector('.profile-name');
        if (navProfileName) {
            navProfileName.textContent = user.name || 'User Name';
        }
        const navProfileImage = document.querySelector('.profile-image-nav');
        if (navProfileImage) {
            navProfileImage.textContent = (user.name || user.email || 'U').charAt(0).toUpperCase();
        }
        
        // Calculate translation statistics
        (async () => {
            const history = await getHistory();

            const totalTranslations = history.length;
            const corporateCount = history.filter(item => item.tone === 'corporate').length;
            const academicCount = history.filter(item => item.tone === 'academic').length;
            const formalCount = history.filter(item => item.tone === 'formal').length;

            document.getElementById('total-translations').textContent = totalTranslations;
            document.getElementById('corporate-count').textContent = corporateCount;
            document.getElementById('academic-count').textContent = academicCount;
            document.getElementById('formal-count').textContent = formalCount;
        })();
        
        // Edit Profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
     if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        const modal = document.getElementById('edit-profile-modal');
        const form = document.getElementById('edit-profile-form');
        const nameInput = document.getElementById('edit-name');
        const cancelBtn = document.getElementById('cancel-edit');

        if (nameInput) nameInput.value = user.name || '';
        if (modal) modal.classList.add('show');

        const cancelHandler = () => {
            if (modal) modal.classList.remove('show');
            if (form) form.reset();
        };

        if (cancelBtn) {
            cancelBtn.addEventListener('click', cancelHandler);
        }

        const submitHandler = async (e) => {
            e.preventDefault();

            const newName = nameInput.value.trim();
            if (!newName) return;

            await fetch(`${API}/users/update/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: localStorage.getItem("userEmail"),
                    name: newName
                })
            });

            // Update UI immediately
            document.getElementById('profile-name').textContent = newName;
            document.getElementById('info-name').textContent = newName;
            document.getElementById('avatar-initial').textContent = newName.charAt(0).toUpperCase();

            const navProfileName = document.querySelector('.profile-name');
            if (navProfileName) {
                navProfileName.textContent = newName;
                localStorage.setItem("userName", newName);
            }

            const navProfileImage = document.querySelector('.profile-image-nav');
            if (navProfileImage) navProfileImage.textContent = newName.charAt(0).toUpperCase();

            cancelHandler();
        };

        if (form) {
            form.addEventListener('submit', submitHandler);
        }

        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', cancelHandler);
        }
    });
}
                

        // Change Password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                const modal = document.getElementById('change-password-modal');
                const form = document.getElementById('change-password-form');
                const errorDiv = document.getElementById('password-error');
                const oldPasswordInput = document.getElementById('old-password');
                const newPasswordInput = document.getElementById('new-password');
                const confirmPasswordInput = document.getElementById('confirm-password');
                const cancelBtn = document.getElementById('cancel-password');
                
                // Clear form and error
                form.reset();
                if (errorDiv) errorDiv.style.display = 'none';
                
                // Show modal
                if (modal) modal.classList.add('show');
                
                // Handle cancel
                const cancelHandler = () => {
                    if (modal) modal.classList.remove('show');
                    form.reset();
                    if (errorDiv) errorDiv.style.display = 'none';
                };
                
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', cancelHandler);
                }
                
                // Password validation function
                const validatePassword = (password) => {
                    const minLength = password.length >= 8;
                    const hasUppercase = /[A-Z]/.test(password);
                    const hasNumber = /\d/.test(password);
                    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
                    return { minLength, hasUppercase, hasNumber, hasSpecial, isValid: minLength && hasUppercase && hasNumber && hasSpecial };
                };
                
                // Update password requirements display
                const updateRequirements = (password) => {
                    const validation = validatePassword(password);
                    document.querySelector('[data-requirement="length"]').className = `requirement ${validation.minLength ? 'valid' : 'invalid'}`;
                    document.querySelector('[data-requirement="uppercase"]').className = `requirement ${validation.hasUppercase ? 'valid' : 'invalid'}`;
                    document.querySelector('[data-requirement="number"]').className = `requirement ${validation.hasNumber ? 'valid' : 'invalid'}`;
                    document.querySelector('[data-requirement="special"]').className = `requirement ${validation.hasSpecial ? 'valid' : 'invalid'}`;
                };
                
                // Add real-time validation
                newPasswordInput.addEventListener('input', (e) => {
                    updateRequirements(e.target.value);
                });
                
                // Handle form submit
                const submitHandler = async (e) => {
                    e.preventDefault();
                    
                    const oldPassword = oldPasswordInput.value;
                    const newPassword = newPasswordInput.value;
                    const confirmPassword = confirmPasswordInput.value;
                    
                    // Hide previous error
                    if (errorDiv) errorDiv.style.display = 'none';
                    
                    // Verify old password
                   await fetch(`${API}/users/change-password/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                        email: localStorage.getItem("userEmail"),
                        old_password: oldPassword,
                        new_password: newPassword
                    })
                });
                    
                    // Validate new password
                    const validation = validatePassword(newPassword);
                    if (!validation.isValid) {
                        let message = 'Password must meet the following requirements:';
                        if (!validation.minLength) message += '\n• Be at least 8 characters long';
                        if (!validation.hasUppercase) message += '\n• Contain at least 1 uppercase letter';
                        if (!validation.hasNumber) message += '\n• Contain at least 1 number';
                        if (!validation.hasSpecial) message += '\n• Contain at least 1 special character';
                        if (errorDiv) {
                            errorDiv.textContent = message;
                            errorDiv.style.display = 'block';
                        }
                        return;
                    }
                    
                    // Check confirmation
                    if (newPassword !== confirmPassword) {
                        if (errorDiv) {
                            errorDiv.textContent = 'New passwords do not match!';
                            errorDiv.style.display = 'block';
                        }
                        return;
                    }
                    
                    const res = await fetch(`${API}/users/change-password/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    email: localStorage.getItem("userEmail"),
                    old_password: oldPassword,
                    new_password: newPassword
                  })
                });

const data = await res.json();

if (!res.ok) {
    errorDiv.textContent = data.error || "Password change failed.";
    errorDiv.style.display = 'block';
    return;
}

// Success → logout
localStorage.clear();
window.location.href = "login.html";
                    cancelHandler();
                };
                
                if (form) {
                    form.addEventListener('submit', submitHandler);
                }
                
                // Close modal when clicking overlay
                const overlay = modal.querySelector('.modal-overlay');
                if (overlay) {
                    overlay.addEventListener('click', cancelHandler);
                }
            });
        }
        
        // Password visibility toggle (added once for profile page)
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = btn.dataset.target;
                const input = document.getElementById(targetId);
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    const eyeIcon = btn.querySelector('.eye-icon');
                    if (eyeIcon) {
                        eyeIcon.innerHTML = isPassword 
                            ? `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.44 21.44 0 0 1 5.06-6.94"></path><path d="M1 1l22 22"></path>`
                            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
                    }
                }
            });
        });
        
        // Delete Account button
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', deleteAccount);
        }

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Show confirmation dialog
function showClearConfirmation() {
    document.getElementById('confirmationBackdrop').style.display = 'block';
    document.getElementById('confirmationDialog').style.display = 'block';
}

// Hide confirmation dialog
function hideClearConfirmation() {
    document.getElementById('confirmationBackdrop').style.display = 'none';
    document.getElementById('confirmationDialog').style.display = 'none';
} 
    });
}