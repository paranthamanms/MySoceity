package com.mysociety.user.repository;

import com.mysociety.user.model.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, Long> {
    
    List<ApprovalRequest> findByApartmentNumberAndSocietyNameAndStatus(
        String apartmentNumber, String societyName, String status);
    
    List<ApprovalRequest> findBySocietyNameAndStatus(String societyName, String status);
    
    List<ApprovalRequest> findBySocietyNameOrderByRequestedAtDesc(String societyName);
    
    List<ApprovalRequest> findByApartmentNumberAndSocietyNameOrderByRequestedAtDesc(
        String apartmentNumber, String societyName);
}

