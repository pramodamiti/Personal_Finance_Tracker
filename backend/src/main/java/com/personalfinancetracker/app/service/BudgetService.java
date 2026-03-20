package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.BudgetRequest;
import com.personalfinancetracker.app.dto.CommonDtos.BudgetResponse;
import com.personalfinancetracker.app.entity.Budget;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.repository.BudgetRepository;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final CategoryService categoryService;
    private final AuthFacade authFacade;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, CategoryService categoryService, AuthFacade authFacade, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.categoryService = categoryService;
        this.authFacade = authFacade;
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(int month, int year) {
        return budgetRepository.findByUserIdAndBudgetMonthAndBudgetYearOrderByCreatedAtAsc(authFacade.currentUser().getId(), month, year)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public BudgetResponse create(BudgetRequest request) {
        ensureUnique(request, null);
        Budget budget = new Budget();
        budget.setUser(authFacade.currentUser());
        budget.setCategory(categoryService.findEntity(request.categoryId()));
        budget.setAmount(request.amount());
        budget.setBudgetMonth(request.budgetMonth());
        budget.setBudgetYear(request.budgetYear());
        return toResponse(budgetRepository.save(budget));
    }

    @Transactional
    public BudgetResponse update(UUID id, BudgetRequest request) {
        ensureUnique(request, id);
        Budget budget = findEntity(id);
        budget.setCategory(categoryService.findEntity(request.categoryId()));
        budget.setAmount(request.amount());
        budget.setBudgetMonth(request.budgetMonth());
        budget.setBudgetYear(request.budgetYear());
        return toResponse(budgetRepository.save(budget));
    }

    @Transactional
    public void delete(UUID id) { budgetRepository.delete(findEntity(id)); }

    @Transactional
    public List<BudgetResponse> duplicateLastMonth(int month, int year) {
        LocalDate current = LocalDate.of(year, month, 1).minusMonths(1);
        List<Budget> source = budgetRepository.findByUserIdAndBudgetMonthAndBudgetYearOrderByCreatedAtAsc(authFacade.currentUser().getId(), current.getMonthValue(), current.getYear());
        return source.stream().map(old -> create(new BudgetRequest(old.getCategory().getId(), old.getAmount(), month, year))).toList();
    }

    private BudgetResponse toResponse(Budget budget) {
        BigDecimal spent = transactionRepository.findByUserIdAndTransactionDateBetween(authFacade.currentUser().getId(), LocalDate.of(budget.getBudgetYear(), budget.getBudgetMonth(), 1), LocalDate.of(budget.getBudgetYear(), budget.getBudgetMonth(), 1).withDayOfMonth(LocalDate.of(budget.getBudgetYear(), budget.getBudgetMonth(), 1).lengthOfMonth())).stream().filter(t -> t.getCategory() != null && t.getCategory().getId().equals(budget.getCategory().getId()) && t.getType().name().equals("EXPENSE")).map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pct = budget.getAmount().compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : spent.multiply(BigDecimal.valueOf(100)).divide(budget.getAmount(), 2, java.math.RoundingMode.HALF_UP);
        String threshold = pct.compareTo(BigDecimal.valueOf(120)) >= 0 ? "danger" : pct.compareTo(BigDecimal.valueOf(100)) >= 0 ? "critical" : pct.compareTo(BigDecimal.valueOf(80)) >= 0 ? "warning" : "healthy";
        return new BudgetResponse(budget.getId(), budget.getCategory().getId(), budget.getCategory().getName(), budget.getAmount(), spent, budget.getBudgetMonth(), budget.getBudgetYear(), threshold);
    }

    private void ensureUnique(BudgetRequest request, UUID excludeId) {
        boolean exists = budgetRepository.findByUserIdAndBudgetMonthAndBudgetYearOrderByCreatedAtAsc(authFacade.currentUser().getId(), request.budgetMonth(), request.budgetYear()).stream().anyMatch(b -> b.getCategory().getId().equals(request.categoryId()) && (excludeId == null || !b.getId().equals(excludeId)));
        if (exists) throw new ApiException("Budget already exists for this category and month");
    }

    private Budget findEntity(UUID id) { return budgetRepository.findByIdAndUserId(id, authFacade.currentUser().getId()).orElseThrow(() -> new ApiException("Budget not found")); }
}
