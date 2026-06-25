package com.interviewai.interview;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "session_id") private Long sessionId;
    private String role;            // "user" | "assistant"
    @Column(columnDefinition = "text") private String content;
    @Column(name = "created_at") private OffsetDateTime createdAt = OffsetDateTime.now();

    public ChatMessage() {}
    public ChatMessage(Long sessionId, String role, String content) {
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public String getRole() { return role; }
    public String getContent() { return content; }
}
