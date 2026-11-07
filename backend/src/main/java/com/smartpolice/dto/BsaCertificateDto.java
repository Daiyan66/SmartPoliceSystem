package com.smartpolice.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BsaCertificateDto {
    private String certificateNumber;
    private LocalDateTime issuedAt;
    private String legalAct; // "Bharatiya Sakshya Adhiniyam, 2023 (Section 63 & 65B)"
    private Long evidenceId;
    private String fileName;
    private Long fileSizeBytes;
    private String mimeType;
    private String sha256Hash;
    private Boolean isExifScrubbedForPrivacy;
    
    // Case details
    private Long complaintId;
    private String trackingToken;
    private String crimeRegisterNumber;
    private String stationName;
    
    // Custody & Verification
    private String certifyingOfficerName;
    private String certifyingOfficerBadge;
    private String certifyingOfficerRank;
    private String statutoryDeclaration;
    private List<EvidenceAuditTrailDto> chainOfCustodyLog;
}
