package com.smartpolice.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceAuditTrailDto {
    private Long id;
    private String actionType; // VIEWED, DOWNLOADED, TRANSFERRED, FORENSIC_EXPORT
    private String accessedBy;
    private String badgeNumber;
    private String ipAddress;
    private LocalDateTime timestamp;
}
