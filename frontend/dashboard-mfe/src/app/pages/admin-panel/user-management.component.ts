import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit, OnDestroy {

  searchQuery: string = '';
  isModalOpen: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  private refreshSubscription: Subscription | null = null;

  // Form fields for new user
  newUserForm = {
    username: '',
    email: '',
    phoneNumber: '',
    address: '',
    userType: '',
    ownerType: '',
    societyName: '',
    tower: '',
    flat: '',
    password: ''
  };

  // Edit user form
  editUserForm: any = null;
  isEditModalOpen: boolean = false;
  
  // View user details
  viewUserData: any = null;
  isViewModalOpen: boolean = false;

  allUsers: any[] = [];
  filteredUsers: any[] = [];
  societies: any[] = [];
  currentUser: any = null;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadSocieties();
    this.loadUsers();
    // Auto-refresh user list every 10 seconds to ensure it stays in sync with backend
    this.refreshSubscription = interval(10000).subscribe(() => {
      if (!this.isModalOpen) {
        this.loadUsers();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Fetch users from backend API
    this.http.get<any[]>('http://localhost:8002/api/users').subscribe({
      next: (users) => {
        // Ensure all required fields exist
        this.allUsers = users.map((user: any) => ({
          id: user.id || user.userId,
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber || 'Not provided',
          address: user.address || 'Not provided',
          userType: this.formatUserType(user.userType),
          ownerType: user.ownerType || '',
          tower: user.towerNumber || user.tower || 'N/A',
          flat: user.flatNumber || user.flat || 'N/A',
          registeredDate: user.createdDate ? this.formatDate(user.createdDate) : 'N/A',
          status: user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active',
          societyName: user.societyName || user.address || 'Default Society'
        }));

        // Filter users by society if user is Society Admin
        if (this.isSocietyAdmin() && this.currentUser && this.currentUser.societyName) {
          const currentSociety = this.currentUser.societyName.trim().toLowerCase();
          this.allUsers = this.allUsers.filter((u: any) =>
            u.societyName && u.societyName.trim().toLowerCase() === currentSociety
          );
        }

        this.filteredUsers = this.allUsers;
        if (this.allUsers.length === 0) {
          this.errorMessage = 'No users found. Create users using the "Add New User" button or bulk upload.';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = `Error loading users: ${error.status === 0 ? 'Cannot connect to server' : 'Server error'}. Make sure the backend is running.`;
        this.allUsers = [];
        this.filteredUsers = [];
        this.isLoading = false;
      }
    });
  }

  refreshUsers(): void {
    this.loadUsers();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
    }
  }

  loadSocieties(): void {
    console.log('[UserManagement] Loading societies from API...');
    this.http.get<any[]>('http://localhost:8002/api/societies').subscribe({
      next: (response) => {
        const res: any = response;
        this.societies = Array.isArray(res) ? res : (res.value || []);
        console.log('[UserManagement] Loaded societies:', this.societies.length, 'societies');
        console.log('[UserManagement] Society names:', this.societies.map(s => s.name).join(', '));
      },
      error: (error) => {
        console.error('[UserManagement] Error loading societies:', error);
        this.societies = [];
      }
    });
  }

  isSuperAdmin(): boolean {
    if (!this.currentUser) return false;
    
    const role = (this.currentUser.role || '').toUpperCase();
    const userType = (this.currentUser.userType || '').toLowerCase();
    const ownerType = (this.currentUser.ownerType || '').toLowerCase();
    
    // Super admin identified by:
    // 1. userType === 'superadmin'
    // 2. role === 'SUPER-ADMIN'
    // 3. ownerType === 'super-admin'
    // 4. userType === 'admin' BUT no societyName (default admin user)
    if (userType === 'superadmin' || role === 'SUPER-ADMIN' || ownerType === 'super-admin') {
      return true;
    }
    
    // Default admin user without society assignment is Super Admin
    if (userType === 'admin' && !this.currentUser.societyName) {
      return true;
    }
    
    return false;
  }

  isSocietyAdmin(): boolean {
    if (!this.currentUser) return false;
    
    // First check if they are a Super Admin - if so, they're NOT a Society Admin
    if (this.isSuperAdmin()) {
      return false;
    }
    
    const role = (this.currentUser.role || '').toUpperCase();
    const userType = (this.currentUser.userType || '').toLowerCase();
    const ownerType = (this.currentUser.ownerType || '').toLowerCase();
    
    // Society admin has admin userType WITH societyName, or society-admin role/ownerType
    if (userType === 'admin' && this.currentUser.societyName) {
      return true;
    }
    
    return role === 'SOCIETY-ADMIN' || ownerType === 'society-admin';
  }

  isNormalUser(): boolean {
    return !this.isSuperAdmin() && !this.isSocietyAdmin();
  }

  getFilteredSocieties(): any[] {
    console.log('[UserManagement] getFilteredSocieties called');
    console.log('[UserManagement] Current user:', this.currentUser);
    console.log('[UserManagement] Total societies:', this.societies.length);
    console.log('[UserManagement] Is super admin:', this.isSuperAdmin());
    
    if (this.isSuperAdmin()) {
      console.log('[UserManagement] Returning all societies for super admin');
      return this.societies; // Super admin sees all societies
    } else if (this.currentUser && this.currentUser.societyName) {
      // Society admin sees only their assigned society
      const filtered = this.societies.filter(s => s.name === this.currentUser.societyName);
      console.log('[UserManagement] Filtered societies for society admin:', filtered.length);
      return filtered;
    }
    console.log('[UserManagement] No societies to return (user not admin or no society assigned)');
    return [];
  }

  loadSampleUsers(): void {
    // DEPRECATED: No longer using sample data
    // Remove the fallback to sample data to ensure real data is displayed
    this.allUsers = [];
    this.filteredUsers = [];
    this.errorMessage = 'No users found. Please create users using bulk upload or "Add New User" button.';
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

  filterUsers(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = this.allUsers;
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.allUsers.filter(user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.societyName.toLowerCase().includes(query)
      );
    }
    this.currentPage = 1;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  get paginatedUsers(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  openAddUserModal(): void {
    this.isModalOpen = true;
    this.resetForm();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.resetForm();
    this.errorMessage = '';
    this.successMessage = '';
  }

  resetForm(): void {
    this.newUserForm = {
      username: '',
      email: '',
      phoneNumber: '',
      address: '',
      userType: '',
      ownerType: '',
      societyName: '',
      tower: '',
      flat: '',
      password: ''
    };
  }

  submitNewUser(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.newUserForm.username || !this.newUserForm.username.trim()) {
      this.errorMessage = 'Username is required';
      return;
    }
    
    if (!this.newUserForm.email || !this.newUserForm.email.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUserForm.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (!this.newUserForm.phoneNumber || !this.newUserForm.phoneNumber.trim()) {
      this.errorMessage = 'Phone number is required';
      return;
    }

    // Phone number validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.newUserForm.phoneNumber)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number';
      return;
    }

    if (!this.newUserForm.userType || !this.newUserForm.userType.trim()) {
      this.errorMessage = 'User type is required';
      return;
    }
    
    if (!this.newUserForm.tower || !this.newUserForm.tower.trim()) {
      this.errorMessage = 'Tower number is required';
      return;
    }
    
    if (!this.newUserForm.flat || !this.newUserForm.flat.trim()) {
      this.errorMessage = 'Flat number is required';
      return;
    }

    if (!this.newUserForm.societyName || !this.newUserForm.societyName.trim()) {
      this.errorMessage = 'Society name is required';
      return;
    }

    if (!this.newUserForm.password || !this.newUserForm.password.trim()) {
      this.errorMessage = 'Password is required';
      return;
    }

    if (this.newUserForm.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    const payload = {
      username: this.newUserForm.username.trim(),
      email: this.newUserForm.email.trim(),
      phoneNumber: this.newUserForm.phoneNumber.trim(),
      address: this.newUserForm.address ? this.newUserForm.address.trim() : null,
      userType: this.newUserForm.userType.trim(),
      ownerType: this.newUserForm.ownerType ? this.newUserForm.ownerType.trim() : null,
      societyName: this.newUserForm.societyName.trim(),
      towerNumber: this.newUserForm.tower.trim(),
      flatNumber: this.newUserForm.flat.trim(),
      password: this.newUserForm.password,
      active: true
    };

    console.log('Submitting new user:', payload);

    this.http.post('/api/users', payload).subscribe({
      next: (response: any) => {
        console.log('User created successfully:', response);
        this.successMessage = 'User created successfully!';
        this.errorMessage = '';
        setTimeout(() => {
          this.closeModal();
          this.loadUsers();
        }, 1500);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        let errorMsg = 'Error creating user. Please try again.';
        
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.error?.text) {
          errorMsg = error.error.text;
        } else if (error.status === 400) {
          errorMsg = 'Invalid user data. Please check all fields.';
        } else if (error.status === 409) {
          errorMsg = 'User with this username or email already exists.';
        } else if (error.status === 0) {
          errorMsg = 'Cannot connect to the server. Please check if the backend is running.';
        }
        
        this.errorMessage = errorMsg;
        this.successMessage = '';
      }
    });
  }

  toggleUserStatus(user: any): void {
    const newStatus = user.status === 'Active';
    
    this.http.put(`/api/users/${user.id}`, { ...user, active: !newStatus }).subscribe({
      next: (response: any) => {
        user.status = !newStatus ? 'Active' : 'Inactive';
        this.successMessage = `User ${!newStatus ? 'activated' : 'deactivated'} successfully!`;
        this.errorMessage = '';
        this.loadUsers();
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || `Error updating user  status. Please try again.`;
        this.successMessage = '';
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      this.http.delete(`/api/users/${userId}`).subscribe({
        next: (response) => {
          this.allUsers = this.allUsers.filter(u => u.id !== userId);
          this.filterUsers();
          this.successMessage = 'User deleted successfully!';
          this.errorMessage = '';
          setTimeout(() => {
            this.successMessage = '';
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error deleting user. Please try again.';
          this.successMessage = '';
        }
      });
    }
  }

  editUser(user: any): void {
    this.editUserForm = { ...user };
    this.isEditModalOpen = true;
  }

  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editUserForm = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  saveEditedUser(): void {
    if (!this.editUserForm) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.http.put(`/api/users/${this.editUserForm.id}`, {
      userId: this.editUserForm.id,
      username: this.editUserForm.username,
      email: this.editUserForm.email,
      phoneNumber: this.editUserForm.phoneNumber,
      address: this.editUserForm.address,
      userType: this.editUserForm.userType,
      ownerType: this.editUserForm.ownerType,
      societyName: this.editUserForm.societyName,
      towerNumber: this.editUserForm.tower,
      flatNumber: this.editUserForm.flat,
      active: this.editUserForm.status === 'Active'
    }).subscribe({
      next: (response) => {
        this.successMessage = 'User updated successfully!';
        this.loadUsers();
        setTimeout(() => {
          this.closeEditModal();
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error updating user. Please try again.';
      }
    });
  }

  viewUserDetails(user: any): void {
    this.viewUserData = { ...user };
    this.isViewModalOpen = true;
  }

  closeViewModal(): void {
    this.isViewModalOpen = false;
    this.viewUserData = null;
  }
}
