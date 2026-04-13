import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import { ApprovalRequest, UserProfile } from './models/approval.model';
import { AuthService } from './services/auth.service';
import { GuestManagementService } from './services/guest-management.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  showResidentApprovalPopup = false;
  residentApprovalQueue: ApprovalRequest[] = [];
  currentResidentApproval: ApprovalRequest | null = null;
  residentPopupFaceCapturePreview = '';
  residentPopupTimer = 120;

  private seenResidentRequestKeys: Set<string> = new Set();
  private pollingInterval: any;
  private popupTimerInterval: any;
  private routerSub?: Subscription;

  constructor(
    private auth: AuthService,
    private guestSvc: GuestManagementService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.pollPendingApprovals());

    this.pollPendingApprovals();
    this.startResidentPopupPolling();
  }

  ngOnDestroy(): void {
    clearInterval(this.pollingInterval);
    clearInterval(this.popupTimerInterval);
    this.routerSub?.unsubscribe();
  }

  private startResidentPopupPolling(): void {
    clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.pollPendingApprovals();
    }, 20000);
  }

  private pollPendingApprovals(): void {
    const user = this.auth.getCurrentUser();
    if (!user || !this.canShowResidentPopup(user)) {
      return;
    }

    const society = (user?.societyName || '').trim();
    const apartmentCandidates = this.getResidentApartmentCandidates(user);
    if (!society || apartmentCandidates.length === 0) {
      return;
    }

    const requests = apartmentCandidates.map((apartmentNumber) =>
      this.guestSvc
        .getPendingRequests(apartmentNumber, society)
        .pipe(catchError(() => of([] as ApprovalRequest[])))
    );

    forkJoin(requests).subscribe({
      next: (resultSets) => {
        const merged = resultSets.reduce((all, current) => all.concat(current || []), [] as ApprovalRequest[]);
        const deduped = this.dedupeApprovalRequests(merged);
        const pending = deduped.filter((r) => (r.status || 'PENDING').toString().trim().toUpperCase() === 'PENDING');
        const newRequests = pending.filter((req) => {
          const key = this.getApprovalRequestKey(req);
          if (!key || this.seenResidentRequestKeys.has(key)) return false;
          this.seenResidentRequestKeys.add(key);
          return true;
        });

        if (newRequests.length > 0) {
          this.residentApprovalQueue.push(...newRequests);
          if (!this.showResidentApprovalPopup) {
            this.showNextResidentApprovalPopup();
          }
        }
      },
      error: () => {}
    });
  }

  private canShowResidentPopup(user: UserProfile): boolean {
    return this.auth.getRoleCategory() === 'society-user';
  }

  private getResidentApartmentCandidates(user: UserProfile): string[] {
    const values = new Set<string>();
    const apartment = (user.apartmentNumber || '').trim();
    const tower = (user.tower || '').trim();
    const flat = this.extractFlatNumber(apartment);

    if (apartment) values.add(apartment);
    if (flat) values.add(flat);
    if (tower && flat) {
      values.add(`${tower}-${flat}`);
      values.add(`${tower}${flat}`);
    }

    return Array.from(values);
  }

  private extractFlatNumber(apartment: string): string {
    const value = (apartment || '').trim();
    if (!value) return '';
    const match = value.match(/(?:^|[-_/\s])([A-Z]?\d{1,5}[A-Z]?)$/i);
    if (match?.[1]) return match[1].trim();
    return value;
  }

  private dedupeApprovalRequests(requests: ApprovalRequest[]): ApprovalRequest[] {
    const seen = new Set<string>();
    const result: ApprovalRequest[] = [];
    for (const request of requests || []) {
      const key = this.getApprovalRequestKey(request);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(request);
    }
    return result;
  }

  private getApprovalRequestKey(req: ApprovalRequest | null): string {
    if (!req) return '';
    if (req.id) return `id:${req.id}`;
    const apt = (req.apartmentNumber || '').trim().toUpperCase();
    const visitor = (req.visitorName || '').trim().toUpperCase();
    const phone = (req.visitorPhone || '').trim();
    const when = (req.requestedAt || req.createdDate || '').trim();
    return `${apt}|${visitor}|${phone}|${when}`;
  }

  private showNextResidentApprovalPopup(): void {
    if (this.residentApprovalQueue.length === 0) {
      this.showResidentApprovalPopup = false;
      this.currentResidentApproval = null;
      this.residentPopupFaceCapturePreview = '';
      clearInterval(this.popupTimerInterval);
      this.residentPopupTimer = 120;
      return;
    }

    this.currentResidentApproval = this.residentApprovalQueue[0];
    this.setResidentFacePreview(this.currentResidentApproval);
    this.showResidentApprovalPopup = true;
    this.startResidentPopupTimer();
  }

  private setResidentFacePreview(req: ApprovalRequest | null): void {
    const raw = (req?.faceCapture || '').trim();
    if (raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://')) {
      this.residentPopupFaceCapturePreview = raw;
      return;
    }
    this.residentPopupFaceCapturePreview = '';
  }

  private startResidentPopupTimer(): void {
    clearInterval(this.popupTimerInterval);
    this.residentPopupTimer = 120;
    this.popupTimerInterval = setInterval(() => {
      this.residentPopupTimer--;
      if (this.residentPopupTimer <= 0) {
        this.closeResidentApprovalPopup();
      }
    }, 1000);
  }

  closeResidentApprovalPopup(): void {
    const currentKey = this.getApprovalRequestKey(this.currentResidentApproval);
    this.residentApprovalQueue = this.residentApprovalQueue.filter((req) => this.getApprovalRequestKey(req) !== currentKey);
    clearInterval(this.popupTimerInterval);
    this.residentPopupTimer = 120;
    this.showNextResidentApprovalPopup();
  }

  async onApproveResidentPopup(): Promise<void> {
    if (!this.currentResidentApproval?.id) return;
    const loader = await this.loadingCtrl.create({ message: 'Approving...' });
    await loader.present();

    const user = this.auth.getCurrentUser();
    const responder = user?.username || user?.fullName || 'Resident';
    this.guestSvc.approveRequest(this.currentResidentApproval.id, responder).subscribe({
      next: async () => {
        await loader.dismiss();
        this.closeResidentApprovalPopup();
        this.showToast('Visitor approved.', 'success');
      },
      error: async (err) => {
        await loader.dismiss();
        const reason = err?.error?.error || err?.error?.message || err?.message || '';
        this.showToast(reason ? `Failed to approve: ${reason}` : 'Failed to approve.', 'danger');
      }
    });
  }

  async onRejectResidentPopup(): Promise<void> {
    if (!this.currentResidentApproval?.id) return;
    const alert = await this.alertCtrl.create({
      header: 'Reject Entry',
      message: 'Reason for rejection (optional):',
      inputs: [{ name: 'note', type: 'text', placeholder: 'Reason...' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          cssClass: 'reject-btn',
          handler: async (data) => {
            const loader = await this.loadingCtrl.create({ message: 'Rejecting...' });
            await loader.present();
            const user = this.auth.getCurrentUser();
            const responder = user?.username || user?.fullName || 'Resident';
            this.guestSvc.rejectRequest(this.currentResidentApproval!.id!, responder, data?.note).subscribe({
              next: async () => {
                await loader.dismiss();
                this.closeResidentApprovalPopup();
                this.showToast('Entry rejected.', 'warning');
              },
              error: async (err) => {
                await loader.dismiss();
                const reason = err?.error?.error || err?.error?.message || err?.message || '';
                this.showToast(reason ? `Failed to reject: ${reason}` : 'Failed to reject.', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  canShowFaceCaptureImage(faceCapture?: string): boolean {
    const raw = (faceCapture || '').trim().toLowerCase();
    return raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://');
  }

  getPendingQueueCount(): number {
    return Math.max(0, this.residentApprovalQueue.length - 1);
  }

  getVisitorTypeLabel(type?: string): string {
    const value = (type || '').toUpperCase();
    if (value === 'DELIVERY') return 'Delivery';
    if (value === 'CAB') return 'Cab';
    if (value === 'VENDOR') return 'Vendor';
    if (value === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  getVibgyorClass(type?: string): string {
    const value = (type || '').toUpperCase();
    if (value === 'DELIVERY') return 'type-delivery';
    if (value === 'CAB') return 'type-cab';
    if (value === 'VENDOR') return 'type-vendor';
    if (value === 'VISITING_HELP') return 'type-help';
    return 'type-guest';
  }

  getServiceColorClass(request: ApprovalRequest | null): string {
    const type = (request?.visitorType || '').toUpperCase();
    if (type === 'DELIVERY') return 'popup-header-blue';
    if (type === 'CAB') return 'popup-header-indigo';
    if (type === 'VENDOR') return 'popup-header-green';
    if (type === 'VISITING_HELP') return 'popup-header-yellow';
    return 'popup-header-violet';
  }

  getServicePersonName(request: ApprovalRequest | null): string {
    return (request?.visitorName || '').trim() || 'Unknown Visitor';
  }

  getVisitorSubTypeDisplay(request: ApprovalRequest | null): string {
    if (!request) return '-';
    const explicitSubType = (request.serviceSubCategory || '').trim();
    if (explicitSubType) return explicitSubType;

    const selected = this.getSelectedServiceName(request);
    if (selected) return selected;

    const inferred = this.inferServiceFromText(request.purpose || request.visitorName || '');
    return inferred || '-';
  }

  getServiceDisplayName(request: ApprovalRequest | null): string {
    if (!request) return 'Visitor';
    const typeLabel = this.getVisitorTypeLabel(request.visitorType);
    const subType = this.getVisitorSubTypeDisplay(request);
    return subType !== '-' ? `${typeLabel} - ${subType}` : typeLabel;
  }

  getVendorLogo(request: ApprovalRequest | null): string {
    if (!request) return '👤';
    const name = (request.visitorName || '').toLowerCase();
    const type = (request.visitorType || '').toLowerCase();

    if (name.includes('swiggy')) return '🍔';
    if (name.includes('zomato')) return '🍕';
    if (name.includes('uber')) return '🚗';
    if (name.includes('ola')) return '🚕';
    if (name.includes('rapido')) return '🏍️';
    if (name.includes('amazon')) return '📦';
    if (name.includes('flipkart')) return '🛍️';
    if (name.includes('bigbasket') || name.includes('big basket')) return '🥬';
    if (name.includes('blinkit')) return '⚡';

    if (type.includes('delivery')) return '📬';
    if (type.includes('cab')) return '🚖';
    if (type.includes('vendor')) return '👷';
    if (type.includes('help')) return '🧹';
    return '👤';
  }

  private getSelectedServiceName(request: ApprovalRequest): string {
    const visitorType = (request?.visitorType || '').toUpperCase();
    if (visitorType === 'DELIVERY') {
      const delivery = request.deliveryService === 'Other' ? request.deliveryServiceOther : request.deliveryService;
      return (delivery || '').trim();
    }
    if (visitorType === 'CAB') {
      const cab = request.cabService === 'Other' ? request.cabServiceOther : request.cabService;
      return (cab || '').trim();
    }
    return '';
  }

  private inferServiceFromText(text: string): string {
    const tag = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tag?.[1]) return tag[1].trim();

    const value = (text || '').toLowerCase();
    if (value.includes('uber')) return 'Uber';
    if (value.includes('ola')) return 'Ola';
    if (value.includes('rapido')) return 'Rapido';
    if (value.includes('swiggy')) return 'Swiggy';
    if (value.includes('zomato')) return 'Zomato';
    if (value.includes('amazon')) return 'Amazon';
    if (value.includes('flipkart')) return 'Flipkart';
    if (value.includes('bigbasket')) return 'BigBasket';
    if (value.includes('blinkit')) return 'Blinkit';
    return '';
  }

  private async showToast(message: string, color = 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
