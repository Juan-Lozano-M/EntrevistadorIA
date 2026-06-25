/** Common roles per profession (by slug) — shown as suggestions in the wizard.
 *  The Cargo field stays free text; these only nudge toward relevant titles. */
export const ROLE_SUGGESTIONS: Record<string, string[]> = {
  "software-development": [
    "Backend Developer", "Frontend Developer", "Full Stack Developer",
    "Mobile Developer", "DevOps Engineer", "QA Engineer", "Tech Lead",
  ],
  "marketing-digital": [
    "Especialista en Marketing Digital", "Growth Marketer", "Community Manager",
    "Especialista SEO/SEM", "Content Manager", "Performance Marketer",
  ],
  "diseno-ux-ui": [
    "Diseñador UX", "Diseñador UI", "Product Designer",
    "UX Researcher", "Diseñador de Interacción", "Diseñador Visual",
  ],
  "ventas": [
    "Ejecutivo de Ventas", "Account Executive", "Sales Development Rep (SDR)",
    "Key Account Manager", "Business Development", "Inside Sales",
  ],
  "analisis-de-datos": [
    "Analista de Datos", "Business Intelligence Analyst", "Analista de Negocio",
    "Data Scientist", "Analista de Marketing", "Analista Financiero",
  ],
  "recursos-humanos": [
    "Reclutador/a", "HR Generalist", "Talent Acquisition",
    "HR Business Partner", "Especialista en Selección", "Técnico de RR. HH.",
  ],
  "atencion-al-cliente": [
    "Agente de Atención al Cliente", "Customer Success", "Soporte Técnico",
    "Customer Experience", "Help Desk", "Teleoperador/a",
  ],
  "gestion-de-proyectos": [
    "Project Manager", "Scrum Master", "Coordinador de Proyectos",
    "Program Manager", "PMO", "Líder de Proyecto",
  ],
  "finanzas-contabilidad": [
    "Analista Financiero", "Contador/a", "Controller",
    "Analista de Costes", "Auditor/a", "Tesorero/a",
  ],
  "gestion-de-producto": [
    "Product Manager", "Product Owner", "Associate PM",
    "Senior PM", "Growth PM", "Technical PM",
  ],
  "docencia": [
    "Profesor/a", "Maestro/a", "Docente",
    "Tutor/a", "Formador/a", "Profesor de Secundaria",
  ],
};
