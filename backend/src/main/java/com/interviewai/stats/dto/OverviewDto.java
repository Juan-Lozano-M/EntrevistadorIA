package com.interviewai.stats.dto;

import java.util.List;
import java.util.Map;

public record OverviewDto(
    int total,
    int completed,
    int average,
    int best,
    List<Point> timeline,
    Map<String, Integer> dimensionAverages) {

    public record Point(String date, int score, Map<String, Integer> dimensionScores) {}
}
