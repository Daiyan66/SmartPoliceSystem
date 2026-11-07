package com.smartpolice.repository;

import com.smartpolice.entity.CaseDiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseDiaryRepository extends JpaRepository<CaseDiary, Long> {

    @Query("SELECT cd FROM CaseDiary cd WHERE cd.complaint.id = :complaintId ORDER BY cd.entryNumber ASC")
    List<CaseDiary> findByComplaintIdOrderByEntryNumberAsc(@Param("complaintId") Long complaintId);

    @Query("SELECT COUNT(cd) FROM CaseDiary cd WHERE cd.complaint.id = :complaintId")
    long countByComplaintId(@Param("complaintId") Long complaintId);

    @Query("SELECT cd FROM CaseDiary cd WHERE cd.io.id = :ioId ORDER BY cd.createdAt DESC")
    List<CaseDiary> findByIoIdOrderByCreatedAtDesc(@Param("ioId") Long ioId);
}
