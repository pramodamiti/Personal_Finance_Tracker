package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.config.AppProperties;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.repository.TransactionRepository;
import com.personalfinancetracker.app.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailySummaryEmailService {
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public DailySummaryEmailService(UserRepository userRepository, TransactionRepository transactionRepository,
                                   JavaMailSender mailSender, AppProperties appProperties) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.mailSender = mailSender;
        this.appProperties = appProperties;
    }

    @Transactional(readOnly = true)
    public void sendDailySummaryEmails() {
        ZoneId zone = ZoneId.of(appProperties.getMail().getDailyZone());
        LocalDate targetDate = LocalDate.now(zone).minusDays(1);
        int activeWithinDays = Math.max(0, appProperties.getMail().getDailyActiveWithinDays());
        OffsetDateTime cutoff = OffsetDateTime.now(zone).minusDays(activeWithinDays);

        var users = userRepository.findAll().stream()
                .filter(u -> u.isActive() && u.getEmail() != null && !u.getEmail().isBlank())
                .filter(u -> u.getLastLoginAt() != null && (activeWithinDays == 0 || u.getLastLoginAt().isAfter(cutoff)))
                .toList();

        for (var user : users) {
            List<Transaction> txns = transactionRepository.findByUserIdAndTransactionDateBetween(
                    user.getId(), targetDate, targetDate);

            String body = buildBody(user.getDisplayName(), targetDate, zone, txns);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(appProperties.getMail().getFrom());
            message.setTo(user.getEmail());
            message.setSubject("Daily Summary - " + targetDate);
            message.setText(body);
            mailSender.send(message);
        }
    }

    private String buildBody(String displayName, LocalDate date, ZoneId zone, List<Transaction> txns) {
        BigDecimal income = sumByType(txns, TransactionType.INCOME);
        BigDecimal expense = sumByType(txns, TransactionType.EXPENSE);
        BigDecimal net = income.subtract(expense);

        String topExpenses = buildTopExpenseCategories(txns, 5);
        String appUrl = appProperties.getCors().getAllowedOrigins().stream().findFirst().orElse("");

        return """
                Hi %s,

                Here is your daily summary for %s (%s):

                Income:  %s
                Expense: %s
                Net:     %s

                Top expense categories:
                %s

                Open the app: %s
                """.formatted(
                (displayName == null || displayName.isBlank()) ? "there" : displayName.trim(),
                date,
                zone,
                income,
                expense,
                net,
                topExpenses,
                appUrl
        ).trim();
    }

    private BigDecimal sumByType(List<Transaction> txns, TransactionType type) {
        return txns.stream()
                .filter(t -> t.getType() == type)
                .map(Transaction::getAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String buildTopExpenseCategories(List<Transaction> txns, int limit) {
        Map<String, BigDecimal> totals = txns.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> t.getCategory() == null || t.getCategory().getName() == null || t.getCategory().getName().isBlank()
                                ? "Uncategorized"
                                : t.getCategory().getName().trim(),
                        Collectors.reducing(BigDecimal.ZERO, t -> Objects.requireNonNullElse(t.getAmount(), BigDecimal.ZERO), BigDecimal::add)
                ));

        if (totals.isEmpty()) {
            return "- (no expenses)";
        }

        Map<String, BigDecimal> top = totals.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new
                ));

        return top.entrySet().stream()
                .map(e -> "- " + e.getKey() + ": " + e.getValue())
                .collect(Collectors.joining("\n"));
    }
}
