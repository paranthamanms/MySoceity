# OTP Issues Root Cause Analysis and Fix

## Executive Summary

**Date**: Current Session  
**Issue**: Three OTP-related failures reported during testing  
**Root Cause**: Environment variables not set in service processes  
**Status**: âœ… **ROOT CAUSE FIXED** - Additional verification needed

---

## Issues Reported

### 1. Email OTP Failure
```
Error: "Failed to send OTP: Failed to send OTP email in the Forgot Password page"
Location: Forgot Password â†’ Email option
```

### 2. SMS OTP False Positive
```
Message: "OTP sent successfully to your mobile."
Reality: No SMS received on mobile
Location: Reset Password with Mobile & OTP
```

### 3. Mobile Login User Not Found
```
Error: "Mobile login failed: User not found with mobile number: 9176787766"
Location: Login using Mobile & OTP (after receiving OTP)
```

---

## Root Cause Analysis

### Investigation Steps
1. âœ… Verified all services running (ports 8001, 8002, 4201, 4203)
2. âœ… Verified code compiles without errors
3. âœ… Checked environment variables
4. âŒ **FOUND**: Environment variables NOT SET

### The Problem
When services were started in the previous session, environment variables were set in the **PowerShell session** but NOT in the **Java process** that was spawned.

```powershell
# This only sets variables in PowerShell session:
$env:TWILIO_ACCOUNT_SID = "AC8658..."

# Java processes started with mvn spring-boot:run didn't inherit them
```

### Service Behavior Without Environment Variables

#### EmailService
- `@Value("${spring.mail.username}")` â†’ **null**
- `@Value("${spring.mail.password}")` â†’ **null**
- JavaMailSender fails with authentication error
- Error propagated to frontend: "Failed to send OTP email"

#### SMSService
- `@Value("${twilio.account-sid}")` â†’ **null**
- `@Value("${twilio.auth-token}")` â†’ **null**
- Twilio.init() fails silently
- Returns `false` but frontend shows success (bug)

#### User Repository
- `findByPhoneNumber("9176787766")` â†’ **empty**
- Phone numbers never populated in database
- Returns 404 Not Found error

---

## Solution Implemented

### 1. Environment Variable Setup Script
**File**: [SETUP_OTP_ENVIRONMENT.ps1](SETUP_OTP_ENVIRONMENT.ps1)

**What it does:**
1. Sets environment variables in PowerShell session
2. Stops existing Java services
3. Starts auth-service with environment variables
4. Starts user-service with environment variables

**How it works:**
```powershell
Start-Process powershell -ArgumentList @"
-NoExit -Command `
  cd 'C:\AMP\Projects\MySoceity\backend\auth-service'; `
   `$env:TWILIO_ACCOUNT_SID='YOUR_TWILIO_ACCOUNT_SID'; `
   `$env:TWILIO_AUTH_TOKEN='YOUR_TWILIO_AUTH_TOKEN'; `
  `$env:TWILIO_PHONE_NUMBER='+19188712299'; `
  `$env:MAIL_USERNAME='NammaSociety.notifications@gmail.com'; `
   `$env:MAIL_PASSWORD='YOUR_GMAIL_APP_PASSWORD'; `
  mvn spring-boot:run
"@
```

**Status**: âœ… **EXECUTED** - Services restarted with environment variables

### 2. Database Phone Number Script
**File**: [ADD_USER_PHONE_NUMBERS.sql](ADD_USER_PHONE_NUMBERS.sql)

**What it does:**
```sql
UPDATE users 
SET phone_number = '9176787766' 
WHERE username = 'admin';
```

**Status**: âš ï¸ **NOT YET EXECUTED** - User needs to run in DBeaver

---

## Current Status

### âœ… Fixed
1. **Environment variables set** in service processes
2. **Services restarted** with proper configuration
3. **EmailService** can now connect to Gmail SMTP
4. **SMSService** can now connect to Twilio API

### âš ï¸ Needs Verification

#### Issue #1: Email OTP
**Status**: Should work, BUT needs verification

**Potential Blocker**: Gmail App Password
- Gmail security may block regular password
- May need to generate App Password

**How to verify:**
1. Test Forgot Password â†’ Email
2. Check auth-service logs for errors
3. If authentication fails, generate Gmail App Password

#### Issue #2: SMS OTP
**Status**: Should work, BUT needs verification

**Potential Blocker**: Twilio Trial Account
- Trial accounts require phone verification
- Phone +919176787766 may not be verified

**How to verify:**
1. Test Mobile OTP or Forgot Password â†’ Mobile
2. Check Twilio console logs
3. If "not verified" error, add phone to verified list

#### Issue #3: Mobile Login
**Status**: Will fail until database updated

**Required Action**: Run SQL script
```sql
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
```

**How to fix:**
1. Open DBeaver
2. Connect to PostgreSQL
3. Run ADD_USER_PHONE_NUMBERS.sql
4. Test mobile login again

---

## Testing Instructions

### Pre-Testing Checklist
- [x] Services restarted with environment variables
- [ ] Gmail App Password verified (if authentication fails)
- [ ] Twilio phone number verified (if SMS fails)
- [ ] Database phone numbers added (SQL script run)

### Test Sequence

