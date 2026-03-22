# Backend API Documentation

## Overview

This document describes all the REST APIs implemented for the NammaSociety Dashboard features.

**Base URL**: `http://localhost:8002`

All endpoints support CORS and return JSON responses.

---

## 1. Announcements API

**Base Path**: `/api/posts/announcements`

### Endpoints

#### Get All Announcements
```http
GET /api/posts/announcements
GET /api/posts/announcements?societyName={societyName}
```

**Query Parameters**:
- `societyName` (optional): Filter by society name

**Response**: Array of announcements
```json
[
  {
    "id": "uuid",
    "societyName": "Green Valley Apartments",
    "title": "Society Annual Meeting",
    "content": "Meeting details...",
    "priority": "HIGH",
    "authorId": 1,
    "authorName": "Admin",
    "active": true,
    "createdAt": "2026-03-01T22:00:00",
    "updatedAt": "2026-03-01T22:00:00"
  }
]
```

#### Get Announcement by ID
```http
GET /api/posts/announcements/{id}
```

#### Create Announcement
```http
POST /api/posts/announcements
Content-Type: application/json

{
  "societyName": "Green Valley Apartments",
  "title": "Maintenance Notice",
  "content": "Water supply will be off...",
  "priority": "HIGH",
  "authorId": 1,
  "authorName": "Admin"
}
```

**Priority Values**: `LOW`, `MEDIUM`, `HIGH`

#### Update Announcement
```http
PUT /api/posts/announcements/{id}
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "priority": "MEDIUM"
}
```

#### Delete Announcement
```http
DELETE /api/posts/announcements/{id}
```

---

## 2. Complaints API

**Base Path**: `/api/posts/complaints`

### Endpoints

#### Get All Complaints
```http
GET /api/posts/complaints
GET /api/posts/complaints?societyName={societyName}
GET /api/posts/complaints?status={status}
GET /api/posts/complaints?societyName={societyName}&status={status}
```

**Query Parameters**:
- `societyName` (optional): Filter by society name
- `status` (optional): Filter by status

**Status Values**: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

**Response**: Array of complaints
```json
[
  {
    "id": "uuid",
    "societyName": "Green Valley Apartments",
    "title": "Elevator Issue",
    "description": "Elevator not working...",
    "category": "MAINTENANCE",
    "status": "OPEN",
    "reporterId": 1,
    "reporterName": "John Doe",
    "assignedTo": null,
    "createdAt": "2026-03-01T22:00:00",
    "updatedAt": "2026-03-01T22:00:00",
    "resolvedAt": null
  }
]
```

#### Create Complaint
```http
POST /api/posts/complaints
Content-Type: application/json

{
  "societyName": "Green Valley Apartments",
  "title": "Parking Issue",
  "description": "Unauthorized vehicle...",
  "category": "SECURITY",
  "reporterId": 1,
  "reporterName": "John Doe"
}
```

**Category Values**: `MAINTENANCE`, `SECURITY`, `NOISE`, `OTHER`

#### Update Complaint (including status)
```http
PUT /api/posts/complaints/{id}
Content-Type: application/json

{
  "status": "RESOLVED",
  "assignedTo": "Support Team"
}
```

**Note**: Setting status to `RESOLVED` or `CLOSED` automatically sets `resolvedAt` timestamp.

---

## 3. Community Posts API

**Base Path**: `/api/posts/community`

### Endpoints

#### Get All Community Posts
```http
GET /api/posts/community
GET /api/posts/community?societyName={societyName}
GET /api/posts/community?category={category}
```

**Category Values**: `EVENT`, `SALE`, `HELP_WANTED`, `GENERAL`

**Response**: Array of community posts
```json
[
  {
    "id": "uuid",
    "societyName": "Green Valley Apartments",
    "title": "Holi Celebration",
    "content": "Join us for Holi...",
    "category": "EVENT",
    "authorId": 1,
    "authorName": "John Doe",
    "imageUrls": [],
    "likesCount": 5,
    "commentsCount": 3,
    "active": true,
    "createdAt": "2026-03-01T22:00:00"
  }
]
```

