# SecureSync Authentication Guide

Complete guide to understanding and using the SecureSync authentication system.

## 🔐 Authentication Overview

SecureSync uses a **JWT-based authentication system** with:
- **Access tokens** (15 minutes validity)
- **Refresh tokens** (7 days validity)
- **Bcrypt password hashing** (12 rounds)
- **Automatic token refresh** on expiration

---

## 📡 API Endpoints

The backend server runs on `http://localhost:3000` (configurable in `backend/server.js`).

### Base URL
```
http://localhost:3000/api
```

### Available Endpoints

#### 1. **Sign Up** - Create New Account
```
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "createdAt": "2026-02-09T08:17:29.123Z"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `409` - User already exists
- `500` - Signup failed

---

#### 2. **Login** - Sign In Existing User
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "YourPassword123!"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "createdAt": "2026-02-09T08:17:29.123Z"
  }
}
```

**Error Responses:**
- `400` - Email and password required
- `401` - Invalid credentials
- `500` - Login failed

---

#### 3. **Refresh Token** - Get New Access Token
```
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Refresh token required
- `401` - Invalid refresh token
- `500` - Token refresh failed

---

#### 4. **Logout** - Invalidate Refresh Token
```
POST /api/auth/logout
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## 🧪 Testing with cURL

### 1. Start the Backend Server
```bash
cd backend
npm start
```

Verify it's running:
```bash
curl http://localhost:3000/health
```

### 2. Test Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

### 3. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

### 4. Test Refresh Token
```bash
# Replace YOUR_REFRESH_TOKEN with the token from login response
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

### 5. Test Logout
```bash
# Replace YOUR_REFRESH_TOKEN with the token from login response
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"YOUR_REFRESH_TOKEN\"}"
```

---

## 🔄 How Authentication Works in the Extension

### 1. **User Signs Up/Logs In**
- User opens `auth.html` (via "Sign In / Sign Up" button)
- Enters email and password
- Extension calls `signUp()` or `signIn()` from `auth-service.js`
- Backend validates credentials and returns tokens

### 2. **Token Storage**
- Access token and refresh token are stored in Chrome's local storage
- User email is also stored for display purposes
- Tokens are encrypted at rest

### 3. **Making Authenticated Requests**
- Extension uses `authenticatedFetch()` from `auth-service.js`
- Access token is automatically added to `Authorization` header
- Format: `Authorization: Bearer <access_token>`

### 4. **Automatic Token Refresh**
- When access token expires (15 min), API returns `401 Unauthorized`
- Extension automatically calls refresh endpoint
- New access token is obtained and request is retried
- If refresh fails, user is logged out

### 5. **Logout**
- User clicks logout button
- Extension calls `logout()` from `auth-service.js`
- Refresh token is invalidated on backend
- Local tokens are cleared
- User is redirected to login page

---

## 🛠️ Using the Authentication in Your Extension

### Import the Auth Service
```javascript
import { signUp, signIn, logout, isAuthenticated, getCurrentUserEmail } from './auth/auth-service.js';
```

### Check if User is Authenticated
```javascript
const authenticated = await isAuthenticated();
if (!authenticated) {
  // Redirect to login
}
```

### Get Current User Email
```javascript
const email = await getCurrentUserEmail();
console.log('Logged in as:', email);
```

### Make Authenticated API Calls
```javascript
import { authenticatedFetch } from './auth/auth-service.js';

const response = await authenticatedFetch('http://localhost:3000/api/passwords', {
  method: 'GET'
});

const data = await response.json();
```

---

## 🔒 Security Notes

1. **Password Requirements**: Minimum 8 characters (enforced in UI)
2. **Password Hashing**: Bcrypt with 12 rounds (very secure)
3. **Token Expiry**: Access tokens expire in 15 minutes
4. **HTTPS Required**: Always use HTTPS in production
5. **JWT Secret**: Change `JWT_SECRET` in `.env` for production
6. **CORS**: Backend allows all origins in development (restrict in production)

---

## 📝 Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

---

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:3000/health

# If not, start it
cd backend
npm start
```

### CORS Errors
- Ensure backend is running on `http://localhost:3000`
- Check `backend/server.js` for CORS configuration
- Verify `API_BASE_URL` in `src/auth/auth-service.js` matches backend URL

### "Invalid credentials" Error
- Verify email and password are correct
- Check backend console for error logs
- Ensure user exists (for login) or doesn't exist (for signup)

### Token Refresh Failing
- Check if refresh token is still valid (7 day expiry)
- Verify backend is running
- Check browser console for errors
- Try logging out and logging in again

---

## 📚 Related Files

- **Backend Routes**: [`backend/routes/auth.js`](file:///E:/IDEA%20INTO%20PROJECT/chrome%20extension_for%20password/backend/routes/auth.js)
- **Auth Service**: [`src/auth/auth-service.js`](file:///E:/IDEA%20INTO%20PROJECT/chrome%20extension_for%20password/src/auth/auth-service.js)
- **Auth UI**: [`src/auth/auth-ui.js`](file:///E:/IDEA%20INTO%20PROJECT/chrome%20extension_for%20password/src/auth/auth-ui.js)
- **Auth Page**: [`src/auth/auth.html`](file:///E:/IDEA%20INTO%20PROJECT/chrome%20extension_for%20password/src/auth/auth.html)

---

**Happy authenticating! 🔐**
