package com.interviewai.llm;

import java.util.List;

/** Seam over the chat LLM. Implementations must not be called in tests (mock this). */
public interface LlmClient {
    String chat(List<LlmMessage> messages);
}
