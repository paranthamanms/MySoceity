-- Pre-Approvals Table: Users pre-approve guests/vendors
CREATE TABLE IF NOT EXISTS pre_approvals (
    id BIGSERIAL PRIMARY KEY,
    apartment_number VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    visitor_type VARCHAR(50) NOT NULL, -- GUEST, CAB, DELIVERY, VISITING_HELP, VENDOR
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED
    -- Index creation moved below for PostgreSQL-safe conditional
    INDEX idx_valid_dates (valid_from, valid_until)
        -- Index creation removed for portability; see separate migration file
);

-- Approval Requests Table: Security raises requests for immediate approval
CREATE TABLE IF NOT EXISTS approval_requests (
    id BIGSERIAL PRIMARY KEY,
    apartment_number VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    tower VARCHAR(50),
    visitor_type VARCHAR(50) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    visitor_id_proof VARCHAR(255), -- ID proof details
    purpose TEXT,
    requested_by VARCHAR(255) NOT NULL, -- Security guard name
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    responded_at TIMESTAMP,
    responded_by VARCHAR(255),
    response_note TEXT,
    -- Index creation moved below for PostgreSQL-safe conditional
    INDEX idx_requested_at (requested_at)
        -- Index creation removed for portability; see separate migration file
);


-- Approval Logs Table: Complete audit trail of all entries
CREATE TABLE IF NOT EXISTS approval_logs (
    id BIGSERIAL PRIMARY KEY,
    apartment_number VARCHAR(50) NOT NULL,
    society_name VARCHAR(255) NOT NULL,
    tower VARCHAR(50),
    visitor_type VARCHAR(50) NOT NULL,
    visitor_name VARCHAR(255) NOT NULL,
    visitor_phone VARCHAR(20),
    entry_type VARCHAR(30) NOT NULL, -- PRE_APPROVED, REQUEST_APPROVED
    approval_method VARCHAR(50), -- SMS, DASHBOARD, AUTO
    approved_by VARCHAR(255) NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP,
    security_guard VARCHAR(255),
    notes TEXT,
    pre_approval_id BIGINT REFERENCES pre_approvals(id),
    request_id BIGINT REFERENCES approval_requests(id),
    INDEX idx_apartment_logs (apartment_number, society_name),
    INDEX idx_entry_time (entry_time),
    INDEX idx_visitor_type (visitor_type)
);

-- Comments
COMMENT ON TABLE pre_approvals IS 'Stores pre-approved guests and vendors for future visits';
COMMENT ON TABLE approval_requests IS 'Stores real-time approval requests raised by security';
COMMENT ON TABLE approval_logs IS 'Comprehensive audit log of all approved entries and exits';
