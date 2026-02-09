/**
 * Password Generator Utility
 * Generates secure, random passwords with customizable options
 */

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = 'il1Lo0O'; // Characters that look similar

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @returns {string} - Generated password
 */
export function generatePassword(options = {}) {
    const {
        length = 16,
        includeLowercase = true,
        includeUppercase = true,
        includeNumbers = true,
        includeSymbols = true,
        excludeAmbiguous = false,
        minNumbers = 1,
        minSymbols = 1
    } = options;

    // Build character set
    let charset = '';
    let requiredChars = [];

    if (includeLowercase) {
        let lowerChars = LOWERCASE;
        if (excludeAmbiguous) {
            lowerChars = lowerChars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
        }
        charset += lowerChars;
        requiredChars.push(getRandomChar(lowerChars));
    }

    if (includeUppercase) {
        let upperChars = UPPERCASE;
        if (excludeAmbiguous) {
            upperChars = upperChars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
        }
        charset += upperChars;
        requiredChars.push(getRandomChar(upperChars));
    }

    if (includeNumbers) {
        let numberChars = NUMBERS;
        if (excludeAmbiguous) {
            numberChars = numberChars.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
        }
        charset += numberChars;
        // Add minimum required numbers
        for (let i = 0; i < minNumbers; i++) {
            requiredChars.push(getRandomChar(numberChars));
        }
    }

    if (includeSymbols) {
        charset += SYMBOLS;
        // Add minimum required symbols
        for (let i = 0; i < minSymbols; i++) {
            requiredChars.push(getRandomChar(SYMBOLS));
        }
    }

    if (charset.length === 0) {
        throw new Error('At least one character type must be selected');
    }

    if (length < requiredChars.length) {
        throw new Error(`Password length must be at least ${requiredChars.length}`);
    }

    // Generate remaining characters
    const remainingLength = length - requiredChars.length;
    const randomChars = [];

    for (let i = 0; i < remainingLength; i++) {
        randomChars.push(getRandomChar(charset));
    }

    // Combine and shuffle
    const allChars = [...requiredChars, ...randomChars];
    return shuffleArray(allChars).join('');
}

/**
 * Get a cryptographically random character from a string
 */
function getRandomChar(str) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const index = array[0] % str.length;
    return str[index];
}

/**
 * Shuffle array using Fisher-Yates algorithm with crypto random
 */
function shuffleArray(array) {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const j = randomArray[0] % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Generate a memorable passphrase
 * @param {number} wordCount - Number of words (default: 4)
 * @param {string} separator - Word separator (default: '-')
 * @returns {string} - Generated passphrase
 */
export function generatePassphrase(wordCount = 4, separator = '-') {
    // Common word list (subset for demo - in production, use a larger list)
    const words = [
        'correct', 'horse', 'battery', 'staple', 'mountain', 'river', 'ocean', 'forest',
        'thunder', 'lightning', 'rainbow', 'sunset', 'sunrise', 'galaxy', 'planet', 'comet',
        'dragon', 'phoenix', 'unicorn', 'griffin', 'wizard', 'knight', 'castle', 'kingdom',
        'treasure', 'adventure', 'journey', 'quest', 'legend', 'mystery', 'secret', 'ancient',
        'crystal', 'diamond', 'emerald', 'sapphire', 'golden', 'silver', 'bronze', 'platinum',
        'thunder', 'storm', 'breeze', 'whisper', 'shadow', 'light', 'fire', 'water',
        'earth', 'wind', 'star', 'moon', 'sun', 'sky', 'cloud', 'rain'
    ];

    const selectedWords = [];

    for (let i = 0; i < wordCount; i++) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const index = randomArray[0] % words.length;
        selectedWords.push(words[index]);
    }

    return selectedWords.join(separator);
}

/**
 * Generate a PIN code
 * @param {number} length - PIN length (default: 6)
 * @returns {string} - Generated PIN
 */
export function generatePIN(length = 6) {
    let pin = '';

    for (let i = 0; i < length; i++) {
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        pin += (randomArray[0] % 10).toString();
    }

    return pin;
}

/**
 * Preset password generation options
 */
export const PASSWORD_PRESETS = {
    strong: {
        length: 20,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false,
        minNumbers: 2,
        minSymbols: 2
    },
    medium: {
        length: 16,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: true,
        minNumbers: 1,
        minSymbols: 1
    },
    basic: {
        length: 12,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: true,
        minNumbers: 2,
        minSymbols: 0
    },
    pin: {
        length: 6,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: false
    }
};