#### Create Community Post
```http
POST /api/posts/community
Content-Type: application/json

{
  "societyName": "Green Valley Apartments",
  "title": "Garage Sale",
  "content": "Selling furniture...",
  "category": "SALE",
  "authorId": 1,
  "authorName": "Jane Smith",
  "imageUrls": ["url1", "url2"]
}
```

#### Like a Post
```http
POST /api/posts/community/{id}/like
```

Increments the `likesCount` by 1.

---

## 4. Amenities Booking API

**Base Path**: `/api/amenities`

### Pre-loaded Amenities

The system comes with 7 pre-loaded amenities:

| ID | Name | Icon | Price | Slot Type |
|----|------|------|-------|-----------|
| 1 | Cricket Ground | ðŸ | â‚¹500 | HOURLY |
| 2 | Football Ground | âš½ | â‚¹400 | HOURLY |
| 3 | Badminton Court | ðŸ¸ | â‚¹200 | HOURLY |
| 4 | Basketball Court | ðŸ€ | â‚¹300 | HOURLY |
| 5 | Gym | ðŸ’ª | â‚¹0 | HOURLY |
| 6 | Pickle Ball Court | ðŸŽ¾ | â‚¹150 | HOURLY |
| 7 | Tennis Court | ðŸŽ¾ | â‚¹350 | HOURLY |

### Endpoints

#### Get All Amenities
```http
GET /api/amenities
```

#### Get Available Time Slots
```http
GET /api/amenities/{id}/slots?date=2026-03-05
```

**Query Parameters**:
- `date` (required): Date in `yyyy-MM-dd` format

**Response**: 
```json
{
  "amenityId": 1,
  "date": "2026-03-05",
  "availableSlots": [
    "06:00-07:00",
    "07:00-08:00",
    "08:00-09:00",
    "09:00-10:00",
    "10:00-11:00",
    ...
    "21:00-22:00"
  ]
}
```

**Note**: Slots are generated hourly from 6:00 AM to 10:00 PM. Already booked slots are excluded.

#### Create Booking
```http
POST /api/amenities/book
Content-Type: application/json

{
  "amenityId": 1,
  "userId": 1,
  "userName": "John Doe",
  "societyName": "Green Valley Apartments",
  "bookingDate": "2026-03-05",
  "timeSlot": "10:00-11:00",
  "amount": 500
}
```

**Response**:
```json
{
  "id": "uuid",
  "amenityId": 1,
  "userId": 1,
  "userName": "John Doe",
  "societyName": "Green Valley Apartments",
  "bookingDate": "2026-03-05",
  "timeSlot": "10:00-11:00",
  "amount": 500.0,
  "paymentStatus": "PENDING",
  "paymentId": null,
  "createdAt": "2026-03-01T22:00:00"
}
```

**Error Cases**:
- 400: Slot already booked
- 404: Amenity not found

#### Update Payment Status (CCAvenue Callback)
```http
PUT /api/amenities/bookings/{bookingId}/payment?status={status}&paymentId={paymentId}
```

**Query Parameters**:
- `status`: `COMPLETED`, `FAILED`, or `REFUNDED`
- `paymentId`: Payment gateway transaction ID

#### Get User's Bookings
```http
GET /api/amenities/bookings/user/{userId}
```

#### Cancel Booking
```http
DELETE /api/amenities/bookings/{bookingId}
```

Sets `paymentStatus` to `REFUNDED`.

---

## 5. Properties API (Buy/Sell/Rent)

**Base Path**: `/api/properties`

### Endpoints

#### Get All Properties
```http
GET /api/properties
GET /api/properties?type=sale
GET /api/properties?type=rent
GET /api/properties?societyName=Green Valley Apartments
```

**Type Values**: `sale`, `rent` (case-insensitive, maps to `SALE`/`RENT`)

**Response**: Array of properties
```json
[
  {
    "id": "uuid",
    "type": "SALE",
    "bhk": "3 BHK",
    "societyName": "Green Valley Apartments",
    "tower": "A",
    "flatNumber": "301",
    "price": 7500000.0,
    "area": 1450.0,
    "furnishingStatus": "Semi-Furnished",
    "amenities": ["Parking", "Balcony", "Modular Kitchen"],
    "imageUrls": [],
    "ownerId": 1,
    "ownerName": "John Doe",
    "ownerContact": "9876543210",
    "description": "Spacious 3BHK...",
    "available": true,
    "createdAt": "2026-03-01T22:00:00"
  }
]
```

