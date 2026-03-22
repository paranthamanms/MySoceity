-- Add Phone Numbers to Existing Users
-- Run this in DBeaver or PostgreSQL client

-- Check current users
SELECT id, username, email, phone_number FROM users;

-- Add phone number to admin user
UPDATE users 
SET phone_number = '9176787766' 
WHERE username = 'admin';

-- Add phone numbers to other test users (if they exist)
UPDATE users 
SET phone_number = '9876543210' 
WHERE username = 'testuser';

UPDATE users 
SET phone_number = '8888888888' 
WHERE username = 'manager';

-- Verify changes
SELECT id, username, email, phone_number, active 
FROM users 
WHERE phone_number IS NOT NULL;

-- Display final status
SELECT 
    COUNT(*) as total_users,
    COUNT(phone_number) as users_with_phone,
    COUNT(*) - COUNT(phone_number) as users_without_phone
FROM users;
