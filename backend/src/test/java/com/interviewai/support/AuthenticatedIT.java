package com.interviewai.support;

import com.interviewai.auth.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import com.interviewai.auth.*;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class AuthenticatedIT extends PostgresIT {
    @Autowired protected MockMvc mockMvc;
    @Autowired protected JwtService jwtService;
    @Autowired protected UserRepository users;
    @Autowired protected PasswordEncoder encoder;

    protected String bearer() {
        String email = "tester@test.com";
        if (!users.existsByEmail(email)) {
            User u = new User();
            u.setName("Tester"); u.setEmail(email);
            u.setPasswordHash(encoder.encode("secret123"));
            users.save(u);
        }
        return "Bearer " + jwtService.generateToken(email);
    }
}
