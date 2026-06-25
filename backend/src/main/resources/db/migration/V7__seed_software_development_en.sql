-- English question bank for the software-development profession.
-- Mirrors and expands the Spanish bank (V2) so 'en' interviews are no longer empty.
DO $$
DECLARE pid BIGINT;
BEGIN
  SELECT id INTO pid FROM professions WHERE slug = 'software-development';

  INSERT INTO questions (profession_id, level, type, language, text, expected_keywords, model_answer, target_dimensions) VALUES

  -- ===== TECHNICAL =====
  (pid, 'JUNIOR', 'TECHNICAL', 'en',
   'Explain the difference between an array and a linked list, and when you would use each.',
   '["memory","dynamic size","index","contiguous","complexity"]',
   'An array has a fixed size and contiguous memory with O(1) index access; a linked list grows dynamically with O(1) insertion but O(n) access. Use an array when the size is known and access matters; a list when there are many insertions/deletions.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CLARITY":0.4}'),

  (pid, 'JUNIOR', 'TECHNICAL', 'en',
   'What is a REST API and what are its main principles?',
   '["HTTP","stateless","resources","verbs","JSON","endpoints"]',
   'A REST API exposes resources over HTTP using verbs (GET, POST, PUT, DELETE), is stateless, identifies resources with URIs and usually exchanges JSON. Principles: client-server, statelessness, cacheability, uniform interface.',
   '{"DOMAIN_KNOWLEDGE":0.6,"COMMUNICATION":0.4}'),

  (pid, 'JUNIOR', 'TECHNICAL', 'en',
   'What is a database index and what is the trade-off of adding one?',
   '["lookup","B-tree","read","write","storage","query"]',
   'An index speeds up reads/lookups by keeping a sorted structure (often a B-tree) over a column, at the cost of extra storage and slower writes, since the index must be updated on insert/update. Add indexes for frequent query filters, not blindly.',
   '{"DOMAIN_KNOWLEDGE":0.6,"CRITICAL_THINKING":0.4}'),

  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'en',
   'A SQL query is suddenly very slow in production. How do you diagnose and fix it?',
   '["explain plan","index","query","profiling","N+1","cache"]',
   'Reproduce and measure, read the execution/EXPLAIN plan to find full scans or bad joins, check for missing indexes or N+1 patterns, consider rewriting the query or adding an index/cache, and verify the improvement with real data.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),

  (pid, 'SEMI_SENIOR', 'TECHNICAL', 'en',
   'Explain the difference between concurrency and parallelism, and a problem each can cause.',
   '["threads","race condition","cores","deadlock","async","synchronization"]',
   'Concurrency is dealing with many tasks making progress (interleaved), parallelism is running them literally at the same time on multiple cores. Concurrency can cause race conditions/deadlocks needing synchronization; parallelism adds coordination and overhead.',
   '{"DOMAIN_KNOWLEDGE":0.5,"CLARITY":0.3,"CRITICAL_THINKING":0.2}'),

  (pid, 'SENIOR', 'TECHNICAL', 'en',
   'Design a high-level system to shorten URLs (like bit.ly). What components do you consider?',
   '["database","hash","cache","scalability","load balancing","collisions","redirect"]',
   'An ID generation service (hash/base62), a key-value store, a cache for reads, collision handling, 301/302 redirects, partitioning and a CDN for scale. Discuss consistency vs latency trade-offs.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),

  (pid, 'SENIOR', 'TECHNICAL', 'en',
   'How would you design a caching strategy for a read-heavy service, and what are the risks?',
   '["cache","TTL","invalidation","stampede","consistency","hit rate"]',
   'Cache hot reads close to the app (in-memory/Redis) with a sensible TTL, pick an invalidation strategy (write-through vs write-around), guard against cache stampede with locks/jitter, and monitor hit rate. Main risk is stale data and consistency.',
   '{"PROBLEM_SOLVING":0.4,"DOMAIN_KNOWLEDGE":0.4,"CRITICAL_THINKING":0.2}'),

  -- ===== HR =====
  (pid, 'JUNIOR', 'HR', 'en',
   'Why do you want to work at this company and in this role?',
   '["motivation","values","impact","growth","product"]',
   'Connect personal motivation with the company mission/product, show you did research, and explain how the role fits your growth and the impact you want to make.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"DOMAIN_KNOWLEDGE":0.2}'),

  (pid, 'JUNIOR', 'HR', 'en',
   'Tell me about yourself.',
   '["background","relevant","experience","strengths","goals"]',
   'Give a tight 60-90 second arc: who you are professionally, one or two relevant achievements, your strengths, and why this role is the natural next step. Keep it relevant to the job, not your life story.',
   '{"COMMUNICATION":0.5,"CLARITY":0.3,"CONFIDENCE":0.2}'),

  (pid, 'SEMI_SENIOR', 'HR', 'en',
   'What are you looking for in your next role, and why are you leaving your current one?',
   '["growth","motivation","positive","challenge","fit"]',
   'Frame it around what you want to grow into (scope, challenge, impact), stay positive about your current job, and tie your motivation to what this role offers. Avoid badmouthing anyone.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SENIOR', 'HR', 'en',
   'What motivates you, and how do you stay effective over the long term?',
   '["motivation","ownership","impact","learning","balance"]',
   'Be specific and authentic: solving meaningful problems, ownership and impact, continuous learning. Mention how you sustain it (focus, prioritization, balance) so it reads as durable, not a slogan.',
   '{"COMMUNICATION":0.4,"CONFIDENCE":0.4,"CLARITY":0.2}'),

  -- ===== SITUATIONAL =====
  (pid, 'JUNIOR', 'SITUATIONAL', 'en',
   'Tell me about a time you faced a difficult bug. How did you solve it?',
   '["reproduce","logs","hypothesis","isolate","test","root cause"]',
   'Describe the problem, how you reproduced it, using logs/debugger to form hypotheses, how you isolated the root cause and verified the fix with a test. Show method and learning.',
   '{"PROBLEM_SOLVING":0.5,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.2}'),

  (pid, 'SEMI_SENIOR', 'SITUATIONAL', 'en',
   'Two stakeholders give you conflicting priorities for the same sprint. What do you do?',
   '["clarify","priorities","trade-offs","communicate","align","decision"]',
   'Clarify the goals and impact behind each request, surface the trade-off explicitly, propose a prioritization with data, and get alignment from both (or escalate). Document the decision so it is transparent.',
   '{"PROBLEM_SOLVING":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SENIOR', 'SITUATIONAL', 'en',
   'A critical service goes down at 2am and you are on call. Walk me through your response.',
   '["mitigate","incident","rollback","communicate","root cause","postmortem"]',
   'Stabilize first: assess blast radius, mitigate (rollback/failover/feature flag) before deep debugging, keep stakeholders informed, restore service, then do a blameless postmortem with root cause and follow-up actions.',
   '{"PROBLEM_SOLVING":0.4,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.3}'),

  -- ===== COMPETENCY =====
  (pid, 'JUNIOR', 'COMPETENCY', 'en',
   'Describe a situation where you worked in a team to deliver something under pressure.',
   '["collaboration","communication","priorities","roles","delivery"]',
   'Use STAR: the team context, how you coordinated, how you communicated priorities, and the result delivered on time, with your concrete contribution.',
   '{"TEAMWORK":0.5,"COMMUNICATION":0.3,"PROBLEM_SOLVING":0.2}'),

  (pid, 'SEMI_SENIOR', 'COMPETENCY', 'en',
   'Tell me about a time you disagreed with a teammate. How was it resolved?',
   '["disagreement","listen","data","compromise","respect","outcome"]',
   'With STAR: the disagreement, how you listened and brought data instead of opinion, how you reached a decision or compromise while keeping the relationship, and the outcome and what you learned.',
   '{"TEAMWORK":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'SENIOR', 'COMPETENCY', 'en',
   'Tell me about a project you drove end to end. What was your impact?',
   '["ownership","scope","stakeholders","delivery","impact","metrics"]',
   'With STAR: the scope and why it mattered, how you owned planning and stakeholders, the key decisions and trade-offs, and a measurable result. Make your individual contribution explicit.',
   '{"LEADERSHIP":0.3,"PROBLEM_SOLVING":0.3,"COMMUNICATION":0.2,"CONFIDENCE":0.2}'),

  -- ===== LEADERSHIP =====
  (pid, 'SENIOR', 'LEADERSHIP', 'en',
   'How do you mentor a junior engineer who is struggling to ramp up?',
   '["mentoring","feedback","pairing","goals","patience","growth"]',
   'Understand the root cause, set small clear goals, pair and give frequent specific feedback, create psychological safety, and track progress. Adapt your support to how they learn.',
   '{"LEADERSHIP":0.5,"COMMUNICATION":0.3,"TEAMWORK":0.2}'),

  (pid, 'LEAD', 'LEADERSHIP', 'en',
   'A member of your team has sustained low performance. How do you handle it?',
   '["feedback","expectations","empathy","plan","follow-up","one-on-one"]',
   'A 1:1 with concrete data and empathy, understand the causes, align expectations, agree on a measurable improvement plan with follow-up, and escalate to HR if there is no progress. Balance the individual and the team.',
   '{"LEADERSHIP":0.5,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.2}'),

  (pid, 'LEAD', 'LEADERSHIP', 'en',
   'How do you influence a decision across teams when you have no direct authority?',
   '["influence","data","stakeholders","trust","alignment","communication"]',
   'Build trust and understand each team incentives, frame the proposal around shared goals with data, involve stakeholders early, and drive alignment through clear communication rather than mandate.',
   '{"LEADERSHIP":0.4,"COMMUNICATION":0.3,"CRITICAL_THINKING":0.3}'),

  (pid, 'MANAGER', 'LEADERSHIP', 'en',
   'How do you set goals for your team and keep them aligned with the company strategy?',
   '["goals","alignment","OKRs","priorities","ownership","communication"]',
   'Translate company strategy into a few clear team objectives (e.g. OKRs), co-create them so the team has ownership, make priorities and trade-offs explicit, and revisit regularly with transparent communication.',
   '{"LEADERSHIP":0.5,"CRITICAL_THINKING":0.3,"COMMUNICATION":0.2}');
END $$;
