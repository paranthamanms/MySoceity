# NammaSociety Database Schema Documentation

## Overview
This document describes the PostgreSQL database schema for the NammaSociety application. The schema includes **17 separate tables** with proper relationships, indexes, and views for efficient data management.

---

## Database Design Principles

1. **Separate Tables Per Feature**: Each major feature has its own dedicated table(s)
2. **Foreign Key Relationships**: Proper referential integrity between related tables
3. **Indexes**: Strategic indexes on frequently queried columns
4. **Audit Trail**: Complete audit logging for admin actions
5. **Scalability**: Support for multiple societies in a single instance
6. **Timestamps**: All tables use Unix epoch timestamps (milliseconds) for consistency

---

## Table List

| # | Table Name | Purpose | Related Features |
|---|------------|---------|------------------|
| 1 | `societies` | Master data for all societies | Society Management |
| 2 | `user_profiles` | User accounts and profiles | User Management, Authentication |
| 3 | `payments` | Generic payment transactions | Payment Management |
| 4 | `maintenance_payments` | Quarterly maintenance payments | Maintenance Payment |
| 5 | `announcements` | Society announcements | Announcements (Quick Access) |
| 6 | `complaints` | User complaints and tracking | Complaints (Quick Access) |
| 7 | `complaint_attachments` | Complaint file attachments | Complaints |
| 8 | `community_posts` | User community posts | Community Posts |
| 9 | `community_post_images` | Post image attachments | Community Posts |
| 10 | `amenities` | Bookable facilities | Amenities (Quick Access) |
| 11 | `amenity_bookings` | Amenity booking records | Amenities (Quick Access) |
| 12 | `properties` | Individual flat/unit details | Property Management (Quick Access) |
| 13 | `visitors` | Visitor entry/exit logs | Visitor Management (Quick Access) |
| 14 | `staff` | Society staff members | Staff Management (Quick Access) |
| 15 | `emergency_contacts` | Emergency contact numbers | Emergency Contacts (Quick Access) |
| 16 | `notifications` | User notifications | Notifications |
| 17 | `audit_logs` | System audit trail | Admin Actions Audit |

---

## Detailed Table Descriptions

### 1. SOCIETIES Table
**Purpose**: Master table containing all society/apartment complex information.

**Key Columns**:
- `id`: Auto-incrementing primary key
- `name`: Unique society name (used as reference in other tables)
- `total_towers`, `total_flats`: Metadata for society size
- `active`: Soft delete flag

**Relationships**: Referenced by most other tables via `society_name`

---

### 2. USER_PROFILES Table
**Purpose**: Central user management with role-based access control.

**Key Columns**:
- `user_id`: Unique user identifier (UUID format)
- `user_type`: 'admin', 'superadmin', 'owner', 'tenant'
- `owner_type`: 'resident', 'non-resident', 'super-admin', 'society-admin'
- `role`: 'ADMIN', 'SUPER-ADMIN', 'SOCIETY-ADMIN', 'USER'
- `society_name`: **NULL for Super Admin, populated for Society Admin**

**Role Logic**:
- **Super Admin**: `user_type='admin'` AND `society_name IS NULL`
- **Society Admin**: `user_type='admin'` AND `society_name IS NOT NULL`
- **Normal User**: `user_type='owner'` or `user_type='tenant'`

**Indexes**: username, email, user_type, society_name, tower+flat

---

### 3. PAYMENTS Table
**Purpose**: Generic payment tracking for all payment types.

**Key Columns**:
- `payment_type`: 'MAINTENANCE', 'AMENITY', 'PENALTY', 'OTHER'
- `payment_method`: 'ONLINE', 'CASH', 'CHEQUE', 'UPI'
- `status`: 'pending', 'completed', 'failed', 'refunded'

**Use Cases**: One-time payments, amenity fees, penalties

---

### 4. MAINTENANCE_PAYMENTS Table
**Purpose**: Quarterly maintenance payment tracking with structured fields.

**Key Columns**:
- `quarter_name`: 'Q1 2026', 'Q2 2026', etc.
- `quarter_number`: 1-4 (with CHECK constraint)
- `additional_fields`: JSONB for dynamic charges (water, electricity, parking, etc.)
- `status`: 'pending', 'paid', 'overdue'

**CSV Upload Support**: This table supports bulk import from CSV files

---

### 5. ANNOUNCEMENTS Table
**Purpose**: Society-wide announcements created by Society Admins.

