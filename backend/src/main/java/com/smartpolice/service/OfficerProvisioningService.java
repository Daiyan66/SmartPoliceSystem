package com.smartpolice.service;

import com.smartpolice.dto.OfficerProvisionRequest;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Year;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OfficerProvisioningService {

    private final UserRepository userRepository;
    private final PoliceStationRepository policeStationRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public User provisionOfficer(OfficerProvisionRequest request) {
        if (request.getRole() == Role.ROLE_CITIZEN) {
            throw new IllegalArgumentException("Officer provisioning cannot create citizens. Use citizen registration.");
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number is already registered: " + request.getPhoneNumber());
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() &&
                userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        PoliceStation station = policeStationRepository.findById(request.getStationId())
                .orElseThrow(() -> new IllegalArgumentException("Police Station not found with ID: " + request.getStationId()));

        // Auto-generate badge number if not supplied
        String badgeNumber = request.getBadgeNumber();
        if (badgeNumber == null || badgeNumber.trim().isEmpty()) {
            badgeNumber = generateUniqueBadgeNumber(station);
        } else if (userRepository.existsByBadgeNumber(badgeNumber.trim())) {
            throw new IllegalArgumentException("Badge number already exists: " + badgeNumber);
        }

        // Auto-generate temporary password if not provided
        String rawPassword = request.getTemporaryPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            rawPassword = "Police@" + (1000 + secureRandom.nextInt(9000));
        }

        String rankDesignation = request.getRankDesignation();
        if (rankDesignation == null || rankDesignation.trim().isEmpty()) {
            rankDesignation = request.getRole().getDescription();
        }

        User officer = User.builder()
                .badgeNumber(badgeNumber.trim())
                .fullName(request.getFullName().trim())
                .phoneNumber(request.getPhoneNumber().trim())
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .rankDesignation(rankDesignation.trim())
                .station(station)
                .isActive(true)
                .forcePasswordChange(true) // Enforce password change on first police login
                .build();

        return userRepository.save(officer);
    }

    @Transactional(readOnly = true)
    public List<User> listOfficersByStation(Long stationId) {
        return userRepository.findByStationId(stationId);
    }

    @Transactional(readOnly = true)
    public List<User> listAllOfficers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != Role.ROLE_CITIZEN)
                .toList();
    }

    private String generateUniqueBadgeNumber(PoliceStation station) {
        String stateCode = station.getState().substring(0, Math.min(2, station.getState().length())).toUpperCase();
        int currentYear = Year.now().getValue();

        for (int i = 0; i < 20; i++) {
            int randomSeq = 1000 + secureRandom.nextInt(9000);
            String candidate = String.format("POL-%s-%d-%04d", stateCode, currentYear, randomSeq);
            if (!userRepository.existsByBadgeNumber(candidate)) {
                return candidate;
            }
        }
        return "POL-" + stateCode + "-" + currentYear + "-" + System.currentTimeMillis() % 10000;
    }
}
