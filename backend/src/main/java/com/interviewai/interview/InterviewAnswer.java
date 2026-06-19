package com.interviewai.interview;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.Map;

@Entity
@Table(name = "interview_answers")
public class InterviewAnswer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "session_id") private Long sessionId;
    @Column(name = "question_id") private Long questionId;
    @Column(name = "answer_text", columnDefinition = "text") private String answerText;
    @Column(name = "response_time_ms") private long responseTimeMs;
    @Column(name = "self_confidence") private int selfConfidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "dimension_scores")
    private Map<String, Integer> dimensionScores;

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long v) { this.sessionId = v; }
    public Long getQuestionId() { return questionId; }
    public void setQuestionId(Long v) { this.questionId = v; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String v) { this.answerText = v; }
    public long getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(long v) { this.responseTimeMs = v; }
    public int getSelfConfidence() { return selfConfidence; }
    public void setSelfConfidence(int v) { this.selfConfidence = v; }
    public Map<String, Integer> getDimensionScores() { return dimensionScores; }
    public void setDimensionScores(Map<String, Integer> v) { this.dimensionScores = v; }
}
