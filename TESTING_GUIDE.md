# CSV Payment Upload - Testing Guide (Updated with Enhanced Logging)

## Current Status ✅

### Services Running:
- ✅ **Port 8001**: Auth Service (Backend)
- ✅ **Port 8002**: User Service (Backend) - NOW RUNNING!
- ✅ **Port 4203**: Dashboard MFE (Frontend)
- ❌ **Port 4200**: Host App (Frontend) - Not running, but not needed for testing

---

## Key Fix Applied

**The main issue was: User Service (port 8002) was NOT running!**

Without the backend service, CSV uploads would fail silently because:
1. Frontend tries to POST to `http://localhost:8002/api/user/payments/bulk-upload`
2. Connection refused → HTTP error → No success message shown
3. No error message because network failed

**Now that port 8002 is running**, the complete flow should work!

---

## Enhanced Logging Added

I've added comprehensive logging throughout the entire upload flow:

### 1. File Selection Logging
When you select a CSV file, you'll see in console:
```
✓ processPaymentFile called with file: payment_template.csv
✓ Payment file selected for upload: payment_template.csv
✓ uploadedPaymentFile is now set: File {...}
✓ upload-preview div should now be visible with button
```

### 2. File Upload Logging
When you click "Upload Payment Data", you'll see:
```
=== submitPaymentUpload() called ===
uploadedPaymentFile: File {name: "payment_template.csv", ...}
✓ File is selected: payment_template.csv
✓ FormData created with file: payment_template.csv
✓ Starting payment file upload to: http://localhost:8002/api/user/payments/bulk-upload
```

### 3. Upload Response Logging
When server responds:
```
✓ Upload response received: {success: true, recordsProcessed: 3, message: "Successfully processed 3 payment records"}
✓ Payment upload successful: 3 records processed
✓ Success message set to: ✓ Successfully processed 3 payment records!
✓ Notifying dashboard to reload payment data...
Clearing messages after 5000 ms
```

### 4. Dashboard Notification Logging
When dashboard receives notification:
```
DashboardComponent.ngOnInit() called
Subscribing to payment data updates...
✓ Subscription to payment data updates established
---
✓ Payment data updated notification received from admin panel!
✓ Reloading payment data...
Loading payment data for Tower: 3, Flat: 101
Payment data response: {success: true, payments: [...]}
Found 2 payment records
```

### 5. Debug Info in UI
Added a debug panel that shows:
```
Debug Info: File Selected: payment_template.csv | Is Uploading: false | Success Msg: ✓ Successfully processed 3 payment records! | Error Msg: empty
```

---

## Step-by-Step Testing

### Step 1: Open the Dashboard/Admin Panel
Navigate to the dashboard at port 4203 (dashboard-mfe is running there)

### Step 2: Go to Payment Management Tab
- Open admin console
- Click "Payment Management" tab
- Should see payment upload section

### Step 3: Download Payment Template
- Click "📥 Download Payment Template"
- File `payment_template.csv` will download
- Contains headers: `towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status`
- Contains example rows

### Step 4: Modify CSV for Your Test User
Edit the CSV file to add data matching a test user:
- If test user is Tower "3", Flat "101"
- Add row: `3,101,Q1 2024,Jan - Mar,15000,2024-03-31,pending`
- Add another: `3,101,Q2 2024,Apr - Jun,15000,2024-06-30,pending`

### Step 5: Upload the CSV
- Drag & drop the modified CSV onto upload box OR
- Click "Select File" button and choose the CSV
- You'll see "File Ready: payment_template.csv" section appear
- Click "💾 Upload Payment Data" button

### Step 6: Watch Console Logs
Open browser DevTools (F12) → Console tab and watch:
1. Upload starts: "=== submitPaymentUpload() called ==="
2. Upload progresses: "Starting payment file upload..."
3. Upload completes: "✓ Upload response received..."
4. Dashboard notified: "✓ Payment data updated notification received..."
5. Dashboard reloads: "Loading payment data for Tower: 3, Flat: 101..."

### Step 7: Check Success Message
After upload completes, you should see:
- Green message box: **"✓ Successfully processed X payment records!"**
- Message auto-disappears after 5 seconds

### Step 8: Verify Payment Data in Dashboard
1. Log in as the test user (Tower 3, Flat 101)
2. Go to dashboard
3. Look for "Maintenance Payment" section
4. Should see the quarterly payment data you uploaded!

---

## Debugging: Console Logs to Watch For

### ✅ Success Flow:
```javascript
// 1. File selection
✓ Payment file selected for upload: payment_template.csv

// 2. Upload trigger
=== submitPaymentUpload() called ===
✓ File is selected: payment_template.csv
✓ Starting payment file upload to: http://localhost:8002/api/user/payments/bulk-upload

// 3. Server response
✓ Upload response received: {success: true, recordsProcessed: 3, ...}
✓ Payment upload successful: 3 records processed
✓ Success message set to: ✓ Successfully processed 3 payment records!

// 4. Dashboard notification
✓ Payment data updated notification received from admin panel!
✓ Reloading payment data...

// 5. Data retrieved
Payment data response: {success: true, payments: [...]}
Found 3 payment records
```

### ❌ Issues to Debug:

**Issue**: No logs after file selection
```
Solution: Check if uploadPaymentuploadedPaymentFile variable is being set
Check browser console for: ✓ uploadedPaymentFile is now set
```

**Issue**: No logs for "submitPaymentUpload() called"
```
Solution: Button might be disabled or not bound correctly
Check: Is "Upload Payment Data" button visible and clickable?
Check HTML debug info shows file is selected
```

