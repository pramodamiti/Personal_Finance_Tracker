package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.ForecastDayResponse;
import com.personalfinancetracker.app.dto.CommonDtos.ForecastMonthResponse;
import com.personalfinancetracker.app.dto.CommonDtos.UpcomingExpenseResponse;
import com.personalfinancetracker.app.entity.RecurringFrequency;
import com.personalfinancetracker.app.entity.RecurringTransaction;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.AccountRepository;
import com.personalfinancetracker.app.repository.RecurringTransactionRepository;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ForecastService {
    private final TransactionRepository transactionRepository;
    private final RecurringTransactionRepository recurringTransactionRepository;
    private final AccountRepository accountRepository;
    private final AuthFacade authFacade;

    public ForecastService(TransactionRepository transactionRepository, RecurringTransactionRepository recurringTransactionRepository, AccountRepository accountRepository, AuthFacade authFacade) {
        this.transactionRepository = transactionRepository;
        this.recurringTransactionRepository = recurringTransactionRepository;
        this.accountRepository = accountRepository;
        this.authFacade = authFacade;
    }

    @Transactional(readOnly = true)
    public ForecastMonthResponse monthForecast() {
        ForecastSnapshot snapshot = buildSnapshot();
        BigDecimal safeToSpend = snapshot.projectedEndBalance.min(snapshot.currentBalance).max(BigDecimal.ZERO);
        List<String> warnings = new ArrayList<>();
        if (snapshot.projectedEndBalance.compareTo(BigDecimal.ZERO) < 0) {
            warnings.add("Negative balance likely before month end.");
        }
        if (snapshot.expectedExpenses.compareTo(snapshot.expectedIncome.add(snapshot.currentBalance)) > 0) {
            warnings.add("Planned expenses are outpacing expected income.");
        }
        if (snapshot.knownUpcomingExpenses.stream().anyMatch(expense -> expense.date().isBefore(LocalDate.now().plusDays(7)))) {
            warnings.add("High-priority bills are due within the next 7 days.");
        }
        return new ForecastMonthResponse(
                snapshot.currentBalance,
                snapshot.projectedEndBalance,
                safeToSpend,
                snapshot.expectedIncome,
                snapshot.expectedExpenses,
                snapshot.knownUpcomingExpenses,
                warnings);
    }

    @Transactional(readOnly = true)
    public List<ForecastDayResponse> dailyForecast() {
        ForecastSnapshot snapshot = buildSnapshot();
        return snapshot.dailyProjection;
    }

    private ForecastSnapshot buildSnapshot() {
        LocalDate today = LocalDate.now();
        YearMonth month = YearMonth.from(today);
        LocalDate monthEnd = month.atEndOfMonth();
        List<RecurringTransaction> recurringTransactions = recurringTransactionRepository.findByUserIdOrderByNextRunDateAsc(authFacade.currentUser().getId()).stream()
                .filter(RecurringTransaction::isActive)
                .toList();

        BigDecimal currentBalance = accountRepository.findByUserIdAndArchivedFalseOrderByNameAsc(authFacade.currentUser().getId()).stream()
                .map(account -> account.getCurrentBalance() == null ? BigDecimal.ZERO : account.getCurrentBalance())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDate historyStart = today.minusMonths(3).withDayOfMonth(1);
        List<Transaction> historical = transactionRepository.findByUserIdAndTransactionDateBetweenOrderByTransactionDateAscCreatedAtAsc(
                authFacade.currentUser().getId(),
                historyStart,
                today);

        BigDecimal dailyExpenseAverage = averageDailyAmount(historical, TransactionType.EXPENSE, historyStart, today);
        Map<Integer, BigDecimal> likelyIncomeByDayOfMonth = inferredMonthlyIncomeByDay(historical);

        if (historical.size() < 5) {
            dailyExpenseAverage = dailyExpenseAverage.max(BigDecimal.ZERO);
        }

        List<UpcomingExpenseResponse> upcomingExpenses = recurringTransactions.stream()
                .flatMap(recurring -> occurrencesWithinMonth(recurring, today, monthEnd).stream())
                .filter(expense -> expense.amount().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(UpcomingExpenseResponse::date))
                .toList();

        BigDecimal projectedBalance = currentBalance;
        BigDecimal expectedIncome = BigDecimal.ZERO;
        BigDecimal expectedExpenses = BigDecimal.ZERO;
        List<ForecastDayResponse> dailyPoints = new ArrayList<>();

        dailyPoints.add(new ForecastDayResponse(
                today,
                currentBalance.setScale(2, RoundingMode.HALF_UP),
                BigDecimal.ZERO,
                BigDecimal.ZERO));

        for (LocalDate cursor = today.plusDays(1); !cursor.isAfter(monthEnd); cursor = cursor.plusDays(1)) {
            BigDecimal recurringIncome = recurringAmountForDate(recurringTransactions, cursor, TransactionType.INCOME);
            BigDecimal recurringExpense = recurringAmountForDate(recurringTransactions, cursor, TransactionType.EXPENSE);
            BigDecimal inferredIncome = recurringIncome.compareTo(BigDecimal.ZERO) == 0
                    ? likelyIncomeByDayOfMonth.getOrDefault(cursor.getDayOfMonth(), BigDecimal.ZERO)
                    : BigDecimal.ZERO;
            BigDecimal inferredExpense = recurringExpense.compareTo(BigDecimal.ZERO) == 0 ? dailyExpenseAverage : BigDecimal.ZERO;
            BigDecimal dayIncome = recurringIncome.add(inferredIncome);
            BigDecimal dayExpense = recurringExpense.add(inferredExpense);

            expectedIncome = expectedIncome.add(dayIncome);
            expectedExpenses = expectedExpenses.add(dayExpense);
            projectedBalance = projectedBalance.add(dayIncome).subtract(dayExpense);

            dailyPoints.add(new ForecastDayResponse(cursor, projectedBalance.setScale(2, RoundingMode.HALF_UP), dayIncome, dayExpense));
        }

        return new ForecastSnapshot(currentBalance, projectedBalance, expectedIncome, expectedExpenses, upcomingExpenses, dailyPoints);
    }

    private Map<Integer, BigDecimal> inferredMonthlyIncomeByDay(List<Transaction> transactions) {
        return transactions.stream()
                .filter(transaction -> transaction.getType() == TransactionType.INCOME)
                .collect(Collectors.groupingBy(
                        transaction -> transaction.getTransactionDate().getDayOfMonth(),
                        LinkedHashMap::new,
                        Collectors.toList()))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue().stream()
                        .map(transaction -> YearMonth.from(transaction.getTransactionDate()))
                        .distinct()
                        .count() >= 2)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> entry.getValue().stream()
                                .map(Transaction::getAmount)
                                .reduce(BigDecimal.ZERO, BigDecimal::add)
                                .divide(BigDecimal.valueOf(entry.getValue().size()), 2, RoundingMode.HALF_UP),
                        (left, right) -> right,
                        LinkedHashMap::new));
    }

    private BigDecimal recurringAmountForDate(List<RecurringTransaction> recurringTransactions, LocalDate date, TransactionType type) {
        return recurringTransactions.stream()
                .filter(recurring -> recurring.getTransactionType() == type)
                .filter(recurring -> occursOn(recurring, date))
                .map(RecurringTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<UpcomingExpenseResponse> occurrencesWithinMonth(RecurringTransaction recurring, LocalDate start, LocalDate monthEnd) {
        List<UpcomingExpenseResponse> occurrences = new ArrayList<>();
        if (recurring.getTransactionType() != TransactionType.EXPENSE) {
            return occurrences;
        }
        LocalDate cursor = recurring.getNextRunDate();
        if (cursor == null) {
            return occurrences;
        }
        while (!cursor.isAfter(monthEnd)) {
            if (!cursor.isBefore(start)) {
                occurrences.add(new UpcomingExpenseResponse(cursor, recurring.getTitle(), recurring.getAmount(), "recurring"));
            }
            cursor = nextDate(cursor, recurring.getFrequency());
            if (recurring.getEndDate() != null && cursor.isAfter(recurring.getEndDate())) {
                break;
            }
        }
        return occurrences;
    }

    private boolean occursOn(RecurringTransaction recurring, LocalDate date) {
        LocalDate firstRun = recurring.getNextRunDate();
        if (firstRun == null || date.isBefore(firstRun)) {
            return false;
        }
        if (recurring.getEndDate() != null && date.isAfter(recurring.getEndDate())) {
            return false;
        }
        return switch (recurring.getFrequency()) {
            case DAILY -> true;
            case WEEKLY -> ChronoUnit.DAYS.between(firstRun, date) % 7 == 0;
            case MONTHLY -> firstRun.getDayOfMonth() == date.getDayOfMonth();
            case YEARLY -> firstRun.getDayOfMonth() == date.getDayOfMonth() && firstRun.getMonth() == date.getMonth();
        };
    }

    private LocalDate nextDate(LocalDate base, RecurringFrequency frequency) {
        return switch (frequency) {
            case DAILY -> base.plusDays(1);
            case WEEKLY -> base.plusWeeks(1);
            case MONTHLY -> base.plusMonths(1);
            case YEARLY -> base.plusYears(1);
        };
    }

    private BigDecimal averageDailyAmount(List<Transaction> transactions, TransactionType type, LocalDate start, LocalDate end) {
        BigDecimal total = transactions.stream()
                .filter(transaction -> transaction.getType() == type)
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long days = Math.max(1, ChronoUnit.DAYS.between(start, end) + 1);
        return total.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
    }

    private record ForecastSnapshot(
            BigDecimal currentBalance,
            BigDecimal projectedEndBalance,
            BigDecimal expectedIncome,
            BigDecimal expectedExpenses,
            List<UpcomingExpenseResponse> knownUpcomingExpenses,
            List<ForecastDayResponse> dailyProjection) {
    }
}
