/**
 * Popup UI logic
 */

import Browser from '../utils/browser-polyfill.js';
import { isVaultLocked, initializeVault, lockVault, getPasswords } from '../crypto/vault.js';
import { isAuthenticated } from '../auth/auth-service.js';

// DOM elements
let lockedView, unlockedView, loginView, setupView;
let unlockForm, masterPasswordInput, unlockError, showHintBtn, masterHintDisplay;
let setupForm, setupPassword, setupPasswordConfirm, setupError;
let passwordList, emptyState, searchInput;
let syncBtn, lockBtn, addPasswordBtn, openSettingsBtn, gotoLoginBtn, exportVaultBtn, logoutBtn;
let syncStatus;
let addPasswordModal, addPasswordForm, closeModalBtn, cancelAddBtn;
let manualWebsite, manualUsername, manualPassword, manualNotes, addPasswordError;

let unlockAttempts = 0;

/**
 * Initialize popup
 */
async function initialize() {
    // Get DOM elements
    lockedView = document.getElementById('locked-view');
    unlockedView = document.getElementById('unlocked-view');
    loginView = document.getElementById('login-view');
    setupView = document.getElementById('setup-view');

    unlockForm = document.getElementById('unlock-form');
    masterPasswordInput = document.getElementById('master-password');
    unlockError = document.getElementById('unlock-error');
    showHintBtn = document.getElementById('show-hint-btn');
    masterHintDisplay = document.getElementById('master-hint-display');

    setupForm = document.getElementById('setup-form');
    setupPassword = document.getElementById('setup-password');
    setupPasswordConfirm = document.getElementById('setup-password-confirm');
    setupError = document.getElementById('setup-error');

    passwordList = document.getElementById('password-list');
    emptyState = document.getElementById('empty-state');
    searchInput = document.getElementById('search-input');

    syncBtn = document.getElementById('sync-btn');
    lockBtn = document.getElementById('lock-btn');
    addPasswordBtn = document.getElementById('add-password-btn');
    openSettingsBtn = document.getElementById('open-settings-btn');
    gotoLoginBtn = document.getElementById('goto-login-btn');
    exportVaultBtn = document.getElementById('export-vault-btn');
    logoutBtn = document.getElementById('logout-btn');
    syncStatus = document.getElementById('sync-status');

    // Modal elements
    addPasswordModal = document.getElementById('add-password-modal');
    addPasswordForm = document.getElementById('add-password-form');
    closeModalBtn = document.getElementById('close-modal-btn');
    cancelAddBtn = document.getElementById('cancel-add-btn');
    manualWebsite = document.getElementById('manual-website');
    manualUsername = document.getElementById('manual-username');
    manualPassword = document.getElementById('manual-password');
    manualNotes = document.getElementById('manual-notes');
    addPasswordError = document.getElementById('add-password-error');

    // Attach event listeners
    unlockForm.addEventListener('submit', handleUnlock);
    setupForm.addEventListener('submit', handleSetup);
    if (showHintBtn) showHintBtn.addEventListener('click', handleShowHint);
    lockBtn.addEventListener('click', handleLock);
    syncBtn.addEventListener('click', handleSync);
    searchInput.addEventListener('input', handleSearch);
    addPasswordBtn.addEventListener('click', openAddPasswordModal);
    openSettingsBtn.addEventListener('click', openSettings);
    gotoLoginBtn.addEventListener('click', openSettings);
    exportVaultBtn.addEventListener('click', handleExportVault);
    logoutBtn.addEventListener('click', handleLogout);
    addPasswordForm.addEventListener('submit', handleAddPassword);
    closeModalBtn.addEventListener('click', closeAddPasswordModal);
    cancelAddBtn.addEventListener('click', closeAddPasswordModal);

    // Initialize all password toggle buttons
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

    // Listen for sync completion
    Browser.runtime.onMessage.addListener((message) => {
        if (message.type === 'SYNC_COMPLETED') {
            hideSyncStatus();
            loadPasswords();
        }
    });

    // Check authentication and vault status
    await checkStatus();
}

/**
 * Check authentication and vault status
 */
