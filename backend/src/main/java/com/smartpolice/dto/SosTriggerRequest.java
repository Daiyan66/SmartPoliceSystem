package com.smartpolice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosTriggerRequest {

    @NotNull(message = "Latitude coordinate is required for emergency dispatch")
    private Double latitude;

    @NotNull(message = "Longitude coordinate is required for emergency dispatch")
    private Double longitude;

    private String phoneNumber;

    private String notes;

    private String deviceFingerprint;
}
