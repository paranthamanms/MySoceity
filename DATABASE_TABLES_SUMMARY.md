# Database Tables Summary for NammaSociety PostgreSQL

## âœ… Tables Successfully Created

When the Spring Boot application (user-service) starts with `spring.jpa.hibernate.ddl-auto=update`, the following tables are automatically created in PostgreSQL:

### 1. **announcements** table
Created by: `Announcement.java` entity

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `society_name` (VARCHAR 255) - Society identifier
- `title` (VARCHAR 255) - Announcement title
- `content` (TEXT) - Announcement content
- `priority` (VARCHAR 20) - LOW, MEDIUM, HIGH, URGENT
- `author_id` (VARCHAR 50) - Society Admin ID who created it
- `author_name` (VARCHAR 255) - Society Admin name
- `created_at` (BIGINT) - Timestamp
- `updated_at` (BIGINT) - Timestamp
- `active` (BOOLEAN) - Soft delete flag

**Purpose:** Store announcements created by Society Admins for their respective societies.

---

### 2. **complaints** table
Created by: `Complaint.java` entity

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `society_name` (VARCHAR 255) - Society identifier
- `title` (VARCHAR 255) - Complaint title
- `description` (TEXT) - Complaint details
- `category` (VARCHAR 50) - MAINTENANCE, WATER_SUPPLY, ELECTRICITY, ELEVATOR, SECURITY, PARKING, GARBAGE, NOISE, OTHER
- `status` (VARCHAR 50) - OPEN, IN_PROGRESS, RESOLVED, CLOSED
- `reporter_id` (VARCHAR 50) - User ID who filed the complaint
- `reporter_name` (VARCHAR 255) - User name
- `assigned_to` (VARCHAR 50) - Society Admin/staff assigned to handle it
- `created_at` (BIGINT) - Timestamp
- `updated_at` (BIGINT) - Timestamp
- `resolved_at` (BIGINT) - Timestamp when resolved

**Purpose:** Store complaints & requests filed by users.

**Related Table:** `complaint_attachments` (auto-created by @ElementCollection)
- `complaint_id` (VARCHAR 50) - Foreign Key
- `attachment_url` (VARCHAR 500) - File attachment URL

---

### 3. **complaint_comments** table â­ NEW
Created by: `ComplaintComment.java` entity

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `complaint_id` (VARCHAR 50) - Foreign Key to complaints table
- `author_id` (VARCHAR 50) - User/Admin who posted the comment
- `author_name` (VARCHAR 255) - Name of commenter
- `author_role` (VARCHAR 50) - USER, SOCIETY_ADMIN, SUPER_ADMIN
- `comment_text` (TEXT) - The response/comment content
- `attachment_url` (VARCHAR 500) - Optional file attachment
- `is_resolution` (BOOLEAN) - True if this comment marks complaint as resolved
- `created_at` (BIGINT) - Timestamp
- `updated_at` (BIGINT) - Timestamp

**Purpose:** Store responses/comments from users and Society Admins on complaints.

**API Endpoints:**
- `POST /api/complaints/{complaintId}/comments` - Add a comment
- `GET /api/complaints/{complaintId}/comments` - Get all comments for a complaint
- `GET /api/complaints/{complaintId}/comments/count` - Get comment count
- `PUT /api/complaints/comments/{commentId}` - Update a comment
- `DELETE /api/complaints/comments/{commentId}` - Delete a comment

---

### 4. **community_posts** table
Created by: `CommunityPost.java` entity

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `society_name` (VARCHAR 255) - Society identifier
- `title` (VARCHAR 255) - Post title
- `content` (TEXT) - Post content
- `category` (VARCHAR 50) - GENERAL, EVENTS, SPORTS, BUY_SELL, LOST_FOUND, RECOMMENDATIONS, HELP_NEEDED, OTHER
- `author_id` (VARCHAR 50) - User ID who created the post
- `author_name` (VARCHAR 255) - User name
- `likes_count` (INT) - Number of likes
- `comments_count` (INT) - Number of comments (auto-updated)
- `created_at` (BIGINT) - Timestamp
- `updated_at` (BIGINT) - Timestamp
- `active` (BOOLEAN) - Soft delete flag

**Purpose:** Store community posts shared by users.

**Related Table:** `community_post_images` (auto-created by @ElementCollection)
- `post_id` (VARCHAR 50) - Foreign Key
- `image_url` (VARCHAR 500) - Image attachment URL

---

