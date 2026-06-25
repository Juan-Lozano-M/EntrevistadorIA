package com.interviewai.interview;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id") private Long userId;
    @Column(name = "profession_id") private Long professionId;
    @Column(name = "role_title") private String roleTitle;
    @Column(name = "target_company") private String targetCompany;
    private String industry;
    private String level;
    private String type;
    private String language;
    @Column(name = "duration_minutes") private int durationMinutes;
    private String status;
    @Column(name = "overall_score") private Integer overallScore;
    @Column(name = "started_at") private OffsetDateTime startedAt = OffsetDateTime.now();
    @Column(name = "finished_at") private OffsetDateTime finishedAt;
    @Column(nullable = false) private String modality = "STANDARD";
    @Column(name = "off_topic_count", nullable = false) private int offTopicCount = 0;

    public Long getId() { return id; }
    public String getModality() { return modality; }
    public void setModality(String v) { this.modality = v; }
    public int getOffTopicCount() { return offTopicCount; }
    public void setOffTopicCount(int v) { this.offTopicCount = v; }
    public Long getUserId() { return userId; }
    public void setUserId(Long v) { this.userId = v; }
    public Long getProfessionId() { return professionId; }
    public void setProfessionId(Long v) { this.professionId = v; }
    public String getRoleTitle() { return roleTitle; }
    public void setRoleTitle(String v) { this.roleTitle = v; }
    public String getTargetCompany() { return targetCompany; }
    public void setTargetCompany(String v) { this.targetCompany = v; }
    public String getIndustry() { return industry; }
    public void setIndustry(String v) { this.industry = v; }
    public String getLevel() { return level; }
    public void setLevel(String v) { this.level = v; }
    public String getType() { return type; }
    public void setType(String v) { this.type = v; }
    public String getLanguage() { return language; }
    public void setLanguage(String v) { this.language = v; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int v) { this.durationMinutes = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Integer getOverallScore() { return overallScore; }
    public void setOverallScore(Integer v) { this.overallScore = v; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setFinishedAt(OffsetDateTime v) { this.finishedAt = v; }
}
