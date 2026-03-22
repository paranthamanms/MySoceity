# Admin Login Guide âœ…

## Current Status

### âœ… Backend Services Running
- **Port 8001 (Auth Service)**: âœ… Running and Ready
- **Port 8002 (User Service)**: âœ… Running and Ready
- **Admin User Created**: âœ… Yes - Ready for login

### ðŸ”„ Frontend Services
- **Login MFE (Port 4201)**: ðŸ”„ Starting/Compiling
- **Dashboard MFE (Port 4203)**: ðŸ”„ Will start after login

---

## Admin Credentials

Use these credentials to login:

```
Username: admin
Password: admin@123
```

**Email**: admin@NammaSociety.local

---

## How to Test Admin Login

### Step 1: Wait for Frontend
The Angular frontend is compiling. Wait for the message:
```
âœ” Compiled successfully
```

Once you see that message, the app will be available at:
- **Login Page**: http://localhost:4201

### Step 2: Open Login Page
```
Go to: http://localhost:4201
```

### Step 3: Enter Admin Credentials
```
Username: admin
Password: admin@123
```

### Step 4: Submit Login
- Click the **LOGIN** button
- System will authenticate with backend (port 8001)
- Backend validates credentials and returns JWT token
- Frontend stores token in localStorage
- Redirects to Dashboard (port 4203)

### Step 5: Verify Admin Access
Once redirected to dashboard:
- âœ… Admin Console should be accessible
- âœ… Should see "Admin Panel" or "Management" options
- âœ… Check browser console - should see: `âœ“ Admin user access granted for: admin`
- âŒ Should NOT see: "Non-admin user attempting to access admin console"

---

## Backend Flow (What Happens Behind Scenes)

```
1. User submits login form with admin/admin@123
   â†“
2. Frontend sends POST to http://localhost:8001/api/auth/login
   â†“
3. Auth Service finds admin user in repository
   â†“
4. Verifies password (admin@123) matches stored hash
   â†“
5. Generates JWT token with admin role
   â†“
6. Returns response with:
   {
     "success": true,
     "token": "eyJhbGc...",
     "user": {
       "id": "xxx-xxx",
       "username": "admin",
       "email": "admin@NammaSociety.local",
       "role": "ADMIN",
       "active": true,
       ...other fields...
     }
   }
   â†“
7. Frontend receives response
   â†“
8. Stores user object in localStorage
   â†“
9. Stores JWT token (usually in localStorage or sessionStorage)
   â†“
10. Redirects to /admin path
   â†“
11. AdminGuard checks localStorage for user
   â†“
12. Checks if user.role (in uppercase "ADMIN") matches admin role
   â†“
13. Converts to lowercase ("admin") and compares
   â†“
14. âœ… Access granted! Dashboard loads
```

---

## Expected Console Logs

When you login as admin, check browser console (F12) and look for these logs:

```javascript
âœ“ Admin user access granted for: admin
```

Or more detailed:
```javascript
[AdminDashboard] Admin access check: User 'admin' (ADMIN role) authorized
```

---

## Troubleshooting

### Issue: "Port 4201 not found"
**Cause**: Frontend still compiling  
**Solution**: Wait for `âœ” Compiled successfully` message in terminal  
**Expected wait**: 30-60 seconds depending on machine

### Issue: Login fails with "Invalid credentials"
**Cause**: Might be password mismatch  
**Try**: 
- Username: `admin` (lowercase)
- Password: `admin@123` (with @)
- Check for typos

### Issue: Login succeeds but redirects to login again
**Cause**: Role check failing (role case mismatch)  
**Info**: This has been fixed - role should be "ADMIN" (uppercase) from backend and will be converted to "admin" (lowercase) by frontend

### Issue: "Non-admin user attempting to access admin console"
**Cause**: The role field is being checked  
**Solution**: Already fixed in AdminGuard - checks role.toLowerCase()

### Issue: No JWT token in requests
**Cause**: Token not being set in localStorage  
**Check**: 
- Open browser console
- Run: `localStorage.getItem('token')`
- Should show a long JWT token string starting with `eyJ...`

---

## Verify Everything Works

Once logged in and in admin dashboard:

1. **Check localStorage** (Browser Console):
   ```javascript
   localStorage.getItem('user')  // Should show admin object with role: "ADMIN"
   localStorage.getItem('token') // Should show JWT token
   ```

2. **Verify API calls**:
   - Open Network tab (F12)
   - You should see POST to `/api/auth/login` returning your user object
   - All subsequent requests should have `Authorization: Bearer <token>` header

3. **Check for updated code**:
   - Admin Dashboard should load
   - Should have payment management features
   - Should have detailed console logs for file uploads (from recent fixes)

---

## Next Steps

1. âœ… Wait for frontend to compile
2. âœ… Navigate to http://localhost:4201
3. âœ… Login with admin/admin@123
4. âœ… Verify admin console loads
5. âœ… Test payment upload feature

---

## Services Summary

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Auth Service | 8001 | âœ… Running | http://localhost:8001 |
| User Service | 8002 | âœ… Running | http://localhost:8002 |
| Login MFE | 4201 | ðŸ”„ Starting | http://localhost:4201 |
| Dashboard MFE | 4203 | ðŸ”„ Will Start | http://localhost:4203 |
| Host App | 4200 | â³ TBD | http://localhost:4200 |

---

## Key Points

âœ… **Admin user exists**: Yes, created at startup  
âœ… **Credentials correct**: admin / admin@123  
âœ… **Role is ADMIN**: Uppercase, will be handled by frontend guard  
âœ… **Backend ready**: Auth service responding to requests  
âœ… **Address fixed**: Removed role check issue from admin access  
â³ **Frontend compiling**: Should be ready within 60 seconds  

---

**Once frontend is ready, you'll be able to login as admin successfully!**

Monitor the login-mfe terminal for the "Compiled successfully" message, then try the login.

