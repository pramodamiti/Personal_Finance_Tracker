package com.personalfinancetracker.app.scheduler;

import com.personalfinancetracker.app.service.DailySummaryEmailService;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.mail", name = "daily-enabled", havingValue = "true")
public class DailySummaryEmailScheduler {
    private final DailySummaryEmailService dailySummaryEmailService;

    public DailySummaryEmailScheduler(DailySummaryEmailService dailySummaryEmailService) {
        this.dailySummaryEmailService = dailySummaryEmailService;
    }

    @Scheduled(cron = "${app.mail.daily-cron:0 0 8 * * *}", zone = "${app.mail.daily-zone:UTC}")
    @SchedulerLock(
            name = "DailySummaryEmailScheduler.sendDailySummaryEmails",
            lockAtMostFor = "${app.scheduling.lock-at-most-for:PT10M}",
            lockAtLeastFor = "${app.scheduling.lock-at-least-for:PT30S}"
    )
    public void sendDailySummaryEmails() {
        dailySummaryEmailService.sendDailySummaryEmails();
    }
}

