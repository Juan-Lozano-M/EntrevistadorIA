package com.interviewai.interview.dto;
import jakarta.validation.constraints.*;
public record SubmitAnswerRequest(
    @NotNull Long questionId,
    @NotBlank String answerText,
    @PositiveOrZero long responseTimeMs,
    @Min(1) @Max(5) int selfConfidence) {}
