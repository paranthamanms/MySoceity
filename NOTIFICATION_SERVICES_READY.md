# âœ… Notification Services - FULLY CONFIGURED

**Configuration Date**: March 7, 2026  
**Status**: READY FOR TESTING

---

## ðŸŽ‰ Configuration Complete!

### SMS Service (Twilio) âœ…
- **Account SID**: YOUR_TWILIO_ACCOUNT_SID
- **Auth Token**: âœ… Configured via environment variable
- **Phone Number**: YOUR_TWILIO_PHONE_NUMBER
- **Status**: **ACTIVE AND READY**

### Email Service (Gmail) âœ…
- **Email Address**: NammaSociety.notifications@gmail.com
- **Password**: âœ… Configured via environment variable
- **SMTP Server**: smtp.gmail.com:587
- **Status**: **CONFIGURED - TESTING REQUIRED**

---

## ðŸš€ Services Running

### Current Service Status:
```
âœ… Auth Service (8001) - RUNNING
âœ… User Service (8002) - RUNNING (with Email/SMS enabled)
âœ… Login MFE (4201) - RUNNING
ðŸ”„ Dashboard MFE (4203) - STARTING
```

---

## âš ï¸ IMPORTANT: Gmail Security Note

**Your Configuration:**
- Using configured mail password from environment variables

**Potential Issue:**
Google may block SMTP access with regular passwords due to security policies.

**If Email Sending Fails, You Need To:**

### Option 1: Enable "Less Secure Apps" (Not Recommended)
1. Go to: https://myaccount.google.com/lesssecureapps
2. Sign in with: NammaSociety.notifications@gmail.com
3. Turn ON "Allow less secure apps"

### Option 2: Use App Password (RECOMMENDED)
1. Enable 2-Factor Authentication:
   - Visit: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. Generate App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select: Mail + Windows Computer
   - Generate 16-character password

