package com.interviewai.billing;

public record SubscribeRequest(
    String tokenPay,
    String tokenSub,
    String paymentMethodId,
    String idType,
    String idNumber,
    String cardLast4,
    String cardBrand) {}
