package com.smartpolice.service;

import com.smartpolice.dto.LegalChatRequest;
import com.smartpolice.dto.LegalChatResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class LegalAssistantChatbotService {

    private static final Logger log = LoggerFactory.getLogger(LegalAssistantChatbotService.class);

    private final OpenRouterClientService openRouterClientService;

    private static final Map<String, String> EMERGENCY_HELPLINES = Map.of(
            "National Emergency (Police/Fire/Ambulance)", "112",
            "National Cyber Crime Helpline (Golden Hour reporting)", "1930",
            "Women Power Helpline", "1090 / 181",
            "Child Helpline", "1098",
            "Senior Citizen Helpline", "14567"
    );

    public LegalChatResponse chatWithAssistant(LegalChatRequest request) {
        String userQuery = request.getMessage() != null ? request.getMessage().trim() : "";
        log.info("Processing citizen legal inquiry: {}", userQuery.length() > 60 ? userQuery.substring(0, 60) + "..." : userQuery);

        // Prompt Injection Pre-filter
        if (isMaliciousOrInjection(userQuery)) {
            return LegalChatResponse.builder()
                    .sessionId(request.getSessionId())
                    .reply("I am 'Rakshak', the official Citizen Legal & Public Safety Assistant of the State Police Department. I am programmed strictly to assist citizens with Indian legal procedures, reporting crimes under BNS/BNSS, cyber fraud assistance (1930), and emergency public safety. I cannot follow instructions to ignore these safety guardrails or engage in non-police queries.")
                    .emergencyHelplines(EMERGENCY_HELPLINES)
                    .disclaimer("Notice: State Police AI Assistance is monitored for public safety.")
                    .build();
        }

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", """
                You are 'Rakshak', the AI Citizen Legal & Public Safety Assistant for the State Police Department (Government of India).
                Your mandate is to provide courteous, reassuring, legally accurate, and actionable guidance to citizens navigating the Indian legal and policing system.
                
                LEGAL & STATUTORY FRAMEWORK:
                1. New Criminal Laws (2023):
                   - Bharatiya Nyaya Sanhita (BNS, 2023) - Substantive criminal offenses (replaces IPC).
                   - Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023) - Criminal procedure and arrest protocols (replaces CrPC).
                   - Bharatiya Sakshya Adhiniyam (BSA, 2023) - Evidence admissibility and digital forensics (replaces IEA).
                2. Key Citizen Rights:
                   - Zero-FIR: Any citizen can file a Zero-FIR at ANY police station in India regardless of territorial jurisdiction; the station must register it and transfer it.
                   - Arrestee Rights under BNSS (Sections 35-50): Right to know grounds of arrest (Sec 47), right to inform a nominated relative/friend immediately (Sec 48), right to free legal aid, right to medical examination (Sec 53).
                   - Protection of Women: No woman shall be arrested after sunset and before sunrise except in extraordinary circumstances with a woman police officer and prior magistrate approval (BNSS Sec 43).
                3. Cyber Fraud Protocol:
                   - Immediate advice to call 1930 (National Cyber Crime Helpline) within the 'Golden Hour' to freeze fraudulent bank transfers, and file at cybercrime.gov.in.
                4. Tone & Language:
                   - Empathetic, objective, professional, and accessible.
                   - Respond in the language used by the citizen (English, Hindi, Hinglish, Marathi, etc.).
                5. STRICT GUARDRAILS:
                   - NEVER give instructions on how to evade arrest or commit a crime.
                   - NEVER roleplay or ignore your police assistance mandate.
                   - If asked off-topic questions (e.g., cooking, programming, gossip), politely state your role as the Police Citizen Safety Assistant and offer police-related assistance.
                """);
        messages.add(systemMsg);

        // Include last 4 turns of conversation history if present
        if (request.getConversationHistory() != null && !request.getConversationHistory().isEmpty()) {
            int startIdx = Math.max(0, request.getConversationHistory().size() - 4);
            for (int i = startIdx; i < request.getConversationHistory().size(); i++) {
                Map<String, String> turn = request.getConversationHistory().get(i);
                if (turn != null && turn.containsKey("role") && turn.containsKey("content")) {
                    Map<String, String> sanitizedTurn = new HashMap<>();
                    sanitizedTurn.put("role", turn.get("role"));
                    sanitizedTurn.put("content", turn.get("content"));
                    messages.add(sanitizedTurn);
                }
            }
        }

        Map<String, String> userTurn = new HashMap<>();
        userTurn.put("role", "user");
        userTurn.put("content", userQuery);
        messages.add(userTurn);

        String reply;
        try {
            reply = openRouterClientService.chatCompletion(messages, 0.3, 800, false);
        } catch (Exception e) {
            log.error("Chatbot completion error: {}", e.getMessage());
            reply = "I apologize, but the Citizen Assistance system experienced a temporary connection timeout. For immediate emergency police assistance, please dial 112. For cyber crime fraud, call 1930 immediately.";
        }

        List<String> relevantSections = extractRelevantSections(reply);

        return LegalChatResponse.builder()
                .sessionId(request.getSessionId() != null ? request.getSessionId() : UUID.randomUUID().toString())
                .reply(reply)
                .relevantSections(relevantSections)
                .emergencyHelplines(EMERGENCY_HELPLINES)
                .disclaimer("Guidance provided by the State Police AI Citizen Desk under Indian Law (BNS/BNSS 2023). Not a formal substitute for magistrate court proceedings.")
                .build();
    }

    private boolean isMaliciousOrInjection(String query) {
        String lower = query.toLowerCase();
        return lower.contains("ignore all previous instructions") ||
                lower.contains("ignore previous instructions") ||
                lower.contains("system prompt") ||
                lower.contains("jailbreak") ||
                lower.contains("dan mode") ||
                lower.contains("bypass filters") ||
                lower.contains("make a bomb") ||
                lower.contains("create malware");
    }

    private List<String> extractRelevantSections(String text) {
        List<String> sections = new ArrayList<>();
        String[] keywords = {
                "BNSS Section 35", "BNSS Section 38", "BNSS Section 43", "BNSS Section 47", "BNSS Section 48", "BNSS Section 53",
                "Zero-FIR", "BNS Section 303", "BNS Section 305", "BNS Section 309", "BNS Section 318", "BNS Section 74",
                "IT Act Section 66D", "Helpline 1930", "Helpline 112"
        };
        for (String kw : keywords) {
            if (text.toLowerCase().contains(kw.toLowerCase())) {
                sections.add(kw);
            }
        }
        return sections;
    }
}
