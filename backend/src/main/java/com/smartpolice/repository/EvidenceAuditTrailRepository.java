package com.smartpolice.repository;

import com.smartpolice.entity.EvidenceAuditTrail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvidenceAuditTrailRepository extends JpaRepository<EvidenceAuditTrail, Long> {
    @Query("SELECT a FROM EvidenceAuditTrail a WHERE a.evidence.id = :evidenceId ORDER BY a.timestamp DESC")
    List<EvidenceAuditTrail> findByEvidenceIdOrderByTimestampDesc(@Param("evidenceId") Long evidenceId);
}
