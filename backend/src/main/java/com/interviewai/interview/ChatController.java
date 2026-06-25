package com.interviewai.interview;

import com.interviewai.interview.dto.ChatDtos.*;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interviews/{id}/chat")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {
    private final ChatService chat;
    public ChatController(ChatService chat) { this.chat = chat; }

    @PostMapping("/start")
    public List<ChatMessageDto> start(@PathVariable Long id) {
        return chat.start(id).stream().map(ChatMessageDto::from).toList();
    }

    @PostMapping
    public ChatReplyDto send(@PathVariable Long id, @Valid @RequestBody ChatRequest req) {
        ChatService.SendOutcome outcome = chat.sendMessage(id, req.message());
        return new ChatReplyDto(outcome.reply(), outcome.finished());
    }

    @GetMapping
    public List<ChatMessageDto> history(@PathVariable Long id) {
        return chat.history(id).stream().map(ChatMessageDto::from).toList();
    }
}
