# Payment CSV Upload - Testing & Debugging Guide

## Overview
The payment CSV upload feature allows administrators to bulk upload maintenance payment details for residents. The uploaded payments are automatically linked to residents based on their tower and flat number.

## How the Payment Flow Works

### Frontend Flow:
1. **Admin Dashboard (Payment Management Tab)**
   - Click "📥 Download Payment Template" to get CSV template
   - Fill in payment details in the CSV file
   - Drag & drop or select the CSV file
   - Click "💾 Upload Payment Data"
   - See success/error message with record count
   - Success message triggers `PaymentNotificationService.notifyPaymentDataUpdated()`

2. **Dashboard Component (Resident View)**
   - Subscribes to `PaymentNotificationService.paymentDataUpdated$`
   - When notification received → calls `loadPaymentData()`
   - Makes GET /api/user/payments/tower/{tower}/{flat} request
   - Updates maintenanceQuarters array with backend data

### Backend Flow:
1. **POST /api/user/payments/bulk-upload**
   - Receives CSV file in FormData
   - PaymentService.processBulkUpload() processes file:
     - Skips header row
     - Parses each line into MaintenancePayment object
     - Calls storePayment() for each record
   - Returns response with `recordsProcessed` count
   - Logs all stored keys and values

2. **GET /api/user/payments/tower/{tower}/{flat}**
   - Looks up payments by key: `{towerNumber}:{flatNumber}`
   - Returns list of MaintenancePayment objects
   - Logs requested key and available keys in storage

3. **Storage**
   - Payments stored in `ConcurrentHashMap<String, List<MaintenancePayment>>`
   - Key format: `{towerNumber}:{flatNumber}` (e.g., "3:101" or "Tower 3:B12")
   - **CRITICAL**: Key format must match exactly between CSV and user profile

## CSV Format

```
towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status
3,101,Q1 2024,Jan - Mar,15000,2024-03-31,pending
3,B12,Q2 2024,Apr - Jun,15000,2024-06-30,paid
Tower 2,A05,Q1 2024,Jan - Mar,12000,2024-03-31,pending
```

### Field Descriptions:
- **towerNumber**: Tower identifier (e.g., "3", "Tower 2", "A") - MUST match user's tower field
- **flatNumber**: Flat/apartment identifier (e.g., "101", "B12", "A05") - MUST match user's flat field
- **quarterName**: Quarter identifier (e.g., "Q1 2024", "Q2 2024")
- **quarterPeriod**: Human-readable period (e.g., "Jan - Mar", "Apr - Jun")
- **amount**: Amount in numeric format (e.g., 15000)
- **dueDate**: Date in YYYY-MM-DD format (e.g., 2024-03-31)
- **status**: Either "paid" or "pending"

## Debugging Steps

### 1. Check Mock/Real User Data
```javascript
// In Browser Console -> Application -> Local Storage -> user
// Should see:
{
  "username": "resident123",
  "towerNumber": "3",     // ← IMPORTANT
  "flatNumber": "101",    // ← IMPORTANT
  "email": "user@example.com"
}
```

### 2. Check Browser Console for Logs
After uploading CSV, check browser console for:
```
✓ "Starting payment file upload: filename.csv"
✓ "Upload response: {success: true, recordsProcessed: X, ...}"
✓ "Payment upload successful: X records processed"
✓ "Payment data updated notification received, reloading payment data..."
✓ "Loading payment data for Tower: 3, Flat: 101"
✓ "Payment data response: {success: true, payments: [...]}"
```

### 3. Check Backend Logs
The backend logs key information during upload/retrieval:

**During Upload:**
```
INFO: Received payment bulk upload request. File: payments.csv
INFO: Stored payment - Key: '3:101', Tower: 3, Flat: 101, Quarter: Q1 2024, Amount: 15000
INFO: Payment bulk upload completed. Records processed: 10
```

**During Retrieval:**
```
INFO: Retrieving payments - Requested Key: '3:101', Tower: 3, Flat: 101, Found 2 records
```

**If No Records Found:**
```
WARN: No payment records found for Tower: 3, Flat: 101. Available keys: [3:B12, Tower 2:A05, ...]
```

### 4. Use Debug Endpoints

**View all stored payment data:**
```bash
GET http://localhost:8002/api/user/payments/debug/all
```

**Clear all payment data (for testing):**
```bash
DELETE http://localhost:8002/api/user/payments/debug/clear
```

### 5. Identify Key Mismatches
If payments are uploaded but not appearing:

1. **Check CSV keys**: Open uploaded CSV and note exact towerNumber/flatNumber values
2. **Check User keys**: View `{user}` object in localStorage
3. **Compare**: Do they match exactly?
   - "3" vs "Tower 3" ❌ NOT EQUAL
   - "101" vs "B101" ❌ NOT EQUAL
   - "B12" vs "B12" ✓ EQUAL

### 6. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| No success message after upload | Response not received | Check Network tab in DevTools |
| Success message shows record count but no data in dashboard | Key format mismatch | Ensure CSV tower/flat matches user profile |
| Upload returns 400/500 error | Invalid CSV format | Verify 7 fields per row, proper date format |
| Payments stored but GET returns empty | Tower/flat case mismatch | Check if CSV has "Tower 2" but user has "tower 2" |
| Data stored but lost after server restart | In-memory storage | Expected behavior - migrate to database for persistence |

## Testing Checklist

- [ ] Create test user with known tower/flat (e.g., Tower: "3", Flat: "101")
- [ ] Download payment template from admin panel
- [ ] Fill CSV with matching tower/flat values as test user
- [ ] Upload CSV file
- [ ] See success message with record count > 0
- [ ] Log in as test user and verify payments appear in dashboard
- [ ] Check browser console for "Payment data updated notification received"
- [ ] Check backend logs for "Stored payment" and "Retrieving payments" entries

## Sample Test Data

Use `sample-payments.csv` in `/backend/user-service/src/main/resources/` for testing.

Test users should have tower/flat matching the CSV, such as:
- Tower: "3", Flat: "101" → Should see payments from CSV "3,101"
- Tower: "Tower 3", Flat: "B15" → Should see payments from CSV "Tower 3,B15"
- Tower: "Tower 2", Flat: "A05" → Should see payments from CSV "Tower 2,A05"

## Files Modified

### Frontend
- `admin-dashboard.component.ts` - Added success/error messages and notification trigger
- `admin-dashboard.component.html` - Added message container and upload UI
- `admin-dashboard.component.scss` - Added message styling
- `dashboard.component.ts` - Added notification subscription and auto-reload
- `payment-notification.service.ts` - New service for inter-component communication

### Backend
- `PaymentService.java` - Enhanced logging for debugging
- `PaymentController.java` - Added debug endpoints and better response logging

## Architecture Notes

**Inter-Component Communication Pattern:**
- Admin Component uploads CSV → notifies PaymentNotificationService
- Dashboard Component subscribes to PaymentNotificationService
- When notification received → Dashboard automatically reloads payment data
- Benefits: Decoupled components, auto-refresh without page reload

**Data Storage:**
- In-memory only (ConcurrentHashMap)
- Lost on server restart
- Good for development/testing
- For production: Implement database persistence

**Logging Strategy:**
- Key format logged during storage: `Stored payment - Key: '3:101'`
- Key format logged during retrieval: `Requested Key: '3:101'`
- All available keys logged when no match found: `Available keys: [...]`
- Makes debugging key mismatches easy
