package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;
    private final AuthFacade authFacade;
    private final InsightsService insightsService;

    public ReportService(TransactionRepository transactionRepository, AuthFacade authFacade, InsightsService insightsService) {
        this.transactionRepository = transactionRepository;
        this.authFacade = authFacade;
        this.insightsService = insightsService;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> categorySpend(LocalDate from, LocalDate to) {

        return filtered(from, to).stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE && t.getCategory() != null)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getName(),
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                t -> t.getAmount(),
                                BigDecimal::add)))
                .entrySet()
                .stream()
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("category", e.getKey());
                    row.put("amount", e.getValue());
                    return row;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> incomeVsExpense(LocalDate from, LocalDate to) {

        List<Map<String, Object>> result = new ArrayList<>();

        YearMonth start = YearMonth.from(from);
        YearMonth end = YearMonth.from(to);

        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {

            BigDecimal income = filtered(ym.atDay(1), ym.atEndOfMonth()).stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .map(t -> t.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal expense = filtered(ym.atDay(1), ym.atEndOfMonth()).stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .map(t -> t.getAmount())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", ym.toString());
            row.put("income", income);
            row.put("expense", expense);

            result.add(row);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> accountBalanceTrend(LocalDate from, LocalDate to) {

        if (authFacade.currentUser() == null) {
            return new ArrayList<>();
        }

        return filtered(from, to).stream()
                .map(t -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("date", t.getTransactionDate());
                    row.put("account",
                            t.getAccount() == null
                                    ? "Transfer"
                                    : t.getAccount().getName());
                    row.put("amount", t.getAmount());
                    row.put("type", t.getType().name());
                    return row;
                })
                .collect(Collectors.toList());
    }

    public List<Map<String, Object>> savingsProgress() {
        return incomeVsExpense(LocalDate.now().minusMonths(5).withDayOfMonth(1), LocalDate.now()).stream()
                .map(row -> {
                    BigDecimal income = (BigDecimal) row.get("income");
                    BigDecimal expense = (BigDecimal) row.get("expense");
                    BigDecimal savingsRate = income.compareTo(BigDecimal.ZERO) == 0
                            ? BigDecimal.ZERO
                            : income.subtract(expense).multiply(BigDecimal.valueOf(100)).divide(income, 2, RoundingMode.HALF_UP);
                    Map<String, Object> item = new LinkedHashMap<>(row);
                    item.put("savingsRate", savingsRate);
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object trends(LocalDate from, LocalDate to) {
        YearMonth fromMonth = YearMonth.from(from);
        YearMonth toMonth = YearMonth.from(to);
        return insightsService.trends().stream()
                .filter(point -> {
                    YearMonth pointMonth = YearMonth.parse(point.period());
                    return !pointMonth.isBefore(fromMonth) && !pointMonth.isAfter(toMonth);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Object netWorth() {
        return insightsService.netWorth();
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportCsv(LocalDate from, LocalDate to) {

        String header = "date,type,amount,merchant,note\n";

        String body = filtered(from, to).stream()
                .map(t -> String.join(",",
                        t.getTransactionDate().toString(),
                        t.getType().name(),
                        t.getAmount().toString(),
                        safe(t.getMerchant()),
                        safe(t.getNote())))
                .collect(Collectors.joining("\n"));

        return new ByteArrayInputStream((header + body)
                .getBytes(StandardCharsets.UTF_8));
    }

    private List<com.personalfinancetracker.app.entity.Transaction> filtered(LocalDate from, LocalDate to) {
        return transactionRepository.findByUserIdAndTransactionDateBetween(
                authFacade.currentUser().getId(),
                from,
                to);
    }

    private String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}
