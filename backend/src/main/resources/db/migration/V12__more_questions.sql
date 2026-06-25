-- Deepen the Spanish bank of every profession: ~6 more questions each, filling level gaps
-- (SEMI_SENIOR, MANAGER/LEAD) and adding variety across types.

-- ===================== Desarrollo de Software =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'software-development';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es la complejidad algorítmica (Big O) y por qué es útil?',
   '["tiempo","espacio","escala","peor caso","comparar"]',
   'Describe cómo crecen el tiempo o el espacio según el tamaño de la entrada en el peor caso; sirve para comparar enfoques y anticipar el comportamiento a escala.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CRITICAL_THINKING":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Qué es el control de versiones y cómo gestionas ramas en un equipo?',
   '["git","ramas","merge","conflictos","pull request","historial"]',
   'Un sistema como Git registra cambios y permite colaborar. Se trabaja en ramas por funcionalidad, se integran con pull requests revisados, se resuelven conflictos y se mantiene un historial limpio.',
   '{"DOMAIN_KNOWLEDGE":0.6,"COMMUNICATION":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   'Explica qué son las pruebas unitarias y por qué importan.',
   '["unitarias","aislar","cobertura","regresión","mantenibilidad"]',
   'Prueban una unidad de código de forma aislada y rápida; detectan regresiones, documentan el comportamiento y dan confianza para refactorizar. No sustituyen a las pruebas de integración.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"CLARITY":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Heredas un código sin pruebas y con deuda técnica. ¿Cómo procedes?',
   '["entender","pruebas","refactor incremental","priorizar","riesgo"]',
   'Entender el sistema y su comportamiento, añadir pruebas de caracterización antes de tocar, refactorizar de forma incremental priorizando el mayor riesgo o valor, y evitar reescribir todo de golpe.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"DOMAIN_KNOWLEDGE":0.3}'),
  (pid, 'SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una decisión técnica difícil que tomaste y cómo la justificaste.',
   '["trade-offs","datos","alternativas","stakeholders","resultado"]',
   'Con STAR: el contexto, las alternativas y sus trade-offs, cómo decidí con datos y alineé a los interesados, y el resultado.',
   '{"CRITICAL_THINKING":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'MANAGER', 'LEADERSHIP', 'es',
   '¿Cómo equilibras la entrega de funcionalidades con la salud técnica del equipo?',
   '["prioridades","deuda técnica","negociar","calidad","sostenibilidad"]',
   'Hacer visible la deuda técnica, negociar con producto un porcentaje sostenido de capacidad para calidad, y priorizar lo que reduce riesgo o acelera a futuro, comunicando los trade-offs.',
   '{"LEADERSHIP":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}');
END $$;