**Key Columns**:
- `priority`: 'low', 'medium', 'high', 'urgent'
- `expires_at`: Optional expiration timestamp
- `active`: Soft delete flag

**Access Control**: 
- **Create/Edit/Delete**: Society Admin only
- **View**: All users in the society

---

### 6. COMPLAINTS Table
**Purpose**: User complaint tracking and management.

**Key Columns**:
- `category`: 'MAINTENANCE', 'SECURITY', 'NOISE', 'OTHER'
- `status`: 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
- `priority`: 'low', 'medium', 'high', 'urgent'
- `assigned_to`: Staff member assigned to resolve

**Relationships**: Linked to `complaint_attachments` for file uploads

---

### 7. COMPLAINT_ATTACHMENTS Table
**Purpose**: Store multiple file attachments per complaint.

**Key Columns**:
- `complaint_id`: Foreign key to complaints table
- `attachment_url`: File storage path/URL
- `file_name`, `file_size`, `file_type`: File metadata

**Design Note**: Separate table for one-to-many relationship (multiple files per complaint)

---

### 8. COMMUNITY_POSTS Table
**Purpose**: User-generated community feed posts.

**Key Columns**:
- `category`: 'EVENT', 'SALE', 'HELP_WANTED', 'GENERAL'
- `likes_count`, `comments_count`: Engagement metrics
- `active`: Soft delete flag for moderation

**Relationships**: Linked to `community_post_images` for multiple images

---

### 9. COMMUNITY_POST_IMAGES Table
**Purpose**: Store multiple images per community post.

**Design**: One-to-many relationship with community_posts

---

### 10. AMENITIES Table
**Purpose**: Define bookable amenities (clubhouse, pool, gym, etc.)

**Key Columns**:
- `amenity_type`: 'CLUBHOUSE', 'SWIMMING_POOL', 'GYM', 'PARTY_HALL', 'SPORTS'
- `hourly_rate`, `daily_rate`: Pricing structure
- `available`: Availability flag
- `operating_hours`: Business hours (e.g., "6 AM - 10 PM")

---

### 11. AMENITY_BOOKINGS Table
**Purpose**: Track amenity booking requests and confirmations.

**Key Columns**:
- `booking_type`: 'HOURLY', 'HALF_DAY', 'FULL_DAY'
- `status`: 'pending', 'confirmed', 'cancelled', 'completed'
- `payment_status`: Separate from booking status

**Quick Access Feature**: Used by the Amenities widget

---

### 12. PROPERTIES Table
**Purpose**: Detailed information about each flat/unit.

**Key Columns**:
- `tower`, `flat`: Unique identifier combination
- `type`: '1BHK', '2BHK', '3BHK', 'PENTHOUSE'
- `owner_id`, `tenant_id`: Current occupants
- `occupancy_status`: 'vacant', 'owner_occupied', 'rented'

**Quick Access Feature**: Used for property management widgets

---

### 13. VISITORS Table
**Purpose**: Visitor entry/exit log for security.

**Key Columns**:
- `entry_time`, `exit_time`: Entry/exit timestamps
- `status`: 'inside', 'exited'
- `vehicle_number`: Optional vehicle tracking
- `approved_by`: Security staff who approved entry

**Quick Access Feature**: Visitor management widget

---

### 14. STAFF Table
**Purpose**: Manage society staff (security, housekeeping, maintenance).

**Key Columns**:
- `role`: 'SECURITY', 'HOUSEKEEPER', 'GARDENER', 'PLUMBER', 'ELECTRICIAN'
- `shift`: 'MORNING', 'EVENING', 'NIGHT'
- `status`: 'active', 'inactive', 'on_leave'

**Quick Access Feature**: Staff management widget

---

### 15. EMERGENCY_CONTACTS Table
**Purpose**: Store emergency contact numbers (police, fire, hospital, etc.)

**Key Columns**:
- `contact_type`: 'POLICE', 'FIRE', 'AMBULANCE', 'HOSPITAL', 'SECURITY'
- `priority_order`: Display order in UI
- `available_24x7`: 24/7 availability flag

**Quick Access Feature**: Emergency contacts widget

---

### 16. NOTIFICATIONS Table
**Purpose**: User notification system for various events.

**Key Columns**:
- `type`: 'PAYMENT', 'ANNOUNCEMENT', 'COMPLAINT', 'BOOKING', 'GENERAL'
- `reference_id`: ID of related entity (payment, announcement, etc.)
- `is_read`: Read status

**Use Cases**: Payment reminders, announcement alerts, complaint updates

---

