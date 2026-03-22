-- PostgreSQL-safe conditional index creation for pre_approvals.status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'idx_status_pre_approvals'
    ) THEN
        CREATE INDEX idx_status_pre_approvals ON pre_approvals(status);
    END IF;
END
$$;

-- PostgreSQL-safe conditional index creation for approval_requests.status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = 'idx_status_approval_requests'
    ) THEN
        CREATE INDEX idx_status_approval_requests ON approval_requests(status);
    END IF;
END
$$;

-- Portable for AWS and other environments
-- Use separate migration for index creation to avoid conflicts and support cloud portability
