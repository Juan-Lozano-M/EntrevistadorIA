package com.interviewai.interview;

import java.util.List;

public record FeedbackResult(List<String> strengths, List<String> weaknesses,
                             List<String> recommendations, List<String> improvementPlan) {}
