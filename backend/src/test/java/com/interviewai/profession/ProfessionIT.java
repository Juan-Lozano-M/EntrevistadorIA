package com.interviewai.profession;

import com.interviewai.support.AuthenticatedIT;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProfessionIT extends AuthenticatedIT {

    @Test
    void listsSeededProfession() throws Exception {
        mockMvc.perform(get("/api/professions").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.slug=='software-development')]").exists());
    }

    @Test
    void rejectsUnauthenticated() throws Exception {
        mockMvc.perform(get("/api/professions"))
            .andExpect(status().isForbidden());
    }

    @Test
    void returnsConfigOptions() throws Exception {
        mockMvc.perform(get("/api/professions/options").header("Authorization", bearer()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.levels").isArray())
            .andExpect(jsonPath("$.types").isArray());
    }
}
