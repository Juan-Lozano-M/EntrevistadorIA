export const LEVEL_LABELS: Record<string, string> = {
  ENTRY: "Sin experiencia",
  INTERN: "Practicante",
  JUNIOR: "Junior",
  SEMI_SENIOR: "Semi Senior",
  SENIOR: "Senior",
  LEAD: "Líder",
  MANAGER: "Gerente",
};

export const TYPE_LABELS: Record<string, string> = {
  TECHNICAL: "Técnica",
  HR: "Recursos Humanos",
  SITUATIONAL: "Situacional",
  COMPETENCY: "Competencias",
  BEHAVIORAL: "Conductual",
  CASE_STUDY: "Caso práctico",
  LEADERSHIP: "Liderazgo",
  MIXED: "Mixta",
};

export const levelLabel = (v: string) => LEVEL_LABELS[v] ?? v;
export const typeLabel = (v: string) => TYPE_LABELS[v] ?? v;
