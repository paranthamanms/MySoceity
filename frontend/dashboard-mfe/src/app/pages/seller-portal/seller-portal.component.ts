import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface SellerProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

@Component({
  selector: 'app-seller-portal',
  templateUrl: './seller-portal.component.html',
  styleUrls: ['./seller-portal.component.scss']
})
export class SellerPortalComponent implements OnInit {

  activeView: string = 'login'; // 'login', 'register', 'dashboard', 'addProduct'
  
  // Login/Register
  sellerId: string = '';
  sellerName: string = '';
  email: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';
  
  // Logged in seller
  loggedInSeller: any = null;
  
  // Products
  products: SellerProduct[] = [];
  
  // New Product Form
  newProduct: SellerProduct = {
    id: '',
    name: '',
    description: '',
    price: 0,
    category: 'electronics',
    stock: 0,
    imageUrl: ''
  };

  categories = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'books', name: 'Books' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'sports', name: 'Sports' },
    { id: 'others', name: 'Others' }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.checkSellerLogin();
  }

  checkSellerLogin(): void {
    const sellerStr = localStorage.getItem('seller');
    if (sellerStr) {
      this.loggedInSeller = JSON.parse(sellerStr);
      this.activeView = 'dashboard';
      this.loadProducts();
    }
  }

  switchView(view: string): void {
    this.activeView = view;
  }

  login(): void {
    if (!this.sellerId || !this.password) {
      alert('Please enter Seller ID and Password');
      return;
    }
    
    // TODO: Implement seller authentication API
    // For now, mock login
    this.loggedInSeller = {
      sellerId: this.sellerId,
      sellerName: 'Test Seller',
      email: 'seller@example.com'
    };
    
    localStorage.setItem('seller', JSON.stringify(this.loggedInSeller));
    this.activeView = 'dashboard';
    this.loadProducts();
  }

  register(): void {
    if (!this.sellerName || !this.email || !this.phone || !this.password) {
      alert('Please fill all fields');
      return;
    }
    
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    // TODO: Implement seller registration API
    const newSeller = {
      sellerId: 'S' + Date.now(),
      sellerName: this.sellerName,
      email: this.email,
      phone: this.phone
    };
    
    alert('Registration successful! You can now login.');
    this.activeView = 'login';
  }

  loadProducts(): void {
    // TODO: Load seller's products from backend
    // For now, using mock data
    this.products = [];
  }

  addProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.stock) {
      alert('Please fill required fields: Name, Price, and Stock');
      return;
    }
    
    // Generate product ID
    this.newProduct.id = 'P' + Date.now();
    
    // TODO: Save product to backend
    this.products.push({ ...this.newProduct });
    
    alert('Product added successfully!');
    
    // Reset form
    this.newProduct = {
      id: '',
      name: '',
      description: '',
      price: 0,
      category: 'electronics',
      stock: 0,
      imageUrl: ''
    };
    
    this.activeView = 'dashboard';
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.products = this.products.filter(p => p.id !== productId);
      // TODO: Delete from backend
      alert('Product deleted successfully!');
    }
  }

  logout(): void {
    localStorage.removeItem('seller');
    this.loggedInSeller = null;
    this.activeView = 'login';
  }
}
