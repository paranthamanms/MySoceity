import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';

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

  categories = [
    { id: 'electronics', name: 'Electronics' },
    { id: 'furniture', name: 'Furniture' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'books', name: 'Books' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'sports', name: 'Sports' },
    { id: 'others', name: 'Others' }
  ];

  // Bulk Upload
  selectedExcelFile: File | null = null;
  bulkUploadResult: any = null;
  isBulkUploading: boolean = false;

  private apiBase = '/api/cr-marketplace';

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
      this.selectedExcelFile = null;
      this.bulkUploadResult = null;
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
    if (!this.loggedInSeller?.sellerId) return;
    this.http.get<any[]>(`${this.apiBase}/products?sellerId=${this.loggedInSeller.sellerId}`)
      .subscribe({
        next: (data) => {
          this.products = (data || []).map(p => ({
            id: String(p.id),
            name: p.productName,
            description: p.description,
            price: p.price,
            category: p.category,
            stock: p.stock,
            imageUrl: p.image || ''
          }));
        },
        error: () => { this.products = []; }
      });
  }

  addProduct(): void {
    if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.stock) {
      alert('Please fill required fields: Name, Price, and Stock');
      return;
    }
    
    const payload = {
      productName: this.newProduct.name,
      category: this.newProduct.category,
      price: this.newProduct.price,
      unit: '',
      description: this.newProduct.description,
      stock: this.newProduct.stock,
      image: this.newProduct.imageUrl,
      seller: this.loggedInSeller?.sellerName || '',
      sellerId: this.loggedInSeller?.sellerId || '',
      societyName: '',
      status: 'ACTIVE'
    };

    this.http.post<any>(`${this.apiBase}/products`, payload).subscribe({
      next: (created) => {
        this.products.push({
          id: String(created.id),
          name: created.productName,
          description: created.description,
          price: created.price,
          category: created.category,
          stock: created.stock,
          imageUrl: created.image || ''
        });
        alert('Product added successfully!');
        this.newProduct = { id: '', name: '', description: '', price: 0, category: 'electronics', stock: 0, imageUrl: '' };
        this.activeView = 'dashboard';
      },
      error: (err) => {
        alert('Failed to add product: ' + (err?.error?.error || 'Unknown error'));
      }
    });
  }

  deleteProduct(productId: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.http.delete<any>(`${this.apiBase}/products/${productId}`).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== productId);
          alert('Product deleted successfully!');
        },
        error: (err) => {
          alert('Failed to delete product: ' + (err?.error?.error || 'Unknown error'));
        }
      });
    }
  }

  logout(): void {
    localStorage.removeItem('seller');
    this.loggedInSeller = null;
    this.activeView = 'login';
  }

  // ── Bulk Upload ──────────────────────────────────────────────────────────────

  onExcelFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
        alert('Please select an Excel file (.xlsx or .xls)');
        input.value = '';
        this.selectedExcelFile = null;
        return;
      }
      this.selectedExcelFile = file;
      this.bulkUploadResult = null;
    }
  }

  uploadExcelFile(): void {
    if (!this.selectedExcelFile) {
      alert('Please select an Excel file first');
      return;
    }

    this.isBulkUploading = true;
    this.bulkUploadResult = null;

    const formData = new FormData();
    formData.append('file', this.selectedExcelFile);

    this.http.post<any>(`${this.apiBase}/products/bulk-upload`, formData).subscribe({
      next: (result) => {
        this.isBulkUploading = false;
        this.bulkUploadResult = result;
        if (result.successCount > 0) {
          this.loadProducts();
        }
      },
      error: (err) => {
        this.isBulkUploading = false;
        this.bulkUploadResult = {
          success: false,
          message: err?.error?.message || 'Upload failed. Please try again.',
          successCount: 0,
          failureCount: 0,
          errors: []
        };
      }
    });
  }

  downloadTemplate(): void {
    // Download a CSV reference file showing the required column structure.
    // Users should open it in Excel and save as .xlsx before uploading.
    const header = 'productName,category,price,unit,description,stock,image,sellerId,societyName,status';
    const example = 'Sample Product,groceries,99.99,kg,Fresh organic product,100,https://example.com/img.jpg,S001,Green Valley,ACTIVE';
    const blob = new Blob([header + '\n' + example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product_upload_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
