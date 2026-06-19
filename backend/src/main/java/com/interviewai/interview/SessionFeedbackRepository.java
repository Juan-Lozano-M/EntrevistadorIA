package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface SessionFeedbackRepository extends JpaRepository<SessionFeedback, Long> {
    Optional<SessionFeedback> findBySessionId(Long sessionId);
}
