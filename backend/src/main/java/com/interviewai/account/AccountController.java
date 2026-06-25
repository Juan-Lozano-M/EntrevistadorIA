package com.interviewai.account;

import com.interviewai.account.dto.AccountDto;
import com.interviewai.account.dto.ChangePasswordRequest;
import com.interviewai.account.dto.UpdateNotificationsRequest;
import com.interviewai.account.dto.UpdateProfileRequest;
import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.auth.UserRepository;
import com.interviewai.common.ApiException;
import com.interviewai.email.EmailService;
import com.interviewai.interview.InterviewSession;
import com.interviewai.interview.InterviewSessionRepository;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {
    private final CurrentUser currentUser;
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final InterviewSessionRepository sessions;
    private final EmailService emailService;

    public AccountController(CurrentUser currentUser, UserRepository users, PasswordEncoder encoder,
                            InterviewSessionRepository sessions, EmailService emailService) {
        this.currentUser = currentUser;
        this.users = users;
        this.encoder = encoder;
        this.sessions = sessions;
        this.emailService = emailService;
    }

    @GetMapping("/me")
    public AccountDto me() {
        return AccountDto.from(currentUser.require());
    }

    @PatchMapping
    @Transactional
    public AccountDto update(@Valid @RequestBody UpdateProfileRequest req) {
        User u = currentUser.require();
        u.setName(req.name().trim());
        users.save(u);
        return AccountDto.from(u);
    }

    @PostMapping("/password")
    @Transactional
    public void changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        User u = currentUser.require();
        if (!encoder.matches(req.currentPassword(), u.getPasswordHash()))
            throw new ApiException(HttpStatus.BAD_REQUEST, "La contraseña actual no es correcta");
        u.setPasswordHash(encoder.encode(req.newPassword()));
        users.save(u);
    }

    @PatchMapping("/notifications")
    @Transactional
    public AccountDto updateNotifications(@RequestBody UpdateNotificationsRequest req) {
        User u = currentUser.require();
        u.setNotifyDaily(req.daily());
        u.setNotifyWeekly(req.weekly());
        u.setNotifyAchievements(req.achievements());
        u.setNotifyProduct(req.product());
        users.save(u);
        return AccountDto.from(u);
    }

    @PostMapping("/notifications/test")
    public java.util.Map<String, Boolean> testEmail() {
        return java.util.Map.of("sent", emailService.testEmail(currentUser.require()));
    }

    @DeleteMapping
    @Transactional
    public void deleteAccount() {
        User u = currentUser.require();
        // Sessions cascade-delete their answers, feedback and chat messages (FKs ON DELETE CASCADE).
        List<InterviewSession> mine = sessions.findByUserIdOrderByStartedAtDesc(u.getId());
        sessions.deleteAll(mine);
        users.delete(u);
    }
}
