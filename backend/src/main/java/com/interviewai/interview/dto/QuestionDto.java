package com.interviewai.interview.dto;
import com.interviewai.question.Question;
public record QuestionDto(Long id, String text, String type, int index, int total) {
    public static QuestionDto of(Question q, int index, int total) {
        return new QuestionDto(q.getId(), q.getText(), q.getType(), index, total);
    }
}
