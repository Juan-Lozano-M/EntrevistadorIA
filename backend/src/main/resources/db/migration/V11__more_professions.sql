-- Five new professions with a Spanish question bank each. (English banks can be added later;
-- the provider falls back to whatever language a profession has.)

-- ===================== Marketing Digital =====================
INSERT INTO professions (slug, name, description) VALUES
  ('marketing-digital', 'Marketing Digital',
   'Entrevistas para roles de marketing digital, growth y contenidos.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'marketing-digital';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué métricas usarías para evaluar el éxito de una campaña digital y por qué?',
   '["CTR","conversión","ROI","CAC","alcance","engagement"]',
   'Definir el objetivo y elegir métricas acordes: alcance e impresiones para notoriedad; CTR y engagement para interés; conversión, CAC y ROI/ROAS para resultados. Comparar contra una línea base.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué te interesa el marketing digital y este puesto en particular?',
   '["motivación","datos","creatividad","marca","resultados"]',
   'Conectar tu motivación (mezcla de creatividad y datos) con el producto o marca de la empresa y el impacto que quieres lograr, mostrando investigación previa.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'TECHNICAL', 'es',
   'Diseña una estrategia de adquisición para lanzar un producto SaaS. ¿Qué canales priorizarías?',
   '["segmentación","canales","embudo","presupuesto","SEO","SEM","contenido","CAC"]',
   'Definir público y propuesta de valor, elegir canales según el embudo (SEO y contenido para captar, SEM y social ads para escalar), asignar presupuesto por canal, medir CAC y LTV e iterar.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),
  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Cuéntame de una vez que trabajaste con diseño o ventas para sacar una campaña.',
   '["colaboración","comunicación","coordinación","entrega","resultado"]',
   'Con STAR: el contexto, cómo coordinaste con los otros equipos, cómo resolviste diferencias y el resultado de la campaña, dejando clara tu contribución.',
   '{"TEAMWORK":0.5,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Una campaña consume presupuesto pero no genera conversiones. ¿Cómo lo diagnosticas?',
   '["segmentación","creatividades","landing","embudo","datos","hipótesis"]',
   'Revisar el embudo de punta a punta: segmentación y puja, relevancia de las creatividades, experiencia de la landing y seguimiento de conversiones. Formular hipótesis, probar cambios y priorizar el mayor cuello de botella.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'El tráfico web creció 30% pero las ventas siguen igual. ¿Cómo lo investigarías?',
   '["segmentar","calidad de tráfico","conversión","fuente","hipótesis","recomendación"]',
   'Segmentar por fuente y calidad del tráfico, revisar la tasa de conversión por canal y la experiencia de compra, formular hipótesis (tráfico poco cualificado, fricción en el checkout), pedir datos y recomendar la acción de mayor impacto.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}');
END $$;

