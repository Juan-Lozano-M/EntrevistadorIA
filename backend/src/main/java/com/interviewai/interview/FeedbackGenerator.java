package com.interviewai.interview;

import com.interviewai.common.Dimension;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class FeedbackGenerator {
    private static final int STRENGTH_THRESHOLD = 75;
    private static final int WEAKNESS_THRESHOLD = 50;

    public FeedbackResult generate(Map<Dimension, Integer> averages) {
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();
        List<String> plan = new ArrayList<>();

        averages.forEach((dim, score) -> {
            String label = dim.spanishLabel();
            if (score >= STRENGTH_THRESHOLD) {
                strengths.add(label + ": demostraste un buen nivel (" + score + "/100).");
            } else if (score < WEAKNESS_THRESHOLD) {
                weaknesses.add(label + ": área a reforzar (" + score + "/100).");
                recommendations.add(recommendationFor(dim));
                plan.add(planStepFor(dim));
            }
        });
        return new FeedbackResult(strengths, weaknesses, recommendations, plan);
    }

    private String recommendationFor(Dimension dim) {
        return switch (dim) {
            case COMMUNICATION -> "Practica estructurar tus respuestas con introducción, desarrollo y cierre.";
            case CLARITY -> "Usa ejemplos concretos y evita la jerga innecesaria para ganar claridad.";
            case CONFIDENCE -> "Prepara y ensaya respuestas en voz alta para proyectar más seguridad.";
            case CRITICAL_THINKING -> "Antes de responder, enumera supuestos y alternativas en voz alta.";
            case PROBLEM_SOLVING -> "Aplica un método explícito: entender, planear, resolver, verificar.";
            case DOMAIN_KNOWLEDGE -> "Refuerza los fundamentos del área con estudio dirigido y práctica.";
            case LEADERSHIP -> "Prepara ejemplos STAR de situaciones donde lideraste o influiste.";
            case TEAMWORK -> "Destaca cómo colaboras: roles, comunicación y resolución de conflictos.";
        };
    }

    private String planStepFor(Dimension dim) {
        return "Semana de enfoque en " + dim.spanishLabel().toLowerCase()
             + ": 3 sesiones de práctica deliberada y 1 simulación de seguimiento.";
    }
}
