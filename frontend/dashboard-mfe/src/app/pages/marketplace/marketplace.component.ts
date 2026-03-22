import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sellerId: string;
  sellerName: string;
  imageUrl: string;
  stock: number;
  rating: number;
  reviews: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit {

  user: any = null;
  activeView: string = 'browse'; // 'browse', 'cart', 'orders'
  searchQuery: string = '';
  selectedCategory: string = 'all';
  
  categories = [
    { id: 'all', name: 'All Categories', icon: '🏬' },
    { id: 'electronics', name: 'Electronics', icon: '📱' },
    { id: 'furniture', name: 'Furniture', icon: '🛋️' },
    { id: 'groceries', name: 'Groceries', icon: '🛒' },
    { id: 'books', name: 'Books', icon: '📚' },
    { id: 'clothing', name: 'Clothing', icon: '👕' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'others', name: 'Others', icon: '📦' }
  ];
  
  products: Product[] = [
    {
      id: 'P001',
      name: 'Wireless Headphones',
      description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
      price: 2999,
      category: 'electronics',
      sellerId: 'S001',
      sellerName: 'TechStore',
      imageUrl: 'assets/images/products/headphones.jpg',
      stock: 15,
      rating: 4.5,
      reviews: 128
    },
    {
      id: 'P002',
      name: 'Study Table',
      description: 'Wooden study table with drawer, perfect for home office',
      price: 4500,
      category: 'furniture',
      sellerId: 'S002',
      sellerName: 'FurniMart',
      imageUrl: 'assets/images/products/table.jpg',
      stock: 8,
      rating: 4.2,
      reviews: 56
    },
    {
      id: 'P003',
      name: 'Organic Rice 5kg',
      description: 'Premium quality organic basmati rice',
      price: 450,
      category: 'groceries',
      sellerId: 'S003',
      sellerName: 'FreshBazaar',
      imageUrl: 'assets/images/products/rice.jpg',
      stock: 50,
      rating: 4.7,
      reviews: 234
    }
  ];
  
  cart: CartItem[] = [];
  
  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadProducts();
    this.loadCart();
  }

  loadUserData(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    } else {
      window.location.href = '/login-mfe';
    }
  }

  loadProducts(): void {
    // TODO: Load products from backend
    // this.http.get<any>('http://localhost:8002/api/marketplace/products')
    //   .subscribe(response => {
    //     if (response?.success) {
    //       this.products = response.products;
    //     }
    //   });
  }

  loadCart(): void {
    const cartStr = localStorage.getItem('marketplace_cart_' + this.user?.username);
    if (cartStr) {
      this.cart = JSON.parse(cartStr);
    }
  }

  saveCart(): void {
    localStorage.setItem('marketplace_cart_' + this.user?.username, JSON.stringify(this.cart));
  }

  getFilteredProducts(): Product[] {
    let filtered = this.products;
    
    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity++;
      } else {
        alert('Maximum stock reached!');
        return;
      }
    } else {
      this.cart.push({ product, quantity: 1 });
    }
    
    this.saveCart();
    alert(`${product.name} added to cart!`);
  }

  removeFromCart(productId: string): void {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this.saveCart();
  }

  updateQuantity(productId: string, change: number): void {
    const item = this.cart.find(i => i.product.id === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity > 0 && newQuantity <= item.product.stock) {
        item.quantity = newQuantity;
        this.saveCart();
      } else if (newQuantity <= 0) {
        this.removeFromCart(productId);
      } else {
        alert('Maximum stock reached!');
      }
    }
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  checkout(): void {
    if (this.cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    const total = this.getCartTotal();
    const orderData = {
      items: this.cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.product.price * item.quantity
      })),
      total: total,
      userId: this.user?.username,
      timestamp: new Date().toISOString()
    };
    
    // Store cart data for payment confirmation
    sessionStorage.setItem('pending_order', JSON.stringify(orderData));
    
    // Navigate to CCAvenue payment integration
    // In production, this would redirect to CCAvenue gateway
    console.log('Proceeding to CCAvenue Payment Gateway...', orderData);
    
    // Create payment form and submit to CCAvenue
    this.initiateCCAvenue(orderData);
  }

  initiateCCAvenue(orderData: any): void {
    // CCAvenue Payment Gateway Integration
    // In production, you would call backend API to generate encrypted payment request
    
    // For now, simulate payment gateway redirect
    const orderId = 'ORD' + Date.now();
    const amount = orderData.total;
    
    console.log('CCAvenue Payment Request:', {
      orderId: orderId,
      amount: amount,
      currency: 'INR',
      customerName: this.user?.username,
      items: orderData.items
    });
    
    // TODO: Replace with actual CCAvenue integration via backend
    // Backend should:
    // 1. Generate encrypted request using CCAvenue Merchant Key
    // 2. Return encrypted data and access code
    // 3. Frontend posts to CCAvenue URL: https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction
    
    if (confirm(`Proceed to CCAvenue Payment Gateway to pay ₹${amount}?\n\nOrder ID: ${orderId}\nTotal: ₹${amount}`)) {
      // Simulate successful payment for now
      alert('Payment Gateway: This will redirect to CCAvenue in production.\n\nFor demo: Assuming payment successful!');
      
      // On successful payment callback:
      this.handlePaymentSuccess(orderId, orderData);
    }
  }

  handlePaymentSuccess(orderId: string, orderData: any): void {
    // Called after successful payment from CCAvenue callback
    console.log('Payment successful for order:', orderId);
    
    // TODO: Send order confirmation to backend
    // this.http.post('http://localhost:8002/api/marketplace/orders', {
    //   orderId: orderId,
    //   ...orderData
    // }).subscribe(response => {
    //   console.log('Order saved:', response);
    // });
    
    // Clear cart
    this.cart = [];
    this.saveCart();
    sessionStorage.removeItem('pending_order');
    
    // Show success message
    alert(`Order placed successfully! Order ID: ${orderId}\n\nYou will receive a confirmation via email.`);
    
    // Navigate to orders view
    this.switchView('orders');
  }

  openSellerPortal(): void {
    // Open seller registration/login portal in new window/route
    window.open('/seller-portal', '_blank');
  }

  switchView(view: string): void {
    this.activeView = view;
  }

  backToDashboard(): void {
    window.location.href = '/dashboard-mfe';
  }
}
