package com.mysociety.user.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaMigrationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // JPA ddl-auto is set to none, so keep critical QR fields in sync via idempotent DDL.
        apply("ALTER TABLE IF EXISTS societies ADD COLUMN IF NOT EXISTS scanner_code VARCHAR(120)");
        apply("ALTER TABLE IF EXISTS societies ADD COLUMN IF NOT EXISTS scanner_code_updated_at BIGINT DEFAULT 0");

        // Keep approval request/log scanner-related fields available across older databases.
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS scanner_code VARCHAR(120)");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS scanner_source VARCHAR(30)");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS face_capture TEXT");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS visitor_aadhaar VARCHAR(20)");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS service_sub_category VARCHAR(100)");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150)");
        apply("ALTER TABLE IF EXISTS approval_requests ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20)");

        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS scanner_code VARCHAR(120)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS scanner_source VARCHAR(30)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS face_capture TEXT");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS visitor_aadhaar VARCHAR(20)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS service_sub_category VARCHAR(100)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS owner_name VARCHAR(150)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS owner_phone VARCHAR(20)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS exit_method VARCHAR(40)");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS exit_face_capture TEXT");
        apply("ALTER TABLE IF EXISTS approval_logs ADD COLUMN IF NOT EXISTS exit_match_confidence DOUBLE PRECISION");
    }

    private void apply(String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.info("Schema migration applied: {}", sql);
        } catch (Exception ex) {
            log.warn("Schema migration skipped/failed for SQL: {} | reason: {}", sql, ex.getMessage());
        }
    }
}
