/**
 * Password capture content script
 * Detects login forms and captures credentials
 */

import Browser from '../utils/browser-polyfill.js';

let detectedForms = new Set();

/**
 * Initialize password capture
 */
function initialize() {
    // Detect existing forms
    detectLoginForms();

    // Watch for dynamically added forms
    const observer = new MutationObserver(() => {
        detectLoginForms();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    console.log('Password capture initialized');
}

/**
 * Detect login forms on the page
 */
function detectLoginForms() {
    const forms = document.querySelectorAll('form');

    forms.forEach((form) => {
        if (detectedForms.has(form)) {
            return;
        }

        const passwordField = form.querySelector('input[type="password"]');
        const emailField = form.querySelector('input[type="email"], input[type="text"][name*="email"], input[type="text"][name*="user"]');

        if (passwordField && emailField) {
            detectedForms.add(form);
            attachFormListener(form, emailField, passwordField);
        }
    });
}

/**
 * Attach submit listener to form
 */
function attachFormListener(form, emailField, passwordField) {
    form.addEventListener('submit', async (event) => {
        const email = emailField.value;
        const password = passwordField.value;

        if (email && password) {
            // Show save prompt
            await promptSavePassword({
                url: window.location.origin,
                username: email,
                password: password
            });
        }
    });
}

/**
 * Prompt user to save password
 */
async function promptSavePassword(credentials) {
    // Create a simple overlay prompt
    const overlay = document.createElement('div');
    overlay.id = 'securesync-save-prompt';
    overlay.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 320px;
    animation: slideIn 0.3s ease-out;
  `;

    overlay.innerHTML = `
    <style>
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      #securesync-save-prompt button {
        margin: 8px 8px 0 0;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.2s;
      }
      #securesync-save-prompt button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      #securesync-save-prompt .save-btn {
        background: white;
        color: #667eea;
      }
      #securesync-save-prompt .cancel-btn {
        background: rgba(255,255,255,0.2);
        color: white;
      }
    </style>
    <div style="margin-bottom: 8px; font-weight: 600;">
      🔐 Save password for ${credentials.url}?
    </div>
    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 12px;">
      Username: ${credentials.username}
    </div>
    <div>
      <button class="save-btn">Save</button>
      <button class="cancel-btn">Not now</button>
    </div>
  `;

    document.body.appendChild(overlay);

    // Handle button clicks
    overlay.querySelector('.save-btn').addEventListener('click', async () => {
        try {
            // Send to background script to save
            await Browser.runtime.sendMessage({
                type: 'SAVE_PASSWORD',
                data: credentials
            });

            overlay.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
            overlay.innerHTML = '<div style="font-weight: 600;">✓ Password saved securely!</div>';

            setTimeout(() => {
                overlay.remove();
            }, 2000);
        } catch (error) {
            console.error('Save password error:', error);
            overlay.remove();
        }
    });

    overlay.querySelector('.cancel-btn').addEventListener('click', () => {
        overlay.remove();
    });

    // Auto-dismiss after 15 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 15000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