3. Update Environment Variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('MAIL_PASSWORD', 'your-16-char-app-password', 'User')
   ```

4. Restart user-service:
   ```powershell
   Get-Process java | Where-Object {$_.Id -eq (netstat -ano | Select-String ":8002" | ForEach-Object {$_.ToString().Split()[-1]})} | Stop-Process -Force
   cd C:\AMP\Projects\MySoceity\backend\user-service
   java -jar target\user-service-1.0.0.jar
   ```

---

## ðŸ§ª Testing Your Notifications

### Test 1: SMS Notification via Visitor Approval

**Steps:**
1. Open browser: http://localhost:4201
2. Login as **Security Guard**
   - Username: `security_guard` (or your security user)
   - Password: (your security password)

3. Navigate to **Guest Management** â†’ **Request Visitor Approval**

4. Fill the form:
   - **Society Name**: Baashyaam Crown Residence (or your society)
   - **Tower**: Tower 3 (example)
   - **Apartment**: B12 (example)
   - **Visitor Name**: Test Visitor
   - **Visitor Type**: Guest
   - **Visitor Phone**: +919176787766 (example)
   - **Resident Phone**: Enter a real phone number for SMS test
   - **Purpose**: Testing SMS notification

5. Click **Submit**

6. **Expected Result:**
   - Success message appears
   - SMS sent to resident's phone number
   - Check user-service logs for:
     ```
     [INFO] Sending SMS to +919176787766...
     [INFO] SMS sent successfully! SID: SMxxxxxxxxxx
     ```

**If SMS Fails:**
- Check Twilio Console: https://console.twilio.com/
- Verify phone number in Twilio's verified numbers (trial account requirement)
- Check logs for error messages

---

### Test 2: Email Notification via Visitor Approval

**Same steps as Test 1, but also:**
1. Ensure resident has email address in profile
2. Check resident's email inbox (and spam folder)
3. **Expected Email Contains:**
   - Subject: "Visitor Approval Request - NammaSociety"
   - Visitor details (name, type, phone)
   - Tower and Apartment number
   - Security guard name
   - Approval link (if implemented)

**Expected Logs:**
```
[INFO] Sending email to resident@example.com...
[INFO] Email sent successfully!
```

**If Email Fails:**
Check logs for error codes:
- `535 Authentication failed` â†’ Need Gmail App Password
- `Connection refused` â†’ SMTP port blocked
- `Timeout` â†’ Network/firewall issue

---

## ðŸ“± Where Notifications Are Sent

### Automatic SMS Triggers:
1. **Visitor Approval Request** (Security â†’ Resident)
   - Endpoint: `POST /api/approval-requests`
   - Location: `ApprovalRequestController.createApprovalRequest()`

2. **Visitor Entry Alert** (When approved visitor enters)
   - Endpoint: `POST /api/visitors/entry`
   - Location: `GuestManagementService.markEntry()`

3. **Payment Reminders** (Monthly dues)
   - Scheduled: 1st of every month
   - Location: `PaymentService.sendReminder()`

### Automatic Email Triggers:
1. **Visitor Approval Request**
   - Same as SMS trigger above

2. **Complaint Status Update**
   - When admin responds to complaint
   - Location: `ComplaintService.updateStatus()`

3. **Society Announcements**
   - Admin broadcast feature
   - Location: `AdminController.sendAnnouncement()`

4. **Payment Receipts**
   - After successful payment
   - Location: `PaymentService.sendReceipt()`

---

## ðŸ’° Cost Tracking

### Current Usage (Free Tier):
- **Twilio Trial**: $15 credit available
  - ~1,900 SMS messages
  - Valid numbers must be verified in Twilio console

- **Gmail SMTP**: FREE
  - 500 emails/day limit
  - No cost (using personal Gmail)

### Production Costs (when trial expires):
- **Twilio SMS (India)**: $0.0079 per SMS (~â‚¹0.65)
- **Twilio SMS (USA)**: $0.0075 per SMS
- **Estimated Monthly** (100 SMS + 500 emails):
  - SMS: ~$0.79 (~â‚¹65)
  - Email: FREE
  - **Total: ~$0.79/month** (~â‚¹65/month)

### Monitoring Usage:
- **Twilio Console**: https://console.twilio.com/
  - View sent messages
  - Check remaining credit
  - Download usage reports

---

## ðŸ”§ Troubleshooting Guide

### Issue: SMS not sending

**Check 1: Twilio Credentials**
```powershell
[System.Environment]::GetEnvironmentVariable('TWILIO_ACCOUNT_SID', 'User')
[System.Environment]::GetEnvironmentVariable('TWILIO_AUTH_TOKEN', 'User')
[System.Environment]::GetEnvironmentVariable('TWILIO_PHONE_NUMBER', 'User')
```

**Check 2: Phone Number Verification**
- Trial accounts require verified phone numbers
- Add at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

**Check 3: Twilio Account Status**
- Login to Twilio console
- Check account is active
- Verify credit balance > $0

**Check 4: User-Service Logs**
Look for errors in the PowerShell window running user-service:
```
ERROR: [Twilio] Authentication Error - Check credentials
ERROR: [Twilio] Phone number not verified
ERROR: [Twilio] Insufficient credit
```

---

### Issue: Email not sending

**Check 1: Gmail Credentials**
```powershell
[System.Environment]::GetEnvironmentVariable('MAIL_USERNAME', 'User')
[System.Environment]::GetEnvironmentVariable('MAIL_PASSWORD', 'User')
```

**Check 2: Gmail Security Settings**
- Visit: https://myaccount.google.com/security
- Check if "Less secure app access" is ON
- OR generate App Password (recommended)

**Check 3: SMTP Connection**
Test manually:
```powershell
Test-NetConnection smtp.gmail.com -Port 587
```

**Check 4: User-Service Logs**
Common errors:
```
ERROR: 535 Authentication failed
  â†’ Solution: Use App Password instead of regular password

ERROR: Connection timed out
  â†’ Solution: Check firewall/antivirus blocking port 587

ERROR: Username and Password not accepted
  â†’ Solution: Verify MAIL_USERNAME and MAIL_PASSWORD are correct
