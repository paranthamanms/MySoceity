-- ================================================================
-- ADD PHONE NUMBERS TO EXISTING USERS
-- ================================================================
-- This script adds 10-digit phone numbers to existing users
-- so they can use Mobile OTP login and password reset
-- ================================================================

-- Update admin user with phone number
UPDATE users 
SET phone_number = '9176787766'
WHERE username = 'admin' AND phone_number IS NULL;

-- Update test users (if they exist)
UPDATE users 
SET phone_number = '9988776655'
WHERE username = 'testuser' AND phone_number IS NULL;

UPDATE users 
SET phone_number = '9876543210'
WHERE username = 'resident1' AND phone_number IS NULL;

UPDATE users 
SET phone_number = '9765432109'
WHERE username = 'societyadmin' AND phone_number IS NULL;

-- Add phone numbers to users by society (customize as needed)
-- Format: 10 digits only, no +91 prefix

-- Update all remaining users without phone numbers with dummy numbers
-- (You can customize these based on your actual users)
UPDATE users 
SET phone_number = '91' || LPAD(CAST(id AS TEXT), 8, '0')
WHERE phone_number IS NULL 
AND LENGTH(id) <= 8;

-- Verification query
SELECT 
    id,
    username,
    email,
    phone_number,
    user_type,
    society_name,
    active
FROM users
ORDER BY username;

-- Check how many users still need phone numbers
SELECT 
    COUNT(*) as total_users,
    COUNT(phone_number) as users_with_phone,
    COUNT(*) - COUNT(phone_number) as users_without_phone
FROM users;
