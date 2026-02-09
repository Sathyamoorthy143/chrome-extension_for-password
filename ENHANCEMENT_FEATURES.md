# Enhancement Features - Usage Guide

## 🔐 Password Generator

### Basic Usage

```javascript
import { generatePassword, PASSWORD_PRESETS } from './src/utils/password-generator.js';

// Generate with default settings (16 chars, all types)
const password = generatePassword();

// Generate with preset
const strongPassword = generatePassword(PASSWORD_PRESETS.strong);

// Generate with custom options
const customPassword = generatePassword({
  length: 20,
  includeLowercase: true,
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeAmbiguous: true,
  minNumbers: 2,
  minSymbols: 2
});
```

### Passphrase Generation

```javascript
import { generatePassphrase } from './src/utils/password-generator.js';

// Generate memorable passphrase
const passphrase = generatePassphrase(4, '-');
// Example: "mountain-thunder-crystal-phoenix"
```

### Available Presets

- **strong**: 20 chars, all types, 2+ numbers, 2+ symbols
- **medium**: 16 chars, all types, excludes ambiguous
- **basic**: 12 chars, no symbols, excludes ambiguous
- **pin**: 6-digit numeric PIN

---

## 📊 Password Strength Analyzer

### Analyze Password

```javascript
import { analyzePasswordStrength } from './src/utils/password-strength.js';

const analysis = analyzePasswordStrength('MyP@ssw0rd123');

console.log(analysis);
// {
//   score: 65,
//   strength: 'good',
//   color: '#ffcc00',
//   feedback: ['Consider using 12+ characters for better security'],
//   entropy: 58,
//   crackTime: '3 years',
//   details: {
//     length: 13,
//     hasLowercase: true,
//     hasUppercase: true,
//     hasNumbers: true,
//     hasSymbols: true,
//     patterns: []
//   }
// }
```

### Strength Levels

| Score | Strength | Color | Emoji |
|-------|----------|-------|-------|
| 0-29 | Weak | Red | 🔴 |
| 30-49 | Fair | Orange | 🟠 |
| 50-69 | Good | Yellow | 🟡 |
| 70-89 | Strong | Green | 🟢 |
| 90-100 | Very Strong | Cyan | 💚 |

### Pattern Detection

The analyzer detects:
- Sequential characters (abc, 123)
- Repeated characters (aaa, 111)
- Keyboard patterns (qwerty, asdf)
- Common words (password, admin)
- Date patterns (1990, 01/01)

---

## 🔐 Two-Factor Authentication (2FA)

### Setup 2FA

```javascript
import { 
  generateTOTPSecret, 
  generateTOTPQRCodeURL,
  generateBackupCodes,
  store2FASettings
} from './src/auth/two-factor-auth.js';

// 1. Generate secret
const secret = generateTOTPSecret();
// Example: "JBSWY3DPEHPK3PXP"

// 2. Generate QR code URL for authenticator apps
const qrCodeURL = generateTOTPQRCodeURL(secret, 'user@example.com');
// Display this as QR code for Google Authenticator, Authy, etc.

// 3. Generate backup codes
const backupCodes = generateBackupCodes(10);
// Example: ["A1B2-C3D4", "E5F6-G7H8", ...]

// 4. Store settings
await store2FASettings('user@example.com', secret, backupCodes);
```

### Verify 2FA Code

```javascript
import { verifyTOTPCode } from './src/auth/two-factor-auth.js';

const userCode = '123456'; // From authenticator app
const isValid = await verifyTOTPCode(userCode, secret);

if (isValid) {
  console.log('2FA verification successful!');
} else {
  console.log('Invalid code');
}
```

### Use Backup Code

```javascript
import { verifyBackupCode } from './src/auth/two-factor-auth.js';

const backupCode = 'A1B2-C3D4';
const isValid = await verifyBackupCode(backupCode);

if (isValid) {
  console.log('Backup code accepted (one-time use)');
}
```

---

## 👆 Biometric Authentication

### Check Availability

