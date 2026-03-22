# ðŸ§ª Mobile OTP & Forgot Password Testing Guide

**Date:** March 7, 2026  
**Status:** âœ… Ready for Testing

---

## ðŸ“‹ Prerequisites

Before testing, ensure:
1. âœ… All services are running (auth-service, user-service, frontend apps)
2. âœ… Environment variables configured (TWILIO, MAIL)
3. âœ… Phone numbers added to users in database
4. âœ… Twilio phone number is verified (trial account requirement)

---

## ðŸš€ Quick Start Testing

### Step 1: Add Phone Numbers to Users
```powershell
# Run this script to add phone numbers
.\UPDATE_USER_PHONE_NUMBERS.ps1
```

Or manually execute SQL:
```sql
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
```

### Step 2: Open Application
```
http://localhost:4200
```

---

## ðŸ§ª Test Scenarios

### Test 1: Mobile/OTP Login (Happy Path)

**Expected Result:** âœ… User successfully logs in using mobile OTP

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Mobile OTP"** tab
3. Enter mobile number: `9176787766`
4. Enter captcha (displayed above input)
5. Click **"Send OTP"**

**Backend Check:**
- Check auth-service console logs:
  ```
  âœ… Twilio SMS service initialized successfully
  âœ… SMS sent successfully to +919176787766: SMxxxxxxxxxx
  ```

**Phone Check:**
- Receive SMS within 10-30 seconds:
  ```
  ðŸ”’ Your NammaSociety OTP is: 524398
  
  Valid for 5 minutes.
  Do not share this code with anyone.
  ```

**Continue:**
6. Enter OTP: `524398` (from SMS)
7. Click **"Verify OTP"**

**Expected Result:**
- âœ… "Login successful! Redirecting..." message
- âœ… Redirected to dashboard: http://localhost:4203
- âœ… User session active
- âœ… Token stored in localStorage

**Verification:**
```javascript
// Open browser console (F12)
localStorage.getItem('token')  // Should show JWT token
localStorage.getItem('user')   // Should show user object
```

---

### Test 2: Mobile/OTP Login (Invalid OTP)

**Expected Result:** âŒ Error message displayed

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Mobile OTP"** tab
3. Enter mobile number: `9176787766`
4. Enter captcha
5. Click **"Send OTP"**
6. Wait for SMS
7. Enter **wrong OTP**: `000000` (not the OTP from SMS)
8. Click **"Verify OTP"**

**Expected Result:**
- âŒ Error message: "Invalid or expired OTP"
- âŒ Login fails
- âŒ No redirection

---

### Test 3: Mobile/OTP Login (Expired OTP)

**Expected Result:** âŒ OTP expired error

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Mobile OTP"** tab
3. Enter mobile number: `9176787766`
4. Click **"Send OTP"**
5. **Wait 6 minutes** (OTP expires after 5 minutes)
6. Enter correct OTP
7. Click **"Verify OTP"**

**Expected Result:**
- âŒ Error message: "Invalid or expired OTP"
- âŒ OTP no longer valid

**Solution:**
- Click **"Resend OTP"**
- New OTP sent
- Use new OTP within 5 minutes

---

### Test 4: Mobile/OTP Login (Invalid Captcha)

**Expected Result:** âŒ Captcha error

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Mobile OTP"** tab
3. Enter mobile number: `9176787766`
4. Enter **wrong captcha**: Random characters
5. Click **"Send OTP"**

**Expected Result:**
- âŒ Error message: "Invalid captcha. Please try again."
- âŒ Captcha refreshed
- âŒ No OTP sent

---

### Test 5: Forgot Password with SMS (Happy Path)

**Expected Result:** âœ… Password successfully reset

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Forgot Password"**
3. Modal opens
4. Select **"Mobile Number"** option
5. Enter mobile: `9176787766`
6. Click **"Send OTP"**

