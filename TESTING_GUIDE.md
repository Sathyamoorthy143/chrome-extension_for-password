# Testing Guide - SecureSync Extension

## 🧪 Complete Testing Instructions

This guide will walk you through testing the extension in Chrome step-by-step.

---

## 📋 Prerequisites

Before testing, ensure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ Chrome browser installed
- ✅ Terminal/PowerShell access

---

## 🚀 Step 1: Install Dependencies

Open PowerShell in the project directory:

```powershell
# Navigate to project directory
cd "e:\IDEA INTO PROJECT\chrome extension_for password"

# Install extension dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

---

## 🔧 Step 2: Start the Backend Server

The extension needs a backend API to sync data. Start it first:

```powershell
# Navigate to backend folder
cd backend

# Copy environment template
Copy-Item .env.example .env

# Start the server
npm start
```

You should see:
```
🚀 SecureSync API server running on port 3000
📝 Environment: development
```

**Keep this terminal open!** The backend must run while testing.

---

## 📦 Step 3: Build the Extension

Open a **new PowerShell window** in the project directory:

```powershell
# Navigate to project directory
cd "e:\IDEA INTO PROJECT\chrome extension_for password"

# Build for Chrome (development mode)
npm run dev
```

This creates the extension files in `dist/chrome/` folder.

---

## 🌐 Step 4: Load Extension in Chrome

### Method 1: Load Unpacked Extension

1. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**:
   - Look for the toggle in the top-right corner
   - Turn it ON (it will turn blue)

3. **Load the Extension**:
   - Click **"Load unpacked"** button (top-left)
   - Navigate to: `e:\IDEA INTO PROJECT\chrome extension_for password\dist\chrome`
   - Click **"Select Folder"**

4. **Verify Installation**:
   - You should see "SecureSync" in your extensions list
   - The extension icon should appear in your Chrome toolbar
   - If you don't see the icon, click the puzzle piece (🧩) and pin SecureSync

### Method 2: Using Chrome Profile (Recommended for Testing)

If you want to test without affecting your main Chrome profile:

1. **Create a new Chrome profile**:
   ```
   chrome://settings/manageProfile
   ```
   - Click "Add" to create a test profile
   - Name it "SecureSync Testing"

2. **Open Chrome with the test profile**:
   - Click your profile icon (top-right)
   - Select "SecureSync Testing"

3. **Load the extension** (follow Method 1 steps above)

---

## ✅ Step 5: Test Basic Features

### 5.1 First Launch

1. **Click the extension icon** in Chrome toolbar
2. You should see the **"Sign In / Sign Up"** screen
3. Click **"Sign In / Sign Up"** button

### 5.2 Create Account

1. **Enter your details**:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Click **"Sign Up"**

2. **Set Master Password**:
   - Enter a strong master password (this encrypts your vault)
   - Example: `MySecureMaster123!`
   - **IMPORTANT**: Remember this password!

3. You should see the **unlocked vault** (empty at first)

### 5.3 Test Password Capture

1. **Open a test website** with a login form:
   - Try: `https://example.com` or any site with login
   - Or create a simple HTML file (see below)

2. **Fill in a login form**:
   - Username: `testuser`
   - Password: `testpass123`
   - Submit the form

3. **Look for the save prompt**:
   - A beautiful gradient popup should appear
   - Click **"Save"** to store the password

4. **Verify in popup**:
   - Click the extension icon
   - You should see the saved password entry

### 5.4 Test Password Search

1. Click extension icon
2. Type in the search box
3. Results should filter in real-time

### 5.5 Test Password Copy

1. Click the copy button (📋) next to a password
2. You should see a "Copied!" toast notification
3. Paste somewhere to verify it copied correctly

### 5.6 Test Sync

1. Click the sync button (🔄) in the popup
2. You should see "Syncing..." then "Synced!"
3. Check backend terminal - you should see sync requests

### 5.7 Test Vault Lock

1. Click the lock button (🔒)
2. Vault should lock
3. Click extension icon again
4. Enter master password to unlock

---

## 🧪 Step 6: Test Enhancement Features

### 6.1 Test Password Generator

Open browser console while on the popup:

```javascript
// Import the generator
import { generatePassword, PASSWORD_PRESETS } from './src/utils/password-generator.js';

// Generate a strong password
const password = generatePassword(PASSWORD_PRESETS.strong);
console.log('Generated:', password);
```

Or test directly in DevTools:

1. Right-click the extension popup → **Inspect**
2. Go to **Console** tab
3. Run the code above

### 6.2 Test Password Strength Analyzer

In the console:

```javascript
import { analyzePasswordStrength } from './src/utils/password-strength.js';

const analysis = analyzePasswordStrength('MyP@ssw0rd123');
console.log(analysis);
// Should show score, strength, feedback, etc.
```

### 6.3 Test 2FA (Advanced)

