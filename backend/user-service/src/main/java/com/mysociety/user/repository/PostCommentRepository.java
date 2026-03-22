package com.mysociety.user.repository;

import com.mysociety.user.model.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostCommentRepository extends JpaRepository<PostComment, String> {
    List<PostComment> findByPostIdAndActiveOrderByCreatedAtAsc(String postId, boolean active);
    long countByPostIdAndActive(String postId, boolean active);
    List<PostComment> findByParentCommentIdOrderByCreatedAtAsc(String parentCommentId);
}

