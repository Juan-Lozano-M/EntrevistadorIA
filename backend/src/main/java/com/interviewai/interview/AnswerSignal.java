package com.interviewai.interview;

public record AnswerSignal(String answerText, long responseTimeMs, int selfConfidence, long expectedTimeMs) {}
