package com.personalfinancetracker.app.mapper;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.entity.*;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class AppMapper {
    public UserResponse toUser(User user) { return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName()); }
    public AccountResponse toAccount(Account account) { return new AccountResponse(account.getId(), account.getName(), account.getType(), account.getOpeningBalance(), account.getCurrentBalance(), account.getInstitutionName(), account.isArchived()); }
    public CategoryResponse toCategory(Category category) { return new CategoryResponse(category.getId(), category.getName(), category.getType(), category.getIcon(), category.getColor(), category.isArchived(), category.isSystemDefault()); }
    public TransactionResponse toTransaction(Transaction transaction) { return new TransactionResponse(transaction.getId(), transaction.getType(), transaction.getAmount(), transaction.getTransactionDate(), transaction.getAccount() == null ? null : transaction.getAccount().getId(), transaction.getDestinationAccount() == null ? null : transaction.getDestinationAccount().getId(), transaction.getCategory() == null ? null : transaction.getCategory().getId(), transaction.getMerchant(), transaction.getNote(), transaction.getTags() == null ? List.of() : Arrays.asList(transaction.getTags()), transaction.getPaymentMethod(), transaction.getCreatedAt()); }
    public GoalResponse toGoal(Goal goal) { BigDecimal pct = goal.getTargetAmount().compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO : goal.getCurrentAmount().multiply(BigDecimal.valueOf(100)).divide(goal.getTargetAmount(), 2, java.math.RoundingMode.HALF_UP); return new GoalResponse(goal.getId(), goal.getName(), goal.getTargetAmount(), goal.getCurrentAmount(), pct, goal.getTargetDate(), goal.getLinkedAccount() == null ? null : goal.getLinkedAccount().getId(), goal.getStatus(), goal.getIcon(), goal.getColor()); }
    public RecurringResponse toRecurring(RecurringTransaction recurring) { return new RecurringResponse(recurring.getId(), recurring.getTitle(), recurring.getTransactionType(), recurring.getFrequency(), recurring.getAmount(), recurring.getNextRunDate(), recurring.isActive(), recurring.isAutoCreateTransaction(), recurring.getMerchant(), recurring.getNote()); }
}
