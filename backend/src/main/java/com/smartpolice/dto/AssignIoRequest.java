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
public class AssignIoRequest {

    @NotNull(message = "Investigating Officer ID is required")
    private Long ioId;

    private String instructions;
}
