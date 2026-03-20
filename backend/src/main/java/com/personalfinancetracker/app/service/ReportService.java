package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private final TransactionRepository transactionRepository;
    private final AuthFacade authFacade;

    public ReportService(TransactionRepository transactionRepository, AuthFacade authFacade) {
        this.transactionRepository = transactionRepository;
        this.authFacade = authFacade;
    }

    public List<Map<String, Object>> categorySpend(LocalDate from, LocalDate to) {
        return filtered(from, to).stream().filter(t -> t.getType() == TransactionType.EXPENSE && t.getCategory() != null)
                .collect(java.util.stream.Collectors.groupingBy(t -> t.getCategory().getName(), java.util.stream.Collectors.reducing(BigDecimal.ZERO, t -> t.getAmount(), BigDecimal::add)))
                .entrySet().stream().map(e -> Map.of("category", e.getKey(), "amount", e.getValue())).toList();
    }

    public List<Map<String, Object>> incomeVsExpense(LocalDate from, LocalDate to) {
        return java.util.stream.Stream.iterate(YearMonth.from(from), ym -> !ym.isAfter(YearMonth.from(to)), ym -> ym.plusMonths(1)).map(ym -> {
            BigDecimal income = filtered(ym.atDay(1), ym.atEndOfMonth()).stream().filter(t -> t.getType() == TransactionType.INCOME).map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal expense = filtered(ym.atDay(1), ym.atEndOfMonth()).stream().filter(t -> t.getType() == TransactionType.EXPENSE).map(t -> t.getAmount()).reduce(BigDecimal.ZERO, BigDecimal::add);
            return Map.of("month", ym.toString(), "income", income, "expense", expense);
        }).toList();
    }

    public List<Map<String, Object>> accountBalanceTrend(LocalDate from, LocalDate to) {
        return authFacade.currentUser() == null ? List.of() : filtered(from, to).stream().map(t -> Map.of("date", t.getTransactionDate(), "account", t.getAccount() == null ? "Transfer" : t.getAccount().getName(), "amount", t.getAmount(), "type", t.getType().name())).toList();
    }

    public List<Map<String, Object>> savingsProgress() { return List.of(); }

    public ByteArrayInputStream exportCsv(LocalDate from, LocalDate to) {
        String header = "date,type,amount,merchant,note\n";
        String body = filtered(from, to).stream().map(t -> String.join(",", t.getTransactionDate().toString(), t.getType().name(), t.getAmount().toString(), safe(t.getMerchant()), safe(t.getNote()))).collect(java.util.stream.Collectors.joining("\n"));
        return new ByteArrayInputStream((header + body).getBytes(StandardCharsets.UTF_8));
    }

    private List<com.personalfinancetracker.app.entity.Transaction> filtered(LocalDate from, LocalDate to) {
        return transactionRepository.findByUserIdAndTransactionDateBetween(authFacade.currentUser().getId(), from, to);
    }

    private String safe(String value) { return value == null ? "" : value.replace(",", " "); }
}
