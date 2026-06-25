package com.interviewai.stats;

import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.common.Dimension;
import com.interviewai.interview.InterviewAnswer;
import com.interviewai.interview.InterviewAnswerRepository;
import com.interviewai.interview.InterviewSession;
import com.interviewai.interview.InterviewSessionRepository;
import com.interviewai.stats.dto.OverviewDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class StatsService {
    private final InterviewSessionRepository sessions;
    private final InterviewAnswerRepository answers;
    private final CurrentUser currentUser;

    public StatsService(InterviewSessionRepository sessions, InterviewAnswerRepository answers,
                        CurrentUser currentUser) {
        this.sessions = sessions; this.answers = answers; this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public OverviewDto overview() {
        User user = currentUser.require();
        List<InterviewSession> all = sessions.findByUserIdOrderByStartedAtDesc(user.getId());
        List<InterviewSession> finished = all.stream()
            .filter(s -> s.getOverallScore() != null).toList();

        int total = all.size();
        int completed = finished.size();
        int average = finished.isEmpty() ? 0
            : (int) Math.round(finished.stream().mapToInt(InterviewSession::getOverallScore).average().orElse(0));
        int best = finished.stream().mapToInt(InterviewSession::getOverallScore).max().orElse(0);

        List<OverviewDto.Point> timeline = finished.stream()
            .sorted(Comparator.comparing(InterviewSession::getStartedAt))
            .map(s -> new OverviewDto.Point(
                s.getStartedAt().toString(), s.getOverallScore(), sessionDimensions(s.getId())))
            .toList();

        // Global per-dimension average across all finished sessions' answers.
        Map<Dimension, List<Integer>> acc = new EnumMap<>(Dimension.class);
        for (InterviewSession s : finished) {
            for (InterviewAnswer a : answers.findBySessionId(s.getId())) {
                if (a.getDimensionScores() == null) continue;
                a.getDimensionScores().forEach((k, v) -> {
                    try {
                        acc.computeIfAbsent(Dimension.valueOf(k), x -> new ArrayList<>()).add(v);
                    } catch (IllegalArgumentException ignored) { /* unknown dim */ }
                });
            }
        }
        Map<String, Integer> dimAvg = new LinkedHashMap<>();
        for (Dimension d : Dimension.values()) {
            List<Integer> vals = acc.get(d);
            if (vals != null && !vals.isEmpty()) {
                dimAvg.put(d.name(), (int) Math.round(vals.stream().mapToInt(Integer::intValue).average().orElse(0)));
            }
        }

        return new OverviewDto(total, completed, average, best, timeline, dimAvg);
    }

    /** Per-dimension average for a single session (across its answers). */
    private Map<String, Integer> sessionDimensions(Long sessionId) {
        Map<Dimension, List<Integer>> acc = new EnumMap<>(Dimension.class);
        for (InterviewAnswer a : answers.findBySessionId(sessionId)) {
            if (a.getDimensionScores() == null) continue;
            a.getDimensionScores().forEach((k, v) -> {
                try {
                    acc.computeIfAbsent(Dimension.valueOf(k), x -> new ArrayList<>()).add(v);
                } catch (IllegalArgumentException ignored) { /* unknown dim */ }
            });
        }
        Map<String, Integer> out = new LinkedHashMap<>();
        for (Dimension d : Dimension.values()) {
            List<Integer> vals = acc.get(d);
            if (vals != null && !vals.isEmpty()) {
                out.put(d.name(), (int) Math.round(vals.stream().mapToInt(Integer::intValue).average().orElse(0)));
            }
        }
        return out;
    }
}
