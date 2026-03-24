package com.personalfinancetracker.app.dto;

import com.personalfinancetracker.app.entity.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class CommonDtos {
    public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {}
    public record UserResponse(UUID id, String email, String displayName) {}
    public record RegisterRequest(@Email String email, @NotBlank String displayName,
                                  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", message = "Password must contain uppercase, lowercase, number and minimum 8 characters") String password) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record RefreshRequest(@NotBlank String refreshToken) {}

    public record AccountRequest(@NotBlank String name, @NotNull AccountType type, BigDecimal openingBalance, String institutionName) {}
    public record AccountResponse(UUID id, String name, AccountType type, BigDecimal openingBalance, BigDecimal currentBalance, String institutionName, boolean archived) {}
    public record TransferRequest(@NotNull UUID sourceAccountId, @NotNull UUID destinationAccountId, @NotNull @DecimalMin("0.01") BigDecimal amount, @NotNull LocalDate date, String note) {}

    public record CategoryRequest(@NotBlank String name, @NotNull CategoryType type, String icon, String color) {}
    public record CategoryResponse(UUID id, String name, CategoryType type, String icon, String color, boolean archived, boolean systemDefault) {}

    public record TransactionRequest(@NotNull TransactionType type, @NotNull @DecimalMin("0.01") BigDecimal amount, @NotNull LocalDate transactionDate, UUID accountId, UUID destinationAccountId, UUID categoryId, String merchant, String note, List<String> tags, PaymentMethod paymentMethod, UUID recurringTransactionId) {}
    public record TransactionResponse(UUID id, TransactionType type, BigDecimal amount, LocalDate transactionDate, UUID accountId, String accountName, UUID destinationAccountId, String destinationAccountName, UUID categoryId, String categoryName, String merchant, String note, List<String> tags, PaymentMethod paymentMethod, OffsetDateTime createdAt) {}

    public record BudgetRequest(@NotNull UUID categoryId, @NotNull @DecimalMin("0.01") BigDecimal amount, @Min(1) @Max(12) Integer budgetMonth, @Min(2000) Integer budgetYear) {}
    public record BudgetResponse(UUID id, UUID categoryId, String categoryName, BigDecimal amount, BigDecimal spent, Integer budgetMonth, Integer budgetYear, String threshold) {}

    public record GoalRequest(@NotBlank String name, @NotNull @DecimalMin("0.01") BigDecimal targetAmount, BigDecimal currentAmount, LocalDate targetDate, UUID linkedAccountId, String icon, String color, GoalStatus status) {}
    public record GoalActionRequest(@NotNull @DecimalMin("0.01") BigDecimal amount) {}
    public record GoalResponse(UUID id, String name, BigDecimal targetAmount, BigDecimal currentAmount, BigDecimal percentage, LocalDate targetDate, UUID linkedAccountId, GoalStatus status, String icon, String color) {}

    public record RecurringRequest(@NotBlank String title, @NotNull TransactionType transactionType, @NotNull RecurringFrequency frequency, @NotNull @DecimalMin("0.01") BigDecimal amount, @NotNull LocalDate startDate, LocalDate endDate, LocalDate nextRunDate, UUID accountId, UUID destinationAccountId, UUID categoryId, String merchant, String note, Boolean autoCreateTransaction, Boolean active) {}
    public record RecurringResponse(UUID id, String title, TransactionType transactionType, RecurringFrequency frequency, BigDecimal amount, LocalDate startDate, LocalDate endDate, LocalDate nextRunDate, UUID accountId, String accountName, UUID destinationAccountId, String destinationAccountName, UUID categoryId, String categoryName, boolean active, boolean autoCreateTransaction, String merchant, String note) {}

    public record RuleRequest(@NotBlank String name, Integer priority, @NotNull Map<String, Object> condition, @NotNull Map<String, Object> action, boolean isActive) {}
    public record RuleResponse(UUID id, String name, int priority, Map<String, Object> condition, Map<String, Object> action, boolean isActive, OffsetDateTime createdAt) {}

    public record ForecastDayResponse(LocalDate date, BigDecimal projectedBalance, BigDecimal expectedIncome, BigDecimal expectedExpense) {}
    public record UpcomingExpenseResponse(LocalDate date, String title, BigDecimal amount, String source) {}
    public record ForecastMonthResponse(BigDecimal currentBalance, BigDecimal projectedEndBalance, BigDecimal safeToSpend, BigDecimal expectedIncome, BigDecimal expectedExpenses, List<UpcomingExpenseResponse> upcomingExpenses, List<String> warnings) {}

    public record HealthScoreFactorResponse(String name, int score, int weight, BigDecimal metricValue, String status, String summary) {}
    public record HealthScoreResponse(int score, List<HealthScoreFactorResponse> factors, List<String> suggestions) {}

    public record InsightResponse(String title, String message, String severity) {}
    public record TrendPointResponse(String period, BigDecimal income, BigDecimal expense, BigDecimal savingsRate, String topCategory, BigDecimal topCategoryAmount) {}
    public record NetWorthPointResponse(String month, BigDecimal assets, BigDecimal liabilities, BigDecimal netWorth) {}
}
