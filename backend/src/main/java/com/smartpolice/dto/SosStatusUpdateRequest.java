package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SosStatusUpdateRequest {

    @NotBlank(message = "Status update is required")
    private String status; // ACKNOWLEDGED, PATROL_DISPATCHED, RESOLVED, FALSE_ALARM

    private String dispatchedPatrolUnit; // e.g. "PCR-04 Connaught Place"

    private String notes;
}
