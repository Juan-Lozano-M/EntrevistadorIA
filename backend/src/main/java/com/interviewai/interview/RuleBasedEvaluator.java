package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class RuleBasedEvaluator implements AnswerEvaluator {

    @Override
    public Map<Dimension, Integer> evaluate(Question question, AnswerSignal s) {
        double length = lengthScore(s.answerText());
        double keywords = keywordScore(s.answerText(), question.getExpectedKeywords());
        double timing = timingScore(s.responseTimeMs(), s.expectedTimeMs());
        double confidence = (s.selfConfidence() - 1) / 4.0; // 1..5 -> 0..1

        // Base composite of objective signals; self-confidence nudges it.
        double base = 0.40 * keywords + 0.30 * length + 0.20 * timing + 0.10 * confidence;

        Map<Dimension, Integer> result = new HashMap<>();
        Map<String, Double> targets = question.getTargetDimensions();
        if (targets == null) return result;
        // target_dimensions chooses WHICH dimensions this question scores; the weights are
        // reserved for future weighting and intentionally do not change the per-dimension value here.
        for (String dimensionName : targets.keySet()) {
            Dimension dim;
            try { dim = Dimension.valueOf(dimensionName); } catch (IllegalArgumentException e) { continue; }
            result.put(dim, clampTo100(base));
        }
        return result;
    }

    private double lengthScore(String text) {
        int words = text == null ? 0 : text.trim().isEmpty() ? 0 : text.trim().split("\\s+").length;
        if (words <= 3) return 0.1;
        if (words >= 40) return 1.0;
        return 0.1 + 0.9 * ((words - 3) / 37.0);
    }

    private double keywordScore(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return 0.6; // neutral when none defined
        String lower = text == null ? "" : text.toLowerCase(Locale.ROOT);
        long hits = keywords.stream().filter(k -> lower.contains(k.toLowerCase(Locale.ROOT))).count();
        return (double) hits / keywords.size();
    }

    private double timingScore(long actualMs, long expectedMs) {
        if (expectedMs <= 0) return 0.6;
        double ratio = (double) actualMs / expectedMs;
        if (ratio < 0.1) return 0.3;      // suspiciously fast
        if (ratio <= 1.2) return 1.0;     // within band
        if (ratio <= 2.0) return 0.6;
        return 0.4;                        // very slow
    }

    private int clampTo100(double v) {
        return (int) Math.round(Math.max(0, Math.min(1, v)) * 100);
    }
}
