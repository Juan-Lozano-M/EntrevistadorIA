package com.interviewai.auth.dto;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank String name,
    @Email @NotBlank String email,
    @Size(min = 8) String password) {}
