# Smart Police System (IPS & Citizen Public Safety Portal)

### Legal & Regulatory Alignment:
- **BNS (2023)**: Bharatiya Nyaya Sanhita
- **BNSS (2023)**: Bharatiya Nagarik Suraksha Sanhita
- **BSA (2023)**: Bharatiya Sakshya Adhiniyam
- **CCTNS**: Crime and Criminal Tracking Network & Systems

---

## 1. Executive Overview

The **Smart Police System** is an enterprise-grade Law Enforcement and Public Safety Management platform engineered for the command structure of State Police departments in India. It bridges citizens and law enforcement officers with verified e-FIR filing, Zero-FIR inter-thana routing, whistleblower tip-lines with cryptographic metadata scrubbing, SOS emergency beacons, and automated departmental oversight.

### Tech Stack
| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Backend** | Java / Spring Boot | Java 21 / Spring Boot 3.3.4 | REST APIs, Spring Security 6, Spring Data JPA, Bucket4j |
| **Frontend** | React.js / Vite | React 18+ / Tailwind CSS / Lucide | Responsive Citizen & Command Operations Portal |
| **Database** | MySQL | MySQL 8.0 (Spatial SRID 4326) | Relational & Geospatial Storage |
| **AI / Microservices** | Python / FastAPI | Python 3.13 / FastAPI / Pillow | BNS Legal Mapping, EXIF Metadata Scrubber, Spatial Math |

---

## 2. Indian Police Hierarchy & RBAC Matrix

```
[State HQ]          DGP / ADGP       (ROLE_DIG_DGP)   -> State-wide strategic analytics, policy audits
                      │
[District Level]    SSP / SP         (ROLE_SP_SSP)    -> District commander, officer provisioning, escalations
                      │
[Police Station]    SHO (Inspector)  (ROLE_SHO)       -> Thana in-charge, FIR approval/rejection, IO assignment
                      │
[Field Unit]        SI / ASI (IO)    (ROLE_SUB_INSPECTOR) -> Investigating Officer, Case Diary entries, evidence
                      │
[Station / Beat]    HC / Constable   (ROLE_CONSTABLE) -> Station General Diary (GD), beat patrols, SOS responders
                      │
[Public]            Verified Citizen (ROLE_CITIZEN)   -> e-FIR, Zero-FIR, SOS distress, case tracking
```

---

## 3. Phase 1 Implementation Breakdown & Exit Criteria

### Completed Deliverables:
1. **Containerized & Native MySQL 8.0 Infrastructure**:
   - `database/01_schema.sql`: 8 production tables (`police_stations`, `users`, `refresh_tokens`, `complaints`, `evidence_attachments`, `evidence_audit_trail`, `sos_alerts`, `case_diaries`).
   - `database/02_seed_data.sql`: Seeded police stations with GPS spatial coordinates.
   - `docker-compose.yml`: Multi-container configuration for MySQL 8, Spring Boot, React, and Python.

2. **Zero-Trust Stateless JWT Security Architecture**:
   - Spring Security 6 with stateless session management.
   - 15-minute access token (`smartpolice.jwt.access-token-expiration-ms: 900000`).
   - 7-day rotating refresh tokens stored in database and HTTP-only cookies (`smartpolice.jwt.refresh-token-expiration-ms: 604800000`).
   - **Zero-Trust Rule**: Public citizen registration (`/api/auth/citizen-signup`) strictly enforces `ROLE_CITIZEN`. Passing `{"role": "ROLE_ADMIN"}` or officer roles triggers immediate HTTP 400 rejection.
   - **Administrative Officer Provisioning** (`/api/admin/officers/provision`): Restricted to `ROLE_SP_SSP`, `ROLE_DIG_DGP`, and `ROLE_ADMIN`, featuring auto-generated badge numbers (`POL-STATE-YEAR-XXXX`) and temporary passwords with mandatory first-login password change.

