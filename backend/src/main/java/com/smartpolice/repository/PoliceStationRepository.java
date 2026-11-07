package com.smartpolice.repository;

import com.smartpolice.entity.PoliceStation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PoliceStationRepository extends JpaRepository<PoliceStation, Long> {
    Optional<PoliceStation> findByStationCode(String stationCode);
    List<PoliceStation> findByDistrict(String district);
    List<PoliceStation> findByState(String state);
    List<PoliceStation> findByIsActiveTrue();
}