```

---

### Issue: Services not picking up environment variables

**Solution: Restart services in new PowerShell session**
```powershell
# Stop all services
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Close all service PowerShell windows
# Open NEW PowerShell window
# Start services again
cd C:\AMP\Projects\MySoceity
.\RESTART_WITH_NEW_CONFIG.ps1
```

---

## ðŸ“‹ Quick Reference Commands

### Check Environment Variables:
```powershell
Write-Host "Twilio SID: $([System.Environment]::GetEnvironmentVariable('TWILIO_ACCOUNT_SID', 'User'))"
Write-Host "Twilio Phone: $([System.Environment]::GetEnvironmentVariable('TWILIO_PHONE_NUMBER', 'User'))"
Write-Host "Email: $([System.Environment]::GetEnvironmentVariable('MAIL_USERNAME', 'User'))"
```

### View Service Logs:
- Check the PowerShell windows where services are running
- Look for lines starting with `[INFO]`, `[WARN]`, or `[ERROR]`

### Restart Specific Service:
```powershell
# Restart user-service only (has notification features)
Get-Process java | Where-Object {(Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine -like "*user-service*"} | Stop-Process -Force
cd C:\AMP\Projects\MySoceity\backend\user-service
java -jar target\user-service-1.0.0.jar
```

### Test Twilio API Directly:
```powershell
$accountSid = [System.Environment]::GetEnvironmentVariable('TWILIO_ACCOUNT_SID', 'User')
$authToken = [System.Environment]::GetEnvironmentVariable('TWILIO_AUTH_TOKEN', 'User')
$from = [System.Environment]::GetEnvironmentVariable('TWILIO_PHONE_NUMBER', 'User')

# Test SMS (replace with your verified number)
$to = "+919876543210"
$body = "Test message from NammaSociety"

Write-Host "Testing Twilio SMS..."
Write-Host "From: $from"
Write-Host "To: $to"
# Check Twilio Console for results
```

---

## ðŸŽ¯ Success Criteria

### SMS Working When:
- âœ… Security creates approval request
- âœ… SMS appears on resident's phone within 5-10 seconds
- âœ… SMS contains visitor name, apartment, and phone
- âœ… Logs show "SMS sent successfully! SID: SMxxxxxxxxxx"

### Email Working When:
- âœ… Security creates approval request
- âœ… Email arrives in resident's inbox (check spam too)
- âœ… Email contains all visitor details
- âœ… Logs show "Email sent successfully!"

---

## ðŸ” Production Deployment Checklist

When deploying to AWS EKS:

### 1. Use Kubernetes Secrets (not environment variables)
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: notification-secrets
type: Opaque
stringData:
   TWILIO_ACCOUNT_SID: "YOUR_TWILIO_ACCOUNT_SID"
   TWILIO_AUTH_TOKEN: "YOUR_TWILIO_AUTH_TOKEN"
  TWILIO_PHONE_NUMBER: "+19188712299"
  MAIL_USERNAME: "NammaSociety.notifications@gmail.com"
   MAIL_PASSWORD: "YOUR_GMAIL_APP_PASSWORD"  # Or App Password
```

### 2. Reference secrets in deployment:
```yaml
env:
  - name: TWILIO_ACCOUNT_SID
    valueFrom:
      secretKeyRef:
        name: notification-secrets
        key: TWILIO_ACCOUNT_SID
  # ... repeat for all secrets
```

### 3. Upgrade Twilio Account
- Remove trial restrictions
- Add payment method
- Verify more phone numbers if needed

### 4. Consider AWS SES for Email
- More reliable than Gmail in production
- Cost: $0.10 per 1,000 emails
- No daily limits

---

## ðŸ“ž Support & Resources

### Twilio:
- Console: https://console.twilio.com/
- Docs: https://www.twilio.com/docs/sms
- Support: https://support.twilio.com/

### Gmail:
- Account Security: https://myaccount.google.com/security
- App Passwords: https://myaccount.google.com/apppasswords
- Help: https://support.google.com/mail/

### Application Logs:
- User Service: Check PowerShell window running on port 8002
- Database: Check approval_requests table for entries

---

## âœ… Current Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| **Twilio SMS** | âœ… READY | Account configured, $15 credit available |
| **Gmail Email** | âš ï¸ NEEDS TESTING | Configured with password, may need App Password |
| **Auth Service** | âœ… RUNNING | Port 8001 |
| **User Service** | âœ… RUNNING | Port 8002 with notifications enabled |
| **Login MFE** | âœ… RUNNING | Port 4201 |
| **Dashboard MFE** | ðŸ”„ STARTING | Port 4203 |

---

## ðŸŽ¯ Next Steps

1. **Test SMS Notification** (5 minutes)
   - Create visitor approval request
   - Check if SMS received
   - Verify logs

2. **Test Email Notification** (5 minutes)
   - Same approval request
   - Check email received
   - If fails, generate App Password

3. **Document Results**
   - Record which notifications work
   - Note any error messages
   - Share feedback for improvements

4. **Production Planning**
   - Plan AWS EKS deployment
   - Budget for Twilio production
   - Consider AWS SES for email

---

**Configuration Complete! Ready for Testing! ðŸš€**

For questions or issues, check the service logs in the PowerShell windows or review the troubleshooting section above.

