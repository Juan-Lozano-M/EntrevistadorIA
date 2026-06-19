package com.interviewai.interview;

import com.interviewai.common.Dimension;
import org.junit.jupiter.api.Test;

import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

class FeedbackGeneratorTest {

    @Test
    void highDimensionBecomesStrengthLowBecomesWeakness() {
        var gen = new FeedbackGenerator();
        var result = gen.generate(Map.of(
            Dimension.COMMUNICATION, 85,
            Dimension.PROBLEM_SOLVING, 30));

        assertThat(result.strengths()).anyMatch(s -> s.contains("Comunicación"));
        assertThat(result.weaknesses()).anyMatch(w -> w.contains("Resolución de problemas"));
        assertThat(result.recommendations()).isNotEmpty();
        assertThat(result.improvementPlan()).isNotEmpty();
    }

    @Test
    void midDimensionIsNeitherStrengthNorWeakness() {
        var gen = new FeedbackGenerator();
        var result = gen.generate(Map.of(
            Dimension.COMMUNICATION, 85,  // a strength, so the balanced message is not triggered
            Dimension.CLARITY, 60));      // mid -> neither strength nor weakness
        assertThat(result.strengths()).anyMatch(s -> s.contains("Comunicación"));
        assertThat(result.strengths()).noneMatch(s -> s.contains("Claridad"));
        assertThat(result.weaknesses()).noneMatch(w -> w.contains("Claridad"));
    }

    @Test
    void allNeutralProducesBalancedMessage() {
        var gen = new FeedbackGenerator();
        var result = gen.generate(Map.of(Dimension.CLARITY, 60));
        assertThat(result.strengths()).anyMatch(s -> s.contains("equilibrado"));
        assertThat(result.weaknesses()).isEmpty();
    }
}
