package com.interviewai.common;

public enum Dimension {
    COMMUNICATION("Comunicación"),
    CLARITY("Claridad"),
    CONFIDENCE("Seguridad"),
    CRITICAL_THINKING("Pensamiento crítico"),
    PROBLEM_SOLVING("Resolución de problemas"),
    DOMAIN_KNOWLEDGE("Conocimiento del área"),
    LEADERSHIP("Liderazgo"),
    TEAMWORK("Trabajo en equipo");

    private final String spanishLabel;
    Dimension(String spanishLabel) { this.spanishLabel = spanishLabel; }
    public String spanishLabel() { return spanishLabel; }
}
