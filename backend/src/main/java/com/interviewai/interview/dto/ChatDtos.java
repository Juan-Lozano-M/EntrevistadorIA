package com.interviewai.interview.dto;

import com.interviewai.interview.ChatMessage;
import jakarta.validation.constraints.NotBlank;

public class ChatDtos {
    public record ChatRequest(@NotBlank String message) {}
    public record ChatReplyDto(String reply, boolean finished) {}
    public record ChatMessageDto(String role, String content) {
        public static ChatMessageDto from(ChatMessage m) {
            return new ChatMessageDto(m.getRole(), m.getContent());
        }
    }
}
