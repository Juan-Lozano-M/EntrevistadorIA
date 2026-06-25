package com.interviewai.auth;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    @Column(nullable = false)
    private String name;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
    @Column(nullable = false)
    private String plan = "FREE";

    @Column(name = "notify_daily", nullable = false) private boolean notifyDaily = true;
    @Column(name = "notify_weekly", nullable = false) private boolean notifyWeekly = true;
    @Column(name = "notify_achievements", nullable = false) private boolean notifyAchievements = true;
    @Column(name = "notify_product", nullable = false) private boolean notifyProduct = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "unlocked_achievements", nullable = false)
    private List<String> unlockedAchievements = new ArrayList<>();

    @Column(name = "last_daily_email") private LocalDate lastDailyEmail;
    @Column(name = "last_weekly_email") private LocalDate lastWeeklyEmail;

    @Column(name = "reset_token") private String resetToken;
    @Column(name = "reset_token_expires") private OffsetDateTime resetTokenExpires;

    @Column(name = "mp_preapproval_id") private String mpPreapprovalId;
    @Column(name = "mp_preapproval_plan_id") private String mpPreapprovalPlanId;
    @Column(name = "subscription_status") private String subscriptionStatus;
    @Column(name = "card_brand") private String cardBrand;
    @Column(name = "card_last4") private String cardLast4;
    @Column(name = "mp_customer_id") private String mpCustomerId;

    public Long getId() { return id; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String h) { this.passwordHash = h; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public boolean isNotifyDaily() { return notifyDaily; }
    public void setNotifyDaily(boolean v) { this.notifyDaily = v; }
    public boolean isNotifyWeekly() { return notifyWeekly; }
    public void setNotifyWeekly(boolean v) { this.notifyWeekly = v; }
    public boolean isNotifyAchievements() { return notifyAchievements; }
    public void setNotifyAchievements(boolean v) { this.notifyAchievements = v; }
    public boolean isNotifyProduct() { return notifyProduct; }
    public void setNotifyProduct(boolean v) { this.notifyProduct = v; }

    public List<String> getUnlockedAchievements() { return unlockedAchievements; }
    public void setUnlockedAchievements(List<String> v) { this.unlockedAchievements = v; }

    public LocalDate getLastDailyEmail() { return lastDailyEmail; }
    public void setLastDailyEmail(LocalDate v) { this.lastDailyEmail = v; }
    public LocalDate getLastWeeklyEmail() { return lastWeeklyEmail; }
    public void setLastWeeklyEmail(LocalDate v) { this.lastWeeklyEmail = v; }

    public String getResetToken() { return resetToken; }
    public void setResetToken(String v) { this.resetToken = v; }
    public OffsetDateTime getResetTokenExpires() { return resetTokenExpires; }
    public void setResetTokenExpires(OffsetDateTime v) { this.resetTokenExpires = v; }

    public String getMpPreapprovalId() { return mpPreapprovalId; }
    public void setMpPreapprovalId(String v) { this.mpPreapprovalId = v; }
    public String getMpPreapprovalPlanId() { return mpPreapprovalPlanId; }
    public void setMpPreapprovalPlanId(String v) { this.mpPreapprovalPlanId = v; }
    public String getSubscriptionStatus() { return subscriptionStatus; }
    public void setSubscriptionStatus(String v) { this.subscriptionStatus = v; }
    public String getCardBrand() { return cardBrand; }
    public void setCardBrand(String v) { this.cardBrand = v; }
    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String v) { this.cardLast4 = v; }
    public String getMpCustomerId() { return mpCustomerId; }
    public void setMpCustomerId(String v) { this.mpCustomerId = v; }
}
