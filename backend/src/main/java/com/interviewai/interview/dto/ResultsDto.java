package com.interviewai.interview.dto;
import java.util.List;
import java.util.Map;
public record ResultsDto(
    Long sessionId, String roleTitle, String level, String type,
    Integer overallScore, Map<String, Integer> dimensionScores,
    FeedbackDto feedback, List<AnswerReviewDto> answers) {

    public record FeedbackDto(List<String> strengths, List<String> weaknesses,
                              List<String> recommendations, List<String> improvementPlan) {}
    public record AnswerReviewDto(Long questionId, String questionText, String answerText,
                                  String modelAnswer, Map<String, Integer> dimensionScores) {}
}
