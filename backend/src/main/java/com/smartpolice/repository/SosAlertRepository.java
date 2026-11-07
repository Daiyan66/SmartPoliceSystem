package com.smartpolice.repository;

import com.smartpolice.entity.SosAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlert, Long> {
    Optional<SosAlert> findByAlertToken(String alertToken);
    List<SosAlert> findByStatus(String status);
    List<SosAlert> findByAssignedStationId(Long stationId);
}
