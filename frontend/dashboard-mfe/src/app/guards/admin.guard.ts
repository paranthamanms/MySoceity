import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const userStr = localStorage.getItem('user');
    
    if (!userStr) {
      window.location.href = '/login-mfe';
      return false;
    }

    try {
      const user = JSON.parse(userStr);
      const role = typeof user?.role === 'string' ? user.role.toLowerCase() : '';

      // Check if user has admin role
      if (role === 'admin') {
        return true;
      }

      // Non-admin users redirected to dashboard
      console.warn('Non-admin user attempting to access admin console');
      this.router.navigate(['/']);
      return false;
    } catch (error) {
      console.error('Error parsing user data:', error);
      window.location.href = '/login-mfe';
      return false;
    }
  }
}
