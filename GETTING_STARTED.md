# SecureSync Extension - Getting Started Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
# Install extension dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Start the Backend

```bash
cd backend
cp .env.example .env
npm start
```

The backend will start on `http://localhost:3000`

### Step 3: Build the Extension

```bash
# Build for Chrome/Brave/Edge
npm run build:chrome

# Or build for Firefox
npm run build:firefox

# Or build for all browsers
npm run build:all
```

### Step 4: Load Extension in Browser

**Chrome/Brave/Edge:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/chrome` folder

**Firefox:**
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Navigate to `dist/firefox` and select `manifest.json`

### Step 5: First Use

1. Click the extension icon in your browser
2. Click "Sign In / Sign Up"
3. Create an account (email + password)
4. Set a master password to encrypt your vault
5. Start saving passwords!

## 📝 Development Workflow

### Running in Development Mode

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Extension build (watch mode)
npm run dev
```

### Making Changes

1. Edit files in `src/` directory
2. Rebuild: `npm run dev`
3. Reload extension in browser (click reload button in extensions page)

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 🔧 Configuration

### Change Backend URL

Edit these files to point to your deployed backend:

- `src/auth/auth-service.js` (line 7)
- `src/sync/api-client.js` (line 6)

```javascript
const API_BASE_URL = 'https://your-backend-url.com/api';
```

### Adjust Security Settings

Edit `src/crypto/encryption.js`:

```javascript
const PBKDF2_ITERATIONS = 600000; // Higher = more secure but slower
const PEPPER = 'your-custom-pepper-string'; // Change for production
```

## 🌐 Deploying Backend

### Option 1: Render (Recommended)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new "Web Service"
4. Connect your repository
5. Set environment variables from `.env.example`
6. Deploy!

### Option 2: Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

### Option 3: Heroku

```bash
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret-key
git push heroku main
```

## 📦 Publishing Extension

### Chrome Web Store

1. Build: `npm run build:chrome`
2. Create developer account at [Chrome Web Store](https://chrome.google.com/webstore/devconsole)
3. Upload `dist/securesync-chrome.zip`
4. Fill in store listing details
5. Submit for review

### Firefox Add-ons

1. Build: `npm run build:firefox`
2. Create account at [Firefox Add-ons](https://addons.mozilla.org/developers/)
3. Upload `dist/securesync-firefox.zip`
4. Fill in listing details
5. Submit for review

## ⚠️ Important Security Notes

1. **Change the pepper**: Edit `PEPPER` in `src/crypto/encryption.js`
2. **Use strong JWT secret**: Set `JWT_SECRET` in backend `.env`
3. **Enable HTTPS**: Always use HTTPS for production backend
4. **Regular backups**: Export your vault regularly
5. **Master password**: Cannot be recovered if lost!

## 🐛 Troubleshooting

### Extension won't load
- Check browser console for errors
- Ensure all files are in `dist/chrome` or `dist/firefox`
- Try rebuilding: `npm run build:chrome`

### Backend connection fails
- Verify backend is running: `curl http://localhost:3000/health`
- Check CORS settings in `backend/server.js`
- Update API_BASE_URL in extension code

### Sync not working
- Check browser console for errors
- Verify you're logged in
- Check backend logs for errors
- Try manual sync from popup

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [implementation_plan.md](C:\Users\sk143\.gemini\antigravity\brain\6329f538-d940-44b7-b72b-547ad60bb805\implementation_plan.md) for architecture details
- Customize the UI in `src/popup/popup.css`
- Add more features from the enhancement phase

## 🤝 Need Help?

- Check browser console for errors
- Review backend logs
- Open an issue on GitHub
- Read the implementation plan for architecture details

---

**Happy coding! 🔐**
