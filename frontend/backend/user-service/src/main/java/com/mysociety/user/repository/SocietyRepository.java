package com.NammaSociety.user.repository;

import com.NammaSociety.user.model.Society;
import org.springframework.stereotype.Repository;
import java.util.*;
import java.util.stream.Collectors;

@Repository
public class SocietyRepository {
    private Map<String, Society> societies = new HashMap<>();

    public Society save(Society society) {
        if (society.getId() == null) {
            society.setId(UUID.randomUUID().toString());
        }
        society.setUpdatedAt(System.currentTimeMillis());
        societies.put(society.getId(), society);
        return society;
    }

    public Optional<Society> findById(String id) {
        return Optional.ofNullable(societies.get(id));
    }

    public Optional<Society> findByName(String name) {
        return societies.values().stream()
                .filter(s -> s.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    public List<Society> findAll() {
        return new ArrayList<>(societies.values());
    }

    public List<Society> findAllActive() {
        return societies.values().stream()
                .filter(Society::isActive)
                .collect(Collectors.toList());
    }

    public boolean existsByName(String name) {
        return societies.values().stream()
                .anyMatch(s -> s.getName().equalsIgnoreCase(name));
    }

    public void deleteById(String id) {
        societies.remove(id);
    }

    public void delete(Society society) {
        societies.remove(society.getId());
    }
}

