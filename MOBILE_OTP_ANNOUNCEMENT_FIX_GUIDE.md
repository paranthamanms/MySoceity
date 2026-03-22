# COMPLETE FIX GUIDE: Mobile OTP & Announcements Issues

## Issues Identified

### âœ… Issue 1 & 2: Mobile Login & Password Reset Failing
**Problem**: "User not found with mobile number: 9176787766"

**Root Cause**: 
- Users in the `users` table don't have `phone_number` set
- AuthController looks up users by `phone_number` field
- Without phone numbers in database, mobile OTP login/reset fails

### âœ… Issue 3: Email OTP Working
**Status**: âœ… Working correctly (users have emails in database)

### âœ… Issue 4: Announcements Not Broadcasting
**Problem**: Broadcasts not reaching users via SMS/Email

**Root Cause**:
- AnnouncementService queries `user_profiles` table for society members
- `user_profiles.phone_number` field is NULL or not synced
- Without phone numbers in profiles, SMS broadcasts fail

---

## SOLUTIONS

### Solution 1: Add Phone Numbers to Users Table

**File Created**: `ADD_PHONE_NUMBERS_TO_USERS.sql`

**What it does**:
1. Adds phone number `9176787766` to admin user
2. Adds phone numbers to test users
3. Auto-generates phone numbers for remaining users
4. Uses 10-digit format (no +91 prefix)

**Run this command**:
```powershell
# Connect to PostgreSQL and run the script
$env:PGPASSWORD = "YOUR_DATABASE_PASSWORD"
cd C:\AMP\Projects\MySoceity

# Option 1: Using psql (if available)
psql -U postgres -d postgres -f ADD_PHONE_NUMBERS_TO_USERS.sql

# Option 2: Using DBeaver
# 1. Open DBeaver
# 2. Connect to postgres database
# 3. Open SQL Editor
# 4. Copy contents of ADD_PHONE_NUMBERS_TO_USERS.sql
# 5. Execute (Ctrl+Enter)
```

### Solution 2: Sync Phone Numbers to User Profiles

**File Created**: `SYNC_PHONE_NUMBERS_TO_PROFILES.sql`

**What it does**:
1. Copies phone numbers from `users` table to `user_profiles` table
2. Ensures announcement broadcasts can find phone numbers
3. Verifies sync status

**Run this command**:
```powershell
# Same as above - run in DBeaver or psql
psql -U postgres -d postgres -f SYNC_PHONE_NUMBERS_TO_PROFILES.sql
```

---

## STEP-BY-STEP FIX PROCEDURE

### Step 1: Open DBeaver
1. Launch DBeaver
2. Connect to **localhost:5432** PostgreSQL database
3. Username: `postgres`
4. Password: `YOUR_DATABASE_PASSWORD`
5. Database: `postgres`

### Step 2: Add Phone Numbers to Users
1. In DBeaver, click **SQL Editor** (Ctrl+])
2. Open file: `C:\AMP\Projects\MySoceity\ADD_PHONE_NUMBERS_TO_USERS.sql`
3. Review the SQL statements
4. Click **Execute** or press **Ctrl+Enter**
5. Check output - should see "UPDATE" messages
6. Verify using the SELECT query at the end

**Expected Result**:
```
username    | email                           | phone_number
------------+---------------------------------+-------------
admin       | admin@NammaSociety.com             | 9176787766
testuser    | test@example.com                | 9988776655
```

### Step 3: Sync Phone Numbers to Profiles
1. In same SQL Editor
2. Open file: `C:\AMP\Projects\MySoceity\SYNC_PHONE_NUMBERS_TO_PROFILES.sql`
3. Click **Execute** or press **Ctrl+Enter**
4. Check output - should see "UPDATE user_profiles"
5. Verify using the SELECT queries

**Expected Result**:
```
total_profiles | profiles_with_phone | profiles_without_phone
---------------+---------------------+-----------------------
5              | 5                   | 0
```

### Step 4: Restart Services
Services are already running, but restart to ensure fresh data load:

```powershell
cd C:\AMP\Projects\MySoceity
.\SETUP_OTP_ENVIRONMENT.ps1
```

Wait 30 seconds for services to fully start.

### Step 5: Test Mobile OTP Login
1. Open **http://localhost:4201**
2. Click **"Mobile & OTP"** tab
3. Enter phone number: `9176787766` (no +91)
4. Click **"Send OTP"**
5. âœ… **Expected**: SMS received within 10 seconds
6. Enter OTP code
7. Click **"Login"**
8. âœ… **Expected**: Login successful, dashboard loads

**If still fails**:
- Check service logs for user lookup errors
- Verify phone number in database: `SELECT * FROM users WHERE username='admin';`

### Step 6: Test Forgot Password with Mobile
1. Click **"Forgot Password"**
2. Select **"Mobile"** option
3. Enter: `9176787766`
4. Click **"Send OTP"**
5. âœ… **Expected**: SMS received
6. Enter OTP
7. Set new password
8. âœ… **Expected**: Password reset successful

