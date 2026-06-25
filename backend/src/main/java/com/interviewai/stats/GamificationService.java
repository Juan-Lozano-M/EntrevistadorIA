package com.interviewai.stats;

import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.common.Dimension;
import com.interviewai.interview.InterviewAnswer;
import com.interviewai.interview.InterviewAnswerRepository;
import com.interviewai.interview.InterviewSession;
import com.interviewai.interview.InterviewSessionRepository;
import com.interviewai.stats.dto.GamificationDto;
import com.interviewai.stats.dto.GamificationDto.Achievement;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

@Service
public class GamificationService {
    private static final int XP_PER_LEVEL = 800;
    private static final String[] LEVEL_NAMES = {
        "Principiante", "Aprendiz", "En forma", "Competente", "Avanzado", "Experto", "Maestro",
    };
    private static final String BRONCE = "BRONCE", PLATA = "PLATA", ORO = "ORO";
    private static final String CONSTANCIA = "Constancia", DESEMPENO = "Desempeño",
        HABILIDADES = "Habilidades", ESPECIALES = "Especiales";

    private final InterviewSessionRepository sessions;
    private final InterviewAnswerRepository answers;
    private final CurrentUser currentUser;

    public GamificationService(InterviewSessionRepository sessions, InterviewAnswerRepository answers,
                              CurrentUser currentUser) {
        this.sessions = sessions; this.answers = answers; this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public GamificationDto gamification() {
        return build(currentUser.require());
    }

    /** Computes gamification for an arbitrary user (used by notifications/scheduler). */
    @Transactional(readOnly = true)
    public GamificationDto build(User user) {
        List<InterviewSession> all = sessions.findByUserIdOrderByStartedAtDesc(user.getId());
        List<InterviewSession> finished = all.stream().filter(s -> s.getOverallScore() != null).toList();

        int xp = finished.stream().mapToInt(InterviewSession::getOverallScore).sum();
        int level = xp / XP_PER_LEVEL + 1;
        String levelName = LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)];
        int xpInLevel = xp % XP_PER_LEVEL;

        int streak = currentStreak(all);
        int bestStreak = bestStreak(all);

        int finishedCount = finished.size();
        int bestScore = finished.stream().mapToInt(InterviewSession::getOverallScore).max().orElse(0);
        long mastery = finished.stream().filter(s -> s.getOverallScore() >= 80).count();
        int improveRun = maxIncreasingRun(finished);
        boolean fast = hasFastAnswer(all);
        boolean english = finished.stream().anyMatch(s -> "en".equalsIgnoreCase(s.getLanguage()));
        boolean conversational = finished.stream()
            .anyMatch(s -> "CHAT".equals(s.getModality()) || "VOICE".equals(s.getModality()));
        Map<Dimension, Integer> dimBest = bestDimensionScores(all);

        List<Achievement> achievements = new ArrayList<>();
        // ---- Constancia ----
        achievements.add(counted("primer_paso", "Primer paso", "Completa tu primera entrevista",
            CONSTANCIA, BRONCE, 50, finishedCount, 1));
        achievements.add(counted("dedicado", "Dedicado", "Completa 5 entrevistas",
            CONSTANCIA, BRONCE, 80, finishedCount, 5));
        achievements.add(counted("veterano", "Veterano", "Completa 25 entrevistas",
            CONSTANCIA, ORO, 250, finishedCount, 25));
        achievements.add(counted("constante", "En racha", "Practica 5 días seguidos",
            CONSTANCIA, PLATA, 120, bestStreak, 5));
        achievements.add(counted("imparable", "Imparable", "Practica 10 días seguidos",
            CONSTANCIA, ORO, 200, bestStreak, 10));
        // ---- Desempeño ----
        achievements.add(flag("veloz", "Respuesta veloz", "Responde en menos de 30s",
            DESEMPENO, BRONCE, 60, fast));
        achievements.add(counted("notable", "Notable", "Consigue 80+ en una entrevista",
            DESEMPENO, PLATA, 130, bestScore, 80));
        achievements.add(counted("excelencia", "Excelencia", "Consigue 90+ en una entrevista",
            DESEMPENO, ORO, 180, bestScore, 90));
        achievements.add(counted("perfeccion", "Perfección", "Consigue 100 en una entrevista",
            DESEMPENO, ORO, 300, bestScore, 100));
        achievements.add(counted("maestria", "Maestría", "10 entrevistas con 80+",
            DESEMPENO, ORO, 300, (int) mastery, 10));
        achievements.add(counted("ascenso", "Ascenso", "Mejora tu puntaje 3 veces seguidas",
            DESEMPENO, PLATA, 140, improveRun, 3));
        // ---- Habilidades ----
        achievements.add(counted("comunicador", "Comunicador", "85+ en Comunicación",
            HABILIDADES, PLATA, 130, dimBest.getOrDefault(Dimension.COMMUNICATION, 0), 85));
        achievements.add(counted("pensador", "Pensador", "85+ en Pensamiento crítico",
            HABILIDADES, PLATA, 130, dimBest.getOrDefault(Dimension.CRITICAL_THINKING, 0), 85));
        achievements.add(counted("resolutivo", "Resolutivo", "85+ en Resolución de problemas",
            HABILIDADES, PLATA, 130, dimBest.getOrDefault(Dimension.PROBLEM_SOLVING, 0), 85));
        achievements.add(counted("experto", "Experto del área", "85+ en Conocimiento del área",
            HABILIDADES, PLATA, 130, dimBest.getOrDefault(Dimension.DOMAIN_KNOWLEDGE, 0), 85));
        achievements.add(counted("lider", "Líder nato", "85+ en Liderazgo",
            HABILIDADES, ORO, 160, dimBest.getOrDefault(Dimension.LEADERSHIP, 0), 85));
        // ---- Especiales ----
        achievements.add(flag("poliglota", "Políglota", "Completa una entrevista en inglés",
            ESPECIALES, PLATA, 120, english));
        achievements.add(flag("conversador", "Conversador", "Completa una entrevista por chat o voz",
            ESPECIALES, PLATA, 150, conversational));

