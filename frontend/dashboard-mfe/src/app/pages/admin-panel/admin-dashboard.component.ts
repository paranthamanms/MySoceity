import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  activeTab: string = 'overview';
  adminUser: any = null;

  // Overview Stats
  totalUsers: number = 0;
  activeUsers: number = 0;
  communityCount: number = 12;
  systemAlerts: number = 0;
  isLoadingStats: boolean = false;

  // Recent Users - will be populated from backend
  recentUsers: any[] = [];

  // Settings
  defaultAdminPassword: string = 'admin@123';
  passwordExpiryDays: number = 90;
  allowPublicRegistration: boolean = true;
  enableAuditLogging: boolean = true;
  auditLogRetentionDays: number = 15;

  // Maintenance Payment Data
  maintenancePayments: any[] = [];
  maintenanceQuarterTotals: Map<string, { expected: number; collected: number; pending: number }> = new Map();
  totalCollectionsExpected: number = 0;
  totalCollected: number = 0;
  totalPending: number = 0;
  searchQuery: string = '';
  filterTower: string = '';
  filterStatus: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const initialTab = this.route.snapshot.queryParamMap.get('tab');
    if (initialTab) {
      this.activeTab = initialTab;
    }
    this.loadAdminUser();
    this.checkAdminAccess();
    this.loadAuditConfig();
    this.loadAdminStats();
    this.loadMaintenancePayments();

    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      if (tab) {
        this.activeTab = tab;
      }
    });
  }

  loadAdminStats(): void {
    this.isLoadingStats = true;
    this.http.get<any>('/api/users').subscribe({
      next: (response) => {
        // Handle multiple response formats from backend
        let users = Array.isArray(response) ? response : (response.value || response.users || response || []);
        
        this.totalUsers = users.length;
        
        // Count active users (users with status 'active' or 'Active')
        this.activeUsers = users.filter((u: any) => {
          const status = u.status || '';
          return status.toLowerCase() === 'active';
        }).length;
        
        // Update recent users - get the last 4 users
        this.recentUsers = users.slice(-4).reverse().map((user: any) => ({
          username: user.username,
          userType: this.formatUserType(user.userType),
          registeredDate: user.createdDate ? this.formatDate(user.createdDate) : 'N/A'
        }));
        
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
        this.totalUsers = 0;
        this.activeUsers = 0;
        this.isLoadingStats = false;
      }
    });
  }

  formatUserType(userType: string): string {
    if (!userType) return 'User';
    return userType.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
  }

  loadAdminUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.adminUser = JSON.parse(userStr);
    }
  }

  checkAdminAccess(): void {
    // Check if user is logged in (role-based access will be added later)
    if (!this.adminUser) {
      console.warn('No user logged in. Admin access denied.');
      window.location.href = '/login-mfe';
    } else {
      console.log('✓ Admin user access granted for:', this.adminUser.username);
    }
  }

  selectTab(tabName: string): void {
    this.activeTab = tabName;
    // Load maintenance payments when switching to that tab
    if (tabName === 'maintenance') {
      this.loadMaintenancePayments();
    }
  }

  loadMaintenancePayments(): void {
    this.http.get<any>('http://localhost:8002/api/user/payments/debug/all')
      .subscribe({
        next: (response) => {
          console.log('Maintenance Payments Response:', response);
          if (response?.success && response?.allPayments) {
            const allPayments: any[] = [];
            
            // Handle both Array format and Map/Object format from backend
            const paymentData = response.allPayments;
            
            if (Array.isArray(paymentData)) {
              // Array format - legacy or alternate response
              paymentData.forEach((resident: any) => {
                if (resident.maintenanceQuarters && Array.isArray(resident.maintenanceQuarters)) {
                  resident.maintenanceQuarters.forEach((quarter: any) => {
                    allPayments.push({
                      tower: resident.tower,
                      flat: resident.flat,
                      towerFlat: `${resident.tower}-${resident.flat}`,
                      quarter: quarter.name,
                      quarterPeriod: quarter.period,
                      amount: quarter.amount || 0,
                      dueDate: quarter.dueDate,
                      status: quarter.status,
                      statusText: quarter.statusText,
                      additionalFields: quarter.additionalFields
                    });
                  });
                }
              });
            } else {
              // Map/Object format - typical backend response
              // paymentData is like {"3:101": [MaintenancePayment, ...], "2:202": [...], ...}
              Object.entries(paymentData).forEach(([key, payments]: [string, any]) => {
                const [tower, flat] = key.split(':');
                if (Array.isArray(payments)) {
                  payments.forEach((payment: any) => {
                    allPayments.push({
                      tower: tower,
                      flat: flat,
                      towerFlat: `${tower}-${flat}`,
                      quarter: payment.quarterName || payment.quarter || 'Unknown',
                      quarterPeriod: payment.quarterPeriod || payment.period || '',
                      amount: parseFloat(String(payment.amount || 0)),
                      dueDate: payment.dueDate || '',
                      status: payment.status || 'pending',
                      statusText: payment.statusText || this.capitalizeStatus(payment.status || 'pending'),
                      additionalFields: payment.additionalFields || {}
                    });
                  });
                }
              });
            }
            
            this.maintenancePayments = allPayments;
            this.calculateMaintenanceTotals();
            console.log('✓ Loaded maintenance payments:', this.maintenancePayments.length, 'records');
            console.log('Maintenance payments detail:', this.maintenancePayments);
          } else {
            console.warn('No payment data received or invalid response structure');
            this.maintenancePayments = [];
          }
        },
        error: (error) => {
          console.error('Error loading maintenance payments:', error);
          this.maintenancePayments = [];
        }
      });
  }

  calculateMaintenanceTotals(): void {
    this.maintenanceQuarterTotals.clear();
    this.totalCollectionsExpected = 0;
    this.totalCollected = 0;
    this.totalPending = 0;

    this.maintenancePayments.forEach((payment: any) => {
      const quarterKey = payment.quarter; // e.g., "Q1"
      let quarterTotal = this.maintenanceQuarterTotals.get(quarterKey) || { expected: 0, collected: 0, pending: 0 };
      
      const paymentAmount = parseFloat(String(payment.amount)) || 0;
      const additionalAmount = this.getAdditionalFieldsTotal(payment.additionalFields);
      const totalAmount = paymentAmount + additionalAmount;

      quarterTotal.expected += totalAmount;
      this.totalCollectionsExpected += totalAmount;

      if (payment.status === 'paid' || payment.statusText === 'Paid') {
        quarterTotal.collected += totalAmount;
        this.totalCollected += totalAmount;
      } else {
        quarterTotal.pending += totalAmount;
        this.totalPending += totalAmount;
      }

      this.maintenanceQuarterTotals.set(quarterKey, quarterTotal);
    });

    console.log('Quarter totals:', this.maintenanceQuarterTotals);
    console.log('Total Collections Expected:', this.totalCollectionsExpected);
    console.log('Total Collected:', this.totalCollected);
    console.log('Total Pending:', this.totalPending);
  }

  getAdditionalFieldsTotal(additionalFields: any): number {
    if (!additionalFields) return 0;
    let total = 0;
    if (typeof additionalFields === 'object') {
      Object.values(additionalFields).forEach((value: any) => {
        const numValue = parseFloat(String(value)) || 0;
        total += numValue;
      });
    }
    return total;
  }

  getFilteredMaintenancePayments(): any[] {
    return this.maintenancePayments.filter((payment: any) => {
      const matchesSearch = !this.searchQuery || 
        payment.towerFlat.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesTower = !this.filterTower || payment.tower === this.filterTower;
      const matchesStatus = !this.filterStatus || payment.status === this.filterStatus;
      return matchesSearch && matchesTower && matchesStatus;
    });
  }

  getUniqueTowers(): string[] {
    const towers = new Set<string>();
    this.maintenancePayments.forEach(payment => {
      if (payment.tower) towers.add(payment.tower);
    });
    return Array.from(towers).sort();
  }

  capitalizeStatus(status: string): string {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  loadAuditConfig(): void {
    this.http.get<any>('http://localhost:8002/api/user/audit-logs/config')
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.enableAuditLogging = !!response.auditLoggingEnabled;
            this.auditLogRetentionDays = Number(response.retentionDays ?? 15);
          }
        },
        error: () => {
          console.warn('Unable to load audit log configuration. Using defaults.');
        }
      });
  }

  saveAuditConfig(): void {
    const payload = {
      auditLoggingEnabled: this.enableAuditLogging,
      retentionDays: this.auditLogRetentionDays
    };

    this.http.put<any>('http://localhost:8002/api/user/audit-logs/config', payload)
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.enableAuditLogging = !!response.auditLoggingEnabled;
            this.auditLogRetentionDays = Number(response.retentionDays ?? this.auditLogRetentionDays);
            alert('Audit log settings saved successfully');
          }
        },
        error: () => {
          alert('Failed to save audit log settings. Please try again.');
        }
      });
  }

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to Login MFE (separate microfrontend)
    window.location.href = '/login-mfe';
  }
}
