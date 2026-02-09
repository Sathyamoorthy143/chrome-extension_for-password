/**
 * Two-Factor Authentication (2FA) Module
 * Supports TOTP (Time-based One-Time Password) authentication
 */

/**
 * Generate a TOTP secret key
 * @returns {string} - Base32 encoded secret
 */
export function generateTOTPSecret() {
    const buffer = new Uint8Array(20);
    crypto.getRandomValues(buffer);
    return base32Encode(buffer);
}

/**
 * Generate TOTP code from secret
 * @param {string} secret - Base32 encoded secret
 * @param {number} timeStep - Time step in seconds (default: 30)
 * @returns {Promise<string>} - 6-digit TOTP code
 */
export async function generateTOTPCode(secret, timeStep = 30) {
    const key = base32Decode(secret);
    const time = Math.floor(Date.now() / 1000 / timeStep);

    // Convert time to 8-byte buffer
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false); // Big-endian

    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    // Generate HMAC
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hmac = new Uint8Array(signature);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
}

/**
 * Verify TOTP code
 * @param {string} code - User-provided code
 * @param {string} secret - Base32 encoded secret
 * @param {number} window - Time window to check (default: 1 = ±30 seconds)
 * @returns {Promise<boolean>} - True if code is valid
 */
export async function verifyTOTPCode(code, secret, window = 1) {
    const timeStep = 30;

    // Check current time and adjacent windows
    for (let i = -window; i <= window; i++) {
        const time = Math.floor(Date.now() / 1000 / timeStep) + i;
        const expectedCode = await generateTOTPCodeAtTime(secret, time);

        if (code === expectedCode) {
            return true;
        }
    }

    return false;
}

/**
 * Generate TOTP code at specific time
 */
async function generateTOTPCodeAtTime(secret, time) {
    const key = base32Decode(secret);

    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
}

/**
 * Generate QR code data URL for TOTP setup
 * @param {string} secret - Base32 encoded secret
 * @param {string} accountName - User's account name/email
 * @param {string} issuer - Service name (default: 'SecureSync')
 * @returns {string} - otpauth:// URL
 */
export function generateTOTPQRCodeURL(secret, accountName, issuer = 'SecureSync') {
    const params = new URLSearchParams({
        secret,
        issuer,
        algorithm: 'SHA1',
        digits: '6',
        period: '30'
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
}

/**
 * Generate backup codes for 2FA recovery
 * @param {number} count - Number of codes to generate (default: 10)
 * @returns {Array<string>} - Array of backup codes
 */
export function generateBackupCodes(count = 10) {
    const codes = [];

    for (let i = 0; i < count; i++) {
        const buffer = new Uint8Array(4);
        crypto.getRandomValues(buffer);

        // Convert to 8-character alphanumeric code
        let code = '';
        for (let j = 0; j < 4; j++) {
            code += buffer[j].toString(16).padStart(2, '0');
        }

        // Format as XXXX-XXXX
        codes.push(`${code.substring(0, 4)}-${code.substring(4, 8)}`.toUpperCase());
    }

    return codes;
}

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(buffer) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
}

/**
 * Base32 decoding (RFC 4648)
 */
function base32Decode(str) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.ceil(str.length * 5 / 8));

    for (let i = 0; i < str.length; i++) {
        const char = str[i].toUpperCase();
        const charValue = alphabet.indexOf(char);

        if (charValue === -1) continue;

        value = (value << 5) | charValue;
        bits += 5;

        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }

    return output.slice(0, index);
}

/**
 * Store 2FA settings
 * @param {string} email - User email
 * @param {string} secret - TOTP secret
 * @param {Array<string>} backupCodes - Backup codes
 */
export async function store2FASettings(email, secret, backupCodes) {
    const { saveSettings, getSettings } = await import('../storage/local-storage.js');
    const settings = await getSettings();

    settings.twoFactorAuth = {
        enabled: true,
        secret,
        backupCodes,
        setupDate: new Date().toISOString()
    };

    await saveSettings(settings);
}

/**
 * Verify and use backup code
 * @param {string} code - Backup code to verify
 * @returns {Promise<boolean>} - True if code is valid and unused
 */
export async function verifyBackupCode(code) {
    const { getSettings, saveSettings } = await import('../storage/local-storage.js');
    const settings = await getSettings();

    if (!settings.twoFactorAuth?.backupCodes) {
        return false;
    }

    const index = settings.twoFactorAuth.backupCodes.indexOf(code.toUpperCase());

    if (index !== -1) {
        // Remove used backup code
        settings.twoFactorAuth.backupCodes.splice(index, 1);
        await saveSettings(settings);
        return true;
    }

    return false;
}