### 17. AUDIT_LOGS Table
**Purpose**: Complete audit trail for admin actions and system events.

**Key Columns**:
- `action`: 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
- `entity_type`: Type of entity affected
- `entity_id`: ID of affected entity
- `ip_address`, `user_agent`: HTTP request metadata

**Compliance**: Required for security and compliance auditing

---

## Database Views

### v_active_users_by_society
Pre-calculated user counts per society (total, owners, tenants, admins)

### v_pending_payments_by_society
Pending payment summary per society

### v_recent_complaints_by_society
Recent complaint statistics per society (open, in progress, resolved)

---

## Indexes Strategy

### Primary Indexes
- All tables have primary key indexes on `id` column

### Foreign Key Indexes
- All foreign key columns have indexes for join performance

### Query Optimization Indexes
- `user_profiles`: username, email, user_type, society_name
- `payments`, `maintenance_payments`: user_id, society_name, status, date
- `complaints`: society_name, status, category, created_at (DESC)
- `community_posts`: society_name, category, created_at (DESC)
- `announcements`: society_name, priority, active
- `amenity_bookings`: amenity_id, user_id, booking_date
- `audit_logs`: user_id, action, entity_type, created_at (DESC)

---

## Data Types

### Timestamps
- **Format**: Unix epoch milliseconds (BIGINT)
- **Example**: 1709485200000 (March 3, 2024)
- **Why**: Consistent with Java backend (System.currentTimeMillis())

### Monetary Values
- **Type**: DECIMAL(10, 2)
- **Range**: Up to â‚¹99,999,999.99

### Status Fields
- **Type**: VARCHAR with constrained values
- **Pattern**: Use lowercase with underscores ('pending', 'in_progress')

---

## Relationships Diagram

```
societies (1) â”€â”€â”€â”€â”€< (many) user_profiles
                              â”‚
                              â”œâ”€â”€â”€â”€â”€< payments
                              â”œâ”€â”€â”€â”€â”€< maintenance_payments
                              â”œâ”€â”€â”€â”€â”€< complaints
                              â”œâ”€â”€â”€â”€â”€< community_posts
                              â”œâ”€â”€â”€â”€â”€< amenity_bookings
                              â”œâ”€â”€â”€â”€â”€< notifications
                              â””â”€â”€â”€â”€â”€< audit_logs

complaints (1) â”€â”€â”€â”€â”€< (many) complaint_attachments

community_posts (1) â”€â”€â”€â”€â”€< (many) community_post_images

amenities (1) â”€â”€â”€â”€â”€< (many) amenity_bookings

properties (many) â”€â”€â”€â”€â”€> (1) user_profiles (owner)
properties (many) â”€â”€â”€â”€â”€> (1) user_profiles (tenant)
```

---

## Setup Instructions

### 1. Create Database
```sql
CREATE DATABASE NammaSociety_db;
```

### 2. Connect to Database
```bash
psql -U postgres -d NammaSociety_db
```

### 3. Execute Schema
```bash
psql -U postgres -d NammaSociety_db -f DATABASE_SCHEMA.sql
```

### 4. Verify Tables
```sql
\dt
```

Should show all 17 tables.

---

## Migration from Existing Data

If you have existing data in the current database:

### Step 1: Backup Existing Data
```bash
pg_dump -U postgres -d NammaSociety_db > backup_before_migration.sql
```

### Step 2: Export Existing Data
```sql
-- Export users
COPY user_profiles TO '/tmp/users.csv' WITH CSV HEADER;

-- Export payments
COPY maintenance_payments TO '/tmp/payments.csv' WITH CSV HEADER;
```

### Step 3: Apply New Schema
```bash
psql -U postgres -d NammaSociety_db -f DATABASE_SCHEMA.sql
```

### Step 4: Import Data
```sql
-- Import users
COPY user_profiles FROM '/tmp/users.csv' WITH CSV HEADER;

-- Import payments
COPY maintenance_payments FROM '/tmp/payments.csv' WITH CSV HEADER;
```

---

## Backend Integration

### Spring Boot Configuration

