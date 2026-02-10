# Force Extension Reload Script

## Problem
Chrome is caching the old version of your extension and not loading the new "+ Add Password" button.

## Solution: Complete Reinstall

### Step 1: Remove Old Extension
1. Open `chrome://extensions`
2. Find **SecureSync**
3. Click **"Remove"** button
4. Confirm removal

### Step 2: Clear Chrome Cache (Optional but Recommended)
1. Press `Ctrl + Shift + Delete`
2. Select **"Cached images and files"**
3. Click **"Clear data"**

### Step 3: Reinstall Extension
1. Go back to `chrome://extensions`
2. Make sure **"Developer mode"** is ON (top-right toggle)
3. Click **"Load unpacked"**
4. Navigate to: `E:\IDEA INTO PROJECT\chrome extension_for password\dist\chrome`
5. Click **"Select Folder"**

### Step 4: Verify Installation
1. Click the SecureSync icon
2. You should see the updated popup
3. After unlocking, scroll down - you MUST see:
   - **"+ Add Password"** button (large, purple/blue)
   - **"📥 Export"** and **"Settings"** links below it

## Alternative: Use Incognito Mode to Test
1. Go to `chrome://extensions`
2. Find SecureSync
3. Enable **"Allow in incognito"**
4. Open an incognito window
5. Test the extension there (fresh cache)

## What the Button Looks Like
The "+ Add Password" button should be:
- Located at the **bottom** of the unlocked popup
- **Purple/blue** color matching the theme
- **Full width** button with text "+ Add Password"
- Above the "Export" and "Settings" links

## If Still Not Showing
The extension files are 100% correct. If you still don't see it after reinstalling:
1. Take a screenshot of `chrome://extensions` showing SecureSync
2. Take a screenshot of the extension popup after unlocking
3. Share both with me so I can diagnose further
