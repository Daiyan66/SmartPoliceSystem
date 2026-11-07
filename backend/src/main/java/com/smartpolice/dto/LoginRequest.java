package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Identifier (Phone number, Badge number, or Email) is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;
}
