package com.interviewai.billing;

public record ConfirmRequest(String paymentId, String cardToken, String cardLast4, String cardBrand) {}
