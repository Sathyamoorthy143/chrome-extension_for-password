# SecureSync - Cross-Browser Password & Bookmark Manager

🔐 A secure, cross-browser extension that syncs your passwords and bookmarks across devices with end-to-end encryption.

## ✨ Features

- **🔒 Zero-Knowledge Encryption**: All data encrypted client-side with AES-256-GCM
- **🔄 Cross-Device Sync**: Seamlessly sync passwords and bookmarks across all your devices
- **🌐 Cross-Browser**: Works on Chrome, Brave, Edge, Firefox, and other Chromium-based browsers
- **🛡️ Enhanced Security**: 
  - HMAC-SHA512 password hashing with pepper
  - Double PBKDF2 rounds (600,000 iterations)
  - Constant-time comparison to prevent timing attacks
  - Automatic vault locking
- **💾 Automatic Backups**: 5-version backup history to prevent data loss
- **🎨 Modern UI**: Beautiful, intuitive interface with dark mode support
- **📱 Auto-Fill**: Automatically detect and save passwords from login forms
- **🔑 Password Generator**: Create strong, random passwords with customizable options
- **📊 Password Strength Analyzer**: Real-time analysis with entropy calculation and feedback
- **🔐 Two-Factor Authentication**: TOTP-based 2FA with QR codes and backup codes
- **👆 Biometric Unlock**: Fingerprint and face recognition support (Windows Hello, Touch ID, Face ID)

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- A modern browser (Chrome 88+, Firefox 109+, Edge 88+)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chrome extension_for password
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   # Build for all browsers
   npm run build:all

   # Or build for specific browser
   npm run build:chrome
   npm run build:firefox
   ```

4. **Load the extension**

   **For Chrome/Brave/Edge:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `dist/chrome` folder

   **For Firefox:**
   - Open `about:debugging#/runtime/this-firefox`
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from `dist/firefox` folder

## 🔧 Development

### Development Mode

```bash
npm run dev
```

This creates an uncompressed build in `dist/chrome` for development.

### Project Structure

```
chrome extension_for password/
├── src/
│   ├── auth/              # Authentication service
│   ├── background/        # Background service worker
│   ├── capture/           # Password & bookmark capture
│   ├── crypto/            # Encryption & vault management
│   ├── popup/             # Extension popup UI
│   ├── options/           # Settings page (to be created)
│   ├── storage/           # Local storage & backup system
│   ├── sync/              # Sync service & conflict resolution
│   └── utils/             # Browser compatibility layer
├── icons/                 # Extension icons
├── build/                 # Build scripts
├── manifest.json          # Chrome manifest
├── manifest.firefox.json  # Firefox manifest
└── package.json
```

## 🔐 Security Architecture

### Encryption

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: Double PBKDF2 with 600,000 iterations
- **Password Hashing**: HMAC-SHA512 with application-specific pepper
- **Salt**: 32-byte random salt per encryption
- **IV**: 12-byte random initialization vector

### Zero-Knowledge Design

1. Master password never leaves your device
2. All encryption happens client-side
3. Server only stores encrypted blobs
4. No one (including us) can decrypt your data without your master password

### Backup System

- Automatic backups on every vault save
- Keeps last 5 versions
- Manual export/import for additional safety
- All backups are encrypted

## 🌐 Backend Setup

The extension requires a backend API for syncing. You can deploy the backend to any Node.js hosting service.

### Backend Quick Start

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Environment Variables

```env
PORT=3000
JWT_SECRET=your-secret-key-here
DATABASE_URL=mongodb://localhost:27017/securesync
# or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/securesync
```

### Deploy Backend

Recommended platforms:
- **Render**: Easy deployment, free tier available
- **Railway**: Simple setup, generous free tier
- **Heroku**: Classic choice, requires credit card
- **Vercel**: Serverless functions (requires adaptation)

## 📖 Usage

### First Time Setup

1. Click the extension icon
2. Click "Sign In / Sign Up"
3. Create an account with email and password
4. Set a strong master password (this encrypts your vault)
5. Start saving passwords!

### Saving Passwords

Passwords are automatically captured when you log into websites. A save prompt will appear - click "Save" to store the password securely.

### Managing Passwords

- Click the extension icon to view saved passwords
- Use the search box to find specific passwords
- Click the copy button to copy passwords to clipboard
- Open Settings for full password management

### Syncing

- Automatic sync every 5 minutes (configurable)
- Manual sync: Click the sync button in the popup
- Offline changes are queued and synced when online

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## 📦 Distribution

### Chrome Web Store

1. Build the extension: `npm run build:chrome`
2. ZIP file is created at `dist/securesync-chrome.zip`
3. Upload to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

### Firefox Add-ons

1. Build the extension: `npm run build:firefox`
2. ZIP file is created at `dist/securesync-firefox.zip`
3. Upload to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)

## 🛠️ Configuration

### Update Backend URL

Edit `src/auth/auth-service.js` and `src/sync/api-client.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Adjust Security Settings

Edit `src/crypto/encryption.js`:

```javascript
const PBKDF2_ITERATIONS = 600000; // Increase for more security (slower)
const PEPPER = 'your-custom-pepper'; // Change for production
```

## ⚠️ Important Notes

- **Master Password**: If you lose your master password, your data cannot be recovered
- **Pepper**: Change the default pepper in production and keep it secret
- **HTTPS**: Always use HTTPS for your backend API
- **Backups**: Regularly export your vault for additional safety

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🔒 Privacy

- No telemetry or analytics
- No data collection
- Open source for transparency
- Your data is yours alone

## 📞 Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**⚠️ Security Notice**: This is a demonstration/educational project. For production use, conduct a thorough security audit and consider using established password managers.
