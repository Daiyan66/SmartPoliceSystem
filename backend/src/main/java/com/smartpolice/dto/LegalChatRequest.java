package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalChatRequest {

    @NotBlank(message = "Message text cannot be empty")
    private String message;

    private String sessionId;

    private List<Map<String, String>> conversationHistory;
}
