package com.interviewai.interview;

import com.interviewai.auth.CurrentUser;
import com.interviewai.auth.User;
import com.interviewai.common.*;
import com.interviewai.interview.dto.*;
import com.interviewai.profession.*;
import com.interviewai.question.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class InterviewService {
    private static final int MAX_QUESTIONS = 8;

    private final InterviewSessionRepository sessions;
    private final InterviewAnswerRepository answers;
    private final SessionFeedbackRepository feedbacks;
    private final ProfessionRepository professions;
    private final QuestionRepository questions;
    private final QuestionProvider questionProvider;
    private final AnswerEvaluator evaluator;
    private final FeedbackGenerator feedbackGenerator;
    private final CurrentUser currentUser;

    public InterviewService(InterviewSessionRepository sessions, InterviewAnswerRepository answers,
                            SessionFeedbackRepository feedbacks, ProfessionRepository professions,
                            QuestionRepository questions, QuestionProvider questionProvider,
                            AnswerEvaluator evaluator, FeedbackGenerator feedbackGenerator,
                            CurrentUser currentUser) {
        this.sessions = sessions; this.answers = answers; this.feedbacks = feedbacks;
        this.professions = professions; this.questions = questions;
        this.questionProvider = questionProvider; this.evaluator = evaluator;
        this.feedbackGenerator = feedbackGenerator; this.currentUser = currentUser;
    }

    @Transactional
    public SessionSummaryDto create(CreateInterviewRequest req) {
        User user = currentUser.require();
        Profession profession = professions.findBySlug(req.professionSlug())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Profesión no encontrada"));
        InterviewSession s = new InterviewSession();
        s.setUserId(user.getId());
        s.setProfessionId(profession.getId());
        s.setRoleTitle(req.roleTitle());
        s.setTargetCompany(req.targetCompany());
        s.setIndustry(req.industry());
        try {
            s.setLevel(Level.valueOf(req.level()).name());
            s.setType(InterviewType.valueOf(req.type()).name());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Nivel o tipo de entrevista inválido");
        }
        s.setLanguage(req.language());
        s.setDurationMinutes(req.durationMinutes());
        s.setStatus("IN_PROGRESS");
        sessions.save(s);
        return SessionSummaryDto.from(s);
    }

    @Transactional(readOnly = true)
    public NextQuestionDto nextQuestion(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        List<Question> selected = selectedQuestions(s);
        long answered = answers.countBySessionId(sessionId);
        for (Question q : selected) {
            if (!answers.existsBySessionIdAndQuestionId(sessionId, q.getId())) {
                return new NextQuestionDto(
                    QuestionDto.of(q, (int) answered + 1, selected.size()), false);
            }
        }
        return new NextQuestionDto(null, true);
    }

    @Transactional
    public void submitAnswer(Long sessionId, SubmitAnswerRequest req) {
        InterviewSession s = ownedSession(sessionId);
        if (answers.existsBySessionIdAndQuestionId(sessionId, req.questionId()))
            throw new ApiException(HttpStatus.CONFLICT, "La pregunta ya fue respondida");
        Question q = questions.findById(req.questionId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pregunta no encontrada"));

        long expectedMs = (long) s.getDurationMinutes() * 60_000 / MAX_QUESTIONS;
        var signal = new AnswerSignal(req.answerText(), req.responseTimeMs(), req.selfConfidence(), expectedMs);
        Map<Dimension, Integer> scores = evaluator.evaluate(q, signal);

        InterviewAnswer a = new InterviewAnswer();
        a.setSessionId(sessionId);
        a.setQuestionId(q.getId());
        a.setAnswerText(req.answerText());
        a.setResponseTimeMs(req.responseTimeMs());
        a.setSelfConfidence(req.selfConfidence());
        Map<String, Integer> asString = new HashMap<>();
        scores.forEach((k, v) -> asString.put(k.name(), v));
        a.setDimensionScores(asString);
        answers.save(a);
    }

    @Transactional
    public SessionSummaryDto finish(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        Map<Dimension, Integer> averages = averageDimensions(answers.findBySessionId(sessionId));
        int overall = averages.isEmpty() ? 0
            : (int) Math.round(averages.values().stream().mapToInt(Integer::intValue).average().orElse(0));

        FeedbackResult fr = feedbackGenerator.generate(averages);
        SessionFeedback fb = feedbacks.findBySessionId(sessionId).orElseGet(SessionFeedback::new);
        fb.setSessionId(sessionId);
        fb.setStrengths(fr.strengths());
        fb.setWeaknesses(fr.weaknesses());
        fb.setRecommendations(fr.recommendations());
        fb.setImprovementPlan(fr.improvementPlan());
        feedbacks.save(fb);

        s.setOverallScore(overall);
        s.setStatus("FINISHED");
        s.setFinishedAt(OffsetDateTime.now());
        sessions.save(s);
        return SessionSummaryDto.from(s);
    }

    @Transactional(readOnly = true)
    public ResultsDto results(Long sessionId) {
        InterviewSession s = ownedSession(sessionId);
        if (!"FINISHED".equals(s.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "La entrevista no ha finalizado");
        }
        List<InterviewAnswer> sessionAnswers = answers.findBySessionId(sessionId);
        Map<Dimension, Integer> averages = averageDimensions(sessionAnswers);
        Map<String, Integer> dimScores = new LinkedHashMap<>();
        for (Dimension d : Dimension.values()) {
            if (averages.containsKey(d)) dimScores.put(d.name(), averages.get(d));
        }
        SessionFeedback fb = feedbacks.findBySessionId(sessionId).orElseGet(SessionFeedback::new);
        var feedbackDto = new ResultsDto.FeedbackDto(
            orEmpty(fb.getStrengths()), orEmpty(fb.getWeaknesses()),
            orEmpty(fb.getRecommendations()), orEmpty(fb.getImprovementPlan()));

        List<ResultsDto.AnswerReviewDto> reviews = sessionAnswers.stream().map(a -> {
            Question q = questions.findById(a.getQuestionId()).orElse(null);
            return new ResultsDto.AnswerReviewDto(
                a.getQuestionId(),
                q == null ? "" : q.getText(),
                a.getAnswerText(),
                q == null ? "" : q.getModelAnswer(),
                a.getDimensionScores());
        }).toList();

        return new ResultsDto(s.getId(), s.getRoleTitle(), s.getLevel(), s.getType(),
            s.getOverallScore(), dimScores, feedbackDto, reviews);
    }

    @Transactional(readOnly = true)
    public List<SessionSummaryDto> history() {
        User user = currentUser.require();
        return sessions.findByUserIdOrderByStartedAtDesc(user.getId())
            .stream().map(SessionSummaryDto::from).toList();
    }

    private InterviewSession ownedSession(Long sessionId) {
        User user = currentUser.require();
        InterviewSession s = sessions.findById(sessionId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sesión no encontrada"));
        if (!s.getUserId().equals(user.getId()))
            throw new ApiException(HttpStatus.NOT_FOUND, "Sesión no encontrada");
        return s;
    }

    private List<Question> selectedQuestions(InterviewSession s) {
        return questionProvider.selectQuestions(s.getProfessionId(),
            Level.valueOf(s.getLevel()), InterviewType.valueOf(s.getType()),
            s.getLanguage(), MAX_QUESTIONS);
    }

    private Map<Dimension, Integer> averageDimensions(List<InterviewAnswer> list) {
        Map<Dimension, List<Integer>> acc = new EnumMap<>(Dimension.class);
        for (InterviewAnswer a : list) {
            if (a.getDimensionScores() == null) continue;
            a.getDimensionScores().forEach((k, v) -> {
                Dimension dim;
                try { dim = Dimension.valueOf(k); } catch (IllegalArgumentException e) { return; }
                acc.computeIfAbsent(dim, x -> new ArrayList<>()).add(v);
            });
        }
        Map<Dimension, Integer> averages = new EnumMap<>(Dimension.class);
        acc.forEach((dim, vals) ->
            averages.put(dim, (int) Math.round(vals.stream().mapToInt(Integer::intValue).average().orElse(0))));
        return averages;
    }

    private List<String> orEmpty(List<String> v) { return v == null ? List.of() : v; }
}
