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
public class ShoRejectRequest {

    @NotBlank(message = "Reason for rejecting complaint must be recorded under BNSS 2023")
    private String rejectionReason;
}
