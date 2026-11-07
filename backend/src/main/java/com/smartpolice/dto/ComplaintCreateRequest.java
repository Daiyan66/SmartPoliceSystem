package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintCreateRequest {

    @NotBlank(message = "Incident description is required")
    private String description;

    @NotBlank(message = "Incident location is required")
    private String incidentLocation;

    @NotNull(message = "Latitude coordinate is required")
    private Double latitude;

    @NotNull(message = "Longitude coordinate is required")
    private Double longitude;

    private LocalDateTime incidentTimestamp;

    private Long stationId;

    @Builder.Default
    private Boolean isZeroFir = false;

    private String bnsSections;

    private String aiPredictedCategory;

    private Double aiConfidenceScore;

    private String citizenPhone;

    private String citizenName;
}
