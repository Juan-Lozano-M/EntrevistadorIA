-- Five more professions, each with a Spanish question bank (6 questions, varied levels/types).

-- ===================== Atención al Cliente =====================
INSERT INTO professions (slug, name, description) VALUES
  ('atencion-al-cliente', 'Atención al Cliente',
   'Entrevistas para roles de soporte, customer success y experiencia de cliente.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'atencion-al-cliente';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cómo manejas a un cliente enfadado que tiene razón en su queja?',
   '["escuchar","disculpa","empatía","solución","seguimiento"]',
   'Escuchar sin interrumpir, reconocer el problema y disculparse, mostrar empatía, ofrecer una solución concreta y dar seguimiento para confirmar que quedó resuelto.',
   '{"COMMUNICATION":0.5,"PROBLEM_SOLVING":0.3,"CONFIDENCE":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué te interesa la atención al cliente y este puesto?',
   '["personas","ayudar","comunicación","servicio"]',
   'Conectar tu gusto por ayudar y comunicarte con el tipo de servicio de la empresa y el impacto en la experiencia del cliente.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Qué métricas usarías para medir la calidad del servicio?',
   '["CSAT","NPS","tiempo de respuesta","resolución","primer contacto"]',
   'CSAT y NPS para la satisfacción, tiempo de respuesta y de resolución para la eficiencia, y la tasa de resolución en el primer contacto. Equilibrar rapidez con calidad.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'SITUATIONAL', 'es',
   'Un cliente pide algo que va contra la política de la empresa. ¿Qué haces?',
   '["empatía","explicar","alternativa","límites","escalar"]',
   'Entender su necesidad, explicar con empatía el porqué de la política, ofrecer una alternativa dentro de lo posible y escalar si hace falta, sin prometer lo que no puedes cumplir.',
   '{"COMMUNICATION":0.4,"CRITICAL_THINKING":0.3,"CONFIDENCE":0.3}'),
  (pid, 'SENIOR', 'COMPETENCY', 'es',
   'Cuéntame de una vez que convertiste a un cliente molesto en uno satisfecho.',
   '["escuchar","solución","seguimiento","empatía","resultado"]',
   'Con STAR: el contexto, cómo escuché y entendí el problema, la solución que ofrecí y el seguimiento, y cómo cambió la percepción del cliente.',
   '{"COMMUNICATION":0.4,"PROBLEM_SOLVING":0.3,"CONFIDENCE":0.3}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Hay un pico de tickets y tu equipo está saturado. ¿Cómo lo gestionas?',
   '["priorizar","plantillas","derivar","comunicar","causa raíz"]',
   'Priorizar por urgencia e impacto, usar respuestas tipo para lo común, derivar o pedir apoyo, comunicar tiempos a los clientes y atacar la causa raíz del pico.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}');
END $$;

