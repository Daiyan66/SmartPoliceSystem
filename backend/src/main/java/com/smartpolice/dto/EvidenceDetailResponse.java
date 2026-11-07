package com.smartpolice.dto;

import com.smartpolice.entity.EvidenceAttachment;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceDetailResponse {
    private EvidenceAttachment evidence;
    private List<EvidenceAuditTrailDto> auditTrail;
    private String bsaCertificateUrl;
}
