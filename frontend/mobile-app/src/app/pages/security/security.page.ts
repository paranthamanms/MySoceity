import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { GuestManagementService } from '../../services/guest-management.service';
import { ApprovalRequest, ApprovalLog, PreApproval, UserProfile } from '../../models/approval.model';

@Component({
  selector: 'app-security',
  templateUrl: './security.page.html',
  styleUrls: ['./security.page.scss'],
  standalone: false
})
export class SecurityPage implements OnInit {
  user: UserProfile | null = null;
  activeSegment: 'pending' | 'logs' | 'preapprovals' = 'pending';
  pendingRequests: ApprovalRequest[] = [];
  approvalLogs: ApprovalLog[] = [];
  preApprovals: PreApproval[] = [];
  selectedRequest: ApprovalRequest | null = null;
  showApprovalModal = false;
  popupTimer = 0;
  private popupInterval: any;
  showNewRequestForm = false;
  newRequest: Partial<ApprovalRequest> = {};
  deliveryServices = ['Swiggy', 'Zomato', 'Amazon', 'Flipkart', 'BigBasket', 'Blinkit', 'Other'];
  cabServices = ['Ola', 'Uber', 'Rapido', 'Other'];
  visitorTypes = ['Guest', 'Delivery', 'Cab', 'Vendor', 'Visiting Help'];
  showMenuPanel = false;
  currentSocietyScannerCode = '';
  scannerCodeUpdatedAt = 0;
  visitorEntryUrl = '';
  visitorEntryQrUrl = '';

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
    if (!this.auth.isSecurityGuard()) { this.router.navigate(['/community'], { replaceUrl: true }); return; }
    this.loadSocietyScannerCode();
    this.loadPendingRequests();
  }

  ionViewWillEnter() { this.loadPendingRequests(); }

  loadPendingRequests() {
    const society = this.user?.societyName || '';
    this.guestSvc.getAllPendingForSociety(society).subscribe({ next: (r) => { this.pendingRequests = r; }, error: () => {} });
  }

  loadSocietyScannerCode() {
    const society = this.user?.societyName || '';
    if (!society) return;
    this.guestSvc.getSocietyScannerCode(society).subscribe({
      next: (res) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.visitorEntryUrl = this.buildVisitorEntryUrl();
        this.visitorEntryQrUrl = this.buildVisitorEntryQrUrl();
      },
      error: () => {
        this.currentSocietyScannerCode = '';
        this.visitorEntryUrl = '';
        this.visitorEntryQrUrl = '';
      }
    });
  }

  private buildVisitorEntryUrl(): string {
    const society = (this.user?.societyName || '').trim();
    const scannerCode = (this.currentSocietyScannerCode || '').trim();
    if (!society || !scannerCode) return '';
    return `http://localhost:4203/visitor-entry?societyName=${encodeURIComponent(society)}&scannerCode=${encodeURIComponent(scannerCode)}`;
  }

  private buildVisitorEntryQrUrl(): string {
    if (!this.visitorEntryUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(this.visitorEntryUrl)}`;
  }

  copyVisitorEntryLink() {
    if (!this.visitorEntryUrl || !navigator.clipboard) return;
    navigator.clipboard.writeText(this.visitorEntryUrl);
    this.showToast('Visitor entry link copied.', 'success');
  }

  loadLogs() {
    const society = this.user?.societyName || '';
    this.guestSvc.getApprovalLogs(society).subscribe({ next: (l) => { this.approvalLogs = l; }, error: () => {} });
  }

  loadPreApprovals() {
    const society = this.user?.societyName || '';
    this.guestSvc.getActivePreApprovals(null, society).subscribe({ next: (p) => { this.preApprovals = p; }, error: () => {} });
  }

  onSegmentChange(ev: any) {
    this.activeSegment = ev.detail.value;
    if (this.activeSegment === 'pending') this.loadSocietyScannerCode();
    if (this.activeSegment === 'logs') this.loadLogs();
    if (this.activeSegment === 'preapprovals') this.loadPreApprovals();
  }

  openApprovalModal(req: ApprovalRequest) {
    this.selectedRequest = req;
    this.showApprovalModal = true;
    this.startPopupTimer();
  }

  closeApprovalModal() {
    this.showApprovalModal = false;
    this.selectedRequest = null;
    clearInterval(this.popupInterval);
    this.popupTimer = 0;
  }

  private startPopupTimer() {
    this.popupTimer = 120;
    clearInterval(this.popupInterval);
    this.popupInterval = setInterval(() => { this.popupTimer--; if (this.popupTimer <= 0) { clearInterval(this.popupInterval); this.closeApprovalModal(); } }, 1000);
  }

  async onApprove() {
    if (!this.selectedRequest?.id) return;
    const loader = await this.loadingCtrl.create({ message: 'Approving...' });
    await loader.present();
    const guardName = this.user?.fullName || this.user?.username || 'Security';
    this.guestSvc.approveRequest(this.selectedRequest.id, guardName).subscribe({
      next: async () => { await loader.dismiss(); this.closeApprovalModal(); this.showToast('Visitor approved.', 'success'); this.loadPendingRequests(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to approve.', 'danger'); }
    });
  }

  async onReject() {
    if (!this.selectedRequest?.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Reject Entry',
      message: 'Reason for rejection (optional):',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Reject', cssClass: 'reject-btn', handler: async (data) => {
          const loader = await this.loadingCtrl.create({ message: 'Rejecting...' });
          await loader.present();
          const guardName = this.user?.fullName || this.user?.username || 'Security';
          this.guestSvc.rejectRequest(this.selectedRequest!.id!, guardName, data.note).subscribe({
            next: async () => { await loader.dismiss(); this.closeApprovalModal(); this.showToast('Entry rejected.', 'warning'); this.loadPendingRequests(); },
            error: async () => { await loader.dismiss(); this.showToast('Failed to reject.', 'danger'); }
          });
        }}
      ]
    });
    await alert.present();
  }

  openNewRequestForm() {
    this.newRequest = {
      societyName: this.user?.societyName || '',
      requestedBy: this.user?.fullName || this.user?.username || 'Security',
      visitorType: 'Guest',
      scannerCode: this.currentSocietyScannerCode,
      scannerSource: 'MANUAL_SECURITY'
    };
    this.showNewRequestForm = true;
  }

  onNewRequestPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.newRequest.faceCapture = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  canShowFaceCaptureImage(faceCapture?: string): boolean {
    const raw = (faceCapture || '').trim().toLowerCase();
    return raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://');
  }

  async submitNewRequest() {
    if (!this.newRequest.visitorName || !this.newRequest.apartmentNumber) { this.showToast('Visitor name and apartment are required.', 'warning'); return; }
    const payload: ApprovalRequest = { ...this.newRequest as ApprovalRequest, status: 'PENDING' };
    if (this.newRequest.visitorType === 'Cab' && this.newRequest.cabService)
      payload.purpose = ('[Service: ' + this.newRequest.cabService + '] ' + (this.newRequest.purpose || '')).trim();
    else if (this.newRequest.visitorType === 'Delivery' && this.newRequest.deliveryService)
      payload.purpose = ('[Service: ' + this.newRequest.deliveryService + '] ' + (this.newRequest.purpose || '')).trim();
    const loader = await this.loadingCtrl.create({ message: 'Submitting...' });
    await loader.present();
    this.guestSvc.createApprovalRequest(payload).subscribe({
      next: async () => { await loader.dismiss(); this.showNewRequestForm = false; this.showToast('Request created.', 'success'); this.loadPendingRequests(); },
      error: async () => { await loader.dismiss(); this.showToast('Failed to submit.', 'danger'); }
    });
  }

  getServiceDisplayName(req: ApprovalRequest | null): string {
    if (!req) return 'Visitor';
    const type = (req.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') { const s = req.deliveryService === 'Other' ? req.deliveryServiceOther : req.deliveryService; const r = (s?.trim()) ? s.trim() : this.inferService(req.purpose || req.visitorName || ''); return r ? ('Delivery - ' + r) : 'Delivery'; }
    if (type === 'CAB') { const s = req.cabService === 'Other' ? req.cabServiceOther : req.cabService; const r = (s?.trim()) ? s.trim() : this.inferService(req.purpose || req.visitorName || ''); return r ? ('Cab - ' + r) : 'Cab'; }
    if (type === 'VENDOR') return 'Vendor';
    if (type === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  private inferService(text: string): string {
    const tag = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tag) return tag[1].trim();
    const kw: Record<string, string> = { uber: 'Uber', ola: 'Ola', rapido: 'Rapido', swiggy: 'Swiggy', zomato: 'Zomato', amazon: 'Amazon', flipkart: 'Flipkart', bigbasket: 'BigBasket', blinkit: 'Blinkit' };
    const lower = text.toLowerCase();
    const found = Object.keys(kw).find(k => lower.includes(k));
    return found ? kw[found] : '';
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

  formatTime(d: string | undefined): string {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN') + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getSocietyName(): string {
    return this.user?.societyName || 'NammaSociety';
  }

  getTowerFlatLine(): string {
    const tower = (this.user?.tower || (this.user as any)?.towerNumber || (this.user as any)?.tower_number || '').toString().trim() || '-';
    const flat = (this.user?.apartmentNumber || (this.user as any)?.flatNumber || (this.user as any)?.flat_number || '').toString().trim() || '-';
    return 'Tower ' + tower + ' | Flat ' + flat;
  }

  getBreadcrumbTrail(): string {
    return this.getSocietyName() + ' / ' + this.auth.getDashboardTitle() + ' / ' + this.auth.getCurrentRoleLabel();
  }

  toggleMenuPanel() {
    this.showMenuPanel = !this.showMenuPanel;
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