```javascript
import { 
  isBiometricAvailable,
  getBiometricType
} from './src/auth/biometric-auth.js';

const available = await isBiometricAvailable();
if (available) {
  const type = await getBiometricType();
  console.log(`${type} is available`);
  // Example: "Touch ID / Face ID is available"
}
```

### Register Biometric

```javascript
import { registerBiometric } from './src/auth/biometric-auth.js';

try {
  const credential = await registerBiometric('user@example.com');
  console.log('Biometric registered successfully!');
} catch (error) {
  console.error('Registration failed:', error);
}
```

### Authenticate with Biometric

```javascript
import { authenticateWithBiometric } from './src/auth/biometric-auth.js';

try {
  const authenticated = await authenticateWithBiometric('user@example.com');
  
  if (authenticated) {
    console.log('Biometric authentication successful!');
    // Unlock vault
  }
} catch (error) {
  console.error('Authentication failed:', error);
}
```

### Remove Biometric

```javascript
import { removeBiometric } from './src/auth/biometric-auth.js';

await removeBiometric('user@example.com');
console.log('Biometric removed');
```

---

## 🎨 UI Integration Examples

### Password Generator in Popup

```javascript
// Add to popup.js
import { generatePassword, PASSWORD_PRESETS } from '../utils/password-generator.js';
import { analyzePasswordStrength } from '../utils/password-strength.js';

// Generate button click handler
document.getElementById('generate-password-btn').addEventListener('click', () => {
  const password = generatePassword(PASSWORD_PRESETS.strong);
  const analysis = analyzePasswordStrength(password);
  
  // Display password
  document.getElementById('generated-password').value = password;
  
  // Show strength
  document.getElementById('strength-bar').style.width = `${analysis.score}%`;
  document.getElementById('strength-bar').style.backgroundColor = analysis.color;
  document.getElementById('strength-label').textContent = analysis.strength;
});
```

### 2FA Setup Flow

```javascript
// In options page
import { generateTOTPSecret, generateTOTPQRCodeURL } from '../auth/two-factor-auth.js';

async function setup2FA() {
  const secret = generateTOTPSecret();
  const email = await getUserEmail();
  const qrURL = generateTOTPQRCodeURL(secret, email);
  
  // Display QR code (use a QR code library)
  displayQRCode(qrURL);
  
  // Show secret for manual entry
  document.getElementById('secret-key').textContent = secret;
}
```

### Biometric Unlock

```javascript
// In popup.js
import { authenticateWithBiometric, isBiometricEnabled } from '../auth/biometric-auth.js';

async function showUnlockOptions() {
  const email = await getUserEmail();
  const biometricEnabled = await isBiometricEnabled(email);
  
  if (biometricEnabled) {
    // Show biometric button
    document.getElementById('biometric-unlock-btn').classList.remove('hidden');
  }
}

document.getElementById('biometric-unlock-btn').addEventListener('click', async () => {
  try {
    const authenticated = await authenticateWithBiometric(email);
    if (authenticated) {
      // Unlock vault without master password
      unlockVault();
    }
  } catch (error) {
    showError('Biometric authentication failed');
  }
});
```

---

## 🔒 Security Considerations

### Password Generator
- Uses `crypto.getRandomValues()` for cryptographically secure randomness
- Fisher-Yates shuffle for unbiased character distribution
- Enforces minimum character type requirements

### Password Strength
- Entropy calculation based on character set size
- Pattern detection for common weaknesses
- Crack time estimation assumes 1B guesses/second

### 2FA
- TOTP implementation follows RFC 6238
- 30-second time window
- Backup codes are one-time use
- Base32 encoding for compatibility with authenticator apps

### Biometric
- Uses WebAuthn standard (W3C)
- Platform authenticator only (built-in biometric)
- Credentials stored locally, never transmitted
- Requires user verification

---

## 📝 Next Steps

To integrate these features into the UI:

1. **Add to Popup**: Password generator button
2. **Add to Options**: 2FA setup page
3. **Add to Settings**: Biometric enable/disable
4. **Add to Unlock**: Biometric unlock option
5. **Add Visual Indicators**: Strength meter, 2FA badge

See the implementation plan for detailed UI mockups and integration steps.