-- ===================== Diseño UX/UI =====================
INSERT INTO professions (slug, name, description) VALUES
  ('diseno-ux-ui', 'Diseño UX/UI',
   'Entrevistas para roles de diseño de producto, experiencia e interfaz.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'diseno-ux-ui';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cuál es la diferencia entre UX y UI, y cómo se complementan?',
   '["experiencia","interfaz","usabilidad","investigación","visual","flujo"]',
   'UX es la experiencia global (investigación, flujos, usabilidad); UI es la capa visual e interactiva (componentes, jerarquía, estilo). Se complementan: una UI bonita sin buena UX frustra, y una buena UX necesita una UI clara.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué quieres dedicarte al diseño de producto y a este rol?',
   '["usuarios","impacto","resolver problemas","crecimiento"]',
   'Conectar tu motivación por resolver problemas reales de usuarios con el producto de la empresa y tu crecimiento profesional.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'TECHNICAL', 'es',
   'Describe tu proceso de diseño desde un problema hasta una solución validada.',
   '["investigación","definir","ideación","prototipo","prueba","iteración"]',
   'Investigar y entender al usuario y el problema, definir, idear alternativas, prototipar, probar con usuarios e iterar según la evidencia, midiendo contra objetivos.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),
  (pid, 'JUNIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una vez que recibiste críticas duras a un diseño tuyo.',
   '["feedback","escuchar","iterar","usuario","mejora"]',
   'Con STAR: el contexto, cómo escuché sin ponerme a la defensiva, qué cambié con base en el feedback y los datos, y el resultado.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"CRITICAL_THINKING":0.3}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Un stakeholder quiere un diseño que perjudica la usabilidad. ¿Qué haces?',
   '["datos","usuario","argumentar","alternativa","prueba","alineación"]',
   'Entender su objetivo, mostrar con datos o pruebas de usuario el impacto en la usabilidad, proponer una alternativa que cumpla el objetivo de negocio y alinear con evidencia, no con opiniones.',
   '{"CRITICAL_THINKING":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'Los usuarios abandonan en el registro. ¿Cómo abordarías el rediseño?',
   '["analítica","fricción","hipótesis","prototipo","test","métricas"]',
   'Mirar la analítica y dónde caen, hacer hipótesis de fricción, revisar pasos y campos, prototipar una versión más simple, probarla con usuarios y medir la conversión.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.2}');
END $$;

-- ===================== Ventas =====================
INSERT INTO professions (slug, name, description) VALUES
  ('ventas', 'Ventas',
   'Entrevistas para roles comerciales, account executive y desarrollo de negocio.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'ventas';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cómo estructuras una reunión de ventas con un prospecto nuevo?',
   '["rapport","necesidades","preguntas","valor","objeciones","cierre"]',
   'Crear rapport, descubrir necesidades con preguntas abiertas, conectar el valor del producto a esas necesidades, manejar objeciones y proponer un siguiente paso claro.',
   '{"COMMUNICATION":0.5,"DOMAIN_KNOWLEDGE":0.3,"CONFIDENCE":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Qué te motiva de las ventas y por qué esta empresa?',
   '["motivación","metas","personas","producto"]',
   'Conectar tu motivación por ayudar a clientes y cumplir metas con el producto y el mercado de la empresa.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'COMPETENCY', 'es',
   'Cuéntame del trato más difícil que cerraste y cómo lo lograste.',
   '["necesidad","objeciones","persistencia","valor","cierre","resultado"]',
   'Con STAR: el contexto y los obstáculos, cómo entendí la necesidad real, manejé las objeciones y construí confianza, y cómo cerré, con el resultado en cifras.',
   '{"COMMUNICATION":0.4,"PROBLEM_SOLVING":0.3,"CONFIDENCE":0.3}'),
  (pid, 'JUNIOR', 'SITUATIONAL', 'es',
   'Un prospecto dice que tu producto es muy caro. ¿Cómo respondes?',
   '["valor","ROI","necesidad","comparar","beneficios"]',
   'No bajar el precio de inmediato: entender su preocupación, reenfocar en el valor y el ROI frente a su necesidad, y comparar con el costo de no resolver el problema.',
   '{"COMMUNICATION":0.5,"CRITICAL_THINKING":0.3,"CONFIDENCE":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Un cliente importante amenaza con irse a la competencia. ¿Qué haces?',
   '["escuchar","causa","valor","retención","propuesta","seguimiento"]',
   'Escuchar la causa real, reconocer el problema, recordar el valor entregado, ofrecer una propuesta concreta de retención y dar un seguimiento cercano.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),
  (pid, 'LEAD', 'LEADERSHIP', 'es',
   'Tu equipo de ventas no llega a la cuota del trimestre. ¿Cómo lo gestionas?',
   '["datos","embudo","coaching","metas","seguimiento","motivación"]',
   'Analizar el embudo y dónde se pierden las oportunidades, dar coaching individual, ajustar metas y prioridades, y motivar con seguimiento cercano y reconocimiento.',
   '{"LEADERSHIP":0.5,"PROBLEM_SOLVING":0.3,"COMMUNICATION":0.2}');
END $$;

-- ===================== Análisis de Datos =====================
INSERT INTO professions (slug, name, description) VALUES
  ('analisis-de-datos', 'Análisis de Datos',
   'Entrevistas para roles de analista de datos, BI e insights.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'analisis-de-datos';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cuál es la diferencia entre correlación y causalidad? Da un ejemplo.',
   '["correlación","causalidad","variable","confusión","experimento"]',
   'Correlación es que dos variables se mueven juntas; causalidad es que una provoca la otra. Una correlación puede deberse a una variable de confusión o al azar; para inferir causa hace falta diseño experimental o controles.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.5}'),
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   'Tienes un conjunto de datos con valores faltantes y atípicos. ¿Cómo lo limpias?',
   '["faltantes","outliers","imputación","validación","documentar"]',
   'Explorar el alcance del problema, decidir por columna si imputar, eliminar o marcar; tratar los atípicos según el contexto (no siempre se quitan), validar contra reglas de negocio y documentar las decisiones.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CLARITY":0.2}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'La retención de usuarios cayó este mes. ¿Cómo lo analizarías?',
   '["segmentar","cohortes","hipótesis","métricas","datos","recomendación"]',
   'Definir la retención y segmentar por cohortes, canal y plataforma; comparar con periodos previos; formular hipótesis (producto, técnico, estacional); validar con datos y recomendar la causa más probable.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué te interesa el análisis de datos y este rol?',
   '["curiosidad","impacto","decisiones","negocio"]',
   'Conectar tu curiosidad por encontrar respuestas en los datos con el impacto en las decisiones de negocio de la empresa.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'COMPETENCY', 'es',
   'Cuéntame de un análisis tuyo que cambió una decisión.',
   '["pregunta","datos","insight","comunicación","impacto"]',
   'Con STAR: la pregunta de negocio, cómo obtuviste y analizaste los datos, el insight clave, cómo lo comunicaste y la decisión e impacto que generó.',
   '{"COMMUNICATION":0.4,"PROBLEM_SOLVING":0.3,"DOMAIN_KNOWLEDGE":0.3}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Te piden un análisis urgente con datos incompletos. ¿Qué haces?',
   '["priorizar","supuestos","alcance","comunicar","aproximación"]',
   'Aclarar la pregunta clave, acordar un alcance realista, hacer supuestos explícitos y entregar una primera aproximación con sus límites, comunicando qué mejoraría con más tiempo o datos.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}');
END $$;

-- ===================== Recursos Humanos =====================
INSERT INTO professions (slug, name, description) VALUES
  ('recursos-humanos', 'Recursos Humanos',
   'Entrevistas para roles de RR. HH., reclutamiento y gestión de talento.');
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'recursos-humanos';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cómo estructurarías un proceso de selección para un puesto?',
   '["perfil","fuentes","cribado","entrevista","evaluación","experiencia"]',
   'Definir el perfil con el manager, atraer candidatos por varias fuentes, cribar por requisitos, entrevistar por competencias con criterios claros, evaluar de forma consistente y cuidar la experiencia del candidato.',
   '{"DOMAIN_KNOWLEDGE":0.5,"COMMUNICATION":0.3,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué te dedicas a recursos humanos y por qué esta empresa?',
   '["personas","cultura","impacto","desarrollo"]',
   'Conectar tu interés por las personas y la cultura con el impacto que quieres tener y los valores de la empresa.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Dos empleados tienen un conflicto que afecta al equipo. ¿Cómo intervienes?',
   '["escuchar","imparcial","causa","acuerdo","seguimiento","confidencialidad"]',
   'Escuchar a ambas partes por separado con imparcialidad y confidencialidad, identificar la causa, facilitar una conversación hacia un acuerdo y dar seguimiento.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'SENIOR', 'COMPETENCY', 'es',
   'Cuéntame de una iniciativa de cultura o clima que lideraste.',
   '["diagnóstico","plan","participación","medición","resultado"]',
   'Con STAR: el problema de clima, cómo lo diagnosticaste, el plan y cómo involucraste a la gente, y cómo mediste el resultado.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.3}'),
  (pid, 'JUNIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una vez que diste una noticia difícil a un empleado.',
   '["empatía","claridad","respeto","apoyo","seguimiento"]',
   'Con STAR: el contexto, cómo preparé la conversación, la comuniqué con claridad y empatía, ofrecí apoyo y di seguimiento.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"TEAMWORK":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'La rotación de personal subió mucho este año. ¿Cómo lo abordarías?',
   '["datos","segmentar","entrevistas de salida","causas","plan","retención"]',
   'Analizar los datos de rotación por área y antigüedad, revisar las entrevistas de salida, formular causas (compensación, liderazgo, crecimiento), priorizar y proponer un plan de retención medible.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}');
END $$;
