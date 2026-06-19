package com.interviewai.common;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class DimensionTest {
    @Test
    void hasEightDimensions() {
        assertThat(Dimension.values()).hasSize(8);
    }

    @Test
    void exposesSpanishLabel() {
        assertThat(Dimension.COMMUNICATION.spanishLabel()).isEqualTo("Comunicación");
        assertThat(Dimension.TEAMWORK.spanishLabel()).isEqualTo("Trabajo en equipo");
    }
}
