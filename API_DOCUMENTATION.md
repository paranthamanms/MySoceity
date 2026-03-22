# API Documentation

## Overview

NammaSociety application uses RESTful APIs for communication between frontend and backend microservices. This document provides detailed API specifications.

## Authentication

### JWT Token Format

All authenticated requests must include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Example
```
eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ1c2VybmFtZSIsImlhdCI6MTcwODY0NDAwMDAsImV4cCI6MTcwODczMDQwMDAsInVzZXJJZCI6IjEyMzQ1Njc4LWFiY2QtZWZnaC1pams0In0.signature
```

### Token Claims
- `sub`: Username
- `userId`: User ID (UUID)
- `iat`: Issued at time
- `exp`: Expiration time
- `aud`: Audience  

## Base URLs

| Service | URL | Port |
|---------|-----|------|
| Auth Service | http://localhost:8001/api/auth | 8001 |
| User Service | http://localhost:8002/api/users | 8002 |

---

## Auth Service API (Port 8001)

### 1. User Registration

**Endpoint**: `POST /api/auth/register`

**Description**: Register a new user account

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "confirmPassword": "SecurePassword123",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | String | Yes | Unique username (3-50 characters) |
| email | String | Yes | Valid email address |
| password | String | Yes | Minimum 6 characters |
| confirmPassword | String | Yes | Must match password |
| userType | String | Yes | Either "owner" or "tenant" |
| ownerType | String | No | "resident" or "nonResident" (required if userType is "owner") |
| towerNumber | String | Yes | Building tower identifier |
| flatNumber | String | Yes | Unit/apartment number |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "userType": "owner",
    "ownerType": "resident",
    "towerNumber": "A",
    "flatNumber": "101",
    "active": true,
    "createdAt": 1708644000000,
    "updatedAt": 1708644000000
  }
}
```

**Error Response (400 Bad Request)**:
```json
{
  "success": false,
  "message": "Username already exists"
}
```

**Possible Errors**:
- `"Username already exists"` - Username is taken
- `"Email already exists"` - Email is registered
- `"Passwords do not match"` - Confirmation password doesn't match
- `"Please fill in all required fields"` - Missing required field

---

### 2. User Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and receive JWT token

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "SecurePassword123"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | String | Yes | Registered username |
| password | String | Yes | Account password |

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "userType": "owner",
    "ownerType": "resident",
    "towerNumber": "A",
    "flatNumber": "101",
    "active": true,
    "createdAt": 1708644000000,
    "updatedAt": 1708644000000
  }
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Possible Errors**:
- `"User not found"` - Username doesn't exist
- `"Invalid credentials"` - Password is incorrect

---

### 3. Validate Token

**Endpoint**: `POST /api/auth/validate`

**Description**: Validate and refresh JWT token

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**: Empty

**Success Response (200 OK)**:
```json
{
  "valid": true,
  "username": "john_doe",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response (401 Unauthorized)**:
```json
{
  "valid": false,
  "message": "Invalid or expired token"
}
```

**Possible Errors**:
- `"Invalid token format"` - Header format incorrect
- `"Invalid or expired token"` - Token is invalid or expired

---

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user (invalidates token)

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**: Empty

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 5. Health Check

**Endpoint**: `GET /api/auth/health`

**Description**: Check if Auth Service is running

**Request Headers**: None required

**Success Response (200 OK)**:
```json
{
  "status": "Auth Service is running"
}
```

---

## User Service API (Port 8002)

### 1. Create User Profile

**Endpoint**: `POST /api/users`

**Description**: Create a new user profile

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101",
  "phoneNumber": "+1-555-0123",
  "address": "Tower A, Flat 101, Community Complex",
  "profilePhotoUrl": "https://example.com/photo.jpg"
}
```

**Request Parameters**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | String | Yes | UUID from auth service |
| username | String | Yes | User's username |
| email | String | Yes | User's email |
| userType | String | Yes | "owner" or "tenant" |
| ownerType | String | No | "resident" or "nonResident" |
| towerNumber | String | Yes | Building tower |
| flatNumber | String | Yes | Unit number |
| phoneNumber | String | No | Contact phone |
| address | String | No | Full address |
| profilePhotoUrl | String | No | Profile picture URL |

**Success Response (201 Created)**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101",
  "phoneNumber": "+1-555-0123",
  "address": "Tower A, Flat 101, Community Complex",
  "profilePhotoUrl": "https://example.com/photo.jpg",
  "active": true,
  "createdAt": 1708644000000,
  "updatedAt": 1708644000000
}
```

---

### 2. Get User Profile

**Endpoint**: `GET /api/users/{userId}`

**Description**: Retrieve user profile by ID

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User's unique ID (URL parameter) |

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101",
  "phoneNumber": "+1-555-0123",
  "address": "Tower A, Flat 101, Community Complex",
  "profilePhotoUrl": "https://example.com/photo.jpg",
  "active": true,
  "createdAt": 1708644000000,
  "updatedAt": 1708644000000
}
```

**Error Response (404 Not Found)**:
```json
(Empty response body with 404 status)
```

---

### 3. Update User Profile

**Endpoint**: `PUT /api/users/{userId}`

**Description**: Update existing user profile

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User's unique ID (URL parameter) |

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "phoneNumber": "+1-555-9876",
  "address": "Tower A, Flat 101, Community Complex - Updated",
  "profilePhotoUrl": "https://example.com/new-photo.jpg"
}
```

