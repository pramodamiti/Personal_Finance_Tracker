package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.entity.Account;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;

@Service
public class BalanceService {
    public void apply(Transaction transaction) {
        mutate(transaction, transaction.getAmount());
    }

    public void reverse(Transaction transaction) {
        mutate(transaction, transaction.getAmount().negate());
    }

    private void mutate(Transaction transaction, BigDecimal amount) {
        if (transaction.getType() == TransactionType.INCOME) {
            adjust(transaction.getAccount(), amount);
        } else if (transaction.getType() == TransactionType.EXPENSE) {
            adjust(transaction.getAccount(), amount.negate());
        } else {
            adjust(transaction.getAccount(), amount.negate());
            adjust(transaction.getDestinationAccount(), amount);
        }
    }

    public void adjust(Account account, BigDecimal delta) {
        account.setCurrentBalance(account.getCurrentBalance().add(delta));
    }
}
