/**
 * Authentication service for user signup, login, and session management
 */

import { saveAuthTokens, getAuthTokens, clearAuthTokens, saveUserEmail, getUserEmail } from '../storage/local-storage.js';

// Backend API URL - update this with your deployed backend
const API_BASE_URL = 'https://securesync-backend-ww8n.onrender.com/api';

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} passwordHint - Optional hint for login password
 * @param {string} masterPasswordHint - Optional hint for vault master password
 * @returns {Promise<Object>} - User data and tokens
 */
export async function signUp(email, password, passwordHint = '', masterPasswordHint = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, passwordHint, masterPasswordHint })
        });

        if (!response.ok) {
            let errorMessage = 'Signup failed';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || errorMessage;
            } catch (e) {
                // If not JSON, use status text
                errorMessage = response.statusText || `Error ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Save tokens and email
        await saveAuthTokens(data.accessToken, data.refreshToken);
        await saveUserEmail(email);

        return data;
    } catch (error) {
        console.error('Signup error:', error);
        throw error;
    }
}

/**
 * Request password hints for an email
 * @param {string} email - User email
 * @returns {Promise<Object>} - Hints object
 */
export async function forgotPassword(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to retrieve hints';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || `Error ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Forgot password error:', error);
        throw error;
    }
}

/**
 * Reset account password
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} - Success message
 */
export async function resetPassword(email, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, newPassword })
        });

        if (!response.ok) {
            let errorMessage = 'Password reset failed';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || `Error ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error('Reset password error:', error);
        throw error;
    }
}

/**
 * Sign in an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - User data and tokens
 */
export async function signIn(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const error = await response.json();
                errorMessage = error.error || error.message || errorMessage;
            } catch (e) {
                errorMessage = response.statusText || `Error ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Save tokens and email
        await saveAuthTokens(data.accessToken, data.refreshToken);
        await saveUserEmail(email);

        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

/**
 * Refresh access token using refresh token
 * @returns {Promise<string>} - New access token
 */
export async function refreshAccessToken() {
    try {
        const { refreshToken } = await getAuthTokens();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.status === 401 || response.status === 403) {
            // Explicitly unauthorized - token is invalid/revoked
            console.error('Refresh token invalid/expired. Logging out.');
            await logout();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // Save new access token
        await saveAuthTokens(data.accessToken, refreshToken);

        return data.accessToken;
    } catch (error) {
        console.error('Token refresh error:', error);

        // ONLY logout if it's an authentication error, not a network error
        if (error.message.includes('Session expired') || error.message.includes('No refresh token')) {
            await logout();
        }

        throw error;
    }
}

/**
 * Logout user
 */
export async function logout() {
    try {
        const { refreshToken } = await getAuthTokens();

        if (refreshToken) {
            // Notify backend to invalidate token
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear local tokens regardless of backend response
        await clearAuthTokens();
    }
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const { accessToken } = await getAuthTokens();
    return !!accessToken;
}

/**
 * Get current user email
 * @returns {Promise<string|null>}
 */
export async function getCurrentUserEmail() {
    return await getUserEmail();
}

/**
 * Make authenticated API request with automatic token refresh
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function authenticatedFetch(url, options = {}) {
    let { accessToken } = await getAuthTokens();

    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    // Add authorization header
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, refresh and retry
    if (response.status === 401) {
        try {
            accessToken = await refreshAccessToken();
            headers.Authorization = `Bearer ${accessToken}`;
            response = await fetch(url, { ...options, headers });
        } catch (error) {
            if (error.message.includes('Session expired')) {
                throw new Error('Authentication failed. Please login again.');
            }
            throw error; // Re-throw network or other errors without forcing login
        }
    }

    return response;
}
