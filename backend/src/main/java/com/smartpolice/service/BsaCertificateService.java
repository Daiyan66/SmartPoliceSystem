package com.smartpolice.service;

import com.smartpolice.dto.BsaCertificateDto;
import com.smartpolice.dto.EvidenceAuditTrailDto;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.EvidenceAttachment;
import com.smartpolice.entity.EvidenceAuditTrail;
import com.smartpolice.entity.User;
import com.smartpolice.repository.EvidenceAttachmentRepository;
import com.smartpolice.repository.EvidenceAuditTrailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BsaCertificateService {

    private final EvidenceAttachmentRepository evidenceAttachmentRepository;
    private final EvidenceAuditTrailRepository evidenceAuditTrailRepository;
    private final EvidenceStorageService evidenceStorageService;

    @Transactional
    public BsaCertificateDto generateCertificate(Long evidenceId, User certifyingOfficer, String clientIp, String userAgent) {
        EvidenceAttachment evidence = evidenceAttachmentRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found with ID: " + evidenceId));

        Complaint complaint = evidence.getComplaint();

        // Log certificate generation in chain of custody audit trail
        evidenceStorageService.logAudit(evidence, certifyingOfficer, "FORENSIC_EXPORT_BSA_CERT", clientIp, userAgent);

        List<EvidenceAuditTrail> rawLogs = evidenceAuditTrailRepository.findByEvidenceIdOrderByTimestampDesc(evidenceId);
        List<EvidenceAuditTrailDto> auditLogs = rawLogs.stream().map(log ->
                EvidenceAuditTrailDto.builder()
                        .id(log.getId())
                        .actionType(log.getActionType())
                        .accessedBy(log.getAccessedByUser() != null ? log.getAccessedByUser().getFullName() : "System / Anonymous")
                        .badgeNumber(log.getAccessedByUser() != null ? log.getAccessedByUser().getBadgeNumber() : "N/A")
                        .ipAddress(log.getIpAddress())
                        .timestamp(log.getTimestamp())
                        .build()
        ).toList();

        int currentYear = Year.now().getValue();
        String certNum = String.format("BSA-CERT-%d-%06d", currentYear, evidence.getId());

        String officerName = certifyingOfficer != null ? certifyingOfficer.getFullName() : "State Police Digital Forensic Desk";
        String officerBadge = certifyingOfficer != null ? certifyingOfficer.getBadgeNumber() : "SYSTEM-IO-001";
        String officerRank = certifyingOfficer != null && certifyingOfficer.getRankDesignation() != null ?
                certifyingOfficer.getRankDesignation() : "Forensic Investigating Officer";

        String stationName = complaint != null && complaint.getStation() != null ?
                complaint.getStation().getStationName() : "State Cyber & Forensic Cell";

        String declaration = String.format(
                "CERTIFICATE UNDER SECTION 63 & SECTION 65B OF THE BHARATIYA SAKSHYA ADHINIYAM (BSA, 2023)\n" +
                "I, %s (Badge: %s), holding the rank of %s at %s, do hereby certify that:\n" +
                "1. The electronic record titled '%s' (MIME: %s, Size: %d bytes) is stored securely under digital custody.\n" +
                "2. The cryptographic SHA-256 checksum fingerprint of this digital evidence is: %s.\n" +
                "3. Throughout the material period, the electronic computing devices were operating properly, and the cryptographic integrity remained uncompromised.\n" +
                "4. This certificate is produced in compliance with Section 63/65B of BSA (2023) for judicial admissibility before the Hon'ble Court of Law.",
                officerName, officerBadge, officerRank, stationName,
                evidence.getFileName(), evidence.getMimeType(), evidence.getFileSizeBytes(), evidence.getSha256Hash()
        );

        return BsaCertificateDto.builder()
                .certificateNumber(certNum)
                .issuedAt(LocalDateTime.now())
                .legalAct("Bharatiya Sakshya Adhiniyam, 2023 (Section 63 & 65B)")
                .evidenceId(evidence.getId())
                .fileName(evidence.getFileName())
                .fileSizeBytes(evidence.getFileSizeBytes())
                .mimeType(evidence.getMimeType())
                .sha256Hash(evidence.getSha256Hash())
                .isExifScrubbedForPrivacy(evidence.getIsExifStripped())
                .complaintId(complaint != null ? complaint.getId() : null)
                .trackingToken(complaint != null ? complaint.getTrackingToken() : "N/A")
                .crimeRegisterNumber(complaint != null ? complaint.getCrimeRegisterNumber() : "PENDING_FIR")
                .stationName(stationName)
                .certifyingOfficerName(officerName)
                .certifyingOfficerBadge(officerBadge)
                .certifyingOfficerRank(officerRank)
                .statutoryDeclaration(declaration)
                .chainOfCustodyLog(auditLogs)
                .build();
    }
}
