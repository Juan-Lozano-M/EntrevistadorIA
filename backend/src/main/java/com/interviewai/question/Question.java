package com.interviewai.question;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

@Entity
@Table(name = "questions")
public class Question {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "profession_id")
    private Long professionId;
    private String level;
    private String type;
    private String language;
    @Column(columnDefinition = "text")
    private String text;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "expected_keywords")
    private List<String> expectedKeywords;

    @Column(name = "model_answer", columnDefinition = "text")
    private String modelAnswer;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "target_dimensions")
    private Map<String, Double> targetDimensions;

    public Long getId() { return id; }
    public Long getProfessionId() { return professionId; }
    public String getLevel() { return level; }
    public String getType() { return type; }
    public String getLanguage() { return language; }
    public String getText() { return text; }
    public List<String> getExpectedKeywords() { return expectedKeywords; }
    public String getModelAnswer() { return modelAnswer; }
    public Map<String, Double> getTargetDimensions() { return targetDimensions; }
}
