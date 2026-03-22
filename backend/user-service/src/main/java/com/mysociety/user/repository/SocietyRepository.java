package com.mysociety.user.repository;

import com.mysociety.user.model.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SocietyRepository extends JpaRepository<Society, String> {
    Optional<Society> findByName(String name);
    List<Society> findByActive(boolean active);
    boolean existsByName(String name);
}

