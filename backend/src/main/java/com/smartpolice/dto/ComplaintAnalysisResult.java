package com.smartpolice.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintAnalysisResult {

    private String primaryCategory;
    private List<String> bnsSections;
    private Integer severityScore; // 1 (Minor) to 5 (Critical)
    private Boolean isCognizable;
    private String suggestedPriority; // CRITICAL, HIGH, MEDIUM, NORMAL
    private String detectedLanguage;
    private String translatedEnglishSummary;

    // Extracted incident entities
    private String incidentDate;
    private String location;
    private String suspectDescription;
    private String stolenProperty;
    private Map<String, Object> additionalEntities;
}
