import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface SellerProduct {
  id: number;
  productName: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  seller: string;
  sellerId: string;
  status: string;
}

interface NewProductForm {
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

  private readonly API = 'http://localhost:8002/api/cr-marketplace';

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
  newProduct: NewProductForm = {
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
      sellerName: this.sellerId,
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

    localStorage.setItem('registered_seller', JSON.stringify(newSeller));
    
    alert('Registration successful! You can now login.');
    this.activeView = 'login';
  }

  loadProducts(): void {
    if (!this.loggedInSeller?.sellerId) {
      this.products = [];
      return;
    }

    this.http.get<SellerProduct[]>(`${this.API}/products?sellerId=${encodeURIComponent(this.loggedInSeller.sellerId)}`).subscribe(
      (res) => {
        this.products = res || [];
      },
      () => {
        this.products = [];
        alert('Unable to load products from server.');
      }
    );
  }

  addProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.stock) {
      alert('Please fill required fields: Name, Price, and Stock');
      return;
    }

    if (!this.loggedInSeller?.sellerId) {
      alert('Please login as seller first.');
      return;
    }

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const payload = {
      productName: this.newProduct.name,
      description: this.newProduct.description,
      price: Number(this.newProduct.price),
      category: this.newProduct.category,
      stock: Number(this.newProduct.stock),
      image: this.newProduct.imageUrl,
      unit: '1 unit',
      sellerId: this.loggedInSeller.sellerId,
      seller: this.loggedInSeller.sellerName || this.loggedInSeller.sellerId,
      societyName: user?.societyName || '',
      status: this.newProduct.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
    };

    this.http.post<SellerProduct>(`${this.API}/products`, payload).subscribe(
      () => {
        alert('Product added successfully!');
        this.newProduct = {
          name: '',
          description: '',
          price: 0,
          category: 'electronics',
          stock: 0,
          imageUrl: ''
        };
        this.activeView = 'dashboard';
        this.loadProducts();
      },
      () => {
        alert('Failed to add product. Please try again.');
      }
    );
  }

  deleteProduct(productId: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete(`${this.API}/products/${productId}`).subscribe(
        () => {
          this.products = this.products.filter(p => p.id !== productId);
          alert('Product deleted successfully!');
        },
        () => {
          alert('Failed to delete product. Please try again.');
        }
      );
    }
  }

  logout(): void {
    localStorage.removeItem('seller');
    this.loggedInSeller = null;
    this.activeView = 'login';
  }
}
