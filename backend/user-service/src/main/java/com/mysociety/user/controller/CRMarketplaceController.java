package com.mysociety.user.controller;

import com.mysociety.user.model.CRProduct;
import com.mysociety.user.model.CROrder;
import com.mysociety.user.service.CRProductService;
import com.mysociety.user.service.CROrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;

@RestController
@RequestMapping("/api/cr-marketplace")
@CrossOrigin(origins = "*")
public class CRMarketplaceController {
    
    @Autowired
    private CRProductService crProductService;
    
    @Autowired
    private CROrderService crOrderService;

    /**
     * Create new product listing by seller
     */
    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody CRProduct product) {
        try {
            CRProduct created = crProductService.createProduct(product);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all products with optional filters
     */
    @GetMapping("/products")
    public ResponseEntity<List<CRProduct>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String sellerId,
            @RequestParam(required = false) String societyName,
            @RequestParam(required = false) String status) {
        try {
            List<CRProduct> products;
            if (category != null && !category.isEmpty()) {
                products = crProductService.getProductsByCategory(category);
            } else if (sellerId != null && !sellerId.isEmpty()) {
                products = crProductService.getProductsBySeller(sellerId);
            } else if (societyName != null && !societyName.isEmpty()) {
                products = crProductService.getProductsBySociety(societyName);
            } else if (status != null && !status.isEmpty()) {
                products = status.equals("ACTIVE") 
                    ? crProductService.getActiveProducts() 
                    : crProductService.getAllProducts();
            } else {
                products = crProductService.getActiveProducts();
            }
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get product by ID
     */
    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        try {
            CRProduct product = crProductService.getProductById(id);
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Product not found"));
        }
    }

    /**
     * Update product
     */
    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody CRProduct product) {
        try {
            CRProduct updated = crProductService.updateProduct(id, product);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update product stock
     */
    @PatchMapping("/products/{id}/stock")
    public ResponseEntity<?> updateProductStock(
            @PathVariable Long id, 
            @RequestParam Integer stock) {
        try {
            CRProduct updated = crProductService.updateStock(id, stock);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete product
     */
    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            crProductService.deleteProduct(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Bulk upload products from an Excel file (.xlsx or .xls).
     * Required columns: productName, category, price, stock
     * Optional columns: unit, description, image, sellerId, societyName, status
     */
    @PostMapping("/products/bulk-upload")
    public ResponseEntity<?> bulkUploadProducts(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (file.isEmpty()) {
                response.put("success", false);
                response.put("message", "File is empty");
                return ResponseEntity.badRequest().body(response);
            }

            String filename = file.getOriginalFilename();
            if (filename == null ||
                    (!filename.toLowerCase().endsWith(".xlsx") && !filename.toLowerCase().endsWith(".xls"))) {
                response.put("success", false);
                response.put("message", "Please upload an Excel file (.xlsx or .xls)");
                return ResponseEntity.badRequest().body(response);
            }

            Map<String, Object> result = crProductService.bulkUploadProducts(file);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Bulk upload failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Create new order by buyer
     */
    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody CROrder order) {
        try {
            CROrder created = crOrderService.createOrder(order);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get orders with optional filters
     */
    @GetMapping("/orders")
    public ResponseEntity<List<CROrder>> getOrders(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String societyName,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        try {
            List<CROrder> orders;
            if (userId != null && !userId.isEmpty()) {
                orders = crOrderService.getOrdersByBuyer(userId);
            } else if (societyName != null && !societyName.isEmpty()) {
                orders = crOrderService.getOrdersBySociety(societyName);
            } else if (status != null && !status.isEmpty()) {
                orders = crOrderService.getOrdersByStatus(status);
            } else if (paymentStatus != null && !paymentStatus.isEmpty()) {
                orders = crOrderService.getOrdersByPaymentStatus(paymentStatus);
            } else {
                orders = crOrderService.getAllOrders();
            }
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Get order by ID
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        try {
            CROrder order = crOrderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(404).body(Map.of("error", "Order not found"));
        }
    }

    /**
     * Update order status
     */
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        try {
            CROrder updated = crOrderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update order payment status
     */
    @PatchMapping("/orders/{id}/payment")
    public ResponseEntity<?> updateOrderPaymentStatus(
            @PathVariable Long id, 
            @RequestParam String paymentStatus,
            @RequestParam(required = false) String transactionId) {
        try {
            CROrder updated = crOrderService.updatePaymentStatus(id, paymentStatus, transactionId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete order
     */
    @DeleteMapping("/orders/{id}")
    public ResponseEntity<?> deleteOrder(@PathVariable Long id) {
        try {
            crOrderService.deleteOrder(id);
            return ResponseEntity.ok(Map.of("message", "Order deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}

