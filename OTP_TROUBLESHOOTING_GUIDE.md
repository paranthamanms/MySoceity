# OTP Feature Troubleshooting Guide

## Issues Found and Solutions

### ROOT CAUSE: Environment Variables Not Set
All three OTP issues were caused by **missing environment variables** in the service processes.

---

## Issue #1: Email OTP Failed

### Error Message
```
Failed to send OTP: Failed to send OTP email
```

### Root Cause
- Environment variables `MAIL_USERNAME` and `MAIL_PASSWORD` were NOT set
- EmailService could not connect to Gmail SMTP

### Solution Applied
âœ… **FIXED** - Environment variables now set in [SETUP_OTP_ENVIRONMENT.ps1](SETUP_OTP_ENVIRONMENT.ps1)

```powershell
$env:MAIL_USERNAME = "NammaSociety.notifications@gmail.com"
$env:MAIL_PASSWORD = "YOUR_GMAIL_APP_PASSWORD"
```

### Configuration Details
- **SMTP Server**: smtp.gmail.com:587
- **TLS**: STARTTLS enabled
- **Sender**: NammaSociety.notifications@gmail.com
- **Template**: HTML email with OTP styling

### Important Notes
âš ï¸ **If using Gmail:**
1. Regular password may NOT work due to Gmail security
2. You need to generate an **App Password**:
   - Go to Google Account â†’ Security
   - Enable 2-Factor Authentication
   - Generate App Password for "Mail"
   - Replace the placeholder password with the 16-character App Password

### Testing Email OTP
1. Go to Forgot Password page
2. Select "Email" option
3. Enter your email address
4. Click "Send OTP"
5. Check service logs for email sending status
6. Check inbox/spam folder for OTP

**Expected Log Output:**
```
Sending OTP email to: user@example.com
Email sent successfully
```

---

## Issue #2: SMS OTP Shows Success But Not Received

### Error Message
```
"OTP sent successfully to your mobile" but no SMS received
```

### Root Cause
- Environment variables for Twilio were NOT set
- SMSService could not initialize Twilio client
- Code returned success without actually sending

###  Solution Applied
âœ… **FIXED** - Environment variables now set:

```powershell
$env:TWILIO_ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID"
$env:TWILIO_AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN"
$env:TWILIO_PHONE_NUMBER = "+19188712299"
```

### Twilio Trial Account Restrictions
âš ï¸ **IMPORTANT**: Twilio trial accounts have restrictions:

1. **Phone Verification Required**
   - Only verified phone numbers can receive SMS
   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
   - Add your phone number: +919176787766
   - Verify it with the code sent

2. **Limited Credits**
   - Trial accounts have limited free credits
   - Check balance: https://console.twilio.com/

3. **Messaging Logs**
   - View all sent messages: https://console.twilio.com/us1/monitor/logs/sms
   - Check delivery status: sent, delivered, failed, undelivered

### Testing SMS OTP
1. **First**: Verify your phone number in Twilio Console
2. Go to Mobile OTP login or Forgot Password (Mobile)
3. Enter mobile: 9176787766
4. Click "Send OTP"
5. Check Twilio console logs
6. Should receive SMS within 10 seconds

**Expected SMS Format:**
```
Your NammaSociety verification code is: 123456. Valid for 5 minutes. Do not share this code.
```

### Checking Twilio Logs
```powershell
# Service logs will show:
Successfully initialized Twilio client
Sending OTP to: +919176787766
SMS sent successfully. SID: SM...
```

---

## Issue #3: User Not Found with Mobile Number

### Error Message
```
Mobile login failed: User not found with mobile number: 9176787766
```

### Root Cause
- User records in database do NOT have phone_number populated
- Mobile login tries to find user by phone but field is NULL

### Solution Required
âš ï¸ **ACTION NEEDED**: Add phone numbers to users in database

### SQL Script
Run this in DBeaver or PostgreSQL client: [ADD_USER_PHONE_NUMBERS.sql](ADD_USER_PHONE_NUMBERS.sql)

```sql
-- Add phone number to admin user
UPDATE users 
SET phone_number = '9176787766' 
WHERE username = 'admin';

-- Verify
SELECT id, username, email, phone_number 
FROM users 
WHERE phone_number IS NOT NULL;
```

### Using DBeaver
1. Open DBeaver
2. Connect to PostgreSQL database
3. Open SQL Editor
4. Copy and paste the SQL from ADD_USER_PHONE_NUMBERS.sql
5. Execute (Ctrl+Enter or F5)
6. Verify phone_number column is populated

### Phone Number Format
- **Database**: 10 digits without prefix: `9176787766`
- **SMS Sending**: Automatically converted to E.164: `+919176787766`
- **Don't store** as +919176787766 in database

### Testing After Fix
1. Run the SQL UPDATE script
2. Go to Login page â†’ Mobile & OTP tab
3. Enter mobile: 9176787766
4. Click "Send OTP"
5. Should receive SMS
6. Enter OTP and click "Login"
7. Should successfully login

---

## Complete Testing Checklist

