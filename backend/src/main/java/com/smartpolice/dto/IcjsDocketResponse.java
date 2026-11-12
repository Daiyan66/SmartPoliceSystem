package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IcjsDocketResponse {

    private Long complaintId;
    private String trackingToken;
    private String crimeRegisterNumber;
    private String status;
    private String stationName;
    private String stationDistrict;
    private String stationState;

    // 1. CCTNS National Core
    private String cctnsNationalFirId;
    private String cctnsSyncStatus;
    private LocalDateTime cctnsSyncTimestamp;
    private String cctnsCoreHash;
    private String stateDataCenter;

    // 2. e-Courts Interoperability
    private String cnrNumber;
    private String courtName;
    private String judicialOfficer;
    private LocalDateTime hearingDate;
    private String courtStage;
    private String eSummonsStatus;

    // 3. e-Prosecution
    private String prosecutorName;
    private String prosecutionAgency;
    private String scrutinyStatus;
    private LocalDateTime scrutinyDate;

    // 4. e-Forensics (FSL Madiwala)
    private String fslToken;
    private String fslLaboratory;
    private String forensicReportStatus;
    private String evidenceSha256;
    private String bsa65BCertificateStatus;

    // 5. e-Prisons
    private String prisonFacility;
    private String undertrialRemandNumber;
    private String remandStatus;

    private String legalFramework;
}
