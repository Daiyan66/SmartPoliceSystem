package com.smartpolice.repository;

import com.smartpolice.entity.User;
import com.smartpolice.security.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByEmail(String email);
    Optional<User> findByBadgeNumber(String badgeNumber);

    boolean existsByPhoneNumber(String phoneNumber);
    boolean existsByEmail(String email);
    boolean existsByBadgeNumber(String badgeNumber);

    List<User> findByRole(Role role);
    List<User> findByStationId(Long stationId);
    List<User> findByStationIdAndRoleIn(Long stationId, List<Role> roles);
}
