package com.smartpolice.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpolice.dto.BnsSectionDto;
import com.smartpolice.dto.ComplaintAnalysisRequest;
import com.smartpolice.dto.ComplaintAnalysisResult;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ComplaintAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(ComplaintAnalysisService.class);

    private final OpenRouterClientService openRouterClientService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final List<BnsSectionDto> BNS_CATALOG = List.of(
            BnsSectionDto.builder().section("BNS 303(2)").title("Theft").description("Theft of movable property without consent").ipcEquivalent("IPC 379").cognizable(true).bailable(false).severity(3).category("Property Crime").build(),
            BnsSectionDto.builder().section("BNS 305").title("Theft in dwelling house or vehicle").description("Aggravated theft inside premises or vehicles").ipcEquivalent("IPC 380").cognizable(true).bailable(false).severity(4).category("Property Crime").build(),
            BnsSectionDto.builder().section("BNS 309").title("Robbery").description("Theft accompanied by hurt or threat of instant death/hurt").ipcEquivalent("IPC 390/392").cognizable(true).bailable(false).severity(5).category("Violent Crime").build(),
            BnsSectionDto.builder().section("BNS 316").title("Criminal Breach of Trust").description("Misappropriation of entrusted movable/immovable assets").ipcEquivalent("IPC 405/406").cognizable(true).bailable(false).severity(3).category("Financial Crime").build(),
            BnsSectionDto.builder().section("BNS 318(4)").title("Cheating and Dishonestly Inducing Delivery").description("Fraudulent deception, online cyber fraud").ipcEquivalent("IPC 420").cognizable(true).bailable(false).severity(4).category("Cyber / Financial Fraud").build(),
            BnsSectionDto.builder().section("BNS 74").title("Outraging Modesty of Woman").description("Assault or criminal force to woman with intent to outrage modesty").ipcEquivalent("IPC 354").cognizable(true).bailable(false).severity(5).category("Crimes Against Women").build(),
            BnsSectionDto.builder().section("BNS 75").title("Sexual Harassment").description("Unwelcome physical contact, sexually colored remarks, stalker behavior").ipcEquivalent("IPC 354A").cognizable(true).bailable(true).severity(3).category("Crimes Against Women").build(),
            BnsSectionDto.builder().section("BNS 85").title("Cruelty by Husband or Relatives").description("Matrimonial cruelty and dowry harassment").ipcEquivalent("IPC 498A").cognizable(true).bailable(false).severity(4).category("Domestic Violence").build(),
            BnsSectionDto.builder().section("BNS 115(2)").title("Voluntarily Causing Hurt").description("Inflicting bodily pain or injury without deadly weapon").ipcEquivalent("IPC 323").cognizable(false).bailable(true).severity(2).category("Violent Crime").build(),
            BnsSectionDto.builder().section("BNS 117").title("Voluntarily Causing Grievous Hurt").description("Fractures, permanent disfiguration, serious bodily injuries").ipcEquivalent("IPC 325").cognizable(true).bailable(true).severity(4).category("Violent Crime").build(),
            BnsSectionDto.builder().section("BNS 103(1)").title("Murder").description("Culpable homicide amounting to murder").ipcEquivalent("IPC 302").cognizable(true).bailable(false).severity(5).category("Homicide").build(),
            BnsSectionDto.builder().section("BNS 137(2)").title("Kidnapping").description("Kidnapping from lawful guardianship").ipcEquivalent("IPC 363").cognizable(true).bailable(false).severity(5).category("Crimes Against Children / Person").build(),
            BnsSectionDto.builder().section("IT Act Sec 66D").title("Cyber Fraud by Personation").description("Cheating by personation using computer resource or mobile phone").ipcEquivalent("IT Act 2000").cognizable(true).bailable(true).severity(4).category("Cyber Crime").build()
    );

    public List<BnsSectionDto> getBnsCatalog() {
        return BNS_CATALOG;
    }

    public ComplaintAnalysisResult analyzeComplaint(ComplaintAnalysisRequest request) {
        String complaintText = request.getComplaintText();
        log.info("Analyzing complaint narrative (length: {} chars)...", complaintText.length());

        List<Map<String, String>> messages = new ArrayList<>();

        Map<String, String> systemMsg = new HashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", """
                You are the Expert Law Enforcement Legal Classifier for the Indian Police Department and CCTNS.
                Your task is to analyze raw citizen complaint narratives submitted in ANY Indian language or dialect (English, Hindi, Hinglish, Marathi, Tamil, Bengali, Telugu, Kannada, Gujarati, Punjabi, etc.).
                
                You must map the incident strictly under the new Indian criminal law framework:
                - Bharatiya Nyaya Sanhita (BNS, 2023)
                - Information Technology Act (IT Act 2000)
                - POCSO Act (if minor is involved)
                
                You MUST return a valid JSON object matching the following structure:
                {
                  "primaryCategory": "Theft | Cyber Fraud | Violent Crime | Crimes Against Women | Domestic Violence | Financial Crime | Missing Person | Miscellaneous",
                  "bnsSections": ["BNS 303(2)", "BNS 305"],
                  "severityScore": 1 to 5 (5 being most critical like homicide/rape/kidnapping, 1 being minor lost item),
                  "isCognizable": true or false,
                  "suggestedPriority": "CRITICAL" | "HIGH" | "MEDIUM" | "NORMAL",
                  "detectedLanguage": "Hindi | English | Hinglish | Marathi | etc.",
                  "translatedEnglishSummary": "A clean, concise 2-4 sentence formal English summary suitable for police FIR register.",
                  "incidentDate": "Extracted date or 'Unknown'",
                  "location": "Extracted location or 'Unknown'",
                  "suspectDescription": "Physical description, vehicle number, or phone numbers of suspects, or 'Unknown'",
                  "stolenProperty": "List of stolen items or monetary loss amount, or 'None'"
                }
                
                Return JSON ONLY. Do not include markdown code block backticks.
                """);
        messages.add(systemMsg);

        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", "Complaint narrative:\n" + complaintText +
                (request.getIncidentLocation() != null ? "\nReported location: " + request.getIncidentLocation() : ""));
        messages.add(userMsg);

        try {
            String rawJson = openRouterClientService.chatCompletion(messages, 0.1, 1000, true);
            log.info("Received raw AI classification response from OpenRouter: {}", rawJson);

            // Clean any accidental markdown backticks
            String cleaned = rawJson.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            }
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode node = objectMapper.readTree(cleaned);

            List<String> sections = new ArrayList<>();
            if (node.has("bnsSections") && node.get("bnsSections").isArray()) {
                node.get("bnsSections").forEach(s -> sections.add(s.asText()));
            }

            return ComplaintAnalysisResult.builder()
                    .primaryCategory(node.path("primaryCategory").asText("General Complaint"))
                    .bnsSections(sections)
                    .severityScore(node.path("severityScore").asInt(3))
                    .isCognizable(node.path("isCognizable").asBoolean(true))
                    .suggestedPriority(node.path("suggestedPriority").asText("HIGH"))
                    .detectedLanguage(node.path("detectedLanguage").asText("English"))
                    .translatedEnglishSummary(node.path("translatedEnglishSummary").asText(complaintText))
                    .incidentDate(node.path("incidentDate").asText(null))
                    .location(node.path("location").asText(request.getIncidentLocation()))
                    .suspectDescription(node.path("suspectDescription").asText(null))
                    .stolenProperty(node.path("stolenProperty").asText(null))
                    .build();

        } catch (Exception e) {
            log.warn("OpenRouter automated parsing failed, invoking intelligent local heuristic fallback: {}", e.getMessage());
            return fallbackHeuristicAnalysis(complaintText, request.getIncidentLocation());
        }
    }

    private ComplaintAnalysisResult fallbackHeuristicAnalysis(String text, String location) {
        String lower = text.toLowerCase();
        List<String> sections = new ArrayList<>();
        String category;
        int severity;
        String priority;

        if (lower.contains("mobile") || lower.contains("phone") || lower.contains("chori") || lower.contains("theft") || lower.contains("stolen") || lower.contains("chhin")) {
            category = "Theft / Snatching";
            sections.add("BNS 303(2)");
            severity = 3;
            priority = "MEDIUM";
        } else if (lower.contains("otp") || lower.contains("bank") || lower.contains("cyber") || lower.contains("cheating") || lower.contains("fraud") || lower.contains("dhoka")) {
            category = "Cyber / Financial Fraud";
            sections.add("BNS 318(4)");
            sections.add("IT Act Sec 66D");
            severity = 4;
            priority = "HIGH";
        } else if (lower.contains("maar") || lower.contains("beat") || lower.contains("attack") || lower.contains("khoon") || lower.contains("assault") || lower.contains("hurt")) {
            category = "Violent Crime";
            sections.add("BNS 115(2)");
            severity = 4;
            priority = "HIGH";
        } else {
            category = "General Police Assistance";
            sections.add("BNS 303(2)");
            severity = 2;
            priority = "NORMAL";
        }

        return ComplaintAnalysisResult.builder()
                .primaryCategory(category)
                .bnsSections(sections)
                .severityScore(severity)
                .isCognizable(true)
                .suggestedPriority(priority)
                .detectedLanguage("Detected (Bilingual)")
                .translatedEnglishSummary("Incident logged: " + text)
                .location(location)
                .build();
    }
}