        return new GamificationDto(xp, level, levelName, xpInLevel, XP_PER_LEVEL,
            streak, bestStreak, achievements);
    }

    private Achievement counted(String key, String title, String desc, String category, String tier,
                                int xp, int progress, int target) {
        int p = Math.max(0, Math.min(progress, target));
        return new Achievement(key, title, desc, category, tier, xp, p, target, p >= target);
    }

    private Achievement flag(String key, String title, String desc, String category, String tier,
                             int xp, boolean done) {
        return new Achievement(key, title, desc, category, tier, xp, done ? 1 : 0, 1, done);
    }

    /** Consecutive days (ending today or yesterday) with at least one session. */
    private int currentStreak(List<InterviewSession> all) {
        Set<LocalDate> days = dayset(all);
        if (days.isEmpty()) return 0;
        LocalDate cursor = LocalDate.now();
        if (!days.contains(cursor)) {
            cursor = cursor.minusDays(1);
            if (!days.contains(cursor)) return 0;
        }
        int streak = 0;
        while (days.contains(cursor)) { streak++; cursor = cursor.minusDays(1); }
        return streak;
    }

    /** Longest run of consecutive days with at least one session, ever. */
    private int bestStreak(List<InterviewSession> all) {
        TreeSet<LocalDate> days = new TreeSet<>(dayset(all));
        int best = 0, run = 0;
        LocalDate prev = null;
        for (LocalDate d : days) {
            run = (prev != null && d.equals(prev.plusDays(1))) ? run + 1 : 1;
            best = Math.max(best, run);
            prev = d;
        }
        return best;
    }

    private Set<LocalDate> dayset(List<InterviewSession> all) {
        Set<LocalDate> days = new HashSet<>();
        for (InterviewSession s : all) days.add(s.getStartedAt().toLocalDate());
        return days;
    }

    /** Longest run of strictly improving overall scores across finished sessions, chronologically. */
    private int maxIncreasingRun(List<InterviewSession> finishedDesc) {
        List<InterviewSession> asc = new ArrayList<>(finishedDesc);
        Collections.reverse(asc);
        int best = 0, run = 0;
        Integer prev = null;
        for (InterviewSession s : asc) {
            int score = s.getOverallScore();
            run = (prev != null && score > prev) ? run + 1 : 1;
            best = Math.max(best, run);
            prev = score;
        }
        return best;
    }

    private Map<Dimension, Integer> bestDimensionScores(List<InterviewSession> all) {
        Map<Dimension, Integer> best = new EnumMap<>(Dimension.class);
        for (InterviewSession s : all) {
            for (InterviewAnswer a : answers.findBySessionId(s.getId())) {
                Map<String, Integer> scores = a.getDimensionScores();
                if (scores == null) continue;
                scores.forEach((k, v) -> {
                    try {
                        Dimension d = Dimension.valueOf(k);
                        best.merge(d, v, Math::max);
                    } catch (IllegalArgumentException ignored) { /* unknown dimension */ }
                });
            }
        }
        return best;
    }

    private boolean hasFastAnswer(List<InterviewSession> all) {
        for (InterviewSession s : all) {
            for (InterviewAnswer a : answers.findBySessionId(s.getId())) {
                if (a.getResponseTimeMs() > 0 && a.getResponseTimeMs() < 30_000) return true;
            }
        }
        return false;
    }
}
