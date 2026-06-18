INSERT INTO professions (slug, name, description) VALUES
  ('software-development', 'Desarrollo de Software',
   'Entrevistas para roles de ingeniería y desarrollo de software.');

-- helper: capture the id
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'software-development';

  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES
  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   'Explica la diferencia entre una lista y un arreglo, y cuándo usarías cada uno.',
   '["memoria","tamaño dinámico","índice","contiguo","complejidad"]',
   'Un arreglo tiene tamaño fijo y memoria contigua con acceso O(1) por índice; una lista enlazada crece dinámicamente con inserción O(1) pero acceso O(n). Se usa arreglo cuando el tamaño es conocido y se prioriza el acceso; lista cuando hay muchas inserciones/eliminaciones.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),

  (pid, 'JUNIOR', 'TECHNICAL', 'es',
   '¿Qué es una API REST y cuáles son sus principios principales?',
   '["HTTP","stateless","recursos","verbos","JSON","endpoints"]',
   'Una API REST expone recursos vía HTTP usando verbos (GET, POST, PUT, DELETE), es stateless, usa URIs para identificar recursos y normalmente intercambia JSON. Principios: cliente-servidor, sin estado, cacheable, interfaz uniforme.',
   '{"DOMAIN_KNOWLEDGE":0.6,"COMMUNICATION":0.4}'),

  (pid, 'JUNIOR', 'SITUATIONAL', 'es',
   'Cuéntame de una vez que tuviste un bug difícil. ¿Cómo lo resolviste?',
   '["reproducir","logs","hipótesis","aislar","prueba","causa raíz"]',
   'Describir el problema, cómo lo reproduje, el uso de logs/debugger para formar hipótesis, cómo aislé la causa raíz y verifiqué el fix con una prueba. Mostrar método y aprendizaje.',
   '{"PROBLEM_SOLVING":0.5,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.2}'),

  (pid, 'JUNIOR', 'HR', 'es',
   '¿Por qué quieres trabajar en esta empresa y este rol?',
   '["motivación","valores","impacto","crecimiento","producto"]',
   'Conectar motivación personal con la misión/producto de la empresa, mostrar investigación previa y cómo el rol encaja con mi crecimiento y el impacto que quiero generar.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),

  (pid, 'JUNIOR', 'COMPETENCY', 'es',
   'Describe una situación en la que trabajaste en equipo para entregar algo bajo presión.',
   '["colaboración","comunicación","prioridades","roles","entrega"]',
   'Situación-Tarea-Acción-Resultado: contexto del equipo, cómo nos coordinamos, comunicación de prioridades y el resultado entregado a tiempo, con mi contribución concreta.',
   '{"TEAMWORK":0.5,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.2}'),

  (pid, 'SENIOR', 'TECHNICAL', 'es',
   'Diseña a alto nivel un sistema para acortar URLs (tipo bit.ly). ¿Qué componentes consideras?',
   '["base de datos","hash","caché","escalabilidad","balanceo","colisiones","redirección"]',
   'Servicio de generación de IDs (hash/base62), almacenamiento clave-valor, caché para lecturas, manejo de colisiones, redirección 301/302, particionado y CDN para escala. Discutir trade-offs de consistencia y latencia.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),

  (pid, 'LEAD', 'LEADERSHIP', 'es',
   'Un miembro de tu equipo tiene bajo desempeño sostenido. ¿Cómo lo manejas?',
   '["feedback","expectativas","empatía","plan","seguimiento","uno a uno"]',
   'Conversación 1:1 con datos concretos y empatía, entender causas, alinear expectativas, acordar un plan de mejora medible con seguimiento, y escalar a RRHH si no hay progreso. Equilibrar al individuo y al equipo.',
   '{"LEADERSHIP":0.5,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.2}');
END $$;
