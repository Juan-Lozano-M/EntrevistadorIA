package com.interviewai.interview;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.util.List;

@Entity
@Table(name = "session_feedback")
public class SessionFeedback {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "session_id") private Long sessionId;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> strengths;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> weaknesses;
    @JdbcTypeCode(SqlTypes.JSON) private List<String> recommendations;
    @JdbcTypeCode(SqlTypes.JSON) @Column(name = "improvement_plan") private List<String> improvementPlan;

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long v) { this.sessionId = v; }
    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> v) { this.strengths = v; }
    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> v) { this.weaknesses = v; }
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> v) { this.recommendations = v; }
    public List<String> getImprovementPlan() { return improvementPlan; }
    public void setImprovementPlan(List<String> v) { this.improvementPlan = v; }
}
