package com.interviewai.notification;

import com.interviewai.auth.User;
import com.interviewai.auth.UserRepository;
import com.interviewai.email.EmailService;
import com.interviewai.interview.InterviewSession;
import com.interviewai.interview.InterviewSessionRepository;
import com.interviewai.stats.GamificationService;
import com.interviewai.stats.dto.GamificationDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class NotificationService {
    private final EmailService email;
    private final GamificationService gamification;
    private final UserRepository users;
    private final InterviewSessionRepository sessions;

    public NotificationService(EmailService email, GamificationService gamification,
                               UserRepository users, InterviewSessionRepository sessions) {
        this.email = email; this.gamification = gamification;
        this.users = users; this.sessions = sessions;
    }

    /** Called whenever an interview finishes: emails any newly-unlocked achievements and
     *  records the user's current unlocked set so future diffs are accurate. */
    @Transactional
    public void onInterviewFinished(User user) {
        GamificationDto g = gamification.build(user);
        Set<String> prev = new HashSet<>(user.getUnlockedAchievements());

        List<String> nowKeys = new ArrayList<>();
        List<String> newlyTitles = new ArrayList<>();
        for (GamificationDto.Achievement a : g.achievements()) {
            if (!a.unlocked()) continue;
            nowKeys.add(a.key());
            if (!prev.contains(a.key())) newlyTitles.add(a.title());
        }

        if (!newlyTitles.isEmpty() && user.isNotifyAchievements()) {
            email.achievementsUnlocked(user, newlyTitles);
        }
        user.setUnlockedAchievements(nowKeys);
        users.save(user);
    }

    @Transactional
    public void sendDailyReminders() {
        LocalDate today = LocalDate.now();
        for (User u : users.findByNotifyDailyTrue()) {
            if (today.equals(u.getLastDailyEmail())) continue;
            boolean practicedToday = sessions.findByUserIdOrderByStartedAtDesc(u.getId()).stream()
                .anyMatch(s -> s.getStartedAt().toLocalDate().equals(today));
            if (practicedToday) continue;
            email.dailyReminder(u, gamification.build(u).streakDays());
            u.setLastDailyEmail(today);
            users.save(u);
        }
    }

    @Transactional
    public void sendWeeklySummaries() {
        LocalDate today = LocalDate.now();
        OffsetDateTime weekAgo = OffsetDateTime.now().minusDays(7);
        for (User u : users.findByNotifyWeeklyTrue()) {
            // Skip if already sent within the last 6 days (idempotent against restarts).
            if (u.getLastWeeklyEmail() != null && !u.getLastWeeklyEmail().isBefore(today.minusDays(6))) continue;
            List<InterviewSession> week = sessions.findByUserIdOrderByStartedAtDesc(u.getId()).stream()
                .filter(s -> s.getOverallScore() != null && s.getStartedAt().isAfter(weekAgo))
                .toList();
            int count = week.size();
            int avg = count == 0 ? 0
                : (int) Math.round(week.stream().mapToInt(InterviewSession::getOverallScore).average().orElse(0));
            email.weeklySummary(u, count, avg, gamification.build(u).streakDays());
            u.setLastWeeklyEmail(today);
            users.save(u);
        }
    }

    @Transactional
    public void broadcastProductNews(String subject, String html) {
        for (User u : users.findByNotifyProductTrue()) email.productNews(u, subject, html);
    }
}
