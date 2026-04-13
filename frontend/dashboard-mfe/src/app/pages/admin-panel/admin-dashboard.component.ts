import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { PaymentNotificationService } from '../../services/payment-notification.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {

  private readonly inviteTemplateStorageKey: string = 'bulkInviteTemplateConfig';
  private readonly defaultInviteMessageTemplate: string = 'Hi {{name}},\n\nYou are invited to join MySociety on NammaSociety.\n\nDownload the app:\nAndroid: {{androidLink}}\niOS: {{iosLink}}\n\nRegards,\n{{senderName}}';

  activeTab: string = 'overview';
  adminUser: any = null;
  isDragging: boolean = false;
  uploadedFile: File | null = null;
  
  // Payment Upload
  isPaymentDragging: boolean = false;
  uploadedPaymentFile: File | null = null;
  uploadSuccessMessage: string = '';
  uploadErrorMessage: string = '';
  isUploadingPayment: boolean = false;

  // Bulk Invite
  isInviteDragging: boolean = false;
  uploadedInviteFile: File | null = null;
  isInviting: boolean = false;
  inviteSendSMS: boolean = true;
  inviteSendWhatsApp: boolean = true;
  inviteSendEmail: boolean = true;
  inviteIosLink: string = 'https://apps.apple.com';
  inviteAndroidLink: string = 'https://play.google.com/store';
  inviteSenderName: string = 'NammaSociety Team';
  inviteMessageTemplate: string = '';
  inviteSuccessMessage: string = '';
  inviteErrorMessage: string = '';
  inviteSummary: any = null;

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
    private http: HttpClient,
    private paymentNotificationService: PaymentNotificationService,
    private ngZone: NgZone
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
    this.loadInviteTemplateConfig();
    // Subscribe to payment updates
    this.paymentNotificationService.paymentDataUpdated$.subscribe(() => {
      this.loadMaintenancePayments();
    });

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

  // File Upload Methods
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }
    this.uploadedFile = file;
    console.log('File selected for upload:', file.name);
  }

  submitBulkUpload(): void {
    if (!this.uploadedFile) {
      alert('No file selected');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', this.uploadedFile);
    
    console.log('Submitting bulk user upload for file:', this.uploadedFile.name);
    
    // Clear previous messages
    this.uploadSuccessMessage = '';
    this.uploadErrorMessage = '';
    
    this.http.post('http://localhost:8002/api/user/bulk-upload', formData)
      .subscribe({
        next: (response: any) => {
          const successMessage = `✓ Bulk upload successful! ${response.successCount || 0} users created.`;
          
          if (response.failureCount > 0) {
            const errorList = response.errors && response.errors.length > 0 
              ? '\n\nErrors:\n' + response.errors.slice(0, 5).join('\n') 
              : '';
            alert(successMessage + (response.failureCount ? `\n\n⚠ ${response.failureCount} records failed.${errorList}` : ''));
          } else {
            alert(successMessage);
          }
          
          this.uploadSuccessMessage = successMessage;
          setTimeout(() => {
            this.uploadSuccessMessage = '';
          }, 4000);
          
          this.clearUpload();
          
          // Reload admin stats and switch to users tab to show updated data
          this.loadAdminStats();
          
          // Automatically switch to the Users tab so the user can see the newly uploaded users
          setTimeout(() => {
            this.selectTab('users');
          }, 1500);
        },
        error: (error) => {
          let errorMsg = 'Bulk upload failed. Please check the file format.';
          
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.status === 404) {
            errorMsg = 'Bulk upload endpoint not found. Backend service may not be running on port 8002.';
          } else if (error.status === 400) {
            errorMsg = 'Invalid CSV file format. Please check the file and try again.';
          } else if (error.status === 0) {
            errorMsg = 'Unable to connect to the server. Is the backend service running on port 8002?';
          }
          
          this.uploadErrorMessage = '❌ ' + errorMsg;
          alert('Bulk Upload Error\n\n' + errorMsg);
          console.error('Bulk upload error:', error);
          
          setTimeout(() => {
            this.uploadErrorMessage = '';
          }, 5000);
        }
      });
  }

  clearUpload(): void {
    this.uploadedFile = null;
  }

  // Bulk Invite File Upload Methods
  onInviteDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isInviteDragging = true;
  }

  onInviteDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isInviteDragging = false;
  }

  onInviteFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.isInviteDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processInviteFile(files[0]);
    }
  }

  onInviteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processInviteFile(input.files[0]);
    }
  }

  processInviteFile(file: File): void {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls')) {
      this.inviteErrorMessage = 'Please select a CSV or Excel file (.csv, .xlsx, .xls).';
      this.inviteSuccessMessage = '';
      return;
    }

    this.uploadedInviteFile = file;
    this.inviteErrorMessage = '';
  }

  submitBulkInvite(): void {
    if (!this.uploadedInviteFile) {
      this.inviteErrorMessage = 'No invite contact file selected.';
      this.inviteSuccessMessage = '';
      return;
    }

    if (!this.inviteSendSMS && !this.inviteSendWhatsApp && !this.inviteSendEmail) {
      this.inviteErrorMessage = 'Select at least one channel: SMS, WhatsApp, or Email.';
      this.inviteSuccessMessage = '';
      return;
    }

    if (!this.inviteMessageTemplate || !this.inviteMessageTemplate.trim()) {
      this.inviteErrorMessage = 'Invite message template cannot be empty.';
      this.inviteSuccessMessage = '';
      return;
    }

    this.isInviting = true;
    this.inviteErrorMessage = '';
    this.inviteSuccessMessage = '';
    this.inviteSummary = null;

    const formData = new FormData();
    formData.append('file', this.uploadedInviteFile, this.uploadedInviteFile.name);
    formData.append('sendSMS', String(this.inviteSendSMS));
    formData.append('sendWhatsApp', String(this.inviteSendWhatsApp));
    formData.append('sendEmail', String(this.inviteSendEmail));
    formData.append('iosLink', this.inviteIosLink || '');
    formData.append('androidLink', this.inviteAndroidLink || '');
    formData.append('senderName', this.inviteSenderName || 'NammaSociety Team');
    formData.append('messageTemplate', this.inviteMessageTemplate || '');

    this.http.post<any>('http://localhost:8002/api/user/invites/bulk', formData)
      .subscribe({
        next: (response) => {
          this.isInviting = false;
          if (response?.success) {
            this.inviteSuccessMessage = response.message || 'Bulk invites sent successfully.';
            this.inviteSummary = response;
            this.saveInviteTemplateConfig(false);
            this.clearInviteUpload();
          } else {
            this.inviteErrorMessage = response?.message || 'Bulk invite failed.';
          }
        },
        error: (error) => {
          this.isInviting = false;
          this.inviteErrorMessage = error?.error?.message || 'Bulk invite failed. Please check your file and try again.';
        }
      });
  }

  clearInviteUpload(): void {
    this.uploadedInviteFile = null;
  }

  saveInviteTemplateConfig(showAlert: boolean = true): void {
    const payload = {
      inviteIosLink: this.inviteIosLink,
      inviteAndroidLink: this.inviteAndroidLink,
      inviteSenderName: this.inviteSenderName,
      inviteMessageTemplate: this.inviteMessageTemplate
    };

    localStorage.setItem(this.inviteTemplateStorageKey, JSON.stringify(payload));

    if (showAlert) {
      alert('Invite template saved successfully.');
    }
  }

  resetInviteTemplateConfig(): void {
    this.inviteIosLink = 'https://apps.apple.com';
    this.inviteAndroidLink = 'https://play.google.com/store';
    this.inviteSenderName = 'NammaSociety Team';
    this.inviteMessageTemplate = this.defaultInviteMessageTemplate;
    this.saveInviteTemplateConfig(false);
  }

  private loadInviteTemplateConfig(): void {
    const saved = localStorage.getItem(this.inviteTemplateStorageKey);

    if (!saved) {
      this.inviteMessageTemplate = this.defaultInviteMessageTemplate;
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      this.inviteIosLink = parsed?.inviteIosLink || this.inviteIosLink;
      this.inviteAndroidLink = parsed?.inviteAndroidLink || this.inviteAndroidLink;
      this.inviteSenderName = parsed?.inviteSenderName || this.inviteSenderName;
      this.inviteMessageTemplate = parsed?.inviteMessageTemplate || this.defaultInviteMessageTemplate;
    } catch (error) {
      console.warn('Failed to load saved invite template config. Falling back to default.', error);
      this.inviteMessageTemplate = this.defaultInviteMessageTemplate;
    }
  }

  downloadInviteTemplate(): void {
    const headers = ['name', 'phoneNumber', 'email'];
    const rows = [
      ['Resident One', '9876543210', 'resident1@example.com'],
      ['Resident Two', '9876500011', 'resident2@example.com'],
      ['Resident Three', '', 'resident3@example.com']
    ];

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_invite_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Payment File Upload Methods
  onPaymentDragOver(event: DragEvent): void {
    console.log('onPaymentDragOver');
    event.preventDefault();
    this.isPaymentDragging = true;
  }

  onPaymentDragLeave(event: DragEvent): void {
    console.log('onPaymentDragLeave');
    event.preventDefault();
    this.isPaymentDragging = false;
  }

  onPaymentFileDrop(event: DragEvent): void {
    console.log('onPaymentFileDrop called');
    event.preventDefault();
    this.isPaymentDragging = false;
    
    const files = event.dataTransfer?.files;
    console.log('Files in drop event:', files?.length, files);
    if (files && files.length > 0) {
      this.processPaymentFile(files[0]);
    }
  }

  onPaymentFileSelected(event: Event): void {
    console.log('onPaymentFileSelected called');
    const input = event.target as HTMLInputElement;
    console.log('Input files:', input.files?.length, input.files);
    if (input.files && input.files.length > 0) {
      this.processPaymentFile(input.files[0]);
    }
  }

  processPaymentFile(file: File): void {
    console.log('processPaymentFile called with file:', file.name, 'size:', file.size, 'type:', file.type);
    if (!file.name.endsWith('.csv')) {
      console.error('File is not CSV:', file.name);
      this.uploadErrorMessage = `❌ Please select a CSV file. Received: ${file.name}`;
      this.clearMessages(3000);
      return;
    }
    this.uploadedPaymentFile = file;
    console.log('✓ Payment file stored in uploadedPaymentFile');
    console.log('✓ Current uploadedPaymentFile:', this.uploadedPaymentFile?.name);
    console.log('✓ File size:', this.uploadedPaymentFile?.size, 'bytes');
    console.log('✓ upload-preview div should now be visible with Upload button');
  }

  submitPaymentUpload(): void {
    console.log('========== BUTTON CLICKED - submitPaymentUpload() CALLED ==========');
    console.log('uploadedPaymentFile:', this.uploadedPaymentFile);
    
    if (!this.uploadedPaymentFile) {
      console.error('❌ No file selected!');
      this.uploadErrorMessage = '❌ No file selected. Please select a CSV file first.';
      this.clearMessages(3000);
      return;
    }

    console.log('✓ Starting upload for:', this.uploadedPaymentFile.name);
    this.isUploadingPayment = true;
    this.uploadSuccessMessage = '';
    this.uploadErrorMessage = '';

    if (this.uploadedPaymentFile.size === 0) {
      console.error('❌ Selected file is empty');
      this.isUploadingPayment = false;
      this.uploadErrorMessage = '❌ The selected CSV file is empty.';
      this.clearMessages(5000);
      return;
    }

    const formData = new FormData();
    formData.append('file', this.uploadedPaymentFile, this.uploadedPaymentFile.name);

    console.log('✓ Uploading to http://localhost:8002/api/user/payments/bulk-upload');

    this.http.post<any>('http://localhost:8002/api/user/payments/bulk-upload', formData)
      .subscribe({
        next: (response) => {
          console.log('✓ Response:', response);
          this.ngZone.run(() => {
            this.isUploadingPayment = false;
            
            if (response?.success) {
              this.uploadSuccessMessage = `✓ Successfully processed ${response.recordsProcessed || 0} payment records!`;
              console.log('✓ SUCCESS:', this.uploadSuccessMessage);
              this.clearPaymentUpload();
              this.paymentNotificationService.notifyPaymentDataUpdated();
              this.clearMessages(5000);
            } else {
              this.uploadErrorMessage = `❌ ${response?.message || 'Upload failed'}`;
              console.error('❌ Failed:', this.uploadErrorMessage);
              this.clearMessages(5000);
            }
          });
        },
        error: (error) => {
          console.error('❌ ERROR:', error);
          this.ngZone.run(() => {
            this.isUploadingPayment = false;
            this.uploadErrorMessage = `❌ Error: ${error?.error?.message || error?.statusText || 'Unknown error'}`;
            console.error('Status:', error?.status);
            console.error('Message:', this.uploadErrorMessage);
            this.clearMessages(5000);
          });
        }
      });
  }

  clearMessages(delay: number = 0): void {
    console.log('clearMessages called with delay:', delay);
    if (delay > 0) {
      setTimeout(() => {
        console.log('Clearing messages after', delay, 'ms');
        this.uploadSuccessMessage = '';
        this.uploadErrorMessage = '';
      }, delay);
    } else {
      this.uploadSuccessMessage = '';
      this.uploadErrorMessage = '';
    }
  }

  clearPaymentUpload(): void {
    console.log('clearPaymentUpload called - resetting uploadedPaymentFile');
    console.log('Before clear - uploadedPaymentFile:', this.uploadedPaymentFile?.name);
    this.uploadedPaymentFile = null;
    console.log('After clear - uploadedPaymentFile:', this.uploadedPaymentFile);
  }

  downloadPaymentTemplate(): void {
    // Create CSV header and example data
    const headers = ['towerNumber', 'flatNumber', 'quarterName', 'quarterPeriod', 'amount', 'dueDate', 'status'];
    const extraHeaders = ['parkingFee', 'waterCharges'];
    const exampleRow = ['3', '101', 'Q1 2024', 'Jan - Mar', '15000', '2024-03-31', 'pending', '500', '300'];
    const exampleRow2 = ['3', '102', 'Q1 2024', 'Jan - Mar', '15000', '2024-03-31', 'paid', '0', '250'];
    const exampleRow3 = ['4', '201', 'Q1 2024', 'Jan - Mar', '15000', '2024-03-31', 'pending', '400', '350'];

    // Combine into CSV format
    const csvContent = [
      headers.concat(extraHeaders).join(','),
      exampleRow.join(','),
      exampleRow2.join(','),
      exampleRow3.join(','),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'payment_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to Login MFE (separate microfrontend)
    window.location.href = '/login-mfe';
  }
}
