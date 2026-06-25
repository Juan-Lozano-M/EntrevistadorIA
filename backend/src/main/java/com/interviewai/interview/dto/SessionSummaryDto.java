package com.interviewai.interview.dto;
import com.interviewai.interview.InterviewSession;
public record SessionSummaryDto(Long id, String roleTitle, String level, String type,
                                String status, Integer overallScore, String startedAt, String modality) {
    public static SessionSummaryDto from(InterviewSession s) {
        return new SessionSummaryDto(s.getId(), s.getRoleTitle(), s.getLevel(), s.getType(),
            s.getStatus(), s.getOverallScore(), s.getStartedAt().toString(), s.getModality());
    }
}
