export type Resource = {
  id: string;
  title: string;
  summary: string;
  /** Dimension keys this resource helps with (empty = general). */
  dimensions: string[];
  readMinutes: number;
  body: string[];
};

export const RESOURCES: Resource[] = [
  {
    id: "metodo-star",
    title: "Método STAR",
    summary: "Estructura tus respuestas de competencias y situacionales para que convenzan.",
    dimensions: ["COMMUNICATION", "CLARITY", "LEADERSHIP", "TEAMWORK"],
    readMinutes: 4,
    body: [
      "El método STAR ordena tus historias en cuatro partes: Situación, Tarea, Acción y Resultado.",
      "Situación: describe brevemente el contexto (1–2 frases). Tarea: cuál era tu responsabilidad u objetivo.",
      "Acción: lo más importante — qué hiciste TÚ, paso a paso, en primera persona. Evita el 'nosotros' difuso.",
      "Resultado: el desenlace, idealmente con un dato o impacto medible, y qué aprendiste.",
      "Consejo: prepara 4–5 historias STAR que puedas adaptar a distintas preguntas (liderazgo, conflicto, error, logro).",
    ],
  },
  {
    id: "respuestas-tecnicas",
    title: "Estructura respuestas técnicas",
    summary: "Un marco para resolver preguntas técnicas sin bloquearte.",
    dimensions: ["PROBLEM_SOLVING", "DOMAIN_KNOWLEDGE", "CLARITY"],
    readMinutes: 5,
    body: [
      "Sigue cuatro pasos en voz alta: Entender → Planear → Resolver → Verificar.",
      "Entender: reformula el problema y aclara supuestos y restricciones antes de lanzarte.",
      "Planear: menciona el enfoque y alternativas, con sus trade-offs, antes de implementar.",
      "Resolver: avanza explicando tu razonamiento; está bien pensar en voz alta.",
      "Verificar: prueba con un ejemplo o caso borde y menciona complejidad o riesgos.",
    ],
  },
  {
    id: "seguridad-nervios",
    title: "Maneja los nervios y proyecta seguridad",
    summary: "Técnicas para llegar tranquilo y transmitir confianza.",
    dimensions: ["CONFIDENCE", "COMMUNICATION"],
    readMinutes: 3,
    body: [
      "Respira: una exhalación lenta antes de responder baja la ansiedad y te da tiempo para ordenar la idea.",
      "Está bien tomar 2–3 segundos para pensar; un breve silencio se percibe como reflexión, no como duda.",
      "Habla a un ritmo pausado y termina tus frases; evita el 'eh' constante y las muletillas.",
      "Ensaya en voz alta: practicar respuestas reales reduce el miedo más que solo leerlas.",
    ],
  },
  {
    id: "comunicacion-efectiva",
    title: "Comunicación efectiva en entrevistas",
    summary: "Haz que tus respuestas sean claras y fáciles de seguir.",
    dimensions: ["COMMUNICATION", "CLARITY"],
    readMinutes: 3,
    body: [
      "Empieza por la conclusión y luego desarrolla (estructura 'titular → detalle').",
      "Usa ejemplos concretos en lugar de generalidades; lo específico convence.",
      "Evita la jerga innecesaria; adapta el nivel técnico a quien te entrevista.",
      "Cierra cada respuesta: un resumen de una frase ayuda a que tu idea quede clara.",
    ],
  },
  {
    id: "pensamiento-critico",
    title: "Pensamiento crítico: piensa en voz alta",
    summary: "Muestra cómo razonas, no solo la respuesta final.",
    dimensions: ["CRITICAL_THINKING", "PROBLEM_SOLVING"],
    readMinutes: 3,
    body: [
      "Antes de responder, enuncia tus supuestos y las alternativas que consideras.",
      "Compara opciones por sus pros y contras en vez de afirmar una sola verdad.",
      "Si faltan datos, dilo y explica qué preguntarías o cómo decidirías con información incompleta.",
      "Reconocer límites y riesgos de tu propuesta demuestra madurez de criterio.",
    ],
  },
  {
    id: "liderazgo-ejemplos",
    title: "Liderazgo: ejemplos que convencen",
    summary: "Cómo contar situaciones donde lideraste o influiste.",
    dimensions: ["LEADERSHIP"],
    readMinutes: 4,
    body: [
      "Liderazgo no es solo tener el cargo: incluye influir, coordinar y tomar decisiones difíciles.",
      "Prepara ejemplos de: motivar a un equipo, gestionar bajo desempeño, resolver un conflicto y decidir con presión.",
      "Enfócate en tu rol y en el impacto en las personas y el resultado.",
      "Muestra equilibrio entre el objetivo del negocio y el cuidado del equipo.",
    ],
  },
  {
    id: "trabajo-en-equipo",
    title: "Trabajo en equipo: cuenta tus colaboraciones",
    summary: "Demuestra que sumas con otros, no solo en solitario.",
    dimensions: ["TEAMWORK"],
    readMinutes: 3,
    body: [
      "Describe cómo te coordinas: roles, comunicación y manejo de desacuerdos.",
      "Reconoce el aporte de los demás; quita protagonismo excesivo pero deja claro tu contribución.",
      "Un buen ejemplo de conflicto resuelto vale más que decir 'soy buen compañero'.",
      "Menciona cómo das y recibes feedback dentro del equipo.",
    ],
  },
  {
    id: "investiga-empresa",
    title: "Investiga la empresa y el rol",
    summary: "Llega informado: conecta tu motivación con la empresa.",
    dimensions: ["DOMAIN_KNOWLEDGE"],
    readMinutes: 3,
    body: [
      "Revisa producto, misión, noticias recientes y el detalle de la vacante.",
      "Prepara por qué ESTA empresa y ESTE rol encajan con tu trayectoria y objetivos.",
      "Ten 3–4 preguntas inteligentes para el entrevistador; demuestra interés genuino.",
      "Relaciona tus logros con los retos que la empresa probablemente enfrenta.",
    ],
  },
  {
    id: "conocimiento-area",
    title: "Refuerza el conocimiento de tu área",
    summary: "Cierra brechas en los fundamentos de tu profesión.",
    dimensions: ["DOMAIN_KNOWLEDGE"],
    readMinutes: 4,
    body: [
      "Identifica los temas core de tu rol y nivel, y repásalos con estudio dirigido.",
      "Practica explicar conceptos en voz alta como si enseñaras: revela vacíos rápido.",
      "Mantén ejemplos recientes de tu trabajo que demuestren ese conocimiento aplicado.",
      "Simula entrevistas técnicas con frecuencia; la práctica deliberada es la que mueve la aguja.",
    ],
  },
  {
    id: "cierre-entrevista",
    title: "Cómo cerrar la entrevista",
    summary: "Los últimos minutos también cuentan.",
    dimensions: [],
    readMinutes: 2,
    body: [
      "Haz preguntas que muestren interés por el rol, el equipo y los próximos pasos.",
      "Reafirma brevemente por qué eres un buen encaje, sin sonar repetitivo.",
      "Agradece y pregunta por el siguiente paso del proceso y los tiempos.",
      "Tras la entrevista, un correo breve de agradecimiento deja buena impresión.",
    ],
  },
];
