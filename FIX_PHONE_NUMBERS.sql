-- ================================================================
-- FIX PHONE NUMBERS - RUN THIS IN DBeaver
-- ================================================================
-- This script fixes all 4 issues:
-- 1. Mobile login "User not found" 
-- 2. Mobile password reset "User not found"
-- 3. Announcement SMS broadcasting
-- 4. Announcement email broadcasting
-- ================================================================

-- STEP 1: Add phone numbers to users table
-- ================================================================
-- Update Super Admin (admin)
UPDATE users 
SET phone_number = '916887766', 
    email = 'NammaSociety.notifications@gmail.com' 
WHERE username = 'admin';

-- Update Society Admin
UPDATE users 
SET phone_number = '916887766', 
    email = 'NammaSociety.notifications@gmail.com' 
WHERE username = 'societyadmin';

-- Update paranthamanms user (CRITICAL FIX for mobile login)
UPDATE users 
SET phone_number = '9176787766'
WHERE username = 'paranthamanms';

-- Update other users (keeping original numbers)
UPDATE users SET phone_number = '9988776655' WHERE username = 'testuser';
UPDATE users SET phone_number = '9876543210' WHERE username = 'resident1';

-- Verify users updated
SELECT id, username, email, phone_number, role FROM users ORDER BY username;


-- STEP 2: Sync phone numbers and emails to user_profiles table
-- ================================================================
UPDATE user_profiles up
SET phone_number = u.phone_number,
    email = u.email
FROM users u
WHERE up.user_id = u.id;

-- Verify profiles synced
SELECT user_id, username, email, phone_number, society_name 
FROM user_profiles 
ORDER BY username;


-- STEP 3: Final verification
-- ================================================================
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


-- ================================================================
-- EXPECTED RESULTS:
-- ================================================================
-- Users with phone: 5 (or more)
-- Profiles with phone: 5 (or more)
--
-- Super Admin (admin): 916887766, NammaSociety.notifications@gmail.com
-- Society Admin (societyadmin): 916887766, NammaSociety.notifications@gmail.com
-- paranthamanms: 9176787766 (10-digit format, no country code)
--
-- After running this:
-- 1. Mobile login will work with phone 9176787766 for paranthamanms
-- 2. Mobile login will work with phone 916887766 for both admins
-- 3. Mobile password reset will work
-- 4. Announcements will broadcast via SMS
-- 5. Announcements will broadcast via Email to NammaSociety.notifications@gmail.com
--
-- NOTE: Phone numbers are stored as 10 digits (or 9 digits) WITHOUT country code (+91)
-- The system will handle authentication using these raw numbers only.
-- ================================================================

