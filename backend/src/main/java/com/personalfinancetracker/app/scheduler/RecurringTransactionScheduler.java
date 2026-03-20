package com.personalfinancetracker.app.scheduler;

import com.personalfinancetracker.app.service.RecurringService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringTransactionScheduler {
    private final RecurringService recurringService;

    public RecurringTransactionScheduler(RecurringService recurringService) {
        this.recurringService = recurringService;
    }

    @Scheduled(cron = "0 0 * * * *")
    public void processRecurringTransactions() {
        recurringService.runDueTransactions();
    }
}
