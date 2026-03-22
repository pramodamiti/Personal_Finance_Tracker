package com.personalfinancetracker.app.repository;

import com.personalfinancetracker.app.entity.Rule;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RuleRepository extends JpaRepository<Rule, UUID> {
    List<Rule> findByUserIdOrderByPriorityAscCreatedAtAsc(UUID userId);
    Optional<Rule> findByIdAndUserId(UUID id, UUID userId);
}