### 5. **post_comments** table â­ NEW
Created by: `PostComment.java` entity

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `post_id` (VARCHAR 50) - Foreign Key to community_posts table
- `author_id` (VARCHAR 50) - User/Admin who posted the comment
- `author_name` (VARCHAR 255) - Name of commenter
- `author_role` (VARCHAR 50) - USER, SOCIETY_ADMIN, SUPER_ADMIN
- `comment_text` (TEXT) - The comment content
- `parent_comment_id` (VARCHAR 50) - For nested replies (optional)
- `likes_count` (INT) - Number of likes on this comment
- `created_at` (BIGINT) - Timestamp
- `updated_at` (BIGINT) - Timestamp
- `active` (BOOLEAN) - Soft delete flag

**Purpose:** Store comments and replies on community posts, supporting nested conversations.

**API Endpoints:**
- `POST /api/posts/{postId}/comments` - Add a comment
- `GET /api/posts/{postId}/comments` - Get all comments for a post
- `GET /api/posts/{postId}/comments/count` - Get comment count
- `GET /api/posts/comments/{parentCommentId}/replies` - Get replies to a comment
- `PUT /api/posts/comments/{commentId}` - Update a comment
- `DELETE /api/posts/comments/{commentId}` - Soft delete a comment
- `POST /api/posts/comments/{commentId}/like` - Like a comment

---

## Other Related Tables

### 6. **users** table
Created by: `User.java` entity in auth-service

**Columns:**
- `id` (VARCHAR 50) - Primary Key
- `username` (VARCHAR 255)
- `email` (VARCHAR 255)
- `password` (VARCHAR 255)
- `role` (VARCHAR 50) - USER, SOCIETY_ADMIN, SUPER_ADMIN
- `society_name` (VARCHAR 255)
- `tower_number` (VARCHAR 50)
- `flat_number` (VARCHAR 50)
- Other user-related fields...

---

### 7. **amenities** table
Created by: `Amenity.java` entity

For amenity booking feature (Gym, Pool, Clubhouse, etc.)

---

### 8. **amenity_bookings** table
Created by: `AmenityBooking.java` entity

For tracking amenity bookings by users.

---

### 9. **properties** table
Created by: `Property.java` entity

For real estate listings within the society.

---

## Database Configuration

**Database:** PostgreSQL  
**Host:** localhost:5432  
**Database Name:** postgres  
**Username:** postgres  
**Password:** YOUR_DATABASE_PASSWORD  

**Hibernate DDL:** `spring.jpa.hibernate.ddl-auto=update`  
This means tables are automatically created/updated when the application starts.

---

## What's New in This Update

âœ… **ComplaintComment** entity - Enables users and Society Admins to respond to complaints  
âœ… **PostComment** entity - Enables threaded discussions on community posts  
âœ… **ComplaintCommentRepository** - JPA repository for complaint comments  
âœ… **PostCommentRepository** - JPA repository with nested reply support  
âœ… **ComplaintCommentService** - Business logic for complaint responses  
âœ… **PostCommentService** - Business logic for post comments with like functionality  
âœ… **ComplaintCommentController** - REST API endpoints for complaint comments  
âœ… **PostCommentController** - REST API endpoints for post comments and replies  

---

## How to Verify Tables Were Created

### Option 1: Using psql command line
```bash
psql -U postgres -d postgres
\dt                           # List all tables
\d complaint_comments         # Describe complaint_comments table
\d post_comments              # Describe post_comments table
```

### Option 2: Check Spring Boot logs
When user-service starts, look for Hibernate SQL statements:
```
Hibernate: create table if not exists complaint_comments (...)
Hibernate: create table if not exists post_comments (...)
```

### Option 3: Using pgAdmin
1. Open pgAdmin
2. Connect to localhost:5432
3. Navigate to postgres database > Schemas > public > Tables
4. You should see all 9+ tables listed

---

## Usage Flow

### Complaint Workflow
1. User files complaint â†’ Saved in `complaints` table
2. Society Admin views complaint
3. Society Admin responds â†’ Saved in `complaint_comments` table
4. User replies â†’ Another entry in `complaint_comments` table
5. Society Admin marks as resolved â†’ `is_resolution=true` in latest comment
6. Status updated to RESOLVED in `complaints` table

### Community Post Workflow
1. User creates post â†’ Saved in `community_posts` table
2. Other users comment â†’ Saved in `post_comments` table
3. Users reply to comments â†’ `parent_comment_id` links to parent comment
4. Users like comments â†’ `likes_count` incremented
5. Post shows total `comments_count` (auto-updated)

---

## Backend Services Status

âœ… **user-service** (Port 8002) - RUNNING  
âš ï¸ **auth-service** (Port 8001) - May need restart  

All database tables should now be created in PostgreSQL!

