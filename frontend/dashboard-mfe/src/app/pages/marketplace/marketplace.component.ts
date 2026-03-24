import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

interface BackendProduct {
  id: number;
  productName: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  sellerId: string;
  seller: string;
  image: string;
  stock: number;
  status: string;
  createdAt: string;
}

interface CartItem {
  product: BackendProduct;
  quantity: number;
}

interface Order {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
  paymentStatus: string;
  paymentMethod?: string;
}

type CheckoutStep = 'summary' | 'payment';

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank',
  'Bank of Baroda', 'Punjab National Bank', 'Canara Bank', 'Union Bank of India',
  'IndusInd Bank', 'Yes Bank', 'IDFC First Bank', 'Federal Bank', 'South Indian Bank'
];

const EN = {
  searchPlaceholder: 'Search AMP.in',
  allCategories: 'All Categories',
  accountLists: 'Account & Lists',
  returnsOrders: 'Returns & Orders',
  cart: 'Cart',
  deliverTo: 'Delivering To',
  chooseLocation: 'Choose your location',
  locationNote: 'Delivery options and delivery speed may vary for different locations',
  signInToUpdate: 'Sign in to update your location',
  addToCart: 'Add to Cart',
  outOfStock: 'Out of Stock',
  soldBy: 'Sold by',
  sellerPortal: 'Sell on AMP.in',
  backToDashboard: 'Back',
  hello: 'Hello',
  browseProducts: 'Browse Products',
  shoppingCart: 'Shopping Cart',
  myOrders: 'My Orders',
  proceedToCheckout: 'Proceed to Checkout',
  orderSummary: 'Order Summary',
  items: 'Items',
  delivery: 'Delivery',
  free: 'FREE',
  total: 'Order Total',
  emptyCart: 'Your cart is empty',
  noOrders: 'No orders yet',
  startShopping: 'Start Shopping',
  newest: 'Newest First',
  priceLowHigh: 'Price: Low -> High',
  priceHighLow: 'Price: High -> Low',
  allSellers: 'All Sellers',
  inStock: 'In Stock',
  pincode: 'Enter a 6-digit pincode',
  updateLocation: 'Apply',
  useMyLocation: 'Use my location',
  noProducts: 'No products found',
  signOut: 'Sign Out'
};

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit, OnDestroy {
  private readonly API = 'http://localhost:8002/api/cr-marketplace';

  user: any = null;
  activeView = 'browse';

  languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'Hindi' },
    { code: 'ta', label: 'Tamil' },
    { code: 'te', label: 'Telugu' },
    { code: 'kn', label: 'Kannada' },
    { code: 'ml', label: 'Malayalam' },
    { code: 'bn', label: 'Bengali' },
    { code: 'mr', label: 'Marathi' },
    { code: 'gu', label: 'Gujarati' },
    { code: 'pa', label: 'Punjabi' },
    { code: 'or', label: 'Odia' },
    { code: 'as', label: 'Assamese' }
  ];
  currentLang = 'en';
  t = EN;
  showLangMenu = false;

  deliveryPincode = '';
  deliveryCity = 'India';
  showLocationPopup = false;
  pincodeInput = '';

  searchQuery = '';
  searchCategory = 'all';
  searchSuggestions: BackendProduct[] = [];
  showSuggestions = false;
  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  products: BackendProduct[] = [];
  loadingProducts = false;
  selectedCategory = 'all';
  selectedSellerId = '';
  sortOrder = 'newest';
  sellers: Array<{ id: string; name: string }> = [];

  cart: CartItem[] = [];
  orders: Order[] = [];
  loadingOrders = false;
  paymentMethods = ['UPI', 'Credit/Debit Card', 'Net Banking', 'Cash on Delivery'];
  selectedPaymentMethod = 'UPI';
  checkoutStep: CheckoutStep = 'summary';
  isPlacingOrder = false;

  // In-app payment gateway state
  pendingGatewayOrder: any = null;
  upiId = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardHolder = '';
  selectedBank = '';
  banks = BANKS;
  isProcessingPayment = false;
  gatewayPaymentSuccess = false;

  cartNotice = '';
  recentlyAddedProductId: number | null = null;

  showAccountMenu = false;

  categories = [
    { id: 'all', name: 'All', icon: 'All' },
    { id: 'electronics', name: 'Electronics', icon: 'Elec' },
    { id: 'furniture', name: 'Furniture', icon: 'Home' },
    { id: 'groceries', name: 'Groceries', icon: 'Food' },
    { id: 'books', name: 'Books', icon: 'Books' },
    { id: 'clothing', name: 'Clothing', icon: 'Style' },
    { id: 'sports', name: 'Sports', icon: 'Sport' },
    { id: 'others', name: 'Others', icon: 'Other' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCart();
    this.loadProducts();
    this.loadSellers();
    this.setupSearch();

    const savedLang = localStorage.getItem('amp_lang');
    if (savedLang) {
      this.currentLang = savedLang;
    }

    const savedLoc = localStorage.getItem('amp_delivery_location');
    if (savedLoc) {
      const loc = JSON.parse(savedLoc);
      this.deliveryPincode = loc.pincode || '';
      this.deliveryCity = loc.city || 'India';
    }
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  get currentLanguageLabel(): string {
    return this.languages.find((lang) => lang.code === this.currentLang)?.label || 'English';
  }

  get locationDisplay(): string {
    if (this.deliveryPincode && this.deliveryCity && this.deliveryCity !== this.deliveryPincode) {
      return `${this.deliveryCity} - ${this.deliveryPincode}`;
    }
    return this.deliveryCity || this.deliveryPincode || 'India';
  }

  setLanguage(code: string): void {
    this.currentLang = code;
    localStorage.setItem('amp_lang', code);
    this.showLangMenu = false;
  }

  openLocationPopup(): void {
    this.showLocationPopup = true;
    this.pincodeInput = this.deliveryPincode;
  }

  closeLocationPopup(): void {
    this.showLocationPopup = false;
  }

  applyLocation(): void {
    if (/^\d{6}$/.test(this.pincodeInput)) {
      this.deliveryPincode = this.pincodeInput;
      this.deliveryCity = 'Locating city...';
      this.resolveCityByPincode(this.deliveryPincode);
      this.showLocationPopup = false;
    }
  }

  resolveCityByPincode(pin: string): void {
    this.http.get<any[]>(`https://api.postalpincode.in/pincode/${pin}`).subscribe(
      (res) => {
        const first = Array.isArray(res) ? res[0] : null;
        const postOffice = first?.PostOffice?.[0];
        const city = postOffice?.District || postOffice?.Division || postOffice?.State || `PIN ${pin}`;
        this.deliveryCity = city;
        localStorage.setItem('amp_delivery_location', JSON.stringify({
          pincode: pin,
          city
        }));
      },
      () => {
        this.deliveryCity = `PIN ${pin}`;
        localStorage.setItem('amp_delivery_location', JSON.stringify({
          pincode: pin,
          city: this.deliveryCity
        }));
      }
    );
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        this.deliveryCity = 'Current Location';
        this.deliveryPincode = 'GPS';
        localStorage.setItem('amp_delivery_location', JSON.stringify({
          pincode: 'GPS',
          city: 'Current Location'
        }));
        this.showLocationPopup = false;
      },
      () => alert('Location access denied.')
    );
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      window.location.href = '/login-mfe';
      return;
    }
    this.user = JSON.parse(userStr);
  }

  setupSearch(): void {
    this.searchSub = this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((query) => {
      if (!query || query.length < 2) {
        this.searchSuggestions = [];
        this.showSuggestions = false;
        return;
      }

      const cacheKey = `amp_search_${query.toLowerCase()}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        this.searchSuggestions = JSON.parse(cached).slice(0, 6);
        this.showSuggestions = this.searchSuggestions.length > 0;
        return;
      }

      this.http.get<BackendProduct[]>(`${this.API}/search?q=${encodeURIComponent(query)}`).subscribe(
        (res) => {
          sessionStorage.setItem(cacheKey, JSON.stringify(res));
          this.searchSuggestions = res.slice(0, 6);
          this.showSuggestions = this.searchSuggestions.length > 0;
        },
        () => {
          this.searchSuggestions = [];
          this.showSuggestions = false;
        }
      );
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  performSearch(): void {
    this.showSuggestions = false;
    this.activeView = 'browse';
  }

  selectSuggestion(product: BackendProduct): void {
    this.searchQuery = product.productName;
    this.showSuggestions = false;
    this.activeView = 'browse';
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.http.get<BackendProduct[]>(`${this.API}/products?status=ACTIVE`).subscribe(
      (p) => {
        this.products = p;
        this.loadingProducts = false;
      },
      () => {
        this.loadingProducts = false;
      }
    );
  }

  loadSellers(): void {
    this.http.get<BackendProduct[]>(`${this.API}/products?status=ACTIVE`).subscribe((products) => {
      const map = new Map<string, string>();
      products.forEach((p) => {
        if (p.sellerId && p.seller) {
          map.set(p.sellerId, p.seller);
        }
      });
      this.sellers = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    });
  }

  getFilteredProducts(): BackendProduct[] {
    let list = [...this.products];

    if (this.selectedCategory !== 'all') {
      list = list.filter((p) => (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase());
    }

    if (this.selectedSellerId) {
      list = list.filter((p) => p.sellerId === this.selectedSellerId);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.productName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.seller || '').toLowerCase().includes(q)
      );
    }

    if (this.searchCategory !== 'all') {
      list = list.filter((p) => (p.category || '').toLowerCase() === this.searchCategory.toLowerCase());
    }

    if (this.sortOrder === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (this.sortOrder === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return list;
  }

  filterBySeller(sellerId: string): void {
    this.selectedSellerId = sellerId;
    this.searchQuery = '';
  }

  getSellerName(sellerId: string): string {
    return this.sellers.find((s) => s.id === sellerId)?.name || sellerId;
  }

  loadCart(): void {
    const cartStr = localStorage.getItem(`marketplace_cart_${this.user?.username}`);
    if (cartStr) {
      this.cart = JSON.parse(cartStr);
    } else {
      this.cart = [];
    }
  }

  saveCart(): void {
    localStorage.setItem(`marketplace_cart_${this.user?.username}`, JSON.stringify(this.cart));
  }

  addToCart(product: BackendProduct): void {
    if (!product || product.stock <= 0) {
      this.showCartNotice('This product is currently out of stock.');
      return;
    }

    const existing = this.cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity += 1;
      } else {
        this.showCartNotice(`Maximum available quantity reached for ${product.productName}.`);
        return;
      }
    } else {
      this.cart.push({ product, quantity: 1 });
    }
    this.cart = [...this.cart];
    this.saveCart();
    this.recentlyAddedProductId = product.id;
    this.showCartNotice(`${product.productName} added to cart.`);
    setTimeout(() => {
      if (this.recentlyAddedProductId === product.id) {
        this.recentlyAddedProductId = null;
      }
    }, 1400);
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter((i) => i.product.id !== productId);
    this.saveCart();
    this.showCartNotice('Item removed from cart.');
  }

  updateQuantity(productId: number, delta: number): void {
    const item = this.cart.find((i) => i.product.id === productId);
    if (!item) {
      return;
    }
    const next = item.quantity + delta;
    if (next <= 0) {
      this.removeFromCart(productId);
    } else if (next <= item.product.stock) {
      item.quantity = next;
      this.cart = [...this.cart];
      this.saveCart();
    }
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((sum, i) => sum + i.quantity, 0);
  }

  startCheckout(): void {
    if (!this.cart.length) {
      this.showCartNotice('Your cart is empty.');
      return;
    }
    this.checkoutStep = 'payment';
    this.showCartNotice('Review payment method and place your order.');
  }

  placeOrder(): void {
    if (!this.cart.length) {
      return;
    }

    if (this.isPlacingOrder) {
      return;
    }
    this.isPlacingOrder = true;

    const isOnlinePayment = this.isOnlinePaymentMethod(this.selectedPaymentMethod);

    const order = {
      buyerId: String(this.user?.id || this.user?.username || 'guest'),
      buyerName: this.user?.name || this.user?.username || 'Guest',
      buyerContact: this.user?.phone || '',
      buyerAddress: this.deliveryPincode || '',
      societyName: this.user?.societyName || '',
      totalAmount: this.getCartTotal(),
      paymentMethod: this.selectedPaymentMethod,
      paymentStatus: this.selectedPaymentMethod === 'Cash on Delivery' ? 'PENDING_COD' : 'PENDING',
      status: this.selectedPaymentMethod === 'Cash on Delivery' ? 'CONFIRMED' : 'PENDING',
      items: this.cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.productName,
        quantity: i.quantity,
        price: i.product.price,
        subtotal: i.product.price * i.quantity
      }))
    };

    this.http.post<any>(`${this.API}/orders`, order).subscribe(
      (saved) => {
        this.isPlacingOrder = false;
        this.checkoutStep = 'summary';

        if (isOnlinePayment) {
          this.pendingGatewayOrder = saved;
          this.upiId = '';
          this.cardNumber = '';
          this.cardExpiry = '';
          this.cardCvv = '';
          this.cardHolder = '';
          this.selectedBank = '';
          this.cart = [];
          this.saveCart();
          this.activeView = 'payment-gateway';
          return;
        }

        // COD: order is confirmed, payment collected on delivery
        this.cart = [];
        this.saveCart();
        this.orders.unshift(saved);
        this.switchView('orders');
        this.showCartNotice(`Order #${saved.id} placed! Pay Rs ${saved.totalAmount} on delivery.`);
      },
      (err) => {
        this.isPlacingOrder = false;
        const msg = err?.error?.error || 'Order placement failed. Please try again.';
        this.showCartNotice(msg);
      }
    );
  }

  processGatewayPayment(): void {
    if (this.selectedPaymentMethod === 'UPI' && !this.upiId.trim()) {
      this.showCartNotice('Please enter your UPI ID.');
      return;
    }
    if (this.selectedPaymentMethod === 'Credit/Debit Card') {
      if (!this.cardHolder.trim() || !this.cardNumber.trim() || !this.cardExpiry.trim() || !this.cardCvv.trim()) {
        this.showCartNotice('Please fill all card details.');
        return;
      }
    }
    if (this.selectedPaymentMethod === 'Net Banking' && !this.selectedBank) {
      this.showCartNotice('Please select a bank.');
      return;
    }

    this.isProcessingPayment = true;
    const orderId = this.pendingGatewayOrder?.id;
    const txnId = `TXN${Date.now()}`;

    this.http.patch(`${this.API}/orders/${orderId}/payment?paymentStatus=COMPLETED&transactionId=${txnId}`, null).subscribe(
      () => {
        this.isProcessingPayment = false;
        this.gatewayPaymentSuccess = true;
        const idx = this.orders.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          this.orders[idx] = { ...this.orders[idx], paymentStatus: 'COMPLETED' };
        } else {
          this.orders.unshift({ ...this.pendingGatewayOrder, paymentStatus: 'COMPLETED' });
        }
        setTimeout(() => {
          this.gatewayPaymentSuccess = false;
          this.pendingGatewayOrder = null;
          this.activeView = 'orders';
          this.loadOrders();
        }, 2500);
      },
      () => {
        this.isProcessingPayment = false;
        this.showCartNotice('Payment failed. Please try again.');
      }
    );
  }

  cancelGatewayPayment(): void {
    const orderId = this.pendingGatewayOrder?.id;
    if (orderId) {
      this.http.patch(`${this.API}/orders/${orderId}/payment?paymentStatus=FAILED`, null).subscribe();
    }
    this.pendingGatewayOrder = null;
    this.checkoutStep = 'summary';
    this.activeView = 'cart';
    this.showCartNotice('Payment cancelled. Your cart has been cleared for this order.');
  }

  isOnlinePaymentMethod(method: string): boolean {
    return method !== 'Cash on Delivery';
  }

  showCartNotice(message: string): void {
    this.cartNotice = message;
    setTimeout(() => {
      if (this.cartNotice === message) {
        this.cartNotice = '';
      }
    }, 2200);
  }

  loadOrders(): void {
    this.loadingOrders = true;
    const uid = this.user?.id || this.user?.username;
    this.http.get<Order[]>(`${this.API}/orders?userId=${uid}`).subscribe(
      (o) => {
        this.orders = o;
        this.loadingOrders = false;
      },
      () => {
        this.loadingOrders = false;
      }
    );
  }

  switchView(view: string): void {
    this.activeView = view;
    this.showAccountMenu = false;
    if (view === 'cart') {
      this.checkoutStep = 'summary';
    }
    if (view === 'orders') {
      this.loadOrders();
    }
  }

  openSellerPortal(): void {
    window.open('/seller-portal', '_blank');
  }

  signOut(): void {
    localStorage.removeItem('user');
    window.location.href = '/login-mfe';
  }

  backToDashboard(): void {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/dashboard-mfe';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.account-menu-wrapper')) {
      this.showAccountMenu = false;
    }
    if (!target.closest('.lang-menu-wrapper')) {
      this.showLangMenu = false;
    }
    if (!target.closest('.search-wrapper')) {
      this.showSuggestions = false;
    }
  }
}
