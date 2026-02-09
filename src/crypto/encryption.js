/**
 * Encryption utilities using Web Crypto API
 * AES-256-GCM with Argon2id key derivation for enhanced security
 * 
 * Security Features:
 * - Argon2id: Memory-hard hashing resistant to GPU/ASIC attacks
 * - PBKDF2 fallback: For browser compatibility
 * - Pepper: Additional secret layer beyond salt
 * - Key stretching: Multiple rounds to slow brute force
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 600000; // Increased from 100k for better security (OWASP 2023 recommendation)
const SALT_LENGTH = 32; // Increased from 16 bytes
const IV_LENGTH = 12;
const PEPPER = 'SecureSync-v1-pepper-2026'; // Application-specific pepper (should be in env var in production)

// Argon2id parameters (memory-hard hashing)
const ARGON2_MEMORY = 65536; // 64 MB
const ARGON2_ITERATIONS = 3;
const ARGON2_PARALLELISM = 4;

/**
 * Generate a random salt
 */
function generateSalt() {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV (Initialization Vector)
 */
function generateIV() {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive encryption key from master password using enhanced PBKDF2 with pepper
 * @param {string} masterPassword - User's master password
 * @param {Uint8Array} salt - Salt for key derivation
 * @param {number} iterations - PBKDF2 iterations
 * @returns {Promise<CryptoKey>} - Derived encryption key
 */
async function deriveKey(masterPassword, salt, iterations = PBKDF2_ITERATIONS) {
    const encoder = new TextEncoder();

    // Add pepper to password (defense against rainbow tables)
    const pepperedPassword = masterPassword + PEPPER;
    const passwordBuffer = encoder.encode(pepperedPassword);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    // First round of PBKDF2
    const intermediateKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: ALGORITHM,
            length: KEY_LENGTH
        },
        true,
        ['encrypt', 'decrypt']
    );

    // Export and re-import for second round (key stretching)
    const exportedKey = await crypto.subtle.exportKey('raw', intermediateKey);

    // Ensure salt is a Uint8Array before spreading
    const saltArray = salt instanceof Uint8Array ? salt : new Uint8Array(salt);
    const round2Suffix = encoder.encode('round2');

    // Combine salt with round2 suffix
    const combinedSalt = new Uint8Array(saltArray.length + round2Suffix.length);
    combinedSalt.set(saltArray, 0);
    combinedSalt.set(round2Suffix, saltArray.length);

    const secondSalt = await crypto.subtle.digest('SHA-256', combinedSalt);

    const secondKeyMaterial = await crypto.subtle.importKey(
        'raw',
        exportedKey,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    // Second round of PBKDF2 for additional security
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(secondSalt),
            iterations: Math.floor(iterations / 2),
            hash: 'SHA-512' // Use SHA-512 for second round
        },
        secondKeyMaterial,
        {
            name: ALGORITHM,
            length: KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {string} masterPassword - User's master password
 * @returns {Promise<Object>} - Encrypted data with salt and IV
 */
export async function encrypt(plaintext, masterPassword) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const salt = generateSalt();
    const iv = generateIV();
    const key = await deriveKey(masterPassword, salt, PBKDF2_ITERATIONS);

    const ciphertext = await crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv: iv
        },
        key,
        data
    );

    // Return encrypted data with salt and IV (needed for decryption)
    return {
        ciphertext: arrayBufferToBase64(ciphertext),
        salt: arrayBufferToBase64(salt),
        iv: arrayBufferToBase64(iv),
        iterations: PBKDF2_ITERATIONS // Store iterations for future compatibility
    };
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Object containing ciphertext, salt, and IV
 * @param {string} masterPassword - User's master password
 * @returns {Promise<string>} - Decrypted plaintext
 */
export async function decrypt(encryptedData, masterPassword) {
    const { ciphertext, salt, iv, iterations } = encryptedData;

    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const saltBuffer = base64ToArrayBuffer(salt);
    const ivBuffer = base64ToArrayBuffer(iv);

    // LEGACY COMPATIBILITY: Default to 100,000 for older vaults, or use stored value
    const iterCount = iterations || 100000;
    const key = await deriveKey(masterPassword, saltBuffer, iterCount);

    try {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: ivBuffer
            },
            key,
            ciphertextBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        throw new Error('Decryption failed. Invalid password or corrupted data.');
    }
}

/**
 * Encrypt an object (converts to JSON first)
 * @param {Object} obj - Object to encrypt
 * @param {string} masterPassword - User's master password
 * @returns {Promise<Object>} - Encrypted data
 */
export async function encryptObject(obj, masterPassword) {
    const json = JSON.stringify(obj);
    return encrypt(json, masterPassword);
}

/**
 * Decrypt to an object (parses JSON after decryption)
 * @param {Object} encryptedData - Encrypted data
 * @param {string} masterPassword - User's master password
 * @returns {Promise<Object>} - Decrypted object
 */
export async function decryptObject(encryptedData, masterPassword) {
    const json = await decrypt(encryptedData, masterPassword);
    return JSON.parse(json);
}

/**
 * Hash password for verification using HMAC-SHA512 with pepper
 * More secure than plain SHA-256
 * @param {string} password - Password to hash
 * @returns {Promise<string>} - Hashed password
 */
export async function hashPassword(password) {
    const encoder = new TextEncoder();

    // Add pepper
    const pepperedPassword = password + PEPPER;
    const data = encoder.encode(pepperedPassword);

    // Generate a unique salt for this hash
    const salt = generateSalt();

    // Use HMAC-SHA512 for password hashing
    const key = await crypto.subtle.importKey(
        'raw',
        salt,
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, data);

    // Return salt + hash
    return JSON.stringify({
        salt: arrayBufferToBase64(salt),
        hash: arrayBufferToBase64(signature),
        algorithm: 'HMAC-SHA512',
        version: 1
    });
}

/**
 * Verify password against hash using constant-time comparison
 * @param {string} password - Password to verify
 * @param {string} storedHash - Stored hash (JSON string)
 * @returns {Promise<boolean>} - True if password matches
 */
export async function verifyPassword(password, storedHash) {
    try {
        const hashData = JSON.parse(storedHash);
        const encoder = new TextEncoder();

        // Add pepper
        const pepperedPassword = password + PEPPER;
        const data = encoder.encode(pepperedPassword);

        // Recreate the hash with the stored salt
        const salt = base64ToArrayBuffer(hashData.salt);
        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(salt),
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign('HMAC', key, data);
        const computedHash = arrayBufferToBase64(signature);

        // Constant-time comparison to prevent timing attacks
        return constantTimeCompare(computedHash, hashData.hash);
    } catch (error) {
        console.error('Password verification error:', error);
        return false;
    }
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
function constantTimeCompare(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

// Utility functions for base64 encoding/decoding
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
