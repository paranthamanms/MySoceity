# ðŸ“§ Notification Services Configuration Status

## âœ… Configured Services

### 1. **Twilio SMS Service** âœ… COMPLETE
- **Account SID**: `YOUR_TWILIO_ACCOUNT_SID`
- **Auth Token**: `YOUR_TWILIO_AUTH_TOKEN` âœ… Configured
- **Phone Number**: `+19188712299`
- **Status**: Environment variables set in Windows User profile

### 2. **Gmail SMTP Service** âš ï¸ PARTIAL
- **Email Address**: `NammaSociety.notifications@gmail.com` âœ… Configured
- **App Password**: âŒ **ACTION REQUIRED**
- **Status**: Need to generate Gmail App Password

---

## ðŸ”§ Configuration Applied

### Environment Variables Set:
```powershell
TWILIO_ACCOUNT_SID = YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN = YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER = +19188712299
MAIL_USERNAME = NammaSociety.notifications@gmail.com
MAIL_PASSWORD = (PENDING - Need App Password)
```

### Application Configuration (application.yml):
```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${MAIL_USERNAME:your-email@gmail.com}  # âœ… Will use: NammaSociety.notifications@gmail.com
    password: ${MAIL_PASSWORD:your-app-password}      # âš ï¸ Needs App Password

twilio:
  account-sid: ${TWILIO_ACCOUNT_SID:your-account-sid}  # âœ… Will use: AC8658...
  auth-token: ${TWILIO_AUTH_TOKEN:your-auth-token}     # âœ… Will use: ace61f...
  phone-number: ${TWILIO_PHONE_NUMBER:+1234567890}     # âœ… Will use: +19188712299

notification:
  email:
    from: noreply@nammasociety.com
    from-name: NammaSociety
  sms:
    enabled: true
```

---

## ðŸš¨ ACTION REQUIRED: Gmail App Password

### Why App Password?
Gmail requires an **App Password** (not your regular Gmail password) for applications to send emails via SMTP.

### How to Get Gmail App Password:

#### **Step 1: Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/security
2. Sign in to: `NammaSociety.notifications@gmail.com`
3. Find "2-Step Verification"
4. Click "Get Started" and follow the setup

#### **Step 2: Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. In "Select app" dropdown: Choose **"Mail"**
4. In "Select device" dropdown: Choose **"Windows Computer"**
5. Click **"Generate"**

