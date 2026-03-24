package com.mysociety.user.service;

import com.mysociety.user.model.CRProduct;
import com.mysociety.user.repository.CRProductRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
public class CRProductService {
    
    @Autowired
    private CRProductRepository crProductRepository;

    public CRProduct createProduct(CRProduct product) {
        return crProductRepository.save(product);
    }

    public CRProduct updateProduct(Long id, CRProduct product) throws Exception {
        CRProduct existing = crProductRepository.findById(id)
                .orElseThrow(() -> new Exception("Product not found"));
        
        existing.setProductName(product.getProductName());
        existing.setCategory(product.getCategory());
        existing.setPrice(product.getPrice());
        existing.setUnit(product.getUnit());
        existing.setDescription(product.getDescription());
        existing.setStock(product.getStock());
        existing.setImage(product.getImage());
        existing.setStatus(product.getStatus());
        
        return crProductRepository.save(existing);
    }

    public CRProduct getProductById(Long id) throws Exception {
        return crProductRepository.findById(id)
                .orElseThrow(() -> new Exception("Product not found"));
    }

    public List<CRProduct> getAllProducts() {
        return crProductRepository.findAll();
    }

    public List<CRProduct> getActiveProducts() {
        return crProductRepository.findAllActiveProducts();
    }

    public List<CRProduct> getProductsByCategory(String category) {
        return crProductRepository.findByCategory(category);
    }

    public List<CRProduct> getProductsBySeller(String sellerId) {
        return crProductRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
    }

    public List<CRProduct> getProductsBySociety(String societyName) {
        return crProductRepository.findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(societyName);
    }

    public void deleteProduct(Long id) {
        crProductRepository.deleteById(id);
    }

    public CRProduct updateStock(Long id, Integer newStock) throws Exception {
        CRProduct product = getProductById(id);
        product.setStock(newStock);
        if (newStock <= 0) {
            product.setStatus("OUT_OF_STOCK");
        } else if ("OUT_OF_STOCK".equals(product.getStatus())) {
            product.setStatus("ACTIVE");
        }
        return crProductRepository.save(product);
    }

    /**
     * Bulk upload products from an Excel file (.xlsx or .xls).
     * Expected columns (row 1 = header):
     * productName, category, price, unit, description, stock, image, sellerId, societyName, status
     */
    public Map<String, Object> bulkUploadProducts(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        boolean isXlsx = filename != null && filename.toLowerCase().endsWith(".xlsx");
        boolean isXls  = filename != null && filename.toLowerCase().endsWith(".xls");

        if (!isXlsx && !isXls) {
            throw new IllegalArgumentException("Only .xlsx or .xls files are supported");
        }

        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int failureCount = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = isXlsx ? new XSSFWorkbook(is) : new HSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new IllegalArgumentException("Excel file has no sheets");
            }

            // Parse header row to determine column indices
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                throw new IllegalArgumentException("Excel file is empty");
            }

            Map<String, Integer> colIndex = new HashMap<>();
            for (int c = 0; c < headerRow.getLastCellNum(); c++) {
                Cell cell = headerRow.getCell(c);
                if (cell != null) {
                    colIndex.put(cell.getStringCellValue().trim().toLowerCase(), c);
                }
            }

            // Data rows start from row index 1
            for (int r = 1; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                try {
                    CRProduct product = new CRProduct();
                    product.setProductName(getCellString(row, colIndex.get("productname")));
                    product.setCategory(getCellString(row, colIndex.get("category")));

                    String priceStr = getCellString(row, colIndex.get("price"));
                    if (priceStr == null || priceStr.isEmpty()) {
                        throw new IllegalArgumentException("price is required");
                    }
                    product.setPrice(Double.parseDouble(priceStr));

                    product.setUnit(getCellString(row, colIndex.get("unit")));
                    product.setDescription(getCellString(row, colIndex.get("description")));

                    String stockStr = getCellString(row, colIndex.get("stock"));
                    product.setStock(stockStr != null && !stockStr.isEmpty()
                            ? (int) Double.parseDouble(stockStr) : 0);

                    product.setImage(getCellString(row, colIndex.get("image")));
                    product.setSellerId(getCellString(row, colIndex.get("sellerid")));
                    product.setSocietyName(getCellString(row, colIndex.get("societyname")));

                    String statusVal = getCellString(row, colIndex.get("status"));
                    if (statusVal != null && !statusVal.isEmpty()) {
                        product.setStatus(statusVal.toUpperCase());
                    }

                    // Validate required fields
                    if (product.getProductName() == null || product.getProductName().isEmpty()) {
                        throw new IllegalArgumentException("productName is required");
                    }
                    if (product.getCategory() == null || product.getCategory().isEmpty()) {
                        throw new IllegalArgumentException("category is required");
                    }

                    // seller field defaults to sellerId when not separately provided
                    if (product.getSeller() == null || product.getSeller().isEmpty()) {
                        String sid = product.getSellerId();
                        product.setSeller((sid != null && !sid.isEmpty()) ? sid : "bulk-upload");
                    }

                    crProductRepository.save(product);
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Row " + (r + 1) + ": " + e.getMessage());
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", failureCount == 0);
        result.put("message", "Processed " + successCount + " products successfully, " + failureCount + " failed");
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        return result;
    }

    /** Helper: read a cell as String regardless of its type. Returns null for missing cells. */
    private String getCellString(Row row, Integer colIdx) {
        if (colIdx == null) return null;
        Cell cell = row.getCell(colIdx);
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:  return cell.getStringCellValue().trim();
            case NUMERIC: return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN: return String.valueOf(cell.getBooleanCellValue());
            case FORMULA: return cell.getCellFormula();
            default:      return null;
        }
    }
}

