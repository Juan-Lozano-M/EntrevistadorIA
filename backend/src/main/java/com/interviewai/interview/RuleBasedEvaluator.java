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
        Map<Dimension, Integer> result = new HashMap<>();
        Map<String, Double> targets = question.getTargetDimensions();
        if (targets == null) return result;

        int score = scoreAnswer(question, s);

        // target_dimensions chooses WHICH dimensions this question scores; the weights are
        // reserved for future weighting and intentionally do not change the per-dimension value here.
        for (String dimensionName : targets.keySet()) {
            try {
                result.put(Dimension.valueOf(dimensionName), score);
            } catch (IllegalArgumentException ignored) { /* unknown dimension name */ }
        }
        return result;
    }

    private int scoreAnswer(Question question, AnswerSignal s) {
        int words = wordCount(s.answerText());
        // No answer (empty or whitespace) earns no credit, regardless of timing or confidence.
        if (words == 0) return 0;

        double length = lengthScore(words);
        Double keywords = keywordCoverage(s.answerText(), question.getExpectedKeywords());
        // Substance of the answer: keyword coverage (when measurable) plus how developed it is.
        double content = (keywords == null) ? length : 0.6 * keywords + 0.4 * length;

        double timing = timingScore(s.responseTimeMs(), s.expectedTimeMs());
        double confidence = (s.selfConfidence() - 1) / 4.0; // 1..5 -> 0..1

        // Timing and self-confidence only REFINE an answer that already has substance: they scale
        // with `content`, so an empty or content-less answer can never be inflated to a high score.
        double refine = 0.15 * timing + 0.10 * confidence;
        return clampTo100(content * (0.85 + refine));
    }

    private int wordCount(String text) {
        if (text == null) return 0;
        String t = text.trim();
        return t.isEmpty() ? 0 : t.split("\\s+").length;
    }

    private double lengthScore(int words) {
        if (words <= 3) return 0.1;
        if (words >= 40) return 1.0;
        return 0.1 + 0.9 * ((words - 3) / 37.0);
    }

    /** Fraction of expected keywords present, or null when the question defines none (not measurable). */
    private Double keywordCoverage(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return null;
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
