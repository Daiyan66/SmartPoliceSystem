package com.smartpolice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpolice.dto.*;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.JwtUtils;
import com.smartpolice.security.Role;
import com.smartpolice.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ThanaOperationsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PoliceStationRepository policeStationRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private PoliceStation testStation1;
    private PoliceStation testStation2;
    private User testSho;
    private User testIo;
    private User testCitizen;
    private String shoToken;
    private String ioToken;
    private String citizenToken;

    @BeforeEach
    void setUp() {
        long seed = System.nanoTime();

        testStation1 = policeStationRepository.save(PoliceStation.builder()
                .stationCode("PS-DL-TST-" + seed)
                .stationName("Connaught Place Test PS " + seed)
                .district("New Delhi")
                .state("Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .contactNumber("+91-11-23340001")
                .inChargeName("Inspector Test SHO")
                .isActive(true)
                .build());

        testStation2 = policeStationRepository.save(PoliceStation.builder()
                .stationCode("PS-MH-TST-" + seed)
                .stationName("Bandra Test PS " + seed)
                .district("Mumbai")
                .state("Maharashtra")
                .latitude(19.0596)
                .longitude(72.8295)
                .contactNumber("+91-22-26420101")
                .inChargeName("Inspector Mumbai SHO")
                .isActive(true)
                .build());

        testSho = userRepository.save(User.builder()
                .phoneNumber("98765" + (seed % 100000))
                .email("sho." + seed + "@police.gov.in")
                .badgeNumber("SHO-" + seed)
                .fullName("Inspector Vikram Rao (SHO)")
                .role(Role.ROLE_SHO)
                .rankDesignation("Station House Officer")
                .station(testStation1)
                .passwordHash(passwordEncoder.encode("Test@123"))
                .isActive(true)
                .build());

        testIo = userRepository.save(User.builder()
                .phoneNumber("98764" + (seed % 100000))
                .email("io." + seed + "@police.gov.in")
                .badgeNumber("IO-" + seed)
                .fullName("SI Ramesh Verma (IO)")
                .role(Role.ROLE_SUB_INSPECTOR)
                .rankDesignation("Sub-Inspector")
                .station(testStation1)
                .passwordHash(passwordEncoder.encode("Test@123"))
                .isActive(true)
                .build());

        testCitizen = userRepository.save(User.builder()
                .phoneNumber("98763" + (seed % 100000))
                .email("citizen." + seed + "@example.com")
                .fullName("Rajesh Kumar (Citizen)")
                .role(Role.ROLE_CITIZEN)
                .passwordHash(passwordEncoder.encode("Test@123"))
                .isActive(true)
                .build());

        shoToken = jwtUtils.generateAccessToken(UserPrincipal.build(testSho));
        ioToken = jwtUtils.generateAccessToken(UserPrincipal.build(testIo));
        citizenToken = jwtUtils.generateAccessToken(UserPrincipal.build(testCitizen));
    }

    @Test
    @DisplayName("Complete e-FIR to Chargesheet lifecycle: Filing -> SHO Approval -> IO Case Diary -> Chargesheet")
    void testEndToEndComplaintToChargesheetLifecycle() throws Exception {
        // Step 1: Citizen files e-Complaint
        ComplaintCreateRequest createReq = ComplaintCreateRequest.builder()
                .description("Two masked suspects on a motorcycle snatched a gold chain and mobile phone.")
                .incidentLocation("Outer Circle, Connaught Place, New Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .incidentTimestamp(LocalDateTime.now().minusHours(2))
                .stationId(testStation1.getId())
                .isZeroFir(false)
                .bnsSections("BNS 303(2), BNS 304")
                .aiPredictedCategory("SNATCHING_AND_ROBBERY")
                .aiConfidenceScore(0.96)
                .citizenPhone(testCitizen.getPhoneNumber())
                .citizenName(testCitizen.getFullName())
                .build();

        MvcResult fileResult = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.trackingToken").exists())
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andReturn();

        ComplaintResponse complaintResponse = objectMapper.readValue(
                objectMapper.readTree(fileResult.getResponse().getContentAsString()).get("data").toString(),
                ComplaintResponse.class
        );

        Long complaintId = complaintResponse.getId();
        String trackingToken = complaintResponse.getTrackingToken();
        assertTrue(trackingToken.startsWith("FIR-"));

        // Step 2: SHO reviews station queue and approves complaint into formal FIR
        ShoApprovalRequest approveReq = ShoApprovalRequest.builder()
                .assignedIoId(testIo.getId())
                .notes("Cognizable offence prima facie made out. Registering regular FIR.")
                .build();

        MvcResult approveResult = mockMvc.perform(post("/api/sho/complaints/" + complaintId + "/approve")
                        .header("Authorization", "Bearer " + shoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(approveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.crimeRegisterNumber").exists())
                .andExpect(jsonPath("$.data.status").value("INVESTIGATION_IN_PROGRESS"))
                .andExpect(jsonPath("$.data.assignedIoName").value("SI Ramesh Verma (IO)"))
                .andReturn();

        ComplaintResponse approvedComplaint = objectMapper.readValue(
                objectMapper.readTree(approveResult.getResponse().getContentAsString()).get("data").toString(),
                ComplaintResponse.class
        );
        String crn = approvedComplaint.getCrimeRegisterNumber();
        assertTrue(crn.startsWith("CRN-"));

        // Step 3: IO writes Case Diary (CD) entries with witness statements and seizure memos
        CaseDiaryEntryRequest cdEntry1 = CaseDiaryEntryRequest.builder()
                .investigationNotes("Visited crime scene at CP Outer Circle. Inspected CCTV camera angles.")
                .actionsTaken("Recorded statement of eyewitness Tea Vendor Mahesh under BNSS Section 180.")
                .witnessStatements("[{\"witness\": \"Mahesh Kumar\", \"statement\": \"Saw black Pulsar bike speeding away toward Barakhamba Road.\"}]")
                .seizureDetails("Seized CCTV DVR footage. Digital fingerprint SHA-256 logged.")
                .build();

        mockMvc.perform(post("/api/investigation/cases/" + complaintId + "/case-diaries")
                        .header("Authorization", "Bearer " + ioToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cdEntry1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.entryNumber").value(1))
                .andExpect(jsonPath("$.data.crimeRegisterNumber").value(crn));

        // Step 4: IO generates Draft Final Report / Chargesheet (Form 5 / U/S 193 BNSS 2023)
        mockMvc.perform(get("/api/investigation/cases/" + complaintId + "/chargesheet")
                        .header("Authorization", "Bearer " + ioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.crimeRegisterNumber").value(crn))
                .andExpect(jsonPath("$.data.totalCaseDiaryEntries").value(1))
                .andExpect(jsonPath("$.data.ioName").value("SI Ramesh Verma (IO)"))
                .andExpect(jsonPath("$.data.magistrateCourtPrayer").exists());

        // Step 5: IO formally submits Chargesheet to Magistrate Court
        mockMvc.perform(post("/api/investigation/cases/" + complaintId + "/chargesheet/submit")
                        .header("Authorization", "Bearer " + ioToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CHARGESHEET_FILED"));

        // Verify status in DB
        Complaint updated = complaintRepository.findById(complaintId).orElseThrow();
        assertEquals("CHARGESHEET_FILED", updated.getStatus());
    }

    @Test
    @DisplayName("Public IDOR protection: Guest tracking requires OTP request and verification")
    void testGuestTrackingOtpProtection() throws Exception {
        // File a complaint as guest
        ComplaintCreateRequest req = ComplaintCreateRequest.builder()
                .description("Lost original driving license and purse while commuting.")
                .incidentLocation("Metro Gate 4, Rajiv Chowk")
                .latitude(28.6328)
                .longitude(77.2195)
                .stationId(testStation1.getId())
                .citizenPhone("9811223344")
                .citizenName("Pooja Sharma")
                .build();

        MvcResult fileResult = mockMvc.perform(post("/api/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        String token = objectMapper.readTree(fileResult.getResponse().getContentAsString())
                .get("data").get("trackingToken").asText();

        // 1. Request OTP
        GuestTrackOtpRequest otpReq = GuestTrackOtpRequest.builder()
                .trackingToken(token)
                .phoneNumber("9811223344")
                .build();

        MvcResult otpResult = mockMvc.perform(post("/api/complaints/track/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(otpReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.simulatedOtp").exists())
                .andReturn();

        String otp = objectMapper.readTree(otpResult.getResponse().getContentAsString())
                .get("data").get("simulatedOtp").asText();

        // 2. Reject incorrect OTP
        GuestTrackVerifyRequest badVerify = GuestTrackVerifyRequest.builder()
                .trackingToken(token)
                .phoneNumber("9811223344")
                .otp("000000")
                .build();

        mockMvc.perform(post("/api/complaints/track/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badVerify)))
                .andExpect(status().isBadRequest());

        // 3. Accept valid OTP and retrieve tracking information
        GuestTrackVerifyRequest goodVerify = GuestTrackVerifyRequest.builder()
                .trackingToken(token)
                .phoneNumber("9811223344")
                .otp(otp)
                .build();

        mockMvc.perform(post("/api/complaints/track/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(goodVerify)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.trackingToken").value(token))
                .andExpect(jsonPath("$.data.status").value("SUBMITTED"));
    }

    @Test
    @DisplayName("Zero-FIR Inter-Thana transfer forwards case to jurisdictional police station")
    void testZeroFirTransferRouting() throws Exception {
        // File Zero-FIR at Station 1 although incident belongs to Mumbai (Station 2)
        ComplaintCreateRequest req = ComplaintCreateRequest.builder()
                .description("Cheating and extortion during business transaction in Mumbai.")
                .incidentLocation("Linking Road, Bandra, Mumbai")
                .latitude(19.0596)
                .longitude(72.8295)
                .stationId(testStation1.getId())
                .isZeroFir(true)
                .citizenPhone(testCitizen.getPhoneNumber())
                .build();

        MvcResult fileResult = mockMvc.perform(post("/api/complaints")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        Long complaintId = objectMapper.readTree(fileResult.getResponse().getContentAsString())
                .get("data").get("id").asLong();

        // SHO transfers Zero-FIR to Station 2 (Mumbai)
        ZeroFirTransferRequest transferReq = ZeroFirTransferRequest.builder()
                .targetStationId(testStation2.getId())
                .transferReason("Incident locus belongs to Bandra Police Station jurisdiction.")
                .build();

        mockMvc.perform(post("/api/sho/complaints/" + complaintId + "/transfer-zero-fir")
                        .header("Authorization", "Bearer " + shoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(transferReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stationId").value(testStation2.getId()))
                .andExpect(jsonPath("$.data.isZeroFir").value(true))
                .andExpect(jsonPath("$.data.status").value("TRANSFERRED_TO_JURISDICTIONAL_THANA"));
    }
}
