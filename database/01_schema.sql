-- ==============================================================================
-- SMART POLICE SYSTEM (INDIAN POLICE SERVICE & CITIZEN PORTAL)
-- MySQL 8.0+ Core Schema DDL
-- Alignment: BNS (2023), BNSS (2023), BSA (2023), CCTNS
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS smart_police_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE smart_police_db;

-- 1. Police Stations & Jurisdictions
CREATE TABLE IF NOT EXISTS police_stations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    station_code VARCHAR(30) UNIQUE NOT NULL,
    station_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location_geom POINT SRID 4326,
    contact_number VARCHAR(25),
    in_charge_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_station_district (district),
    INDEX idx_station_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users & Police Officers (RBAC Hierarchy)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    badge_number VARCHAR(50) UNIQUE NULL, -- NULL for citizens
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ROLE_CITIZEN, ROLE_CONSTABLE, ROLE_HEAD_CONSTABLE, ROLE_ASI, ROLE_SUB_INSPECTOR, ROLE_SHO, ROLE_DSP_ASP, ROLE_SP_SSP, ROLE_DIG_DGP, ROLE_ADMIN
    rank_designation VARCHAR(100) NULL,
    station_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_station FOREIGN KEY (station_id) REFERENCES police_stations(id) ON DELETE SET NULL,
    INDEX idx_user_role (role),
    INDEX idx_user_phone (phone_number),
    INDEX idx_user_station (station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Refresh Tokens (Rotating 7-day tokens)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_user (user_id),
    INDEX idx_token_hash (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Complaints & e-FIRs (BNSS Compliant)
CREATE TABLE IF NOT EXISTS complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_token VARCHAR(60) UNIQUE NOT NULL,
    crime_register_number VARCHAR(60) UNIQUE NULL, -- Formal FIR CRN when approved by SHO
    citizen_id BIGINT NULL,
    station_id BIGINT NULL,
    incident_timestamp DATETIME NOT NULL,
    incident_location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location_geom POINT SRID 4326,
    description TEXT NOT NULL,
    bns_sections VARCHAR(255) NULL,
    ai_predicted_category VARCHAR(100) NULL,
    ai_confidence_score DECIMAL(5, 2) NULL,
    status VARCHAR(50) DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_VERIFICATION, FIR_REGISTERED, INVESTIGATION_IN_PROGRESS, CHARGESHEET_FILED, RESOLVED, CLOSED, REJECTED
    rejection_reason TEXT NULL,
    is_zero_fir BOOLEAN DEFAULT FALSE,
    assigned_io_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaint_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaint_station FOREIGN KEY (station_id) REFERENCES police_stations(id) ON DELETE SET NULL,
    CONSTRAINT fk_complaint_io FOREIGN KEY (assigned_io_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_complaint_status (status),
    INDEX idx_complaint_tracking (tracking_token),
    INDEX idx_complaint_station (station_id),
    INDEX idx_complaint_citizen (citizen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Digital Evidence Attachments (BSA 2023 Sec 63/65B Compliant)
CREATE TABLE IF NOT EXISTS evidence_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    sha256_hash CHAR(64) NOT NULL,
    is_exif_stripped BOOLEAN DEFAULT FALSE,
    uploaded_by_user_id BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evidence_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_evidence_complaint (complaint_id),
    INDEX idx_evidence_hash (sha256_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Evidence Chain of Custody Audit Trail (Immutable)
CREATE TABLE IF NOT EXISTS evidence_audit_trail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    evidence_id BIGINT NOT NULL,
    accessed_by_user_id BIGINT NULL,
    action_type VARCHAR(50) NOT NULL, -- VIEWED, DOWNLOADED, TRANSFERRED, FORENSIC_EXPORT
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_evidence FOREIGN KEY (evidence_id) REFERENCES evidence_attachments(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (accessed_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_evidence (evidence_id),
    INDEX idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SOS Emergency Distress Events
CREATE TABLE IF NOT EXISTS sos_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_token VARCHAR(60) UNIQUE NOT NULL,
    sender_id BIGINT NULL,
    phone_number VARCHAR(20) NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    location_geom POINT SRID 4326,
    assigned_station_id BIGINT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, PATROL_DISPATCHED, RESOLVED, FALSE_ALARM
    notes TEXT NULL,
    dispatched_patrol_unit VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sos_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_sos_station FOREIGN KEY (assigned_station_id) REFERENCES police_stations(id) ON DELETE SET NULL,
    INDEX idx_sos_status (status),
    INDEX idx_sos_token (alert_token),
    INDEX idx_sos_station (assigned_station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Case Diary Entries (Investigation Officer daily CD log)
CREATE TABLE IF NOT EXISTS case_diaries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id BIGINT NOT NULL,
    io_id BIGINT NOT NULL,
    entry_number INT NOT NULL,
    entry_timestamp DATETIME NOT NULL,
    investigation_notes TEXT NOT NULL,
    actions_taken TEXT NOT NULL,
    witness_statements JSON NULL,
    seizure_details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cd_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    CONSTRAINT fk_cd_io FOREIGN KEY (io_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_cd_complaint (complaint_id),
    INDEX idx_cd_io (io_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
