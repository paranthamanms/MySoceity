-- ============================================================
-- Database Schema Migration for NammaSociety
-- Fixes maintenance_payments table structure for Hibernate compatibility
-- ============================================================

-- Ensure maintenance_payments table exists and has all necessary columns
ALTER TABLE IF EXISTS maintenance_payments ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2);
ALTER TABLE IF EXISTS maintenance_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE IF EXISTS maintenance_payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255);
ALTER TABLE IF EXISTS maintenance_payments ADD COLUMN IF NOT EXISTS created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT;
ALTER TABLE IF EXISTS maintenance_payments ADD COLUMN IF NOT EXISTS updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT;

-- Populate amount column from total_amount if empty
UPDATE maintenance_payments SET amount = total_amount WHERE amount IS NULL AND total_amount IS NOT NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_tower_flat ON maintenance_payments(tower_number, flat_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_user_id ON maintenance_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_society_name ON maintenance_payments(society_name);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_status ON maintenance_payments(status);

-- Ensure users table has required columns
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Ensure approval_requests table has all required columns  
ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS tower_number VARCHAR(20);
ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS flat_number VARCHAR(20);
ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT;
ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT;

-- Ensure cr_products table exists
CREATE TABLE IF NOT EXISTS cr_products (
    id BIGSERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    category VARCHAR(100),
    seller_id VARCHAR(255),
    seller VARCHAR(255),
    image TEXT,
    stock INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    society_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure cr_orders table exists
CREATE TABLE IF NOT EXISTS cr_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(100) UNIQUE,
    buyer_id VARCHAR(255),
    buyer_name VARCHAR(255),
    buyer_contact VARCHAR(20),
    buyer_address VARCHAR(500),
    society_name VARCHAR(255),
    total_amount DECIMAL(10, 2),
    payment_method VARCHAR(100),
    payment_status VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cr_products_category ON cr_products(category);
CREATE INDEX IF NOT EXISTS idx_cr_products_seller_id ON cr_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_cr_orders_buyer_id ON cr_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_cr_orders_status ON cr_orders(status);

-- Log migration completion
INSERT INTO changelog (description, executed_at) 
  VALUES ('Database schema migration for maintenance_payments and marketplace', CURRENT_TIMESTAMP)
  ON CONFLICT DO NOTHING;

-- ============================================================
-- Migration complete
-- ============================================================