**Backend Check:**
- Auth-service logs:
  ```
  âœ… SMS sent successfully to +919176787766: SMxxxxxxxxxx
  ```

**Phone Check:**
- Receive SMS with OTP

**Continue:**
7. Enter OTP from SMS
8. Click **"Verify OTP"**

**Expected Result:**
- âœ… "OTP verified successfully"
- âœ… Password reset form appears

**Continue:**
9. Enter new password: `Test@123` (min 6 characters)
10. Confirm new password: `Test@123`
11. Click **"Reset Password"**

**Expected Result:**
- âœ… "Password reset successfully! Please login with your new password."
- âœ… Modal closes after 2 seconds

**Verification:**
12. Try logging in with old password

**Expected Result:**
- âŒ Login fails

13. Try logging in with new password: `Test@123`

**Expected Result:**
- âœ… Login successful

---

### Test 6: Forgot Password with Email (Happy Path)

**Expected Result:** âœ… Password reset via email

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Forgot Password"**
3. Select **"Email"** option
4. Enter email: `admin@example.com`
5. Click **"Send OTP"**

**Backend Check:**
- Auth-service logs:
  ```
  âœ… OTP email sent successfully to admin@example.com
  ```

**Email Check:**
- Check inbox (and spam folder)
- Open email from NammaSociety
- Find OTP in large pink box (6 digits)

**Continue:**
6. Enter OTP from email
7. Click **"Verify OTP"**
8. Enter new password
9. Click **"Reset Password"**

**Expected Result:**
- âœ… Password reset successfully
- âœ… Can login with new password

---

### Test 7: Forgot Password (Invalid Reset Token)

**Expected Result:** âŒ Reset token validation error

**Setup:**
This test verifies the security fix - password cannot be reset without valid OTP verification.

**Steps:**
1. Start forgot password flow
2. Get OTP and verify successfully
3. **Wait 16 minutes** (reset token expires after 15 minutes)
4. Try to reset password

**Expected Result:**
- âŒ Error: "Invalid or expired reset token. Please request a new OTP."
- âŒ Password not reset
- âœ… Security maintained

**Alternative Test (Manual API Call):**
```bash
# Try to reset password without reset token
curl -X POST http://localhost:8001/api/auth/forgot-password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin",
    "method": "mobile",
    "newPassword": "Hacked@123"
  }'
```

**Expected Result:**
- âŒ 401 Unauthorized
- âŒ Error: "Invalid or expired reset token"
- âœ… Password not reset (security fix working)

---

### Test 8: Forgot Password (No Reset Token)

