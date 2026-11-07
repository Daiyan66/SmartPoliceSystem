package com.smartpolice.dto;

import com.smartpolice.security.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerProvisionRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Official phone number is required")
    @Pattern(regexp = "^(\\+91)?[6-9]\\d{9}$", message = "Valid 10-digit Indian mobile number required")
    private String phoneNumber;

    private String email;

    @NotNull(message = "Officer role is required")
    private Role role;

    @NotNull(message = "Station ID is required for police personnel")
    private Long stationId;

    private String rankDesignation;

    private String badgeNumber; // If null, auto-generated

    private String temporaryPassword; // If null, auto-generated
}
