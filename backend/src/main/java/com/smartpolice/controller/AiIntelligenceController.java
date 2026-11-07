package com.smartpolice.controller;

import com.smartpolice.dto.*;
import com.smartpolice.service.ComplaintAnalysisService;
import com.smartpolice.service.LegalAssistantChatbotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiIntelligenceController {

    private final ComplaintAnalysisService complaintAnalysisService;
    private final LegalAssistantChatbotService legalAssistantChatbotService;

    @PostMapping("/analyze-complaint")
    public ResponseEntity<ApiResponse<ComplaintAnalysisResult>> analyzeComplaint(
            @Valid @RequestBody ComplaintAnalysisRequest request) {

        ComplaintAnalysisResult result = complaintAnalysisService.analyzeComplaint(request);
        return ResponseEntity.ok(ApiResponse.ok("Complaint narrative analyzed and classified under BNS (2023)", result));
    }

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<LegalChatResponse>> chatLegalAssistant(
            @Valid @RequestBody LegalChatRequest request) {

        LegalChatResponse response = legalAssistantChatbotService.chatWithAssistant(request);
        return ResponseEntity.ok(ApiResponse.ok("Response from State Police Citizen Legal Assistant", response));
    }

    @GetMapping("/bns-sections")
    public ResponseEntity<ApiResponse<List<BnsSectionDto>>> getBnsCatalog() {
        List<BnsSectionDto> catalog = complaintAnalysisService.getBnsCatalog();
        return ResponseEntity.ok(ApiResponse.ok(catalog));
    }
}
