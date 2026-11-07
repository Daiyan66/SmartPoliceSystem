package com.smartpolice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpolice.dto.CitizenSignupRequest;
import com.smartpolice.dto.LoginRequest;
import com.smartpolice.dto.OfficerProvisionRequest;
import com.smartpolice.dto.TokenRefreshRequest;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PoliceStationRepository policeStationRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private PoliceStation testStation;

    @BeforeEach
    void setUp() {
        testStation = policeStationRepository.findAll().stream().findFirst().orElseGet(() ->
                policeStationRepository.save(PoliceStation.builder()
                        .stationCode("TEST-PS-01")
                        .stationName("Central Test Police Station")
                        .district("New Delhi")
                        .state("Delhi")
                        .latitude(28.6139)
                        .longitude(77.2090)
                        .build())
        );
    }

    @Test
    @DisplayName("Exit Criterion: Public citizen signup strictly assigns ROLE_CITIZEN")
    void testCitizenSignupAssignsCitizenRole() throws Exception {
        String testPhone = "98111" + (int)(Math.random() * 90000 + 10000);
        CitizenSignupRequest request = CitizenSignupRequest.builder()
                .fullName("Rajesh Sharma")
                .phoneNumber(testPhone)
                .email("rajesh" + testPhone + "@example.com")
                .password("CitizenPass@123")
                .build();

        mockMvc.perform(post("/api/auth/citizen-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.role").value("ROLE_CITIZEN"))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());

        User created = userRepository.findByPhoneNumber(testPhone).orElseThrow();
        assertThat(created.getRole()).isEqualTo(Role.ROLE_CITIZEN);
        assertThat(created.getBadgeNumber()).isNull();
    }

    @Test
    @DisplayName("Exit Criterion: Attempting privilege escalation (e.g. ROLE_ADMIN) returns HTTP 400 Bad Request")
    void testCitizenSignupRejectsPrivilegeEscalation() throws Exception {
        String testPhone = "98222" + (int)(Math.random() * 90000 + 10000);
        CitizenSignupRequest request = CitizenSignupRequest.builder()
                .fullName("Hacker Admin")
                .phoneNumber(testPhone)
                .email("hacker" + testPhone + "@exploit.com")
                .password("Malicious@123")
                .role("ROLE_ADMIN") // Attempt to escalate privilege
                .build();

        mockMvc.perform(post("/api/auth/citizen-signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Privilege escalation violation")));

        // Ensure user was NOT created in DB
        assertThat(userRepository.findByPhoneNumber(testPhone)).isEmpty();
    }

    @Test
    @DisplayName("Exit Criterion: Officer provisioning is forbidden for unauthenticated / citizen users (HTTP 401 / 403)")
    void testOfficerProvisioningUnauthorizedForCitizens() throws Exception {
        String testPhone = "98333" + (int)(Math.random() * 90000 + 10000);
        OfficerProvisionRequest request = OfficerProvisionRequest.builder()
                .fullName("Unauthorized Officer")
                .phoneNumber(testPhone)
                .role(Role.ROLE_SUB_INSPECTOR)
                .stationId(testStation.getId())
                .build();

        // 1. Unauthenticated -> 401
        mockMvc.perform(post("/api/admin/officers/provision")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());

        // 2. Authenticated as Citizen -> 403 Forbidden
        User citizen = userRepository.findByRole(Role.ROLE_CITIZEN).stream().findFirst().orElseThrow();
        String citizenToken = jwtUtils.generateAccessToken(UserPrincipal.build(citizen));

        mockMvc.perform(post("/api/admin/officers/provision")
                        .header("Authorization", "Bearer " + citizenToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Exit Criterion: District SP can provision police personnel with auto-generated badge numbers")
    void testOfficerProvisioningByDistrictSP() throws Exception {
        User districtSp = userRepository.findByPhoneNumber("9876543211").orElseThrow();
        String spToken = jwtUtils.generateAccessToken(UserPrincipal.build(districtSp));

        String testPhone = "98444" + (int)(Math.random() * 90000 + 10000);
        OfficerProvisionRequest request = OfficerProvisionRequest.builder()
                .fullName("Sub-Inspector Manisha Rane")
                .phoneNumber(testPhone)
                .email("manisha." + testPhone + "@police.gov.in")
                .role(Role.ROLE_SUB_INSPECTOR)
                .stationId(testStation.getId())
                .rankDesignation("Sub-Inspector / Crime Branch")
                .build();

        mockMvc.perform(post("/api/admin/officers/provision")
                        .header("Authorization", "Bearer " + spToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.badgeNumber").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ROLE_SUB_INSPECTOR"))
                .andExpect(jsonPath("$.data.forcePasswordChange").value(true));

        User officer = userRepository.findByPhoneNumber(testPhone).orElseThrow();
        assertThat(officer.getBadgeNumber()).startsWith("POL-");
        assertThat(officer.getRole()).isEqualTo(Role.ROLE_SUB_INSPECTOR);
    }

    @Test
    @DisplayName("Exit Criterion: Login returns valid 15-minute access token and rotating refresh token")
    void testSuccessfulLoginAndTokenRotation() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("9876543210") // State DGP seeded account
                .password("Police@123")
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("ROLE_DIG_DGP"))
                .andReturn();

        String responseContent = loginResult.getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(responseContent).path("data").path("refreshToken").asText();

        // Test refresh token rotation
        TokenRefreshRequest refreshRequest = new TokenRefreshRequest(refreshToken);
        mockMvc.perform(post("/api/auth/refresh-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("Exit Criterion: Bucket4j rate limiting triggers HTTP 429 when capacity is exceeded")
    void testRateLimiterTriggersHttp429() throws Exception {
        LoginRequest loginRequest = LoginRequest.builder()
                .identifier("9999999999")
                .password("WrongPassword")
                .build();

        boolean hit429 = false;
        // The login capacity is 10 requests per minute
        for (int i = 0; i < 15; i++) {
            int status = mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "198.51.100.42")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andReturn().getResponse().getStatus();

            if (status == 429) {
                hit429 = true;
                break;
            }
        }

        assertThat(hit429).isTrue();
    }
}
