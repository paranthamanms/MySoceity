import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  activeTab: 'credentials' | 'otp' = 'credentials';
  username = '';
  password = '';
  showPassword = false;
  mobileNumber = '';
  otp = '';
  otpSent = false;
  otpTimer = 0;
  private otpInterval: any;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  async onCredentialsLogin() {
    if (!this.username.trim() || !this.password.trim()) { this.showError('Please enter username and password.'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Signing in...' });
    await loader.present();
    this.auth.login(this.username, this.password).subscribe({
      next: () => { loader.dismiss(); this.navigateToDashboard(); },
      error: (err: any) => { loader.dismiss(); this.showError(err?.error?.message || 'Login failed.'); }
    });
  }

  async onSendOtp() {
    if (!this.mobileNumber.trim() || this.mobileNumber.length < 10) { this.showError('Enter a valid 10-digit mobile number.'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Sending OTP...' });
    await loader.present();
    this.auth.sendOtp(this.mobileNumber).subscribe({
      next: () => { loader.dismiss(); this.otpSent = true; this.startOtpTimer(); this.showToast('OTP sent.'); },
      error: (err: any) => { loader.dismiss(); this.showError(err?.error?.message || 'Failed to send OTP.'); }
    });
  }

  async onOtpLogin() {
    if (!this.otp.trim()) { this.showError('Please enter the OTP.'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Verifying OTP...' });
    await loader.present();
    this.auth.loginWithOtp(this.mobileNumber, this.otp).subscribe({
      next: () => { loader.dismiss(); this.navigateToDashboard(); },
      error: (err: any) => { loader.dismiss(); this.showError(err?.error?.message || 'Invalid OTP.'); }
    });
  }

  private navigateToDashboard() {
    this.router.navigate([this.auth.getDashboardRoute()], { replaceUrl: true });
  }

  private startOtpTimer() {
    this.otpTimer = 60;
    clearInterval(this.otpInterval);
    this.otpInterval = setInterval(() => { this.otpTimer--; if (this.otpTimer <= 0) clearInterval(this.otpInterval); }, 1000);
  }

  resendOtp() { this.onSendOtp(); }

  private async showError(msg: string) {
    this.errorMsg = msg;
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color: 'danger', position: 'bottom' });
    await t.present();
  }

  private async showToast(msg: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color: 'success', position: 'bottom' });
    await t.present();
  }
}
