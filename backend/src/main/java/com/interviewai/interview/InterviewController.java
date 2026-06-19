package com.interviewai.interview;

import com.interviewai.interview.dto.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews")
@SecurityRequirement(name = "bearerAuth")
public class InterviewController {
    private final InterviewService service;
    public InterviewController(InterviewService service) { this.service = service; }

    @PostMapping
    public SessionSummaryDto create(@Valid @RequestBody CreateInterviewRequest req) {
        return service.create(req);
    }

    @GetMapping("/{id}/next-question")
    public NextQuestionDto next(@PathVariable Long id) { return service.nextQuestion(id); }

    @PostMapping("/{id}/answers")
    public void answer(@PathVariable Long id, @Valid @RequestBody SubmitAnswerRequest req) {
        service.submitAnswer(id, req);
    }

    @PostMapping("/{id}/finish")
    public SessionSummaryDto finish(@PathVariable Long id) { return service.finish(id); }

    @GetMapping("/{id}/results")
    public ResultsDto results(@PathVariable Long id) { return service.results(id); }

    @GetMapping
    public List<SessionSummaryDto> history() { return service.history(); }
}
