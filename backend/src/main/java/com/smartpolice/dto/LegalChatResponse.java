package com.smartpolice.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalChatResponse {

    private String sessionId;
    private String reply;
    private List<String> relevantSections;
    private Map<String, String> emergencyHelplines;
    private String disclaimer;
}