#### Advanced Property Search
```http
GET /api/properties/search?type=sale&bhk=3 BHK&minPrice=5000000&maxPrice=10000000&societyName=Green
```

**Query Parameters** (all optional):
- `type`: `SALE` or `RENT`
- `bhk`: e.g., `2 BHK`, `3 BHK`, `4 BHK`
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `societyName`: Partial match (case-insensitive)

#### Get Property by ID
```http
GET /api/properties/{id}
```

#### Get Properties by Owner
```http
GET /api/properties/owner/{ownerId}
```

#### Create Property Listing
```http
POST /api/properties
Content-Type: application/json

{
  "type": "SALE",
  "bhk": "2 BHK",
  "societyName": "Green Valley Apartments",
  "tower": "B",
  "flatNumber": "205",
  "price": 5500000,
  "area": 1100,
  "furnishingStatus": "Fully-Furnished",
  "amenities": ["Parking", "Modular Kitchen", "Balcony"],
  "imageUrls": ["url1", "url2"],
  "ownerId": 1,
  "ownerName": "Jane Smith",
  "ownerContact": "9876543211",
  "description": "Ready to move..."
}
```

#### Update Property
```http
PUT /api/properties/{id}
Content-Type: application/json

{
  "price": 5200000,
  "description": "Negotiable price"
}
```

#### Mark as Sold/Rented
```http
PUT /api/properties/{id}/unavailable
```

Sets `available` to `false`.

#### Delete Property
```http
DELETE /api/properties/{id}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "error": "Error message here"
}
```

**Common HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input or business rule violation
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## CORS Configuration

All endpoints support CORS with the following configuration:
- **Allowed Origins**: `*` (all origins)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `*`

---

## Testing with cURL

### Example: Create Announcement
```bash
curl -X POST http://localhost:8002/api/posts/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "societyName": "Test Society",
    "title": "Test Announcement",
    "content": "This is a test",
    "priority": "HIGH",
    "authorId": 1,
    "authorName": "Admin"
  }'
```

### Example: Book Cricket Ground
```bash
curl -X POST http://localhost:8002/api/amenities/book \
  -H "Content-Type: application/json" \
  -d '{
    "amenityId": 1,
    "userId": 1,
    "userName": "John Doe",
    "societyName": "Test Society",
    "bookingDate": "2026-03-10",
    "timeSlot": "10:00-11:00",
    "amount": 500
  }'
```

### Example: Search Properties
```bash
curl "http://localhost:8002/api/properties/search?type=sale&bhk=3%20BHK&minPrice=5000000&maxPrice=10000000"
```

---

## Testing with PowerShell

### Example: Get All Amenities
```powershell
Invoke-WebRequest -Uri "http://localhost:8002/api/amenities" -UseBasicParsing | 
  Select-Object -ExpandProperty Content | 
  ConvertFrom-Json
```

### Example: Create Property
```powershell
$headers = @{'Content-Type'='application/json'}
$body = @{
  type='RENT'
  bhk='2 BHK'
  societyName='Green Valley'
  price=25000
  area=1000
  ownerId=1
  ownerName='John'
  ownerContact='1234567890'
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8002/api/properties" `
  -Method POST `
  -Headers $headers `
  -Body $body `
  -UseBasicParsing
```

---

## Next Steps

1. **Frontend Integration**: Update Angular dashboard components to call these APIs
2. **Payment Gateway**: Integrate CCAvenue for amenity bookings
3. **Authentication**: Add JWT token validation to secure endpoints
4. **Database**: Replace HashMap repositories with JPA/Hibernate + MySQL
5. **File Upload**: Implement image upload for properties and community posts
6. **Notifications**: Add email/SMS notifications for bookings and announcements

---

## Support

For issues or questions, refer to:
- Main README: [README.md](./README.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- API Documentation: This file

**Service URL**: http://localhost:8002  
**Health Check**: http://localhost:8002/actuator/health (if enabled)

