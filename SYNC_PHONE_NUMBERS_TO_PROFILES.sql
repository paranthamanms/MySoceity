-- ================================================================
-- SYNC PHONE NUMBERS FROM USERS TO USER_PROFILES
-- ================================================================
-- This script copies phone numbers from users table to user_profiles table
-- so announcements can be broadcast via SMS
-- ================================================================

-- Update user_profiles with phone numbers from users table
UPDATE user_profiles up
SET phone_number = u.phone_number
FROM users u
WHERE up.user_id = u.id
AND u.phone_number IS NOT NULL;

-- Verification query
SELECT 
    up.user_id,
    up.username,
    up.email,
    up.phone_number,
    up.society_name,
    up.active
FROM user_profiles up
ORDER BY up.username;

-- Check how many profiles have phone numbers
SELECT 
    COUNT(*) as total_profiles,
    COUNT(phone_number) as profiles_with_phone,
    COUNT(*) - COUNT(phone_number) as profiles_without_phone
FROM user_profiles;

-- Show which users have phone in users table but not in profiles
SELECT 
    u.id,
    u.username,
    u.phone_number as user_phone,
    up.phone_number as profile_phone,
    CASE 
        WHEN up.phone_number IS NULL THEN 'Missing in profile'
        WHEN u.phone_number != up.phone_number THEN 'Mismatch'
        ELSE 'Synced'
    END as status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.phone_number IS NOT NULL;
