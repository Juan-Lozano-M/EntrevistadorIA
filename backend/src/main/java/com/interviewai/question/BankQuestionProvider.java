package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class BankQuestionProvider implements QuestionProvider {
    private final QuestionRepository questions;
    public BankQuestionProvider(QuestionRepository questions) { this.questions = questions; }

    @Override
    public List<Question> selectQuestions(Long professionId, Level level, InterviewType type,
                                          String language, int limit) {
        List<Question> pool = questions.findByProfessionIdAndLanguage(professionId, language);
        // Fall back to any language for professions that don't have a bank in the requested one yet.
        if (pool.isEmpty()) pool = questions.findByProfessionId(professionId);
        // MIXED keeps all types; a specific type filters to it (falls back to all if empty).
        List<Question> filtered = type == InterviewType.MIXED ? pool
            : pool.stream().filter(q -> q.getType().equals(type.name())).toList();
        if (filtered.isEmpty()) filtered = pool;
        // Prefer questions matching the requested level, then fill with the rest.
        return filtered.stream()
            .sorted(Comparator.comparingInt(q -> q.getLevel().equals(level.name()) ? 0 : 1))
            .limit(limit)
            .toList();
    }
}