async function checkStatus() {
    const authenticated = await isAuthenticated();
    console.log('Authentication check result:', authenticated);

    if (!authenticated) {
        console.log('User not authenticated, showing login view');
        showView('login');
        return;
    }

    // Check if vault exists
    const stored = await Browser.storage.local.get('secure_vault');
    if (!stored.secure_vault) {
        showView('setup');
        return;
    }

    const locked = await isVaultLocked();

    if (locked) {
        showView('locked');
    } else {
        showView('unlocked');
        await loadPasswords();
    }
}

/**
 * Show specific view
 */
function showView(view) {
    lockedView.classList.add('hidden');
    unlockedView.classList.add('hidden');
    loginView.classList.add('hidden');
    setupView.classList.add('hidden');

    if (view === 'locked') {
        lockedView.classList.remove('hidden');
        masterPasswordInput.focus();
        // Reset unlock attempts and hide hint
        unlockAttempts = 0;
        if (showHintBtn) showHintBtn.classList.add('hidden');
        if (masterHintDisplay) masterHintDisplay.classList.add('hidden');
    } else if (view === 'unlocked') {
        unlockedView.classList.remove('hidden');
    } else if (view === 'login') {
        loginView.classList.remove('hidden');
    } else if (view === 'setup') {
        setupView.classList.remove('hidden');
        setupPassword.focus();
    }
}

/**
 * Handle unlock form submission
 */
async function handleUnlock(e) {
    e.preventDefault();

    const masterPassword = masterPasswordInput.value;

    try {
        await initializeVault(masterPassword);
        masterPasswordInput.value = '';
        unlockError.classList.add('hidden');
        showView('unlocked');
        await loadPasswords();
    } catch (error) {
        unlockAttempts++;
        unlockError.textContent = 'Invalid master password';
        unlockError.classList.remove('hidden');
        masterPasswordInput.select();

        // Show hint button after 3 failed attempts
        if (unlockAttempts >= 3 && showHintBtn) {
            showHintBtn.classList.remove('hidden');
        }
    }
}

/**
 * Handle setup form submission
 */
async function handleSetup(e) {
    e.preventDefault();

    const password = setupPassword.value;
    const confirm = setupPasswordConfirm.value;

    if (password !== confirm) {
        setupError.textContent = 'Passwords do not match';
        setupError.classList.remove('hidden');
        return;
    }

    try {
        await initializeVault(password);
        showView('unlocked');
        showToast('✅ Vault created successfully!');
    } catch (error) {
        setupError.textContent = `Setup failed: ${error.message}`;
        setupError.classList.remove('hidden');
    }
}

/**
 * Handle show hint button click
 */
async function handleShowHint() {
    try {
        const { forgotPassword } = await import('../auth/auth-service.js');
        const email = await Browser.storage.local.get('user_email');

        if (!email.user_email) {
            masterHintDisplay.textContent = 'Hint: Email not found.';
        } else {
            const hints = await forgotPassword(email.user_email);
            if (hints.masterPasswordHint) {
                masterHintDisplay.textContent = `💡 Your Hint: ${hints.masterPasswordHint}`;
            } else {
                masterHintDisplay.textContent = '💡 No hint available for this vault.';
            }
        }
        masterHintDisplay.classList.remove('hidden');
        showHintBtn.classList.add('hidden');
    } catch (error) {
        console.error('Show hint error:', error);
        masterHintDisplay.textContent = '❌ Could not retrieve hint.';
        masterHintDisplay.classList.remove('hidden');
    }
}

/**
 * Handle lock button click
 */
async function handleLock() {
    await lockVault();
    showView('locked');
}

/**
 * Handle sync button click
 */
async function handleSync() {
    showSyncStatus();

    try {
        await Browser.runtime.sendMessage({ type: 'SYNC_NOW' });
    } catch (error) {
        console.error('Sync error:', error);
        hideSyncStatus();
    }
}

/**
 * Handle logout button click
 */
async function handleLogout() {
    try {
        // Import logout function
        const { logout } = await import('../auth/auth-service.js');

        // Lock vault first
        await handleLock();

        // Logout from backend
        await logout();

        // Show login view
        showView('login');

        showToast('✅ Logged out successfully');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('❌ Logout failed');
    }
}

