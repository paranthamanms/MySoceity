package com.mysociety.user.repository;

import com.mysociety.user.model.CROrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CROrderRepository extends JpaRepository<CROrder, Long> {
    
    List<CROrder> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    
    List<CROrder> findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(String societyName);
    
    List<CROrder> findByStatusOrderByCreatedAtDesc(String status);
    
    List<CROrder> findByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);
    
    default List<CROrder> findAllOrders() {
        return findAll();
    }
}

