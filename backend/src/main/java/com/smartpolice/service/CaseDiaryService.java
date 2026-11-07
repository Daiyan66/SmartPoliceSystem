package com.smartpolice.service;

import com.smartpolice.dto.CaseDiaryEntryRequest;
import com.smartpolice.dto.CaseDiaryResponse;
import com.smartpolice.dto.ChargesheetDto;
import com.smartpolice.dto.EvidenceDetailResponse;
import com.smartpolice.entity.CaseDiary;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.EvidenceAttachment;
import com.smartpolice.entity.User;
import com.smartpolice.repository.CaseDiaryRepository;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.EvidenceAttachmentRepository;
import com.smartpolice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CaseDiaryService {

    private static final Logger log = LoggerFactory.getLogger(CaseDiaryService.class);

    private final CaseDiaryRepository caseDiaryRepository;
    private final ComplaintRepository complaintRepository;
    private final EvidenceAttachmentRepository evidenceAttachmentRepository;
    private final UserRepository userRepository;

    /**
     * Add a chronological Case Diary (CD) entry under BNSS 2023 / CCTNS standards
     */
    @Transactional
    public CaseDiaryResponse addCaseDiaryEntry(Long complaintId, CaseDiaryEntryRequest req, User ioUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        int nextEntryNum = (int) (caseDiaryRepository.countByComplaintId(complaintId) + 1);

        LocalDateTime entryTime = req.getEntryTimestamp() != null ? req.getEntryTimestamp() : LocalDateTime.now();

        CaseDiary cd = CaseDiary.builder()
                .complaint(complaint)
                .io(ioUser)
                .entryNumber(nextEntryNum)
                .entryTimestamp(entryTime)
                .investigationNotes(req.getInvestigationNotes())
                .actionsTaken(req.getActionsTaken())
                .witnessStatements(req.getWitnessStatements())
                .seizureDetails(req.getSeizureDetails())
                .build();

        CaseDiary saved = caseDiaryRepository.save(cd);

        // Ensure complaint status reflects active investigation
        if (!"CHARGESHEET_FILED".equals(complaint.getStatus()) && !"RESOLVED".equals(complaint.getStatus())) {
            complaint.setStatus("INVESTIGATION_IN_PROGRESS");
            complaintRepository.save(complaint);
        }

        log.info("Recorded Case Diary Entry #{} for Complaint [{}] (CRN: {}) by IO [{}]",
                nextEntryNum, complaintId, complaint.getCrimeRegisterNumber(), ioUser.getFullName());

        return CaseDiaryResponse.fromEntity(saved);
    }

    /**
     * Retrieve all chronological Case Diary entries for a case
     */
    public List<CaseDiaryResponse> getCaseDiaries(Long complaintId) {
        return caseDiaryRepository.findByComplaintIdOrderByEntryNumberAsc(complaintId)
                .stream()
                .map(CaseDiaryResponse::fromEntity)
                .toList();
    }

    /**
     * Compile Draft Final Report / Chargesheet (Form 5 U/S 193 BNSS 2023)
     */
    public ChargesheetDto generateChargesheet(Long complaintId) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        List<CaseDiary> diaryEntries = caseDiaryRepository.findByComplaintIdOrderByEntryNumberAsc(complaintId);
        List<EvidenceAttachment> evidences = evidenceAttachmentRepository.findByComplaintId(complaintId);

        List<EvidenceDetailResponse> digitalEvidences = evidences.stream()
                .map(e -> EvidenceDetailResponse.builder()
                        .evidence(e)
                        .bsaCertificateUrl("/api/evidence/" + e.getId() + "/bsa-certificate")
                        .build())
                .toList();

        List<CaseDiaryResponse> cdResponses = diaryEntries.stream()
                .map(CaseDiaryResponse::fromEntity)
                .toList();

        // Extract witness statements & physical seizures from case diaries
        List<String> witnesses = new ArrayList<>();
        List<String> seizures = new ArrayList<>();

        for (CaseDiary cd : diaryEntries) {
            if (cd.getWitnessStatements() != null && !cd.getWitnessStatements().isBlank()) {
                witnesses.add(String.format("Entry #%d: %s", cd.getEntryNumber(), cd.getWitnessStatements()));
            }
            if (cd.getSeizureDetails() != null && !cd.getSeizureDetails().isBlank()) {
                seizures.add(String.format("Entry #%d: %s", cd.getEntryNumber(), cd.getSeizureDetails()));
            }
        }

        User io = complaint.getAssignedIo();
        String ioName = io != null ? io.getFullName() : "Investigation Officer";
        String ioBadge = io != null ? io.getBadgeNumber() : "POL-IO";
        String ioRank = io != null ? io.getRankDesignation() : "Sub-Inspector";

        String stationName = complaint.getStation() != null ? complaint.getStation().getStationName() : "Jurisdictional Police Station";
        String stationCode = complaint.getStation() != null ? complaint.getStation().getStationCode() : "N/A";
        String district = complaint.getStation() != null ? complaint.getStation().getDistrict() : "District";
        String state = complaint.getStation() != null ? complaint.getStation().getState() : "State";

        String complainantName = complaint.getCitizen() != null ? complaint.getCitizen().getFullName() : "Informant / Complainant";
        String complainantPhone = complaint.getCitizen() != null ? complaint.getCitizen().getPhoneNumber() : "Confidential";

        String sections = complaint.getBnsSections() != null ? complaint.getBnsSections() : "BNS 2023 Cognizable Sections";

        String briefFacts = String.format("On %s, an e-FIR was registered under tracking token %s regarding: %s",
                complaint.getCreatedAt(), complaint.getTrackingToken(), complaint.getDescription());

        String findings = String.format(
                "During comprehensive investigation under BNSS 2023, %d Case Diary entries were chronologically recorded. " +
                "%d digital evidence artifacts were cryptographically verified with SHA-256 integrity under Section 63/65B BSA. " +
                "Sufficient prima facie evidence stands established implicating the accused under %s.",
                diaryEntries.size(), digitalEvidences.size(), sections
        );

        String prayer = String.format(
                "It is respectfully prayed before the Learned Judicial Magistrate that cognizance of the offences punishable under %s " +
                "may graciously be taken, and process may be issued against the accused persons in the interest of justice.",
                sections
        );

        return ChargesheetDto.builder()
                .formNumber("FORM 5 / FINAL REPORT (U/S 193 BNSS 2023 / CCTNS ALIGNED)")
                .state(state)
                .district(district)
                .policeStation(stationName)
                .stationCode(stationCode)
                .crimeRegisterNumber(complaint.getCrimeRegisterNumber() != null ? complaint.getCrimeRegisterNumber() : "CRN-PENDING")
                .trackingToken(complaint.getTrackingToken())
                .firDate(complaint.getCreatedAt())
                .chargesheetDate(LocalDateTime.now())
                .complainantName(complainantName)
                .complainantPhone(complainantPhone)
                .incidentLocation(complaint.getIncidentLocation())
                .incidentDate(complaint.getIncidentTimestamp())
                .bnsSectionsCharged(sections)
                .crimeCategory(complaint.getAiPredictedCategory() != null ? complaint.getAiPredictedCategory() : "COGNIZABLE_CRIME")
                .ioName(ioName)
                .ioBadgeNumber(ioBadge)
                .ioRank(ioRank)
                .totalCaseDiaryEntries(diaryEntries.size())
                .caseDiarySummaries(cdResponses)
                .witnessesExamined(witnesses)
                .digitalEvidenceAttachments(digitalEvidences)
                .physicalSeizures(seizures)
                .briefFacts(briefFacts)
                .investigationFindings(findings)
                .magistrateCourtPrayer(prayer)
                .status(complaint.getStatus())
                .build();
    }

    /**
     * Formally submit Final Report / Chargesheet to Magistrate Court
     */
    @Transactional
    public ChargesheetDto submitChargesheet(Long complaintId, User ioUser) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        complaint.setStatus("CHARGESHEET_FILED");
        complaintRepository.save(complaint);

        log.info("Chargesheet formally submitted for Complaint [{}] (CRN: {}) by IO [{}]",
                complaintId, complaint.getCrimeRegisterNumber(), ioUser.getFullName());

        return generateChargesheet(complaintId);
    }
}
