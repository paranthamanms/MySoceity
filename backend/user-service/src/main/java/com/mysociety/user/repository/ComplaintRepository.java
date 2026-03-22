package com.mysociety.user.repository;

import com.mysociety.user.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, String> {
    
    List<Complaint> findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(String societyName);
    
    List<Complaint> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
    
    default List<Complaint> findBySocietyName(String societyName) {
        return findBySocietyNameIgnoreCaseOrderByCreatedAtDesc(societyName);
    }
    
    default List<Complaint> findByStatus(String status) {
        return findByStatusIgnoreCaseOrderByCreatedAtDesc(status);
    }
}

