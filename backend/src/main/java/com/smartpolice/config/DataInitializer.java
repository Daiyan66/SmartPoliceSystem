package com.smartpolice.config;

import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PoliceStationRepository policeStationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing Smart Police foundational data and accounts...");

        // Ensure primary station exists
        PoliceStation station = policeStationRepository.findByStationCode("PS-DL-CP-01")
                .orElseGet(() -> policeStationRepository.save(
                        PoliceStation.builder()
                                .stationCode("PS-DL-CP-01")
                                .stationName("Connaught Place Police Station")
                                .district("New Delhi")
                                .state("Delhi")
                                .latitude(28.6315)
                                .longitude(77.2167)
                                .contactNumber("+91-11-23340001")
                                .inChargeName("Inspector Rajesh Sharma")
                                .isActive(true)
                                .build()
                ));

        // 1. Seed State DGP
        seedUserIfNotExists("9876543210", "ips.dgp@police.gov.in", "IPS-DGP-001",
                "Shri Alok Kumar Verma, IPS", Role.ROLE_DIG_DGP, "Director General of Police", null, "Police@123");

        // 2. Seed District SP
        seedUserIfNotExists("9876543211", "sp.delhi@police.gov.in", "IPS-SP-002",
                "Smt. Rashmi Shukla, IPS", Role.ROLE_SP_SSP, "Superintendent of Police (District Head)", station, "Police@123");

        // 3. Seed Station House Officer (SHO)
        seedUserIfNotExists("9876543212", "sho.cp@delhipolice.gov.in", "POL-SHO-003",
                "Inspector Rajesh Sharma", Role.ROLE_SHO, "Station House Officer (SHO)", station, "Police@123");

        // 4. Seed Sub-Inspector (Investigation Officer)
        seedUserIfNotExists("9876543213", "si.sunil@delhipolice.gov.in", "POL-SI-004",
                "SI Sunil Kumar", Role.ROLE_SUB_INSPECTOR, "Sub-Inspector / Investigating Officer", station, "Police@123");

        // 5. Seed Constable
        seedUserIfNotExists("9876543214", "ct.amit@delhipolice.gov.in", "POL-CT-005",
                "Constable Amit Yadav", Role.ROLE_CONSTABLE, "Beat Constable", station, "Police@123");

        // 6. Seed Demo Citizen
        seedUserIfNotExists("9988776655", "citizen.demo@example.com", null,
                "Aarav Mehta (Citizen)", Role.ROLE_CITIZEN, null, null, "Citizen@123");

        log.info("Smart Police foundational accounts initialized successfully.");
    }

    private void seedUserIfNotExists(String phone, String email, String badge,
                                     String name, Role role, String designation,
                                     PoliceStation station, String password) {
        Optional<User> existing = userRepository.findByPhoneNumber(phone);
        if (existing.isEmpty()) {
            User user = User.builder()
                    .phoneNumber(phone)
                    .email(email)
                    .badgeNumber(badge)
                    .fullName(name)
                    .role(role)
                    .rankDesignation(designation)
                    .station(station)
                    .passwordHash(passwordEncoder.encode(password))
                    .isActive(true)
                    .forcePasswordChange(false)
                    .build();
            userRepository.save(user);
            log.info("Seeded user [{}] with role [{}] and phone [{}]", name, role, phone);
        }
    }
}
