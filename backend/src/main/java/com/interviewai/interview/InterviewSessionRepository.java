package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.OffsetDateTime;
import java.util.List;
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);
    long countByUserIdAndStartedAtGreaterThanEqual(Long userId, OffsetDateTime since);
}
