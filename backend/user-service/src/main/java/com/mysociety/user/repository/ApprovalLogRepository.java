package com.mysociety.user.repository;

import com.mysociety.user.model.ApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApprovalLogRepository extends JpaRepository<ApprovalLog, Long> {
    
    List<ApprovalLog> findBySocietyNameOrderByEntryTimeDesc(String societyName);
    
    List<ApprovalLog> findByApartmentNumberAndSocietyNameOrderByEntryTimeDesc(
        String apartmentNumber, String societyName);
    
    @Query("SELECT a FROM ApprovalLog a WHERE a.societyName = :societyName " +
           "AND a.entryTime >= :startDate AND a.entryTime <= :endDate " +
           "ORDER BY a.entryTime DESC")
    List<ApprovalLog> findBySocietyAndDateRange(
        @Param("societyName") String societyName,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT a FROM ApprovalLog a WHERE a.societyName = :societyName " +
           "AND a.exitTime IS NULL ORDER BY a.entryTime DESC")
    List<ApprovalLog> findActiveVisitors(@Param("societyName") String societyName);
}

