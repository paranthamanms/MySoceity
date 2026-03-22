package com.mysociety.user.repository;

import com.mysociety.user.model.PreApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PreApprovalRepository extends JpaRepository<PreApproval, Long> {
    
    List<PreApproval> findByApartmentNumberAndSocietyNameAndStatus(
        String apartmentNumber, String societyName, String status);
    
    List<PreApproval> findBySocietyNameAndStatus(String societyName, String status);
    
    @Query("SELECT p FROM PreApproval p WHERE p.apartmentNumber = :apartmentNumber " +
           "AND p.societyName = :societyName AND p.status = 'ACTIVE' " +
           "AND p.validFrom <= :now AND p.validUntil >= :now")
    List<PreApproval> findActivePreApprovals(
        @Param("apartmentNumber") String apartmentNumber,
        @Param("societyName") String societyName,
        @Param("now") LocalDateTime now);

    @Query("SELECT p FROM PreApproval p WHERE p.societyName = :societyName " +
           "AND p.status = 'ACTIVE' AND p.validFrom <= :now AND p.validUntil >= :now")
    List<PreApproval> findActivePreApprovalsForSociety(
        @Param("societyName") String societyName,
        @Param("now") LocalDateTime now);
    
    @Query("SELECT p FROM PreApproval p WHERE p.visitorPhone = :phone " +
           "AND p.societyName = :societyName AND p.status = 'ACTIVE' " +
           "AND p.validFrom <= :now AND p.validUntil >= :now")
    List<PreApproval> findActivePreApprovalsByPhone(
        @Param("phone") String phone,
        @Param("societyName") String societyName,
        @Param("now") LocalDateTime now);
}