/**
 * Load and display passwords
 */
async function loadPasswords(filter = '') {
    try {
        const passwords = await getPasswords();

        // Filter out deleted passwords
        const activePasswords = passwords.filter(p => !p.deletedAt);

        // Apply search filter
        const filtered = filter
            ? activePasswords.filter(p =>
                p.url.toLowerCase().includes(filter.toLowerCase()) ||
                p.username.toLowerCase().includes(filter.toLowerCase())
            )
            : activePasswords;

        if (filtered.length === 0) {
            passwordList.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        passwordList.classList.remove('hidden');
        emptyState.classList.add('hidden');

        // Render password items
        passwordList.innerHTML = filtered.map(p => createPasswordItem(p)).join('');

        // Attach copy button listeners
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const password = e.target.dataset.password;
                copyToClipboard(password);
            });
        });
    } catch (error) {
        console.error('Load passwords error:', error);
    }
}

/**
 * Create password item HTML
 */
function createPasswordItem(password) {
    const domain = new URL(password.url).hostname;

    return `
    <div class="password-item">
      <div class="password-info">
        <div class="password-domain">${domain}</div>
        <div class="password-username">${password.username}</div>
      </div>
      <button class="copy-btn" data-password="${password.password}" title="Copy password">
        📋
      </button>
    </div>
  `;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Password copied!');
    } catch (error) {
        console.error('Copy error:', error);
    }
}

/**
 * Show toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

/**
 * Handle search input
 */
function handleSearch(e) {
    loadPasswords(e.target.value);
}

/**
 * Show sync status
 */
function showSyncStatus() {
    syncStatus.classList.remove('hidden');
    syncBtn.disabled = true;
}

/**
 * Hide sync status
 */
function hideSyncStatus() {
    syncStatus.classList.add('hidden');
    syncBtn.disabled = false;
}

/**
 * Handle export vault button click
 */
async function handleExportVault() {
    try {
        const { exportVault } = await import('../crypto/vault.js');
        const vaultData = await exportVault();

        // Create JSON blob
        const blob = new Blob([JSON.stringify(vaultData, null, 2)], {
            type: 'application/json'
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `securesync-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('✅ Vault exported successfully!');
    } catch (error) {
        console.error('Export vault error:', error);
        showToast('❌ Export failed. Please unlock vault first.');
    }
}

/**
 * Open settings or auth page
 */
async function openSettings() {
    const authenticated = await isAuthenticated();

    // If not authenticated, open auth page for login/signup
    if (!authenticated) {
        Browser.tabs.create({
            url: Browser.runtime.getURL('src/auth/auth.html')
        });
    } else {
        // If authenticated, open settings page
        Browser.tabs.create({
            url: Browser.runtime.getURL('src/options/options.html')
        });
    }
}

/**
 * Open add password modal
 */
function openAddPasswordModal() {
    addPasswordModal.classList.remove('hidden');
    manualWebsite.focus();
    // Clear previous values
    addPasswordForm.reset();
    addPasswordError.classList.add('hidden');
}

/**
 * Close add password modal
 */
function closeAddPasswordModal() {
    addPasswordModal.classList.add('hidden');
    addPasswordForm.reset();
    addPasswordError.classList.add('hidden');
}

/**
 * Handle add password form submission
 */
async function handleAddPassword(e) {
    e.preventDefault();

    const website = manualWebsite.value.trim();
    const username = manualUsername.value.trim();
    const password = manualPassword.value;
    const notes = manualNotes.value.trim();

    if (!website || !username || !password) {
        addPasswordError.textContent = 'Please fill in all required fields';
        addPasswordError.classList.remove('hidden');
        return;
    }

    try {
        const { addPassword } = await import('../crypto/vault.js');

        await addPassword({
            url: website,
            username: username,
            password: password,
            notes: notes || ''
        });

        closeAddPasswordModal();
        await loadPasswords();
        showToast('✅ Password added successfully!');
    } catch (error) {
        console.error('Add password error:', error);
        addPasswordError.textContent = 'Failed to add password. Please try again.';
        addPasswordError.classList.remove('hidden');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
