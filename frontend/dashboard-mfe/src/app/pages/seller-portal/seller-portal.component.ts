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

  activeView: string = 'login'; // 'login', 'register', 'dashboard', 'addProduct', 'bulkUpload'
  
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

  // Bulk Upload
  bulkUploadFile: File | null = null;
  bulkUploadFileName: string = '';
  isBulkUploading: boolean = false;
  bulkUploadSuccessMessage: string = '';
  bulkUploadErrorMessage: string = '';
  bulkUploadErrors: string[] = [];

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
    if (view === 'bulkUpload') {
      this.resetBulkUploadState();
    }
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

  // ── Bulk Upload ──────────────────────────────────────────────────────────────

  onBulkUploadFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.bulkUploadFile = input.files[0];
      this.bulkUploadFileName = input.files[0].name;
      this.bulkUploadSuccessMessage = '';
      this.bulkUploadErrorMessage = '';
      this.bulkUploadErrors = [];
    }
  }

  submitBulkUpload(): void {
    if (!this.bulkUploadFile) {
      this.bulkUploadErrorMessage = 'Please select a CSV or Excel file to upload.';
      return;
    }

    this.isBulkUploading = true;
    this.bulkUploadSuccessMessage = '';
    this.bulkUploadErrorMessage = '';
    this.bulkUploadErrors = [];

    const formData = new FormData();
    formData.append('file', this.bulkUploadFile);
    if (this.loggedInSeller?.sellerName) {
      formData.append('seller', this.loggedInSeller.sellerName);
    }
    if (this.loggedInSeller?.sellerId) {
      formData.append('sellerId', this.loggedInSeller.sellerId);
    }

    this.http.post<any>('http://localhost:8002/api/cr-marketplace/products/bulk-upload', formData)
      .subscribe({
        next: (response) => {
          this.isBulkUploading = false;
          if (response.success) {
            this.bulkUploadSuccessMessage = `✓ ${response.message}`;
          } else {
            this.bulkUploadErrorMessage = response.message || 'Bulk upload completed with errors.';
          }
          if (response.errors && response.errors.length > 0) {
            this.bulkUploadErrors = response.errors;
          }
          if ((response.successCount || 0) > 0) {
            this.loadProducts();
          }
          this.bulkUploadFile = null;
          this.bulkUploadFileName = '';
        },
        error: (err) => {
          this.isBulkUploading = false;
          this.bulkUploadErrorMessage = 'Upload failed: ' + (err.error?.message || err.message || 'Unknown error');
        }
      });
  }

  downloadBulkTemplate(): void {
    const csvContent = 'productName,category,price,unit,description,stock,image,societyName\n' +
      'Sample Product,electronics,999,piece,A sample product description,10,,My Society\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'product_bulk_upload_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private resetBulkUploadState(): void {
    this.bulkUploadFile = null;
    this.bulkUploadFileName = '';
    this.isBulkUploading = false;
    this.bulkUploadSuccessMessage = '';
    this.bulkUploadErrorMessage = '';
    this.bulkUploadErrors = [];
  }

  logout(): void {
    localStorage.removeItem('seller');
    this.loggedInSeller = null;
    this.activeView = 'login';
  }
}
