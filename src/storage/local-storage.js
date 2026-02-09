/**
 * Local storage wrapper with encryption support
 */

import Browser from '../utils/browser-polyfill.js';

const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_EMAIL: 'user_email',
    DEVICE_ID: 'device_id',
    LAST_SYNC: 'last_sync_timestamp',
    SYNC_QUEUE: 'sync_queue',
    SETTINGS: 'user_settings',
    VAULT_BACKUP: 'vault_backup' // Automatic backup storage
};

/**
 * Save authentication tokens
 */
export async function saveAuthTokens(accessToken, refreshToken) {
    await Browser.storage.local.set({
        [STORAGE_KEYS.AUTH_TOKEN]: accessToken,
        [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken
    });
}

/**
 * Get authentication tokens
 */
export async function getAuthTokens() {
    const result = await Browser.storage.local.get([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN
    ]);

    return {
        accessToken: result[STORAGE_KEYS.AUTH_TOKEN],
        refreshToken: result[STORAGE_KEYS.REFRESH_TOKEN]
    };
}

/**
 * Clear authentication tokens
 */
export async function clearAuthTokens() {
    await Browser.storage.local.remove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN
    ]);
}

/**
 * Save user email
 */
export async function saveUserEmail(email) {
    await Browser.storage.local.set({ [STORAGE_KEYS.USER_EMAIL]: email });
}

/**
 * Get user email
 */
export async function getUserEmail() {
    const result = await Browser.storage.local.get(STORAGE_KEYS.USER_EMAIL);
    return result[STORAGE_KEYS.USER_EMAIL];
}

/**
 * Get or create device ID
 */
export async function getDeviceId() {
    let result = await Browser.storage.local.get(STORAGE_KEYS.DEVICE_ID);

    if (!result[STORAGE_KEYS.DEVICE_ID]) {
        const deviceId = crypto.randomUUID();
        await Browser.storage.local.set({ [STORAGE_KEYS.DEVICE_ID]: deviceId });
        return deviceId;
    }

    return result[STORAGE_KEYS.DEVICE_ID];
}

/**
 * Save last sync timestamp
 */
export async function saveLastSyncTimestamp(timestamp) {
    await Browser.storage.local.set({ [STORAGE_KEYS.LAST_SYNC]: timestamp });
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTimestamp() {
    const result = await Browser.storage.local.get(STORAGE_KEYS.LAST_SYNC);
    return result[STORAGE_KEYS.LAST_SYNC] || null;
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item) {
    const result = await Browser.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
    const queue = result[STORAGE_KEYS.SYNC_QUEUE] || [];

    queue.push({
        ...item,
        queuedAt: new Date().toISOString()
    });

    await Browser.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: queue });
}

/**
 * Get sync queue
 */
export async function getSyncQueue() {
    const result = await Browser.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
    return result[STORAGE_KEYS.SYNC_QUEUE] || [];
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue() {
    await Browser.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: [] });
}

/**
 * Save user settings
 */
export async function saveSettings(settings) {
    await Browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
}

/**
 * Get user settings
 */
export async function getSettings() {
    const result = await Browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    return result[STORAGE_KEYS.SETTINGS] || {
        autoLockMinutes: 15,
        syncFrequencyMinutes: 5,
        conflictResolution: 'last-write-wins',
        darkMode: true,
        autoFillEnabled: true
    };
}

/**
 * Create automatic backup of vault
 * Keeps last 5 backups with timestamps
 */
export async function createBackup(encryptedVault) {
    try {
        const result = await Browser.storage.local.get(STORAGE_KEYS.VAULT_BACKUP);
        const backups = result[STORAGE_KEYS.VAULT_BACKUP] || [];

        // Add new backup with timestamp
        const newBackup = {
            timestamp: new Date().toISOString(),
            data: encryptedVault
        };

        backups.push(newBackup);

        // Keep only last 5 backups
        const recentBackups = backups.slice(-5);

        await Browser.storage.local.set({
            [STORAGE_KEYS.VAULT_BACKUP]: recentBackups
        });

        console.log(`✅ Automatic backup created. Total backups: ${recentBackups.length}`);
    } catch (error) {
        console.error('Backup creation failed:', error);
        // Don't throw - backup failure shouldn't break vault save
    }
}

/**
 * Get all vault backups
 */
export async function getBackups() {
    const result = await Browser.storage.local.get(STORAGE_KEYS.VAULT_BACKUP);
    return result[STORAGE_KEYS.VAULT_BACKUP] || [];
}

/**
 * Restore vault from backup
 */
export async function restoreFromBackup(backupIndex) {
    const backups = await getBackups();
    if (backupIndex >= 0 && backupIndex < backups.length) {
        return backups[backupIndex].data;
    }
    throw new Error('Invalid backup index');
}

/**
 * Clear all storage (logout)
 */
export async function clearAllStorage() {
    await Browser.storage.local.clear();
}


/**
 * Export all data (vault + backups) for manual backup
 * @returns {Promise<Object>} - All data
 */
export async function exportAllData() {
    try {
        const allData = await Browser.storage.local.get(null);
        return {
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
            data: allData
        };
    } catch (error) {
        console.error('Export data error:', error);
        throw error;
    }
}

/**
 * Import all data from manual backup
 * @param {Object} importData - Data to import
 */
export async function importAllData(importData) {
    try {
        if (!importData.data) {
            throw new Error('Invalid import data');
        }

        await Browser.storage.local.set(importData.data);
        console.log('Data imported successfully');
    } catch (error) {
        console.error('Import data error:', error);
        throw error;
    }
}