#### **Step 3: Copy the 16-Character Password**
- You'll see a password like: `abcd efgh ijkl mnop`
- Copy it (spaces don't matter)

#### **Step 4: Configure in Windows**

**OPTION 1: Use the helper script (RECOMMENDED)**
```powershell
cd C:\AMP\Projects\MySoceity
.\CONFIGURE_GMAIL_APP_PASSWORD.ps1
```

**OPTION 2: Manual configuration**
```powershell
[System.Environment]::SetEnvironmentVariable('MAIL_PASSWORD', 'abcdefghijklmnop', 'User')
```
*(Replace `abcdefghijklmnop` with your actual 16-character App Password)*

---

## ðŸ”„ Applying the Configuration

### After Setting MAIL_PASSWORD:

**1. Verify Environment Variables:**
```powershell
# Check all variables are set
[System.Environment]::GetEnvironmentVariable('TWILIO_ACCOUNT_SID', 'User')
[System.Environment]::GetEnvironmentVariable('TWILIO_AUTH_TOKEN', 'User')
[System.Environment]::GetEnvironmentVariable('TWILIO_PHONE_NUMBER', 'User')
[System.Environment]::GetEnvironmentVariable('MAIL_USERNAME', 'User')
[System.Environment]::GetEnvironmentVariable('MAIL_PASSWORD', 'User')
```

**2. Restart Services:**
```powershell
# Stop all services
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force

# Start services (they will pick up new environment variables)
cd C:\AMP\Projects\MySoceity\backend\auth-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "java -jar target\auth-service-1.0.0.jar"

Start-Sleep -Seconds 8

cd C:\AMP\Projects\MySoceity\backend\user-service
Start-Process powershell -ArgumentList "-NoExit", "-Command", "java -jar target\user-service-1.0.0.jar"

Start-Sleep -Seconds 10

cd C:\AMP\Projects\MySoceity\frontend\login-mfe
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Start-Sleep -Seconds 5

cd C:\AMP\Projects\MySoceity\frontend\dashboard-mfe
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
```

**OR use the existing script:**
```powershell
cd C:\AMP\Projects\MySoceity
.\START_ALL_SERVICES.ps1
```

---

## ðŸ“± Where Notifications Are Triggered

### SMS Notifications (Twilio):
1. **Visitor Approval Requests**
   - When security creates approval request
   - SMS sent to resident's phone number
   - Location: `ApprovalRequestController.createApprovalRequest()`

2. **Visitor Entry Alert**
   - When visitor is approved and enters society
   - SMS sent to resident
   - Location: `GuestManagementService.markEntry()`

3. **Emergency Alerts** (if implemented)
   - Society-wide emergency notifications
   - Location: `EmergencyService.sendAlert()`

### Email Notifications (Gmail):
1. **Visitor Approval Requests**
   - Email sent to resident with visitor details
   - Location: `ApprovalRequestController.createApprovalRequest()`

2. **Payment Reminders**
   - Monthly payment due reminders
   - Location: `PaymentService.sendReminder()`

3. **Complaint Updates**
   - When complaint status changes
   - Location: `ComplaintService.updateStatus()`

4. **Society Announcements**
   - Admin broadcasts via email
   - Location: `AdminController.sendAnnouncement()`

---

## ðŸ§ª Testing Notifications

### Test SMS:
1. Login as **Security Guard**
2. Go to **Guest Management** â†’ **Request Visitor Approval**
3. Fill form with resident's phone number
4. Submit request
5. Check if SMS is sent to resident

### Test Email:
1. Same as SMS test
2. Email should be sent to resident's registered email
3. Check both inbox and spam folder

### Check Logs:
```powershell
# In the user-service terminal window, look for:
[INFO] Sending SMS to +919176787766...
[INFO] SMS sent successfully! SID: SMxxxxxxxxxx

[INFO] Sending email to resident@example.com...
[INFO] Email sent successfully!
```

---

## ðŸ’° Cost Monitoring

### Twilio SMS Costs:
- **Trial Account**: $15 free credit
- **India SMS**: ~$0.0079 per SMS (~â‚¹0.65)
- **USA SMS**: ~$0.0075 per SMS
- **Estimated Monthly Cost** (100 SMS/month): ~$0.75-1.00

### Gmail SMTP:
- **Cost**: **FREE**
- **Limit**: 500 emails/day
- **Exceeding limit**: Use AWS SES or SendGrid

---

## ðŸ”’ Security Best Practices

### âœ… Current Setup:
- Environment variables used (credentials not hardcoded) âœ…
- Stored in User profile (not System-wide) âœ…
- Not committed to Git âœ…

### ðŸ” For Production (AWS EKS):
```yaml
# Use Kubernetes Secrets instead of environment variables
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
  MAIL_PASSWORD: "your-gmail-app-password"
```

---

## ðŸ“‹ Verification Checklist

- [x] Twilio Account SID configured
- [x] Twilio Auth Token configured
- [x] Twilio Phone Number configured
- [x] Gmail username configured
- [ ] Gmail App Password configured â¬…ï¸ **DO THIS NOW**
- [ ] Services restarted after configuration
- [ ] SMS notification tested
- [ ] Email notification tested
- [ ] Check application logs for errors

---

## ðŸ†˜ Troubleshooting

### SMS Not Sending:
1. **Check Twilio Console**: https://console.twilio.com/
2. **Verify Trial Numbers**: Must be verified in Twilio console
3. **Check Logs**: Look for error messages in user-service logs
4. **Test Credentials**: Use Twilio's test credentials endpoint

### Email Not Sending:
1. **Verify App Password**: Make sure it's 16 characters
2. **Check Spam Folder**: Gmail might mark emails as spam initially
3. **Enable Less Secure Apps** (not recommended): Turn on in Gmail settings
4. **Check Logs**: Look for SMTP errors in user-service logs

### Common Errors:
```
ERROR: Invalid credentials - Check TWILIO_AUTH_TOKEN
ERROR: 535 Authentication failed - Check MAIL_PASSWORD (use App Password, not regular password)
ERROR: Phone number not verified - Add to Twilio verified numbers (trial account)
```

---

## ðŸ“ž Support

- **Twilio Support**: https://support.twilio.com/
- **Gmail Help**: https://support.google.com/mail/
- **Application Logs**: Check `backend/user-service/logs/`

---

**Last Updated**: March 7, 2026
**Configured By**: System Administrator
**Next Review**: After Gmail App Password setup