-- ===================== Marketing Digital =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'marketing-digital';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es el SEO y qué factores básicos influyen en el posicionamiento?',
   '["palabras clave","contenido","enlaces","técnico","intención","experiencia"]',
   'El SEO mejora la visibilidad orgánica. Influyen el contenido relevante a la intención de búsqueda, las palabras clave, los enlaces, los aspectos técnicos (velocidad, indexación) y la experiencia de usuario.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   'Explica la diferencia entre SEO y SEM y cuándo usar cada uno.',
   '["orgánico","pago","largo plazo","inmediato","presupuesto","intención"]',
   'SEO es tráfico orgánico a largo plazo; SEM es tráfico de pago con resultados inmediatos. El SEM sirve para validar o picos de demanda; el SEO para crecimiento sostenible. Se combinan según objetivos y presupuesto.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"CLARITY":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo planificarías un calendario de contenidos para un trimestre?',
   '["objetivos","audiencia","temas","canales","frecuencia","medición"]',
   'Partir de objetivos y audiencia, definir temas y formatos por canal, una frecuencia realista, un calendario con responsables, y medir el rendimiento para iterar.',
   '{"DOMAIN_KNOWLEDGE":0.5,"PROBLEM_SOLVING":0.3,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una campaña que no funcionó y qué aprendiste.',
   '["hipótesis","datos","aprendizaje","ajuste","resultado"]',
   'Con STAR: la campaña y por qué falló, cómo analicé los datos, qué aprendí y qué cambié después.',
   '{"CRITICAL_THINKING":0.4,"CONFIDENCE":0.3,"COMMUNICATION":0.3}'),
  (pid, 'SEMI_SENIOR', 'SITUATIONAL', 'es',
   'Tienes poco presupuesto y metas ambiciosas. ¿Cómo lo abordas?',
   '["priorizar","canales eficientes","orgánico","experimentos","medir"]',
   'Priorizar los canales más eficientes para el objetivo, apoyarse en contenido y orgánico, hacer experimentos pequeños y baratos, medir y reinvertir en lo que funciona.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"DOMAIN_KNOWLEDGE":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'El coste por adquisición (CAC) se ha duplicado. ¿Cómo lo investigas?',
   '["canales","puja","creatividades","competencia","conversión","optimizar"]',
   'Segmentar el CAC por canal y campaña, revisar pujas, calidad de creatividades, competencia y tasa de conversión de la landing; identificar qué canal lo dispara y optimizar o reasignar el presupuesto.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.2}');
END $$;

-- ===================== Diseño UX/UI =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'diseno-ux-ui';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es la accesibilidad y por qué es importante en el diseño?',
   '["contraste","teclado","lectores de pantalla","inclusión","estándares"]',
   'Es diseñar para que cualquiera pueda usar el producto, incluidas personas con discapacidad. Importa por inclusión, alcance y a menudo por ley; incluye contraste, navegación por teclado y compatibilidad con lectores de pantalla.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Qué es un sistema de diseño y qué problemas resuelve?',
   '["componentes","consistencia","reutilización","escala","colaboración"]',
   'Un conjunto de componentes, patrones y guías reutilizables. Resuelve la consistencia, acelera el trabajo, facilita la colaboración con desarrollo y escala el diseño en equipos grandes.',
   '{"DOMAIN_KNOWLEDGE":0.5,"COMMUNICATION":0.3,"CLARITY":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo decides entre investigación cualitativa y cuantitativa?',
   '["porqué","cuánto","muestra","entrevistas","métricas","complementar"]',
   'La cualitativa (entrevistas, tests) explica el porqué con pocas personas; la cuantitativa (analítica, encuestas) mide el cuánto a escala. Se eligen según la pregunta y suelen complementarse.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Cuéntame de un proyecto donde colaboraste estrechamente con desarrollo.',
   '["handoff","comunicación","viabilidad","iteración","entrega"]',
   'Con STAR: el contexto, cómo comuniqué el diseño y su intención, cómo negocié la viabilidad técnica e iteramos juntos, y el resultado entregado.',
   '{"TEAMWORK":0.5,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.2}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'No tienes acceso a usuarios para investigar. ¿Cómo lo resuelves?',
   '["proxies","datos","heurísticas","pruebas internas","supuestos"]',
   'Usar datos existentes y soporte, evaluaciones heurísticas, pruebas con usuarios internos o proxies, y dejar explícitos los supuestos para validarlos en cuanto sea posible.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SENIOR', 'LEADERSHIP', 'es',
   '¿Cómo defiendes una decisión de diseño ante un equipo escéptico?',
   '["evidencia","usuario","objetivos","escuchar","alinear"]',
   'Apoyar la decisión en evidencia (datos, investigación) y en los objetivos del producto, escuchar las dudas con apertura, y buscar alineación mostrando el impacto en el usuario.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}');
END $$;

