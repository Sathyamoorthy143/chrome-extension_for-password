const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
}

/**
 * Get user and ensure sync data structure exists
 */
async function getUserWithData(email) {
    const user = await User.findOne({ email });
    if (!user) return null;

    if (!user.syncData) {
        user.syncData = {
            passwords: [],
            bookmarks: [],
            lastUpdated: new Date()
        };
        await user.save();
    }
    return user;
}

/**
 * Debug endpoint - View all synced data (development only)
 */
router.get('/debug/data', authenticate, async (req, res) => {
    try {
        const user = await getUserWithData(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const userData = user.syncData;

        res.json({
            email: req.user.email,
            passwordCount: userData.passwords.length,
            passwords: userData.passwords.map(p => ({
                id: p.id,
                url: p.url,
                username: p.username,
                hasPassword: !!p.password,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                deletedAt: p.deletedAt
            })),
            bookmarkCount: userData.bookmarks.length,
            bookmarks: userData.bookmarks.map(b => ({
                id: b.id,
                title: b.title,
                url: b.url,
                createdAt: b.createdAt,
                updatedAt: b.updatedAt,
                deletedAt: b.deletedAt
            })),
            lastUpdated: userData.lastUpdated
        });
    } catch (error) {
        console.error('Debug data error:', error);
        res.status(500).json({ error: 'Failed to fetch debug data' });
    }
});

/**
 * Fetch passwords
 */
router.get('/passwords', authenticate, async (req, res) => {
    try {
        const { since } = req.query;
        const user = await getUserWithData(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let passwords = user.syncData.passwords;

        // Delta sync if timestamp provided
        if (since) {
            passwords = passwords.filter(p => new Date(p.updatedAt) > new Date(since));
        }

        res.json({ passwords, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Fetch passwords error:', error);
        res.status(500).json({ error: 'Failed to fetch passwords' });
    }
});

/**
 * Upload passwords
 */
router.post('/passwords', authenticate, async (req, res) => {
    try {
        const { passwords, deviceId, timestamp } = req.body;

        if (!Array.isArray(passwords)) {
            return res.status(400).json({ error: 'Passwords must be an array' });
        }

        const user = await getUserWithData(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Merge passwords (simple last-write-wins)
        const passwordMap = new Map(user.syncData.passwords.map(p => [p.id, p]));

        for (const password of passwords) {
            const existing = passwordMap.get(password.id);

            if (!existing || new Date(password.updatedAt) > new Date(existing.updatedAt)) {
                passwordMap.set(password.id, password);
            }
        }

        user.syncData.passwords = Array.from(passwordMap.values());
        user.syncData.lastUpdated = new Date();
        await user.save();

        res.json({
            message: 'Passwords synced successfully',
            count: passwords.length,
            timestamp: user.syncData.lastUpdated
        });
    } catch (error) {
        console.error('Upload passwords error:', error);
        res.status(500).json({ error: 'Failed to upload passwords' });
    }
});

/**
 * Fetch bookmarks
 */
router.get('/bookmarks', authenticate, async (req, res) => {
    try {
        const { since } = req.query;
        const user = await getUserWithData(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let bookmarks = user.syncData.bookmarks;

        // Delta sync if timestamp provided
        if (since) {
            bookmarks = bookmarks.filter(b => new Date(b.updatedAt) > new Date(since));
        }

        res.json({ bookmarks, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Fetch bookmarks error:', error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

/**
 * Upload bookmarks
 */
router.post('/bookmarks', authenticate, async (req, res) => {
    try {
        const { bookmarks, deviceId, timestamp } = req.body;

        if (!Array.isArray(bookmarks)) {
            return res.status(400).json({ error: 'Bookmarks must be an array' });
        }

        const user = await getUserWithData(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Merge bookmarks (simple last-write-wins)
        const bookmarkMap = new Map(user.syncData.bookmarks.map(b => [b.id, b]));

        for (const bookmark of bookmarks) {
            const existing = bookmarkMap.get(bookmark.id);

            if (!existing || new Date(bookmark.updatedAt) > new Date(existing.updatedAt)) {
                bookmarkMap.set(bookmark.id, bookmark);
            }
        }

        user.syncData.bookmarks = Array.from(bookmarkMap.values());
        user.syncData.lastUpdated = new Date();
        await user.save();

        res.json({
            message: 'Bookmarks synced successfully',
            count: bookmarks.length,
            timestamp: user.syncData.lastUpdated
        });
    } catch (error) {
        console.error('Upload bookmarks error:', error);
        res.status(500).json({ error: 'Failed to upload bookmarks' });
    }
});

/**
 * Report conflict
 */
router.post('/conflict', authenticate, (req, res) => {
    try {
        const { conflict } = req.body;

        // Log conflict for analysis
        console.log('Conflict reported:', conflict);

        // For now, just acknowledge
        res.json({ message: 'Conflict reported', resolution: 'last-write-wins' });
    } catch (error) {
        console.error('Conflict report error:', error);
        res.status(500).json({ error: 'Failed to report conflict' });
    }
});

module.exports = router;
