package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.HealthScoreFactorResponse;
import com.personalfinancetracker.app.dto.CommonDtos.HealthScoreResponse;
import com.personalfinancetracker.app.dto.CommonDtos.InsightResponse;
import com.personalfinancetracker.app.dto.CommonDtos.NetWorthPointResponse;
import com.personalfinancetracker.app.dto.CommonDtos.TrendPointResponse;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.AccountRepository;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InsightsService {
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final AuthFacade authFacade;
    private final BudgetService budgetService;

    public InsightsService(TransactionRepository transactionRepository, AccountRepository accountRepository, AuthFacade authFacade, BudgetService budgetService) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.authFacade = authFacade;
        this.budgetService = budgetService;
    }

    @Transactional(readOnly = true)
    public HealthScoreResponse healthScore() {
        LocalDate now = LocalDate.now();
        List<Transaction> currentMonth = transactionsForMonth(YearMonth.from(now));
        List<Transaction> previousThreeMonths = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                authFacade.currentUser().getId(),
                now.minusMonths(3).withDayOfMonth(1),
                now);

        BigDecimal income = total(currentMonth, TransactionType.INCOME);
        BigDecimal expense = total(currentMonth, TransactionType.EXPENSE);
        BigDecimal savingsRate = income.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : income.subtract(expense).max(BigDecimal.ZERO).multiply(BigDecimal.valueOf(100)).divide(income, 2, RoundingMode.HALF_UP);
        int savingsScore = clampScore(savingsRate);

        List<BigDecimal> monthlyExpenses = monthlyTotals(previousThreeMonths, TransactionType.EXPENSE);
        BigDecimal avgExpense = average(monthlyExpenses);
        BigDecimal expenseStability = avgExpense.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.valueOf(100)
                : BigDecimal.valueOf(100).subtract(standardDeviation(monthlyExpenses, avgExpense).multiply(BigDecimal.valueOf(100)).divide(avgExpense, 2, RoundingMode.HALF_UP));
        int stabilityScore = clampScore(expenseStability.max(BigDecimal.ZERO));

        BigDecimal budgetAdherencePct = budgetService.list(now.getMonthValue(), now.getYear()).isEmpty()
                ? BigDecimal.valueOf(70)
                : BigDecimal.valueOf(
                        budgetService.list(now.getMonthValue(), now.getYear()).stream()
                                .filter(budget -> budget.spent().compareTo(budget.amount()) <= 0)
                                .count())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(Math.max(1, budgetService.list(now.getMonthValue(), now.getYear()).size())), 2, RoundingMode.HALF_UP);
        int budgetScore = clampScore(budgetAdherencePct);

        BigDecimal currentBalance = accountRepository.findByUserIdAndArchivedFalseOrderByNameAsc(authFacade.currentUser().getId()).stream()
                .map(account -> account.getCurrentBalance() == null ? BigDecimal.ZERO : account.getCurrentBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal monthlySpend = expense.max(BigDecimal.ONE);
        BigDecimal cashBufferMonths = currentBalance.divide(monthlySpend, 2, RoundingMode.HALF_UP);
        int cashBufferScore = clampScore(cashBufferMonths.multiply(BigDecimal.valueOf(25)));

        List<HealthScoreFactorResponse> factors = List.of(
                new HealthScoreFactorResponse("Savings rate", savingsScore, 30, savingsRate, labelForScore(savingsScore), "How much of this month's income remains after spending."),
                new HealthScoreFactorResponse("Expense stability", stabilityScore, 20, expenseStability.max(BigDecimal.ZERO), labelForScore(stabilityScore), "Whether monthly expenses are staying predictable."),
                new HealthScoreFactorResponse("Budget adherence", budgetScore, 25, budgetAdherencePct, labelForScore(budgetScore), "Share of budgets currently on track."),
                new HealthScoreFactorResponse("Cash buffer", cashBufferScore, 25, cashBufferMonths, labelForScore(cashBufferScore), "Months of spending covered by current balances."));

        int score = weightedScore(factors);
        List<String> suggestions = buildSuggestions(savingsScore, stabilityScore, budgetScore, cashBufferScore);
        return new HealthScoreResponse(score, factors, suggestions);
    }

    @Transactional(readOnly = true)
    public List<InsightResponse> insights() {
        LocalDate now = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(now);
        YearMonth previousMonth = currentMonth.minusMonths(1);
        List<Transaction> current = transactionsForMonth(currentMonth);
        List<Transaction> previous = transactionsForMonth(previousMonth);

        BigDecimal currentFood = categoryTotal(current, "Food");
        BigDecimal previousFood = categoryTotal(previous, "Food");
        BigDecimal currentSaved = total(current, TransactionType.INCOME).subtract(total(current, TransactionType.EXPENSE));
        BigDecimal previousSaved = total(previous, TransactionType.INCOME).subtract(total(previous, TransactionType.EXPENSE));

        List<InsightResponse> insights = new ArrayList<>();
        if (previousFood.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal change = currentFood.subtract(previousFood)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(previousFood, 2, RoundingMode.HALF_UP);
            insights.add(new InsightResponse(
                    "Food spending trend",
                    "Food spending changed " + change.stripTrailingZeros().toPlainString() + "% compared with last month.",
                    change.compareTo(BigDecimal.ZERO) > 0 ? "warning" : "positive"));
        }
        insights.add(new InsightResponse(
                "Savings momentum",
                currentSaved.compareTo(previousSaved) >= 0
                        ? "You saved more this month than last month."
                        : "Savings are behind last month. Review discretionary categories.",
                currentSaved.compareTo(previousSaved) >= 0 ? "positive" : "warning"));

        TrendPointResponse latestTrend = trends().stream().max(Comparator.comparing(TrendPointResponse::period)).orElse(null);
        if (latestTrend != null && latestTrend.topCategory() != null) {
            insights.add(new InsightResponse(
                    "Top spend category",
                    latestTrend.topCategory() + " is your largest expense category this month at $" + latestTrend.topCategoryAmount().stripTrailingZeros().toPlainString() + ".",
                    "info"));
        }
        return insights;
    }

    @Transactional(readOnly = true)
    public List<TrendPointResponse> trends() {
        LocalDate now = LocalDate.now();
        LocalDate from = now.minusMonths(5).withDayOfMonth(1);
        List<Transaction> transactions = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                authFacade.currentUser().getId(),
                from,
                now);
        List<TrendPointResponse> points = new ArrayList<>();
        for (YearMonth month = YearMonth.from(from); !month.isAfter(YearMonth.from(now)); month = month.plusMonths(1)) {
            YearMonth current = month;
            List<Transaction> monthTransactions = transactions.stream()
                    .filter(transaction -> YearMonth.from(transaction.getTransactionDate()).equals(current))
                    .toList();
            BigDecimal income = total(monthTransactions, TransactionType.INCOME);
            BigDecimal expense = total(monthTransactions, TransactionType.EXPENSE);
            BigDecimal savingsRate = income.compareTo(BigDecimal.ZERO) == 0
                    ? BigDecimal.ZERO
                    : income.subtract(expense).multiply(BigDecimal.valueOf(100)).divide(income, 2, RoundingMode.HALF_UP);
            Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
            for (Transaction transaction : monthTransactions) {
                if (transaction.getType() == TransactionType.EXPENSE && transaction.getCategory() != null) {
                    byCategory.merge(transaction.getCategory().getName(), transaction.getAmount(), BigDecimal::add);
                }
            }
            Map.Entry<String, BigDecimal> topCategory = byCategory.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElse(null);
            points.add(new TrendPointResponse(
                    month.toString(),
                    income,
                    expense,
                    savingsRate,
                    topCategory == null ? null : topCategory.getKey(),
                    topCategory == null ? BigDecimal.ZERO : topCategory.getValue()));
        }
        return points;
    }

    @Transactional(readOnly = true)
    public List<NetWorthPointResponse> netWorth() {
        LocalDate now = LocalDate.now();
        BigDecimal assets = accountRepository.findByUserIdAndArchivedFalseOrderByNameAsc(authFacade.currentUser().getId()).stream()
                .map(account -> account.getCurrentBalance() == null ? BigDecimal.ZERO : account.getCurrentBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<NetWorthPointResponse> points = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.from(now.minusMonths(i));
            List<Transaction> monthTransactions = transactionsForMonth(month);
            BigDecimal monthIncome = total(monthTransactions, TransactionType.INCOME);
            BigDecimal monthExpense = total(monthTransactions, TransactionType.EXPENSE);
            BigDecimal estimatedNetWorth = assets.subtract(totalExpensesSince(month.plusMonths(1), YearMonth.from(now))).add(totalIncomeSince(month.plusMonths(1), YearMonth.from(now)));
            points.add(new NetWorthPointResponse(month.toString(), assets.max(BigDecimal.ZERO), BigDecimal.ZERO.max(monthExpense.subtract(monthIncome)), estimatedNetWorth));
        }
        return points;
    }

    private List<Transaction> transactionsForMonth(YearMonth month) {
        return transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                authFacade.currentUser().getId(),
                month.atDay(1),
                month.atEndOfMonth());
    }

    private BigDecimal totalIncomeSince(YearMonth from, YearMonth to) {
        BigDecimal total = BigDecimal.ZERO;
        for (YearMonth month = from; !month.isAfter(to); month = month.plusMonths(1)) {
            total = total.add(total(transactionsForMonth(month), TransactionType.INCOME));
        }
        return total;
    }

    private BigDecimal totalExpensesSince(YearMonth from, YearMonth to) {
        BigDecimal total = BigDecimal.ZERO;
        for (YearMonth month = from; !month.isAfter(to); month = month.plusMonths(1)) {
            total = total.add(total(transactionsForMonth(month), TransactionType.EXPENSE));
        }
        return total;
    }

    private List<BigDecimal> monthlyTotals(List<Transaction> transactions, TransactionType type) {
        Map<YearMonth, BigDecimal> totals = new LinkedHashMap<>();
        for (Transaction transaction : transactions) {
            if (transaction.getType() == type) {
                totals.merge(YearMonth.from(transaction.getTransactionDate()), transaction.getAmount(), BigDecimal::add);
            }
        }
        return totals.values().stream().toList();
    }

    private BigDecimal categoryTotal(List<Transaction> transactions, String categoryName) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == TransactionType.EXPENSE)
                .filter(transaction -> transaction.getCategory() != null && categoryName.equalsIgnoreCase(transaction.getCategory().getName()))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal total(List<Transaction> transactions, TransactionType type) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal average(List<BigDecimal> values) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal standardDeviation(List<BigDecimal> values, BigDecimal mean) {
        if (values.isEmpty()) {
            return BigDecimal.ZERO;
        }
        double meanDouble = mean.doubleValue();
        double variance = values.stream()
                .mapToDouble(value -> Math.pow(value.doubleValue() - meanDouble, 2))
                .average()
                .orElse(0.0);
        return BigDecimal.valueOf(Math.sqrt(variance));
    }

    private int weightedScore(List<HealthScoreFactorResponse> factors) {
        BigDecimal total = BigDecimal.ZERO;
        for (HealthScoreFactorResponse factor : factors) {
            total = total.add(BigDecimal.valueOf(factor.score()).multiply(BigDecimal.valueOf(factor.weight())));
        }
        return total.divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).intValue();
    }

    private List<String> buildSuggestions(int savingsScore, int stabilityScore, int budgetScore, int cashBufferScore) {
        List<String> suggestions = new ArrayList<>();
        if (savingsScore < 60) {
            suggestions.add("Increase your monthly savings rate by trimming flexible spending categories.");
        }
        if (stabilityScore < 60) {
            suggestions.add("Expenses are volatile. Add rules and budgets for repeat merchants to improve consistency.");
        }
        if (budgetScore < 60) {
            suggestions.add("Several budgets are off track. Revisit category limits before month end.");
        }
        if (cashBufferScore < 60) {
            suggestions.add("Build a larger cash buffer so balances can cover more than one month of spending.");
        }
        if (suggestions.isEmpty()) {
            suggestions.add("Your finances look balanced. Keep monitoring recurring spending and savings momentum.");
        }
        return suggestions;
    }

    private int clampScore(BigDecimal value) {
        return Math.max(0, Math.min(100, value.setScale(0, RoundingMode.HALF_UP).intValue()));
    }

    private String labelForScore(int score) {
        if (score >= 80) {
            return "strong";
        }
        if (score >= 60) {
            return "stable";
        }
        return "needs-attention";
    }
}
