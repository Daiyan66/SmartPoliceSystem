package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintAnalysisRequest {

    @NotBlank(message = "Complaint narrative text is required")
    @Size(min = 5, max = 20000, message = "Complaint text must be between 5 and 20,000 characters")
    private String complaintText;

    private String incidentLocation;

    private String incidentTimestamp;
}