-- ===================== Ventas =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'ventas';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es un embudo de ventas y cuáles son sus etapas?',
   '["prospección","calificación","propuesta","negociación","cierre","seguimiento"]',
   'Es el recorrido del prospecto hasta la compra: prospección, calificación, propuesta, negociación y cierre, con seguimiento. Ayuda a medir la conversión por etapa y a priorizar.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo calificas si un prospecto vale la pena (por ejemplo, BANT)?',
   '["presupuesto","autoridad","necesidad","tiempo","ajuste"]',
   'Evaluar presupuesto, autoridad de decisión, necesidad real y plazo (BANT), además del ajuste con tu producto, para invertir el tiempo donde hay más probabilidad de cierre.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.2}'),
  (pid, 'JUNIOR', 'HR', 'es',
   'Cuéntame de ti y por qué encajas en un rol comercial.',
   '["comunicación","resiliencia","metas","personas","resultados"]',
   'Un arco breve: quién eres, una o dos fortalezas comerciales (comunicación, resiliencia, orientación a metas) con un ejemplo, y por qué este rol es el siguiente paso.',
   '{"COMMUNICATION":0.5,"CONFIDENCE":0.3,"CLARITY":0.2}'),
  (pid, 'SEMI_SENIOR', 'BEHAVIORAL', 'es',
   'Cuéntame de una vez que recibiste muchos rechazos seguidos. ¿Cómo lo manejaste?',
   '["resiliencia","análisis","ajuste","motivación","aprendizaje"]',
   'Con STAR: el contexto de rechazos, cómo mantuve la motivación, analicé qué ajustar en el discurso o el público, y el resultado tras corregir.',
   '{"CONFIDENCE":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'El ciclo de ventas se está alargando demasiado. ¿Cómo lo analizas?',
   '["embudo","etapas","fricción","calificación","datos","acelerar"]',
   'Revisar el embudo por etapa para ver dónde se atasca, evaluar la calificación y las objeciones recurrentes, identificar la fricción y proponer acciones (mejor calificación, materiales, involucrar a decisores) para acelerar.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.2}'),
  (pid, 'SEMI_SENIOR', 'SITUATIONAL', 'es',
   'Un cliente pide un descuento que no puedes dar. ¿Qué haces?',
   '["valor","alternativas","condiciones","negociar","relación"]',
   'Reenfocar en el valor, explorar alternativas (alcance, plazos, condiciones), negociar contrapartidas en vez de solo bajar el precio, y cuidar la relación aunque no haya descuento.',
   '{"COMMUNICATION":0.4,"CRITICAL_THINKING":0.3,"CONFIDENCE":0.3}');
END $$;

-- ===================== Análisis de Datos =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'analisis-de-datos';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es una prueba A/B y cómo interpretas su resultado?',
   '["control","variante","significancia","muestra","métrica","sesgo"]',
   'Comparar una variante contra un control dividiendo el tráfico al azar y midiendo una métrica objetivo. Interpretar con el tamaño de muestra y la significancia estadística, cuidando sesgos y duración.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.5}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo elegirías el gráfico adecuado para comunicar un hallazgo?',
   '["objetivo","tipo de dato","comparación","tendencia","audiencia","simplicidad"]',
   'Según lo que quieras mostrar: tendencia (línea), comparación (barras), composición (apilado) o relación (dispersión). Adaptar a la audiencia y mantenerlo simple y honesto.',
   '{"COMMUNICATION":0.4,"DOMAIN_KNOWLEDGE":0.4,"CLARITY":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   'Explica qué es una métrica norte (north star) y cómo se elige.',
   '["valor","usuario","negocio","accionable","alinear"]',
   'Es la métrica que mejor representa el valor entregado al usuario y guía al equipo. Debe reflejar valor real, ser accionable y alinear a producto y negocio.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Cuéntame de una vez que tu análisis tuvo un error. ¿Qué hiciste?',
   '["detectar","reconocer","corregir","validar","aprendizaje"]',
   'Con STAR: cómo detecté el error, lo reconocí y comuniqué a tiempo, lo corregí y validé, y qué proceso cambié para evitarlo.',
   '{"CONFIDENCE":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Tu análisis contradice la intuición de un directivo. ¿Cómo lo comunicas?',
   '["datos","claridad","escuchar","método","tacto","decisión"]',
   'Presentar el método y los datos con claridad, escuchar su perspectiva y posibles factores que falten, mantener el rigor con tacto y enfocar en la mejor decisión, no en tener razón.',
   '{"COMMUNICATION":0.4,"CRITICAL_THINKING":0.3,"CONFIDENCE":0.3}'),
  (pid, 'SENIOR', 'CASE_STUDY', 'es',
   'Te piden estimar el impacto potencial de una funcionalidad antes de construirla. ¿Cómo lo harías?',
   '["supuestos","datos históricos","segmento","modelo simple","rango","riesgos"]',
   'Partir de datos históricos y supuestos explícitos, estimar el segmento afectado y el efecto esperado con un modelo simple, dar un rango en vez de un número único y señalar los riesgos.',
   '{"CRITICAL_THINKING":0.4,"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.2}');
