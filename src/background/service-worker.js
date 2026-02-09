/**
 * Background service worker for extension lifecycle management
 */

import Browser from '../utils/browser-polyfill.js';
import { performSync } from '../sync/sync-service.js';
import { isAuthenticated } from '../auth/auth-service.js';
import { getSettings } from '../storage/local-storage.js';

// Alarm names
const SYNC_ALARM = 'periodic-sync';

/**
 * Initialize background service worker
 */
async function initialize() {
    console.log('SecureSync background service worker initialized');

    // Set up periodic sync alarm
    const settings = await getSettings();
    Browser.alarms.create(SYNC_ALARM, {
        periodInMinutes: settings.syncFrequencyMinutes || 5
    });

    // Network status can be checked via navigator.onLine in sync tasks
    // browser service workers do not support window.addEventListener
}

/**
 * Handle alarm events
 */
Browser.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === SYNC_ALARM) {
        await handlePeriodicSync();
    }
});

/**
 * Handle periodic sync
 */
async function handlePeriodicSync() {
    try {
        if (await isAuthenticated()) {
            console.log('Performing periodic sync...');
            const result = await performSync();
            console.log('Sync completed:', result);

            // Notify popup/options page of sync completion
            Browser.runtime.sendMessage({
                type: 'SYNC_COMPLETED',
                data: result
            }).catch(() => {
                // Ignore errors if no listeners
            });
        }
    } catch (error) {
        console.error('Periodic sync error:', error);
    }
}

/**
 * Handle online event
 */
async function handleOnline() {
    console.log('Network online - triggering sync');
    await handlePeriodicSync();
}

/**
 * Handle offline event
 */
function handleOffline() {
    console.log('Network offline - sync paused');
}

/**
 * Handle messages from popup/content scripts
 */
Browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            switch (message.type) {
                case 'SYNC_NOW':
                    const result = await performSync();
                    sendResponse({ success: true, data: result });
                    break;

                case 'GET_SYNC_STATUS':
                    const authenticated = await isAuthenticated();
                    sendResponse({ success: true, authenticated });
                    break;

                case 'LOCK_VAULT':
                    // Handled by vault.js
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Message handler error:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    // Return true to indicate async response
    return true;
});

/**
 * Handle extension installation
 */
Browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed - opening onboarding');
        Browser.tabs.create({
            url: Browser.runtime.getURL('src/onboarding/onboarding.html')
        });
    } else if (details.reason === 'update') {
        console.log('Extension updated');
    }
});

// Initialize on load
initialize();
