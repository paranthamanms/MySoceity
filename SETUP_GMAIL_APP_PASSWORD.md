# Gmail App Password Setup for OTP Email

## Why This Is Needed

Gmail no longer allows regular passwords for third-party apps. You MUST generate an **App Password** for the EmailService to work.

---

## Step-by-Step Instructions

### 1. Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in with: **NammaSociety.notifications@gmail.com**
3. Find "2-Step Verification" section
4. Click "Get Started" or "Turn On"
5. Follow the prompts to verify your phone number
6. Complete 2FA setup

### 2. Generate App Password

1. After 2FA is enabled, go to: https://myaccount.google.com/apppasswords
   - Or: Google Account â†’ Security â†’ App Passwords
2. You may need to sign in again
3. In "Select app" dropdown: Choose **"Mail"**
4. In "Select device" dropdown: Choose **"Windows Computer"** or **"Other"**
5. If "Other", enter: **NammaSociety OTP Service**
6. Click **"Generate"**

7. **IMPORTANT**: You'll see a 16-character password like:
   ```
   abcd efgh ijkl mnop
   ```
   **Copy this immediately!** You won't be able to see it again.

### 3. Update Configuration

Copy the 16-character App Password (with or without spaces) and update:

**File**: [SETUP_OTP_ENVIRONMENT.ps1](SETUP_OTP_ENVIRONMENT.ps1)

**Line 17**: Replace the placeholder password with your App Password:
```powershell
$env:MAIL_PASSWORD = "abcdefghijklmnop"  # <-- Paste App Password here
```

### 4. Restart Services

```powershell
.\SETUP_OTP_ENVIRONMENT.ps1
```

---

## Alternative: Use a Different Email Service

If you can't generate an App Password, you can:

1. **Use a different Gmail account** that you can enable 2FA on
2. **Use Outlook/Hotmail instead**:
   ```yaml
   spring:
     mail:
       host: smtp-mail.outlook.com
       port: 587
       username: your-email@outlook.com
       password: your-password
   ```

---

## Testing After Setup

### Test Email OTP (Forgot Password)
1. Go to http://localhost:4201
2. Click "Forgot Password"
3. Select **"Email"** option
4. Enter: NammaSociety.notifications@gmail.com (or any test email)
5. Click "Send OTP"
6. **Expected**: Email received in inbox with OTP
7. Check auth-service logs for:
   ```
   âœ… OTP email sent successfully to ...
   ```

---

## Common Errors

### Error: "Authentication failed"
**Fix**: App Password is incorrect or not set
- Generate a NEW App Password
- Update SETUP_OTP_ENVIRONMENT.ps1
- Restart services

### Error: "Username and Password not accepted"
**Fix**: 2FA not enabled or App Password not generated
- Enable 2FA first
- Then generate App Password

### Error: "Invalid credentials"
**Fix**: Copy-paste error in App Password
- Remove all spaces: `abcdefghijklmnop`
- Or keep spaces: `abcd efgh ijkl mnop`
- Both formats work

---

## Security Notes

âš ï¸ **App Passwords are sensitive!**
- Do NOT commit them to Git
- Do NOT share them
- Revoke unused App Passwords periodically

âœ… **Best Practice**:
- Use environment variables (already done)
- Store in Azure Key Vault for production
- Rotate passwords quarterly

---

## Current Configuration

**Email Account**: NammaSociety.notifications@gmail.com  
**SMTP Server**: smtp.gmail.com:587  
**TLS**: STARTTLS enabled  
**Current Password**: Chennai@2009 (REGULAR PASSWORD - WON'T WORK!)  
**Required**: lxqk alyi byqs lwsp  

---

## Quick Links

- **Enable 2FA**: https://myaccount.google.com/security
- **Generate App Password**: https://myaccount.google.com/apppasswords
- **Gmail Help**: https://support.google.com/accounts/answer/185833

---

## Status Checklist

- [ ] 2-Factor Authentication enabled
- [ ] App Password generated
- [ ] App Password copied
- [ ] SETUP_OTP_ENVIRONMENT.ps1 updated
- [ ] Services restarted
- [ ] Email OTP tested successfully