### Step 7: Test Announcement Broadcasting
1. Login as **SocietyAdmin** (username: `admin`, password: your password)
2. Go to **Announcements** section in dashboard
3. Click **"Create Announcement"**
4. Fill in:
   - **Title**: "Test Broadcast"
   - **Content**: "Testing SMS and Email notifications"
   - **Priority**: "High"
   - âœ… **Check "Send Email"**
   - âœ… **Check "Send SMS"**
5. Click **"Send Announcement"**
6. Check service logs in user-service window

**Expected Logs**:
```
âœ… Sending announcement notifications to 5 users in society: Spring Valley
âœ… Sending email to 5 recipients
âœ… Broadcast email sent successfully
âœ… Sending SMS to 5 recipients
âœ… SMS sent successfully to 9176787766: SM...
âœ… SMS sent successfully to 9988776655: SM...
```

**If broadcasts don't work**:
- Check user-service logs for errors
- Verify `user_profiles` has phone numbers: `SELECT * FROM user_profiles;`
- Check `sendEmail` and `sendSMS` checkboxes are enabled in UI

---

## VERIFICATION QUERIES

### Check Users Have Phone Numbers
```sql
SELECT id, username, email, phone_number, role, society_name 
FROM users 
ORDER BY username;
```

### Check User Profiles Have Phone Numbers  
```sql
SELECT user_id, username, email, phone_number, society_name 
FROM user_profiles 
ORDER BY username;
```

### Check Announcement Count
```sql
SELECT COUNT(*) as total_announcements, 
       COUNT(CASE WHEN active = true THEN 1 END) as active_announcements
FROM announcements;
```

### Check Specific User Phone Number
```sql
SELECT * FROM users WHERE username = 'admin';
SELECT * FROM user_profiles WHERE username = 'admin';
```

---

## TROUBLESHOOTING

### Mobile Login Still Fails After Adding Phone Numbers

**Check 1**: Verify phone number in database
```sql
SELECT username, phone_number FROM users WHERE username = 'admin';
```

**Check 2**: Check service logs for exact error
Look at auth-service terminal window for:
```
User not found with mobile number: 9176787766
OR
findByPhoneNumber: Searching for: 9176787766
```

**Check 3**: Restart services to reload data
```powershell
.\SETUP_OTP_ENVIRONMENT.ps1
```

### Announcements Not Broadcasting

**Check 1**: Verify user_profiles have phone numbers
```sql
SELECT user_id, username, phone_number, society_name 
FROM user_profiles 
WHERE society_name = 'Spring Valley';
```

**Check 2**: Check if profiles exist for users
```sql
SELECT u.username, u.phone_number as user_phone, up.phone_number as profile_phone
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;
```

**If profiles missing**:
- Users created before profile sync
- Need to manually create profiles in user-service

**Check 3**: Verify announcement has sendEmail/sendSMS flags
- In frontend, ensure checkboxes are checked before sending
- In logs, look for: "Sending email to X recipients"

**Check 4**: Check Twilio SMS is enabled
Look for in logs:
```
âœ… Twilio SMS service initialized successfully
```

If disabled:
```
âš ï¸ Twilio SMS service is disabled
```

Then check environment variables are set.

### SMS Not Received

**Issue**: OTP sent successfully in logs but SMS not arriving

**Possible Causes**:
1. **Twilio trial account** - Only verified numbers can receive SMS
2. **Wrong phone format** - Should be 10 digits (9176787766)
3. **Twilio credentials** - Verify TWILIO_AUTH_TOKEN is correct

**Solution**:
1. Go to https://www.twilio.com/console
2. Add phone number `9176787766` to **Verified Caller IDs**
3. Complete phone verification
4. Try sending OTP again

---

## SUCCESS CRITERIA

âœ… **Mobile Login Working**:
- Can enter 10-digit phone number
- Receives OTP SMS within 10 seconds
- Can login with OTP
- Dashboard loads successfully

âœ… **Mobile Password Reset Working**:
- Can request OTP via mobile
- Receives SMS
- Can reset password with OTP
- Can login with new password

âœ… **Email OTP Working**:
- Already working (no changes needed)

âœ… **Announcements Broadcasting**:
- Service logs show: "Sending email to X recipients"
- Service logs show: "Sending SMS to X recipients"
- Emails received in inbox
- SMS received on phones
- All society members notified

---

## FILES CREATED

1. **ADD_PHONE_NUMBERS_TO_USERS.sql**
   - Adds phone numbers to users table
   - 10-digit format (9176787766)

2. **SYNC_PHONE_NUMBERS_TO_PROFILES.sql**
   - Syncs phone numbers from users to user_profiles
   - Required for announcement broadcasting

3. **This guide: MOBILE_OTP_ANNOUNCEMENT_FIX_GUIDE.md**

---

## NEXT STEPS

1. âœ… Run ADD_PHONE_NUMBERS_TO_USERS.sql in DBeaver
2. âœ… Run SYNC_PHONE_NUMBERS_TO_PROFILES.sql in DBeaver
3. âœ… Restart services (.\SETUP_OTP_ENVIRONMENT.ps1)
4. âœ… Test mobile login (http://localhost:4201)
5. âœ… Test mobile password reset
6. âœ… Test announcement broadcasting

All issues should be resolved after these steps!

