package com.interviewai.interview;

import com.interviewai.common.Dimension;
import com.interviewai.question.Question;
import java.util.Map;

/** Seam: an LLM-backed evaluator can replace this without touching orchestration. */
public interface AnswerEvaluator {
    Map<Dimension, Integer> evaluate(Question question, AnswerSignal signal);
}