-- ===================== Gestión de Proyectos =====================
INSERT INTO professions (slug, name, description) VALUES
  ('gestion-de-proyectos', 'Gestión de Proyectos',
   'Entrevistas para roles de project manager, scrum master y coordinación.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'gestion-de-proyectos';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cuáles son las fases típicas de un proyecto y qué pasa en cada una?',
   '["inicio","planificación","ejecución","seguimiento","cierre"]',
   'Inicio (objetivos y alcance), planificación (cronograma, recursos, riesgos), ejecución, seguimiento y control (avance, cambios) y cierre (entrega y lecciones aprendidas).',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cuál es la diferencia entre un enfoque ágil y uno en cascada?',
   '["iterativo","secuencial","cambios","entregas","incertidumbre"]',
   'La cascada es secuencial y planificada de inicio a fin, buena con requisitos estables; ágil es iterativo con entregas frecuentes, mejor ante incertidumbre y cambios. Se elige según el contexto.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"CLARITY":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Un proyecto se va a retrasar. ¿Cómo lo gestionas?',
   '["causa","alcance","recursos","prioridades","comunicar","stakeholders"]',
   'Entender la causa, evaluar opciones (ajustar alcance, recursos o plazos), priorizar lo crítico, comunicar pronto y con transparencia a los interesados y acordar un plan.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'SEMI_SENIOR', 'COMPETENCY', 'es',
   'Cuéntame de un proyecto que sacaste adelante con un equipo difícil.',
   '["coordinación","conflicto","motivación","seguimiento","resultado"]',
   'Con STAR: el contexto y la dificultad, cómo coordiné, resolví conflictos y mantuve la motivación, y el resultado entregado.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.3}'),
  (pid, 'SENIOR', 'TECHNICAL', 'es',
   '¿Cómo identificas y gestionas los riesgos de un proyecto?',
   '["identificar","probabilidad","impacto","mitigación","seguimiento","plan"]',
   'Identificar los riesgos con el equipo, valorarlos por probabilidad e impacto, definir planes de mitigación y contingencia, asignar responsables y revisarlos periódicamente.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),
  (pid, 'LEAD', 'LEADERSHIP', 'es',
   'Dos áreas tienen prioridades en conflicto sobre tu proyecto. ¿Cómo lo resuelves?',
   '["objetivos","datos","negociar","alinear","escalar","decisión"]',
   'Aclarar los objetivos de cada área, mostrar el impacto con datos, buscar una solución que cumpla lo esencial de ambas y, si no, escalar para una decisión clara y alinear a todos.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}');
END $$;

-- ===================== Finanzas y Contabilidad =====================
INSERT INTO professions (slug, name, description) VALUES
  ('finanzas-contabilidad', 'Finanzas y Contabilidad',
   'Entrevistas para roles de finanzas, contabilidad, control y auditoría.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'finanzas-contabilidad';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cuál es la diferencia entre el estado de resultados y el balance general?',
   '["ingresos","gastos","periodo","activos","pasivos","patrimonio"]',
   'El estado de resultados muestra ingresos y gastos en un periodo (la utilidad); el balance muestra activos, pasivos y patrimonio en un momento dado (la situación financiera).',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es el flujo de caja y por qué es tan importante?',
   '["liquidez","entradas","salidas","operativo","solvencia"]',
   'Es el movimiento de entradas y salidas de efectivo. Importa porque una empresa puede ser rentable y aun así quebrar si no tiene liquidez para sus obligaciones.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CRITICAL_THINKING":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo evaluarías la viabilidad financiera de un proyecto de inversión?',
   '["VAN","TIR","flujos","tasa de descuento","payback","riesgo"]',
   'Proyectar los flujos de caja, descontarlos con una tasa adecuada y calcular el VAN y la TIR; complementar con el payback y un análisis de sensibilidad ante el riesgo.',
   '{"DOMAIN_KNOWLEDGE":0.5,"PROBLEM_SOLVING":0.3,"CRITICAL_THINKING":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué te dedicas a las finanzas y por qué esta empresa?',
   '["análisis","rigor","impacto","negocio"]',
   'Conectar tu gusto por el análisis y el rigor con el impacto en las decisiones de negocio de la empresa.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Detectas una inconsistencia en las cuentas cerca del cierre. ¿Qué haces?',
   '["verificar","documentar","comunicar","corregir","control"]',
   'Verificar el origen con calma, documentar el hallazgo, comunicarlo a tiempo a quien corresponda, corregir según el procedimiento y reforzar el control para que no se repita.',
   '{"CRITICAL_THINKING":0.4,"COMMUNICATION":0.3,"CONFIDENCE":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'Los márgenes de la empresa están cayendo. ¿Cómo lo analizarías?',
   '["ingresos","costes","mix","precios","eficiencia","segmentar"]',
   'Separar el efecto de ingresos y costes, segmentar por producto o cliente, revisar el mix, los precios y la eficiencia, formular hipótesis y recomendar la palanca de mayor impacto.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}');
END $$;

-- ===================== Gestión de Producto =====================
INSERT INTO professions (slug, name, description) VALUES
  ('gestion-de-producto', 'Gestión de Producto',
   'Entrevistas para roles de product manager y product owner.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'gestion-de-producto';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué hace un product manager y con qué áreas trabaja?',
   '["visión","priorización","usuarios","negocio","desarrollo","diseño"]',
   'Define la visión y las prioridades del producto conectando necesidades de usuarios, objetivos de negocio y viabilidad técnica, trabajando con diseño, desarrollo, datos y stakeholders.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo priorizas qué construir cuando todo parece importante?',
   '["impacto","esfuerzo","objetivos","datos","marco","valor"]',
   'Anclar en los objetivos, evaluar por impacto frente a esfuerzo con un marco claro, usar datos y evidencia de usuarios, y comunicar el porqué de las decisiones.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),
  (pid, 'SENIOR', 'TECHNICAL', 'es',
   '¿Cómo defines y mides el éxito de una nueva funcionalidad?',
   '["objetivo","métrica","adopción","retención","experimento","línea base"]',
   'Definir el objetivo y una métrica norte, métricas de adopción y retención, una línea base, y validar con experimentos, vigilando las contramétricas.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.3,"CLARITY":0.3}'),
  (pid, 'SEMI_SENIOR', 'SITUATIONAL', 'es',
   'Ingeniería dice que algo no se puede hacer en el plazo. ¿Qué haces?',
   '["entender","alcance","alternativas","negociar","prioridad","mvp"]',
   'Entender la restricción técnica, revisar el alcance y buscar un MVP que entregue el valor clave, negociar plazos o recursos y priorizar con base en el objetivo.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'La adopción de tu producto se ha estancado. ¿Cómo lo investigarías?',
   '["embudo","segmentar","usuarios","fricción","hipótesis","datos"]',
   'Revisar el embudo de activación y uso, segmentar por tipo de usuario, hablar con usuarios y mirar datos de fricción, formular hipótesis y priorizar el experimento de mayor impacto.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una decisión de producto en la que te equivocaste.',
   '["hipótesis","datos","reconocer","ajustar","aprendizaje"]',
   'Con STAR: la decisión y por qué resultó mal, cómo lo reconocí con datos, qué ajusté y qué aprendí para futuras decisiones.',
   '{"CRITICAL_THINKING":0.4,"CONFIDENCE":0.3,"COMMUNICATION":0.3}');
END $$;

-- ===================== Docencia =====================
INSERT INTO professions (slug, name, description) VALUES
  ('docencia', 'Docencia',
   'Entrevistas para roles de profesorado, formación y educación.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'docencia';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cómo planificas una clase para que sea efectiva?',
   '["objetivos","actividades","evaluación","ritmo","participación"]',
   'Definir objetivos de aprendizaje claros, diseñar actividades variadas que los desarrollen, prever la evaluación, cuidar el ritmo y fomentar la participación.',
   '{"DOMAIN_KNOWLEDGE":0.5,"COMMUNICATION":0.3,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué quieres dedicarte a la enseñanza?',
   '["vocación","impacto","aprendizaje","estudiantes"]',
   'Conectar tu vocación por enseñar y el impacto en el aprendizaje de los estudiantes con los valores del centro o institución.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SEMI_SENIOR', 'SITUATIONAL', 'es',
   'Tienes estudiantes con niveles muy distintos en la misma clase. ¿Qué haces?',
   '["diferenciación","apoyo","grupos","ritmo","materiales"]',
   'Diferenciar la enseñanza: materiales y tareas a distinto nivel, trabajo en grupos, apoyo a quien lo necesita y retos para quien avanza, manteniendo objetivos comunes.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),
  (pid, 'SENIOR', 'COMPETENCY', 'es',
   'Cuéntame de una vez que motivaste a un estudiante que no quería aprender.',
   '["interés","relación","relevancia","paciencia","logro"]',
   'Con STAR: el contexto, cómo conecté con su interés y mostré la relevancia, la paciencia y el acompañamiento, y el cambio que logré.',
   '{"COMMUNICATION":0.4,"LEADERSHIP":0.3,"CONFIDENCE":0.3}'),
  (pid, 'JUNIOR', 'SITUATIONAL', 'es',
   'Un estudiante interrumpe constantemente la clase. ¿Cómo lo manejas?',
   '["límites","respeto","causa","privado","acuerdos"]',
   'Mantener la calma y poner límites con respeto, entender la causa, hablar en privado si hace falta y acordar normas claras, sin humillar delante del grupo.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"CRITICAL_THINKING":0.3}'),
  (pid, 'SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una clase o método que no funcionó y cómo lo cambiaste.',
   '["reflexión","evidencia","ajuste","estudiantes","mejora"]',
   'Con STAR: qué no funcionó y cómo lo noté (resultados, participación), qué reflexioné y ajusté, y la mejora obtenida.',
   '{"CRITICAL_THINKING":0.4,"COMMUNICATION":0.3,"CONFIDENCE":0.3}');
END $$;
