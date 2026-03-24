package com.mysociety.user.controller;

import com.mysociety.user.model.CRProduct;
import com.mysociety.user.model.CROrder;
import com.mysociety.user.service.CRProductService;
import com.mysociety.user.service.CROrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.LocalDateTime;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.stream.Collectors;
import java.util.ArrayList;

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

    // ---------------------------------------------------------------
    // SEARCH & BULK UPLOAD
    // ---------------------------------------------------------------

    /**
     * Search products by keyword (name, description, category, seller)
     * Supports sessionStorage caching on the frontend.
     */
    @GetMapping("/search")
    public ResponseEntity<List<CRProduct>> searchProducts(@RequestParam String q) {
        try {
            List<CRProduct> results = crProductService.searchProducts(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    /**
     * Bulk upload products via Excel (.xlsx) or CSV file.
     * Expected columns: Product Name, Category, Price, Unit, Description, Stock, Image URL
     */
    @PostMapping("/products/bulk-upload")
    public ResponseEntity<?> bulkUpload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sellerId") String sellerId,
            @RequestParam("sellerName") String sellerName,
            @RequestParam(value = "societyName", required = false, defaultValue = "") String societyName) {
        try {
            List<CRProduct> products = new ArrayList<>();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";

            if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
                // Parse Excel with Apache POI
                Workbook workbook = WorkbookFactory.create(file.getInputStream());
                Sheet sheet = workbook.getSheetAt(0);
                boolean firstRow = true;
                for (Row row : sheet) {
                    if (firstRow) { firstRow = false; continue; } // skip header
                    String name = getCellString(row, 0);
                    if (name == null || name.isBlank()) continue;
                    CRProduct p = buildProduct(name,
                        getCellString(row, 1), getCellDouble(row, 2),
                        getCellString(row, 3), getCellString(row, 4),
                        getCellInt(row, 5), getCellString(row, 6),
                        sellerId, sellerName, societyName);
                    products.add(p);
                }
                workbook.close();
            } else {
                // Parse CSV
                BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), "UTF-8"));
                boolean firstLine = true;
                String line;
                while ((line = reader.readLine()) != null) {
                    if (firstLine) { firstLine = false; continue; }
                    String[] cols = line.split(",", -1);
                    if (cols.length < 1 || cols[0].isBlank()) continue;
                    String name = cols[0].trim().replaceAll("^\"|\"$", "");
                    if (name.isBlank()) continue;
                    String category = cols.length > 1 ? cols[1].trim().replaceAll("^\"|\"$", "") : "others";
                    double price = cols.length > 2 ? parseDoubleOrZero(cols[2].trim().replaceAll("^\"|\"$", "")) : 0;
                    String unit = cols.length > 3 ? cols[3].trim().replaceAll("^\"|\"$", "") : "";
                    String desc = cols.length > 4 ? cols[4].trim().replaceAll("^\"|\"$", "") : "";
                    int stock = cols.length > 5 ? parseIntOrZero(cols[5].trim().replaceAll("^\"|\"$", "")) : 0;
                    String imageUrl = cols.length > 6 ? cols[6].trim().replaceAll("^\"|\"$", "") : "";
                    products.add(buildProduct(name, category, price, unit, desc, stock, imageUrl, sellerId, sellerName, societyName));
                }
                reader.close();
            }

            if (products.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No valid product rows found in file. Check the template format."));
            }

            List<CRProduct> saved = crProductService.bulkCreateProducts(products);
            return ResponseEntity.ok(Map.of("count", saved.size(), "message", "Uploaded " + saved.size() + " products successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    private CRProduct buildProduct(String name, String category, double price,
            String unit, String description, int stock, String imageUrl,
            String sellerId, String sellerName, String societyName) {
        CRProduct p = new CRProduct();
        p.setProductName(name);
        p.setCategory(category != null && !category.isBlank() ? category : "others");
        p.setPrice(price);
        p.setUnit(unit);
        p.setDescription(description);
        p.setStock(stock);
        p.setImage(imageUrl);
        p.setSellerId(sellerId);
        p.setSeller(sellerName);
        p.setSocietyName(societyName);
        p.setStatus(stock > 0 ? "ACTIVE" : "OUT_OF_STOCK");
        return p;
    }

    private String getCellString(Row row, int col) {
        if (row == null || col >= row.getLastCellNum()) return "";
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        cell.setCellType(CellType.STRING);
        return cell.getStringCellValue().trim();
    }

    private double getCellDouble(Row row, int col) {
        if (row == null || col >= row.getLastCellNum()) return 0;
        Cell cell = row.getCell(col);
        if (cell == null) return 0;
        try {
            if (cell.getCellType() == CellType.NUMERIC) return cell.getNumericCellValue();
            cell.setCellType(CellType.STRING);
            return parseDoubleOrZero(cell.getStringCellValue().trim());
        } catch (Exception e) { return 0; }
    }

    private int getCellInt(Row row, int col) {
        return (int) getCellDouble(row, col);
    }

    private double parseDoubleOrZero(String s) {
        try { return Double.parseDouble(s.replaceAll("[^\\d.]", "")); } catch (Exception e) { return 0; }
    }

    private int parseIntOrZero(String s) {
        try { return Integer.parseInt(s.replaceAll("[^\\d]", "")); } catch (Exception e) { return 0; }
    }

}
