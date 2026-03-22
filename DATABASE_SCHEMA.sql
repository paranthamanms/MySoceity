-- NammaSociety PostgreSQL Database Schema
-- Created: March 3, 2026
-- Comprehensive schema with separate tables for all features

-- ============================================
-- 1. SOCIETIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS societies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    total_towers INT DEFAULT 0,
    total_flats INT DEFAULT 0,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    scanner_code VARCHAR(120),
    scanner_code_updated_at BIGINT DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    active BOOLEAN DEFAULT true,
    CONSTRAINT uk_society_name UNIQUE (name)
);

CREATE INDEX idx_societies_name ON societies(name);
CREATE INDEX idx_societies_active ON societies(active);

-- ============================================
-- 2. USERS / USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    user_type VARCHAR(50) NOT NULL, -- 'admin', 'superadmin', 'owner', 'tenant'
    owner_type VARCHAR(50), -- 'resident', 'non-resident', 'super-admin', 'society-admin'
    role VARCHAR(50) DEFAULT 'USER', -- 'ADMIN', 'SUPER-ADMIN', 'SOCIETY-ADMIN', 'USER'
    society_name VARCHAR(255),
    tower_number VARCHAR(20),
    flat_number VARCHAR(20),
    phone_number VARCHAR(20),
    alternate_phone VARCHAR(20),
    address TEXT,
    created_date BIGINT NOT NULL,
    last_login BIGINT,
    status VARCHAR(20) DEFAULT 'active',
    CONSTRAINT fk_user_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE SET NULL
);

CREATE INDEX idx_users_username ON user_profiles(username);
CREATE INDEX idx_users_email ON user_profiles(email);
CREATE INDEX idx_users_user_type ON user_profiles(user_type);
CREATE INDEX idx_users_society ON user_profiles(society_name);
CREATE INDEX idx_users_tower_flat ON user_profiles(tower_number, flat_number);
CREATE INDEX idx_users_status ON user_profiles(status);

-- ============================================
-- 3. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    tower VARCHAR(20),
    flat VARCHAR(20),
    amount DECIMAL(10, 2) NOT NULL,
    payment_type VARCHAR(50) NOT NULL, -- 'MAINTENANCE', 'AMENITY', 'PENALTY', 'OTHER'
    payment_method VARCHAR(50), -- 'ONLINE', 'CASH', 'CHEQUE', 'UPI'
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
    payment_date BIGINT,
    due_date BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_society ON payments(society_name);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_tower_flat ON payments(tower, flat);

