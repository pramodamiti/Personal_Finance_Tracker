package com.personalfinancetracker.app.repository;

import com.personalfinancetracker.app.entity.Category;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByUserIdOrSystemDefaultTrueOrderByNameAsc(UUID userId);
    Optional<Category> findByIdAndArchivedFalse(UUID id);
}
