import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PaymentNotificationService } from '../../services/payment-notification.service';
import { GuestManagementService } from '../../services/guest-management.service';
import { ApprovalRequest, ApprovalLog, PreApproval } from '../../models/approval.model';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private pendingLaunchTarget: string | null = null;
  private readonly inviteTemplateStorageKey: string = 'bulkInviteTemplateConfig';
  private readonly defaultInviteMessageTemplate: string = 'Hi {{name}},\n\nYou are invited to join MySociety on NammaSociety.\n\nDownload the app:\nAndroid: {{androidLink}}\niOS: {{iosLink}}\n\nRegards,\n{{senderName}}';

  // Popup timer for alarm
  popupTimer: number = 0;

  // CR Product categories
  crProductCategories: string[] = ['Food', 'Grocery', 'Electronics', 'Clothing', 'Other'];

  // Towers for property selection
  availableTowersProperty: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

  // Slot type selection
  selectedSlotType: string = 'full';

  // Template utility methods for compact approval popup
  getServiceColorClass(request: ApprovalRequest | null): string {
    const visitorType = (request?.visitorType || '').toUpperCase();
    if (visitorType === 'DELIVERY') return 'popup-header-blue';
    if (visitorType === 'CAB') return 'popup-header-indigo';
    if (visitorType === 'VENDOR') return 'popup-header-green';
    if (visitorType === 'VISITING_HELP') return 'popup-header-yellow';
    return 'popup-header-violet';
  }

  getVibgyorClass(type: string | undefined): string {
    const visitorType = (type || '').toUpperCase();
    if (visitorType === 'DELIVERY') return 'type-delivery';
    if (visitorType === 'CAB') return 'type-cab';
    if (visitorType === 'VENDOR') return 'type-vendor';
    if (visitorType === 'VISITING_HELP') return 'type-help';
    return 'type-guest';
  }

  getVisitorTypeLabel(type: string | undefined): string {
    const visitorType = (type || '').toUpperCase();
    if (visitorType === 'DELIVERY') return 'Delivery';
    if (visitorType === 'CAB') return 'Cab';
    if (visitorType === 'VENDOR') return 'Vendor';
    if (visitorType === 'VISITING_HELP') return 'Visiting Help';
    return 'Guest';
  }

  getVisitorSubTypeDisplay(request: ApprovalRequest | ApprovalLog | null): string {
    if (!request) return '-';
    const subType = this.resolveVisitorSubType(request);
    return subType && subType.trim() ? subType.trim() : '-';
  }

  getServiceDisplayName(request: ApprovalRequest | ApprovalLog | null): string {
    if (!request) return 'Visitor';
    const typeLabel = this.getVisitorTypeLabel(request.visitorType);
    const subType = this.getVisitorSubTypeDisplay(request);
    return subType !== '-' ? `${typeLabel} - ${subType}` : typeLabel;
  }

  getServicePersonName(request: ApprovalRequest | ApprovalLog | null): string {
    if (!request) return '-';
    const name = request.visitorName || '';
    return name.trim() || 'Unknown Visitor';
  }

  private inferServiceFromText(text: string): string {
    const tagMatch = /\[service:\s*([^\]]+)\]/i.exec(text);
    if (tagMatch && tagMatch[1]) {
      return tagMatch[1].trim();
    }

    const value = text.toLowerCase();
    if (value.includes('uber')) return 'Uber';
    if (value.includes('ola')) return 'Ola';
    if (value.includes('rapido')) return 'Rapido';
    if (value.includes('swiggy')) return 'Swiggy';
    if (value.includes('zomato')) return 'Zomato';
    if (value.includes('amazon')) return 'Amazon';
    if (value.includes('flipkart')) return 'Flipkart';
    return '';
  }

  private getSelectedServiceName(request: any): string {
    const visitorType = (request?.visitorType || '').toUpperCase();
    if (visitorType === 'DELIVERY') {
      const deliveryService = request?.deliveryService === 'Other'
        ? request?.deliveryServiceOther
        : request?.deliveryService;
      return (deliveryService || '').trim();
    }
    if (visitorType === 'CAB') {
      const cabService = request?.cabService === 'Other'
        ? request?.cabServiceOther
        : request?.cabService;
      return (cabService || '').trim();
    }
    return '';
  }

  private resolveVisitorSubType(request: ApprovalRequest | ApprovalLog): string {
    const explicitSubType = (request.serviceSubCategory || '').trim();
    if (explicitSubType) {
      return explicitSubType;
    }

    const selectedService = this.getSelectedServiceName(request);
    if (selectedService) {
      return selectedService;
    }

    const purpose = 'purpose' in request ? (request as ApprovalRequest).purpose : '';
    return this.inferServiceFromText(request.visitorName || purpose || '');
  }

  // Maintenance Payment Data - will be loaded from backend
  maintenanceQuarters: any[] = [];

  // Admin consolidated payments data
  adminConsolidatedPayments: Map<string, any> = new Map();

  // Admin User & Panel Data
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

  // Admin Overview Stats
  totalUsers: number = 0;
  activeUsers: number = 0;
  communityCount: number = 12;
  isLoadingStats: boolean = false;

  // Recent Users - will be populated from backend
  recentUsers: any[] = [];
  recentSocieties: any[] = [];

  // Admin Settings
  defaultAdminPassword: string = 'admin@123';
  passwordExpiryDays: number = 90;
  allowPublicRegistration: boolean = true;
  enableAuditLogging: boolean = true;
  auditLogRetentionDays: number = 15;

  // Maintenance Payment Data for Admin
  maintenancePayments: any[] = [];
  maintenanceQuarterTotals: Map<string, { expected: number; collected: number; pending: number }> = new Map();
  totalCollectionsExpected: number = 0;
  totalCollected: number = 0;
  totalPending: number = 0;
  maintenanceSearchQuery: string = '';

  // Admin User Creation
  newAdminSociety: string = '';
  newAdminUsername: string = '';
  newAdminEmail: string = '';
  newAdminPassword: string = '';
  newAdminConfirmPassword: string = '';
  newAdminUserType: string = 'admin'; // admin or superadmin
  adminCreateSuccess: string = '';
  adminCreateError: string = '';
  existingAdmins: any[] = [];
  
  // Security User Creation
  newSecurityUsername: string = '';
  newSecurityEmail: string = '';
  newSecurityPassword: string = '';
  newSecurityConfirmPassword: string = '';
  newSecurityFullName: string = '';
  newSecurityPhone: string = '';
  newSecuritySociety: string = ''; // Selected society for this security guard
  securityCreateSuccess: string = '';
  securityCreateError: string = '';
  existingSecurityUsers: any[] = [];
  availableSocietiesForSecurity: string[] = []; // List of societies for dropdown
  
  // Society Management
  societies: any[] = [];
  newSociety = {
    name: '',
    street: '',
    area: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  };
  societyCreateSuccess: string = '';
  societyCreateError: string = '';
    // Security Exchanges
    securityExchanges: any[] = [];
    filteredSecurityExchanges: any[] = [];

    // Amenities Modal
    showAmenitiesModal: boolean = false;
    selectedAmenity: any = null;

    // Real Estate Modal
    realEstateType: string = '';
    showRealEstateModal: boolean = false;
    propertySubmitMessage: string = '';
    selectedTower: string = '';
    selectedBHK: string = '';
    propertyFormData: any = {
      bhk: '',
      area: '',
      price: '',
      location: '',
      description: '',
      amenities: {
        parking: false,
        balcony: false,
        gym: false,
        pool: false,
        kitchen: false
      },
      locationType: '',
      listingType: '',
      propertyType: ''
    };
    isSubmittingProperty: boolean = false;
    allPropertyListings: any[] = [];

    // Complaint Modal
    showComplaintModal: boolean = false;
    complaintFormData: any = {
      title: '',
      description: '',
      category: '',
      reporterName: '',
      files: []
    };
    complaintFile: any = null;
    complaintSubmitMessage: string = '';
    isSubmittingComplaint: boolean = false;

    // Community Post Modal
    showCommunityPostModal: boolean = false;
    postFormData: any = {
      title: '',
      content: '',
      category: '',
      reporterName: '',
      sendEmail: false,
      sendSMS: false,
      attachment: ''
    };
    postFile: any = null;
    postSubmitMessage: string = '';
    isSubmittingPost: boolean = false;

    // Security Exchange Modal
    showSecurityExchangeModal: boolean = false;

    // Real Estate Listings
    realEstateListings: any[] = [];

    // Profile Menu
    isProfileMenuOpen: boolean = false;
    // CR Marketplace Modal
    crMarketplaceView: string = 'buyer';
    showCRMarketplaceModal: boolean = false;

    // CR Products
    crProducts: any[] = [];
    filteredCRProducts: any[] = [];
    selectedCRProduct: any = null;
    showProductDetailModal: boolean = false;

    // CR Cart
    crCart: any[] = [];

    // CR Product Form
    crProductForm: any = {
      productName: '',
      price: 0,
      stock: 0,
      category: '',
      description: '',
      image: ''
    };
    crProductSubmitMessage: string = '';
    isSubmittingCRProduct: boolean = false;
    // CR Orders
    crOrders: any[] = [];

    // Amenities
    amenities: any[] = [];

    // Announcements
    announcements: any[] = [];

    // Complaints
    complaints: any[] = [];

    // Community Posts
    communityPosts: any[] = [];
  // User data
  user: any = null;
  userSocieties: string[] = [];
  currentSociety: string = '';

  // RxJS destroy subject for unsubscribing
  destroy$: Subject<void> = new Subject<void>();

  // Search and filtering properties
  searchQuery: string = '';
  filteredAnnouncements: any[] = [];
  allAnnouncements: any[] = [];
  filteredComplaints: any[] = [];
  allComplaints: any[] = [];
  filteredCommunityPosts: any[] = [];
  allCommunityPosts: any[] = [];
  selectedPostType: string = 'announcements';
  isMenuOpen: boolean = false;
  adminPanelTab: string = '';
  
  // Society Bulk Upload
  bulkSocietyFile: File | null = null;
  isBulkSocietyUploading: boolean = false;
  
  // Global Smart Search with Auto-Complete
  globalSearchQuery: string = '';
  searchResults: any[] = [];
  showSearchResults: boolean = false;
  searchTimeout: any = null;
  bulkSocietyUploadSuccess: string = '';
  bulkSocietyUploadError: string = '';
  bulkSocietyDragOver: boolean = false;
  
  // Society Announcements (Society Admin)
  societyAnnouncements: any[] = [];
  loadingAnnouncements = false;
  newAnnouncement = {
    title: '',
    content: '',
    priority: 'medium',
    sendEmail: true,
    sendSMS: false
  };
  announcementCreateSuccess: string = '';
  announcementCreateError: string = '';
  
  // Guest Management System
  showGuestManagementModal: boolean = false;
  guestManagementTab: string = 'pre-approval'; // 'pre-approval', 'pending-requests', 'approval-logs'
  
  // Pre-Approvals
  preApprovals: PreApproval[] = [];
  newPreApproval: PreApproval = {
    apartmentNumber: '',
    societyName: '',
    visitorType: '',
    visitorName: '',
    visitorPhone: '',
    validFrom: '',
    validUntil: '',
    description: '',
    createdBy: ''
  };
  preApprovalSubmitMessage: string = '';
  isSubmittingPreApproval: boolean = false;
  
  // Approval Requests
  pendingApprovalRequests: ApprovalRequest[] = [];
  allApprovalRequests: ApprovalRequest[] = [];
  newApprovalRequest: any = {
    apartmentNumber: '',
    societyName: '',
    tower: '',
    visitorType: 'GUEST',
    serviceSubCategory: '',
    visitorName: '',
    visitorPhone: '',
    visitorAadhaar: '',
    visitorIdProof: '',
    ownerName: '',
    ownerPhone: '',
    faceCapture: '',
    scannerCode: '',
    scannerSource: 'MANUAL',
    scannerPayload: '',
    purpose: '',
    requestedBy: '',
    residentPhone: ''
  };
  currentSocietyScannerCode: string = '';
  scannerCodeUpdatedAt: number = 0;
  currentVisitorEntryUrl: string = '';
  visitorEntryPublicBaseUrl: string = '';
  approvalCameraError: string = '';
  isApprovalCameraOpen: boolean = false;
  isApprovalCameraSupported: boolean = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  private approvalCameraStream: MediaStream | null = null;
  showAdvancedScannerPayload: boolean = false;
  approvalRequestSubmitMessage: string = '';
  isSubmittingApprovalRequest: boolean = false;
  
  // Approval Logs
  approvalLogs: ApprovalLog[] = [];
  activeVisitors: ApprovalLog[] = [];
  filteredApprovalLogs: ApprovalLog[] = [];
  exitScannerPayload: string = '';
  selectedExitLogId: number | null = null;
  selectedExitVisitorName: string = '';
  selectedExitEntryFaceCapture: string = '';
  exitFaceCapture: string = '';
  exitMatchConfidence: number | null = null;
  showExitQrForLogId: number | null = null;
  exitCameraError: string = '';
  isExitCameraOpen: boolean = false;
  isExitCameraSupported: boolean = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  private exitCameraStream: MediaStream | null = null;

  /**
   * Robustly filter approval logs for security users by societyName (case-insensitive, trimmed)
   */
  filterApprovalLogsBySociety(): void {
    if (this.isSecurityGuard() && this.user && this.user.societyName) {
      const societyName = this.user.societyName.trim().toLowerCase();
      this.filteredApprovalLogs = this.approvalLogs.filter(log =>
        typeof log.societyName === 'string' && log.societyName.trim().toLowerCase() === societyName
      );
    } else {
      this.filteredApprovalLogs = [...this.approvalLogs];
    }
  }
  approvalLogSearchQuery: string = '';
  
  // Approval Requests search/filter (allApprovalRequests already declared above)
  filteredApprovalRequests: ApprovalRequest[] = [];
  approvalRequestSearchQuery: string = '';
  
  // Unread counts
  unreadApprovalsCount: number = 0;
  
  filterTower: string = ''; // Empty = show all towers
  filterStatus: string = '';
  
  // Default tower list (configurable per society in future)
  availableTowers: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];

  // Pop-up Notification System for Security Requests
  showApprovalPopup: boolean = false;
  currentApprovalRequest: ApprovalRequest | null = null;
  popupFaceCapturePreview: string = '';
  private popupFaceCaptureCache: Map<number, string> = new Map<number, string>();
  popupRequestQueue: ApprovalRequest[] = [];
  pollingInterval: any = null;
  lastCheckedRequestId: number = 0;
  
  // Vendor Logo Mappings (for common vendors)
  vendorLogos: { [key: string]: string } = {
    'swiggy': '🍔',
    'zomato': '🍕',
    'uber': '🚗',
    'ola': '🚕',
    'rapido': '🏍️',
    'amazon': '📦',
    'flipkart': '🛍️',
    'bigbasket': '🥬',
    'blinkit': '⚡',
    'zepto': '⏰',
    'dunzo': '🎒',
    'porter': '🚚',
    'doordash': '🚪',
    'default_delivery': '📬',
    'default_guest': '👤',
    'default_cab': '🚖',
    'default_vendor': '👷',
    'default_help': '🧹'
  };

  // User Directory (for Normal Society Users)
  showUserDirectory: boolean = false;
  societyUsers: any[] = [];
  filteredSocietyUsers: any[] = [];
  userDirectoryTowers: string[] = [];
  selectedDirectoryTower: string = '';
  userDirectorySearchQuery: string = '';
  isLoadingDirectory: boolean = false;

  // Complaint Detail & Response (Society Admin)
  showComplaintDetail: boolean = false;
  selectedComplaint: any = null;
  complaintComments: any[] = [];
  newComplaintResponse: any = {
    commentText: '',
    authorRole: '',
    isResolution: false
  };
  isSubmittingResponse: boolean = false;
  isLoadingComments: boolean = false;
  responseSubmitMessage: string = '';
  updatingComplaintStatus: boolean = false;

  // Announcement Notifications (for Normal Users)
  unreadAnnouncementsCount: number = 0;
  showAnnouncementNotifications: boolean = false;
  recentAnnouncements: any[] = [];
  lastAnnouncementCheck: number = 0;
  currentLanguage: string = 'EN';
  languages: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private paymentNotificationService: PaymentNotificationService,
    private guestManagementService: GuestManagementService,
    private elementRef: ElementRef,
    private activatedRoute: ActivatedRoute,
    private languageService: LanguageService
  ) { }

  ngOnInit(): void {
    console.log('DashboardComponent.ngOnInit() called');
    this.languages = this.languageService.getLanguages();
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lang) => {
        this.currentLanguage = lang;
      });
    this.visitorEntryPublicBaseUrl = (localStorage.getItem('visitorEntryPublicBaseUrl') || '').trim();
    this.loadInviteTemplateConfig();
    this.loadUserData();
    this.applyPendingLaunchTarget();
    this.loadAdminStats();
    this.loadPaymentData();
    this.loadAdminConsolidatedPayments();
    this.loadMaintenancePayments();
    this.loadRecentAnnouncements();
    this.loadAmenities();
    // Subscribe to payment data updates from admin panel
    console.log('Subscribing to payment data updates...');
    this.paymentNotificationService.paymentDataUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('✓ Payment data updated notification received from admin panel!');
        console.log('✓ Reloading payment data...');
        this.loadPaymentData();
        this.loadAdminConsolidatedPayments();
        this.loadMaintenancePayments();
      });
    console.log('✓ Subscription to payment data updates established');
    // Start approval request polling with a longer interval to reduce UI jitter.
    setTimeout(() => {
      if (this.user && !this.isAdminUser() && !this.isSecurityGuard()) {
        this.startApprovalRequestPolling();
      }
    }, 2000);
  }

  setLanguage(code: string): void {
    this.languageService.setLanguage(code);
    this.currentLanguage = code;
  }

  translate(key: string, fallback: string): string {
    const value = this.languageService.translate(key);
    if (value && value !== key) {
      return value;
    }
    return this.translateDashboardFallback(key, fallback);
  }

  private translateDashboardFallback(key: string, fallback: string): string {
    const lang = (this.currentLanguage || 'EN').toUpperCase();
    const map: { [code: string]: { [labelKey: string]: string } } = {
      EN: {
        'dashboard.dashboard_view': 'Dashboard View',
        'dashboard.user_management': 'User Management',
        'dashboard.audit_logs': 'Audit Logs',
        'dashboard.bulk_user_upload': 'Bulk User Upload',
        'dashboard.payment_management': 'Payment Management',
        'dashboard.maintenance_payment': 'Maintenance Payment',
        'dashboard.society_announcements': 'Society Announcements',
        'dashboard.admin_users': 'Admin Users',
        'dashboard.security_users': 'Security Users',
        'dashboard.society_management': 'Society Management',
        'dashboard.settings': 'Settings',
        'dashboard.quick_access': 'Quick Access',
        'dashboard.user_directory': 'User Directory',
        'dashboard.global_players': 'Global Players',
        'dashboard.cr_marketplace': 'CR Market Place',
        'dashboard.amenities': 'Amenities',
        'dashboard.nobroker_internal': 'NoBroker-Internal',
        'dashboard.bookings': 'Bookings'
      },
      HI: {
        'dashboard.dashboard_view': 'डैशबोर्ड दृश्य',
        'dashboard.user_management': 'उपयोगकर्ता प्रबंधन',
        'dashboard.audit_logs': 'ऑडिट लॉग्स',
        'dashboard.bulk_user_upload': 'बल्क उपयोगकर्ता अपलोड',
        'dashboard.payment_management': 'भुगतान प्रबंधन',
        'dashboard.maintenance_payment': 'मेंटेनेंस भुगतान',
        'dashboard.society_announcements': 'सोसाइटी घोषणाएं',
        'dashboard.admin_users': 'एडमिन उपयोगकर्ता',
        'dashboard.security_users': 'सिक्योरिटी उपयोगकर्ता',
        'dashboard.society_management': 'सोसाइटी प्रबंधन',
        'dashboard.settings': 'सेटिंग्स',
        'dashboard.quick_access': 'त्वरित पहुँच',
        'dashboard.user_directory': 'यूज़र डायरेक्टरी',
        'dashboard.global_players': 'ग्लोबल प्लेयर्स',
        'dashboard.cr_marketplace': 'सीआर मार्केट प्लेस',
        'dashboard.amenities': 'सुविधाएं',
        'dashboard.nobroker_internal': 'नोब्रोकर-इंटरनल',
        'dashboard.bookings': 'बुकिंग्स'
      },
      TA: {
        'dashboard.dashboard_view': 'டாஷ்போர்டு காட்சி',
        'dashboard.user_management': 'பயனர் மேலாண்மை',
        'dashboard.audit_logs': 'ஆடிட் பதிவுகள்',
        'dashboard.bulk_user_upload': 'பயனர் தொகுதி பதிவேற்றம்',
        'dashboard.payment_management': 'கட்டண மேலாண்மை',
        'dashboard.maintenance_payment': 'பராமரிப்பு கட்டணம்',
        'dashboard.society_announcements': 'சொசைட்டி அறிவிப்புகள்',
        'dashboard.admin_users': 'நிர்வாக பயனர்கள்',
        'dashboard.security_users': 'பாதுகாப்பு பயனர்கள்',
        'dashboard.society_management': 'சொசைட்டி மேலாண்மை',
        'dashboard.settings': 'அமைப்புகள்',
        'dashboard.quick_access': 'விரைவு அணுகல்',
        'dashboard.user_directory': 'பயனர் அடைவு',
        'dashboard.global_players': 'உலகளாவிய பிளேயர்கள்',
        'dashboard.cr_marketplace': 'சிஆர் மார்க்கெட் பிளேஸ்',
        'dashboard.amenities': 'வசதிகள்',
        'dashboard.nobroker_internal': 'நோப்ரோக்கர்-இன்டர்னல்',
        'dashboard.bookings': 'முன்பதிவுகள்'
      }
    };

    return map[lang]?.[key] || map['EN'][key] || fallback;
  }

  loadUserData(): void {
    // Dashboard runs on a different origin (port 4203) than login (port 4201).
    // So we must first hydrate user/token from query params passed by login-mfe.
    const userFromQuery = this.activatedRoute.snapshot.queryParamMap.get('user');
    const tokenFromQuery = this.activatedRoute.snapshot.queryParamMap.get('token');
    this.pendingLaunchTarget = this.activatedRoute.snapshot.queryParamMap.get('launchTarget');

    if (userFromQuery) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userFromQuery));
        this.user = parsedUser;
        localStorage.setItem('user', JSON.stringify(parsedUser));
        if (tokenFromQuery) {
          localStorage.setItem('token', decodeURIComponent(tokenFromQuery));
        }

        // Clean URL after consuming auth payload.
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {
        console.error('Failed to parse user from query params. Falling back to localStorage.', e);
      }
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);

      console.log('[Auth Context] Loaded user:', this.user?.username, {
        role: this.user?.role,
        userType: this.user?.userType,
        ownerType: this.user?.ownerType,
        societyName: this.user?.societyName
      });
      
      // Initialize societies list - for now using the current society
      // In a real scenario, this would come from the backend with user's multi-society data
      if (this.user.societyName) {
        this.userSocieties = [this.user.societyName];
        this.currentSociety = this.user.societyName;
      }
      
      // Load society announcements for Society Admins
      if (this.isSocietyAdmin()) {
        this.loadSocietyAnnouncements();
      }
    } else {
      window.location.href = 'http://localhost:4201/login-mfe';
    }
  }

  private applyPendingLaunchTarget(): void {
    if (!this.pendingLaunchTarget) {
      return;
    }

    const launchTarget = this.pendingLaunchTarget;
    this.pendingLaunchTarget = null;

    setTimeout(() => this.launchFeature(launchTarget), 0);
  }

  private launchFeature(target: string): void {
    switch ((target || '').toLowerCase()) {
      case 'marketplace':
        this.navigateToMarketplace();
        return;
      case 'cr-marketplace':
        this.openCRMarketplace();
        return;
      case 'cr-marketplace-orders':
        this.openCRMarketplace();
        this.switchCRView('orders');
        return;
      case 'nobroker':
        this.openRealEstateModal('buy');
        return;
      case 'orders':
        this.router.navigate(['/marketplace'], { queryParams: { view: 'orders' } });
        return;
      case 'bookings':
      case 'amenities':
        this.openAmenitiesModal();
        return;
      case 'directory':
      case 'user-directory':
        this.openUserDirectory();
        return;
      case 'requests':
      case 'guest-management':
        this.openGuestManagementModal();
        return;
      case 'announcements':
        this.selectPostType('announcements');
        return;
      case 'posts':
      case 'community':
        this.selectPostType('community');
        return;
      case 'overview':
        this.selectAdminTab('overview');
        return;
      case 'bulk-invite':
      case 'invites':
        this.selectAdminTab('bulk-invite');
        return;
      case 'users':
      case 'admin-users':
        this.selectAdminTab('users');
        return;
      case 'audit':
      case 'audit-logs':
        this.selectAdminTab('audit');
        return;
      case 'bulk-upload':
        this.selectAdminTab('bulk-upload');
        return;
      case 'payments':
        this.selectAdminTab('payments');
        return;
      case 'maintenance':
        this.selectAdminTab('maintenance');
        return;
      case 'society-announcements':
        this.selectAdminTab('society-announcements');
        return;
      case 'security-users':
        this.selectAdminTab('security-users');
        return;
      case 'societies':
      case 'society-management':
        this.selectAdminTab('societies');
        return;
      case 'settings':
        this.selectAdminTab('settings');
        return;
      default:
        return;
    }
  }

  loadAdminStats(): void {
    this.isLoadingStats = true;
    this.http.get<any>('http://localhost:8002/api/users').subscribe({
      next: (response) => {
        // Handle multiple response formats from backend
        let users = Array.isArray(response) ? response : (response.value || response.users || response || []);
        
        // Filter users by society if society admin
        if (this.isSocietyAdmin() && this.user && this.user.societyName) {
          users = users.filter((u: any) => u.societyName === this.user.societyName);
        }
        
        this.totalUsers = users.length;
        
        // Count active users (users with status 'active' or 'Active')
        this.activeUsers = users.filter((u: any) => {
          const status = u.status || '';
          return status.toLowerCase() === 'active';
        }).length;
        
        // Community count: 1 for society admin, actual count for super admin
        if (this.isSocietyAdmin()) {
          this.communityCount = 1;
        }
        // For super admin, communityCount will be set by loadSocieties()
        
        // Update recent users - get the last 4 users
        this.recentUsers = users.slice(-4).reverse().map((user: any) => ({
          username: user.username,
          userType: this.formatUserType(user.userType),
          registeredDate: user.createdDate ? this.formatDate(user.createdDate) : 'N/A',
          societyName: user.societyName || 'N/A'
        }));
        
        this.isLoadingStats = false;
      },
      error: (error) => {
        console.error('Error loading admin stats:', error);
        this.totalUsers = 0;
        this.activeUsers = 0;
        this.communityCount = 0;
        this.isLoadingStats = false;
      }
    });
  }

  refreshDashboardStats(): void {
    this.loadAdminStats();
  }

  getUniqueSocietiesCount(): number {
    return this.communityCount;
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

  loadPaymentData(): void {
    if (!this.user || !this.user.towerNumber || !this.user.flatNumber) {
      console.warn('User tower/flat information not available', this.user);
      return;
    }

    const towerNumber = this.user.towerNumber;
    const flatNumber = this.user.flatNumber;
    const towerParam = encodeURIComponent(towerNumber);
    const flatParam = encodeURIComponent(flatNumber);

    console.log(`Loading payment data for Tower: ${towerNumber}, Flat: ${flatNumber}`);

    this.http.get<any>(`http://localhost:8002/api/user/payments/tower/${towerParam}/flat/${flatParam}`)
      .subscribe({
        next: (response) => {
          console.log('Payment data response:', response);
          if (response?.success && response?.payments) {
            // Use backend data if available, otherwise keep default
            if (response.payments.length > 0) {
              console.log('Found', response.payments.length, 'payment records');
              this.maintenanceQuarters = response.payments.map((p: any) => ({
                name: p.quarterName,
                period: p.quarterPeriod,
                amount: p.amount,
                dueDate: p.dueDate,
                status: p.status,
                statusText: p.statusText || (p.status === 'paid' ? 'Paid' : 'Due'),
                additionalFields: p.additionalFields || {}
              }));
            } else {
              console.log('No payment records found for this tower/flat');
            }
          }
        },
        error: (error) => {
          console.warn('Failed to load payment data from backend, using default:', error);
          // Keep default payment data if backend call fails
        }
      });
  }

  reloadPaymentData(): void {
    console.log('Reloading payment data...');
    this.loadPaymentData();
  }

  getUserTypeDisplay(): string {
    if (!this.user) return '';
    
    // Check if Super Admin first
    if (this.isSuperAdmin()) {
      return 'Super Admin';
    }
    
    // Check if Society Admin
    if (this.isSocietyAdmin()) {
      return 'Society Admin';
    }
    
    // Regular users
    if (this.user.userType === 'owner') {
      return this.user.ownerType === 'resident' ? 'Resident Owner' : 'Non-Resident Owner';
    } else if (this.user.userType === 'tenant') {
      return 'Tenant';
    }
    
    return this.user.userType;
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    
    if (!query) {
      // If search is empty, show all original data
      this.filteredAnnouncements = [...this.allAnnouncements];
      this.filteredComplaints = [...this.allComplaints];
      this.filteredCommunityPosts = [...this.allCommunityPosts];
      return;
    }
    
    console.log('Searching for:', query);
    
    // Search in announcements
    if (this.selectedPostType === 'announcements') {
      this.filteredAnnouncements = this.allAnnouncements.filter((item: any) => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const contentMatch = (item.content || '').toLowerCase().includes(query);
        const authorMatch = (item.author || item.authorName || '').toLowerCase().includes(query);
        return titleMatch || contentMatch || authorMatch;
      });
    }
    
    // Search in complaints
    if (this.selectedPostType === 'complaints') {
      this.filteredComplaints = this.allComplaints.filter((item: any) => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const categoryMatch = (item.category || '').toLowerCase().includes(query);
        const reporterMatch = (item.reporterName || '').toLowerCase().includes(query);
        return titleMatch || descMatch || categoryMatch || reporterMatch;
      });
    }
    
    // Search in community posts
    if (this.selectedPostType === 'community') {
      this.filteredCommunityPosts = this.allCommunityPosts.filter((item: any) => {
        const titleMatch = (item.title || '').toLowerCase().includes(query);
        const contentMatch = (item.content || '').toLowerCase().includes(query);
        const authorMatch = (item.authorName || item.author || '').toLowerCase().includes(query);
        const categoryMatch = (item.category || '').toLowerCase().includes(query);
        return titleMatch || contentMatch || authorMatch || categoryMatch;
      });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectAdminTab(tab: string): void {
    this.adminPanelTab = tab;
    // Load maintenance payments when switching to that tab
    if (tab === 'maintenance') {
      this.loadMaintenancePayments();
    }
    // Load societies for dropdown when switching to security-users tab
    if (tab === 'security-users') {
      this.loadSocietiesForSecurity();
    }
  }

  // Post filtering methods
  selectPostType(type: string): void {
    this.selectedPostType = type;
    this.filterPostsBySociety();
  }

  filterPostsBySociety(): void {
    const society = this.user?.societyName || '';
    
    // Load announcements from backend
    if (this.selectedPostType === 'announcements') {
      this.http.get<any[]>(`http://localhost:8002/api/posts/announcements?societyName=${encodeURIComponent(society)}`)
        .subscribe({
          next: (data) => {
            this.allAnnouncements = data;
            this.filteredAnnouncements = [...data];
            this.onSearch(); // Apply search filter if any
          },
          error: (error) => {
            console.error('Error loading announcements:', error);
            this.allAnnouncements = [];
            this.filteredAnnouncements = [];
          }
        });
    }
    
    // Load complaints from backend
    if (this.selectedPostType === 'complaints') {
      this.http.get<any[]>(`http://localhost:8002/api/posts/complaints?societyName=${encodeURIComponent(society)}`)
        .subscribe({
          next: (data) => {
            this.allComplaints = data;
            this.filteredComplaints = [...data];
            this.onSearch(); // Apply search filter if any
          },
          error: (error) => {
            console.error('Error loading complaints:', error);
            this.allComplaints = [];
            this.filteredComplaints = [];
          }
        });
    }
    
    // Load community posts from backend
    if (this.selectedPostType === 'community') {
      this.http.get<any[]>(`http://localhost:8002/api/posts/community?societyName=${encodeURIComponent(society)}`)
        .subscribe({
          next: (data) => {
            this.allCommunityPosts = data;
            this.filteredCommunityPosts = [...data];
            this.onSearch(); // Apply search filter if any
          },
          error: (error) => {
            console.error('Error loading community posts:', error);
            this.allCommunityPosts = [];
            this.filteredCommunityPosts = [];
          }
        });
    }

    // Load security exchanges from backend
    if (this.selectedPostType === 'security-exchanges') {
      this.http.get<any[]>(`http://localhost:8002/api/security-exchanges?societyName=${encodeURIComponent(society)}`)
        .subscribe({
          next: (data) => {
            this.securityExchanges = data;
            this.filteredSecurityExchanges = [...data];
            this.onSearch(); // Apply search filter if any
          },
          error: (error) => {
            console.warn('Security exchanges endpoint not available yet, using empty array');
            this.securityExchanges = [];
            this.filteredSecurityExchanges = [];
          }
        });
    }
  }

  // Amenities booking methods
  openAmenitiesModal(): void {
    this.showAmenitiesModal = true;
  }

  closeAmenitiesModal(): void {
    this.showAmenitiesModal = false;
    this.selectedAmenity = null;
  }

  selectAmenity(amenity: any): void {
    this.selectedAmenity = amenity;
  }

  bookAmenity(bookingData: any): void {
    console.log('Booking amenity:', bookingData);
    
    // Create booking via backend API
    const booking = {
      amenityId: bookingData.amenityId || bookingData.id,
      userId: this.user?.id || 1,
      userName: this.user?.username || 'User',
      societyName: this.user?.societyName || '',
      bookingDate: bookingData.date || new Date().toISOString().split('T')[0],
      timeSlot: bookingData.timeSlot || '',
      amount: bookingData.price || 0
    };
    
    this.http.post<any>('http://localhost:8002/api/amenities/book', booking)
      .subscribe({
        next: (response) => {
          console.log('Booking created:', response);
          
          // If payment required, initiate payment gateway
          if (response.amount > 0 && response.paymentStatus === 'PENDING') {
            this.initiateCCAvenuePayment(response);
          } else {
            this.confirmFreeBooking(bookingData);
          }
        },
        error: (error) => {
          console.error('Error creating booking:', error);
          alert('Failed to create booking: ' + (error.error?.error || 'Unknown error'));
        }
      });
  }

  initiateCCAvenuePayment(bookingData: any): void {
    // CCAvenue payment integration
    const paymentData = {
      merchant_id: 'YOUR_MERCHANT_ID',
      order_id: `AMN${Date.now()}`,
      amount: bookingData.price,
      currency: 'INR',
      redirect_url: '/dashboard-mfe/payment-success',
      cancel_url: '/dashboard-mfe/payment-cancel',
      language: 'EN',
      billing_name: this.user?.username || '',
      billing_email: this.user?.email || ''
    };
    
    // TODO: Submit to CCAvenue
    console.log('Initiating CCAvenue payment:', paymentData);
    alert('Payment gateway integration - Amount: ₹' + bookingData.price);
  }

  confirmFreeBooking(bookingData: any): void {
    alert('Booking confirmed for ' + bookingData.amenityName + ' - Free slot');
    this.closeAmenitiesModal();
  }

  // Real Estate marketplace methods
  openRealEstateModal(type: string = 'buysell'): void {
    this.realEstateType = type;
    this.showRealEstateModal = true;
    this.resetPropertyForm();
    this.propertySubmitMessage = '';
    this.loadRealEstateListings();
  }

  closeRealEstateModal(): void {
    this.showRealEstateModal = false;
    this.selectedTower = '';
    this.selectedBHK = '';
    this.resetPropertyForm();
    this.propertySubmitMessage = '';
  }
  
  searchProperties(): void {
    console.log('Searching properties with filters:');
    console.log('- Tower:', this.selectedTower || 'All');
    console.log('- BHK:', this.selectedBHK || 'All');
    console.log('- Type:', this.realEstateType);
    
    // Filter the listings based on selection
    this.filterAndDisplayProperties();
  }

  submitProperty(): void {
    // Validate required fields
    if (!this.propertyFormData.bhk || !this.propertyFormData.area || 
        !this.propertyFormData.price || !this.propertyFormData.location || 
        !this.propertyFormData.description) {
      alert('Please fill all required fields');
      return;
    }

    this.isSubmittingProperty = true;
    this.propertySubmitMessage = '';

    // Prepare the property data
    const amenitiesList = [];
    if (this.propertyFormData.amenities.parking) amenitiesList.push('Parking');
    if (this.propertyFormData.amenities.balcony) amenitiesList.push('Balcony');
    if (this.propertyFormData.amenities.gym) amenitiesList.push('Gym Access');
    if (this.propertyFormData.amenities.pool) amenitiesList.push('Pool Access');
    if (this.propertyFormData.amenities.kitchen) amenitiesList.push('Modular Kitchen');

    const propertyData = {
      id: Date.now(),
      locationType: this.propertyFormData.locationType,
      listingType: this.propertyFormData.listingType,
      propertyType: this.propertyFormData.propertyType,
      bhk: this.propertyFormData.bhk,
      area: this.propertyFormData.area,
      price: this.propertyFormData.price,
      location: this.propertyFormData.location,
      description: this.propertyFormData.description,
      amenities: amenitiesList,
      societyName: this.user?.societyName || 'Unknown',
      ownerName: this.user?.name || 'Anonymous',
      contactPhone: this.user?.mobileNumber || '',
      status: 'active',
      postedDate: new Date().toISOString()
    };

    console.log('Submitting property:', propertyData);

    // TODO: Make API call to backend when endpoints are ready
    // For now, add to local master list
    setTimeout(() => {
      this.isSubmittingProperty = false;
      this.propertySubmitMessage = '✅ Property posted successfully!';
      
      // Add to master list
      this.allPropertyListings.unshift(propertyData);
      
      // Store in session storage for persistence
      this.savePropertiesToSession();

      // Switch to appropriate tab after 1.5 seconds
      setTimeout(() => {
        // Switch to Buy/Sell or Rent tab based on listing type
        if (this.propertyFormData.listingType === 'sale') {
          this.realEstateType = 'buysell';
        } else {
          this.realEstateType = 'rent';
        }
        
        // Reset form
        this.resetPropertyForm();
        
        // Filter and display properties
        this.filterAndDisplayProperties();
        this.propertySubmitMessage = '';
      }, 1500);
    }, 500);
  }

  resetPropertyForm(): void {
    this.propertyFormData = {
      locationType: 'internal',
      listingType: 'sale',
      propertyType: 'Apartment',
      bhk: '2',
      area: null,
      price: null,
      location: '',
      description: '',
      amenities: {
        parking: false,
        balcony: false,
        gym: false,
        pool: false,
        kitchen: false
      },
      photos: []
    };
  }

  // Complaint Modal Methods
  openComplaintModal(): void {
    this.showComplaintModal = true;
    this.complaintFormData = {
      title: '',
      description: '',
      category: '',
      attachment: null
    };
    this.complaintFile = null;
    this.complaintSubmitMessage = '';
  }

  closeComplaintModal(): void {
    this.showComplaintModal = false;
    this.complaintFormData = {
      title: '',
      description: '',
      category: '',
      attachment: null
    };
    this.complaintFile = null;
    this.complaintSubmitMessage = '';
  }

  onComplaintFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1048576) {
        alert('File size must not exceed 1 MB');
        event.target.value = '';
        return;
      }
      this.complaintFile = file;
      this.complaintFormData.attachment = file.name;
    }
  }

  submitComplaint(): void {
    // Validate form
    if (!this.complaintFormData.title || this.complaintFormData.title.trim() === '') {
      alert('Please enter a complaint title');
      return;
    }
    if (!this.complaintFormData.description || this.complaintFormData.description.trim() === '') {
      alert('Please enter complaint description');
      return;
    }
    if (this.complaintFormData.description.length > 1000) {
      alert('Description must not exceed 1000 characters');
      return;
    }
    if (!this.complaintFormData.category) {
      alert('Please select a category');
      return;
    }

    this.isSubmittingComplaint = true;
    this.complaintSubmitMessage = '';

    // Create complaint object (JSON)
    const complaintData = {
      title: this.complaintFormData.title.trim(),
      description: this.complaintFormData.description.trim(),
      category: this.complaintFormData.category,
      reporterName: this.user?.username || 'User',
      reporterId: this.user?.id || '',
      societyName: this.user?.societyName || '',
      status: 'OPEN'
    };

    console.log('Submitting complaint:', complaintData);

    // Submit to backend as JSON
    this.http.post<any>('http://localhost:8002/api/posts/complaints', complaintData)
      .subscribe({
        next: (response) => {
          console.log('Complaint submitted:', response);
          this.complaintSubmitMessage = 'Complaint submitted successfully!';
          this.isSubmittingComplaint = false;
          
          // Refresh complaints list
          this.filterPostsBySociety();
          
          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeComplaintModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Error submitting complaint:', error);
          this.complaintSubmitMessage = 'Error submitting complaint. Please try again.';
          this.isSubmittingComplaint = false;
        }
      });
  }

  // Community Post Modal Methods
  openCommunityPostModal(): void {
    this.showCommunityPostModal = true;
    this.postFormData = {
      title: '',
      content: '',
      category: '',
      attachment: null,
      sendEmail: false,
      sendSMS: false
    };
    this.postFile = null;
    this.postSubmitMessage = '';
  }

  closeCommunityPostModal(): void {
    this.showCommunityPostModal = false;
    this.postFormData = {
      title: '',
      content: '',
      category: '',
      attachment: null,
      sendEmail: false,
      sendSMS: false
    };
    this.postFile = null;
    this.postSubmitMessage = '';
  }

  onPostFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1048576) {
        alert('File size must not exceed 1 MB');
        event.target.value = '';
        return;
      }
      this.postFile = file;
      this.postFormData.attachment = file.name;
    }
  }

  submitCommunityPost(): void {
    // Validate form
    if (!this.postFormData.title || this.postFormData.title.trim() === '') {
      alert('Please enter a post title');
      return;
    }
    if (!this.postFormData.content || this.postFormData.content.trim() === '') {
      alert('Please enter post content');
      return;
    }
    if (this.postFormData.content.length > 1000) {
      alert('Content must not exceed 1000 characters');
      return;
    }
    if (!this.postFormData.category) {
      alert('Please select a category');
      return;
    }

    this.isSubmittingPost = true;
    this.postSubmitMessage = '';

    // Create community post object (JSON)
    const postData = {
      title: this.postFormData.title.trim(),
      content: this.postFormData.content.trim(),
      category: this.postFormData.category,
      authorName: this.user?.username || 'User',
      authorId: this.user?.id || '',
      societyName: this.user?.societyName || '',
      sendEmail: this.postFormData.sendEmail || false,
      sendSMS: this.postFormData.sendSMS || false
    };

    console.log('Submitting community post:', postData);

    // Submit to backend as JSON
    this.http.post<any>('http://localhost:8002/api/posts/community', postData)
      .subscribe({
        next: (response) => {
          console.log('Community post submitted:', response);
          this.postSubmitMessage = 'Post created successfully!';
          this.isSubmittingPost = false;
          
          // Refresh posts list
          this.filterPostsBySociety();
          
          // Close modal after 2 seconds
          setTimeout(() => {
            this.closeCommunityPostModal();
          }, 2000);
        },
        error: (error) => {
          console.error('Error submitting post:', error);
          this.postSubmitMessage = 'Error creating post. Please try again.';
          this.isSubmittingPost = false;
        }
      });
  }

  // Security Exchange Modal Methods
  openSecurityExchangeModal(): void {
    this.showSecurityExchangeModal = true;
    this.postFormData = {
      title: '',
      content: '',
      category: 'Entry/Exit Query',
      attachment: null,
      sendEmail: false,
      sendSMS: false
    };
    this.postFile = null;
    this.postSubmitMessage = '';
  }

  closeSecurityExchangeModal(): void {
    this.showSecurityExchangeModal = false;
    this.postFormData = {
      title: '',
      content: '',
      category: '',
      attachment: null,
      sendEmail: false,
      sendSMS: false
    };
    this.postFile = null;
    this.postSubmitMessage = '';
  }

  submitSecurityExchange(): void {
    if (!this.user) return;

    if (!this.postFormData.content) {
      this.postSubmitMessage = '❌ Please enter your message';
      return;
    }

    this.isSubmittingPost = true;
    this.postSubmitMessage = '';

    const exchangeData = {
      ...this.postFormData,
      societyName: this.user.societyName,
      authorName: this.user.username,
      authorType: this.isSecurityGuard() ? 'security' : 'owner',
      createdAt: new Date().toISOString()
    };

    this.http.post('http://localhost:8002/api/security-exchanges', exchangeData)
      .subscribe({
        next: (response: any) => {
          this.postSubmitMessage = '✓ Message posted successfully!';
          this.isSubmittingPost = false;
          
          // Add to local array
          this.securityExchanges.unshift(response);
          this.filteredSecurityExchanges = this.securityExchanges.filter((item: any) => 
            item.societyName === this.user?.societyName
          );
          
          // Close modal after delay
          setTimeout(() => {
            this.closeSecurityExchangeModal();
          }, 1500);
        },
        error: (err) => {
          this.postSubmitMessage = '❌ Error posting message: ' + (err.error?.error || 'Unknown error');
          this.isSubmittingPost = false;
        }
      });
  }

  loadRealEstateListings(): void {
    // Load from session storage first
    this.loadPropertiesFromSession();
    
    // Try to load from backend (if available)
    const typeParam = this.realEstateType === 'buysell' ? 'sale' : 'rent';
    const society = this.user?.societyName || '';
    
    // Build query params with filters
    let queryParams = `type=${typeParam}&societyName=${encodeURIComponent(society)}`;
    if (this.selectedTower) {
      queryParams += `&tower=${this.selectedTower}`;
    }
    if (this.selectedBHK) {
      queryParams += `&bhk=${this.selectedBHK}`;
    }
    
    this.http.get<any[]>(`http://localhost:8002/api/properties?${queryParams}`)
      .subscribe({
        next: (data) => {
          // Merge backend data with local properties (avoiding duplicates)
          const backendIds = new Set(data.map(p => p.id));
          const localOnly = this.allPropertyListings.filter(p => !backendIds.has(p.id));
          this.allPropertyListings = [...data, ...localOnly];
          
          // Filter and display
          this.filterAndDisplayProperties();
          console.log(`Loaded ${data.length} properties from backend, ${localOnly.length} local`);
        },
        error: (error) => {
          console.warn('Backend properties not available, using local only:', error.message);
          // Use local properties only
          this.filterAndDisplayProperties();
        }
      });
  }

  filterAndDisplayProperties(): void {
    const typeParam = this.realEstateType === 'buysell' ? 'sale' : 'rent';
    
    // Filter by listing type
    let filtered = this.allPropertyListings.filter(p => p.listingType === typeParam);
    
    // Apply tower filter if selected
    if (this.selectedTower) {
      filtered = filtered.filter(p => p.location?.includes(`Tower ${this.selectedTower}`));
    }
    
    // Apply BHK filter if selected
    if (this.selectedBHK) {
      filtered = filtered.filter(p => p.bhk === this.selectedBHK);
    }
    
    this.realEstateListings = filtered;
    console.log(`Displaying ${filtered.length} properties (Type: ${typeParam}, Tower: ${this.selectedTower || 'All'}, BHK: ${this.selectedBHK || 'All'})`);
  }

  savePropertiesToSession(): void {
    try {
      sessionStorage.setItem('localProperties', JSON.stringify(this.allPropertyListings));
    } catch (e) {
      console.warn('Could not save properties to session storage:', e);
    }
  }

  loadPropertiesFromSession(): void {
    try {
      const stored = sessionStorage.getItem('localProperties');
      if (stored) {
        this.allPropertyListings = JSON.parse(stored);
        console.log(`Loaded ${this.allPropertyListings.length} properties from session`);
      }
    } catch (e) {
      console.warn('Could not load properties from session storage:', e);
      this.allPropertyListings = [];
    }
  }

  goToAdminTab(tab: string): void {
    this.selectAdminTab(tab);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.authService.logout().subscribe(
      () => {
        // Redirect to Login MFE (separate microfrontend)
        window.location.href = 'http://localhost:4201/login-mfe';
      },
      () => {
        // Even if logout fails on server, navigate away
        window.location.href = 'http://localhost:4201/login-mfe';
      }
    );
  }

  onSocietyChange(event: any): void {
    const selectedSociety = event.target.value;
    console.log('Switching to society:', selectedSociety);
    
    // Update current society in context
    if (this.user) {
      this.user.societyName = selectedSociety;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      // In a real scenario, you would reload data specific to this society
      // For now, we're just updating the local state
      this.loadPaymentData();
      this.loadAdminConsolidatedPayments();
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  closeProfileMenu(): void {
    this.isProfileMenuOpen = false;
  }

  viewProfile(): void {
    // Navigate to user profile or open a profile modal
    // For now, just close the menu
    this.closeProfileMenu();
    console.log('View profile clicked for user:', this.user.username);
    // TODO: Implement navigation to profile page or open profile modal
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const profileMenu = this.elementRef.nativeElement.querySelector('.user-profile-menu');
    if (profileMenu && !profileMenu.contains(event.target as Node)) {
      this.isProfileMenuOpen = false;
    }
  }

  // Maintenance Payment Methods
  getTotalDue(): number {
    return this.maintenanceQuarters
      .filter(q => q.status === 'pending')
      .reduce((sum, q) => sum + this.getQuarterTotal(q), 0);
  }

  getAdditionalTotalDue(): number {
    return this.maintenanceQuarters
      .filter(q => q.status === 'pending')
      .reduce((sum, q) => sum + this.getAdditionalAmount(q.additionalFields), 0);
  }

  getPendingQuartersCount(): number {
    return this.maintenanceQuarters.filter(q => q.status === 'pending').length;
  }

  getAggregatedAdditionalFields(): Map<string, number> {
    const aggregated = new Map<string, number>();
    
    this.maintenanceQuarters.forEach(quarter => {
      if (quarter.additionalFields && typeof quarter.additionalFields === 'object') {
        Object.entries(quarter.additionalFields).forEach(([key, value]) => {
          const numericValue = parseFloat(String(value).replace(/,/g, ''));
          if (!Number.isNaN(numericValue)) {
            const existing = aggregated.get(key) || 0;
            aggregated.set(key, existing + numericValue);
          }
        });
      }
    });
    
    return aggregated;
  }

  getQuarterTotal(quarter: any): number {
    // For the new layout, just return base amount
    // Additional charges are shown separately
    return typeof quarter.amount === 'number' ? quarter.amount : 0;
  }

  getAdditionalAmount(additionalFields: Record<string, string> | null | undefined): number {
    if (!additionalFields) {
      return 0;
    }

    return Object.values(additionalFields).reduce((sum, value) => {
      const numericValue = parseFloat(String(value).replace(/,/g, ''));
      return Number.isNaN(numericValue) ? sum : sum + numericValue;
    }, 0);
  }

  hasAdditionalFields(additionalFields: Record<string, string> | null | undefined): boolean {
    return !!additionalFields && Object.keys(additionalFields).length > 0;
  }

  getDashboardTitle(): string {
    if (this.isSecurityGuard()) {
      return 'Security Dashboard';
    }

    if (this.isSuperAdmin()) {
      return 'Admin Dashboard';
    }

    if (this.isSocietyAdmin()) {
      return 'Society Admin Dashboard';
    }

    return 'Community Dashboard';
  }

  isAdminUser(): boolean {
    if (!this.user) return false;
    const role = (this.user.role || '').toUpperCase();
    const userType = (this.user.userType || '').toLowerCase();
    return role === 'ADMIN' || role === 'SUPER-ADMIN' || userType === 'admin' || userType === 'superadmin';
  }

  isSuperAdmin(): boolean {
    if (!this.user) return false;
    const role = (this.user.role || '').toUpperCase();
    const userType = (this.user.userType || '').toLowerCase();
    const ownerType = (this.user.ownerType || '').toLowerCase();
    
    // Super admin identified by:
    // 1. userType === 'superadmin'
    // 2. role === 'SUPER-ADMIN'
    // 3. ownerType === 'super-admin'
    // 4. userType === 'admin' BUT no societyName (default admin user)
    if (userType === 'superadmin' || role === 'SUPER-ADMIN' || ownerType === 'super-admin') {
      return true;
    }
    
    // Default admin user without society assignment is Super Admin
    if (userType === 'admin' && !this.user.societyName) {
      return true;
    }
    
    return false;
  }

  isSocietyAdmin(): boolean {
    if (!this.user) return false;
    
    // First check if they are a Super Admin - if so, they're NOT a Society Admin
    if (this.isSuperAdmin()) {
      return false;
    }
    
    const role = (this.user.role || '').toUpperCase();
    const userType = (this.user.userType || '').toLowerCase();
    const ownerType = (this.user.ownerType || '').toLowerCase();
    
    // Society admin has admin userType WITH societyName, or society-admin role/ownerType
    if (userType === 'admin' && this.user.societyName) {
      return true;
    }
    
    return role === 'SOCIETY-ADMIN' || ownerType === 'society-admin';
  }

  isNormalUser(): boolean {
    return !this.isAdminUser();
  }

  loadAdminConsolidatedPayments(): void {
    if (!this.isAdminUser()) {
      return;
    }

    this.http.get<any>('http://localhost:8002/api/user/payments/debug/all')
      .subscribe({
        next: (response) => {
          console.log('Admin consolidated payments:', response);
          if (response?.allPayments && Array.isArray(response.allPayments)) {
            const consolidated = new Map<string, any>();
            
            response.allPayments.forEach((payment: any) => {
              const tower = payment.tower || 'Unknown Tower';
              const flat = payment.flat || 'Unknown Flat';
              const key = `Tower ${tower} - Flat ${flat}`;
              
              if (!consolidated.has(key)) {
                consolidated.set(key, {
                  tower,
                  flat,
                  totalDue: 0,
                  totalPaid: 0,
                  totalPending: 0,
                  quarters: []
                });
              }
              
              const entry = consolidated.get(key);
              const amount = typeof payment.amount === 'number' ? payment.amount : 0;
              
              if (payment.status === 'pending') {
                entry.totalPending += amount;
              } else if (payment.status === 'paid') {
                entry.totalPaid += amount;
              }
              
              entry.totalDue += amount;
              entry.quarters.push(payment);
            });

            this.adminConsolidatedPayments = consolidated;
          }
        },
        error: (error) => {
          console.error('Error loading admin payments:', error);
        }
      });
  }

  payMaintenance(quarter: any): void {
    const quarterTotal = this.getQuarterTotal(quarter);
    // Redirect to CCAvenue Payment Gateway
    const paymentData = {
      merchantId: 'YOUR_MERCHANT_ID',
      orderId: `ORD_${Date.now()}`,
      amount: quarterTotal,
      currency: 'INR',
      redirectUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      description: `Maintenance Payment - ${quarter.name}`,
      billingName: this.user?.username || 'Resident',
      billingAddress: `Tower ${this.user?.towerNumber}, Flat ${this.user?.flatNumber}`,
      billingCity: 'Mumbai',
      billingState: 'Maharashtra',
      billingZip: '400001',
      billingCountry: 'India',
      billingTel: '9876543210',
      billingEmail: this.user?.email || 'resident@nammasociety.com'
    };

    // TODO: Implement CCAvenue integration
    // For now, show a confirmation dialog
    if (confirm(`Proceed to pay ₹${quarterTotal} for ${quarter.name}?`)) {
      console.log('Redirecting to CCAvenue Payment Gateway...', paymentData);
      // After successful payment, update quarter status
      // quarter.status = 'paid';
      // quarter.statusText = 'Paid';
      alert('Payment gateway integration pending. This will redirect to CCAvenue.');
    }
  }

  payAllMaintenance(): void {
    const totalDue = this.getTotalDue();
    
    if (totalDue === 0) {
      alert('No pending payments!');
      return;
    }

    // Redirect to CCAvenue Payment Gateway for all pending payments
    const paymentData = {
      merchantId: 'YOUR_MERCHANT_ID',
      orderId: `ORD_ALL_${Date.now()}`,
      amount: totalDue,
      currency: 'INR',
      redirectUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      description: 'Maintenance Payment - All Quarters',
      billingName: this.user?.username || 'Resident',
      billingAddress: `Tower ${this.user?.towerNumber}, Flat ${this.user?.flatNumber}`,
      billingCity: 'Mumbai',
      billingState: 'Maharashtra',
      billingZip: '400001',
      billingCountry: 'India',
      billingTel: '9876543210',
      billingEmail: this.user?.email || 'resident@nammasociety.com'
    };

    // TODO: Implement CCAvenue integration
    if (confirm(`Proceed to pay ₹${totalDue} for all pending maintenance?`)) {
      console.log('Redirecting to CCAvenue Payment Gateway...', paymentData);
      alert('Payment gateway integration pending. This will redirect to CCAvenue.');
    }
  }

  navigateToMarketplace(): void {
    this.router.navigate(['/marketplace']);
  }

  // ===== CR MARKETPLACE METHODS =====
  
  openCRMarketplace(): void {
    this.crMarketplaceView = 'buyer';
    this.showCRMarketplaceModal = true;
    this.loadCRProducts();
  }

  closeCRMarketplace(): void {
    this.showCRMarketplaceModal = false;
    this.resetCRProductForm();
  }

  switchCRView(view: string): void {
    this.crMarketplaceView = view;
    if (view === 'buyer') {
      this.loadCRProducts();
    } else if (view === 'orders') {
      this.loadCROrders();
    }
  }

  loadCRProducts(): void {
    // Load products from backend
    this.http.get<any[]>('http://localhost:8002/api/cr-marketplace/products')
      .subscribe({
        next: (data) => {
          this.crProducts = data;
          this.filteredCRProducts = [...data];
          console.log('Loaded CR products:', data.length);
        },
        error: (error) => {
          console.error('Error loading CR products:', error);
          // Use mock data for now
          this.crProducts = [];
          this.filteredCRProducts = [];
        }
      });
  }

  filterCRProductsByCategory(category: string): void {
    if (category === 'All') {
      this.filteredCRProducts = [...this.crProducts];
    } else {
      this.filteredCRProducts = this.crProducts.filter(p => p.category === category);
    }
  }

  openProductDetail(product: any): void {
    this.selectedCRProduct = product;
    this.showProductDetailModal = true;
  }

  closeProductDetail(): void {
    this.showProductDetailModal = false;
    this.selectedCRProduct = null;
  }

  addToCart(product: any, quantity: number = 1): void {
    const existingItem = this.crCart.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.crCart.push({
        productId: product.id,
        productName: product.productName,
        price: product.price,
        quantity: quantity,
        seller: product.seller,
        image: product.image
      });
    }
    console.log('Cart updated:', this.crCart);
    alert(`Added ${product.productName} to cart!`);
  }

  checkoutCart(): void {
    if (this.crCart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const totalAmount = this.crCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Prepare CCAvenue payment
    const paymentData = {
      merchantId: 'YOUR_MERCHANT_ID',
      orderId: `CR_${Date.now()}`,
      amount: totalAmount,
      currency: 'INR',
      redirectUrl: `${window.location.origin}/payment/success`,
      cancelUrl: `${window.location.origin}/payment/cancel`,
      description: 'CR Marketplace Order',
      billingName: this.user?.username || 'Buyer',
      billingAddress: `Tower ${this.user?.towerNumber}, Flat ${this.user?.flatNumber}`,
      billingCity: 'Mumbai',
      billingState: 'Maharashtra',
      billingZip: '400001',
      billingCountry: 'India',
      billingTel: this.user?.phone || '',
      billingEmail: this.user?.email || ''
    };

    console.log('Initiating CCAvenue payment:', paymentData);
    
    // Create order in backend first
    this.http.post('http://localhost:8002/api/cr-marketplace/orders', {
      items: this.crCart,
      totalAmount: totalAmount,
      paymentData: paymentData
    }).subscribe({
      next: (response: any) => {
        console.log('Order created:', response);
        // Redirect to CCAvenue
        alert('Order created! Redirecting to CCAvenue payment gateway...');
        // TODO: Implement actual CCAvenue redirect
        // window.location.href = response.paymentUrl;
        this.crCart = [];
      },
      error: (error) => {
        console.error('Error creating order:', error);
        alert('Failed to create order. Please try again.');
      }
    });
  }

  // Seller Methods
  resetCRProductForm(): void {
    this.crProductForm = {
      productName: '',
      category: 'Food',
      price: null,
      unit: 'per item',
      description: '',
      stock: null,
      image: null
    };
    this.crProductSubmitMessage = '';
  }

  submitCRProduct(): void {
    if (!this.crProductForm.productName || !this.crProductForm.price || !this.crProductForm.stock) {
      this.crProductSubmitMessage = 'Please fill all required fields';
      return;
    }

    this.isSubmittingCRProduct = true;
    
    const productData = {
      ...this.crProductForm,
      seller: this.user?.username || 'Unknown',
      sellerId: this.user?.id,
      createdAt: new Date().toISOString()
    };

    this.http.post('http://localhost:8002/api/cr-marketplace/products', productData)
      .subscribe({
        next: (response) => {
          console.log('Product posted:', response);
          this.crProductSubmitMessage = 'Product posted successfully!';
          setTimeout(() => {
            this.resetCRProductForm();
            this.loadCRProducts();
            this.switchCRView('buyer');
          }, 2000);
        },
        error: (error) => {
          console.error('Error posting product:', error);
          this.crProductSubmitMessage = 'Failed to post product. Please try again.';
        },
        complete: () => {
          this.isSubmittingCRProduct = false;
        }
      });
  }

  loadCROrders(): void {
    this.http.get<any[]>(`http://localhost:8002/api/cr-marketplace/orders?userId=${this.user?.id}`)
      .subscribe({
        next: (data) => {
          this.crOrders = data;
          console.log('Loaded orders:', data.length);
        },
        error: (error) => {
          console.error('Error loading orders:', error);
          this.crOrders = [];
        }
      });
  }

  // ===== ADMIN PANEL METHODS =====
  
  loadAdminUser(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.adminUser = JSON.parse(userStr);
    }
  }

  loadMaintenancePayments(): void {
    // TEMPORARY FIX: Use debug endpoint to get all payments, then filter on frontend
    // This handles legacy data that doesn't have societyName field populated
    let apiUrl = 'http://localhost:8002/api/user/payments/debug/all';
    
    console.log('🔍 === PAYMENT LOADING DEBUG START ===');
    console.log('🔍 adminUser:', this.adminUser);
    console.log('🔍 adminUser.societyName:', this.adminUser?.societyName);
    console.log('🔍 Using debug endpoint (all payments) - will filter on frontend if needed');
    console.log('🔍 API URL:', apiUrl);
    
    this.http.get<any>(apiUrl)
      .subscribe({
        next: (response) => {
          console.log('🔍 === RAW API RESPONSE ===');
          console.log('🔍 Response object:', response);
          console.log('🔍 response.success:', response?.success);
          console.log('🔍 response.payments:', response?.payments);
          console.log('🔍 response.count:', response?.count);
          console.log('🔍 response.allPayments:', response?.allPayments);
          
          // Handle different response formats
          let paymentData = response?.allPayments || response?.payments || [];
          
          console.log('🔍 paymentData type:', Array.isArray(paymentData) ? 'Array' : typeof paymentData);
          console.log('🔍 paymentData length/keys:', Array.isArray(paymentData) ? paymentData.length : Object.keys(paymentData).length);
          if (Array.isArray(paymentData) && paymentData.length > 0) {
            console.log('🔍 First payment object:', paymentData[0]);
            console.log('🔍 Has towerNumber field?', paymentData[0].hasOwnProperty('towerNumber'));
          }
          
          if (response?.success && paymentData) {
            const allPayments: any[] = [];
            const currentYear = new Date().getFullYear(); // 2026 for filtering
            
            if (Array.isArray(paymentData)) {
              // Check if it's a flat array of MaintenancePayment objects (has towerNumber field)
              if (paymentData.length > 0 && paymentData[0].towerNumber) {
                // Flat array format from society endpoint - each element is a MaintenancePayment
                paymentData.forEach((payment: any) => {
                  // Parse due date to check year
                  const dueDate = payment.dueDate || '';
                  const paymentYear = dueDate ? new Date(dueDate).getFullYear() : currentYear;
                  
                  // Only include payments from current year (2026)
                  if (paymentYear === currentYear) {
                    allPayments.push({
                      tower: payment.towerNumber || payment.tower || '',
                      flat: payment.flatNumber || payment.flat || '',
                      towerFlat: `${payment.towerNumber || payment.tower}-${payment.flatNumber || payment.flat}`,
                      quarter: payment.quarterName || payment.quarter || 'Unknown',
                      quarterPeriod: payment.quarterPeriod || payment.period || '',
                      amount: parseFloat(String(payment.amount || 0)),
                      dueDate: dueDate,
                      status: payment.status || 'pending',
                      statusText: payment.statusText || this.capitalizeStatus(payment.status || 'pending'),
                      additionalFields: payment.additionalFields || {}
                    });
                  }
                });
              } else {
                // Array format with nested structure - legacy format
                paymentData.forEach((resident: any) => {
                  if (resident.maintenanceQuarters && Array.isArray(resident.maintenanceQuarters)) {
                    resident.maintenanceQuarters.forEach((quarter: any) => {
                      allPayments.push({
                        tower: resident.tower || resident.towerNumber || '',
                        flat: resident.flat || resident.flatNumber || '',
                        towerFlat: `${resident.tower || resident.towerNumber}-${resident.flat || resident.flatNumber}`,
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
              }
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
            
            // Log unique towers found in payment data
            const uniqueTowers = new Set(allPayments.map(p => p.tower));
            const uniqueStatuses = new Set(allPayments.map(p => p.status));
            
            console.log('✅ Loaded maintenance payments:', this.maintenancePayments.length, 'records (current year only)');
            console.log('✅ Unique Towers found:', Array.from(uniqueTowers).sort());
            console.log('✅ Unique Statuses found:', Array.from(uniqueStatuses));
            
            // Log sample of Tower 3 payments to debug
            const tower3Payments = allPayments.filter(p => p.tower === '3');
            console.log('🔍 Tower 3 payments found:', tower3Payments.length);
            if (tower3Payments.length > 0) {
              console.log('🔍 Sample Tower 3 payment:', tower3Payments[0]);
            }
            
            this.calculateMaintenanceTotals();
            
            console.log('✅ Displaying all payments (no filter applied)');
            console.log('✓ Total payments after filter:', this.getFilteredMaintenancePayments().length, 'records');
            
            // Show sample payment for debugging
            if (allPayments.length > 0) {
              console.log('Sample payment object:', allPayments[0]);
            }
          } else {
            console.warn('⚠️ === NO PAYMENT DATA RECEIVED ===');
            console.warn('⚠️ response.success:', response?.success);
            console.warn('⚠️ paymentData is null/undefined/empty');
            this.maintenancePayments = [];
          }
        },
        error: (error) => {
          console.error('❌ === ERROR LOADING PAYMENTS ===');
          console.error('❌ Error object:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          this.maintenancePayments = [];
        }
      });
  }

  calculateMaintenanceTotals(): void {
    this.maintenanceQuarterTotals.clear();
    this.totalCollectionsExpected = 0;
    this.totalCollected = 0;
    this.totalPending = 0;

    // Calculate totals for all filtered payments
    const filteredPayments = this.getFilteredMaintenancePayments();
    
    filteredPayments.forEach((payment: any) => {
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
      // Convert both to strings and trim for robust comparison
      const paymentTower = String(payment.tower || '').trim();
      const selectedTower = String(this.filterTower || '').trim();
      const matchesTower = !selectedTower || paymentTower === selectedTower;
      
      const matchesStatus = !this.filterStatus || payment.status === this.filterStatus;
      return matchesTower && matchesStatus;
    });
  }

  getUniqueTowers(): string[] {
    // Return default tower list (Tower 1-15) for consistent UI
    // In future, this can be made configurable per society from backend
    return this.availableTowers;
  }

  capitalizeStatus(status: string): string {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }
  
  /**
   * Handle tower filter change - recalculate totals for selected tower
   */
  onTowerFilterChange(): void {
    const filtered = this.getFilteredMaintenancePayments();
    console.log('🔍 Tower filter changed to:', this.filterTower || 'All Towers');
    console.log('🔍 Filtered payments:', filtered.length, 'records');
    if (this.filterTower && filtered.length > 0) {
      console.log('🔍 Sample filtered payment:', filtered[0]);
    }
    this.calculateMaintenanceTotals();
  }
  
  /**
   * Handle status filter change - recalculate totals
   */
  onStatusFilterChange(): void {
    const filtered = this.getFilteredMaintenancePayments();
    console.log('🔍 Status filter changed to:', this.filterStatus || 'All Status');
    console.log('🔍 Filtered payments:', filtered.length, 'records');
    if (this.filterStatus && filtered.length > 0) {
      console.log('🔍 Sample filtered payment:', filtered[0]);
    }
    this.calculateMaintenanceTotals();
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
          
          // Reload admin stats and user data after successful upload
          this.loadAdminStats();
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
        },
        error: (error) => {
          console.error('❌ ERROR:', error);
          this.isUploadingPayment = false;
          this.uploadErrorMessage = `❌ Error: ${error?.error?.message || error?.statusText || 'Unknown error'}`;
          console.error('Status:', error?.status);
          console.error('Message:', this.uploadErrorMessage);
          this.clearMessages(5000);
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

  // Payment Reminder Properties
  reminderDaysBefore: number = 0; // 0 = due today, negative = overdue
  reminderSendEmail: boolean = true;
  reminderSendSMS: boolean = false;
  isSendingReminders: boolean = false;
  reminderSuccessMessage: string = '';
  reminderErrorMessage: string = '';
  showPaymentReminderModal: boolean = false;

  // Send Payment Reminders
  openPaymentReminderModal(): void {
    this.showPaymentReminderModal = true;
    this.reminderDaysBefore = 0;
    this.reminderSendEmail = true;
    this.reminderSendSMS = false;
    this.reminderSuccessMessage = '';
    this.reminderErrorMessage = '';
  }

  closePaymentReminderModal(): void {
    this.showPaymentReminderModal = false;
    this.reminderSuccessMessage = '';
    this.reminderErrorMessage = '';
  }

  sendPaymentReminders(): void {
    if (this.isSendingReminders) {
      return;
    }

    // Reset messages
    this.reminderSuccessMessage = '';
    this.reminderErrorMessage = '';

    // Validate that at least one notification method is selected
    if (!this.reminderSendEmail && !this.reminderSendSMS) {
      this.reminderErrorMessage = 'Please select at least one notification method (Email or SMS)';
      return;
    }

    this.isSendingReminders = true;

    const params = {
      societyName: this.adminUser?.societyName || this.user?.societyName,
      daysBefore: this.reminderDaysBefore,
      sendEmail: this.reminderSendEmail,
      sendSMS: this.reminderSendSMS
    };

    console.log('Sending payment reminders with params:', params);

    this.http.post('http://localhost:8002/api/user/payments/send-reminders', null, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('Payment reminders response:', response);
          this.isSendingReminders = false;

          if (response.success) {
            const emailsSent = response.emailsSent || 0;
            const smsSent = response.smsSent || 0;
            const uniqueUsers = response.uniqueUsers || 0;
            
            this.reminderSuccessMessage = `✅ Payment reminders sent successfully to ${uniqueUsers} user(s)`;
            if (this.reminderSendEmail) {
              this.reminderSuccessMessage += ` (${emailsSent} emails`;
            }
            if (this.reminderSendSMS) {
              this.reminderSuccessMessage += `, ${smsSent} SMS`;
            }
            if (this.reminderSendEmail || this.reminderSendSMS) {
              this.reminderSuccessMessage += ')';
            }

            // Auto-close modal after 3 seconds on success
            setTimeout(() => {
              this.closePaymentReminderModal();
            }, 3000);
          } else {
            this.reminderErrorMessage = response.message || 'Failed to send payment reminders';
          }
        },
        error: (error) => {
          console.error('Error sending payment reminders:', error);
          this.isSendingReminders = false;
          this.reminderErrorMessage = 'Failed to send payment reminders: ' + (error.error?.message || error.message || 'Unknown error');
        }
      });
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

  downloadBulkTemplate(): void {
    // Create CSV header and example data for bulk user upload
    const headers = ['societyName', 'username', 'email', 'phoneNumber', 'address', 'userType', 'ownerType', 'towerNumber', 'flatNumber', 'password'];
    const exampleRow = ['Green Heights', 'john.doe', 'john@example.com', '9876543210', 'Flat 101 Tower A', 'owner', 'resident', 'A', '101', 'Pass@123'];
    const exampleRow2 = ['Green Heights', 'jane.smith', 'jane@example.com', '9876543211', 'Flat 202 Tower B', 'tenant', '', 'B', '202', 'Pass@456'];
    const exampleRow3 = ['Sky Towers', 'mike.johnson', 'mike@example.com', '9876543212', 'Flat 305 Tower C', 'owner', 'nonResident', 'C', '305', 'Pass@789'];

    // Combine into CSV format
    const csvContent = [
      headers.join(','),
      exampleRow.join(','),
      exampleRow2.join(','),
      exampleRow3.join(','),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_user_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Admin User Management Methods
  createAdminUser(): void {
    // Validation
    if (!this.newAdminUsername || !this.newAdminEmail || !this.newAdminPassword) {
      this.adminCreateError = 'Please fill in all required fields';
      this.adminCreateSuccess = '';
      return;
    }

    // Society is required only for regular admins
    if (this.newAdminUserType === 'admin' && !this.newAdminSociety) {
      this.adminCreateError = 'Please select a society for Society Admin';
      this.adminCreateSuccess = '';
      return;
    }

    if (this.newAdminPassword !== this.newAdminConfirmPassword) {
      this.adminCreateError = 'Passwords do not match';
      this.adminCreateSuccess = '';
      return;
    }

    if (this.newAdminPassword.length < 8) {
      this.adminCreateError = 'Password must be at least 8 characters';
      this.adminCreateSuccess = '';
      return;
    }

    // Determine role and permissions based on selection
    const role = this.newAdminUserType === 'superadmin' ? 'super-admin' : 'society-admin';
    const permissions = this.newAdminUserType === 'superadmin' 
      ? ['users', 'bulk-upload', 'payments', 'maintenance', 'societies', 'create-super-admin']
      : ['users', 'bulk-upload', 'payments', 'maintenance'];

    const adminData = {
      societyName: this.newAdminUserType === 'superadmin' ? 'All Societies' : this.newAdminSociety,
      username: this.newAdminUsername,
      email: this.newAdminEmail,
      password: this.newAdminPassword,
      role: role,
      userType: this.newAdminUserType,
      permissions: permissions
    };

    console.log('Creating admin user for society:', this.newAdminSociety);

    this.http.post('http://localhost:8002/api/admin/create-admin-user', adminData)
      .subscribe({
        next: (response: any) => {
          const successMsg = this.newAdminUserType === 'superadmin' 
            ? `Super Admin "${this.newAdminUsername}" created successfully with full system access!`
            : `Admin user "${this.newAdminUsername}" created successfully for ${this.newAdminSociety}!`;
          this.adminCreateSuccess = successMsg;
          this.adminCreateError = '';
          
          // Add to the list
          const newAdmin = {
            id: this.existingAdmins.length + 1,
            societyName: this.newAdminUserType === 'superadmin' ? 'All Societies' : this.newAdminSociety,
            username: this.newAdminUsername,
            email: this.newAdminEmail,
            role: role,
            userType: this.newAdminUserType,
            createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          };
          this.existingAdmins.push(newAdmin);
          
          // Reset form
          this.resetAdminForm();
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.adminCreateSuccess = '';
          }, 3000);
        },
        error: (error) => {
          const errorMsg = error.error?.message || 'Failed to create admin user';
          this.adminCreateError = errorMsg;
          this.adminCreateSuccess = '';
          console.error('Error creating admin user:', error);
        }
      });
  }

  resetAdminForm(): void {
    this.newAdminSociety = '';
    this.newAdminUsername = '';
    this.newAdminEmail = '';
    this.newAdminPassword = '';
    this.newAdminConfirmPassword = '';
    this.newAdminUserType = 'admin';
    this.adminCreateSuccess = '';
    this.adminCreateError = '';
  }

  // Security User Management Methods
  createSecurityUser(): void {
    // Validation
    if (!this.newSecurityUsername || !this.newSecurityEmail || !this.newSecurityPassword) {
      this.securityCreateError = 'Please fill in all required fields';
      this.securityCreateSuccess = '';
      return;
    }

    if (!this.newSecuritySociety) {
      this.securityCreateError = 'Please select a society for this security guard';
      this.securityCreateSuccess = '';
      return;
    }

    if (this.newSecurityPassword !== this.newSecurityConfirmPassword) {
      this.securityCreateError = 'Passwords do not match';
      this.securityCreateSuccess = '';
      return;
    }

    if (this.newSecurityPassword.length < 8) {
      this.securityCreateError = 'Password must be at least 8 characters';
      this.securityCreateSuccess = '';
      return;
    }

    const securityData = {
      username: this.newSecurityUsername,
      email: this.newSecurityEmail,
      password: this.newSecurityPassword,
      fullName: this.newSecurityFullName || this.newSecurityUsername,
      phoneNumber: this.newSecurityPhone,
      role: 'SECURITY',
      userType: 'security',
      societyName: this.newSecuritySociety // Assigned society
    };

    console.log('Creating security user for society:', this.newSecuritySociety);

    this.http.post('http://localhost:8002/api/admin/create-security-user', securityData)
      .subscribe({
        next: (response: any) => {
          this.securityCreateSuccess = `Security user "${this.newSecurityUsername}" created successfully for society "${this.newSecuritySociety}"! They can now login and manage approvals for this society.`;
          this.securityCreateError = '';
          
          // Add to the list
          const newSecurity = {
            id: this.existingSecurityUsers.length + 1,
            username: this.newSecurityUsername,
            email: this.newSecurityEmail,
            fullName: this.newSecurityFullName || this.newSecurityUsername,
            phoneNumber: this.newSecurityPhone,
            societyName: this.newSecuritySociety,
            createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
          };
          this.existingSecurityUsers.push(newSecurity);
          
          // Reset form
          this.resetSecurityForm();
          
          // Clear message after 5 seconds
          setTimeout(() => {
            this.securityCreateSuccess = '';
          }, 5000);
        },
        error: (error) => {
          const errorMsg = error.error?.message || 'Failed to create security user';
          this.securityCreateError = errorMsg;
          this.securityCreateSuccess = '';
          console.error('Error creating security user:', error);
        }
      });
  }

  resetSecurityForm(): void {
    this.newSecurityUsername = '';
    this.newSecurityEmail = '';
    this.newSecurityPassword = '';
    this.newSecurityConfirmPassword = '';
    this.newSecurityFullName = '';
    this.newSecurityPhone = '';
    this.newSecuritySociety = '';
    this.securityCreateSuccess = '';
    this.securityCreateError = '';
  }

  deleteSecurityUser(securityId: number): void {
    if (confirm('Are you sure you want to delete this security user?')) {
      console.log('Deleting security user with ID:', securityId);
      
      this.http.delete(`http://localhost:8002/api/admin/delete-security-user/${securityId}`)
        .subscribe({
          next: (response: any) => {
            this.existingSecurityUsers = this.existingSecurityUsers.filter(sec => sec.id !== securityId);
            console.log('Security user deleted successfully');
          },
          error: (error) => {
            console.error('Error deleting security user:', error);
            alert('Failed to delete security user');
          }
        });
    }
  }

  deleteAdminUser(adminId: number): void {
    if (confirm('Are you sure you want to delete this admin user?')) {
      console.log('Deleting admin user with ID:', adminId);
      
      this.http.delete(`http://localhost:8002/api/admin/delete-admin-user/${adminId}`)
        .subscribe({
          next: (response: any) => {
            this.existingAdmins = this.existingAdmins.filter(admin => admin.id !== adminId);
            this.adminCreateSuccess = 'Admin user deleted successfully';
            setTimeout(() => {
              this.adminCreateSuccess = '';
            }, 3000);
          },
          error: (error) => {
            const errorMsg = error.error?.message || 'Failed to delete admin user';
            this.adminCreateError = errorMsg;
            console.error('Error deleting admin user:', error);
          }
        });
    }
  }

  // Society Management Methods
  loadSocieties(): void {
    this.http.get<any[]>('http://localhost:8002/api/societies').subscribe({
      next: (response) => {
        const res: any = response;
        this.societies = Array.isArray(res) ? res : (res.value || []);
        console.log('Loaded societies:', this.societies);
        // Update community count after loading societies
        this.communityCount = this.societies.length;
        // Update recent societies - get the last 4 societies
        this.recentSocieties = this.societies.slice(-4).reverse().map((society: any) => ({
          name: society.name,
          city: society.city || 'N/A',
          state: society.state || 'N/A',
          createdDate: society.createdDate ? this.formatDate(society.createdDate) : 'N/A'
        }));
      },
      error: (error) => {
        console.error('Error loading societies:', error);
        // Initialize with empty array if API not available yet
        this.societies = [];
        this.communityCount = 0;
        this.recentSocieties = [];
      }
    });
  }

  /**
   * Load societies for security user creation dropdown
   */
  loadSocietiesForSecurity(): void {
    this.http.get<any[]>('http://localhost:8002/api/societies').subscribe({
      next: (response) => {
        const res: any = response;
        const societiesList = Array.isArray(res) ? res : (res.value || []);
        // Extract society names for dropdown
        this.availableSocietiesForSecurity = societiesList
          .map((society: any) => society.name)
          .filter((name: string) => name && name.trim() !== '');
        console.log('Loaded societies for security dropdown:', this.availableSocietiesForSecurity);
      },
      error: (error) => {
        console.error('Error loading societies for security:', error);
        this.availableSocietiesForSecurity = [];
      }
    });
  }

  createSociety(): void {
    // Validation
    if (!this.newSociety.name || !this.newSociety.street || !this.newSociety.area || 
        !this.newSociety.city || !this.newSociety.state || !this.newSociety.country || !this.newSociety.pincode) {
      this.societyCreateError = 'Please fill in all required fields';
      this.societyCreateSuccess = '';
      return;
    }

    if (this.newSociety.pincode.length !== 6) {
      this.societyCreateError = 'Pincode must be 6 digits';
      this.societyCreateSuccess = '';
      return;
    }

    const societyData = {
      name: this.newSociety.name.trim(),
      street: this.newSociety.street.trim(),
      area: this.newSociety.area.trim(),
      city: this.newSociety.city.trim(),
      state: this.newSociety.state.trim(),
      country: this.newSociety.country.trim(),
      pincode: this.newSociety.pincode.trim()
    };

    console.log('Creating society:', societyData);

    this.http.post('http://localhost:8002/api/societies', societyData).subscribe({
      next: (response: any) => {
        this.societyCreateSuccess = `Society "${societyData.name}" created successfully!`;
        this.societyCreateError = '';
        
        // Add to the list
        this.societies.push({
          id: response.id || this.societies.length + 1,
          ...societyData,
          createdDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        });
        
        // Reset form
        this.resetSocietyForm();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.societyCreateSuccess = '';
        }, 3000);
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Failed to create society';
        this.societyCreateError = errorMsg;
        this.societyCreateSuccess = '';
        console.error('Error creating society:', error);
      }
    });
  }

  resetSocietyForm(): void {
    this.newSociety = {
      name: '',
      street: '',
      area: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    };
    this.societyCreateSuccess = '';
    this.societyCreateError = '';
  }

  deleteSociety(societyId: number): void {
    if (confirm('Are you sure you want to delete this society? This action cannot be undone.')) {
      console.log('Deleting society with ID:', societyId);
      
      this.http.delete(`http://localhost:8002/api/societies/${societyId}`).subscribe({
        next: (response: any) => {
          this.societies = this.societies.filter(society => society.id !== societyId);
          this.societyCreateSuccess = 'Society deleted successfully';
          setTimeout(() => {
            this.societyCreateSuccess = '';
          }, 3000);
        },
        error: (error) => {
          const errorMsg = error.error?.message || 'Failed to delete society';
          this.societyCreateError = errorMsg;
          console.error('Error deleting society:', error);
        }
      });
    }
  }

  // Bulk Upload Methods for Societies
  onBulkSocietyFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.bulkSocietyFile = files[0];
      if (this.bulkSocietyFile) {
        console.log('File selected:', this.bulkSocietyFile.name);
      }
    }
  }

  onBulkSocietyDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.bulkSocietyDragOver = true;
  }

  onBulkSocietyDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.bulkSocietyDragOver = false;
  }

  onBulkSocietyDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.bulkSocietyDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.bulkSocietyFile = files[0];
      console.log('File dropped:', this.bulkSocietyFile.name);
    }
  }

  submitBulkSocietyUpload(): void {
    if (!this.bulkSocietyFile) {
      this.bulkSocietyUploadError = 'Please select a CSV file to upload';
      return;
    }

    if (!this.bulkSocietyFile.name.endsWith('.csv')) {
      this.bulkSocietyUploadError = 'Please upload a valid CSV file (.csv)';
      this.bulkSocietyFile = null;
      return;
    }

    this.isBulkSocietyUploading = true;
    this.bulkSocietyUploadError = '';
    this.bulkSocietyUploadSuccess = '';

    const formData = new FormData();
    formData.append('file', this.bulkSocietyFile);

    console.log('Uploading bulk societies from:', this.bulkSocietyFile.name);
    
    this.http.post('http://localhost:8002/api/societies/bulk-upload', formData).subscribe({
      next: (response: any) => {
        this.isBulkSocietyUploading = false;
        this.bulkSocietyUploadSuccess = `Successfully uploaded ${response.data?.successCount || response.data?.length || 'societies'}. Please refresh to see the updated list.`;
        
        // Clear file after successful upload
        this.bulkSocietyFile = null;
        
        // Reload societies
        setTimeout(() => {
          this.loadSocieties();
          this.bulkSocietyUploadSuccess = '';
        }, 2000);
      },
      error: (error) => {
        this.isBulkSocietyUploading = false;
        const errorMsg = error.error?.message || error.error?.error || 'Failed to upload bulk societies';
        this.bulkSocietyUploadError = errorMsg;
        console.error('Error uploading bulk societies:', error);
      }
    });
  }

  // Society Announcements Methods (Society Admin)
  loadSocietyAnnouncements(): void {
    if (!this.user || !this.user.societyName) {
      return;
    }

    const societyName = encodeURIComponent(this.user.societyName);
    this.http.get<any[]>(`http://localhost:8002/api/posts/announcements?societyName=${societyName}`)
      .subscribe({
        next: (response) => {
          this.societyAnnouncements = response;
          console.log('Loaded society announcements:', this.societyAnnouncements.length);
        },
        error: (error) => {
          console.error('Error loading society announcements:', error);
          this.societyAnnouncements = [];
        }
      });
  }

  createSocietyAnnouncement(): void {
    // Validation
    if (!this.newAnnouncement.title || !this.newAnnouncement.content) {
      this.announcementCreateError = 'Title and content are required';
      this.announcementCreateSuccess = '';
      return;
    }

    if (!this.user || !this.user.societyName) {
      this.announcementCreateError = 'Society information not available';
      return;
    }

    const announcementData = {
      title: this.newAnnouncement.title.trim(),
      content: this.newAnnouncement.content.trim(),
      priority: this.newAnnouncement.priority,
      societyName: this.user.societyName,
      authorName: this.user.username,
      authorRole: 'Society Admin',
      sendEmail: this.newAnnouncement.sendEmail,
      sendSMS: this.newAnnouncement.sendSMS
    };

    console.log('Creating society announcement:', announcementData);

    this.http.post('http://localhost:8002/api/posts/announcements', announcementData).subscribe({
      next: (response: any) => {
        this.announcementCreateSuccess = `Announcement "${announcementData.title}" posted successfully!`;
        this.announcementCreateError = '';
        
        // Reload announcements
        this.loadSocietyAnnouncements();
        
        // Reset form
        this.resetAnnouncementForm();
        
        // Clear message after 3 seconds
        setTimeout(() => {
          this.announcementCreateSuccess = '';
        }, 3000);
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Failed to create announcement';
        this.announcementCreateError = errorMsg;
        this.announcementCreateSuccess = '';
        console.error('Error creating announcement:', error);
      }
    });
  }

  resetAnnouncementForm(): void {
    this.newAnnouncement = {
      title: '',
      content: '',
      priority: 'medium',
      sendEmail: true,
      sendSMS: false
    };
    this.announcementCreateSuccess = '';
    this.announcementCreateError = '';
  }

  deleteAnnouncement(announcementId: string): void {
    if (confirm('Are you sure you want to delete this announcement?')) {
      console.log('Deleting announcement with ID:', announcementId);
      
      this.http.delete(`http://localhost:8002/api/posts/announcements/${announcementId}`).subscribe({
        next: (response: any) => {
          this.announcementCreateSuccess = 'Announcement deleted successfully';
          this.loadSocietyAnnouncements();
          setTimeout(() => {
            this.announcementCreateSuccess = '';
          }, 3000);
        },
        error: (error) => {
          const errorMsg = error.error?.message || 'Failed to delete announcement';
          this.announcementCreateError = errorMsg;
          console.error('Error deleting announcement:', error);
        }
      });
    }
  }

  // Load amenities from backend API
  loadAmenities(): void {
    this.http.get<any[]>('http://localhost:8002/api/amenities')
      .subscribe({
        next: (data) => {
          this.amenities = data;
          console.log('Loaded amenities from backend:', data);
        },
        error: (error) => {
          console.error('Error loading amenities:', error);
          this.amenities = [];
        }
      });
  }

  // Load posts data from backend API
  loadPostsData(): void {
    const society = this.user?.societyName || '';
    
    // Load all announcements
    this.http.get<any[]>(`http://localhost:8002/api/posts/announcements?societyName=${encodeURIComponent(society)}`)
      .subscribe({
        next: (data) => {
          this.announcements = data;
          this.filteredAnnouncements = data;
        },
        error: (error) => {
          console.error('Error loading announcements:', error);
        }
      });
    
    // Load all complaints
    this.http.get<any[]>(`http://localhost:8002/api/posts/complaints?societyName=${encodeURIComponent(society)}`)
      .subscribe({
        next: (data) => {
          this.complaints = data;
          this.filteredComplaints = data;
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
        }
      });
    
    // Load all community posts
    this.http.get<any[]>(`http://localhost:8002/api/posts/community?societyName=${encodeURIComponent(society)}`)
      .subscribe({
        next: (data) => {
          this.communityPosts = data;
          this.filteredCommunityPosts = data;
        },
        error: (error) => {
          console.error('Error loading community posts:', error);
        }
      });
  }

  // Get today's date in YYYY-MM-DD format for date input min attribute
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get initials from name for avatar
  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  // Get random color for avatar
  getRandomColor(): string {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FF5722', '#795548'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ============ User Directory Methods (For Normal Society Users) ============
  
  /**
   * Open user directory modal
   */
  openUserDirectory(): void {
    if (!this.user || !this.user.societyName) {
      console.error('User society information not available');
      return;
    }
    
    this.showUserDirectory = true;
    this.loadUserDirectory();
  }

  /**
   * Close user directory modal
   */
  closeUserDirectory(): void {
    this.showUserDirectory = false;
    this.selectedDirectoryTower = '';
    this.userDirectorySearchQuery = '';
    this.societyUsers = [];
    this.filteredSocietyUsers = [];
  }

  /**
   * Load all users in the current user's society
   */
  loadUserDirectory(): void {
    if (!this.user || !this.user.societyName) {
      console.error('User society information not available');
      return;
    }

    this.isLoadingDirectory = true;
    const societyName = encodeURIComponent(this.user.societyName);

    this.http.get<any[]>(`http://localhost:8002/api/users/society/${societyName}`)
      .subscribe({
        next: (users) => {
          console.log('Loaded society users:', users.length);

          // Security users should only see security users mapped to their own society.
          const directoryUsers = this.isSecurityGuard()
            ? users.filter(user => {
                const userType = (user.userType || '').toLowerCase().replace(/[\s-]/g, '_');
                const ownerType = (user.ownerType || '').toLowerCase().replace(/[\s-]/g, '_');
                const role = (user.role || '').toUpperCase().replace(/[\s-]/g, '_');
                return userType === 'security' || userType === 'security_guard' ||
                       ownerType === 'security' || ownerType === 'security_guard' ||
                       role === 'SECURITY' || role === 'SECURITY_GUARD';
              })
            : users;

          this.societyUsers = directoryUsers.map(user => ({
            ...user,
            displayName: user.username || 'Unknown',
            displayTower: user.towerNumber || 'N/A',
            displayFlat: user.flatNumber || 'N/A',
            displayPhone: user.phoneNumber || 'Not provided',
            displayEmail: user.email || 'Not provided',
            displayUserType: this.formatUserType(user.userType)
          }));
          
          // Extract unique towers
          const towers = new Set(this.societyUsers
            .map(u => u.towerNumber)
            .filter(t => t && t !== 'N/A'));
          this.userDirectoryTowers = Array.from(towers).sort();
          
          this.filteredSocietyUsers = this.societyUsers;
          this.isLoadingDirectory = false;
        },
        error: (error) => {
          console.error('Error loading user directory:', error);
          this.isLoadingDirectory = false;
        }
      });
  }

  /**
   * Filter users by tower selection
   */
  filterByTower(): void {
    this.applyDirectoryFilters();
  }

  /**
   * Search users by name, tower, flat
   */
  searchUserDirectory(): void {
    this.applyDirectoryFilters();
  }

  /**
   * Apply both tower and search filters
   */
  private applyDirectoryFilters(): void {
    let filtered = this.societyUsers;

    // Filter by tower
    if (this.selectedDirectoryTower) {
      filtered = filtered.filter(u => u.towerNumber === this.selectedDirectoryTower);
    }

    // Filter by search query
    if (this.userDirectorySearchQuery && this.userDirectorySearchQuery.trim()) {
      const query = this.userDirectorySearchQuery.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.username && u.username.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.towerNumber && u.towerNumber.toLowerCase().includes(query)) ||
        (u.flatNumber && u.flatNumber.toLowerCase().includes(query))
      );
    }

    this.filteredSocietyUsers = filtered;
  }

  /**
   * Clear all filters
   */
  clearDirectoryFilters(): void {
    this.selectedDirectoryTower = '';
    this.userDirectorySearchQuery = '';
    this.filteredSocietyUsers = this.societyUsers;
  }

  // ============= Complaint Detail & Response Methods (Society Admin) =============

  /**
   * Open complaint detail modal
   */
  openComplaintDetail(complaint: any): void {
    this.selectedComplaint = complaint;
    this.showComplaintDetail = true;
    this.loadComplaintComments(complaint.id);
  }

  /**
   * Close complaint detail modal
   */
  closeComplaintDetail(): void {
    this.showComplaintDetail = false;
    this.selectedComplaint = null;
    this.complaintComments = [];
    this.newComplaintResponse = {
      commentText: '',
      authorRole: '',
      isResolution: false
    };
    this.responseSubmitMessage = '';
  }

  /**
   * Load comments for a complaint
   */
  loadComplaintComments(complaintId: string): void {
    this.isLoadingComments = true;
    this.http.get<any[]>(`http://localhost:8002/api/complaints/${complaintId}/comments`)
      .subscribe({
        next: (response) => {
          this.complaintComments = response;
          this.isLoadingComments = false;
          console.log('Loaded complaint comments:', this.complaintComments.length);
        },
        error: (error) => {
          console.error('Error loading complaint comments:', error);
          this.complaintComments = [];
          this.isLoadingComments = false;
        }
      });
  }

  /**
   * Submit response/comment to complaint
   */
  submitComplaintResponse(): void {
    if (!this.newComplaintResponse.commentText || !this.newComplaintResponse.commentText.trim()) {
      this.responseSubmitMessage = 'Please enter a response';
      return;
    }

    if (!this.selectedComplaint) {
      this.responseSubmitMessage = 'No complaint selected';
      return;
    }

    this.isSubmittingResponse = true;
    this.responseSubmitMessage = '';

    const responseData = {
      complaintId: this.selectedComplaint.id,
      authorId: this.user?.id || this.user?.username,
      authorName: this.user?.username || 'Admin',
      authorRole: this.isSocietyAdmin() ? 'SOCIETY_ADMIN' : 'USER',
      commentText: this.newComplaintResponse.commentText.trim(),
      isResolution: this.newComplaintResponse.isResolution || false
    };

    console.log('Submitting complaint response:', responseData);

    this.http.post(`http://localhost:8002/api/complaints/${this.selectedComplaint.id}/comments`, responseData)
      .subscribe({
        next: (response: any) => {
          console.log('Response submitted successfully:', response);
          this.responseSubmitMessage = 'Response posted successfully!';
          
          // Reload comments
          this.loadComplaintComments(this.selectedComplaint.id);
          
          // If marked as resolution, update complaint status
          if (this.newComplaintResponse.isResolution) {
            this.updateComplaintStatus('RESOLVED');
          }
          
          // Reset form
          this.newComplaintResponse = {
            commentText: '',
            authorRole: '',
            isResolution: false
          };
          
          // Clear message after 3 seconds
          setTimeout(() => {
            this.responseSubmitMessage = '';
          }, 3000);
          
          this.isSubmittingResponse = false;
        },
        error: (error) => {
          console.error('Error submitting response:', error);
          const errorMsg = error.error?.message || 'Failed to submit response';
          this.responseSubmitMessage = errorMsg;
          this.isSubmittingResponse = false;
        }
      });
  }

  /**
   * Update complaint status
   */
  updateComplaintStatus(newStatus: string): void {
    if (!this.selectedComplaint) {
      return;
    }

    this.updatingComplaintStatus = true;

    const updateData = {
      ...this.selectedComplaint,
      status: newStatus
    };

    this.http.put(`http://localhost:8002/api/posts/complaints/${this.selectedComplaint.id}`, updateData)
      .subscribe({
        next: (response: any) => {
          console.log('Complaint status updated:', response);
          this.selectedComplaint.status = newStatus;
          
          // Reload complaints list
          this.loadPostsData();
          
          this.updatingComplaintStatus = false;
        },
        error: (error) => {
          console.error('Error updating complaint status:', error);
          this.updatingComplaintStatus = false;
        }
      });
  }

  // ============= Announcement Notification Methods =============

  /**
   * Toggle announcement notifications panel
   */
  toggleAnnouncementNotifications(): void {
    this.showAnnouncementNotifications = !this.showAnnouncementNotifications;
    
    if (this.showAnnouncementNotifications) {
      this.loadRecentAnnouncements();
    }
  }

  /**
   * Load recent announcements
   */
  loadRecentAnnouncements(): void {
    if (!this.user || !this.user.societyName) {
      return;
    }

    const societyName = encodeURIComponent(this.user.societyName);
    this.http.get<any[]>(`http://localhost:8002/api/posts/announcements?societyName=${societyName}`)
      .subscribe({
        next: (response) => {
          // Get announcements from last 7 days
          const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          this.recentAnnouncements = response.filter(a => a.createdAt > sevenDaysAgo);
          
          // Update unread count (announcements created after last check)
          this.unreadAnnouncementsCount = this.recentAnnouncements.filter(
            a => a.createdAt > this.lastAnnouncementCheck
          ).length;
          
          // Update last check timestamp
          this.lastAnnouncementCheck = Date.now();
          
          console.log('Loaded recent announcements:', this.recentAnnouncements.length);
        },
        error: (error) => {
          console.error('Error loading recent announcements:', error);
          this.recentAnnouncements = [];
        }
      });
  }

  /**
   * Close announcement notifications panel
   */
  closeAnnouncementNotifications(): void {
    this.showAnnouncementNotifications = false;
  }

  /**
   * Mark announcement as read
   */
  markAnnouncementAsRead(announcement: any): void {
    // In a real implementation, this would call an API to mark as read
    // For now, just update the UI
    if (this.unreadAnnouncementsCount > 0) {
      this.unreadAnnouncementsCount--;
    }
  }

  // ===== GLOBAL SMART SEARCH METHODS =====
  
  /**
   * Handle global search input with debouncing
   */
  onGlobalSearch(): void {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // If query is empty, hide results
    if (!this.globalSearchQuery || this.globalSearchQuery.trim().length === 0) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    this.searchTimeout = setTimeout(() => {
      this.performGlobalSearch();
    }, 300);
  }

  /**
   * Perform global search API call
   */
  performGlobalSearch(): void {
    const query = this.globalSearchQuery.trim();
    
    if (query.length < 1) {
      this.searchResults = [];
      return;
    }

    const userRole = this.user?.userType || 'user';
    const searchUrl = `http://localhost:8002/api/search?q=${encodeURIComponent(query)}&role=${userRole}`;

    this.http.get<any[]>(searchUrl).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.showSearchResults = true;
        console.log('Search results:', results);
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchResults = [];
      }
    });
  }

  /**
   * Select a search result and navigate/perform action
   */
  selectSearchResult(result: any): void {
    console.log('Selected search result:', result);
    
    // Hide dropdown
    this.showSearchResults = false;
    this.globalSearchQuery = '';
    this.searchResults = [];

    // Handle different result types
    switch (result.type) {
      case 'amenity':
        this.openAmenitiesModal();
        break;
      
      case 'feature':
        this.handleFeatureNavigation(result.id);
        break;
      
      case 'action':
        this.handleActionNavigation(result.id);
        break;
      
      case 'user':
        this.openUserDirectory();
        break;
      
      default:
        console.warn('Unknown result type:', result.type);
    }
  }

  /**
   * Handle feature navigation from search
   */
  handleFeatureNavigation(featureId: string): void {
    switch (featureId) {
      case 'marketplace':
        this.navigateToMarketplace();
        break;
      case 'payment':
        // Scroll to payment section
        document.querySelector('.payment-container')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'announcement':
        this.selectPostType('announcements');
        break;
      case 'complaint':
        this.selectPostType('complaints');
        break;
      case 'directory':
        this.openUserDirectory();
        break;
      case 'realestate':
        this.openRealEstateModal('buy');
        break;
      case 'manage_users':
        if (this.isAdminUser()) {
          this.adminPanelTab = 'users';
        }
        break;
      case 'create_announcement':
        if (this.isAdminUser()) {
          this.adminPanelTab = 'announcements';
        }
        break;
      default:
        console.log('Feature not implemented:', featureId);
    }
  }

  /**
   * Handle action navigation from search
   */
  handleActionNavigation(actionId: string): void {
    switch (actionId) {
      case 'book':
        this.openAmenitiesModal();
        break;
      case 'pay':
        document.querySelector('.payment-container')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'post':
        this.openCommunityPostModal();
        break;
      default:
        console.log('Action not implemented:', actionId);
    }
  }

  /**
   * Hide search results with delay (for blur event)
   */
  hideSearchResults(): void {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  // ========== Guest Management Methods ==========
  
  /**
   * Open Guest Management Modal
   */
  openGuestManagementModal(): void {
    this.showGuestManagementModal = true;

    // Security and Society Admin users should work within their mapped society.
    if ((this.isSecurityGuard() || this.isSocietyAdmin()) && this.user?.societyName) {
      this.availableSocietiesForSecurity = [this.user.societyName];
      this.newApprovalRequest.societyName = this.user.societyName;
    }
    
    // Pre-populate society name with security guard's society (can be changed)
    if (this.user && !this.newApprovalRequest.societyName) {
      this.newApprovalRequest.societyName = this.user.societyName || '';
    }

    this.refreshSocietyScannerCode();
    
    this.loadGuestManagementData();
  }
  
  /**
   * Close Guest Management Modal
   */
  closeGuestManagementModal(): void {
    this.stopApprovalCamera();
    this.stopExitCamera();
    this.showGuestManagementModal = false;
  }
  
  /**
   * Select Guest Management Tab
   */
  selectGuestManagementTab(tab: string): void {
    this.guestManagementTab = tab;
    // Load appropriate data based on tab
    if (tab === 'pre-approval') {
      this.loadPreApprovals();
    } else if (tab === 'pending-requests') {
      this.loadPendingApprovalRequests();
    } else if (tab === 'approval-logs') {
      this.loadApprovalLogs();
    }
  }

  refreshSocietyScannerCode(): void {
    const societyName = this.newApprovalRequest.societyName || this.user?.societyName;
    if (!societyName) {
      return;
    }

    this.guestManagementService.getSocietyScannerCode(societyName).subscribe({
      next: (res: any) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.currentVisitorEntryUrl = this.buildVisitorEntryUrl();
      },
      error: () => {
        this.currentSocietyScannerCode = '';
        this.currentVisitorEntryUrl = '';
      }
    });
  }

  generateSocietyScannerCode(): void {
    if (!this.user?.societyName || !this.user?.username) {
      return;
    }

    this.guestManagementService.generateSocietyScannerCode(this.user.societyName, this.user.username).subscribe({
      next: (res: any) => {
        this.currentSocietyScannerCode = res?.scannerCode || '';
        this.scannerCodeUpdatedAt = Number(res?.updatedAt || 0);
        this.currentVisitorEntryUrl = this.buildVisitorEntryUrl();
        this.newApprovalRequest.scannerCode = this.currentSocietyScannerCode;
        alert('Scanner code generated successfully for ' + this.user?.societyName);
      },
      error: (err: any) => {
        alert('Failed to generate scanner code: ' + (err?.error?.message || err?.message || 'Unknown error'));
      }
    });
  }

  applyScannedEntryPayload(): void {
    const raw = (this.newApprovalRequest.scannerPayload || '').trim();
    if (!raw) {
      this.approvalRequestSubmitMessage = '❌ Scanner payload is empty';
      return;
    }

    try {
      const payload = JSON.parse(raw);
      this.newApprovalRequest.scannerCode = payload.scannerCode || this.newApprovalRequest.scannerCode || '';
      this.newApprovalRequest.visitorType = payload.visitorType || this.newApprovalRequest.visitorType || 'GUEST';
      this.newApprovalRequest.serviceSubCategory = payload.serviceSubCategory || this.newApprovalRequest.serviceSubCategory || '';
      this.newApprovalRequest.visitorName = payload.visitorName || this.newApprovalRequest.visitorName || '';
      this.newApprovalRequest.visitorAadhaar = payload.visitorAadhaar || this.newApprovalRequest.visitorAadhaar || '';
      this.newApprovalRequest.visitorPhone = payload.visitorPhone || this.newApprovalRequest.visitorPhone || '';
      this.newApprovalRequest.tower = payload.tower || this.newApprovalRequest.tower || '';
      this.newApprovalRequest.apartmentNumber = payload.flatNumber || payload.apartmentNumber || this.newApprovalRequest.apartmentNumber || '';
      this.newApprovalRequest.ownerName = payload.ownerName || this.newApprovalRequest.ownerName || '';
      this.newApprovalRequest.ownerPhone = payload.ownerPhone || this.newApprovalRequest.ownerPhone || '';
      this.newApprovalRequest.faceCapture = payload.faceCapture || this.newApprovalRequest.faceCapture || '';
      this.newApprovalRequest.scannerSource = 'QR_SCAN';
      this.approvalRequestSubmitMessage = '✅ Scanner payload applied';
    } catch {
      this.approvalRequestSubmitMessage = '❌ Invalid scanner payload JSON';
    }
  }

  buildVisitorEntryUrl(): string {
    const scannerCode = (this.currentSocietyScannerCode || '').trim();
    const societyName = (this.user?.societyName || this.newApprovalRequest.societyName || '').trim();
    if (!scannerCode || !societyName) {
      return '';
    }

    const configuredBase = (this.visitorEntryPublicBaseUrl || '').trim();
    const fallbackBase = `${window.location.origin}${this.getVisitorEntryPath()}`;
    const baseUrl = configuredBase || fallbackBase;
    return `${baseUrl}?societyName=${encodeURIComponent(societyName)}&scannerCode=${encodeURIComponent(scannerCode)}`;
  }

  private getVisitorEntryPath(): string {
    const path = (window.location.pathname || '').toLowerCase();
    return path.startsWith('/dashboard-mfe') ? '/dashboard-mfe/visitor-entry' : '/visitor-entry';
  }

  saveVisitorEntryPublicBaseUrl(): void {
    const value = (this.visitorEntryPublicBaseUrl || '').trim().replace(/\/$/, '');
    this.visitorEntryPublicBaseUrl = value;

    if (!value) {
      localStorage.removeItem('visitorEntryPublicBaseUrl');
      this.currentVisitorEntryUrl = this.buildVisitorEntryUrl();
      alert('Public base URL cleared. Using current site URL.');
      return;
    }

    localStorage.setItem('visitorEntryPublicBaseUrl', value);
    this.currentVisitorEntryUrl = this.buildVisitorEntryUrl();
    alert('Public base URL saved. Generate/Refresh QR to publish updated link.');
  }

  async useCurrentLanIpForVisitorBaseUrl(): Promise<void> {
    const lanIp = await this.detectLanIpv4();
    if (!lanIp) {
      alert('Could not detect LAN IP automatically. Please enter it manually, for example: http://192.168.x.x:4203/dashboard-mfe/visitor-entry');
      return;
    }

    const protocol = window.location.protocol || 'http:';
    const port = window.location.port || '4203';
    this.visitorEntryPublicBaseUrl = `${protocol}//${lanIp}:${port}${this.getVisitorEntryPath()}`;
    this.saveVisitorEntryPublicBaseUrl();
  }

  private async detectLanIpv4(): Promise<string | null> {
    const host = (window.location.hostname || '').trim();
    if (this.isPrivateIpv4(host)) {
      return host;
    }

    const WebRtcCtor = (window as any).RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection;

    if (!WebRtcCtor) {
      return null;
    }

    return new Promise<string | null>((resolve) => {
      let settled = false;
      const finalize = (value: string | null) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };

      const pc = new WebRtcCtor({ iceServers: [] });
      const timeoutId = window.setTimeout(() => {
        try {
          pc.close();
        } catch {
          // Ignore close failures in fallback path.
        }
        finalize(null);
      }, 2500);

      pc.createDataChannel('lan-ip-detect');

      pc.onicecandidate = (event: any) => {
        const candidate = event?.candidate?.candidate || '';
        const match = candidate.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
        const ip = match?.[1] || null;
        if (ip && this.isPrivateIpv4(ip)) {
          window.clearTimeout(timeoutId);
          try {
            pc.close();
          } catch {
            // Ignore close failures in success path.
          }
          finalize(ip);
        }
      };

      pc.createOffer()
        .then((offer: any) => pc.setLocalDescription(offer))
        .catch(() => {
          window.clearTimeout(timeoutId);
          try {
            pc.close();
          } catch {
            // Ignore close failures in error path.
          }
          finalize(null);
        });
    });
  }

  private isPrivateIpv4(ip: string): boolean {
    if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) {
      return false;
    }

    const parts = ip.split('.').map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return false;
    }

    return parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168);
  }

  getVisitorEntryQrImageUrl(): string {
    const entryUrl = this.currentVisitorEntryUrl || this.buildVisitorEntryUrl();
    if (!entryUrl) {
      return '';
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(entryUrl)}`;
  }

  copyVisitorEntryLink(): void {
    const entryUrl = this.currentVisitorEntryUrl || this.buildVisitorEntryUrl();
    if (!entryUrl) {
      return;
    }

    navigator.clipboard.writeText(entryUrl)
      .then(() => alert('Visitor entry link copied'))
      .catch(() => alert('Unable to copy link. Please copy manually.'));
  }

  printVisitorEntryQr(): void {
    const qrImageUrl = this.getVisitorEntryQrImageUrl();
    const entryUrl = this.currentVisitorEntryUrl || this.buildVisitorEntryUrl();
    if (!qrImageUrl || !entryUrl) {
      alert('Generate scanner code first to print QR.');
      return;
    }

    const societyName = this.user?.societyName || this.newApprovalRequest.societyName || '';
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups and try again.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Visitor Entry QR - ${societyName}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 24px; }
            .card { border: 2px solid #333; border-radius: 12px; padding: 20px; display: inline-block; }
            img { width: 280px; height: 280px; }
            .meta { margin-top: 10px; font-size: 14px; word-break: break-all; max-width: 500px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${societyName} - Visitor Entry QR</h2>
            <p>Scan this QR code to submit visitor details.</p>
            <img src="${qrImageUrl}" alt="Visitor Entry QR">
            <div class="meta"><strong>Link:</strong><br>${entryUrl}</div>
            <div class="meta"><strong>Scanner Code:</strong> ${this.currentSocietyScannerCode || '-'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  onApprovalFaceCaptureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.newApprovalRequest.faceCapture = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  async openApprovalCamera(preferFrontCamera: boolean = true): Promise<void> {
    this.approvalCameraError = '';

    if (!this.isApprovalCameraSupported) {
      this.approvalCameraError = 'Camera is not supported on this browser/device.';
      return;
    }

    this.stopApprovalCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: preferFrontCamera ? { facingMode: { ideal: 'user' } } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.approvalCameraStream = stream;
      this.isApprovalCameraOpen = true;

      setTimeout(() => {
        const videoEl = document.getElementById('approvalCameraVideo') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(() => undefined);
        }
      });
    } catch {
      this.approvalCameraError = 'Unable to access camera. You can still upload a photo manually.';
      this.isApprovalCameraOpen = false;
    }
  }

  captureApprovalCameraPhoto(): void {
    const videoEl = document.getElementById('approvalCameraVideo') as HTMLVideoElement | null;
    if (!videoEl) {
      this.approvalCameraError = 'Camera preview is not available.';
      return;
    }

    const width = videoEl.videoWidth || 720;
    const height = videoEl.videoHeight || 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.approvalCameraError = 'Unable to capture photo from camera.';
      return;
    }

    ctx.drawImage(videoEl, 0, 0, width, height);
    this.newApprovalRequest.faceCapture = canvas.toDataURL('image/jpeg', 0.9);
    this.stopApprovalCamera();
  }

  clearApprovalCapturedPhoto(): void {
    this.newApprovalRequest.faceCapture = '';
  }

  stopApprovalCamera(): void {
    if (this.approvalCameraStream) {
      this.approvalCameraStream.getTracks().forEach((track) => track.stop());
      this.approvalCameraStream = null;
    }
    this.isApprovalCameraOpen = false;
  }

  canShowFaceCaptureImage(faceCapture?: string): boolean {
    const raw = (faceCapture || '').trim().toLowerCase();
    return raw.startsWith('data:image/') || raw.startsWith('http://') || raw.startsWith('https://');
  }
  
  /**
   * Load all guest management data
   */
  loadGuestManagementData(): void {
    if (this.user) {
      this.loadPreApprovals();
      this.loadPendingApprovalRequests();
      if (this.isSecurityGuard()) {
        this.loadApprovalLogs();
      }
    }
  }
  
  /**
   * Check if user is security guard (role-based)
   */
  isSecurityGuard(): boolean {
    if (!this.user) return false;
    
    const role = (this.user.role || '').toUpperCase();
    const userType = (this.user.userType || '').toLowerCase();
    const ownerType = (this.user.ownerType || '').toLowerCase();

    // Admin users should never be treated as security users in quick action routing.
    if (this.isAdminUser()) {
      return false;
    }
    
    // Support common variants seen across seed/import/admin-created data.
    const normalizedRole = role.replace(/[-\s]/g, '_');
    const normalizedUserType = userType.replace(/[-\s]/g, '_');
    const normalizedOwnerType = ownerType.replace(/[-\s]/g, '_');

        return normalizedRole === 'SECURITY' ||
          normalizedRole === 'SECURITY_GUARD' ||
          normalizedUserType === 'security' ||
          normalizedUserType === 'security_guard' ||
          normalizedOwnerType === 'security' ||
          normalizedOwnerType === 'security_guard';
  }
  
  /**
   * Load Pre-Approvals for current user's apartment
   */
  loadPreApprovals(): void {
    if (!this.user) return;

    // Security user: view society-wide pre-approvals.
    // Normal user: view apartment-specific pre-approvals.
    const apartmentNumber = this.isSecurityGuard()
      ? null
      : `${this.user.towerNumber}-${this.user.flatNumber}`;
    const societyName = this.user.societyName;
    
    this.guestManagementService.getPreApprovals(apartmentNumber, societyName)
      .subscribe({
        next: (data) => {
          this.preApprovals = data;
          console.log(`Loaded ${data.length} pre-approvals`);
        },
        error: (err) => {
          console.error('Error loading pre-approvals:', err);
        }
      });
  }
  
  /**
   * Create new Pre-Approval
   */
  submitPreApproval(): void {
    if (!this.user) return;
    
    this.isSubmittingPreApproval = true;
    this.preApprovalSubmitMessage = '';
    
    // Populate apartment and society from user
    this.newPreApproval.apartmentNumber = this.user.flatNumber;
    this.newPreApproval.societyName = this.user.societyName;
    this.newPreApproval.createdBy = this.user.username;
    
    this.guestManagementService.createPreApproval(this.newPreApproval)
      .subscribe({
        next: (created) => {
          this.preApprovalSubmitMessage = '✅ Pre-approval created successfully!';
          this.isSubmittingPreApproval = false;
          this.loadPreApprovals();
          
          // Reset form
          this.newPreApproval = {
            apartmentNumber: '',
            societyName: '',
            visitorType: 'GUEST',
            visitorName: '',
            visitorPhone: '',
            validFrom: '',
            validUntil: '',
            description: '',
            createdBy: ''
          };
          
          setTimeout(() => {
            this.preApprovalSubmitMessage = '';
          }, 3000);
        },
        error: (err) => {
          this.preApprovalSubmitMessage = '❌ Error creating pre-approval: ' + err.error?.error;
          this.isSubmittingPreApproval = false;
        }
      });
  }
  
  /**
   * Revoke a Pre-Approval
   */
  revokePreApproval(id: number): void {
    if (!this.user) return;
    
    if (confirm('Are you sure you want to revoke this pre-approval?')) {
      this.guestManagementService.revokePreApproval(id, this.user.username)
        .subscribe({
          next: () => {
            console.log('Pre-approval revoked');
            this.loadPreApprovals();
          },
          error: (err) => {
            console.error('Error revoking pre-approval:', err);
          }
        });
    }
  }
  
  /**
   * Load Pending Approval Requests
   */
  loadPendingApprovalRequests(): void {
    if (!this.user) return;
    
    const societyName = this.user.societyName;

    if (this.isSecurityGuard()) {
      // Security user: pending requests across the mapped society.
      this.guestManagementService.getAllRequests(null, societyName)
        .subscribe({
          next: (data) => {
            const pending = data.filter(req => (req.status || 'PENDING').toUpperCase() === 'PENDING');
            this.pendingApprovalRequests = pending;
            this.unreadApprovalsCount = pending.length;
            console.log(`Loaded ${pending.length} society-level pending approval requests for security`);
          },
          error: (err) => {
            console.error('Error loading society pending requests for security:', err);
            this.pendingApprovalRequests = [];
          }
        });
      return;
    }

    // Normal user: pending requests for current apartment.
    const apartmentNumber = `${this.user.towerNumber}-${this.user.flatNumber}`;

    this.guestManagementService.getPendingRequests(apartmentNumber, societyName)
      .subscribe({
        next: (data) => {
          this.pendingApprovalRequests = data;
          this.unreadApprovalsCount = data.length;
          console.log(`Loaded ${data.length} pending approval requests`);
        },
        error: (err) => {
          console.error('Error loading pending requests:', err);
          this.pendingApprovalRequests = [];
        }
      });
  }
  
  /**
   * Approve an Approval Request
   */
  approveApprovalRequest(requestId: number): void {
    if (!this.user) return;
    
    if (confirm('Approve this visitor entry?')) {
      this.guestManagementService.approveRequest(requestId, this.user.username, 'Approved from dashboard')
        .subscribe({
          next: () => {
            alert('✅ Approval request approved!');
            this.loadPendingApprovalRequests();
            this.loadApprovalLogs();
          },
          error: (err) => {
            alert('❌ Error approving request: ' + err.error?.error);
          }
        });
    }
  }
  
  /**
   * Reject an Approval Request
   */
  rejectApprovalRequest(requestId: number): void {
    if (!this.user) return;
    
    const reason = prompt('Enter reason for rejection (optional):');
    if (reason !== null) {
      this.guestManagementService.rejectRequest(requestId, this.user.username, reason)
        .subscribe({
          next: () => {
            alert('✅ Approval request rejected!');
            this.loadPendingApprovalRequests();
          },
          error: (err) => {
            alert('❌ Error rejecting request: ' + err.error?.error);
          }
        });
    }
  }
  
  /**
   * Security: Create Approval Request
   */
  async submitApprovalRequest(): Promise<void> {
    if (!this.user) return;
    
    // Validate required fields
    if (!this.newApprovalRequest.societyName || !this.newApprovalRequest.societyName.trim()) {
      this.approvalRequestSubmitMessage = '❌ Society Name is required';
      return;
    }
    
    if (!this.newApprovalRequest.tower || !this.newApprovalRequest.apartmentNumber) {
      this.approvalRequestSubmitMessage = '❌ Tower and Apartment Number are required';
      return;
    }
    
    if (!this.newApprovalRequest.visitorName) {
      this.approvalRequestSubmitMessage = '❌ Visitor Name is required';
      return;
    }
    
    if (!this.newApprovalRequest.residentPhone) {
      // Fall back to owner phone captured from scanner entry
      this.newApprovalRequest.residentPhone = this.newApprovalRequest.ownerPhone || '';
      if (!this.newApprovalRequest.residentPhone) {
        this.approvalRequestSubmitMessage = '❌ Resident Phone is required for SMS notification';
        return;
      }
    }

    if (this.newApprovalRequest.scannerSource === 'QR_SCAN' && this.currentSocietyScannerCode) {
      if (this.newApprovalRequest.scannerCode !== this.currentSocietyScannerCode) {
        this.approvalRequestSubmitMessage = '❌ Scanner code mismatch for this society';
        return;
      }
    }

    this.newApprovalRequest.faceCapture = await this.compressImageDataUrlIfNeeded(this.newApprovalRequest.faceCapture);
    
    this.isSubmittingApprovalRequest = true;
    this.approvalRequestSubmitMessage = '';
    
    // Use the society name entered in the form (not security guard's society)
    this.newApprovalRequest.requestedBy = this.user.username;

    // Persist selected service details inside existing purpose field (schema-safe).
    const selectedService = this.getSelectedServiceName(this.newApprovalRequest);
    if (selectedService) {
      const existingPurpose = (this.newApprovalRequest.purpose || '').trim();
      const serviceTag = `[Service: ${selectedService}]`;
      this.newApprovalRequest.purpose = existingPurpose ? `${serviceTag} ${existingPurpose}` : serviceTag;
    }
    
    // FIX: Combine tower and flat number to match resident's apartment format
    // Format: "Tower-FlatNumber" (e.g., "Tower 3-B12")
    const formattedApartmentNumber = `${this.newApprovalRequest.tower}-${this.newApprovalRequest.apartmentNumber}`;
    this.newApprovalRequest.apartmentNumber = formattedApartmentNumber;
    
    console.log('[Approval Request] ====================================');
    console.log('[Approval Request] Creating request for:');
    console.log('[Approval Request] Society:', this.newApprovalRequest.societyName);
    console.log('[Approval Request] Apartment:', formattedApartmentNumber);
    console.log('[Approval Request] Visitor:', this.newApprovalRequest.visitorName);
    console.log('[Approval Request] Resident Phone:', this.newApprovalRequest.residentPhone);
    console.log('[Approval Request] ====================================');
    
    this.guestManagementService.createApprovalRequest(this.newApprovalRequest)
      .subscribe({
        next: (created) => {
          this.approvalRequestSubmitMessage = '✅ Approval request created! SMS sent to resident. Request tracked in Approval Logs.';
          this.isSubmittingApprovalRequest = false;
          
          // Reload approval logs to show the new request in tracking table
          this.loadApprovalLogs();
          
          // Reset form - keep societyName pre-filled from user session
          this.newApprovalRequest = {
            apartmentNumber: '',
            societyName: this.user?.societyName || '',
            tower: '',
            visitorType: 'GUEST',
            serviceSubCategory: '',
            visitorName: '',
            visitorPhone: '',
            visitorAadhaar: '',
            visitorIdProof: '',
            ownerName: '',
            ownerPhone: '',
            faceCapture: '',
            scannerCode: this.currentSocietyScannerCode || '',
            scannerSource: 'MANUAL',
            scannerPayload: '',
            purpose: '',
            requestedBy: '',
            residentPhone: ''
          };
          
          setTimeout(() => {
            this.approvalRequestSubmitMessage = '';
          }, 3000);
        },
        error: (err) => {
          this.approvalRequestSubmitMessage = '❌ Error creating request: ' + err.error?.error;
          this.isSubmittingApprovalRequest = false;
        }
      });
  }

  private async compressImageDataUrlIfNeeded(dataUrl: string): Promise<string> {
    const raw = (dataUrl || '').trim();
    if (!raw.startsWith('data:image/')) {
      return dataUrl;
    }

    try {
      const image = await this.loadImageFromDataUrl(raw);
      const maxWidth = 960;
      const maxHeight = 960;
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return dataUrl;
      }

      // Resize before submit to reduce payload while preserving visitor identification quality.
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.7);
    } catch {
      return dataUrl;
    }
  }

  private loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Unable to load image for compression'));
      image.src = dataUrl;
    });
  }
  
  /**
   * Load Approval Logs (Security Dashboard)
   */
  loadApprovalLogs(): void {
    if (!this.user) return;
    
    const societyName = this.user.societyName;
    
    console.log('[Approval Logs] Loading logs for society:', societyName);
    
    // Load all approval requests (for tracking)
    this.guestManagementService.getAllRequests(null, societyName)
      .subscribe({
        next: (data) => {
          this.allApprovalRequests = data;
          this.filteredApprovalRequests = data;
          console.log(`[Approval Logs] Loaded ${data.length} approval requests`);
        },
        error: (err) => {
          console.error('[Approval Logs] Error loading approval requests:', err);
          this.allApprovalRequests = [];
        }
      });
    
    // Load visitor logs (approved entries)
    this.guestManagementService.getApprovalLogs(societyName)
      .subscribe({
        next: (data) => {
          // Populate societyName from user session if the log entry has it missing
          const userSociety = this.user?.societyName || '';
          this.approvalLogs = data.map((log: ApprovalLog) => ({
            ...log,
            societyName: log.societyName || userSociety
          }));
          this.filterApprovalLogsBySociety();
          console.log(`[Approval Logs] Loaded ${data.length} visitor log entries`);
        },
        error: (err) => {
          console.error('[Approval Logs] Error loading approval logs:', err);
          this.approvalLogs = [];
          this.filteredApprovalLogs = [];
        }
      });
    
    // Load active visitors
    this.guestManagementService.getActiveVisitors(societyName)
      .subscribe({
        next: (data) => {
          this.activeVisitors = data;
          console.log(`${data.length} active visitors currently in society`);
        },
        error: (err) => {
          console.error('Error loading active visitors:', err);
        }
      });
  }
  
  getExitQrPayload(log: ApprovalLog): string {
    return JSON.stringify({
      type: 'VISITOR_EXIT',
      logId: log.id,
      societyName: log.societyName || this.user?.societyName || '',
      visitorName: log.visitorName || '',
      apartmentNumber: log.apartmentNumber || ''
    });
  }

  getExitQrImageUrl(log: ApprovalLog): string {
    const payload = this.getExitQrPayload(log);
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(payload)}`;
  }

  toggleExitQr(logId: number): void {
    this.showExitQrForLogId = this.showExitQrForLogId === logId ? null : logId;
  }

  copyExitQrPayload(log: ApprovalLog): void {
    const payload = this.getExitQrPayload(log);
    navigator.clipboard.writeText(payload)
      .then(() => alert('Exit payload copied'))
      .catch(() => alert('Unable to copy exit payload.'));
  }

  applyExitScannerPayload(): void {
    const raw = (this.exitScannerPayload || '').trim();
    if (!raw) {
      alert('Exit payload is empty.');
      return;
    }

    try {
      const payload = JSON.parse(raw);
      const logId = Number(payload?.logId);
      if (!Number.isFinite(logId)) {
        alert('Invalid exit payload: missing logId.');
        return;
      }

      const visitor = this.activeVisitors.find(v => v.id === logId);
      if (!visitor) {
        alert('Visitor not found in active list. Refresh and try again.');
        return;
      }

      this.setSelectedExitVisitor(visitor);
      alert(`Exit target selected: ${visitor.visitorName || 'Visitor'} (${visitor.apartmentNumber || '-'})`);
    } catch {
      alert('Invalid JSON payload for exit scan.');
    }
  }

  setSelectedExitVisitor(visitor: ApprovalLog): void {
    this.selectedExitLogId = visitor.id || null;
    this.selectedExitVisitorName = visitor.visitorName || '';
    this.selectedExitEntryFaceCapture = visitor.faceCapture || '';
    this.exitFaceCapture = '';
    this.exitMatchConfidence = null;
    this.stopExitCamera();
  }

  async openExitCamera(preferFrontCamera: boolean = true): Promise<void> {
    this.exitCameraError = '';

    if (!this.isExitCameraSupported) {
      this.exitCameraError = 'Camera is not supported on this browser/device.';
      return;
    }

    this.stopExitCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: preferFrontCamera ? { facingMode: { ideal: 'user' } } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.exitCameraStream = stream;
      this.isExitCameraOpen = true;

      setTimeout(() => {
        const videoEl = document.getElementById('exitCameraVideo') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.play().catch(() => undefined);
        }
      });
    } catch {
      this.exitCameraError = 'Unable to access camera for exit verification.';
      this.isExitCameraOpen = false;
    }
  }

  async captureExitCameraPhoto(): Promise<void> {
    const videoEl = document.getElementById('exitCameraVideo') as HTMLVideoElement | null;
    if (!videoEl) {
      this.exitCameraError = 'Exit camera preview is not available.';
      return;
    }

    const width = videoEl.videoWidth || 720;
    const height = videoEl.videoHeight || 540;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.exitCameraError = 'Unable to capture exit photo.';
      return;
    }

    ctx.drawImage(videoEl, 0, 0, width, height);
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    this.exitFaceCapture = await this.compressImageDataUrlIfNeeded(rawDataUrl);
    this.stopExitCamera();
    await this.computeExitMatchConfidence();
  }

  async onExitFaceCaptureSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = String(reader.result || '');
      this.exitFaceCapture = await this.compressImageDataUrlIfNeeded(raw);
      await this.computeExitMatchConfidence();
    };
    reader.readAsDataURL(file);
  }

  clearExitPhoto(): void {
    this.exitFaceCapture = '';
    this.exitMatchConfidence = null;
  }

  stopExitCamera(): void {
    if (this.exitCameraStream) {
      this.exitCameraStream.getTracks().forEach((track) => track.stop());
      this.exitCameraStream = null;
    }
    this.isExitCameraOpen = false;
  }

  async markVisitorExit(logId?: number): Promise<void> {
    if (!this.user) return;

    const targetLogId = Number(logId || this.selectedExitLogId || 0);
    if (!targetLogId) {
      alert('Select an active visitor to mark exit.');
      return;
    }

    if (!confirm('Mark this visitor as exited?')) {
      return;
    }

    const hasQrPayload = !!(this.exitScannerPayload || '').trim();
    const hasExitPhoto = !!(this.exitFaceCapture || '').trim();
    const exitMethod = hasQrPayload ? 'QR_SCAN' : (hasExitPhoto ? 'PHOTO_VERIFIED' : 'MANUAL');
    const compressedExitPhoto = await this.compressImageDataUrlIfNeeded(this.exitFaceCapture || '');

    this.guestManagementService.markExit(targetLogId, {
      securityGuard: this.user.username,
      exitMethod,
      exitFaceCapture: compressedExitPhoto || undefined,
      exitMatchConfidence: this.exitMatchConfidence
    })
      .subscribe({
        next: () => {
          alert('✅ Exit marked successfully!');
          this.exitScannerPayload = '';
          this.selectedExitLogId = null;
          this.selectedExitVisitorName = '';
          this.selectedExitEntryFaceCapture = '';
          this.exitFaceCapture = '';
          this.exitMatchConfidence = null;
          this.stopExitCamera();
          this.loadApprovalLogs();
        },
        error: (err) => {
          alert('❌ Error marking exit: ' + err.error?.error);
        }
      });
  }

  private async computeExitMatchConfidence(): Promise<void> {
    this.exitMatchConfidence = null;
    const entryPhoto = (this.selectedExitEntryFaceCapture || '').trim();
    const exitPhoto = (this.exitFaceCapture || '').trim();
    if (!entryPhoto.startsWith('data:image/') || !exitPhoto.startsWith('data:image/')) {
      return;
    }

    try {
      const [entryImg, exitImg] = await Promise.all([
        this.loadImageFromDataUrl(entryPhoto),
        this.loadImageFromDataUrl(exitPhoto)
      ]);

      const size = 32;
      const entryCanvas = document.createElement('canvas');
      entryCanvas.width = size;
      entryCanvas.height = size;
      const exitCanvas = document.createElement('canvas');
      exitCanvas.width = size;
      exitCanvas.height = size;

      const eCtx = entryCanvas.getContext('2d');
      const xCtx = exitCanvas.getContext('2d');
      if (!eCtx || !xCtx) {
        return;
      }

      eCtx.drawImage(entryImg, 0, 0, size, size);
      xCtx.drawImage(exitImg, 0, 0, size, size);

      const entryData = eCtx.getImageData(0, 0, size, size).data;
      const exitData = xCtx.getImageData(0, 0, size, size).data;

      let totalDiff = 0;
      let pixels = 0;
      for (let i = 0; i < entryData.length; i += 4) {
        const eGray = (entryData[i] + entryData[i + 1] + entryData[i + 2]) / 3;
        const xGray = (exitData[i] + exitData[i + 1] + exitData[i + 2]) / 3;
        totalDiff += Math.abs(eGray - xGray);
        pixels += 1;
      }

      const normalizedDiff = totalDiff / Math.max(1, pixels * 255);
      const confidence = Math.max(0, Math.min(100, Math.round((1 - normalizedDiff) * 100)));
      this.exitMatchConfidence = confidence;
    } catch {
      this.exitMatchConfidence = null;
    }
  }
  
  /**
   * Filter approval logs by search query
   */
  filterApprovalLogs(): void {
    if (!this.approvalLogSearchQuery.trim()) {
      this.filteredApprovalLogs = this.approvalLogs;
      return;
    }
    
    const query = this.approvalLogSearchQuery.toLowerCase();
    this.filteredApprovalLogs = this.approvalLogs.filter(log => 
      (log.visitorName && log.visitorName.toLowerCase().includes(query)) ||
      (log.apartmentNumber && log.apartmentNumber.toLowerCase().includes(query)) ||
      (log.visitorType && log.visitorType.toLowerCase().includes(query)) ||
      (log.visitorPhone && log.visitorPhone.includes(query))
    );
  }
  
  /**
   * Filter Approval Requests by search query
   */
  filterApprovalRequests(): void {
    if (!this.approvalRequestSearchQuery.trim()) {
      this.filteredApprovalRequests = this.allApprovalRequests;
      return;
    }
    
    const query = this.approvalRequestSearchQuery.toLowerCase();
    this.filteredApprovalRequests = this.allApprovalRequests.filter(req =>
      (req.visitorName && req.visitorName.toLowerCase().includes(query)) ||
      (req.apartmentNumber && req.apartmentNumber.toLowerCase().includes(query)) ||
      (req.visitorPhone && req.visitorPhone.toLowerCase().includes(query)) ||
      (req.visitorType && req.visitorType.toLowerCase().includes(query)) ||
      (req.status && req.status.toLowerCase().includes(query)) ||
      (req.requestedBy && req.requestedBy.toLowerCase().includes(query))
    );
  }
  
  /**
   * Get status badge style class
   */
  getRequestStatusClass(status: string | undefined): string {
    if (!status) return 'status-pending';
    switch(status.toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      default: return 'status-pending';
    }
  }
  
  // ===================================================================
  // POP-UP NOTIFICATION SYSTEM - Security Request Alerts
  // ===================================================================
  
  /**
   * Start polling for new approval requests every 10 seconds
   */
  startApprovalRequestPolling(): void {
    console.log('🔔 Starting approval request polling for real-time notifications...');
    
    // Initial load
    this.checkForNewApprovalRequests();
    
    // Poll every 120 seconds for minimal UI jitter
    this.pollingInterval = setInterval(() => {
      this.checkForNewApprovalRequests();
    }, 120000);
  }
  
  /**
   * Check for new approval requests and show pop-up
   */
  checkForNewApprovalRequests(): void {
    if (!this.user || this.isAdminUser()) {
      console.log('[Pop-up Check] Skipping - no user or is admin');
      return;
    }
    
    const apartmentNumber = `${this.user.towerNumber}-${this.user.flatNumber}`;
    
    console.log(`[Pop-up Check] Checking for pending requests for apartment: ${apartmentNumber}, society: ${this.user.societyName}`);
    
    this.guestManagementService.getPendingRequestsForApartment(apartmentNumber, this.user.societyName)
      .subscribe({
        next: (requests: ApprovalRequest[]) => {
          console.log(`[Pop-up Check] Found ${requests.length} total pending request(s)`);
          
          // Filter for new requests only (not yet processed)
          const newRequests = requests.filter((req: ApprovalRequest) => 
            req.id && req.id > this.lastCheckedRequestId && req.status === 'PENDING'
          );
          
          if (newRequests.length > 0) {
            console.log(`🔔 [Pop-up Alert] Found ${newRequests.length} NEW approval request(s)!`);
            console.log('[Pop-up Alert] New requests:', newRequests.map(r => ({ id: r.id, visitor: r.visitorName, type: r.visitorType })));
            
            // Add to queue
            this.popupRequestQueue.push(...newRequests);
            
            // Update last checked ID
            const maxId = Math.max(...newRequests.map((r: ApprovalRequest) => r.id || 0));
            this.lastCheckedRequestId = Math.max(this.lastCheckedRequestId, maxId);
            console.log(`[Pop-up Alert] Updated lastCheckedRequestId to: ${this.lastCheckedRequestId}`);
            
            // Show first request if not already showing
            if (!this.showApprovalPopup) {
              console.log('[Pop-up Alert] Showing pop-up notification...');
              this.showNextApprovalPopup();
            } else {
              console.log('[Pop-up Alert] Pop-up already showing, request added to queue');
            }
          } else {
            console.log('[Pop-up Check] No new requests (lastCheckedRequestId:', this.lastCheckedRequestId, ')');
          }
          
          // Update unread count
          this.unreadApprovalsCount = requests.length;
        },
        error: (err: any) => {
          console.error('[Pop-up Check] Error checking for approval requests:', err);
        }
      });
  }
  
  /**
   * Show next approval request from queue
   */
  async showNextApprovalPopup(): Promise<void> {
    if (this.popupRequestQueue.length === 0) {
      this.showApprovalPopup = false;
      this.currentApprovalRequest = null;
      this.popupFaceCapturePreview = '';
      return;
    }
    
    this.currentApprovalRequest = this.popupRequestQueue[0];
    await this.setPopupFacePreview(this.currentApprovalRequest);
    this.showApprovalPopup = true;
    
    // Play notification sound (optional)
    this.playNotificationSound();
  }
  
  /**
   * Get vendor logo/emoji based on visitor name or type
   */
  getVendorLogo(request: ApprovalRequest): string {
    if (!request) return this.vendorLogos['default_guest'];
    const name = request.visitorName ? request.visitorName.toLowerCase() : '';
    const type = request.visitorType ? request.visitorType.toLowerCase() : '';
    
    // Check for known vendors
    if (name.includes('swiggy') || name.includes('swigy')) return this.vendorLogos['swiggy'];
    if (name.includes('zomato')) return this.vendorLogos['zomato'];
    if (name.includes('uber')) return this.vendorLogos['uber'];
    if (name.includes('ola')) return this.vendorLogos['ola'];
    if (name.includes('rapido')) return this.vendorLogos['rapido'];
    if (name.includes('amazon')) return this.vendorLogos['amazon'];
    if (name.includes('flipkart')) return this.vendorLogos['flipkart'];
    if (name.includes('bigbasket') || name.includes('big basket')) return this.vendorLogos['bigbasket'];
    if (name.includes('blinkit')) return this.vendorLogos['blinkit'];
    if (name.includes('zepto')) return this.vendorLogos['zepto'];
    if (name.includes('dunzo')) return this.vendorLogos['dunzo'];
    if (name.includes('porter')) return this.vendorLogos['porter'];
    
    // Default by type
    if (type.includes('delivery')) return this.vendorLogos['default_delivery'];
    if (type.includes('cab')) return this.vendorLogos['default_cab'];
    if (type.includes('vendor')) return this.vendorLogos['default_vendor'];
    if (type.includes('help')) return this.vendorLogos['default_help'];
    
    return this.vendorLogos['default_guest'];
  }
  
  /**
   * Approve request from pop-up
   */
  approvePopupRequest(): void {
    if (!this.currentApprovalRequest || !this.user) return;
    
    const requestId = this.currentApprovalRequest.id;
    if (!requestId) return;
    
    this.guestManagementService.approveRequest(requestId, this.user.username, 'Approved from popup')
      .subscribe({
        next: () => {
          console.log('✅ Request approved from popup');
          
          // Remove from queue
          this.popupRequestQueue.shift();
          
          // Update counts
          this.unreadApprovalsCount = Math.max(0, this.unreadApprovalsCount - 1);
          
          // Show next request or close popup
          this.showNextApprovalPopup();
        },
        error: (err) => {
          alert('❌ Error approving request: ' + err.error?.error);
        }
      });
  }
  
  /**
   * Reject request from pop-up
   */
  rejectPopupRequest(): void {
    if (!this.currentApprovalRequest || !this.user) return;
    
    const requestId = this.currentApprovalRequest.id;
    if (!requestId) return;
    
    this.guestManagementService.rejectRequest(requestId, this.user.username, 'Rejected from popup')
      .subscribe({
        next: () => {
          console.log('✅ Request rejected from popup');
          
          // Remove from queue
          this.popupRequestQueue.shift();
          
          // Update counts
          this.unreadApprovalsCount = Math.max(0, this.unreadApprovalsCount - 1);
          
          // Show next request or close popup
          this.showNextApprovalPopup();
        },
        error: (err) => {
          alert('❌ Error rejecting request: ' + err.error?.error);
        }
      });
  }
  
  /**
   * Close pop-up and show next request
   */
  closeApprovalPopup(): void {
    this.popupRequestQueue.shift();
    this.showNextApprovalPopup();
  }

  private async setPopupFacePreview(request: ApprovalRequest | null): Promise<void> {
    this.popupFaceCapturePreview = '';
    const raw = (request?.faceCapture || '').trim();
    if (!raw) {
      return;
    }

    // For remote image URLs, use the provided path directly.
    if (!raw.startsWith('data:image/')) {
      this.popupFaceCapturePreview = raw;
      return;
    }

    const requestId = Number(request?.id || 0);
    if (requestId > 0 && this.popupFaceCaptureCache.has(requestId)) {
      this.popupFaceCapturePreview = this.popupFaceCaptureCache.get(requestId) || '';
      return;
    }

    const compressed = await this.compressImageDataUrlForPopup(raw);
    this.popupFaceCapturePreview = compressed;
    if (requestId > 0) {
      this.popupFaceCaptureCache.set(requestId, compressed);
    }
  }

  private async compressImageDataUrlForPopup(dataUrl: string): Promise<string> {
    const raw = (dataUrl || '').trim();
    if (!raw.startsWith('data:image/')) {
      return dataUrl;
    }

    try {
      const image = await this.loadImageFromDataUrl(raw);
      const maxWidth = 220;
      const maxHeight = 220;
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return dataUrl;
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      return canvas.toDataURL('image/jpeg', 0.65);
    } catch {
      return dataUrl;
    }
  }
  
  /**
   * Play notification sound for incoming request
   */
  playNotificationSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e: any) {
      console.log('Unable to play notification sound:', e);
    }
  }

  ngOnDestroy(): void {
    this.stopApprovalCamera();
    this.stopExitCamera();
    this.destroy$.next();
    this.destroy$.complete();
    // Clear polling interval
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}
