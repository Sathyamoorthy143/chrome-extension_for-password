/**
 * Bookmark capture service
 * Listens to browser bookmark events and syncs changes
 */

import Browser from '../utils/browser-polyfill.js';
import { addBookmark, updateBookmark, deleteBookmark } from '../crypto/vault.js';
import { queueForSync } from '../sync/sync-service.js';

/**
 * Initialize bookmark capture
 */
export function initializeBookmarkCapture() {
    // Listen for bookmark creation
    Browser.bookmarks.onCreated.addListener(handleBookmarkCreated);

    // Listen for bookmark changes
    Browser.bookmarks.onChanged.addListener(handleBookmarkChanged);

    // Listen for bookmark removal
    Browser.bookmarks.onRemoved.addListener(handleBookmarkRemoved);

    console.log('Bookmark capture initialized');
}

/**
 * Handle bookmark created event
 */
async function handleBookmarkCreated(id, bookmark) {
    try {
        if (!bookmark.url) {
            // Skip folders
            return;
        }

        const entry = {
            title: bookmark.title,
            url: bookmark.url,
            folder: await getBookmarkPath(bookmark.parentId),
            tags: []
        };

        await addBookmark(entry);
        await queueForSync('bookmark', 'add', entry);

        console.log('Bookmark captured:', entry);
    } catch (error) {
        console.error('Bookmark capture error:', error);
    }
}

/**
 * Handle bookmark changed event
 */
async function handleBookmarkChanged(id, changeInfo) {
    try {
        const bookmark = await Browser.bookmarks.get(id);

        if (!bookmark[0].url) {
            return;
        }

        const updates = {
            title: changeInfo.title || bookmark[0].title,
            url: changeInfo.url || bookmark[0].url
        };

        // Note: In a real implementation, you'd need to map browser bookmark ID to vault ID
        // For now, this is a simplified version
        await queueForSync('bookmark', 'update', updates);

        console.log('Bookmark updated:', updates);
    } catch (error) {
        console.error('Bookmark update error:', error);
    }
}

/**
 * Handle bookmark removed event
 */
async function handleBookmarkRemoved(id, removeInfo) {
    try {
        // Note: Need to map browser bookmark ID to vault ID
        await queueForSync('bookmark', 'delete', { id });

        console.log('Bookmark removed:', id);
    } catch (error) {
        console.error('Bookmark removal error:', error);
    }
}

/**
 * Get bookmark folder path
 */
async function getBookmarkPath(parentId) {
    const path = [];
    let currentId = parentId;

    while (currentId) {
        try {
            const parent = await Browser.bookmarks.get(currentId);

            if (parent[0].title) {
                path.unshift(parent[0].title);
            }

            currentId = parent[0].parentId;
        } catch (error) {
            break;
        }
    }

    return '/' + path.join('/');
}
