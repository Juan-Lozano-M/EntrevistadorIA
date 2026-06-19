package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RuleBasedEvaluatorTest {

    private Question question(List<String> keywords, Map<String, Double> dims) {
        Question q = Mockito.mock(Question.class);
        Mockito.when(q.getExpectedKeywords()).thenReturn(keywords);
        Mockito.when(q.getTargetDimensions()).thenReturn(dims);
        return q;
    }

    @Test
    void strongAnswerScoresHigherThanWeakAnswer() {
        var evaluator = new RuleBasedEvaluator();
        Question q = question(List.of("memoria", "índice", "complejidad"),
            Map.of("DOMAIN_KNOWLEDGE", 0.6, "CLARITY", 0.4));

        var strong = new AnswerSignal(
            "El arreglo usa memoria contigua con acceso por índice O(1); la complejidad cambia según la estructura. "
          + "Explico memoria, índice y complejidad en detalle con ejemplos.",
            30_000, 5, 60_000);
        var weak = new AnswerSignal("No sé.", 2_000, 1, 60_000);

        Map<Dimension, Integer> strongScores = evaluator.evaluate(q, strong);
        Map<Dimension, Integer> weakScores = evaluator.evaluate(q, weak);

        assertThat(strongScores.get(Dimension.DOMAIN_KNOWLEDGE))
            .isGreaterThan(weakScores.get(Dimension.DOMAIN_KNOWLEDGE));
        assertThat(strongScores.get(Dimension.DOMAIN_KNOWLEDGE)).isBetween(0, 100);
    }

    @Test
    void onlyScoresTargetDimensions() {
        var evaluator = new RuleBasedEvaluator();
        Question q = question(List.of("x"), Map.of("LEADERSHIP", 1.0));
        var s = new AnswerSignal("una respuesta con x incluida y desarrollo razonable aquí", 20_000, 3, 60_000);
        assertThat(evaluator.evaluate(q, s)).containsOnlyKeys(Dimension.LEADERSHIP);
    }
}
