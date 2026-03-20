package com.personalfinancetracker.app.scheduler;

import com.personalfinancetracker.app.service.RecurringService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurringTransactionScheduler {
    private final RecurringService recurringService;

    public RecurringTransactionScheduler(RecurringService recurringService) {
        this.recurringService = recurringService;
    }

    @Scheduled(cron = "${app.scheduling.recurring-cron:0 0 * * * *}")
    @SchedulerLock(
            name = "RecurringTransactionScheduler.processRecurringTransactions",
            lockAtMostFor = "${app.scheduling.lock-at-most-for:PT10M}",
            lockAtLeastFor = "${app.scheduling.lock-at-least-for:PT30S}"
    )
    public void processRecurringTransactions() {
        recurringService.runDueTransactions();
    }
}