**Editable Fields**:
- `phoneNumber` (optional)
- `address` (optional)
- `profilePhotoUrl` (optional)

**Success Response (200 OK)**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101",
  "phoneNumber": "+1-555-9876",
  "address": "Tower A, Flat 101, Community Complex - Updated",
  "profilePhotoUrl": "https://example.com/new-photo.jpg",
  "active": true,
  "createdAt": 1708644000000,
  "updatedAt": 1708644000001
}
```

**Error Response (404 Not Found)**:
```
(Empty response body with 404 status)
```

---

### 4. List All User Profiles

**Endpoint**: `GET /api/users`

**Description**: Retrieve all user profiles

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
[
  {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "userType": "owner",
    "ownerType": "resident",
    "towerNumber": "A",
    "flatNumber": "101",
    "phoneNumber": "+1-555-0123",
    "address": "Tower A, Flat 101",
    "profilePhotoUrl": "https://example.com/photo.jpg",
    "active": true,
    "createdAt": 1708644000000,
    "updatedAt": 1708644000000
  },
  {
    "userId": "660e8400-e29b-41d4-a716-446655440001",
    "username": "jane_smith",
    "email": "jane@example.com",
    "userType": "tenant",
    "ownerType": null,
    "towerNumber": "B",
    "flatNumber": "202",
    "phoneNumber": "+1-555-5678",
    "address": "Tower B, Flat 202",
    "profilePhotoUrl": null,
    "active": true,
    "createdAt": 1708644000000,
    "updatedAt": 1708644000000
  }
]
```

---

### 5. Delete User Profile

**Endpoint**: `DELETE /api/users/{userId}`

**Description**: Delete a user profile

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User's unique ID (URL parameter) |

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile deleted successfully"
}
```

**Error Response (404 Not Found)**:
```
(Empty response body with 404 status)
```

---

### 6. Get User by Username

**Endpoint**: `GET /api/users/username/{username}`

**Description**: Retrieve user profile by username

**Request Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | String | Yes | User's username (URL parameter) |

**Request Headers**:
```
Authorization: Bearer <token>
```

**Success Response (200 OK)**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "userType": "owner",
  "ownerType": "resident",
  "towerNumber": "A",
  "flatNumber": "101",
  "phoneNumber": "+1-555-0123",
  "address": "Tower A, Flat 101",
  "profilePhotoUrl": "https://example.com/photo.jpg",
  "active": true,
  "createdAt": 1708644000000,
  "updatedAt": 1708644000000
}
```

**Error Response (404 Not Found)**:
```
(Empty response body with 404 status)
```

---

### 7. Health Check

**Endpoint**: `GET /api/users/health`

**Description**: Check if User Service is running

**Request Headers**: None required

**Success Response (200 OK)**:
```json
{
  "status": "User Service is running"
}
```

---

## HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|--------------|
| 200 | OK | Request successful |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input or validation failed |
| 401 | Unauthorized | Missing or invalid token |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| User not found | 401 | Username doesn't exist | Register the user first |
| Invalid credentials | 401 | Wrong password | Check password and try again |
| Username already exists | 400 | Username is taken | Choose a different username |
| Email already exists | 400 | Email is registered | Use a different email |
| Passwords do not match | 400 | Password and confirmation don't match | Ensure passwords match |
| Invalid token | 401 | Token expired or malformed | Login again to get new token |
| Access Denied | 403 | Insufficient permissions | Check user role/permissions |

---

## CORS Configuration

The following origins are allowed:
- `http://localhost:4200` (Host App)
- `http://localhost:4201` (Login MFE)
- `http://localhost:4202` (Register MFE)
- `http://localhost:4203` (Dashboard MFE)

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers**: *  
**Max Age**: 3600 seconds

---

## Rate Limiting

Currently not implemented. To add:
1. Implement Spring Security RateLimiter
2. Add bucket4j dependency
3. Configure limits per endpoint

---

## Pagination (Future)

Current implementation doesn't support pagination. To add:

```
GET /api/users?page=0&size=10&sort=createdAt,desc
```

---

## Request Examples

### Using cURL

**Login**:
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"SecurePassword123"}'
```

**Get Profile**:
```bash
curl -X GET http://localhost:8002/api/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

### Using JavaScript/Angular

```typescript
// Login
this.http.post('http://localhost:8001/api/auth/login', {
  username: 'john_doe',
  password: 'SecurePassword123'
})

// Get Profile with Token
this.http.get('http://localhost:8002/api/users/' + userId, {
  headers: new HttpHeaders({
    'Authorization': `Bearer ${token}`
  })
})
```

---

## WebSocket Support

Currently not implemented. To add:
1. Add Spring WebSocket dependency
2. Implement WebSocketConfig
3. Create message handlers
4. Add client-side WebSocket connections

---

## API Versioning Strategy

Current version: v1 (implicit)

Future versions would be:
- `GET /api/v1/auth/login`
- `GET /api/v2/auth/login`

---

**Last Updated**: February 23, 2026  
**API Version**: 1.0  
**Status**: Production Ready