**Expected Result:** âŒ Reset token required

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Forgot Password"**
3. Enter identifier
4. Click **"Send OTP"**
5. **Skip OTP verification** (don't verify OTP)
6. Try to access password reset step directly

**Expected Result:**
- âŒ Cannot proceed without OTP verification
- âŒ Reset token not generated
- âœ… Security maintained

---

### Test 9: Resend OTP Functionality

**Expected Result:** âœ… New OTP sent successfully

**Steps:**
1. Navigate to: http://localhost:4200
2. Click **"Mobile OTP"** tab
3. Enter mobile: `9176787766`
4. Click **"Send OTP"**
5. Note first OTP from SMS
6. Wait a few seconds
7. Click **"Resend OTP"**

**Expected Result:**
- âœ… New OTP sent
- âœ… Timer resets (60 seconds)
- âœ… First OTP no longer valid
- âœ… Only new OTP works

---

### Test 10: Multiple Users with Phone Numbers

**Expected Result:** âœ… Each user can login independently

**Setup:**
```sql
-- Add phone numbers for multiple users
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
UPDATE users SET phone_number = '9176787767' WHERE username = 'john.doe';
UPDATE users SET phone_number = '9176787768' WHERE username = 'jane.smith';
```

**Steps:**
1. Login with mobile: `9176787766`
2. Verify OTP
3. Confirm logged in as `admin`
4. Logout
5. Login with mobile: `9176787767`
6. Verify OTP
7. Confirm logged in as `john.doe`

**Expected Result:**
- âœ… Each mobile number maps to correct user
- âœ… Each user receives OTP separately
- âœ… No OTP cross-contamination

---

## ðŸ” Backend Log Verification

### Auth-Service Startup Logs
```
âœ… Twilio SMS service initialized successfully
âœ… OTP email sent successfully
```

### Successful OTP Send
```
[INFO] OTP stored for identifier: 9176787766, expires at: 2026-03-07T13:05:00
âœ… SMS sent successfully to +919176787766: SM1234567890abcdef
```

### Successful OTP Verification
```
[INFO] OTP verified successfully for identifier: 9176787766
[INFO] Audit log: VERIFY_OTP - Mobile: 9176787766
```

### Failed OTP Verification
```
[WARN] Invalid OTP provided for identifier: 9176787766
```

### Expired OTP
```
[WARN] OTP expired for identifier: 9176787766
```

---

## ðŸ“Š Database Verification

### Check User Phone Numbers
```sql
SELECT id, username, email, phone_number, active 
FROM users 
WHERE phone_number IS NOT NULL;
```

**Expected Output:**
```
 id  | username  |        email         | phone_number | active
-----+-----------+----------------------+--------------+--------
 123 | admin     | admin@example.com    | 9176787766   | t
 456 | john.doe  | john@example.com     | 9176787767   | t
```

### Check Audit Logs (if audit table exists)
```sql
SELECT action, username, details, created_at 
FROM audit_logs 
WHERE action IN ('SEND_OTP', 'VERIFY_OTP', 'LOGIN_BY_MOBILE', 'PASSWORD_RESET')
ORDER BY created_at DESC 
LIMIT 10;
```

---

## ðŸ› Troubleshooting

### Issue: SMS not received

**Check 1: Twilio Account**
```powershell
# Check if Twilio is initialized
# Look for this in auth-service logs:
âœ… Twilio SMS service initialized successfully
```

**Check 2: Phone Number Verified**
- For Twilio trial accounts, phone numbers must be verified
- Login to Twilio console: https://www.twilio.com/console
- Go to Phone Numbers â†’ Verified Caller IDs
- Ensure your test number is verified

**Check 3: Twilio Console**
- Check Twilio Messaging logs
- Look for delivery status
- Check for any errors

**Check 4: Phone Number Format**
```sql
-- Ensure phone number is correct format (10 digits)
SELECT username, phone_number FROM users WHERE username = 'admin';
-- Should be: 9176787766 (not +919176787766)
```

---

### Issue: Email not received

**Check 1: Gmail Configuration**
```powershell
# Verify environment variables
$env:MAIL_USERNAME
# Should be: NammaSociety.notifications@gmail.com

$env:MAIL_PASSWORD
# Should be set (App Password, not regular password)
```

**Check 2: Gmail App Password**
- Regular Gmail password may not work
- Need to generate App Password:
  1. Enable 2FA on Gmail account
  2. Go to: https://myaccount.google.com/apppasswords
  3. Generate new App Password
  4. Update environment variable with new password

**Check 3: Search Spam Folder**
- OTP emails may go to spam initially
- Mark as "Not Spam" to train Gmail

**Check 4: Auth-Service Logs**
```
âœ… OTP email sent successfully to user@example.com
```

---

### Issue: OTP always invalid

**Possible Causes:**
1. **OTP expired** - Use OTP within 5 minutes
2. **Wrong OTP** - Check SMS/Email for correct OTP
3. **Timer mismatch** - Backend and client time not synced
4. **Old OTP** - Using OTP from previous request

**Solution:**
- Request new OTP
- Use immediately after receiving
- Check backend logs for stored OTP (dev only)

---

### Issue: User not found (mobile login)

**Check:**
```sql
-- Verify user has phone number
SELECT id, username, phone_number 
FROM users 
WHERE phone_number = '9176787766';
```

**Solution:**
```sql
-- Add phone number to user
UPDATE users 
SET phone_number = '9176787766' 
WHERE username = 'admin';
```

---

### Issue: Password reset without OTP verification

**This should NOT be possible (security fix implemented)**

**If this happens:**
1. Check auth-service logs for error
2. Verify reset token validation is working
3. Check AuthController.forgotPasswordReset() method

**Expected Behavior:**
- Password reset request without valid reset token â†’ âŒ 401 Unauthorized
- Password reset with expired reset token â†’ âŒ 401 Unauthorized
- Password reset with valid reset token â†’ âœ… 200 OK

---

## ðŸ“± Test Phone Numbers

**For Development/Testing:**
```
Admin:      9176787766
John Doe:   9176787767
Jane Smith: 9176787768
Test User:  9176787769
```

**For Production:**
- Use actual phone numbers
- Ensure numbers are verified in Twilio
- Upgrade Twilio account for unrestricted SMS delivery

---

## ðŸŽ¯ Test Checklist

### Mobile/OTP Login
- [ ] Send OTP button works
- [ ] SMS received on phone
- [ ] Valid OTP passes verification
- [ ] Invalid OTP fails verification
- [ ] Expired OTP fails verification
- [ ] Resend OTP works
- [ ] Login successful after OTP verification
- [ ] JWT token stored in localStorage
- [ ] User redirected to dashboard
- [ ] Captcha validation works

### Forgot Password (SMS)
- [ ] Send OTP button works
- [ ] SMS received on phone
- [ ] Valid OTP passes verification
- [ ] Invalid OTP fails verification
- [ ] Reset token generated after OTP verification
- [ ] Password reset works with valid token
- [ ] Password reset fails without token
- [ ] Old password no longer works
- [ ] New password works for login
- [ ] Reset token invalidated after use

### Forgot Password (Email)
- [ ] Send OTP button works
- [ ] Email received in inbox
- [ ] Email template displays correctly
- [ ] OTP is clearly visible
- [ ] Valid OTP passes verification
- [ ] Password reset successful
- [ ] New password works

### Security
- [ ] Cannot reset password without OTP
- [ ] Cannot reset password without reset token
- [ ] Reset token expires after 15 minutes
- [ ] OTP expires after 5 minutes
- [ ] Old OTP doesn't work after new OTP requested
- [ ] Reset token invalidated after use
- [ ] Audit logs created for all operations

---

## ðŸ“Š Performance Metrics

### Expected Response Times
- Send OTP API: < 2 seconds
- Verify OTP API: < 200ms
- Login by Mobile API: < 300ms
- Password Reset API: < 300ms

### SMS Delivery
- Expected: 10-30 seconds
- Maximum: 2 minutes (Twilio processing)

### Email Delivery
- Expected: 10-60 seconds
- Maximum: 5 minutes (SMTP processing)

---

## ðŸŽ‰ Success Criteria

âœ… **All Tests Pass When:**
1. Mobile/OTP login works end-to-end
2. SMS OTPs delivered reliably
3. Email OTPs delivered reliably
4. Invalid OTPs rejected correctly
5. Expired OTPs rejected correctly
6. Password reset requires OTP verification
7. Reset tokens work correctly
8. Security validations in place
9. Audit logs created
10. Error handling works properly

---

## ðŸ“ž Support

**If tests fail consistently:**
1. Check service logs for errors
2. Verify database schema updated
3. Verify Twilio credentials
4. Verify Gmail App Password
5. Check phone number format in database
6. Ensure services are all running

**Service Restart:**
```powershell
# Stop all services
Get-Process java,node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start all services
.\START_ALL_SERVICES.ps1
```

---

**Ready for Testing! ðŸš€**

Start with Test 1 (Mobile/OTP Login Happy Path) and work through all scenarios to ensure complete functionality.

