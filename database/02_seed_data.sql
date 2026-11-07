-- ==============================================================================
-- SMART POLICE SYSTEM (INDIAN POLICE SERVICE & CITIZEN PORTAL)
-- MySQL 8.0+ Initial Seed Data
-- ==============================================================================

USE smart_police_db;

-- 1. Sample Police Stations (Indian Metros and Districts)
INSERT INTO police_stations (station_code, station_name, district, state, latitude, longitude, location_geom, contact_number, in_charge_name, is_active)
VALUES
('PS-DL-CP-01', 'Connaught Place Police Station', 'New Delhi', 'Delhi', 28.6315000, 77.2167000, ST_SRID(POINT(77.2167000, 28.6315000), 4326), '+91-11-23340001', 'Inspector Rajesh Sharma (SHO)', TRUE),
('PS-MH-PUN-01', 'Shivajinagar Police Station', 'Pune', 'Maharashtra', 18.5314000, 73.8446000, ST_SRID(POINT(73.8446000, 18.5314000), 4326), '+91-20-25530100', 'Inspector Vikram Patil (SHO)', TRUE),
('PS-MH-MUM-01', 'Bandra Police Station', 'Mumbai', 'Maharashtra', 19.0596000, 72.8295000, ST_SRID(POINT(72.8295000, 19.0596000), 4326), '+91-22-26420101', 'Inspector Sanjay Shinde (SHO)', TRUE),
('PS-KA-BLR-01', 'Koramangala Police Station', 'Bengaluru Urban', 'Karnataka', 12.9352000, 77.6245000, ST_SRID(POINT(77.6245000, 12.9352000), 4326), '+91-80-22942000', 'Inspector Manjunath Gowda (SHO)', TRUE),
('PS-UP-LKO-01', 'Hazratganj Police Station', 'Lucknow', 'Uttar Pradesh', 26.8467000, 80.9462000, ST_SRID(POINT(80.9462000, 26.8467000), 4326), '+91-522-2200100', 'Inspector Ajay Singh (SHO)', TRUE)
ON DUPLICATE KEY UPDATE station_name=VALUES(station_name);
