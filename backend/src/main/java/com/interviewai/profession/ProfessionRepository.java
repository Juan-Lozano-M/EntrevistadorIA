package com.interviewai.profession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ProfessionRepository extends JpaRepository<Profession, Long> {
    Optional<Profession> findBySlug(String slug);
}
