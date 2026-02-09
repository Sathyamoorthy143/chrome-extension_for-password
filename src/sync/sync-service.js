/**
 * Sync service for bidirectional synchronization of passwords and bookmarks
 */

import { getPasswords, getBookmarks, addPassword, addBookmark, updatePassword, updateBookmark } from '../crypto/vault.js';
import { fetchPasswords, fetchBookmarks, uploadPasswords, uploadBookmarks } from './api-client.js';
import { mergeItems } from './conflict-resolver.js';
import { getLastSyncTimestamp, saveLastSyncTimestamp, getSyncQueue, clearSyncQueue, addToSyncQueue, getSettings } from '../storage/local-storage.js';
import { isAuthenticated } from '../auth/auth-service.js';

let isSyncing = false;

/**
 * Perform full bidirectional sync
 * @returns {Promise<Object>} - Sync result
 */
export async function performSync() {
    if (isSyncing) {
        console.log('Sync already in progress');
        return { status: 'in_progress' };
    }

    if (!await isAuthenticated()) {
        throw new Error('Not authenticated. Please login first.');
    }

    isSyncing = true;

    try {
        const lastSync = await getLastSyncTimestamp();
        const settings = await getSettings();

        // Sync passwords
        const passwordResult = await syncPasswords(lastSync, settings.conflictResolution);

        // Sync bookmarks
        const bookmarkResult = await syncBookmarks(lastSync, settings.conflictResolution);

        // Process sync queue (offline changes)
        await processSyncQueue();

        // Update last sync timestamp
        const now = new Date().toISOString();
        await saveLastSyncTimestamp(now);

        isSyncing = false;

        return {
            status: 'success',
            timestamp: now,
            passwords: passwordResult,
            bookmarks: bookmarkResult
        };
    } catch (error) {
        isSyncing = false;
        console.error('Sync error:', error);
        throw error;
    }
}

/**
 * Sync passwords
 */
async function syncPasswords(lastSync, conflictResolution) {
    try {
        // Get local passwords
        const localPasswords = await getPasswords();

        // Fetch remote passwords
        const remotePasswords = await fetchPasswords(lastSync);

        // Merge and resolve conflicts
        const { merged, conflicts } = mergeItems(localPasswords, remotePasswords, conflictResolution);

        // Update local vault with merged data
        // (In a real implementation, you'd update the vault more efficiently)

        // Upload merged data to server
        await uploadPasswords(merged);

        return {
            synced: merged.length,
            conflicts: conflicts.length
        };
    } catch (error) {
        console.error('Password sync error:', error);
        throw error;
    }
}

/**
 * Sync bookmarks
 */
async function syncBookmarks(lastSync, conflictResolution) {
    try {
        // Get local bookmarks
        const localBookmarks = await getBookmarks();

        // Fetch remote bookmarks
        const remoteBookmarks = await fetchBookmarks(lastSync);

        // Merge and resolve conflicts
        const { merged, conflicts } = mergeItems(localBookmarks, remoteBookmarks, conflictResolution);

        // Upload merged data to server
        await uploadBookmarks(merged);

        return {
            synced: merged.length,
            conflicts: conflicts.length
        };
    } catch (error) {
        console.error('Bookmark sync error:', error);
        throw error;
    }
}

/**
 * Process offline sync queue
 */
async function processSyncQueue() {
    const queue = await getSyncQueue();

    if (queue.length === 0) {
        return;
    }

    for (const item of queue) {
        try {
            if (item.type === 'password') {
                if (item.action === 'add') {
                    await addPassword(item.data);
                } else if (item.action === 'update') {
                    await updatePassword(item.data.id, item.data);
                }
            } else if (item.type === 'bookmark') {
                if (item.action === 'add') {
                    await addBookmark(item.data);
                } else if (item.action === 'update') {
                    await updateBookmark(item.data.id, item.data);
                }
            }
        } catch (error) {
            console.error('Queue item processing error:', error);
        }
    }

    // Clear queue after processing
    await clearSyncQueue();
}

/**
 * Queue item for sync (when offline)
 */
export async function queueForSync(type, action, data) {
    await addToSyncQueue({ type, action, data });
}

/**
 * Check if sync is in progress
 */
export function isSyncInProgress() {
    return isSyncing;
}
