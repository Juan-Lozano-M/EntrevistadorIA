package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import java.util.List;

/**
 * Seam for selecting the questions of an interview session.
 *
 * <p>An LLM-backed provider can replace this without touching orchestration.
 *
 * <p><b>Contract:</b> for the same arguments, an implementation MUST return the
 * same questions in the same order across repeated calls within a session.
 * {@code InterviewService.nextQuestion} re-derives the selection on each call to
 * find the next unanswered question, so a non-deterministic ordering would break
 * question progression. A provider that needs randomness must seed it from a
 * stable, per-session value (e.g. the session id) rather than per call.
 */
public interface QuestionProvider {
    List<Question> selectQuestions(Long professionId, Level level, InterviewType type, String language, int limit);
}