**application.properties**:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/NammaSociety_db
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
```

### Entity Classes Required

The backend should have JPA entities matching these tables:
- âœ… Society.java
- âœ… UserProfile.java
- âœ… Payment.java
- âœ… MaintenancePayment.java
- âœ… Announcement.java
- âœ… Complaint.java
- âœ… ComplaintAttachment.java
- âœ… CommunityPost.java
- âœ… CommunityPostImage.java
- âœ… Amenity.java
- âœ… AmenityBooking.java
- âš ï¸ Property.java (to be created)
- âš ï¸ Visitor.java (to be created)
- âš ï¸ Staff.java (to be created)
- âš ï¸ EmergencyContact.java (to be created)
- âš ï¸ Notification.java (to be created)
- âœ… AuditLog.java

---

## Quick Access Widgets Mapping

| Widget | Primary Table(s) | Status |
|--------|------------------|--------|
| Announcements | `announcements` | âœ… Implemented |
| Complaints | `complaints`, `complaint_attachments` | âœ… Implemented |
| Amenities | `amenities`, `amenity_bookings` | âš ï¸ Table ready, feature pending |
| Visitor Management | `visitors` | âš ï¸ Table ready, feature pending |
| Staff Management | `staff` | âš ï¸ Table ready, feature pending |
| Emergency Contacts | `emergency_contacts` | âš ï¸ Table ready, feature pending |
| Property Management | `properties` | âš ï¸ Table ready, feature pending |

---

## Sample Queries

### Get All Users in a Society
```sql
SELECT * FROM user_profiles 
WHERE society_name = 'Baashyaam Crown Residence' 
AND status = 'active';
```

### Get Pending Maintenance Payments
```sql
SELECT * FROM maintenance_payments 
WHERE society_name = 'Baashyaam Crown Residence' 
AND status = 'pending'
ORDER BY due_date ASC;
```

### Get Recent Complaints
```sql
SELECT c.*, u.username as reporter_name
FROM complaints c
LEFT JOIN user_profiles u ON c.reporter_id = u.user_id
WHERE c.society_name = 'Baashyaam Crown Residence'
ORDER BY c.created_at DESC
LIMIT 10;
```

### Get Today's Visitor Entries
```sql
SELECT * FROM visitors
WHERE society_name = 'Baashyaam Crown Residence'
AND entry_time >= EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW())) * 1000
AND status = 'inside'
ORDER BY entry_time DESC;
```

### Get Amenity Bookings for a Date
```sql
SELECT ab.*, a.name as amenity_name, u.username
FROM amenity_bookings ab
JOIN amenities a ON ab.amenity_id = a.amenity_id
JOIN user_profiles u ON ab.user_id = u.user_id
WHERE ab.society_name = 'Baashyaam Crown Residence'
AND ab.booking_date = '2026-03-15'
AND ab.status != 'cancelled'
ORDER BY ab.start_time;
```

---

## Performance Recommendations

### 1. Connection Pooling
Use HikariCP (default in Spring Boot) with these settings:
```properties
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
```

### 2. Query Optimization
- Use the provided views for dashboard statistics
- Avoid `SELECT *` in production code
- Use pagination for large result sets

### 3. Indexing
All critical indexes are already defined in the schema

### 4. Regular Maintenance
```sql
-- Run weekly
VACUUM ANALYZE;

-- Run monthly
REINDEX DATABASE NammaSociety_db;
```

---

## Security Considerations

### 1. Sensitive Data
- User passwords are NOT stored in this database
- Passwords are managed by auth-service separately

### 2. Audit Logging
- All admin actions should be logged to `audit_logs` table
- Include IP address and user agent for security

### 3. Data Access
- Super Admins can access ALL societies
- Society Admins can access ONLY their society
- Normal Users can access only their own data

---

## Future Enhancements

### Planned Tables (Phase 2)
- `documents`: Society document repository
- `events`: Society events calendar
- `parking`: Parking slot management
- `helpdesk_tickets`: IT/technical support tickets
- `society_meetings`: Meeting minutes and voting

### Planned Features
- Full-text search using PostgreSQL `tsvector`
- Geofencing for visitor management
- Real-time notifications using PostgreSQL LISTEN/NOTIFY
- Data analytics and reporting tables

---

## Support and Maintenance

### Database Version
- **Minimum**: PostgreSQL 12+
- **Recommended**: PostgreSQL 14+

### Backup Strategy
```bash
# Daily backup
pg_dump -U postgres NammaSociety_db | gzip > NammaSociety_backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < NammaSociety_backup_20260303.sql.gz | psql -U postgres NammaSociety_db
```

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-03-03 | 1.0.0 | Initial schema with 17 tables, 3 views, complete indexes |

---

## Contact

For questions or issues with the database schema, contact the development team.

---

**Document Version**: 1.0.0  
**Last Updated**: March 3, 2026  
**Schema File**: DATABASE_SCHEMA.sql

