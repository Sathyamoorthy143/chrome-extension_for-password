/**
 * Authentication UI logic for login and signup
 */

import { signUp, signIn, getCurrentUserEmail, forgotPassword } from './auth-service.js';
import Browser from '../utils/browser-polyfill.js';

// DOM elements
let loginTab, signupTab;
let loginForm, signupForm;
let loginEmail, loginPassword;
let signupEmail, signupPassword, signupPasswordConfirm, signupPasswordHint, signupMasterHint;
let loginBtn, signupBtn, forgotPasswordLink;
let messageBox;

/**
 * Initialize auth page
 */
async function initialize() {
    // Get DOM elements
    loginTab = document.getElementById('login-tab');
    signupTab = document.getElementById('signup-tab');

    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');

    loginEmail = document.getElementById('login-email');
    loginPassword = document.getElementById('login-password');

    signupEmail = document.getElementById('signup-email');
    signupPassword = document.getElementById('signup-password');
    signupPasswordConfirm = document.getElementById('signup-password-confirm');
    signupPasswordHint = document.getElementById('signup-password-hint');
    signupMasterHint = document.getElementById('signup-master-hint');

    loginBtn = document.getElementById('login-btn');
    signupBtn = document.getElementById('signup-btn');
    forgotPasswordLink = document.getElementById('forgot-password-link');

    messageBox = document.getElementById('message');

    // Attach event listeners
    loginTab.addEventListener('click', () => switchTab('login'));
    signupTab.addEventListener('click', () => switchTab('signup'));

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }

    // Initialize password toggle buttons
    initPasswordToggles();

    // Check if already authenticated
    const email = await getCurrentUserEmail();
    if (email) {
        showMessage(`Already logged in as ${email}. Redirecting...`, 'info');
        setTimeout(() => {
            window.close();
        }, 1500);
    }
}

/**
 * Initialize password visibility toggle buttons
 */
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    this.textContent = '🙈';
                    this.title = 'Hide password';
                } else {
                    input.type = 'password';
                    this.textContent = '👁️';
                    this.title = 'Show password';
                }
            }
        });
    });
}

/**
 * Switch between login and signup tabs
 */
function switchTab(tab) {
    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        messageBox.classList.add('hidden');
    } else {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        messageBox.classList.add('hidden');
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email || !password) {
        showMessage('Please enter both email and password', 'error');
        return;
    }

    // Show loading state
    setLoading(loginBtn, true);
    messageBox.classList.add('hidden');

    try {
        await signIn(email, password);

        showMessage('✅ Login successful! Redirecting...', 'success');

        // Redirect to popup after short delay
        setTimeout(() => {
            // Close auth page and open popup
            Browser.action.openPopup().catch(() => {
                // If popup fails, just close the auth page
                window.close();
            });
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showMessage(`❌ ${error.message || 'Login failed. Please check your credentials.'}`, 'error');
    } finally {
        setLoading(loginBtn, false);
    }
}

/**
 * Handle signup form submission
 */
async function handleSignup(e) {
    e.preventDefault();

    const email = signupEmail.value.trim();
    const password = signupPassword.value;
    const passwordConfirm = signupPasswordConfirm.value;

    // Validation
    if (!email || !password || !passwordConfirm) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }

    if (password !== passwordConfirm) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    const passwordHint = signupPasswordHint.value.trim();
    const masterPasswordHint = signupMasterHint.value.trim();

    // Show loading state
    setLoading(signupBtn, true);
    messageBox.classList.add('hidden');

    try {
        await signUp(email, password, passwordHint, masterPasswordHint);

        showMessage('✅ Account created successfully! Redirecting...', 'success');

        // Redirect to popup after short delay
        setTimeout(() => {
            // Close auth page and open popup
            Browser.action.openPopup().catch(() => {
                // If popup fails, just close the auth page
                window.close();
            });
        }, 1500);

    } catch (error) {
        console.error('Signup error:', error);

        // Handle specific error messages
        let errorMessage = 'Signup failed. Please try again.';
        if (error.message.includes('already exists')) {
            errorMessage = 'An account with this email already exists. Please login instead.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        showMessage(`❌ ${errorMessage}`, 'error');
    } finally {
        setLoading(signupBtn, false);
    }
}

/**
 * Handle forgot password link
 */
async function handleForgotPassword(e) {
    e.preventDefault();
    const email = loginEmail.value.trim();

    if (!email) {
        showMessage('Please enter your email first to get hints', 'error');
        return;
    }

    try {
        showMessage('Checking for hints...', 'info');
        const hints = await forgotPassword(email);

        let hintMsg = '💡 Your Hints:\n';
        if (hints.passwordHint) hintMsg += `- Login: ${hints.passwordHint}\n`;
        if (hints.masterPasswordHint) hintMsg += `- Master: ${hints.masterPasswordHint}\n`;

        if (!hints.passwordHint && !hints.masterPasswordHint) {
            hintMsg = '❌ No hints found for this account.';
        }

        showMessage(hintMsg, 'info');
    } catch (error) {
        showMessage(`❌ ${error.message}`, 'error');
    }
}

/**
 * Show message to user
 */
function showMessage(text, type = 'info') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    messageBox.classList.remove('hidden');
}

/**
 * Set loading state for button
 */
function setLoading(button, loading) {
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (loading) {
        button.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
    } else {
        button.disabled = false;
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
