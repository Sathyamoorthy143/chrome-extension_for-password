/**
 * Biometric Authentication Module
 * Supports WebAuthn for fingerprint, face recognition, etc.
 */

/**
 * Check if biometric authentication is available
 * @returns {Promise<boolean>} - True if available
 */
export async function isBiometricAvailable() {
    // Check for WebAuthn support
    if (!window.PublicKeyCredential) {
        return false;
    }

    // Check for platform authenticator (built-in biometric)
    try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
    } catch (error) {
        console.error('Biometric availability check failed:', error);
        return false;
    }
}

/**
 * Register biometric credential
 * @param {string} email - User email
 * @returns {Promise<Object>} - Credential data
 */
export async function registerBiometric(email) {
    if (!await isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
    }

    // Generate challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // User ID (should be unique and not personally identifiable)
    const userId = new Uint8Array(16);
    crypto.getRandomValues(userId);

    const publicKeyOptions = {
        challenge,
        rp: {
            name: 'SecureSync',
            id: window.location.hostname
        },
        user: {
            id: userId,
            name: email,
            displayName: email
        },
        pubKeyCredParams: [
            { type: 'public-key', alg: -7 },  // ES256
            { type: 'public-key', alg: -257 } // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // Built-in authenticator
            userVerification: 'required',
            requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'none'
    };

    try {
        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        // Store credential data
        const credentialData = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
                attestationObject: arrayBufferToBase64(credential.response.attestationObject)
            },
            createdAt: new Date().toISOString()
        };

        await storeBiometricCredential(email, credentialData);

        return credentialData;
    } catch (error) {
        console.error('Biometric registration failed:', error);
        throw new Error('Failed to register biometric authentication');
    }
}

/**
 * Authenticate with biometric
 * @param {string} email - User email
 * @returns {Promise<boolean>} - True if authenticated
 */
export async function authenticateWithBiometric(email) {
    if (!await isBiometricAvailable()) {
        throw new Error('Biometric authentication not available');
    }

    const storedCredential = await getBiometricCredential(email);

    if (!storedCredential) {
        throw new Error('No biometric credential found');
    }

    // Generate challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyOptions = {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{
            type: 'public-key',
            id: base64ToArrayBuffer(storedCredential.rawId)
        }],
        userVerification: 'required',
        timeout: 60000
    };

    try {
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyOptions
        });

        // In production, verify the assertion on the server
        // For now, just check if we got a valid response
        return assertion !== null;
    } catch (error) {
        console.error('Biometric authentication failed:', error);
        return false;
    }
}

/**
 * Remove biometric credential
 * @param {string} email - User email
 */
export async function removeBiometric(email) {
    const { getSettings, saveSettings } = await import('../storage/local-storage.js');
    const settings = await getSettings();

    if (settings.biometricAuth?.credentials) {
        delete settings.biometricAuth.credentials[email];
        await saveSettings(settings);
    }
}

/**
 * Store biometric credential
 */
async function storeBiometricCredential(email, credentialData) {
    const { getSettings, saveSettings } = await import('../storage/local-storage.js');
    const settings = await getSettings();

    if (!settings.biometricAuth) {
        settings.biometricAuth = {
            enabled: true,
            credentials: {}
        };
    }

    settings.biometricAuth.credentials[email] = credentialData;
    await saveSettings(settings);
}

/**
 * Get stored biometric credential
 */
async function getBiometricCredential(email) {
    const { getSettings } = await import('../storage/local-storage.js');
    const settings = await getSettings();

    return settings.biometricAuth?.credentials?.[email] || null;
}

/**
 * Check if biometric is enabled for user
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
export async function isBiometricEnabled(email) {
    const credential = await getBiometricCredential(email);
    return credential !== null;
}

/**
 * Get biometric type (fingerprint, face, etc.)
 * @returns {Promise<string>} - Biometric type
 */
export async function getBiometricType() {
    // This is a simplified version - actual detection is more complex
    if (navigator.userAgent.includes('Windows')) {
        return 'Windows Hello';
    } else if (navigator.userAgent.includes('Mac')) {
        return 'Touch ID / Face ID';
    } else if (navigator.userAgent.includes('Android')) {
        return 'Fingerprint / Face Unlock';
    } else {
        return 'Biometric';
    }
}

// Utility functions
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}
