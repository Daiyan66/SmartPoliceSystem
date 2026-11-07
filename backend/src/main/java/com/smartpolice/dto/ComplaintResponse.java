package com.smartpolice.dto;

import com.smartpolice.entity.Complaint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {

    private Long id;
    private String trackingToken;
    private String crimeRegisterNumber;
    private Long citizenId;
    private String citizenName;
    private String citizenPhone;
    private Long stationId;
    private String stationCode;
    private String stationName;
    private String stationDistrict;
    private String stationState;
    private LocalDateTime incidentTimestamp;
    private String incidentLocation;
    private Double latitude;
    private Double longitude;
    private String description;
    private String bnsSections;
    private String aiPredictedCategory;
    private Double aiConfidenceScore;
    private String status;
    private String rejectionReason;
    private Boolean isZeroFir;
    private Long assignedIoId;
    private String assignedIoName;
    private String assignedIoBadge;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ComplaintResponse fromEntity(Complaint c) {
        if (c == null) return null;
        ComplaintResponseBuilder builder = ComplaintResponse.builder()
                .id(c.getId())
                .trackingToken(c.getTrackingToken())
                .crimeRegisterNumber(c.getCrimeRegisterNumber())
                .incidentTimestamp(c.getIncidentTimestamp())
                .incidentLocation(c.getIncidentLocation())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .description(c.getDescription())
                .bnsSections(c.getBnsSections())
                .aiPredictedCategory(c.getAiPredictedCategory())
                .aiConfidenceScore(c.getAiConfidenceScore())
                .status(c.getStatus())
                .rejectionReason(c.getRejectionReason())
                .isZeroFir(c.getIsZeroFir())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt());

        if (c.getCitizen() != null) {
            builder.citizenId(c.getCitizen().getId());
            builder.citizenName(c.getCitizen().getFullName());
            builder.citizenPhone(c.getCitizen().getPhoneNumber());
        }

        if (c.getStation() != null) {
            builder.stationId(c.getStation().getId());
            builder.stationCode(c.getStation().getStationCode());
            builder.stationName(c.getStation().getStationName());
            builder.stationDistrict(c.getStation().getDistrict());
            builder.stationState(c.getStation().getState());
        }

        if (c.getAssignedIo() != null) {
            builder.assignedIoId(c.getAssignedIo().getId());
            builder.assignedIoName(c.getAssignedIo().getFullName());
            builder.assignedIoBadge(c.getAssignedIo().getBadgeNumber());
        }

        return builder.build();
    }
}