### Test 1: Mobile OTP Login
- [ ] Run SQL script to add phone numbers
- [x] Restart services with environment variables
- [ ] Login â†’ Mobile & OTP tab
- [ ] Enter mobile: 9176787766
- [ ] Click "Send OTP"
- [ ] Receive SMS with OTP
- [ ] Enter OTP
- [ ] Click "Login"
- [ ] Successfully logged in
- [ ] Redirected to dashboard

### Test 2: Forgot Password with Email
- [x] Gmail credentials configured
- [x] Services restarted
- [ ] Forgot Password page
- [ ] Select "Email" option
- [ ] Enter email address
- [ ] Click "Send OTP"
- [ ] Receive email with OTP
- [ ] Enter OTP
- [ ] Click "Verify OTP"
- [ ] Enter new password
- [ ] Click "Reset Password"
- [ ] Successfully reset
- [ ] Login with new password

### Test 3: Forgot Password with Mobile
- [x] Twilio credentials configured
- [ ] Phone number verified in Twilio
- [ ] Forgot Password page
- [ ] Select "Mobile" option
- [ ] Enter mobile: 9176787766
- [ ] Click "Send OTP"
- [ ] Receive SMS with OTP
- [ ] Enter OTP
- [ ] Click "Verify OTP"
- [ ] Show "OTP Verified" message
- [ ] Enter new password
- [ ] Click "Reset Password"
- [ ] Login with new password

---

## Configuration Files

### 1. Environment Variables Script
[SETUP_OTP_ENVIRONMENT.ps1](SETUP_OTP_ENVIRONMENT.ps1)
- Sets Twilio and Gmail credentials
- Stops existing services
- Starts services with environment variables

### 2. Database Script
[ADD_USER_PHONE_NUMBERS.sql](ADD_USER_PHONE_NUMBERS.sql)
- Adds phone numbers to users table
- Verifies changes

### 3. Backend Configuration
[backend/auth-service/src/main/resources/application.yml](backend/auth-service/src/main/resources/application.yml)
- SMTP configuration
- Twilio configuration
- Notification flags

---

## Service Logs to Monitor

### Auth-Service Logs (Port 8001)
Look for these messages:

**âœ… Success Messages:**
```
Successfully initialized Twilio client
Sending OTP email to: user@example.com
Email sent successfully
Sending OTP to: +919176787766
SMS sent successfully. SID: SM...
```

**âŒ Error Messages:**
```
Failed to initialize Twilio client: Account credentials are incorrect
Failed to send email: Authentication failed
Failed to send SMS: The 'To' number is not a valid phone number
```

### Common Errors and Fixes

#### "Failed to send email: Authentication failed"
- Gmail App Password not set correctly
- Generate new App Password from Google Account
- Update MAIL_PASSWORD in SETUP_OTP_ENVIRONMENT.ps1

#### "Twilio: The 'To' number +919176787766 is not a verified number"
- Verify phone number in Twilio Console
- Or upgrade from trial account

#### "User not found with mobile number"
- Run ADD_USER_PHONE_NUMBERS.sql script
- Verify phone_number column is populated

#### "OTP has expired"
- OTPs are valid for 5 minutes only
- Request a new OTP

---

## Quick Restart Services

If you need to restart services after configuration changes:

```powershell
# Stop all services
Get-Process -Name java -ErrorAction SilentlyContinue | Stop-Process -Force

# Restart with environment variables
.\SETUP_OTP_ENVIRONMENT.ps1
```

---

## Production Recommendations

### 1. Environment Variables
- Move to system environment variables or secrets manager
- Don't hardcode in scripts
- Use Azure Key Vault or AWS Secrets Manager

### 2. Gmail Configuration
- Use dedicated email service account
- Generate App Password specifically for this app
- Monitor daily sending limits (500 emails/day for free Gmail)

### 3. Twilio Configuration
- Upgrade from trial to production account
- Remove phone verification requirement
- Set up webhook for delivery status
- Monitor SMS costs

### 4. Database Phone Numbers
- Add phone_number validation in registration
- Make it required field for users
- Add unique constraint on phone_number
- Format validation (10 digits)

### 5. Security Enhancements
- Add rate limiting on OTP endpoints (max 3 per 15 minutes)
- Log all OTP requests for audit
- Add CAPTCHA to prevent abuse
- Implement account lockout after failed attempts

---

## Contact Information

- **Twilio Console**: https://console.twilio.com/
- **Gmail Account**: https://myaccount.google.com/
- **Twilio Support**: https://support.twilio.com/

---

## Status After Fix

| Feature | Status | Notes |
|---------|--------|-------|
| Email OTP | âœ… CONFIGURED | Needs Gmail App Password verification |
| SMS OTP | âœ… CONFIGURED | Needs phone verification in Twilio trial |
| Mobile Login | âš ï¸ NEEDS DATA | Run SQL script to add phone numbers |
| Environment Vars | âœ… FIXED | Set in SETUP_OTP_ENVIRONMENT.ps1 |
| Services Running | âœ… YES | Ports 8001, 8002 active |

---

**Next Steps:**
1. Run [ADD_USER_PHONE_NUMBERS.sql](ADD_USER_PHONE_NUMBERS.sql) in DBeaver
2. If Gmail fails, generate App Password and update script
3. If SMS fails, verify phone in Twilio Console
4. Test all three flows end-to-end
5. Monitor service logs for errors

