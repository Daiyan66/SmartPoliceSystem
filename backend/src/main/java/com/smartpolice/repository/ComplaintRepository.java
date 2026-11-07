package com.smartpolice.repository;

import com.smartpolice.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Optional<Complaint> findByTrackingToken(String trackingToken);
    Optional<Complaint> findByCrimeRegisterNumber(String crimeRegisterNumber);
    List<Complaint> findByCitizenId(Long citizenId);
    List<Complaint> findByStationId(Long stationId);
    List<Complaint> findByAssignedIoId(Long assignedIoId);
    List<Complaint> findByStatus(String status);
}
