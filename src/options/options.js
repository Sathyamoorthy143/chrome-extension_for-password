// Options page functionality
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    await loadUserInfo();
    setupEventListeners();
});

/**
 * Load current settings from storage
 */
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get({
            syncPasswords: true,
            syncBookmarks: true,
            autoSync: true,
            syncInterval: 5,
            masterPassword: false,
            autoLock: false,
            lockTimeout: 15,
            apiUrl: 'http://localhost:3000'
        });

        // Populate form fields
        document.getElementById('sync-passwords').checked = settings.syncPasswords;
        document.getElementById('sync-bookmarks').checked = settings.syncBookmarks;
        document.getElementById('auto-sync').checked = settings.autoSync;
        document.getElementById('sync-interval').value = settings.syncInterval;
        document.getElementById('master-password').checked = settings.masterPassword;
        document.getElementById('auto-lock').checked = settings.autoLock;
        document.getElementById('lock-timeout').value = settings.lockTimeout;
        document.getElementById('api-url').value = settings.apiUrl;
    } catch (error) {
        console.error('Failed to load settings:', error);
        showStatus('Failed to load settings', 'error');
    }
}

/**
 * Load user information
 */
async function loadUserInfo() {
    try {
        const { user, lastSync } = await chrome.storage.local.get(['user', 'lastSync']);

        if (user && user.email) {
            document.getElementById('user-email').textContent = user.email;
            document.getElementById('account-status').textContent = 'Active';
            document.getElementById('account-status').style.color = '#10b981';
            document.getElementById('logout-btn').style.display = 'inline-block';
        } else {
            document.getElementById('user-email').textContent = 'Not logged in';
            document.getElementById('account-status').textContent = 'Inactive';
            document.getElementById('account-status').style.color = '#ef4444';
        }

        if (lastSync) {
            const date = new Date(lastSync);
            document.getElementById('last-sync').textContent = date.toLocaleString();
        }
    } catch (error) {
        console.error('Failed to load user info:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Save button
    document.getElementById('save-btn').addEventListener('click', saveSettings);

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Export data
    document.getElementById('export-data-btn').addEventListener('click', exportData);

    // Import data
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importData);

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', clearData);
}

/**
 * Save settings
 */
async function saveSettings() {
    try {
        const settings = {
            syncPasswords: document.getElementById('sync-passwords').checked,
            syncBookmarks: document.getElementById('sync-bookmarks').checked,
            autoSync: document.getElementById('auto-sync').checked,
            syncInterval: parseInt(document.getElementById('sync-interval').value),
            masterPassword: document.getElementById('master-password').checked,
            autoLock: document.getElementById('auto-lock').checked,
            lockTimeout: parseInt(document.getElementById('lock-timeout').value),
            apiUrl: document.getElementById('api-url').value.trim()
        };

        // Validate
        if (settings.syncInterval < 1 || settings.syncInterval > 60) {
            showStatus('Sync interval must be between 1 and 60 minutes', 'error');
            return;
        }

        if (settings.lockTimeout < 1 || settings.lockTimeout > 60) {
            showStatus('Lock timeout must be between 1 and 60 minutes', 'error');
            return;
        }

        if (!settings.apiUrl) {
            showStatus('API URL is required', 'error');
            return;
        }

        await chrome.storage.sync.set(settings);

        // Notify background script of settings change
        chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings });

        showStatus('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Failed to save settings:', error);
        showStatus('Failed to save settings', 'error');
    }
}

/**
 * Logout user
 */
async function logout() {
    if (!confirm('Are you sure you want to logout? Your local data will remain on this device.')) {
        return;
    }

    try {
        // Clear auth tokens
        await chrome.storage.local.remove(['user', 'accessToken', 'refreshToken']);

        // Notify background script
        chrome.runtime.sendMessage({ type: 'LOGOUT' });

        showStatus('Logged out successfully', 'success');

        // Reload user info
        await loadUserInfo();
    } catch (error) {
        console.error('Logout failed:', error);
        showStatus('Logout failed', 'error');
    }
}

/**
 * Export data
 */
async function exportData() {
    try {
        const data = await chrome.storage.local.get(['passwords', 'bookmarks', 'user']);

        const exportData = {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            user: data.user,
            passwords: data.passwords || [],
            bookmarks: data.bookmarks || []
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `securesync-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showStatus('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showStatus('Export failed', 'error');
    }
}

/**
 * Import data
 */
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate data structure
        if (!data.version || !data.passwords || !data.bookmarks) {
            throw new Error('Invalid backup file format');
        }

        if (!confirm('This will overwrite your current local data. Continue?')) {
            return;
        }

        // Import data
        await chrome.storage.local.set({
            passwords: data.passwords,
            bookmarks: data.bookmarks
        });

        showStatus('Data imported successfully!', 'success');
    } catch (error) {
        console.error('Import failed:', error);
        showStatus('Import failed: ' + error.message, 'error');
    } finally {
        event.target.value = ''; // Reset file input
    }
}

/**
 * Clear all local data
 */
async function clearData() {
    if (!confirm('⚠️ WARNING: This will permanently delete all your local passwords and bookmarks. This action cannot be undone. Continue?')) {
        return;
    }

    if (!confirm('Are you ABSOLUTELY sure? This will delete everything!')) {
        return;
    }

    try {
        await chrome.storage.local.remove(['passwords', 'bookmarks', 'lastSync']);
        showStatus('All local data cleared', 'success');
    } catch (error) {
        console.error('Clear data failed:', error);
        showStatus('Failed to clear data', 'error');
    }
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;

    setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'status-message';
    }, 5000);
}
