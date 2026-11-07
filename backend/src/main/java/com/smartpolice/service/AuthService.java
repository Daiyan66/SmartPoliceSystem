package com.smartpolice.service;

import com.smartpolice.dto.*;
import com.smartpolice.entity.RefreshToken;
import com.smartpolice.entity.User;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.JwtUtils;
import com.smartpolice.security.Role;
import com.smartpolice.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse registerCitizen(CitizenSignupRequest request) {
        // Zero-Trust Security Check: Reject privilege escalation attempts
        if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
            String requestedRole = request.getRole().trim().toUpperCase();
            if (!"ROLE_CITIZEN".equals(requestedRole) && !"CITIZEN".equals(requestedRole)) {
                throw new IllegalArgumentException("Privilege escalation violation: Public registration cannot assign administrative or officer roles (" + request.getRole() + ").");
            }
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number is already registered: " + request.getPhoneNumber());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() &&
                userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email address is already in use: " + request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_CITIZEN) // Strictly forced to ROLE_CITIZEN
                .isActive(true)
                .forcePasswordChange(false)
                .build();

        User savedUser = userRepository.save(user);

        UserPrincipal principal = UserPrincipal.build(savedUser);
        String accessToken = jwtUtils.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresInMs(jwtUtils.getJwtExpirationMs())
                .userId(savedUser.getId())
                .fullName(savedUser.getFullName())
                .phoneNumber(savedUser.getPhoneNumber())
                .email(savedUser.getEmail())
                .role(savedUser.getRole())
                .forcePasswordChange(false)
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getIdentifier().trim(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BadCredentialsException("Invalid credentials. Please verify your phone/badge number and password.");
        }

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new IllegalStateException("Account is inactive or suspended. Please contact police administration.");
        }

        String accessToken = jwtUtils.generateAccessToken(principal);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresInMs(jwtUtils.getJwtExpirationMs())
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .badgeNumber(user.getBadgeNumber())
                .role(user.getRole())
                .stationId(user.getStation() != null ? user.getStation().getId() : null)
                .stationName(user.getStation() != null ? user.getStation().getStationName() : null)
                .rankDesignation(user.getRankDesignation())
                .forcePasswordChange(user.getForcePasswordChange())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(TokenRefreshRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    UserPrincipal principal = UserPrincipal.build(user);
                    String newAccessToken = jwtUtils.generateAccessToken(principal);
                    // Rotate refresh token
                    RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

                    return AuthResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(newRefreshToken.getToken())
                            .tokenType("Bearer")
                            .expiresInMs(jwtUtils.getJwtExpirationMs())
                            .userId(user.getId())
                            .fullName(user.getFullName())
                            .phoneNumber(user.getPhoneNumber())
                            .email(user.getEmail())
                            .badgeNumber(user.getBadgeNumber())
                            .role(user.getRole())
                            .stationId(user.getStation() != null ? user.getStation().getId() : null)
                            .stationName(user.getStation() != null ? user.getStation().getStationName() : null)
                            .rankDesignation(user.getRankDesignation())
                            .forcePasswordChange(user.getForcePasswordChange())
                            .build();
                })
                .orElseThrow(() -> new IllegalArgumentException("Invalid or revoked refresh token"));
    }
}
