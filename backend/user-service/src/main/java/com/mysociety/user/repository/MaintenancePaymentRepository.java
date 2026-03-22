package com.mysociety.user.repository;

import com.mysociety.user.model.MaintenancePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MaintenancePaymentRepository extends JpaRepository<MaintenancePayment, String> {
    List<MaintenancePayment> findByTowerNumberAndFlatNumber(String towerNumber, String flatNumber);
    List<MaintenancePayment> findBySocietyName(String societyName);
    List<MaintenancePayment> findBySocietyNameAndStatus(String societyName, String status);
    List<MaintenancePayment> findByTowerNumberAndFlatNumberAndQuarterName(String towerNumber, String flatNumber, String quarterName);
    
    @Query("SELECT p FROM MaintenancePayment p WHERE p.societyName = ?1 ORDER BY p.dueDate DESC")
    List<MaintenancePayment> findBySocietyNameOrderByDueDateDesc(String societyName);
    
    long countBySocietyNameAndStatus(String societyName, String status);
}