```javascript
import { generateTOTPSecret, generateTOTPCode } from './src/auth/two-factor-auth.js';

// Generate secret
const secret = generateTOTPSecret();
console.log('Secret:', secret);

// Generate code
const code = await generateTOTPCode(secret);
console.log('TOTP Code:', code);
```

### 6.4 Test Biometric (if available)

```javascript
import { isBiometricAvailable, getBiometricType } from './src/auth/biometric-auth.js';

const available = await isBiometricAvailable();
console.log('Biometric available:', available);

if (available) {
  const type = await getBiometricType();
  console.log('Type:', type);
}
```

---

## 🔍 Step 7: Debugging

### View Extension Logs

1. **Right-click extension icon** → **Inspect popup**
2. **Console tab** shows all logs and errors
3. Look for:
   - ✅ Green success messages
   - ⚠️ Yellow warnings
   - ❌ Red errors

### View Background Service Worker Logs

1. Go to `chrome://extensions/`
2. Find SecureSync
3. Click **"service worker"** link
4. Console opens with background logs

### View Storage Data

In the popup console:

```javascript
// View all stored data
chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});

// View vault
chrome.storage.local.get('encrypted_vault', (data) => {
  console.log('Vault:', data);
});
```

### Common Issues

**Issue**: Extension won't load
- **Solution**: Check `dist/chrome/manifest.json` exists
- Rebuild: `npm run dev`

**Issue**: Backend connection fails
- **Solution**: Ensure backend is running on port 3000
- Check: `http://localhost:3000/health` in browser

**Issue**: Popup is blank
- **Solution**: Check console for errors
- Verify all files copied to `dist/chrome/`

**Issue**: Password capture not working
- **Solution**: Check content script is injected
- Go to DevTools → Sources → Content Scripts

---

## 📝 Step 8: Create Test Login Page

Create a simple HTML file to test password capture:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Test Login Page</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 400px;
      margin: 50px auto;
      padding: 20px;
    }
    input {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h2>Test Login Form</h2>
  <form id="loginForm">
    <input type="text" name="username" placeholder="Username" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Login</button>
  </form>

  <script>
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Form submitted! Check for SecureSync save prompt.');
    });
  </script>
</body>
</html>
```

Save as `test-login.html` and open in Chrome.

---

## 🎯 Testing Checklist

Use this checklist to verify all features:

### Core Features
- [ ] Extension loads without errors
- [ ] Backend server is running
- [ ] Sign up creates new account
- [ ] Login works with credentials
- [ ] Master password unlocks vault
- [ ] Vault locks after timeout (15 min)
- [ ] Password capture detects forms
- [ ] Save prompt appears and works
- [ ] Passwords are saved to vault
- [ ] Search filters passwords
- [ ] Copy button copies password
- [ ] Sync button syncs with backend
- [ ] Lock button locks vault

### Enhancement Features
- [ ] Password generator creates passwords
- [ ] Strength analyzer shows feedback
- [ ] 2FA secret generation works
- [ ] TOTP codes are generated
- [ ] Biometric availability check works

### Security
- [ ] Passwords are encrypted in storage
- [ ] Master password is not stored
- [ ] Backend receives encrypted data only
- [ ] Tokens refresh automatically
- [ ] Auto-lock works after inactivity

### UI/UX
- [ ] Popup displays correctly
- [ ] Animations are smooth
- [ ] Toast notifications appear
- [ ] Search is responsive
- [ ] Icons display properly

---

## 🔄 Reload Extension After Changes

When you make code changes:

1. **Rebuild**:
   ```powershell
   npm run dev
   ```

2. **Reload in Chrome**:
   - Go to `chrome://extensions/`
   - Find SecureSync
   - Click the reload icon (🔄)

3. **Hard refresh popup**:
   - Close popup if open
   - Click extension icon again

---

## 📊 Monitor Backend Activity

Watch backend logs while testing:

```
POST /api/auth/signup 201 - User created
POST /api/auth/login 200 - Login successful
GET /api/sync/passwords 200 - Fetched 0 passwords
POST /api/sync/passwords 200 - Synced 1 passwords
```

---

## 🎓 Next Steps

After basic testing works:

1. **Test multi-device sync**:
   - Load extension in another browser/profile
   - Login with same account
   - Verify passwords sync

2. **Test offline mode**:
   - Stop backend server
   - Make changes in extension
   - Restart backend
   - Verify changes sync

3. **Test conflict resolution**:
   - Edit same password on two devices offline
   - Bring both online
   - Verify conflict is resolved

4. **Deploy backend**:
   - Deploy to Render/Railway/Heroku
   - Update API URLs in extension
   - Test with production backend

---

## 🆘 Need Help?

- Check browser console for errors
- Check backend terminal for API errors
- Review `walkthrough.md` for architecture details
- Check `ENHANCEMENT_FEATURES.md` for feature usage

**Happy Testing! 🚀**
