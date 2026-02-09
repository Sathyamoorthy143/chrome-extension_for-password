/**
 * Password Strength Analyzer
 * Analyzes password strength and provides feedback
 */

/**
 * Calculate password entropy (bits)
 * @param {string} password - Password to analyze
 * @returns {number} - Entropy in bits
 */
function calculateEntropy(password) {
    const length = password.length;
    let charsetSize = 0;

    // Determine character set size
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/[0-9]/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32; // Symbols

    return length * Math.log2(charsetSize);
}

/**
 * Check for common patterns
 * @param {string} password - Password to check
 * @returns {Array} - Array of detected patterns
 */
function detectPatterns(password) {
    const patterns = [];

    // Sequential characters
    if (/abc|bcd|cde|def|123|234|345|456|567|678|789/i.test(password)) {
        patterns.push('sequential_characters');
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
        patterns.push('repeated_characters');
    }

    // Keyboard patterns
    if (/qwerty|asdfgh|zxcvbn|12345|qazwsx/i.test(password)) {
        patterns.push('keyboard_pattern');
    }

    // Common words
    const commonWords = ['password', 'admin', 'user', 'login', 'welcome', 'letmein', 'monkey', 'dragon'];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
        patterns.push('common_word');
    }

    // Date patterns
    if (/\d{4}|\d{2}\/\d{2}|\d{2}-\d{2}/.test(password)) {
        patterns.push('date_pattern');
    }

    return patterns;
}

/**
 * Analyze password strength
 * @param {string} password - Password to analyze
 * @returns {Object} - Strength analysis result
 */
export function analyzePasswordStrength(password) {
    if (!password) {
        return {
            score: 0,
            strength: 'none',
            feedback: ['Password is required'],
            entropy: 0,
            crackTime: '0 seconds'
        };
    }

    const length = password.length;
    const entropy = calculateEntropy(password);
    const patterns = detectPatterns(password);

    // Character type checks
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[^a-zA-Z0-9]/.test(password);

    // Calculate base score (0-100)
    let score = 0;

    // Length scoring
    if (length >= 8) score += 20;
    if (length >= 12) score += 10;
    if (length >= 16) score += 10;
    if (length >= 20) score += 10;

    // Character variety scoring
    if (hasLowercase) score += 10;
    if (hasUppercase) score += 10;
    if (hasNumbers) score += 10;
    if (hasSymbols) score += 15;

    // Entropy bonus
    if (entropy > 50) score += 10;
    if (entropy > 80) score += 5;

    // Pattern penalties
    score -= patterns.length * 10;

    // Ensure score is in valid range
    score = Math.max(0, Math.min(100, score));

    // Determine strength level
    let strength;
    let color;

    if (score < 30) {
        strength = 'weak';
        color = '#ff3b30';
    } else if (score < 50) {
        strength = 'fair';
        color = '#ff9500';
    } else if (score < 70) {
        strength = 'good';
        color = '#ffcc00';
    } else if (score < 90) {
        strength = 'strong';
        color = '#34c759';
    } else {
        strength = 'very_strong';
        color = '#00c7be';
    }

    // Generate feedback
    const feedback = [];

    if (length < 8) {
        feedback.push('Use at least 8 characters');
    } else if (length < 12) {
        feedback.push('Consider using 12+ characters for better security');
    }

    if (!hasLowercase) feedback.push('Add lowercase letters');
    if (!hasUppercase) feedback.push('Add uppercase letters');
    if (!hasNumbers) feedback.push('Add numbers');
    if (!hasSymbols) feedback.push('Add symbols (!@#$%^&*)');

    if (patterns.includes('sequential_characters')) {
        feedback.push('Avoid sequential characters (abc, 123)');
    }
    if (patterns.includes('repeated_characters')) {
        feedback.push('Avoid repeated characters (aaa, 111)');
    }
    if (patterns.includes('keyboard_pattern')) {
        feedback.push('Avoid keyboard patterns (qwerty, asdf)');
    }
    if (patterns.includes('common_word')) {
        feedback.push('Avoid common words');
    }
    if (patterns.includes('date_pattern')) {
        feedback.push('Avoid dates and years');
    }

    if (feedback.length === 0) {
        feedback.push('Excellent password! Keep it safe.');
    }

    // Estimate crack time
    const crackTime = estimateCrackTime(entropy);

    return {
        score,
        strength,
        color,
        feedback,
        entropy: Math.round(entropy),
        crackTime,
        details: {
            length,
            hasLowercase,
            hasUppercase,
            hasNumbers,
            hasSymbols,
            patterns
        }
    };
}

/**
 * Estimate time to crack password
 * @param {number} entropy - Password entropy in bits
 * @returns {string} - Human-readable crack time
 */
function estimateCrackTime(entropy) {
    // Assume 1 billion guesses per second (modern GPU)
    const guessesPerSecond = 1e9;
    const possibleCombinations = Math.pow(2, entropy);
    const seconds = possibleCombinations / (2 * guessesPerSecond); // Divide by 2 for average

    if (seconds < 1) return 'Instant';
    if (seconds < 60) return `${Math.round(seconds)} seconds`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
    if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
    if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
    if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;

    return 'Centuries+';
}

/**
 * Check if password has been compromised (placeholder)
 * In production, integrate with Have I Been Pwned API
 * @param {string} password - Password to check
 * @returns {Promise<boolean>} - True if compromised
 */
export async function checkPasswordCompromised(password) {
    // TODO: Integrate with Have I Been Pwned API
    // For now, just check against a small list of very common passwords
    const veryCommonPasswords = [
        'password', '123456', '12345678', 'qwerty', 'abc123',
        'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
        'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
        'bailey', 'passw0rd', 'shadow', '123123', '654321'
    ];

    return veryCommonPasswords.includes(password.toLowerCase());
}

/**
 * Get password strength label
 * @param {number} score - Password score (0-100)
 * @returns {string} - Strength label
 */
export function getStrengthLabel(score) {
    if (score < 30) return 'Weak';
    if (score < 50) return 'Fair';
    if (score < 70) return 'Good';
    if (score < 90) return 'Strong';
    return 'Very Strong';
}

/**
 * Get password strength emoji
 * @param {string} strength - Strength level
 * @returns {string} - Emoji representation
 */
export function getStrengthEmoji(strength) {
    const emojiMap = {
        'none': '⚠️',
        'weak': '🔴',
        'fair': '🟠',
        'good': '🟡',
        'strong': '🟢',
        'very_strong': '💚'
    };

    return emojiMap[strength] || '⚪';
}
