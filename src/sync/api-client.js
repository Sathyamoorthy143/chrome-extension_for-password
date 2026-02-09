/**
 * API client for syncing passwords and bookmarks with backend
 */

import { authenticatedFetch } from '../auth/auth-service.js';
import { getDeviceId } from '../storage/local-storage.js';

const API_BASE_URL = 'https://securesync-backend-ww8n.onrender.com/api';
/**
 * Fetch encrypted passwords from server
 * @param {string} lastSyncTimestamp - Optional timestamp for delta sync
 * @returns {Promise<Array>} - Array of encrypted password entries
 */
export async function fetchPasswords(lastSyncTimestamp = null) {
    try {
        const url = lastSyncTimestamp
            ? `${API_BASE_URL}/sync/passwords?since=${lastSyncTimestamp}`
            : `${API_BASE_URL}/sync/passwords`;

        const response = await authenticatedFetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch passwords');
        }

        const data = await response.json();
        return data.passwords || [];
    } catch (error) {
        console.error('Fetch passwords error:', error);
        throw error;
    }
}

/**
 * Upload encrypted passwords to server
 * @param {Array} passwords - Array of encrypted password entries
 * @returns {Promise<Object>} - Sync result
 */
export async function uploadPasswords(passwords) {
    try {
        const deviceId = await getDeviceId();

        const response = await authenticatedFetch(`${API_BASE_URL}/sync/passwords`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                passwords,
                deviceId,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload passwords');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload passwords error:', error);
        throw error;
    }
}

/**
 * Fetch encrypted bookmarks from server
 * @param {string} lastSyncTimestamp - Optional timestamp for delta sync
 * @returns {Promise<Array>} - Array of encrypted bookmark entries
 */
export async function fetchBookmarks(lastSyncTimestamp = null) {
    try {
        const url = lastSyncTimestamp
            ? `${API_BASE_URL}/sync/bookmarks?since=${lastSyncTimestamp}`
            : `${API_BASE_URL}/sync/bookmarks`;

        const response = await authenticatedFetch(url);

        if (!response.ok) {
            throw new Error('Failed to fetch bookmarks');
        }

        const data = await response.json();
        return data.bookmarks || [];
    } catch (error) {
        console.error('Fetch bookmarks error:', error);
        throw error;
    }
}

/**
 * Upload encrypted bookmarks to server
 * @param {Array} bookmarks - Array of encrypted bookmark entries
 * @returns {Promise<Object>} - Sync result
 */
export async function uploadBookmarks(bookmarks) {
    try {
        const deviceId = await getDeviceId();

        const response = await authenticatedFetch(`${API_BASE_URL}/sync/bookmarks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookmarks,
                deviceId,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload bookmarks');
        }

        return await response.json();
    } catch (error) {
        console.error('Upload bookmarks error:', error);
        throw error;
    }
}

/**
 * Report conflict to server for resolution
 * @param {Object} conflict - Conflict details
 * @returns {Promise<Object>} - Resolution result
 */
export async function reportConflict(conflict) {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/sync/conflict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conflict)
        });

        if (!response.ok) {
            throw new Error('Failed to report conflict');
        }

        return await response.json();
    } catch (error) {
        console.error('Report conflict error:', error);
        throw error;
    }
}