-- ============================================
-- 4. MAINTENANCE PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_payments (
    id BIGSERIAL PRIMARY KEY,
    payment_id VARCHAR(100) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    tower VARCHAR(20),
    flat VARCHAR(20),
    quarter_name VARCHAR(50) NOT NULL, -- 'Q1 2026', 'Q2 2026', etc.
    quarter_year INT NOT NULL,
    quarter_number INT NOT NULL CHECK (quarter_number BETWEEN 1 AND 4),
    base_amount DECIMAL(10, 2) NOT NULL,
    additional_fields JSONB, -- For dynamic additional charges
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    payment_date BIGINT,
    due_date BIGINT NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_maintenance_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_maintenance_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_maintenance_user ON maintenance_payments(user_id);
CREATE INDEX idx_maintenance_society ON maintenance_payments(society_name);
CREATE INDEX idx_maintenance_status ON maintenance_payments(status);
CREATE INDEX idx_maintenance_quarter ON maintenance_payments(quarter_year, quarter_number);
CREATE INDEX idx_maintenance_tower_flat ON maintenance_payments(tower, flat);

-- ============================================
-- 5. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
    id BIGSERIAL PRIMARY KEY,
    announcement_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    author_id VARCHAR(50),
    author_name VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    expires_at BIGINT,
    active BOOLEAN DEFAULT true,
    CONSTRAINT fk_announcement_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_author FOREIGN KEY (author_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_announcements_society ON announcements(society_name);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_active ON announcements(active);
CREATE INDEX idx_announcements_created ON announcements(created_at DESC);

-- ============================================
-- 6. COMPLAINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(50) PRIMARY KEY,
    society_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'MAINTENANCE', 'SECURITY', 'NOISE', 'OTHER'
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    reporter_id VARCHAR(50),
    reporter_name VARCHAR(255),
    assigned_to VARCHAR(50),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    resolved_at BIGINT,
    CONSTRAINT fk_complaint_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE,
    CONSTRAINT fk_complaint_reporter FOREIGN KEY (reporter_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_complaint_assigned FOREIGN KEY (assigned_to) REFERENCES user_profiles(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_complaints_society ON complaints(society_name);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_reporter ON complaints(reporter_id);
CREATE INDEX idx_complaints_created ON complaints(created_at DESC);

-- ============================================
-- 7. COMPLAINT ATTACHMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id BIGSERIAL PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL,
    attachment_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_at BIGINT NOT NULL,
    CONSTRAINT fk_attachment_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
);

CREATE INDEX idx_attachments_complaint ON complaint_attachments(complaint_id);

-- ============================================
-- 8. COMMUNITY POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id VARCHAR(50) PRIMARY KEY,
    society_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    category VARCHAR(50), -- 'EVENT', 'SALE', 'HELP_WANTED', 'GENERAL'
    author_id VARCHAR(50),
    author_name VARCHAR(255),
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    active BOOLEAN DEFAULT true,
    CONSTRAINT fk_post_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE,
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_posts_society ON community_posts(society_name);
CREATE INDEX idx_posts_category ON community_posts(category);
CREATE INDEX idx_posts_author ON community_posts(author_id);
CREATE INDEX idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX idx_posts_active ON community_posts(active);

-- ============================================
-- 9. COMMUNITY POST IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_post_images (
    id BIGSERIAL PRIMARY KEY,
    post_id VARCHAR(50) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    uploaded_at BIGINT NOT NULL,
    CONSTRAINT fk_image_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_images_post ON community_post_images(post_id);

-- ============================================
-- 10. AMENITIES TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS amenities (
    id BIGSERIAL PRIMARY KEY,
    amenity_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amenity_type VARCHAR(50), -- 'CLUBHOUSE', 'SWIMMING_POOL', 'GYM', 'PARTY_HALL', 'SPORTS'
    capacity INT,
    hourly_rate DECIMAL(10, 2),
    daily_rate DECIMAL(10, 2),
    available BOOLEAN DEFAULT true,
    operating_hours VARCHAR(100),
    rules TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_amenity_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_amenities_society ON amenities(society_name);
CREATE INDEX idx_amenities_type ON amenities(amenity_type);
CREATE INDEX idx_amenities_available ON amenities(available);

-- ============================================
-- 11. AMENITY BOOKINGS TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS amenity_bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_id VARCHAR(50) NOT NULL UNIQUE,
    amenity_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    booking_date VARCHAR(20) NOT NULL, -- 'YYYY-MM-DD'
    start_time VARCHAR(10), -- 'HH:mm'
    end_time VARCHAR(10), -- 'HH:mm'
    booking_type VARCHAR(20), -- 'HOURLY', 'HALF_DAY', 'FULL_DAY'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    total_amount DECIMAL(10, 2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_booking_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_amenity ON amenity_bookings(amenity_id);
CREATE INDEX idx_bookings_user ON amenity_bookings(user_id);
CREATE INDEX idx_bookings_date ON amenity_bookings(booking_date);
CREATE INDEX idx_bookings_status ON amenity_bookings(status);

-- ============================================
-- 12. PROPERTIES TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    property_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    tower VARCHAR(20) NOT NULL,
    flat VARCHAR(20) NOT NULL,
    floor INT,
    type VARCHAR(50), -- '1BHK', '2BHK', '3BHK', 'PENTHOUSE'
    area_sqft DECIMAL(10, 2),
    owner_id VARCHAR(50),
    tenant_id VARCHAR(50),
    occupancy_status VARCHAR(20) DEFAULT 'vacant', -- 'vacant', 'owner_occupied', 'rented'
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_property_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE,
    CONSTRAINT fk_property_owner FOREIGN KEY (owner_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_property_tenant FOREIGN KEY (tenant_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_properties_society ON properties(society_name);
CREATE INDEX idx_properties_tower_flat ON properties(tower, flat);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_tenant ON properties(tenant_id);
CREATE INDEX idx_properties_occupancy ON properties(occupancy_status);

-- ============================================
-- 13. VISITORS TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS visitors (
    id BIGSERIAL PRIMARY KEY,
    visitor_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    purpose VARCHAR(100),
    visiting_flat VARCHAR(50), -- 'Tower-Flat' format
    tower VARCHAR(20),
    flat VARCHAR(20),
    host_user_id VARCHAR(50),
    entry_time BIGINT NOT NULL,
    exit_time BIGINT,
    status VARCHAR(20) DEFAULT 'inside', -- 'inside', 'exited'
    vehicle_number VARCHAR(50),
    approved_by VARCHAR(50),
    created_at BIGINT NOT NULL,
    CONSTRAINT fk_visitor_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE,
    CONSTRAINT fk_visitor_host FOREIGN KEY (host_user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL
);

CREATE INDEX idx_visitors_society ON visitors(society_name);
CREATE INDEX idx_visitors_tower_flat ON visitors(tower, flat);
CREATE INDEX idx_visitors_entry_time ON visitors(entry_time DESC);
CREATE INDEX idx_visitors_status ON visitors(status);

-- ============================================
-- 14. STAFF TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- 'SECURITY', 'HOUSEKEEPER', 'GARDENER', 'PLUMBER', 'ELECTRICIAN'
    phone_number VARCHAR(20),
    email VARCHAR(255),
    shift VARCHAR(20), -- 'MORNING', 'EVENING', 'NIGHT'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'on_leave'
    hire_date BIGINT,
    salary DECIMAL(10, 2),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_staff_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_staff_society ON staff(society_name);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_status ON staff(status);

-- ============================================
-- 15. EMERGENCY CONTACTS TABLE (for Quick Access)
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id BIGSERIAL PRIMARY KEY,
    contact_id VARCHAR(50) NOT NULL UNIQUE,
    society_name VARCHAR(255) NOT NULL,
    contact_type VARCHAR(50) NOT NULL, -- 'POLICE', 'FIRE', 'AMBULANCE', 'HOSPITAL', 'SECURITY'
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    address TEXT,
    available_24x7 BOOLEAN DEFAULT false,
    priority_order INT DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    CONSTRAINT fk_emergency_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_emergency_society ON emergency_contacts(society_name);
CREATE INDEX idx_emergency_type ON emergency_contacts(contact_type);
CREATE INDEX idx_emergency_priority ON emergency_contacts(priority_order);
CREATE INDEX idx_emergency_active ON emergency_contacts(active);

-- ============================================
-- 16. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    notification_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50) NOT NULL,
    society_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50), -- 'PAYMENT', 'ANNOUNCEMENT', 'COMPLAINT', 'BOOKING', 'GENERAL'
    reference_id VARCHAR(50), -- ID of related entity
    is_read BOOLEAN DEFAULT false,
    created_at BIGINT NOT NULL,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- 17. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    log_id VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(50),
    username VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    entity_type VARCHAR(50), -- 'USER', 'PAYMENT', 'ANNOUNCEMENT', 'COMPLAINT', etc.
    entity_id VARCHAR(50),
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    society_name VARCHAR(255),
    created_at BIGINT NOT NULL,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_society FOREIGN KEY (society_name) REFERENCES societies(name) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_society ON audit_logs(society_name);

-- ============================================
-- VIEWS FOR QUICK ACCESS QUERIES
-- ============================================

-- View for active users by society
CREATE OR REPLACE VIEW v_active_users_by_society AS
SELECT 
    society_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN user_type = 'owner' THEN 1 END) as owners,
    COUNT(CASE WHEN user_type = 'tenant' THEN 1 END) as tenants,
    COUNT(CASE WHEN user_type = 'admin' THEN 1 END) as admins
FROM user_profiles
WHERE status = 'active'
GROUP BY society_name;

-- View for pending payments by society
CREATE OR REPLACE VIEW v_pending_payments_by_society AS
SELECT 
    society_name,
    COUNT(*) as pending_count,
    SUM(total_amount) as total_pending_amount
FROM maintenance_payments
WHERE status = 'pending'
GROUP BY society_name;

-- View for recent complaints by society
CREATE OR REPLACE VIEW v_recent_complaints_by_society AS
SELECT 
    c.society_name,
    COUNT(*) as total_complaints,
    COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END) as open_complaints,
    COUNT(CASE WHEN c.status = 'IN_PROGRESS' THEN 1 END) as in_progress_complaints,
    COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) as resolved_complaints
FROM complaints c
WHERE c.created_at > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days') * 1000
GROUP BY c.society_name;

-- ============================================
-- SAMPLE DATA INSERTION (Optional)
-- ============================================

-- Insert default society (if not exists)
INSERT INTO societies (name, address, city, state, pincode, total_towers, total_flats, contact_email, contact_phone, created_at, updated_at, active)
VALUES ('Baashyaam Crown Residence', 'Perungudi, Chennai', 'Chennai', 'Tamil Nadu', '600096', 3, 120, 'info@baashyaamcrown.com', '+91-9876543210', EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, true)
ON CONFLICT (name) DO NOTHING;

-- Note: User data will be managed by the application
-- Note: Default admin user is created by auth-service

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE societies IS 'Master table for all societies/apartments';
COMMENT ON TABLE user_profiles IS 'User accounts with role-based access control';
COMMENT ON TABLE payments IS 'Generic payments table for various payment types';
COMMENT ON TABLE maintenance_payments IS 'Quarterly maintenance payment tracking';
COMMENT ON TABLE announcements IS 'Society-wide announcements by admins';
COMMENT ON TABLE complaints IS 'User complaints and requests';
COMMENT ON TABLE complaint_attachments IS 'File attachments for complaints (images, documents)';
COMMENT ON TABLE community_posts IS 'User-generated community posts';
COMMENT ON TABLE community_post_images IS 'Images attached to community posts';
COMMENT ON TABLE amenities IS 'Bookable amenities like clubhouse, pool, gym';
COMMENT ON TABLE amenity_bookings IS 'Amenity booking requests and confirmations';
COMMENT ON TABLE properties IS 'Individual flat/unit details';
COMMENT ON TABLE visitors IS 'Visitor entry/exit logs';
COMMENT ON TABLE staff IS 'Society staff members (security, housekeeping, etc)';
COMMENT ON TABLE emergency_contacts IS 'Emergency contact numbers (police, fire, hospital)';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON TABLE audit_logs IS 'System audit trail for admin actions';

-- ============================================
-- END OF SCHEMA
-- ============================================

