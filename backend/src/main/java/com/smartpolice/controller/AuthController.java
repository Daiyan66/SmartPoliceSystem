package com.smartpolice.controller;

import com.smartpolice.dto.*;
import com.smartpolice.entity.User;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.UserPrincipal;
import com.smartpolice.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/citizen-signup")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCitizen(
            @Valid @RequestBody CitizenSignupRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.registerCitizen(request);
        setTokenCookie(response, authResponse.getAccessToken());

        return ResponseEntity.ok(ApiResponse.ok("Citizen registered successfully. Welcome to the Smart Police Portal.", authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.login(request);
        setTokenCookie(response, authResponse.getAccessToken());

        return ResponseEntity.ok(ApiResponse.ok("Login successful", authResponse));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody TokenRefreshRequest request,
            HttpServletResponse response) {

        AuthResponse authResponse = authService.refreshToken(request);
        setTokenCookie(response, authResponse.getAccessToken());

        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    private void setTokenCookie(HttpServletResponse response, String accessToken) {
        Cookie cookie = new Cookie("jwt_access_token", accessToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production with HTTPS
        cookie.setPath("/");
        cookie.setMaxAge(15 * 60); // 15 mins
        response.addCookie(cookie);
    }
}
