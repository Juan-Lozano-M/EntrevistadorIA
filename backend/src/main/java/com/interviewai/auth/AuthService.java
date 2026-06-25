package com.interviewai.auth;

import com.interviewai.auth.dto.*;
import com.interviewai.common.ApiException;
import com.interviewai.email.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class AuthService {
    private static final long RESET_TTL_MINUTES = 60;

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final EmailService emailService;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, EmailService emailService) {
        this.users = users; this.encoder = encoder; this.jwt = jwt; this.emailService = emailService;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email()))
            throw new ApiException(HttpStatus.CONFLICT, "El email ya está registrado");
        User u = new User();
        u.setName(req.name());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail(), u.getPlan());
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email())
            .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail(), u.getPlan());
    }

    /** Issues a reset token and emails the link. Always succeeds silently to avoid leaking
     *  whether an email is registered. */
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest req) {
        users.findByEmail(req.email()).ifPresent(u -> {
            u.setResetToken(UUID.randomUUID().toString().replace("-", ""));
            u.setResetTokenExpires(OffsetDateTime.now().plusMinutes(RESET_TTL_MINUTES));
            users.save(u);
            emailService.passwordReset(u, u.getResetToken());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User u = users.findByResetToken(req.token())
            .filter(x -> x.getResetTokenExpires() != null && x.getResetTokenExpires().isAfter(OffsetDateTime.now()))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "El enlace no es válido o ha caducado"));
        u.setPasswordHash(encoder.encode(req.newPassword()));
        u.setResetToken(null);
        u.setResetTokenExpires(null);
        users.save(u);
    }
}
