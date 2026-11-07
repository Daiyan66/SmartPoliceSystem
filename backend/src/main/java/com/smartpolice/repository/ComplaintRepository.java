package com.smartpolice.repository;

import com.smartpolice.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    Optional<Complaint> findByTrackingToken(String trackingToken);
    Optional<Complaint> findByCrimeRegisterNumber(String crimeRegisterNumber);

    List<Complaint> findByCitizenIdOrderByCreatedAtDesc(Long citizenId);

    @Query("SELECT c FROM Complaint c WHERE c.station.id = :stationId ORDER BY c.createdAt DESC")
    List<Complaint> findByStationIdOrderByCreatedAtDesc(@Param("stationId") Long stationId);

    @Query("SELECT c FROM Complaint c WHERE c.station.id = :stationId AND c.status = :status ORDER BY c.createdAt DESC")
    List<Complaint> findByStationIdAndStatusOrderByCreatedAtDesc(@Param("stationId") Long stationId, @Param("status") String status);

    @Query("SELECT c FROM Complaint c WHERE c.assignedIo.id = :assignedIoId ORDER BY c.createdAt DESC")
    List<Complaint> findByAssignedIoIdOrderByCreatedAtDesc(@Param("assignedIoId") Long assignedIoId);

    List<Complaint> findByStatusOrderByCreatedAtDesc(String status);

    List<Complaint> findByIsZeroFirTrueOrderByCreatedAtDesc();

    @Query("SELECT c FROM Complaint c WHERE c.trackingToken = :token AND (c.citizen.phoneNumber = :phone OR c.description LIKE %:phone%)")
    Optional<Complaint> findByTrackingTokenAndPhone(@Param("token") String token, @Param("phone") String phone);
}
