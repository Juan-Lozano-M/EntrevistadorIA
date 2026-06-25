-- BEHAVIORAL (past STAR stories) and CASE_STUDY (open business/estimation problems)
-- question banks for the software-development profession, in Spanish and English.
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'software-development';

  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES

  -- ===== BEHAVIORAL (es) =====
  (pid, 'JUNIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una vez que recibiste críticas duras sobre tu trabajo. ¿Qué hiciste?',
   '["feedback","escuchar","sin defensiva","acción","mejora","resultado"]',
   'Con STAR: la situación y la crítica recibida, cómo la escuché sin ponerme a la defensiva, qué cambié concretamente y el resultado o aprendizaje medible.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'JUNIOR', 'BEHAVIORAL', 'es',
   'Describe una vez que cometiste un error importante. ¿Cómo lo manejaste?',
   '["responsabilidad","reconocer","corregir","aprendizaje","comunicar"]',
   'Con STAR: el contexto del error, cómo asumí la responsabilidad y lo comuniqué a tiempo, qué hice para corregirlo y qué cambié para que no se repita.',
   '{"CONFIDENCE":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SEMI_SENIOR', 'BEHAVIORAL', 'es',
   'Háblame de una vez que tomaste la iniciativa sin que te lo pidieran.',
   '["proactividad","iniciativa","impacto","riesgo","resultado"]',
   'Con STAR: qué oportunidad o problema detecté, por qué decidí actuar, qué hice asumiendo el riesgo y el impacto concreto que generó.',
   '{"LEADERSHIP":0.4,"CONFIDENCE":0.3,"PROBLEM_SOLVING":0.3}'),

  (pid, 'SEMI_SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de un conflicto con un compañero y cómo lo resolviste.',
   '["conflicto","escuchar","empatía","acuerdo","relación","resultado"]',
   'Con STAR: el origen del conflicto, cómo escuché su punto de vista con empatía, cómo llegamos a un acuerdo cuidando la relación, y el resultado y aprendizaje.',
   '{"TEAMWORK":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SENIOR', 'BEHAVIORAL', 'es',
   'Describe una situación en la que tuviste que cumplir un plazo muy ajustado.',
   '["priorizar","plan","presión","comunicar","alcance","entrega"]',
   'Con STAR: el contexto y la presión, cómo prioricé y negocié el alcance, cómo comuniqué riesgos a los interesados y cómo logré la entrega, con el resultado.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CONFIDENCE":0.3}'),

  (pid, 'SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una vez que influiste en una decisión importante sin tener autoridad formal.',
   '["influencia","datos","confianza","stakeholders","alineación","resultado"]',
   'Con STAR: la decisión en juego, cómo construí confianza y usé datos para argumentar, cómo alineé a los interesados sin imponer, y el resultado que se logró.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  -- ===== BEHAVIORAL (en) =====
  (pid, 'JUNIOR', 'BEHAVIORAL', 'en',
   'Tell me about a time you received tough criticism about your work. What did you do?',
   '["feedback","listen","no defensiveness","action","improvement","result"]',
   'With STAR: the situation and the feedback received, how you listened without getting defensive, what you concretely changed, and the measurable result or learning.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'JUNIOR', 'BEHAVIORAL', 'en',
   'Describe a time you made a significant mistake. How did you handle it?',
   '["ownership","acknowledge","fix","learning","communicate"]',
   'With STAR: the context of the mistake, how you took ownership and communicated it early, what you did to fix it, and what you changed so it does not happen again.',
   '{"CONFIDENCE":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SEMI_SENIOR', 'BEHAVIORAL', 'en',
   'Tell me about a time you took initiative without being asked.',
   '["proactivity","initiative","impact","risk","result"]',
   'With STAR: the opportunity or problem you spotted, why you decided to act, what you did while owning the risk, and the concrete impact it created.',
   '{"LEADERSHIP":0.4,"CONFIDENCE":0.3,"PROBLEM_SOLVING":0.3}'),

  (pid, 'SEMI_SENIOR', 'BEHAVIORAL', 'en',
   'Tell me about a conflict with a teammate and how you resolved it.',
   '["conflict","listen","empathy","agreement","relationship","result"]',
   'With STAR: the source of the conflict, how you listened to their view with empathy, how you reached an agreement while protecting the relationship, and the outcome and learning.',
   '{"TEAMWORK":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SENIOR', 'BEHAVIORAL', 'en',
   'Describe a situation where you had to meet a very tight deadline.',
   '["prioritize","plan","pressure","communicate","scope","delivery"]',
   'With STAR: the context and pressure, how you prioritized and negotiated scope, how you communicated risks to stakeholders, and how you delivered, with the result.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CONFIDENCE":0.3}'),

  (pid, 'SENIOR', 'BEHAVIORAL', 'en',
   'Tell me about a time you influenced an important decision without having formal authority.',
   '["influence","data","trust","stakeholders","alignment","result"]',
   'With STAR: the decision at stake, how you built trust and used data to make the case, how you aligned stakeholders without mandating, and the result achieved.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  -- ===== CASE_STUDY (es) =====
  (pid, 'JUNIOR', 'CASE_STUDY', 'es',
   'Estima cuántas tazas de café se venden al día en tu ciudad. Explica tu razonamiento.',
   '["supuestos","población","segmentar","estimación","desglose"]',
   'Estructurar la estimación: partir de la población, hacer supuestos explícitos (porcentaje que toma café, tazas por persona), segmentar por casa/trabajo/cafeterías y multiplicar paso a paso, indicando el orden de magnitud.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"CLARITY":0.2}'),

  (pid, 'SEMI_SENIOR', 'CASE_STUDY', 'es',
   'Las ventas de nuestra app cayeron 20% el último trimestre. ¿Cómo investigarías la causa?',
   '["segmentar","hipótesis","datos","métricas","priorizar","recomendación"]',
   'Aclarar alcance y métricas, segmentar (canal, región, cohorte, plataforma), formular hipótesis (producto, mercado, competencia, técnico), decir qué datos pediría, priorizar la causa más probable y proponer una recomendación con próximos pasos.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"COMMUNICATION":0.2}'),

  (pid, 'SEMI_SENIOR', 'CASE_STUDY', 'es',
   '¿Cómo decidirías qué funcionalidad construir a continuación en un producto?',
   '["impacto","esfuerzo","usuarios","datos","priorización","objetivos"]',
   'Partir de los objetivos del producto, recoger señales (usuarios, datos, negocio), evaluar opciones por impacto vs esfuerzo, priorizar con un marco claro y validar con la métrica que se busca mover.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),

  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'Una empresa quiere entrar a un mercado nuevo. ¿Cómo abordarías la decisión?',
   '["mercado","competencia","supuestos","riesgos","rentabilidad","recomendación"]',
   'Estructurar: tamaño y crecimiento del mercado, competencia y diferenciación, capacidades propias, supuestos clave y riesgos, un análisis de rentabilidad simple, y una recomendación con condiciones y próximos pasos.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}'),

  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   '¿Cómo medirías el éxito de una nueva funcionalidad recién lanzada?',
   '["métricas","objetivo","adopción","retención","experimento","línea base"]',
   'Definir el objetivo y la métrica norte, elegir métricas de adopción, retención y calidad, establecer una línea base, contrastar con un grupo de control o experimento, y vigilar contramétricas para no romper otra cosa.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.3,"CLARITY":0.3}'),

  -- ===== CASE_STUDY (en) =====
  (pid, 'JUNIOR', 'CASE_STUDY', 'en',
   'Estimate how many cups of coffee are sold per day in your city. Explain your reasoning.',
   '["assumptions","population","segment","estimation","breakdown"]',
   'Structure the estimate: start from the population, make explicit assumptions (share who drink coffee, cups per person), segment by home/work/cafes, and multiply step by step, stating the order of magnitude.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"CLARITY":0.2}'),

  (pid, 'SEMI_SENIOR', 'CASE_STUDY', 'en',
   'Sales of our app dropped 20% last quarter. How would you investigate the cause?',
   '["segment","hypothesis","data","metrics","prioritize","recommendation"]',
   'Clarify scope and metrics, segment (channel, region, cohort, platform), form hypotheses (product, market, competition, technical), state what data you would pull, prioritize the most likely cause, and propose a recommendation with next steps.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"COMMUNICATION":0.2}'),

  (pid, 'SEMI_SENIOR', 'CASE_STUDY', 'en',
   'How would you decide which feature to build next in a product?',
   '["impact","effort","users","data","prioritization","goals"]',
   'Start from the product goals, gather signals (users, data, business), evaluate options by impact vs effort, prioritize with a clear framework, and validate against the metric you want to move.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),

  (pid, 'SENIOR', 'CASE_STUDY', 'en',
   'A company wants to enter a new market. How would you approach the decision?',
   '["market","competition","assumptions","risks","profitability","recommendation"]',
   'Structure it: market size and growth, competition and differentiation, your own capabilities, key assumptions and risks, a simple profitability view, and a recommendation with conditions and next steps.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.2}'),

  (pid, 'SENIOR', 'CASE_STUDY', 'en',
   'How would you measure the success of a newly launched feature?',
   '["metrics","goal","adoption","retention","experiment","baseline"]',
   'Define the goal and a north-star metric, pick adoption, retention and quality metrics, establish a baseline, compare against a control group or experiment, and watch counter-metrics so you do not break something else.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.3,"CLARITY":0.3}');
END $$;
