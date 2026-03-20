package com.personalfinancetracker.app.repository;

import com.personalfinancetracker.app.entity.Budget;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {
    @EntityGraph(attributePaths = "category")
    List<Budget> findByUserIdAndBudgetMonthAndBudgetYearOrderByCreatedAtAsc(UUID userId, Integer month, Integer year);
    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);
}