END $$;

-- ===================== Recursos Humanos =====================
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'recursos-humanos';
  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Cómo redactarías una oferta de empleo atractiva y clara?',
   '["responsabilidades","requisitos","propuesta de valor","inclusión","claridad"]',
   'Describir responsabilidades y requisitos reales, una propuesta de valor honesta (cultura, crecimiento, beneficios), lenguaje inclusivo y claro, evitando listas interminables que ahuyenten candidatos.',
   '{"DOMAIN_KNOWLEDGE":0.5,"COMMUNICATION":0.3,"CLARITY":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Cómo reducirías el sesgo en un proceso de selección?',
   '["criterios","estructurada","panel","pruebas","datos","consistencia"]',
   'Definir criterios objetivos, usar entrevistas estructuradas y rúbricas, paneles diversos, pruebas relacionadas con el trabajo y revisar los datos del proceso para detectar sesgos.',
   '{"CRITICAL_THINKING":0.4,"DOMAIN_KNOWLEDGE":0.4,"COMMUNICATION":0.2}'),
  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'es',
   '¿Qué métricas de recursos humanos consideras clave y por qué?',
   '["rotación","tiempo de contratación","satisfacción","retención","ausentismo"]',
   'Rotación y retención (salud del talento), tiempo y coste de contratación (eficiencia), satisfacción o eNPS (clima) y ausentismo. Sirven para detectar problemas y medir iniciativas.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CRITICAL_THINKING":0.3,"CLARITY":0.2}'),
  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Cuéntame de una vez que ayudaste a integrar a un nuevo empleado.',
   '["onboarding","acompañamiento","claridad","seguimiento","integración"]',
   'Con STAR: el contexto, cómo preparé el onboarding, acompañé y di claridad los primeros días, hice seguimiento, y cómo se integró la persona.',
   '{"TEAMWORK":0.4,"COMMUNICATION":0.3,"LEADERSHIP":0.3}'),
  (pid, 'SENIOR', 'SITUATIONAL', 'es',
   'Un manager te pide despedir a alguien sin un proceso justo. ¿Qué haces?',
   '["proceso","documentación","legal","equidad","alternativas","riesgo"]',
   'Frenar y entender el caso, asegurar documentación y un proceso justo y legal, plantear alternativas (plan de mejora) si procede, y proteger tanto a la persona como a la empresa del riesgo.',
   '{"CRITICAL_THINKING":0.4,"LEADERSHIP":0.3,"COMMUNICATION":0.3}'),
  (pid, 'LEAD', 'LEADERSHIP', 'es',
   '¿Cómo diseñarías un plan de desarrollo y crecimiento para los empleados?',
   '["objetivos","competencias","formación","feedback","carrera","seguimiento"]',
   'Partir de los objetivos del negocio y de la persona, mapear competencias, combinar formación y experiencia real, dar feedback continuo y definir rutas de carrera con seguimiento.',
   '{"LEADERSHIP":0.5,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.2}');
END $$;
