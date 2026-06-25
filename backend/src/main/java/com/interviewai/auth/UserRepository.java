package com.interviewai.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByResetToken(String resetToken);
    Optional<User> findByMpPreapprovalId(String mpPreapprovalId);
    Optional<User> findByMpPreapprovalPlanId(String mpPreapprovalPlanId);
    boolean existsByEmail(String email);
    List<User> findByNotifyDailyTrue();
    List<User> findByNotifyWeeklyTrue();
    List<User> findByNotifyProductTrue();
}
