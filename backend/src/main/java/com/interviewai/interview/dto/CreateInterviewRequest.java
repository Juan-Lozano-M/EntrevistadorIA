package com.interviewai.interview.dto;
import jakarta.validation.constraints.*;
public record CreateInterviewRequest(
    @NotBlank String professionSlug,
    @NotBlank String roleTitle,
    String targetCompany,
    String industry,
    @NotBlank String level,
    @NotBlank String type,
    @NotBlank String language,
    @Min(5) @Max(120) int durationMinutes) {}
