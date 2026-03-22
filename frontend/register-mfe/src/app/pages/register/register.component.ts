import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  // Register form fields
  userType: string = '';
  ownerType: string = '';
  societyName: string = '';
  towerNumber: string = '';
  flatNumber: string = '';
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  loading: boolean = false;
  error: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
  }

  register(): void {
    // Validation
    if (!this.userType || !this.societyName || !this.towerNumber || !this.flatNumber || 
        !this.username || !this.email || !this.password) {
      this.error = 'Please fill in all required fields';
      return;
    }

    if (this.userType === 'owner' && !this.ownerType) {
      this.error = 'Please select owner type';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.loading = true;
    this.error = '';
    this.successMessage = '';

    const registerData = {
      userType: this.userType,
      ownerType: this.userType === 'owner' ? this.ownerType : null,
      societyName: this.societyName,
      towerNumber: this.towerNumber,
      flatNumber: this.flatNumber,
      username: this.username,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword
    };

    this.authService.register(registerData).subscribe(
      (response: any) => {
        this.loading = false;
        if (response.success) {
          this.successMessage = 'Registration successful! Redirecting to login...';
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          setTimeout(() => {
            window.location.href = '/dashboard-mfe';
          }, 1500);
        } else {
          this.error = response.message || 'Registration failed';
        }
      },
      (error: any) => {
        this.loading = false;
        this.error = error.error?.message || 'Registration failed. Please try again.';
      }
    );
  }

  goBack(): void {
    window.location.href = '/login-mfe';
  }
}