3. **Bucket4j Rate Limiting & DoS Defense**:
   - Token bucket filter intercepting login attempts, public endpoints, and SOS distress beacons.
   - Exceeding thresholds triggers HTTP 429 "Too Many Requests".

4. **Python Intelligence & Forensic Utility Service**:
   - FastAPI microservice running on port 8000.
   - BNS section search and classification reference engine (`/api/v1/legal/bns-lookup`).
   - BSA 2023 compliant EXIF metadata scrubber (`/api/v1/metadata/scrub-exif`).
   - Haversine spherical distance calculator (`/api/v1/spatial/haversine-distance`).

5. **React.js Frontend Portal**:
   - High-fidelity law enforcement UI (Deep Navy, Gold crest, Indian National Tricolor accents).
   - Citizen registration and dual-tab sign-in screen.
   - Quick demo authentication chips for one-click testing across all ranks.
   - Role-aware Command Dashboard with officer provisioning tool for SP/DGP.

---

## 4. Verification & Automated Test Results

The backend integration test suite (`com.smartpolice.AuthSecurityIntegrationTest`) ran against the live MySQL database:
```
[INFO] Running com.smartpolice.AuthSecurityIntegrationTest
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.95 s
[INFO] BUILD SUCCESS
```

| Exit Criterion | Status | Verification Method |
|---|---|---|
| **ROLE_CITIZEN Enforcement** | PASSED | `testCitizenSignupAssignsCitizenRole` verifies citizen role assignment |
| **Privilege Escalation Rejection** | PASSED | `testCitizenSignupRejectsPrivilegeEscalation` confirms HTTP 400 on `ROLE_ADMIN` attempt |
| **Officer Provisioning Guard** | PASSED | `testOfficerProvisioningUnauthorizedForCitizens` confirms HTTP 401/403 for non-admins |
| **District SP Provisioning** | PASSED | `testOfficerProvisioningByDistrictSP` verifies badge generation (`POL-DL-2026-XXXX`) |
| **JWT & Token Rotation** | PASSED | `testSuccessfulLoginAndTokenRotation` verifies 15-min JWT + rotating refresh token |
| **Bucket4j Rate Limiter** | PASSED | `testRateLimiterTriggersHttp429` confirms HTTP 429 on request flood |
| **Python Service Health & EXIF** | PASSED | `test_service.py` confirms all 5 test scenarios passed |
| **React Frontend Production Build**| PASSED | `vite build` completed in 7.16s generating optimized bundles |

---

## 5. Seeded Test Credentials

| Rank / Role | Phone Number | Password | Badge Number | Default Station |
|---|---|---|---|---|
| **DGP (State Head)** | `9876543210` | `Police@123` | `IPS-DGP-001` | State HQ |
| **District SP** | `9876543211` | `Police@123` | `IPS-SP-002` | New Delhi |
| **SHO (Inspector)** | `9876543212` | `Police@123` | `POL-SHO-003` | Connaught Place PS |
| **Sub-Inspector (IO)** | `9876543213` | `Police@123` | `POL-SI-004` | Connaught Place PS |
| **Constable** | `9876543214` | `Police@123` | `POL-CT-005` | Connaught Place PS |
| **Citizen (Public)** | `9988776655` | `Citizen@123` | *None* | *None* |

---

## 6. How to Run

### Option A: Local Development (Windows)

1. **MySQL Database**:
   Already active on port 3306 with database `smart_police_db`.

2. **Java Spring Boot Backend**:
   ```powershell
   cd backend
   mvn spring-boot:run
   ```
   Runs at: `http://localhost:8080`

3. **Python Service**:
   ```powershell
   cd python-service
   python main.py
   ```
   Runs at: `http://localhost:8000` (Docs at `http://localhost:8000/docs`)

4. **React Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
   Runs at: `http://localhost:5173`

### Option B: Docker Compose
```bash
docker compose up --build
```
