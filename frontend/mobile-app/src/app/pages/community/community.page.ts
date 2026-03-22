import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GuestManagementService } from '../../services/guest-management.service';
import { ApprovalRequest, ApprovalLog, PreApproval, UserProfile, CommunityPost } from '../../models/approval.model';

@Component({
  selector: 'app-community',
  templateUrl: './community.page.html',
  styleUrls: ['./community.page.scss'],
  standalone: false
})
export class CommunityPage implements OnInit, OnDestroy {
  user: UserProfile | null = null;
  activeSegment: 'overview' | 'requests' | 'logs' | 'preapprovals' | 'posts' = 'overview';

  pendingRequests: ApprovalRequest[] = [];
  approvalLogs: ApprovalLog[] = [];
  preApprovals: PreApproval[] = [];
  posts: CommunityPost[] = [];
  announcements: CommunityPost[] = [];
  selectedPostType: 'community' | 'announcements' = 'community';

  showApprovalPopup = false;
  currentApproval: ApprovalRequest | null = null;
  popupTimer = 0;
  private popupInterval: any;
  private pollInterval: any;

  showPreApprovalForm = false;
  newPreApproval: Partial<PreApproval> = {};
  currentSocietyScannerCode = '';
  scannerCodeUpdatedAt = 0;
  scannerEntryPayload = '';
  scannerEntry: Partial<ApprovalRequest> = {
    societyName: '',
    tower: '',
    apartmentNumber: '',
    visitorType: 'GUEST',
    serviceSubCategory: '',
    visitorName: '',
    visitorPhone: '',
    visitorAadhaar: '',
    visitorIdProof: '',
    ownerName: '',
    ownerPhone: '',
    residentPhone: '',
    faceCapture: '',
    scannerCode: '',
    scannerSource: 'MANUAL',
    purpose: ''
  };
  visitorTypes = ['Guest', 'Delivery', 'Cab', 'Vendor', 'Visiting Help'];
  deliveryServices = ['Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'BigBasket', 'Blinkit', 'Other'];
  cabServices = ['Ola', 'Uber', 'Rapido', 'Other'];

  isAdmin = false;

  quickActions: Array<{ key: string; label: string; icon: string; color: string; badge?: number }> = [];
  showMenuPanel = false;

  // Hierarchical menu properties
  expandedMenuItems: Set<string> = new Set();
  amenitiesList = [
    { name: 'Cricket Ground', icon: 'football-outline' },
    { name: 'Football Ground', icon: 'football-outline' },
    { name: 'Badminton Court', icon: 'checkmark-done-outline' },
    { name: 'Basketball Court', icon: 'checkmark-done-outline' },
    { name: 'Gym', icon: 'fitness-outline' },
    { name: 'Pickle Ball Court', icon: 'checkmark-done-outline' },
    { name: 'Tennis Court', icon: 'checkmark-done-outline' }
  ];
  postCategories = [
    { key: 'community', label: 'Community Posts', icon: 'chatbubbles-outline' },
    { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline' },
    { key: 'preapprovals', label: 'Pre-Approvals', icon: 'shield-checkmark-outline' }
  ];

  constructor(
    public auth: AuthService,
    private guestSvc: GuestManagementService,
    private router: Router,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.user = this.auth.getCurrentUser();
    this.isAdmin = this.auth.isAdminUser() || this.auth.isSocietyAdmin();
    this.initializeScannerEntry();
    this.loadSocietyScannerCode();
    this.quickActions = this.buildQuickActions();
    this.loadData();
    this.startPolling();
  }

  ionViewWillEnter() {
    this.user = this.auth.getCurrentUser();
    this.isAdmin = this.auth.isAdminUser() || this.auth.isSocietyAdmin();
    this.initializeScannerEntry();
    this.loadSocietyScannerCode();
    this.quickActions = this.buildQuickActions();
    this.loadData();
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
    clearInterval(this.popupInterval);
  }

  private startPolling() {
    this.pollInterval = setInterval(() => { this.checkForIncomingRequests(); }, 10000);
  }

  loadData() {
    this.loadPending();
    this.loadLogs();
    this.loadPreApprovals();
    this.loadPosts();
    this.quickActions = this.buildQuickActions();
  }

  private initializeScannerEntry() {
    this.scannerEntry.societyName = this.user?.societyName || '';
    this.scannerEntry.scannerCode = this.currentSocietyScannerCode || '';
  }

  loadSocietyScannerCode() {
    const societyName = this.user?.societyName || '';
    if (!societyName) return;

    this.guestSvc.getSocietyScannerCode(societyName).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        if (!this.scannerEntry.scannerCode) {
          this.scannerEntry.scannerCode = this.currentSocietyScannerCode;
        }
      },
      error: () => {
        this.currentSocietyScannerCode = '';
      }
    });
  }

  generateSocietyScannerCode() {
    const societyName = this.user?.societyName || '';
    const generatedBy = this.user?.username || 'society-admin';
    if (!societyName) return;

    this.guestSvc.generateSocietyScannerCode(societyName, generatedBy).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.scannerEntry.scannerCode = this.currentSocietyScannerCode;
        this.showToast('Scanner code generated for ' + societyName, 'success');
      },
      error: () => this.showToast('Failed to generate scanner code', 'danger')
    });
  }

  applyScannerPayload() {
    const raw = (this.scannerEntryPayload || '').trim();
    if (!raw) {
      this.showToast('Scanner payload is empty', 'warning');
      return;
    }

    try {
      const payload = JSON.parse(raw);
      this.scannerEntry.scannerCode = payload.scannerCode || this.scannerEntry.scannerCode || '';
      this.scannerEntry.visitorType = payload.visitorType || this.scannerEntry.visitorType || 'GUEST';
      this.scannerEntry.serviceSubCategory = payload.serviceSubCategory || this.scannerEntry.serviceSubCategory || '';
      this.scannerEntry.visitorName = payload.visitorName || this.scannerEntry.visitorName || '';
      this.scannerEntry.visitorAadhaar = payload.visitorAadhaar || this.scannerEntry.visitorAadhaar || '';
      this.scannerEntry.visitorPhone = payload.visitorPhone || this.scannerEntry.visitorPhone || '';
      this.scannerEntry.tower = payload.tower || this.scannerEntry.tower || '';
      this.scannerEntry.apartmentNumber = payload.flatNumber || payload.apartmentNumber || this.scannerEntry.apartmentNumber || '';
      this.scannerEntry.ownerName = payload.ownerName || this.scannerEntry.ownerName || '';
      this.scannerEntry.ownerPhone = payload.ownerPhone || this.scannerEntry.ownerPhone || '';
      this.scannerEntry.faceCapture = payload.faceCapture || this.scannerEntry.faceCapture || '';
      this.scannerEntry.scannerSource = 'QR_SCAN';
      this.showToast('Scanned payload applied', 'success');
    } catch {
      this.showToast('Invalid scanner payload JSON', 'danger');
    }
  }

  async submitScannerEntryRequest() {
    if (!this.user) return;
    if (!(this.auth.getRoleCategory() === 'security' || this.auth.getRoleCategory() === 'society-admin')) {
      this.showToast('Only Security/Society Admin can create gate requests', 'warning');
      return;
    }

    const tower = (this.scannerEntry.tower || '').trim();
    const flat = (this.scannerEntry.apartmentNumber || '').trim();
    if (!tower || !flat || !this.scannerEntry.visitorName) {
      this.showToast('Tower, Flat and Visitor Name are required', 'warning');
      return;
    }

    if (this.currentSocietyScannerCode && this.scannerEntry.scannerSource === 'QR_SCAN') {
      if (this.scannerEntry.scannerCode !== this.currentSocietyScannerCode) {
        this.showToast('Scanner code mismatch for society', 'danger');
        return;
      }
    }

    const residentPhone = (this.scannerEntry.residentPhone || this.scannerEntry.ownerPhone || '').trim();
    if (!residentPhone) {
      this.showToast('Resident/Owner phone is required', 'warning');
      return;
    }

    const payload: ApprovalRequest = {
      societyName: this.scannerEntry.societyName || this.user.societyName,
      tower,
      apartmentNumber: `${tower}-${flat}`,
      visitorType: this.scannerEntry.visitorType || 'GUEST',
      serviceSubCategory: this.scannerEntry.serviceSubCategory || '',
      visitorName: this.scannerEntry.visitorName || '',
      visitorPhone: this.scannerEntry.visitorPhone || '',
      visitorAadhaar: this.scannerEntry.visitorAadhaar || '',
      visitorIdProof: this.scannerEntry.visitorIdProof || '',
      ownerName: this.scannerEntry.ownerName || '',
      ownerPhone: this.scannerEntry.ownerPhone || '',
      residentPhone,
      faceCapture: this.scannerEntry.faceCapture || '',
      scannerCode: this.scannerEntry.scannerCode || '',
      scannerSource: this.scannerEntry.scannerSource || 'MANUAL',
      requestedBy: this.user.username || 'security',
      purpose: this.scannerEntry.purpose || ''
    };

    const loader = await this.loadingCtrl.create({ message: 'Creating approval request...' });
    await loader.present();

    this.guestSvc.createApprovalRequest(payload).subscribe({
      next: async () => {
        await loader.dismiss();
        this.showToast('Approval request created from scanner entry', 'success');
        this.scannerEntryPayload = '';
        this.initializeScannerEntry();
        this.loadPending();
        this.loadLogs();
      },
      error: async () => {
        await loader.dismiss();
        this.showToast('Failed to create scanner entry request', 'danger');
      }
    });
  }

  loadPending() {
    const apt = this.user?.apartmentNumber || '';
    const soc = this.user?.societyName || '';
    const obs = this.isAdmin ? this.guestSvc.getAllPendingForSociety(soc) : this.guestSvc.getPendingRequests(apt, soc);
    obs.subscribe({ next: (r) => { this.pendingRequests = r; this.checkForIncomingRequests(); }, error: () => {} });
  }

  loadLogs() {
    const apt = this.user?.apartmentNumber || undefined;
    const soc = this.user?.societyName || '';
    this.guestSvc.getApprovalLogs(soc, apt).subscribe({ next: (l) => { this.approvalLogs = l; }, error: () => {} });
  }

  loadPreApprovals() {
    const apt = this.user?.apartmentNumber ?? null;
    const soc = this.user?.societyName || '';
    this.guestSvc.getPreApprovals(apt, soc).subscribe({ next: (p) => { this.preApprovals = p; }, error: () => {} });
  }

  loadPosts() {
    const soc = this.user?.societyName || '';
    if (!soc) {
      this.posts = [];
      this.announcements = [];
      return;
    }

    this.guestSvc.getCommunityPosts(soc).subscribe({ next: (items) => { this.posts = items || []; }, error: () => { this.posts = []; } });
    this.guestSvc.getAnnouncements(soc).subscribe({ next: (items) => { this.announcements = items || []; }, error: () => { this.announcements = []; } });
  }

  private checkForIncomingRequests() {
    const pending = this.pendingRequests.filter(r => r.status === 'PENDING');
    if (pending.length > 0 && !this.showApprovalPopup) { this.openApprovalPopup(pending[0]); }
  }

  loadSummary() {
    this.loadData();
  }

  openApprovalPopup(req: ApprovalRequest) {
    this.currentApproval = req;
    this.showApprovalPopup = true;
    this.popupTimer = 120;
    clearInterval(this.popupInterval);
    this.popupInterval = setInterval(() => {
      this.popupTimer--;
      if (this.popupTimer <= 0) { clearInterval(this.popupInterval); this.closeApprovalPopup(); }
    }, 1000);
  }

  closeApprovalPopup() {
    this.showApprovalPopup = false;
    this.currentApproval = null;
    clearInterval(this.popupInterval);
    this.popupTimer = 0;
  }

  async onApprove() {
    if (!this.currentApproval?.id) return;
    const loader = await this.loadingCtrl.create({ message: 'Approving...' });
    await loader.present();
    const name = this.user?.fullName || this.user?.username || 'Resident';
    this.guestSvc.approveRequest(this.currentApproval.id, name).subscribe({
      next: async () => { await loader.dismiss(); this.closeApprovalPopup(); this.showToast('Visitor approved.', 'success'); this.loadData(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to approve.', 'danger'); }
    });
  }

  async onReject() {
    if (!this.currentApproval?.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Reject Entry',
      message: 'Reason for rejection (optional):',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reject', cssClass: 'reject-btn', handler: async (data) => {
          const loader = await this.loadingCtrl.create({ message: 'Rejecting...' });
          await loader.present();
          const name = this.user?.fullName || this.user?.username || 'Resident';
          this.guestSvc.rejectRequest(this.currentApproval!.id!, name, data.note).subscribe({
            next: async () => { await loader.dismiss(); this.closeApprovalPopup(); this.showToast('Entry rejected.', 'warning'); this.loadData(); },
            error: async () => { await loader.dismiss(); this.showToast('Failed to reject.', 'danger'); }
          });
        }}
      ]
    });
    await alert.present();
  }

  openPreApprovalForm() {
    this.newPreApproval = {
      apartmentNumber: this.user?.apartmentNumber || '',
      societyName: this.user?.societyName || '',
      visitorType: 'Guest',
      createdBy: this.user?.fullName || this.user?.username || 'Resident'
    };
    this.showPreApprovalForm = true;
  }

  async submitPreApproval() {
    if (!this.newPreApproval.visitorName || !this.newPreApproval.visitorPhone) { this.showToast('Name and phone are required.', 'warning'); return; }
    const loader = await this.loadingCtrl.create({ message: 'Saving...' });
    await loader.present();
    this.guestSvc.createPreApproval(this.newPreApproval as PreApproval).subscribe({
      next: async () => { await loader.dismiss(); this.showPreApprovalForm = false; this.showToast('Pre-approval added.', 'success'); this.loadPreApprovals(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to save.', 'danger'); }
    });
  }

  async deletePreApproval(id: number) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Pre-Approval', message: 'Remove this pre-approved visitor?',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Delete', role: 'destructive', handler: () => { this.preApprovals = this.preApprovals.filter(p => p.id !== id); this.showToast('Removed.', 'medium'); } }]
    });
    await alert.present();
  }

  onSegmentChange(ev: any) {
    this.activeSegment = ev.detail.value;
    if (this.activeSegment === 'requests') this.loadPending();
    if (this.activeSegment === 'logs') this.loadLogs();
    if (this.activeSegment === 'preapprovals') this.loadPreApprovals();
    if (this.activeSegment === 'posts') this.loadPosts();
  }

  openPosts(type: 'community' | 'announcements' = 'community') {
    this.selectedPostType = type;
    this.activeSegment = 'posts';
    this.loadPosts();
  }

  onPostTypeChange(ev: any) {
    const next = ev?.detail?.value;
    this.selectedPostType = next === 'announcements' ? 'announcements' : 'community';
  }

  getVisiblePosts(): CommunityPost[] {
    return this.selectedPostType === 'community' ? this.posts : this.announcements;
  }

  getSocietyName(): string {
    return (this.user?.societyName || '').trim() || 'NammaSociety';
  }

  getTowerFlatLine(): string {
    const tower = (this.user?.tower || (this.user as any)?.towerNumber || (this.user as any)?.tower_number || '').toString().trim() || '-';
    const flat = (this.user?.apartmentNumber || (this.user as any)?.flatNumber || (this.user as any)?.flat_number || '').toString().trim() || '-';
    return 'Tower ' + tower + ' | Flat ' + flat;
  }

  private hasSocietyContext(): boolean {
    return !!this.user?.societyName?.trim();
  }

  private buildQuickActions(): Array<{ key: string; label: string; icon: string; color: string; badge?: number }> {
    const roleCategory = this.auth.getRoleCategory();
    const hasSociety = this.hasSocietyContext();
    const actions: Array<{ key: string; label: string; icon: string; color: string; badge?: number }> = [];

    if (roleCategory === 'security') {
      actions.push({ key: 'requests', label: 'Guest Management', icon: 'walk-outline', color: 'warning', badge: this.pendingRequests.length || undefined });
      actions.push({ key: 'user-directory', label: 'User Directory', icon: 'people-outline', color: 'primary' });
      actions.push({ key: 'logs', label: 'Logs', icon: 'time-outline', color: 'medium' });
      actions.push({ key: 'preapprovals', label: 'Pre-Approved', icon: 'shield-checkmark-outline', color: 'tertiary' });
      return actions;
    }

    if (roleCategory === 'super-admin') {
      actions.push({ key: 'admin-users', label: 'User Management', icon: 'people-circle-outline', color: 'primary' });
      actions.push({ key: 'audit-logs', label: 'Audit Logs', icon: 'document-text-outline', color: 'secondary' });
      actions.push({ key: 'bulk-upload', label: 'Bulk Upload', icon: 'cloud-upload-outline', color: 'tertiary' });
      actions.push({ key: 'society-management', label: 'Society Management', icon: 'business-outline', color: 'success' });
      actions.push({ key: 'security-users', label: 'Security Users', icon: 'shield-outline', color: 'warning' });
      actions.push({ key: 'settings', label: 'Settings', icon: 'settings-outline', color: 'medium' });
      actions.push({ key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', color: 'warning' });
      actions.push({ key: 'posts', label: 'Posts', icon: 'chatbubbles-outline', color: 'success' });
      return actions;
    }

    if (roleCategory === 'society-admin' && hasSociety) {
      actions.push({ key: 'admin-users', label: 'User Management', icon: 'people-circle-outline', color: 'primary' });
      actions.push({ key: 'bulk-upload', label: 'Bulk Upload', icon: 'cloud-upload-outline', color: 'tertiary' });
      actions.push({ key: 'payments', label: 'Payments', icon: 'card-outline', color: 'success' });
      actions.push({ key: 'maintenance', label: 'Maintenance', icon: 'home-outline', color: 'warning' });
      actions.push({ key: 'security-users', label: 'Security Users', icon: 'shield-outline', color: 'secondary' });
      actions.push({ key: 'requests', label: 'Guest Management', icon: 'walk-outline', color: 'danger', badge: this.pendingRequests.length || undefined });
      actions.push({ key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', color: 'warning' });
      actions.push({ key: 'posts', label: 'Posts', icon: 'chatbubbles-outline', color: 'success' });
      return actions;
    }

    actions.push({ key: 'marketplace', label: 'Market Place', icon: 'storefront-outline', color: 'success' });
    actions.push({ key: 'cr-marketplace', label: 'CR Market Place', icon: 'restaurant-outline', color: 'warning' });
    actions.push({ key: 'amenities', label: 'Amenities', icon: 'fitness-outline', color: 'tertiary' });
    actions.push({ key: 'nobroker', label: 'NoBroker-Internal', icon: 'business-outline', color: 'primary' });
    actions.push({ key: 'orders', label: 'Orders', icon: 'bag-handle-outline', color: 'secondary' });
    actions.push({ key: 'bookings', label: 'Bookings', icon: 'calendar-number-outline', color: 'medium' });
    actions.push({ key: 'requests', label: 'Guest Management', icon: 'walk-outline', color: 'danger', badge: this.pendingRequests.length || undefined });
    actions.push({ key: 'user-directory', label: 'User Directory', icon: 'people-outline', color: 'primary' });
    actions.push({ key: 'announcements', label: 'Announcements', icon: 'megaphone-outline', color: 'warning' });
    actions.push({ key: 'posts', label: 'Posts', icon: 'chatbubbles-outline', color: 'success' });
    if (hasSociety) actions.push({ key: 'preapprovals', label: 'Pre-Approvals', icon: 'shield-checkmark-outline', color: 'tertiary' });

    return actions;
  }

  onQuickAction(actionKey: string) {
    if (actionKey === 'requests') { this.activeSegment = 'requests'; this.loadPending(); return; }
    if (actionKey === 'logs') { this.activeSegment = 'logs'; this.loadLogs(); return; }
    if (actionKey === 'preapprovals') { this.activeSegment = 'preapprovals'; this.loadPreApprovals(); return; }
    if (actionKey === 'preapprove') { this.openPreApprovalForm(); return; }
    if (actionKey === 'posts') { this.openPosts('community'); return; }
    if (actionKey === 'announcements') { this.openPosts('announcements'); return; }
    if (actionKey === 'refresh') { this.loadSummary(); return; }

    // Amenities: go to overview tab and expand the amenities menu section
    if (actionKey === 'amenities') {
      this.activeSegment = 'overview';
      this.expandedMenuItems.add('amenities');
      return;
    }

    // Web-based features: open web dashboard directly without toast
    if (actionKey === 'marketplace') { this.openWebDashboard('marketplace'); return; }
    if (actionKey === 'cr-marketplace') { this.openWebDashboard('cr-marketplace'); return; }
    if (actionKey === 'nobroker') { this.openWebDashboard('nobroker'); return; }
    if (actionKey === 'orders') { this.openWebDashboard('orders'); return; }
    if (actionKey === 'bookings') { this.openWebDashboard('bookings'); return; }
    if (actionKey === 'user-directory') { this.openWebDashboard('directory'); return; }

    // Admin-only features: open web dashboard directly
    if (actionKey === 'admin-users') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'audit-logs') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'bulk-upload') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'society-management') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'security-users') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'settings') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'payments') { this.openWebDashboard('admin'); return; }
    if (actionKey === 'maintenance') { this.openWebDashboard('admin'); return; }
  }

  /**
   * Open web dashboard in external browser
   */
  private openWebDashboard(section?: string): void {
    const dashboardUrl = 'http://localhost:4203/dashboard-mfe';
    if (typeof window !== 'undefined' && window.open) {
      window.open(dashboardUrl, '_blank');
    }
  }

  getBreadcrumbTrail(): string {
    return this.getSocietyName() + ' / ' + this.auth.getDashboardTitle() + ' / ' + this.auth.getCurrentRoleLabel();
  }

  toggleMenuPanel() {
    this.showMenuPanel = !this.showMenuPanel;
  }

  toggleMenuSection(sectionKey: string) {
    if (this.expandedMenuItems.has(sectionKey)) {
      this.expandedMenuItems.delete(sectionKey);
    } else {
      this.expandedMenuItems.add(sectionKey);
    }
  }

  isMenuSectionExpanded(sectionKey: string): boolean {
    return this.expandedMenuItems.has(sectionKey);
  }

  selectMenuAmenity(amenity: string) {
    this.showMenuPanel = false;
    this.openWebDashboard('amenities');
  }

  selectMenuCategory(categoryKey: string) {
    if (categoryKey === 'community') {
      this.selectedPostType = 'community';
      this.activeSegment = 'posts';
    } else if (categoryKey === 'announcements') {
      this.selectedPostType = 'announcements';
      this.activeSegment = 'posts';
    } else if (categoryKey === 'preapprovals') {
      this.activeSegment = 'preapprovals';
    }
    this.toggleMenuSection('posts');
  }

  viewProfile() {
    this.showMenuPanel = false;
    this.showToast('Profile: ' + (this.user?.username || 'User'), 'primary');
  }

  async resetPassword() {
    const alert = await this.alertCtrl.create({
      header: 'Reset Password',
      message: 'Enter and confirm your new password',
      inputs: [
        { name: 'newPassword', type: 'password', placeholder: 'New password' },
        { name: 'confirmPassword', type: 'password', placeholder: 'Confirm password' }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Update',
          handler: async (data) => {
            const newPassword = (data?.newPassword || '').trim();
            const confirmPassword = (data?.confirmPassword || '').trim();

            if (!newPassword || newPassword.length < 6) {
              this.showToast('Password must be at least 6 characters.', 'warning');
              return false;
            }
            if (newPassword !== confirmPassword) {
              this.showToast('Passwords do not match.', 'warning');
              return false;
            }

            const username = this.user?.username || '';
            if (!username) {
              this.showToast('Unable to identify current user.', 'danger');
              return false;
            }

            const loader = await this.loadingCtrl.create({ message: 'Updating password...' });
            await loader.present();

            this.auth.changePassword(username, newPassword).subscribe({
              next: async () => {
                await loader.dismiss();
                this.showMenuPanel = false;
                this.showToast('Password updated successfully.', 'success');
              },
              error: async () => {
                await loader.dismiss();
                this.showToast('Password update failed.', 'danger');
              }
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  getTypeColor(type: string | undefined): string {
    const t = (type || '').toUpperCase();
    if (t === 'DELIVERY') return 'primary'; if (t === 'CAB') return 'secondary';
    if (t === 'VENDOR') return 'success'; if (t === 'VISITING_HELP') return 'warning';
    return 'medium';
  }

  getTypeIcon(type: string | undefined): string {
    const t = (type || '').toUpperCase();
    if (t === 'DELIVERY') return 'cube-outline'; if (t === 'CAB') return 'car-outline';
    if (t === 'VENDOR') return 'briefcase-outline'; if (t === 'VISITING_HELP') return 'people-outline';
    return 'person-outline';
  }

  getServiceDisplayName(req: ApprovalRequest | null): string {
    if (!req) return 'Visitor';
    const type = (req.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') {
      const service = req.deliveryService === 'Other' ? req.deliveryServiceOther : req.deliveryService;
      const resolved = service?.trim() ? service.trim() : this.inferService(req.purpose || req.visitorName || '');
      return resolved ? 'Delivery - ' + resolved : 'Delivery';
    }
    if (type === 'CAB') {
      const service = req.cabService === 'Other' ? req.cabServiceOther : req.cabService;
      const resolved = service?.trim() ? service.trim() : this.inferService(req.purpose || req.visitorName || '');
      return resolved ? 'Cab - ' + resolved : 'Cab';
    }
    if (type === 'VENDOR') return 'Vendor';
    if (type === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  private inferService(text: string): string {
    const tag = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tag) return tag[1].trim();
    const keywords: Record<string, string> = {
      uber: 'Uber',
      ola: 'Ola',
      rapido: 'Rapido',
      swiggy: 'Swiggy',
      zomato: 'Zomato',
      amazon: 'Amazon',
      flipkart: 'Flipkart',
      bigbasket: 'BigBasket',
      blinkit: 'Blinkit'
    };
    const lower = text.toLowerCase();
    const found = Object.keys(keywords).find((key) => lower.includes(key));
    return found ? keywords[found] : '';
  }

  formatTime(d: string | undefined): string {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  formatPostTime(d: string | undefined): string {
    if (!d) return 'Recently';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return 'Recently';
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getPostAuthor(post: CommunityPost): string {
    return post.authorName || post.createdBy || 'Community';
  }

  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Logout', message: 'Are you sure?',
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Logout', handler: () => { this.auth.logout(); this.router.navigate(['/login'], { replaceUrl: true }); } }]
    });
    await alert.present();
  }

  private async showToast(msg: string, color = 'primary') {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'bottom' });
    await t.present();
  }
}
