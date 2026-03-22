# QUICK FIX: Copy-Paste SQL Queries for DBeaver

## Open DBeaver SQL Editor and Run These Queries

### Query 1: Add Phone Numbers to Users (Copy and Execute)

```sql
-- Add phone numbers to users table
UPDATE users SET phone_number = '9176787766' WHERE username = 'admin';
UPDATE users SET phone_number = '9988776655' WHERE username = 'testuser';
UPDATE users SET phone_number = '9876543210' WHERE username = 'resident1';
UPDATE users SET phone_number = '9765432109' WHERE username = 'societyadmin';

-- Verify update
SELECT id, username, email, phone_number, role FROM users ORDER BY username;
```

### Query 2: Sync to User Profiles (Copy and Execute)

```sql
-- Sync phone numbers to user_profiles
UPDATE user_profiles up
SET phone_number = u.phone_number
FROM users u
WHERE up.user_id = u.id;

-- Verify sync
SELECT user_id, username, email, phone_number, society_name 
FROM user_profiles 
ORDER BY username;
```

### Query 3: Verification (Copy and Execute)

```sql
-- Check final status
SELECT 
    'Users with phone' as category,
    COUNT(*) as count
FROM users 
WHERE phone_number IS NOT NULL

UNION ALL

SELECT 
    'Profiles with phone' as category,
    COUNT(*) as count
FROM user_profiles 
WHERE phone_number IS NOT NULL;
```

## Expected Results

After running these queries, you should see:
- ✅ admin user has phone: 9176787766
- ✅ testuser has phone: 9988776655
- ✅ All user_profiles synced with phone numbers

## Then Test

1. **Mobile Login**: http://localhost:4201 → Mobile & OTP → Enter 9176787766
2. **Forgot Password**: Use mobile 9176787766 → Get OTP → Reset password
3. **Announcements**: Login as admin → Create announcement → ✓ Send Email ✓ Send SMS
