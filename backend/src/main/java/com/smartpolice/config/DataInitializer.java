package com.smartpolice.config;

import com.smartpolice.entity.CaseDiary;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.SosAlert;
import com.smartpolice.entity.User;
import com.smartpolice.repository.CaseDiaryRepository;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.SosAlertRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PoliceStationRepository policeStationRepository;
    private final ComplaintRepository complaintRepository;
    private final CaseDiaryRepository caseDiaryRepository;
    private final SosAlertRepository sosAlertRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing Smart Police foundational data and accounts...");

        // 1. Seed Police Stations
        PoliceStation cpStation = seedStationIfNotExists("PS-DL-CP-01", "Connaught Place Police Station",
                "New Delhi", "Delhi", 28.6315, 77.2167, "+91-11-23340001", "Inspector Rajesh Sharma");

        PoliceStation bkStation = seedStationIfNotExists("PS-DL-BK-02", "Barakhamba Road Police Station",
                "New Delhi", "Delhi", 28.6290, 77.2280, "+91-11-23340002", "Inspector Alok Mathur");

        seedStationIfNotExists("PS-DL-KB-03", "Karol Bagh Police Station",
                "Central Delhi", "Delhi", 28.6517, 77.1906, "+91-11-23340003", "Inspector Sandeep Tyagi");

        // 2. Seed Officers & Citizen
        User dgp = seedUserIfNotExists("9876543210", "ips.dgp@police.gov.in", "IPS-DGP-001",
                "Shri Alok Kumar Verma, IPS", Role.ROLE_DIG_DGP, "Director General of Police", null, "Police@123");

        User sp = seedUserIfNotExists("9876543211", "sp.delhi@police.gov.in", "IPS-SP-002",
                "Smt. Rashmi Shukla, IPS", Role.ROLE_SP_SSP, "Superintendent of Police (District Head)", cpStation, "Police@123");

        User sho = seedUserIfNotExists("9876543212", "sho.cp@delhipolice.gov.in", "POL-SHO-003",
                "Inspector Rajesh Sharma", Role.ROLE_SHO, "Station House Officer (SHO)", cpStation, "Police@123");

        User ioSunil = seedUserIfNotExists("9876543213", "si.sunil@delhipolice.gov.in", "POL-SI-004",
                "SI Sunil Kumar", Role.ROLE_SUB_INSPECTOR, "Sub-Inspector / Investigating Officer", cpStation, "Police@123");

        seedUserIfNotExists("9876543214", "ct.amit@delhipolice.gov.in", "POL-CT-005",
                "Constable Amit Yadav", Role.ROLE_CONSTABLE, "Beat Constable", cpStation, "Police@123");

        User citizenAarav = seedUserIfNotExists("9988776655", "citizen.demo@example.com", null,
                "Aarav Mehta (Citizen)", Role.ROLE_CITIZEN, null, null, "Citizen@123");

        // 3. Seed Real Authentic Case Complaints
        seedComplaintsAndCaseDiaries(citizenAarav, cpStation, bkStation, sho, ioSunil);

        // 4. Seed Live 112 CAD Emergency Distress Alert
        seedSosAlerts(citizenAarav, cpStation);

        log.info("Smart Police foundational accounts, cases, and CAD dispatches initialized successfully.");
    }

    private PoliceStation seedStationIfNotExists(String code, String name, String dist, String state,
                                                 Double lat, Double lon, String phone, String inCharge) {
        return policeStationRepository.findByStationCode(code)
                .orElseGet(() -> policeStationRepository.save(
                        PoliceStation.builder()
                                .stationCode(code)
                                .stationName(name)
                                .district(dist)
                                .state(state)
                                .latitude(lat)
                                .longitude(lon)
                                .contactNumber(phone)
                                .inChargeName(inCharge)
                                .isActive(true)
                                .build()
                ));
    }

    private User seedUserIfNotExists(String phone, String email, String badge,
                                     String name, Role role, String designation,
                                     PoliceStation station, String password) {
        Optional<User> existing = userRepository.findByPhoneNumber(phone);
        if (existing.isPresent()) {
            return existing.get();
        }
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
        return userRepository.save(user);
    }

    private void seedComplaintsAndCaseDiaries(User citizen, PoliceStation cpStation, PoliceStation bkStation, User sho, User io) {
        // Case 1: Active Investigation (BNS 304 Snatching)
        String token1 = "FIR-DL-ND-2026-894102";
        if (complaintRepository.findByTrackingToken(token1).isEmpty()) {
            Complaint c1 = Complaint.builder()
                    .trackingToken(token1)
                    .crimeRegisterNumber("FIR-2026-CP-0512")
                    .citizen(citizen)
                    .station(cpStation)
                    .incidentTimestamp(LocalDateTime.now().minusDays(3).withHour(20).withMinute(15))
                    .incidentLocation("Near Rajiv Chowk Metro Station Gate 2")
                    .latitude(28.6321)
                    .longitude(77.2185)
                    .description("Yesterday evening around 8:15 PM, two unidentified men on a black Pulsar motorcycle grabbed my 22k gold chain and sped towards Radial Road 1. Sustained a minor scratch on neck. Eyewitness shopkeeper present at spot.")
                    .bnsSections("BNS Section 304 (Snatching), BNS Section 303(2) (Theft)")
                    .aiPredictedCategory("Snatching / Violent Theft")
                    .aiConfidenceScore(0.96)
                    .status("INVESTIGATION_IN_PROGRESS")
                    .assignedIo(io)
                    .isZeroFir(false)
                    .build();
            c1 = complaintRepository.save(c1);

            // Case Diary Entry 1
            caseDiaryRepository.save(CaseDiary.builder()
                    .complaint(c1)
                    .io(io)
                    .entryNumber(1)
                    .entryTimestamp(LocalDateTime.now().minusDays(2).withHour(11).withMinute(0))
                    .investigationNotes("Inspected spot at Rajiv Chowk Metro Gate 2. Recovered 2-gram broken link of gold chain near road curb. Questioned tea stall owner.")
                    .actionsTaken("Seized broken link as Material Object 1. Recorded formal statement of complainant Aarav Mehta under BNSS Section 180.")
                    .witnessStatements("[{\"name\": \"Ramesh Sharma (Shopkeeper)\", \"statement\": \"Saw a black Pulsar speed away without number plate towards Janpath at around 20:15 hrs.\", \"timestamp\": \"" + LocalDateTime.now().minusDays(2).toString() + "\"}]")
                    .seizureDetails("1x Broken gold chain link (approx 2 grams), sealed in plastic tamper-evident envelope #DL-CP-901.")
                    .build());

            // Case Diary Entry 2
            caseDiaryRepository.save(CaseDiary.builder()
                    .complaint(c1)
                    .io(io)
                    .entryNumber(2)
                    .entryTimestamp(LocalDateTime.now().minusDays(1).withHour(16).withMinute(30))
                    .investigationNotes("Visited DMRC CCTV Surveillance Center. Inspected CCTV feed of Gate 2 between 20:00 and 20:30 hrs. Identified two suspects wearing black jackets on motorcycle.")
                    .actionsTaken("Preserved 180MB video stream into DEMS locker with SHA-256 hash. Alerted Janpath beat constables for patrol surveillance.")
                    .witnessStatements(null)
                    .seizureDetails("1x USB drive containing Gate 2 exit CCTV footage (MIME video/mp4, SHA-256 logged).")
                    .build());
        }

        // Case 2: FIR Registered (Cyber Fraud BNS 318)
        String token2 = "FIR-DL-ND-2026-104921";
        if (complaintRepository.findByTrackingToken(token2).isEmpty()) {
            complaintRepository.save(Complaint.builder()
                    .trackingToken(token2)
                    .crimeRegisterNumber("FIR-2026-CP-0412")
                    .citizen(citizen)
                    .station(cpStation)
                    .incidentTimestamp(LocalDateTime.now().minusDays(7).withHour(14).withMinute(20))
                    .incidentLocation("Connaught Place Inner Circle ATM")
                    .latitude(28.6315)
                    .longitude(77.2167)
                    .description("Victim received fraudulent SMS with phishing link claiming electricity bill suspension. Clicking link led to unauthorized debit of INR 45,000 via UPI transaction to unknown wallet.")
                    .bnsSections("BNS Section 318(4) (Cheating by Impersonation), IT Act Sec 66D")
                    .aiPredictedCategory("Cyber Crime / Financial Fraud")
                    .aiConfidenceScore(0.98)
                    .status("FIR_REGISTERED")
                    .assignedIo(sho)
                    .isZeroFir(false)
                    .build());
        }

        // Case 3: Chargesheeted / Closed (Lost Article)
        String token3 = "FIR-DL-ND-2026-003819";
        if (complaintRepository.findByTrackingToken(token3).isEmpty()) {
            complaintRepository.save(Complaint.builder()
                    .trackingToken(token3)
                    .crimeRegisterNumber("CRN-2026-BK-0104")
                    .citizen(citizen)
                    .station(bkStation)
                    .incidentTimestamp(LocalDateTime.now().minusDays(20).withHour(17).withMinute(45))
                    .incidentLocation("Janpath Handicrafts Market Lane")
                    .latitude(28.6285)
                    .longitude(77.2210)
                    .description("Complainant misplaced Samsung Galaxy S24 Ultra mobile phone while shopping at Janpath Market. Handset successfully traced and handed over.")
                    .bnsSections("Lost Property Grievance (Disposed)")
                    .aiPredictedCategory("Property Recovery")
                    .aiConfidenceScore(0.92)
                    .status("CHARGESHEETED")
                    .assignedIo(io)
                    .isZeroFir(false)
                    .build());
        }

        // Case 4: Pending SHO Scrutiny (Ready for SHO to test Approval/Rejection buttons!)
        String token4 = "FIR-DL-ND-2026-771920";
        if (complaintRepository.findByTrackingToken(token4).isEmpty()) {
            complaintRepository.save(Complaint.builder()
                    .trackingToken(token4)
                    .crimeRegisterNumber(null)
                    .citizen(citizen)
                    .station(cpStation)
                    .incidentTimestamp(LocalDateTime.now().minusHours(4))
                    .incidentLocation("Radial Road 4, Connaught Place")
                    .latitude(28.6300)
                    .longitude(77.2150)
                    .description("Broken showroom display window and attempted burglary during midnight. Lock found tampered with crowbar marks.")
                    .bnsSections("BNS Section 331(4) (Lurking House-trespass & House-breaking)")
                    .aiPredictedCategory("Attempted Burglary")
                    .aiConfidenceScore(0.91)
                    .status("SUBMITTED")
                    .assignedIo(null)
                    .isZeroFir(false)
                    .build());
        }
    }

    private void seedSosAlerts(User citizen, PoliceStation station) {
        String alertToken = "SOS-2026-89104";
        if (sosAlertRepository.findByAlertToken(alertToken).isEmpty()) {
            sosAlertRepository.save(SosAlert.builder()
                    .alertToken(alertToken)
                    .sender(citizen)
                    .phoneNumber("9988776655")
                    .latitude(28.6321)
                    .longitude(77.2185)
                    .assignedStation(station)
                    .status("PATROL_DISPATCHED")
                    .dispatchedPatrolUnit("PCR Van 04 (ASI Ramesh & Ct. Satish)")
                    .notes("Emergency beacon triggered near Janpath handicrafts market. PCR Van 04 acknowledged and dispatched.")
                    .build());
        }
    }
}
