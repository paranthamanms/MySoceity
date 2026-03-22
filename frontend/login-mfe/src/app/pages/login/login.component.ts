import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // Login tabs
  activeLoginTab: 'credentials' | 'mobile' = 'credentials';

  // Credentials login
  username: string = '';
  password: string = '';
  credentialsCaptcha: string = '';
  generatedCredentialsCaptcha: string = '';

  // Mobile OTP login
  mobileNumber: string = '';
  otp: string = '';
  mobileCaptcha: string = '';
  generatedMobileCaptcha: string = '';
  otpSent: boolean = false;
  otpTimer: number = 0;
  otpTimerInterval: any;
  generatedOTP: string = ''; // Store generated OTP for validation

  // Forgot password
  showForgotPasswordModal: boolean = false;
  forgotPasswordMethod: 'mobile' | 'email' = 'mobile';
  forgotPasswordIdentifier: string = '';
  forgotPasswordOtp: string = '';
  forgotPasswordOtpSent: boolean = false;
  generatedForgotPasswordOTP: string = ''; // Store generated OTP for validation
  forgotPasswordResetToken: string = '';
  newPassword: string = '';
  confirmNewPassword: string = '';
  forgotPasswordStep: 'identifier' | 'otp' | 'newPassword' = 'identifier';

  loading: boolean = false;
  error: string = '';
  successMessage: string = '';
  showPasswordResetModal: boolean = false;
  currentToken: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    this.generateCredentialsCaptcha();
    this.generateMobileCaptcha();
  }

  // Tab switching
  switchLoginTab(tab: 'credentials' | 'mobile'): void {
    this.activeLoginTab = tab;
    this.error = '';
    this.successMessage = '';
    if (tab === 'credentials') {
      this.generateCredentialsCaptcha();
    } else {
      this.generateMobileCaptcha();
    }
  }

  // Captcha generation
  generateCredentialsCaptcha(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.generatedCredentialsCaptcha = captcha;
    this.credentialsCaptcha = '';
  }

  generateMobileCaptcha(): void {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
      captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.generatedMobileCaptcha = captcha;
    this.mobileCaptcha = '';
  }

  login(): void {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password';
      return;
    }

    // Validate captcha
    if (this.credentialsCaptcha !== this.generatedCredentialsCaptcha) {
      this.error = 'Invalid captcha. Please try again.';
      this.generateCredentialsCaptcha();
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.authService.login(this.username, this.password).subscribe(
      (response: any) => {
        this.loading = false;
        if (response.success) {
          // Store token and user in localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentToken = response.token;

          // Check if password reset is required
          this.checkPasswordResetRequired(response.token);
        } else {
          this.error = response.message || 'Login failed';
        }
      },
      (error: any) => {
        this.loading = false;
        this.error = error.error?.message || 'Login failed. Please try again.';
      }
    );
  }

  checkPasswordResetRequired(token: string): void {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    this.http.post<any>(
      'http://localhost:8001/api/auth/check-password-reset',
      {},
      { headers }
    ).subscribe(
      (response) => {
        if (response.requiresPasswordReset) {
          // Show password reset modal
          this.showPasswordResetModal = true;
          this.successMessage = '';
        } else {
          // Proceed to dashboard
          this.proceedToDashboard();
        }
      },
      (error) => {
        console.warn('Error checking password reset:', error);
        // Proceed anyway if check fails
        this.proceedToDashboard();
      }
    );
  }

  proceedToDashboard(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const dashboardUrl = `http://localhost:4203/?token=${encodeURIComponent(token || '')}&user=${encodeURIComponent(user || '')}`;

    // dashboard-mfe may take extra time to compile; wait briefly before redirecting.
    this.waitForDashboardReady(600, 1000).then((ready) => {
      if (ready) {
        window.location.href = dashboardUrl;
      } else {
        this.error = 'Dashboard is still starting. Please retry login after dashboard service is up on port 4203.';
      }
    });
  }

  private async waitForDashboardReady(maxAttempts: number, delayMs: number): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await fetch('http://localhost:4203/', { method: 'GET', mode: 'no-cors' });
        return true;
      } catch {
        // keep retrying while dashboard dev server is coming up
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return false;
  }

  onPasswordReset(success: boolean): void {
    if (success) {
      this.showPasswordResetModal = false;
      this.successMessage = 'Password changed successfully! Proceeding to dashboard...';
      setTimeout(() => {
        this.proceedToDashboard();
      }, 1500);
    }
  }

  goToRegister(): void {
    window.location.href = 'http://localhost:4202/register-mfe';
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      if (this.activeLoginTab === 'credentials') {
        this.login();
      } else {
        if (!this.otpSent) {
          this.sendOTP();
        } else {
          this.verifyOTP();
        }
      }
    }
  }

  // Mobile OTP login methods
  sendOTP(): void {
    if (!this.mobileNumber || this.mobileNumber.length !== 10) {
      this.error = 'Please enter a valid 10-digit mobile number';
      return;
    }

    // Validate captcha
    if (this.mobileCaptcha !== this.generatedMobileCaptcha) {
      this.error = 'Invalid captcha. Please try again.';
      this.generateMobileCaptcha();
      return;
    }

    this.loading = true;
    this.error = '';

    // Call backend API to send OTP


    this.http.post<any>('http://localhost:8001/api/auth/send-otp', {


      mobileNumber: this.mobileNumber


    }).subscribe(


      (response) => {


        this.loading = false;


        if (response.success) {


          this.otpSent = true;


          this.successMessage = 'OTP sent successfully to your mobile number.';


          this.startOTPTimer();


        } else {


          this.error = response.message || 'Failed to send OTP';


        }


      },


      (error) => {


        this.loading = false;


        this.error = error.error?.message || 'Failed to send OTP. Please try again.';


      }


    );
  }

  verifyOTP(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.error = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.loading = true;
    this.error = '';

    // Call backend API to verify OTP


    this.http.post<any>('http://localhost:8001/api/auth/verify-otp', {


      mobileNumber: this.mobileNumber,


      otp: this.otp


    }).subscribe(


      (response) => {


        if (response.success) {


          // OTP verified, now login by mobile


          this.http.get<any>('http://localhost:8001/api/auth/login-by-mobile?mobile=' + this.mobileNumber).subscribe(


            (loginResponse) => {


              this.loading = false;


              if (loginResponse.success) {


                localStorage.setItem('token', loginResponse.token);


                localStorage.setItem('user', JSON.stringify(loginResponse.user));


                this.currentToken = loginResponse.token;


                this.checkPasswordResetRequired(loginResponse.token);


              } else {


                this.error = loginResponse.message || 'Login failed';


              }


            },


            (error) => {


              this.loading = false;


              this.error = error.error?.message || 'Login failed. Please try again.';


            }


          );


        } else {


          this.loading = false;


          this.error = response.message || 'Invalid OTP';


        }


      },


      (error) => {


        this.loading = false;


        this.error = error.error?.message || 'Invalid OTP. Please try again.';


      }


    );
  }

  resendOTP(): void {
    this.otp = '';
    this.otpSent = false;
    this.clearOTPTimer();
    this.sendOTP();
  }

  startOTPTimer(): void {
    this.otpTimer = 60;
    this.otpTimerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.clearOTPTimer();
      }
    }, 1000);
  }

  clearOTPTimer(): void {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
    this.otpTimer = 0;
  }

  // Forgot password methods
  openForgotPasswordModal(): void {
    this.showForgotPasswordModal = true;
    this.forgotPasswordStep = 'identifier';
    this.forgotPasswordMethod = 'mobile';
    this.forgotPasswordIdentifier = '';
    this.forgotPasswordOtp = '';
    this.forgotPasswordOtpSent = false;
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.error = '';
    this.successMessage = '';
  }

  closeForgotPasswordModal(): void {
    this.showForgotPasswordModal = false;
    this.error = '';
    this.successMessage = '';
  }

  sendForgotPasswordOTP(): void {
    if (!this.forgotPasswordIdentifier) {
      this.error = `Please enter your ${this.forgotPasswordMethod === 'mobile' ? 'mobile number' : 'email'}`;
      return;
    }

    if (this.forgotPasswordMethod === 'mobile' && this.forgotPasswordIdentifier.length !== 10) {
      this.error = 'Please enter a valid 10-digit mobile number';
      return;
    }

    this.loading = true;
    this.error = '';

    // Call backend API to send forgot password OTP


    this.http.post<any>('http://localhost:8001/api/auth/forgot-password/send-otp', {


      identifier: this.forgotPasswordIdentifier,


      method: this.forgotPasswordMethod


    }).subscribe(


      (response) => {


        this.loading = false;


        if (response.success) {


          this.forgotPasswordOtpSent = true;


          this.forgotPasswordStep = 'otp';


          this.successMessage = `OTP sent successfully to your ${this.forgotPasswordMethod}.`;


        } else {


          this.error = response.message || 'Failed to send OTP';


        }


      },


      (error) => {


        this.loading = false;


        this.error = error.error?.message || 'Failed to send OTP. Please try again.';


      }


    );
  }

  verifyForgotPasswordOTP(): void {
    if (!this.forgotPasswordOtp || this.forgotPasswordOtp.length !== 6) {
      this.error = 'Please enter a valid 6-digit OTP';
      return;
    }

    this.loading = true;
    this.error = '';

    // Call backend API to verify forgot password OTP
    this.http.post<any>('http://localhost:8001/api/auth/forgot-password/verify-otp', {
      identifier: this.forgotPasswordIdentifier,
      otp: this.forgotPasswordOtp
    }).subscribe(
      (response) => {
        this.loading = false;
        if (response.success) {
          this.forgotPasswordResetToken = response.resetToken;
          this.forgotPasswordStep = 'newPassword';
          this.successMessage = 'OTP verified successfully. Please set your new password.';
          this.error = '';
        } else {
          this.error = response.message || 'Invalid OTP';
        }
      },
      (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Invalid OTP. Please try again.';
      }
    );
  }

  resetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    if (this.newPassword !== this.confirmNewPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    // Call backend API to reset password
    this.http.post<any>('http://localhost:8001/api/auth/forgot-password/reset', {
      identifier: this.forgotPasswordIdentifier,
      method: this.forgotPasswordMethod,
      newPassword: this.newPassword,
      resetToken: this.forgotPasswordResetToken
    }).subscribe(
      (response) => {
        this.loading = false;
        if (response.success) {
          console.log('%câœ… PASSWORD RESET SUCCESSFUL', 'color: #4caf50; font-size: 16px; font-weight: bold');
          console.log('User identifier: ' + this.forgotPasswordIdentifier);
          this.successMessage = 'Password reset successfully! Please login with your new password.';
          setTimeout(() => {
            this.closeForgotPasswordModal();
            // Reset form fields
            this.forgotPasswordIdentifier = '';
            this.forgotPasswordOtp = '';
            this.newPassword = '';
            this.confirmNewPassword = '';
            this.forgotPasswordStep = 'identifier';
            this.forgotPasswordOtpSent = false;
            this.generatedForgotPasswordOTP = '';
          }, 2000);
        } else {
          this.error = response.message || 'Failed to reset password';
        }
      },
      (error) => {
        this.loading = false;
        console.error('Password reset error:', error);
        this.error = error.error?.message || 'Failed to reset password. Please try again.';
      }
    );
  }

  ngOnDestroy(): void {
    this.clearOTPTimer();
  }
}

