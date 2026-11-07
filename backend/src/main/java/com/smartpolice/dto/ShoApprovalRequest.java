package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShoApprovalRequest {
    private String crimeRegisterNumber;
    private Long assignedIoId;
    private String notes;
}
