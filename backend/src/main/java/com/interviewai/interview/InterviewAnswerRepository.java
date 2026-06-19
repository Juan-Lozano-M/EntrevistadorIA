package com.interviewai.interview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InterviewAnswerRepository extends JpaRepository<InterviewAnswer, Long> {
    List<InterviewAnswer> findBySessionId(Long sessionId);
    boolean existsBySessionIdAndQuestionId(Long sessionId, Long questionId);
    long countBySessionId(Long sessionId);
}
