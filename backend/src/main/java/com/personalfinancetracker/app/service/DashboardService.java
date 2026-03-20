package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.AccountRepository;
import com.personalfinancetracker.app.repository.GoalRepository;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DashboardService {
    private final TransactionRepository transactionRepository;
    private final AuthFacade authFacade;
    private final BudgetService budgetService;
    private final GoalService goalService;
    private final RecurringService recurringService;
    private final AccountRepository accountRepository;
    private final ReportService reportService;
    private final TransactionService transactionService;

    public DashboardService(TransactionRepository transactionRepository, AuthFacade authFacade, BudgetService budgetService, GoalService goalService, RecurringService recurringService, AccountRepository accountRepository, ReportService reportService, TransactionService transactionService) {
        this.transactionRepository = transactionRepository;
        this.authFacade = authFacade;
        this.budgetService = budgetService;
        this.goalService = goalService;
        this.recurringService = recurringService;
        this.accountRepository = accountRepository;
        this.reportService = reportService;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> summary() {
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());
        List<com.personalfinancetracker.app.entity.Transaction> txs = transactionRepository.findByUserIdAndTransactionDateBetween(authFacade.currentUser().getId(), start, end);
        BigDecimal income = txs.stream().filter(t -> t.getType() == TransactionType.INCOME).map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expense = txs.stream().filter(t -> t.getType() == TransactionType.EXPENSE).map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = income.subtract(expense);
        BigDecimal balances = accountRepository.findByUserIdAndArchivedFalseOrderByNameAsc(authFacade.currentUser().getId()).stream().map(a -> a.getCurrentBalance()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("income", income, "expense", expense, "net", net, "totalBalances", balances);
    }

    public Object budgetOverview() { return budgetService.list(LocalDate.now().getMonthValue(), LocalDate.now().getYear()); }
    public Object goalsOverview() { return goalService.list(); }
    public Object recentTransactions() { return transactionService.recent(); }
    public Object upcomingBills() { return recurringService.upcoming(); }
    public Object spendingByCategory() { return reportService.categorySpend(LocalDate.now().withDayOfMonth(1), LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth())); }
    public Object incomeExpenseTrend() { return reportService.incomeVsExpense(LocalDate.now().minusMonths(5).withDayOfMonth(1), LocalDate.now()); }
}
