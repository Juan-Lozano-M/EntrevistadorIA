package com.interviewai.auth;

import com.interviewai.auth.dto.*;
import com.interviewai.common.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmail(req.email()))
            throw new ApiException(HttpStatus.CONFLICT, "El email ya está registrado");
        User u = new User();
        u.setName(req.name());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        users.save(u);
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        User u = users.findByEmail(req.email())
            .filter(x -> encoder.matches(req.password(), x.getPasswordHash()))
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));
        return new AuthResponse(jwt.generateToken(u.getEmail()), u.getName(), u.getEmail());
    }
}
