package com.mysociety.user.repository;

import com.mysociety.user.model.CRProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CRProductRepository extends JpaRepository<CRProduct, Long> {
    
    List<CRProduct> findByCategoryIgnoreCaseOrderByCreatedAtDesc(String category);
    
    List<CRProduct> findBySellerIdOrderByCreatedAtDesc(String sellerId);
    
    List<CRProduct> findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(String societyName);
    
    List<CRProduct> findByStatusOrderByCreatedAtDesc(String status);
    
    default List<CRProduct> findAllActiveProducts() {
        return findByStatusOrderByCreatedAtDesc("ACTIVE");
    }
    
    default List<CRProduct> findByCategory(String category) {
        return findByCategoryIgnoreCaseOrderByCreatedAtDesc(category);
    }
}

