# Script to update OTP methods in login.component.ts
Write-Host "`n=== UPDATING OTP METHODS IN LOGIN COMPONENT ===" -ForegroundColor Cyan

$file = "c:\AMP\Projects\MySoceity\frontend\login-mfe\src\app\pages\login\login.component.ts"
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "Original file size: $($content.Length) chars" -ForegroundColor Yellow

# Backup
$backupFile = $file + ".backup"
$content | Set-Content $backupFile -Encoding UTF8
Write-Host "Backup created: $backupFile" -ForegroundColor Green

# Replacement 1: Update sendOTP method
Write-Host "`n1. Updating sendOTP method..." -ForegroundColor Cyan
$pattern1 = '(?s)(\s+)// TEMPORARY: Generate mock OTP and display in console.*?this\.startOTPTimer\(\);[\s]*\},[\s]*500\);'
$replacement1 = @'
$1// Call backend API to send OTP
$1this.http.post<any>('http://localhost:8001/api/auth/send-otp', {
$1  mobileNumber: this.mobileNumber
$1}).subscribe(
$1  (response) => {
$1    this.loading = false;
$1    if (response.success) {
$1      this.otpSent = true;
$1      this.successMessage = 'OTP sent successfully to your mobile number.';
$1      this.startOTPTimer();
$1    } else {
$1      this.error = response.message || 'Failed to send OTP';
$1    }
$1  },
$1  (error) => {
$1    this.loading = false;
$1    this.error = error.error?.message || 'Failed to send OTP. Please try again.';
$1  }
$1);
'@
$content = $content -replace $pattern1, $replacement1
Write-Host "  sendOTP updated" -ForegroundColor Green

# Replacement 2: Update verifyOTP method
Write-Host "2. Updating verifyOTP method..." -ForegroundColor Cyan
$pattern2 = '(?s)(\s+)// TEMPORARY: Verify against mock OTP.*?this\.error\s*=\s*''Invalid OTP\. Please check the console and try again\.'';[\s]*\}'
$replacement2 = @'
$1// Call backend API to verify OTP
$1this.http.post<any>('http://localhost:8001/api/auth/verify-otp', {
$1  mobileNumber: this.mobileNumber,
$1  otp: this.otp
$1}).subscribe(
$1  (response) => {
$1    if (response.success) {
$1      // OTP verified, now login by mobile
$1      this.http.get<any>('http://localhost:8001/api/auth/login-by-mobile?mobile=' + this.mobileNumber).subscribe(
$1        (loginResponse) => {
$1          this.loading = false;
$1          if (loginResponse.success) {
$1            localStorage.setItem('token', loginResponse.token);
$1            localStorage.setItem('user', JSON.stringify(loginResponse.user));
$1            this.currentToken = loginResponse.token;
$1            this.checkPasswordResetRequired(loginResponse.token);
$1          } else {
$1            this.error = loginResponse.message || 'Login failed';
$1          }
$1        },
$1        (error) => {
$1          this.loading = false;
$1          this.error = error.error?.message || 'Login failed. Please try again.';
$1        }
$1      );
$1    } else {
$1      this.loading = false;
$1      this.error = response.message || 'Invalid OTP';
$1    }
$1  },
$1  (error) => {
$1    this.loading = false;
$1    this.error = error.error?.message || 'Invalid OTP. Please try again.';
$1  }
$1);
'@
$content = $content -replace $pattern2, $replacement2
Write-Host "  verifyOTP updated" -ForegroundColor Green

# Replacement 3: Update sendForgotPasswordOTP method  
Write-Host "3. Updating sendForgotPasswordOTP method..." -ForegroundColor Cyan
$pattern3 = '(?s)(\s+)// TEMPORARY: Generate mock OTP and display in console[\s\S]*?this\.successMessage\s*=\s*.OTP sent successfully! Check browser console for OTP\..;[\s]*\},[\s]*500\);'
$replacement3 = @'
$1// Call backend API to send forgot password OTP
$1this.http.post<any>('http://localhost:8001/api/auth/forgot-password/send-otp', {
$1  identifier: this.forgotPasswordIdentifier,
$1  method: this.forgotPasswordMethod
$1}).subscribe(
$1  (response) => {
$1    this.loading = false;
$1    if (response.success) {
$1      this.forgotPasswordOtpSent = true;
$1      this.forgotPasswordStep = 'otp';
$1      this.successMessage = `OTP sent successfully to your ${this.forgotPasswordMethod}.`;
$1    } else {
$1      this.error = response.message || 'Failed to send OTP';
$1    }
$1  },
$1  (error) => {
$1    this.loading = false;
$1    this.error = error.error?.message || 'Failed to send OTP. Please try again.';
$1  }
$1);
'@
$content = $content -replace $pattern3, $replacement3
Write-Host "  sendForgotPasswordOTP updated" -ForegroundColor Green

