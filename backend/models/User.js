const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    passwordHint: {
        type: String,
        default: ''
    },
    masterPasswordHint: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Sync Data embedded in User for simplicity (or can be separate if large)
    syncData: {
        passwords: [{
            id: String,
            url: String,
            username: String,
            password: String, // Encrypted
            createdAt: String,
            updatedAt: String,
            deletedAt: String
        }],
        bookmarks: [{
            id: String,
            title: String,
            url: String,
            createdAt: String,
            updatedAt: String,
            deletedAt: String
        }],
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    }
});

module.exports = mongoose.model('User', UserSchema);