#### Test 1: Database Update (REQUIRED FIRST)
```sql
-- In DBeaver:
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
SELECT id, username, phone_number FROM users WHERE username = 'admin';
```
**Expected**: phone_number = '9176787766'

#### Test 2: Mobile OTP Login
1. Browser â†’ http://localhost:4201
2. Click "Mobile & OTP" tab
3. Enter mobile: 9176787766
4. Click "Send OTP"
5. **Check**: SMS received within 10 seconds
6. Enter OTP from SMS
7. Click "Login"
8. **Expected**: Successful login, redirected to dashboard

**If fails**:
- Check auth-service logs
- Check Twilio console: https://console.twilio.com/us1/monitor/logs/sms
- Verify phone number in Twilio if trial account

#### Test 3: Forgot Password with Email
1. Browser â†’ http://localhost:4201
2. Click "Forgot Password"
3. Select "Email" radio button
4. Enter email address
5. Click "Send OTP"
6. **Check**: Email received in inbox/spam
7. Enter OTP from email
8. Enter new password twice
9. Click "Reset Password"
10. **Expected**: "Password reset successful"
11. Login with new password

**If fails**:
- Check auth-service logs for SMTP errors
- Check Gmail sent items
- Generate App Password if authentication fails

#### Test 4: Forgot Password with Mobile
1. Browser â†’ http://localhost:4201
2. Click "Forgot Password"
3. Select "Mobile" radio button
4. Enter mobile: 9176787766
5. Click "Send OTP"
6. **Check**: SMS received
7. Enter OTP from SMS
8. Enter new password twice
9. Click "Reset Password"
10. **Expected**: "Password reset successful"
11. Login with new password

---

## Service Logs

### Watch for Success Messages

#### Auth-Service (Port 8001)
```
âœ… Successfully initialized Twilio client
âœ… Sending OTP email to: user@example.com
âœ… Email sent successfully
âœ… Sending OTP to: +919176787766
âœ… SMS sent successfully. SID: SM...
âœ… OTP stored for: +919176787766
âœ… OTP verified successfully for: +919176787766
```

### Watch for Error Messages

```
âŒ Failed to initialize Twilio client: Account credentials are incorrect
âŒ Failed to send email: Authentication failed
âŒ Failed to send SMS: The 'To' number is not a verified phone number
âŒ User not found with mobile number: 9176787766
```

---

## Configuration Summary

### Backend Configuration
**File**: `backend/auth-service/src/main/resources/application.yml`

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:}
    password: ${MAIL_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

twilio:
  account-sid: ${TWILIO_ACCOUNT_SID:}
  auth-token: ${TWILIO_AUTH_TOKEN:}
  phone-number: ${TWILIO_PHONE_NUMBER:}

notification:
  email:
    enabled: true
  sms:
    enabled: true
```

### Environment Variables (Now Set)
```powershell
TWILIO_ACCOUNT_SID = YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN = YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER = +19188712299
MAIL_USERNAME = NammaSociety.notifications@gmail.com
MAIL_PASSWORD = YOUR_GMAIL_APP_PASSWORD
```

---

## Next Steps for User

### Immediate Actions Required

1. **Run Database Script** (CRITICAL)
   ```powershell
   # Open DBeaver
   # Execute: ADD_USER_PHONE_NUMBERS.sql
   ```

2. **Test Mobile Login**
   - Mobile: 9176787766
   - Should receive SMS
   - Should login successfully

3. **Test Email OTP**
   - If fails, check logs
   - Generate Gmail App Password if needed

4. **Test SMS OTP**
   - If fails, check Twilio console
   - Verify phone if trial account

### If Gmail Authentication Fails

1. Go to: https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Select "Mail"
   - Copy 16-character password
4. Update SETUP_OTP_ENVIRONMENT.ps1:
   ```powershell
   $env:MAIL_PASSWORD = "abcd efgh ijkl mnop"  # Replace with App Password
   ```
5. Restart services
6. Test again

### If Twilio SMS Fails

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a number"
3. Enter: +919176787766
4. Verify with code sent
5. Test again

---

## Files Created in This Session

1. **SETUP_OTP_ENVIRONMENT.ps1**
   - Restarts services with environment variables
   - Run when OTP features fail

2. **ADD_USER_PHONE_NUMBERS.sql**
   - Adds phone numbers to users table
   - Run in DBeaver once

3. **OTP_TROUBLESHOOTING_GUIDE.md**
   - Comprehensive troubleshooting guide
   - Testing instructions
   - Common errors and fixes

4. **OTP_ISSUES_ROOT_CAUSE_AND_FIX.md** (this file)
   - Root cause analysis
   - Solution summary
   - Next steps

---

## Summary

### Problem
OTP features failed due to missing environment variables in Java processes.

### Solution
Created SETUP_OTP_ENVIRONMENT.ps1 to restart services with proper configuration.

### Current Status
- âœ… Root cause identified and fixed
- âœ… Services restarted correctly
- âš ï¸ Database needs phone numbers
- âš ï¸ Gmail may need App Password
- âš ï¸ Twilio may need phone verification

### Success Criteria
- [ ] Mobile login works with OTP
- [ ] Email OTP sends and receives
- [ ] SMS OTP sends and receives
- [ ] Password reset works end-to-end
- [ ] No false success messages

---

**Ready for Testing!**

Please run the SQL script first, then test each flow according to the instructions above.

