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
public class ZeroFirTransferRequest {

    @NotNull(message = "Destination police station ID is required")
    private Long targetStationId;

    private String transferReason;
}
