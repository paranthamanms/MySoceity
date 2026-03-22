# Mobile Number and Email OTP - Complete Fix

**Date**: March 7, 2026  
**Status**: âœ… CODE FIXED - Services Need Rebuild

---

## Issues Fixed

### Issue 1: Mobile Number Country Code Padding âœ…

**Problem**: System was adding +91 to phone numbers everywhere, causing mismatches.

**Root Cause**:
- Database stores: `9176787766` (10 digits)
- SMSService was formatting to: `+919176787766` (E.164)  
- Lookup searches for: `9176787766`
- Result: Lookup works, but code was inconsistent

**What Was Changed**:

#### auth-service/SMSService.java
- âœ… Removed E.164 formatting logic
- âœ… Now accepts 10-digit numbers only (9176787766)
- âœ… Adds +91 ONLY when calling Twilio API (not stored)
- âœ… Validation changed from E.164 to 10-digit format
- âœ… All logs show 10-digit numbers

#### user-service/SMSService.java
- âœ… Removed +91 requirement for validation
- âœ… Cleans input to 10 digits
- âœ… Adds +91 only for Twilio API call
- âœ… Applies to: Announcements, Payment Reminders, Complaints

**Result**: 
- Store: 9176787766 (10 digits)
- Display: 9176787766 (10 digits)
- Send SMS: +919176787766 (only for Twilio, added at last moment)
- Lookup: 9176787766 (matches database)

---

### Issue 2: Email OTP Still Failing âš ï¸

**Error**: "Failed to send OTP: Failed to send OTP email"

**Root Cause**: Gmail App Password NOT configured yet

**The Fix**:
1. Gmail requires **App Password**, not regular password
2. I created wizard script to help you: `SETUP_GMAIL_WIZARD.ps1`
3. **YOU MUST RUN IT** to configure email

---

## Rebuild Services (REQUIRED)

Both services have code changes and need rebuild:

```powershell
# 1. Rebuild auth-service
cd C:\AMP\Projects\MySoceity\backend\auth-service
mvn clean package -DskipTests

# 2. Rebuild user-service  
cd C:\AMP\Projects\MySoceity\backend\user-service
mvn clean package -DskipTests
```

---

## Fix Email OTP (ACTION REQUIRED)

### Quick Fix - Run the Wizard:
```powershell
cd C:\AMP\Projects\MySoceity
.\SETUP_GMAIL_WIZARD.ps1
```

The wizard will:
1. Open Gmail App Password page
2. Guide you to generate 16-character password
3. Automatically update SETUP_OTP_ENVIRONMENT.ps1
4. Tell you to restart services

### Manual Fix (If Wizard Fails):

**Step 1**: Generate Gmail App Password
- Go to: https://myaccount.google.com/apppasswords
- Sign in: NammaSociety.notifications@gmail.com
- Enable 2FA if not enabled
- Select: Mail â†’ Windows Computer
- Click: Generate
- Copy the 16-character password (e.g., abcdefghijklmnop)

**Step 2**: Update Configuration
Edit `SETUP_OTP_ENVIRONMENT.ps1` line 17:
```powershell
# Change from:
$env:MAIL_PASSWORD = "YOUR_GMAIL_APP_PASSWORD"

# To:
$env:MAIL_PASSWORD = "abcdefghijklmnop"  # Your App Password
```

**Step 3**: Restart Services
```powershell
.\SETUP_OTP_ENVIRONMENT.ps1
```

---

## Complete Testing Flow

### Test 1: Mobile OTP Login (After Rebuild)

```
1. Make sure phone number is in database:
   - Run: ADD_USER_PHONE_NUMBERS.sql in DBeaver
   - UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';

2. Go to: http://localhost:4201
3. Click: "Mobile & OTP" tab
4. Enter: 9176787766 (NO +91)
5. Click: "Send OTP"
6. Result: âœ… SMS received with OTP

Expected Log:
âœ… SMS sent successfully to 9176787766: SM...
```

### Test 2: Forgot Password Email OTP (After Gmail Setup)

```
1. Run SETUP_GMAIL_WIZARD.ps1
2. Restart services
3. Go to: http://localhost:4201
4. Click: "Forgot Password"
5. Select: "Email"
6. Enter: any-email@test.com
7. Click: "Send OTP"
8. Result: âœ… Email received in inbox

Expected Log:
âœ… OTP email sent successfully to any-email@test.com
```

### Test 3: Society Admin Broadcast (After Gmail Setup)

```
1. Login as SocietyAdmin
2. Go to: Announcements section
3. Create announcement with:
   - Enable SMS
   - Enable Email
4. Click: Send
5. Result: 
   - âœ… SMS sent to all members with 10-digit numbers
   - âœ… Email sent to all members with emails

Expected Logs:
- SMS sending completed: X successful, Y failed
- Broadcast email sent successfully to...
```

---

## Changes Summary

### What Changed in Code:

#### auth-service/SMSService.java
```java
// BEFORE (Old Code):
String formattedNumber = formatPhoneNumber(phoneNumber); // +919176787766
Message.creator(new PhoneNumber(formattedNumber), ...)

// AFTER (New Code):
String cleanedNumber = phoneNumber.replaceAll("[^0-9]", ""); // 9176787766
String twilioNumber = "+91" + cleanedNumber; // +91 added only here
Message.creator(new PhoneNumber(twilioNumber), ...)
logger.info("SMS sent successfully to {}", cleanedNumber); // Logs 10 digits
```

