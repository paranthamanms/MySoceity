package com.mysociety.user.service;

import com.mysociety.user.model.CRProduct;
import com.mysociety.user.repository.CRProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

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

        public List<CRProduct> searchProducts(String query) {
            if (query == null || query.trim().isEmpty()) {
                return getActiveProducts();
            }
            return crProductRepository.searchProducts(query.trim());
        }

        public List<CRProduct> bulkCreateProducts(List<CRProduct> products) {
            return crProductRepository.saveAll(products);
        }
}

