const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testDB() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to DB');

        const testEmail = 'test-' + Date.now() + '@example.com';
        const user = await User.create({
            email: testEmail,
            password: 'hashedpassword',
            passwordHint: 'hint',
            masterPasswordHint: 'masterhint'
        });

        console.log('User created:', user.email);

        const foundUser = await User.findOne({ email: testEmail });
        console.log('User found:', foundUser ? 'YES' : 'NO');

        if (foundUser) {
            foundUser.syncData = {
                passwords: [{ id: '1', url: 'google.com', username: 'me', password: 'enc', createdAt: new Date().toISOString() }],
                bookmarks: [],
                lastUpdated: new Date()
            };
            await foundUser.save();
            console.log('Sync data saved');
        }

        await mongoose.disconnect();
        console.log('Test complete');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testDB();
