package com.smartpolice.dto;

import com.smartpolice.entity.CaseDiary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseDiaryResponse {

    private Long id;
    private Long complaintId;
    private String crimeRegisterNumber;
    private Long ioId;
    private String ioName;
    private String ioBadgeNumber;
    private Integer entryNumber;
    private LocalDateTime entryTimestamp;
    private String investigationNotes;
    private String actionsTaken;
    private String witnessStatements;
    private String seizureDetails;
    private LocalDateTime createdAt;

    public static CaseDiaryResponse fromEntity(CaseDiary cd) {
        if (cd == null) return null;
        CaseDiaryResponseBuilder b = CaseDiaryResponse.builder()
                .id(cd.getId())
                .entryNumber(cd.getEntryNumber())
                .entryTimestamp(cd.getEntryTimestamp())
                .investigationNotes(cd.getInvestigationNotes())
                .actionsTaken(cd.getActionsTaken())
                .witnessStatements(cd.getWitnessStatements())
                .seizureDetails(cd.getSeizureDetails())
                .createdAt(cd.getCreatedAt());

        if (cd.getComplaint() != null) {
            b.complaintId(cd.getComplaint().getId());
            b.crimeRegisterNumber(cd.getComplaint().getCrimeRegisterNumber());
        }

        if (cd.getIo() != null) {
            b.ioId(cd.getIo().getId());
            b.ioName(cd.getIo().getFullName());
            b.ioBadgeNumber(cd.getIo().getBadgeNumber());
        }

        return b.build();
    }
}
