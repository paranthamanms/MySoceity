package com.mysociety.user.repository;

import com.mysociety.user.model.ComplaintComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintCommentRepository extends JpaRepository<ComplaintComment, String> {
    List<ComplaintComment> findByComplaintIdOrderByCreatedAtAsc(String complaintId);
    long countByComplaintId(String complaintId);
}

