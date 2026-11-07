package com.smartpolice.dto;

import com.smartpolice.security.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresInMs;

    private Long userId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private String badgeNumber;
    private Role role;
    private Long stationId;
    private String stationName;
    private String rankDesignation;
    private Boolean forcePasswordChange;
}
