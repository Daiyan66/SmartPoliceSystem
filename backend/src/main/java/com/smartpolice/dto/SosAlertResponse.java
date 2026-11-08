package com.smartpolice.dto;

import com.smartpolice.entity.SosAlert;
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
public class SosAlertResponse {

    private Long id;
    private String alertToken;
    private Long senderId;
    private String senderName;
    private String phoneNumber;
    private Double latitude;
    private Double longitude;

    private Long assignedStationId;
    private String assignedStationName;
    private String assignedStationCode;
    private String assignedStationContact;
    private Double distanceKm;

    private String status;
    private String dispatchedPatrolUnit;
    private String notes;

    private Integer activeOfficersInZone;
    private List<String> alertedOfficerRanks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SosAlertResponse fromEntity(SosAlert alert, Double distKm, int officersCount, List<String> ranks) {
        if (alert == null) return null;
        SosAlertResponseBuilder b = SosAlertResponse.builder()
                .id(alert.getId())
                .alertToken(alert.getAlertToken())
                .phoneNumber(alert.getPhoneNumber())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .status(alert.getStatus())
                .dispatchedPatrolUnit(alert.getDispatchedPatrolUnit())
                .notes(alert.getNotes())
                .distanceKm(distKm != null ? Math.round(distKm * 100.0) / 100.0 : null)
                .activeOfficersInZone(officersCount)
                .alertedOfficerRanks(ranks)
                .createdAt(alert.getCreatedAt())
                .updatedAt(alert.getUpdatedAt());

        if (alert.getSender() != null) {
            b.senderId(alert.getSender().getId());
            b.senderName(alert.getSender().getFullName());
            if (alert.getPhoneNumber() == null) {
                b.phoneNumber(alert.getSender().getPhoneNumber());
            }
        }

        if (alert.getAssignedStation() != null) {
            b.assignedStationId(alert.getAssignedStation().getId());
            b.assignedStationName(alert.getAssignedStation().getStationName());
            b.assignedStationCode(alert.getAssignedStation().getStationCode());
            b.assignedStationContact(alert.getAssignedStation().getContactNumber());
        }

        return b.build();
    }
}