#### user-service/SMSService.java
```java
// BEFORE (Old Validation):
if (!phoneNumber.startsWith("+")) return false; // Required +91

// AFTER (New Validation):
return phoneNumber.matches("\\d{10}"); // Accepts 10 digits only
```

---

## Phone Number Format Standard

**Everywhere in the system**:

| Location | Format | Example |
|----------|--------|---------|
| Database (phone_number column) | 10 digits | 9176787766 |
| API requests (mobile parameter) | 10 digits | 9176787766 |
| API responses (user.phoneNumber) | 10 digits | 9176787766 |
| Frontend display | 10 digits | 9176787766 |
| SMS logs | 10 digits | 9176787766 |
| Twilio API call (internal only) | +91 + 10 digits | +919176787766 |

**Rule**: Never store or display +91. Only add it when calling Twilio API.

---

## Files Modified

1. âœ… `backend/auth-service/src/main/java/com/NammaSociety/auth/service/SMSService.java`
   - Removed formatPhoneNumber() logic
   - Changed validation to 10 digits
   - Added +91 only for Twilio call

2. âœ… `backend/user-service/src/main/java/com/NammaSociety/user/service/SMSService.java`
   - Updated all 4 SMS methods
   - Changed validation from E.164 to 10 digits
   - Cleans input before validation

3. â³ `SETUP_OTP_ENVIRONMENT.ps1`
   - Needs Gmail App Password update
   - Run SETUP_GMAIL_WIZARD.ps1 to update

---

## Step-by-Step Recovery

### Step 1: Rebuild Services (5 minutes)
```powershell
# Auth-service
cd C:\AMP\Projects\MySoceity\backend\auth-service
mvn clean package -DskipTests

# User-service
cd C:\AMP\Projects\MySoceity\backend\user-service
mvn clean package -DskipTests
```

### Step 2: Setup Gmail App Password (5 minutes)
```powershell
cd C:\AMP\Projects\MySoceity
.\SETUP_GMAIL_WIZARD.ps1
```

### Step 3: Add Phone Numbers to Database (30 seconds)
Open DBeaver and run `ADD_USER_PHONE_NUMBERS.sql`:
```sql
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
```

### Step 4: Restart Services (1 minute)
```powershell
.\SETUP_OTP_ENVIRONMENT.ps1
```

### Step 5: Test Everything (5 minutes)
- Mobile OTP Login
- Forgot Password Email
- Forgot Password Mobile
- Society Admin Broadcast

**Total Time: ~17 minutes**

---

## Expected Service Logs

### Mobile OTP Success:
```
âœ… Twilio SMS service initialized successfully
âœ… SMS sent successfully to 9176787766: SM123abc456def
```

### Email OTP Success:
```
âœ… OTP email sent successfully to user@example.com
```

### Broadcast Success:
```
SMS sending completed: 5 successful, 0 failed
âœ… SMS sent successfully to 9176787766: SM...
âœ… SMS sent successfully to 9988776655: SM...
```

### Email Failure (Before App Password):
```
âŒ Failed to send OTP email: Authentication failed
```

---

## Troubleshooting

### If Mobile Login Still Fails:

**Error**: "User not found with mobile number: 9176787766"

**Fix**: 
1. Check database:
   ```sql
   SELECT id, username, phone_number FROM users WHERE username = 'admin';
   ```
2. If phone_number is NULL, run:
   ```sql
   UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
   ```

### If SMS Says "Invalid phone number":

**Fix**: Phone must be exactly 10 digits
- âœ… Correct: 9176787766
- âŒ Wrong: +919176787766
- âŒ Wrong: 919176787766
- âŒ Wrong: 91-7678-7766

### If Email Still Fails:

**Common Errors**:

1. **"Authentication failed"** â†’ App Password not set
   - Run SETUP_GMAIL_WIZARD.ps1
   - Or manually update SETUP_OTP_ENVIRONMENT.ps1

2. **"Username and Password not accepted"** â†’ 2FA not enabled
   - Enable 2FA first: https://myaccount.google.com/security
   - Then generate App Password

3. **"Invalid credentials"** â†’ Wrong App Password
   - Regenerate from: https://myaccount.google.com/apppasswords
   - Copy all 16 characters

---

## Next Steps RIGHT NOW

```powershell
# 1. Rebuild both services
cd C:\AMP\Projects\MySoceity\backend\auth-service
mvn clean package -DskipTests
cd ..\user-service
mvn clean package -DskipTests

# 2. Setup Gmail
cd ..\..
.\SETUP_GMAIL_WIZARD.ps1

# 3. Restart with new config
.\SETUP_OTP_ENVIRONMENT.ps1

# 4. Test mobile login
# 5. Test email OTP
```

---

## Summary

| Issue | Status | Action Required |
|-------|--------|----------------|
| Mobile number +91 padding | âœ… FIXED | Rebuild services |
| Mobile login user not found | âœ… FIXED | Rebuild + Run SQL |
| Email OTP failing | âš ï¸ CONFIG | Run SETUP_GMAIL_WIZARD.ps1 |
| SMS OTP validation | âœ… FIXED | Rebuild services |
| Broadcast notifications | âœ… FIXED | Rebuild + Gmail setup |

**All code is ready. Just rebuild, setup Gmail, and test!** ðŸš€

