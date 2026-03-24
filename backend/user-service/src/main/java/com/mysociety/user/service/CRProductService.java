package com.mysociety.user.service;

import com.mysociety.user.model.CRProduct;
import com.mysociety.user.repository.CRProductRepository;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
     * Bulk upload products from a CSV or Excel (.xlsx) file.
     *
     * Expected columns (case-insensitive): productname, category, price,
     * unit, description, stock, image, societyname, seller, sellerid
     *
     * @param file     the uploaded CSV or Excel file
     * @param seller   seller name to apply when column is absent
     * @param sellerId seller ID to apply when column is absent
     * @return map with successCount, failureCount, errors and success flag
     */
    public Map<String, Object> processBulkProductUpload(MultipartFile file, String seller, String sellerId) {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
            return processBulkProductUploadExcel(file, seller, sellerId);
        }
        return processBulkProductUploadCsv(file, seller, sellerId);
    }

    private Map<String, Object> processBulkProductUploadCsv(MultipartFile file, String defaultSeller, String defaultSellerId) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try (InputStreamReader reader = new InputStreamReader(file.getInputStream());
             CSVParser csvParser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setTrim(true)
                     .setIgnoreEmptyLines(true)
                     .build()
                     .parse(reader)) {

            for (CSVRecord csvRecord : csvParser) {
                int rowNum = (int) csvRecord.getRecordNumber() + 1;
                try {
                    String[] headers = csvParser.getHeaderNames().toArray(new String[0]);
                    String[] values = new String[headers.length];
                    for (int i = 0; i < headers.length; i++) {
                        values[i] = csvRecord.get(headers[i]);
                    }
                    CRProduct product = mapRowToProduct(headers, values, defaultSeller, defaultSellerId);
                    String error = validateProduct(product, rowNum);
                    if (error != null) {
                        failureCount++;
                        errors.add(error);
                        continue;
                    }
                    crProductRepository.save(product);
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to read file: " + e.getMessage());
            result.put("successCount", 0);
            result.put("failureCount", 0);
            result.put("errors", errors);
            return result;
        }

        result.put("success", failureCount == 0);
        result.put("message", "Bulk upload completed. " + successCount + " products created, " + failureCount + " failed.");
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        return result;
    }

    private Map<String, Object> processBulkProductUploadExcel(MultipartFile file, String defaultSeller, String defaultSellerId) {
        Map<String, Object> result = new HashMap<>();
        int successCount = 0;
        int failureCount = 0;
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                result.put("success", false);
                result.put("message", "Excel file has no sheets");
                result.put("successCount", 0);
                result.put("failureCount", 0);
                result.put("errors", errors);
                return result;
            }

            String[] headers = null;
            for (Row row : sheet) {
                if (row.getRowNum() == 0) {
                    headers = readExcelRow(row);
                    continue;
                }
                if (headers == null) {
                    break;
                }
                String[] values = readExcelRow(row);
                try {
                    CRProduct product = mapRowToProduct(headers, values, defaultSeller, defaultSellerId);
                    String error = validateProduct(product, row.getRowNum() + 1);
                    if (error != null) {
                        failureCount++;
                        errors.add(error);
                        continue;
                    }
                    crProductRepository.save(product);
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Row " + (row.getRowNum() + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Failed to read Excel file: " + e.getMessage());
            result.put("successCount", 0);
            result.put("failureCount", 0);
            result.put("errors", errors);
            return result;
        }

        result.put("success", failureCount == 0);
        result.put("message", "Bulk upload completed. " + successCount + " products created, " + failureCount + " failed.");
        result.put("successCount", successCount);
        result.put("failureCount", failureCount);
        result.put("errors", errors);
        return result;
    }

    private String[] readExcelRow(Row row) {
        int lastCell = row.getLastCellNum();
        String[] values = new String[lastCell];
        for (int i = 0; i < lastCell; i++) {
            Cell cell = row.getCell(i, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK);
            values[i] = getCellValueAsString(cell);
        }
        return values;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return "";
        }
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().toString();
                }
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    return cell.getStringCellValue();
                }
            default:
                return "";
        }
    }

    private CRProduct mapRowToProduct(String[] headers, String[] values, String defaultSeller, String defaultSellerId) {
        CRProduct product = new CRProduct();
        product.setSeller(defaultSeller != null ? defaultSeller : "Unknown");
        product.setSellerId(defaultSellerId);

        for (int i = 0; i < headers.length; i++) {
            String header = headers[i].trim().toLowerCase().replaceAll("[^a-z]", "");
            String value = (i < values.length) ? values[i].trim() : "";

            switch (header) {
                case "productname":
                case "name":
                    product.setProductName(value);
                    break;
                case "category":
                    product.setCategory(value);
                    break;
                case "price":
                    if (!value.isEmpty()) {
                        product.setPrice(Double.parseDouble(value));
                    }
                    break;
                case "unit":
                    product.setUnit(value);
                    break;
                case "description":
                    product.setDescription(value);
                    break;
                case "stock":
                case "quantity":
                    if (!value.isEmpty()) {
                        product.setStock(Integer.parseInt(value));
                    }
                    break;
                case "image":
                case "imageurl":
                    product.setImage(value);
                    break;
                case "societyname":
                case "society":
                    product.setSocietyName(value);
                    break;
                case "seller":
                    if (!value.isEmpty()) {
                        product.setSeller(value);
                    }
                    break;
                case "sellerid":
                    if (!value.isEmpty()) {
                        product.setSellerId(value);
                    }
                    break;
                default:
                    break;
            }
        }
        return product;
    }

    private String validateProduct(CRProduct product, int rowNum) {
        if (product.getProductName() == null || product.getProductName().isEmpty()) {
            return "Row " + rowNum + ": productName is required";
        }
        if (product.getCategory() == null || product.getCategory().isEmpty()) {
            return "Row " + rowNum + ": category is required";
        }
        if (product.getPrice() == null || product.getPrice() < 0) {
            return "Row " + rowNum + ": valid price is required";
        }
        if (product.getStock() == null || product.getStock() < 0) {
            return "Row " + rowNum + ": valid stock quantity is required";
        }
        return null;
    }
}

