package com.mysociety.user.repository;

import com.mysociety.user.model.CRProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("SELECT p FROM CRProduct p WHERE p.status = 'ACTIVE' AND (" +
           "LOWER(p.productName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.seller) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY p.createdAt DESC")
    List<CRProduct> searchProducts(@Param("q") String q);
}

