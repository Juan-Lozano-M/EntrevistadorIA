package com.interviewai.notification;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Fires the scheduled emails. Only runs while the application is up. */
@Component
public class NotificationScheduler {
    private final NotificationService notifications;

    public NotificationScheduler(NotificationService notifications) {
        this.notifications = notifications;
    }

    @Scheduled(cron = "${app.email.daily-cron:0 0 18 * * *}")
    public void dailyReminders() {
        notifications.sendDailyReminders();
    }

    @Scheduled(cron = "${app.email.weekly-cron:0 0 9 * * MON}")
    public void weeklySummaries() {
        notifications.sendWeeklySummaries();
    }
}