# Replacement 4: Update verifyForgotPasswordOTP method
Write-Host "4. Updating verifyForgotPasswordOTP method..." -ForegroundColor Cyan
$pattern4 = '(?s)(\s+)// TEMPORARY: Verify against mock OTP[\s\S]*?this\.error\s*=\s*''Invalid OTP\. Please check the console and try again\.'';[\s]*\}'
$replacement4 = @'
$1// Call backend API to verify forgot password OTP
$1this.http.post<any>('http://localhost:8001/api/auth/forgot-password/verify-otp', {
$1  identifier: this.forgotPasswordIdentifier,
$1  otp: this.forgotPasswordOtp
$1}).subscribe(
$1  (response) => {
$1    this.loading = false;
$1    if (response.success) {
$1      this.forgotPasswordResetToken = response.resetToken;
$1      this.forgotPasswordStep = 'newPassword';
$1      this.successMessage = 'OTP verified successfully. Please set your new password.';
$1      this.error = '';
$1    } else {
$1      this.error = response.message || 'Invalid OTP';
$1    }
$1  },
$1  (error) => {
$1    this.loading = false;
$1    this.error = error.error?.message || 'Invalid OTP. Please try again.';
$1  }
$1);
'@
$content = $content -replace $pattern4, $replacement4
Write-Host "  verifyForgotPasswordOTP updated" -ForegroundColor Green

# Replacement 5: Update resetPassword method to include resetToken
Write-Host "5. Updating resetPassword method..." -ForegroundColor Cyan
#$pattern5 = '(identifier:\s+this\.forgotPasswordIdentifier,[\s\n]*method:\s+this\.forgotPasswordMethod,[\s\n]*newPassword:\s+this\.newPassword)([\s\n]*\})'
#$replacement5 = '$1,' + "`r`n" + '      resetToken: this.forgotPasswordResetToken$2'
$pattern5 = 'identifier:\s+this\.forgotPasswordIdentifier,[\s\n]*method:\s+this\.forgotPasswordMethod,[\s\n]*newPassword:\s+this\.newPassword[\s\n]*(\})'
$replacement5 = 'identifier: this.forgotPasswordIdentifier,' + "`r`n" + '      method: this.forgotPasswordMethod,' + "`r`n" + '      newPassword: this.newPassword,' + "`r`n" + '      resetToken: this.forgotPasswordResetToken' + "`r`n" + '    $1'
$content = $content -replace $pattern5, $replacement5
Write-Host "  resetPassword updated with resetToken parameter" -ForegroundColor Green

# Save the updated content
$content | Set-Content $file -Encoding UTF8
Write-Host "`nFile updated successfully!" -ForegroundColor Green
Write-Host "Updated file size: $($content.Length) chars" -ForegroundColor Yellow

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Updated 5 methods in login.component.ts:" -ForegroundColor White
Write-Host "  1. sendOTP() - Now calls POST /api/auth/send-otp" -ForegroundColor White
Write-Host "  2. verifyOTP() - Now calls POST /api/auth/verify-otp + GET /api/auth/login-by-mobile" -ForegroundColor White
Write-Host "  3. sendForgotPasswordOTP() - Now calls POST /api/auth/forgot-password/send-otp" -ForegroundColor White
Write-Host "  4. verifyForgotPasswordOTP() - Now calls POST /api/auth/forgot-password/verify-otp" -ForegroundColor White
Write-Host "  5. resetPassword() - Now includes resetToken in request" -ForegroundColor White
Write-Host "`nBackup saved at: $backupFile" -ForegroundColor Yellow
