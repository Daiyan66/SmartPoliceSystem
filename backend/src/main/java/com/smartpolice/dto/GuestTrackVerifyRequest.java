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
public class GuestTrackVerifyRequest {

    @NotBlank(message = "Tracking token is required")
    private String trackingToken;

    @NotBlank(message = "Registered mobile number is required")
    private String phoneNumber;

    @NotBlank(message = "6-digit OTP verification code is required")
    private String otp;
}
