package com.interviewai.account.dto;

public record UpdateNotificationsRequest(
    boolean daily, boolean weekly, boolean achievements, boolean product) {}
