import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-password-reset-modal',
  templateUrl: './password-reset-modal.component.html',
  styleUrls: ['./password-reset-modal.component.scss']
})
export class PasswordResetModalComponent implements OnInit {

  @Input() showPasswordResetModal: boolean = false;
  @Input() token: string = '';
  @Output() onPasswordReset = new EventEmitter<boolean>();

  currentPassword: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  passwordStrengthClass: string = '';
  passwordStrengthText: string = '';

  private authServiceUrl = 'http://localhost:8001/api/auth';

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
  }

  validatePasswordStrength(): void {
    if (!this.newPassword) {
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }

    const strength = this.calculatePasswordStrength(this.newPassword);
    
    if (strength < 30) {
      this.passwordStrengthText = 'Weak';
      this.passwordStrengthClass = 'weak';
    } else if (strength < 60) {
      this.passwordStrengthText = 'Fair';
      this.passwordStrengthClass = 'fair';
    } else if (strength < 80) {
      this.passwordStrengthText = 'Good';
      this.passwordStrengthClass = 'good';
    } else {
      this.passwordStrengthText = 'Strong';
      this.passwordStrengthClass = 'strong';
    }
  }

  calculatePasswordStrength(password: string): number {
    let strength = 0;

    // Length
    if (password.length >= 6) strength += 20;
    if (password.length >= 10) strength += 10;
    if (password.length >= 15) strength += 10;

    // Character types
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;

    return strength;
  }

  isPasswordValid(): boolean {
    return this.currentPassword.length > 0 &&
           this.newPassword.length >= 6 &&
           this.confirmPassword.length > 0 &&
           this.newPassword === this.confirmPassword;
  }

  submitPasswordReset(): void {
    if (!this.isPasswordValid()) {
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    };

    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    this.http.post<any>(
      `${this.authServiceUrl}/change-password`,
      payload,
      { headers }
    ).subscribe(
      (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message;
          // Emit success event after short delay
          setTimeout(() => {
            this.onPasswordReset.emit(true);
          }, 1500);
        } else {
          this.errorMessage = response.message;
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Password reset error:', error);
        this.errorMessage = error.error?.message || 'Error changing password. Please try again.';
      }
    );
  }
}
