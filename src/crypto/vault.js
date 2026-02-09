/**
 * Local encrypted vault for passwords and bookmarks
 */

import { encryptObject, decryptObject } from './encryption.js';
import Browser from '../utils/browser-polyfill.js';

const VAULT_KEY = 'secure_vault';
const VAULT_LOCK_KEY = 'vault_locked';
const AUTO_LOCK_MINUTES = 15;

let vaultCache = null;
let masterPasswordCache = null;
let autoLockTimer = null;

/**
 * Initialize vault (create if doesn't exist)
 */
export async function initializeVault(masterPassword) {
    try {
        const stored = await Browser.storage.local.get(VAULT_KEY);

        if (!stored[VAULT_KEY]) {
            // Create new vault
            const emptyVault = {
                passwords: [],
                bookmarks: [],
                metadata: {
                    createdAt: new Date().toISOString(),
                    version: '1.0.0'
                }
            };

            const encrypted = await encryptObject(emptyVault, masterPassword);
            await Browser.storage.local.set({
                [VAULT_KEY]: encrypted,
                [VAULT_LOCK_KEY]: false
            });
            vaultCache = emptyVault;
        } else {
            // Verify password by attempting to decrypt
            vaultCache = await decryptObject(stored[VAULT_KEY], masterPassword);
        }

        masterPasswordCache = masterPassword;
        await Browser.storage.local.set({ [VAULT_LOCK_KEY]: false });
        resetAutoLockTimer();

        return true;
    } catch (error) {
        console.error('Vault initialization failed:', error);
        throw new Error('Invalid master password or corrupted vault');
    }
}

/**
 * Lock the vault
 */
export async function lockVault() {
    vaultCache = null;
    masterPasswordCache = null;
    clearAutoLockTimer();
    await Browser.storage.local.set({ [VAULT_LOCK_KEY]: true });
}

/**
 * Check if vault is locked
 */
export async function isVaultLocked() {
    const result = await Browser.storage.local.get(VAULT_LOCK_KEY);
    return result[VAULT_LOCK_KEY] !== false;
}

/**
 * Get all passwords from vault
 */
export async function getPasswords() {
    ensureUnlocked();
    resetAutoLockTimer();
    return vaultCache.passwords;
}

/**
 * Add password to vault
 */
export async function addPassword(passwordEntry) {
    ensureUnlocked();

    const entry = {
        id: crypto.randomUUID(),
        ...passwordEntry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    };

    vaultCache.passwords.push(entry);
    await saveVault();
    resetAutoLockTimer();

    return entry;
}

/**
 * Update password in vault
 */
export async function updatePassword(id, updates) {
    ensureUnlocked();

    const index = vaultCache.passwords.findIndex(p => p.id === id);
    if (index === -1) {
        throw new Error('Password not found');
    }

    vaultCache.passwords[index] = {
        ...vaultCache.passwords[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await saveVault();
    resetAutoLockTimer();

    return vaultCache.passwords[index];
}

/**
 * Delete password from vault
 */
export async function deletePassword(id) {
    ensureUnlocked();

    const index = vaultCache.passwords.findIndex(p => p.id === id);
    if (index === -1) {
        throw new Error('Password not found');
    }

    // Soft delete
    vaultCache.passwords[index].deletedAt = new Date().toISOString();
    await saveVault();
    resetAutoLockTimer();
}

/**
 * Get all bookmarks from vault
 */
export async function getBookmarks() {
    ensureUnlocked();
    resetAutoLockTimer();
    return vaultCache.bookmarks;
}

/**
 * Add bookmark to vault
 */
export async function addBookmark(bookmarkEntry) {
    ensureUnlocked();

    const entry = {
        id: crypto.randomUUID(),
        ...bookmarkEntry,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null
    };

    vaultCache.bookmarks.push(entry);
    await saveVault();
    resetAutoLockTimer();

    return entry;
}

/**
 * Update bookmark in vault
 */
export async function updateBookmark(id, updates) {
    ensureUnlocked();

    const index = vaultCache.bookmarks.findIndex(b => b.id === id);
    if (index === -1) {
        throw new Error('Bookmark not found');
    }

    vaultCache.bookmarks[index] = {
        ...vaultCache.bookmarks[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await saveVault();
    resetAutoLockTimer();

    return vaultCache.bookmarks[index];
}

/**
 * Delete bookmark from vault
 */
export async function deleteBookmark(id) {
    ensureUnlocked();

    const index = vaultCache.bookmarks.findIndex(b => b.id === id);
    if (index === -1) {
        throw new Error('Bookmark not found');
    }

    // Soft delete
    vaultCache.bookmarks[index].deletedAt = new Date().toISOString();
    await saveVault();
    resetAutoLockTimer();
}

/**
 * Save vault to storage (encrypted)
 */
async function saveVault() {
    ensureUnlocked();

    const encrypted = await encryptObject(vaultCache, masterPasswordCache);
    await Browser.storage.local.set({ [VAULT_KEY]: encrypted });

    // Create automatic backup
    const { createBackup } = await import('../storage/local-storage.js');
    await createBackup(encrypted);
}

/**
 * Ensure vault is unlocked
 */
function ensureUnlocked() {
    if (!vaultCache || !masterPasswordCache) {
        throw new Error('Vault is locked. Please unlock first.');
    }
}

/**
 * Reset auto-lock timer
 */
function resetAutoLockTimer() {
    clearAutoLockTimer();

    autoLockTimer = setTimeout(() => {
        lockVault();
    }, AUTO_LOCK_MINUTES * 60 * 1000);
}

/**
 * Clear auto-lock timer
 */
function clearAutoLockTimer() {
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }
}

/**
 * Export vault data (encrypted)
 */
export async function exportVault() {
    ensureUnlocked();
    const encrypted = await encryptObject(vaultCache, masterPasswordCache);
    return encrypted;
}

/**
 * Import vault data (encrypted)
 */
export async function importVault(encryptedData, masterPassword) {
    const vault = await decryptObject(encryptedData, masterPassword);
    vaultCache = vault;
    masterPasswordCache = masterPassword;
    await saveVault();
}
