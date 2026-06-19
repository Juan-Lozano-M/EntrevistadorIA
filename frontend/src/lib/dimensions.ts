export const DIMENSION_LABELS: Record<string, string> = {
  COMMUNICATION: "Comunicación",
  CLARITY: "Claridad",
  CONFIDENCE: "Seguridad",
  CRITICAL_THINKING: "Pensamiento crítico",
  PROBLEM_SOLVING: "Resolución de problemas",
  DOMAIN_KNOWLEDGE: "Conocimiento del área",
  LEADERSHIP: "Liderazgo",
  TEAMWORK: "Trabajo en equipo",
};

export function scoreBand(score: number): "low" | "mid" | "high" {
  if (score < 50) return "low";
  if (score < 75) return "mid";
  return "high";
}
