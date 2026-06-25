package com.interviewai.account.dto;

import com.interviewai.auth.User;

public record AccountDto(String name, String email, String plan, Notifications notifications, Card card) {
    public record Notifications(boolean daily, boolean weekly, boolean achievements, boolean product) {}
    public record Card(String brand, String last4) {}

    public static AccountDto from(User u) {
        Card card = u.getCardLast4() != null ? new Card(u.getCardBrand(), u.getCardLast4()) : null;
        return new AccountDto(u.getName(), u.getEmail(), u.getPlan(),
            new Notifications(u.isNotifyDaily(), u.isNotifyWeekly(), u.isNotifyAchievements(), u.isNotifyProduct()),
            card);
    }
}
