package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargesheetDto {

    private String formNumber; // e.g. "FORM 5 / FINAL REPORT (U/S 193 BNSS 2023)"
    private String state;
    private String district;
    private String policeStation;
    private String stationCode;

    private String crimeRegisterNumber;
    private String trackingToken;
    private LocalDateTime firDate;
    private LocalDateTime chargesheetDate;

    // Complainant / Informant
    private String complainantName;
    private String complainantPhone;
    private String incidentLocation;
    private LocalDateTime incidentDate;

    // Legal Classification
    private String bnsSectionsCharged;
    private String crimeCategory;

    // Investigating Officer details
    private String ioName;
    private String ioBadgeNumber;
    private String ioRank;

    // Chronology of Investigation & Case Diaries
    private Integer totalCaseDiaryEntries;
    private List<CaseDiaryResponse> caseDiarySummaries;

    // Witness details (BNSS Sec 180)
    private List<String> witnessesExamined;

    // Seizure Memos & Evidence (BSA Sec 63/65B)
    private List<EvidenceDetailResponse> digitalEvidenceAttachments;
    private List<String> physicalSeizures;

    // Conclusion & Magistrate Prayer
    private String briefFacts;
    private String investigationFindings;
    private String magistrateCourtPrayer;
    private String status;
}
