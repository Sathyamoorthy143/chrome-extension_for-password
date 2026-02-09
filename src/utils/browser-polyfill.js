/**
 * Cross-browser compatibility layer
 * Provides unified API for Chrome and Firefox extensions
 */

// Detect browser environment
const isFirefox = typeof browser !== 'undefined' && browser.runtime;
const isChrome = typeof chrome !== 'undefined' && chrome.runtime;

// Create unified browser API
const browserAPI = isFirefox ? browser : chrome;

/**
 * Promisify Chrome API calls for consistency
 */
function promisify(fn, context) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(context, ...args, (result) => {
        if (browserAPI.runtime.lastError) {
          reject(new Error(browserAPI.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  };
}

/**
 * Unified browser namespace
 */
export const Browser = {
  // Storage API
  storage: {
    local: {
      get: isFirefox
        ? (keys) => browserAPI.storage.local.get(keys)
        : promisify(browserAPI.storage.local.get, browserAPI.storage.local),
      set: isFirefox
        ? (items) => browserAPI.storage.local.set(items)
        : promisify(browserAPI.storage.local.set, browserAPI.storage.local),
      remove: isFirefox
        ? (keys) => browserAPI.storage.local.remove(keys)
        : promisify(browserAPI.storage.local.remove, browserAPI.storage.local),
      clear: isFirefox
        ? () => browserAPI.storage.local.clear()
        : promisify(browserAPI.storage.local.clear, browserAPI.storage.local)
    },
    sync: {
      get: isFirefox
        ? (keys) => browserAPI.storage.sync.get(keys)
        : promisify(browserAPI.storage.sync.get, browserAPI.storage.sync),
      set: isFirefox
        ? (items) => browserAPI.storage.sync.set(items)
        : promisify(browserAPI.storage.sync.set, browserAPI.storage.sync),
      remove: isFirefox
        ? (keys) => browserAPI.storage.sync.remove(keys)
        : promisify(browserAPI.storage.sync.remove, browserAPI.storage.sync)
    }
  },

  // Bookmarks API
  bookmarks: {
    get: isFirefox
      ? (id) => browserAPI.bookmarks.get(id)
      : promisify(browserAPI.bookmarks.get, browserAPI.bookmarks),
    getTree: isFirefox
      ? () => browserAPI.bookmarks.getTree()
      : promisify(browserAPI.bookmarks.getTree, browserAPI.bookmarks),
    create: isFirefox
      ? (bookmark) => browserAPI.bookmarks.create(bookmark)
      : promisify(browserAPI.bookmarks.create, browserAPI.bookmarks),
    update: isFirefox
      ? (id, changes) => browserAPI.bookmarks.update(id, changes)
      : promisify(browserAPI.bookmarks.update, browserAPI.bookmarks),
    remove: isFirefox
      ? (id) => browserAPI.bookmarks.remove(id)
      : promisify(browserAPI.bookmarks.remove, browserAPI.bookmarks),
    onCreated: browserAPI.bookmarks.onCreated,
    onChanged: browserAPI.bookmarks.onChanged,
    onRemoved: browserAPI.bookmarks.onRemoved
  },

  // Tabs API
  tabs: {
    query: isFirefox
      ? (queryInfo) => browserAPI.tabs.query(queryInfo)
      : promisify(browserAPI.tabs.query, browserAPI.tabs),
    get: isFirefox
      ? (tabId) => browserAPI.tabs.get(tabId)
      : promisify(browserAPI.tabs.get, browserAPI.tabs),
    create: isFirefox
      ? (createProperties) => browserAPI.tabs.create(createProperties)
      : promisify(browserAPI.tabs.create, browserAPI.tabs)
  },

  // Runtime API
  runtime: {
    sendMessage: isFirefox
      ? (message) => browserAPI.runtime.sendMessage(message)
      : promisify(browserAPI.runtime.sendMessage, browserAPI.runtime),
    onMessage: browserAPI.runtime.onMessage,
    getURL: (path) => browserAPI.runtime.getURL(path),
    id: browserAPI.runtime.id
  },

  // Alarms API
  alarms: {
    create: (name, alarmInfo) => browserAPI.alarms.create(name, alarmInfo),
    clear: isFirefox
      ? (name) => browserAPI.alarms.clear(name)
      : promisify(browserAPI.alarms.clear, browserAPI.alarms),
    onAlarm: browserAPI.alarms.onAlarm
  },

  // Action API (MV3)
  action: {
    openPopup: isFirefox
      ? () => {
        // Firefox doesn't support openPopup for actions yet
        console.warn('Browser.action.openPopup() is not supported on this browser');
        return Promise.reject(new Error('Not supported'));
      }
      : (isChrome && chrome.action && chrome.action.openPopup)
        ? promisify(chrome.action.openPopup, chrome.action)
        : () => {
          console.warn('Browser.action.openPopup() is not available');
          return Promise.reject(new Error('Not available'));
        }
  }
};

export default Browser;
