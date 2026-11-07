package com.smartpolice.repository;

import com.smartpolice.entity.EvidenceAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvidenceAttachmentRepository extends JpaRepository<EvidenceAttachment, Long> {
    @Query("SELECT e FROM EvidenceAttachment e WHERE e.complaint.id = :complaintId")
    List<EvidenceAttachment> findByComplaintId(@Param("complaintId") Long complaintId);

    Optional<EvidenceAttachment> findBySha256Hash(String sha256Hash);
}
