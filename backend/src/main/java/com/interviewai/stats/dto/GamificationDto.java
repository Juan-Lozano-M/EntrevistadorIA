package com.interviewai.stats.dto;

import java.util.List;

public record GamificationDto(
    int xp,
    int level,
    String levelName,
    int xpInLevel,
    int xpForNextLevel,
    int streakDays,
    int bestStreak,
    List<Achievement> achievements) {

    public record Achievement(
        String key,
        String title,
        String description,
        String category,
        String tier,
        int xpReward,
        int progress,
        int target,
        boolean unlocked) {}
}