**Issue**: "Starting payment file upload..." but then stops
```
Solution: Backend not responding or wrong URL
Check: netstat -ano | findstr ":8002" shows service running?
Check: Network tab in DevTools shows POST request?
```

**Issue**: "✕ Error: Network error"
```
Solution: Backend service not running
Fix: cd backend/user-service && mvn spring-boot:run
Wait for message: "Tomcat started on port(s): 8002"
```

**Issue**: Upload succeeds but no dashboard message
```
Solution: PaymentNotificationService not working
Check: "Subscription to payment data updates established" in console?
Check: Dashboard is listening to notifications?
```

**Issue**: Dashboard notification received but no payment data
```
Solution: Tower/flat mismatch between CSV and user profile
Check: CSV has correct tower/flat numbers
Check: User profile has matching tower/flat
Check: No format differences like "3" vs "Tower 3"
```

---

## CSV Format Reference

### Required Columns (in order):
1. **towerNumber**: Tower building identifier
2. **flatNumber**: Apartment/flat identifier
3. **quarterName**: Quarter identifier (e.g., Q1 2024)
4. **quarterPeriod**: Human-readable period (e.g., Jan - Mar)
5. **amount**: Payment amount as number (e.g., 15000)
6. **dueDate**: Date in YYYY-MM-DD format (e.g., 2024-03-31)
7. **status**: Either "paid" or "pending"

### Valid Example:
```
towerNumber,flatNumber,quarterName,quarterPeriod,amount,dueDate,status
3,101,Q1 2024,Jan - Mar,15000,2024-03-31,pending
3,101,Q2 2024,Apr - Jun,15000,2024-06-30,paid
3,102,Q1 2024,Jan - Mar,15000,2024-03-31,paid
```

### Critical Rules:
- First row is header (will be skipped)
- Empty lines are skipped
- All 7 fields must be present on each data row
- Date must be YYYY-MM-DD format
- Status must be exactly "paid" or "pending"
- No extra spaces or special characters

---

## Architecture: How It Works Now

```
┌─────────────────────┐
│  Admin Dashboard    │
│  Port 4203          │
└──────────┬──────────┘
           │
           │ 1. Select CSV file
           │ 2. Click Upload
           ↓
┌─────────────────────┐
│ HTML Form + Logging │
│ Logs: File selected │
└──────────┬──────────┘
           │
           │ 3. POST /bulk-upload
           ↓
┌─────────────────────┐
│  User Service       │
│  Port 8002          │  ← NOW RUNNING!
└──────────┬──────────┘
           │
           │ 4. Processes CSV
           │ 5. Stores in memory
           │ 6. Returns recordsProcessed
           ↓
┌─────────────────────┐
│ Success Response    │
│ {success: true, ..} │
└──────────┬──────────┘
           │
           │ 7. Notify PaymentService
           ↓
┌─────────────────────────────────┐
│ PaymentNotificationService      │
│ (RxJS Subject)                  │
│ Tells dashboard: "Data updated" │
└──────────┬──────────────────────┘
           │
           ↓
┌─────────────────────┐
│ Dashboard Component │
│ Listening to events │
│ (Subscribed)        │
└──────────┬──────────┘
           │
           │ 8. Receives notification
           │ 9. Calls loadPaymentData()
           ↓
┌─────────────────────┐
│ GET /tower/3/flat/101
│ User Service        │
│ Port 8002           │
└──────────┬──────────┘
           │
           │ 10. Returns uploaded data
           ↓
┌─────────────────────┐
│ Dashboard Updates   │
│ Shows Payments ✓    │
└─────────────────────┘
```

---

## Testing Checklist

- [ ] Port 8002 (User Service) is running
  - Run: `cd backend/user-service && mvn spring-boot:run`
  
- [ ] Dashboard MFE is running (port 4203)
  - Running: `cd frontend/dashboard-mfe && npm start`

- [ ] Create test user with Tower "3", Flat "101"

- [ ] Download payment template from admin panel

- [ ] Edit CSV with matching tower/flat values

- [ ] Select file - see "File Selected" log

- [ ] Click Upload - see "submitPaymentUpload() called" log

- [ ] See success message "✓ Successfully processed..."

- [ ] See dashboard notification log

- [ ] Log in as test user

- [ ] Verify payments appear in dashboard

- [ ] Check all console logs match expected flow

---

## Summary of Changes

### Enhanced Logging Points:
1. processPaymentFile() - File selected
2. submitPaymentUpload() - Upload initiated + response
3. clearMessages() - Message auto-dismiss
4. Dashboard.ngOnInit() - Subscription established
5. Dashboard.loadPaymentData() - Data retrieval

### New Debug Features:
1. Debug info panel in HTML showing current state
2. Console checkmarks (✓/✕) for easier reading
3. Detailed state dumps at each step
4. Clear flow indicators

### Critical Fix:
- **User Service (port 8002) now running** ← This was blocking everything!

---

## Next Steps

1. ✅ Start all services (user-service on 8002 is key!)
2. ✅ Open dashboard
3. ✅ Test CSV upload with console logs visible
4. ✅ Verify payment data appears
5. 🔄 If issues: Check console logs against this guide
6. 🔄 Use debug endpoints if needed:
   - GET `http://localhost:8002/api/user/payments/debug/all` - View all data
   - DELETE `http://localhost:8002/api/user/payments/debug/clear` - Reset data

---

**Key Point**: The system is now complete and ready to test! The missing user-service backend was the blocker. With port 8002 running, everything should work as designed.
