package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import java.util.List;

/** Seam: an LLM-backed provider can replace this without touching orchestration. */
public interface QuestionProvider {
    List<Question> selectQuestions(Long professionId, Level level, InterviewType type, String language, int limit);
}
