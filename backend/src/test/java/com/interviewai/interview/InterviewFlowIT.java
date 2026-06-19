package com.interviewai.interview;

import com.interviewai.support.AuthenticatedIT;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.assertj.core.api.Assertions.assertThat;

class InterviewFlowIT extends AuthenticatedIT {

    @Autowired ObjectMapper mapper;

    @Test
    void fullInterviewLifecycle() throws Exception {
        String auth = bearer();

        // create
        String createBody = """
            {"professionSlug":"software-development","roleTitle":"Backend Dev",
             "targetCompany":"Acme","industry":"Tech","level":"JUNIOR","type":"MIXED",
             "language":"es","durationMinutes":15}""";
        String createResp = mockMvc.perform(post("/api/interviews")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(createBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andReturn().getResponse().getContentAsString();
        long sessionId = mapper.readTree(createResp).get("id").asLong();

        // answer every question until none remain
        int guard = 0;
        while (guard++ < 50) {
            String nextResp = mockMvc.perform(get("/api/interviews/" + sessionId + "/next-question")
                    .header("Authorization", auth))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
            JsonNode next = mapper.readTree(nextResp);
            if (next.get("question").isNull()) break;
            long qid = next.get("question").get("id").asLong();
            String answerBody = """
                {"questionId":%d,"answerText":"Una respuesta detallada con memoria, índice y complejidad bien explicada.","responseTimeMs":25000,"selfConfidence":4}"""
                .formatted(qid);
            mockMvc.perform(post("/api/interviews/" + sessionId + "/answers")
                    .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(answerBody))
                .andExpect(status().isOk());
        }

        // finish
        mockMvc.perform(post("/api/interviews/" + sessionId + "/finish").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.overallScore").isNumber());

        // results
        String results = mockMvc.perform(get("/api/interviews/" + sessionId + "/results")
                .header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.dimensionScores").exists())
            .andExpect(jsonPath("$.feedback.strengths").isArray())
            .andReturn().getResponse().getContentAsString();
        assertThat(mapper.readTree(results).get("answers")).isNotEmpty();

        // history
        mockMvc.perform(get("/api/interviews").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").isNumber());
    }

    @Test
    void cannotAccessAnotherUsersSession() throws Exception {
        // create as default tester
        String auth = bearer();
        String createBody = """
            {"professionSlug":"software-development","roleTitle":"R","level":"JUNIOR",
             "type":"MIXED","language":"es","durationMinutes":15}""";
        String createResp = mockMvc.perform(post("/api/interviews")
                .header("Authorization", auth).contentType(MediaType.APPLICATION_JSON).content(createBody))
            .andReturn().getResponse().getContentAsString();
        long sessionId = mapper.readTree(createResp).get("id").asLong();

        // a different user
        String otherToken = "Bearer " + jwtService.generateToken("intruder@test.com");
        // ensure user exists
        if (!users.existsByEmail("intruder@test.com")) {
            var u = new com.interviewai.auth.User();
            u.setName("Intruder"); u.setEmail("intruder@test.com");
            u.setPasswordHash(encoder.encode("secret123")); users.save(u);
        }
        mockMvc.perform(get("/api/interviews/" + sessionId + "/results").header("Authorization", otherToken))
            .andExpect(status().isNotFound());
    }
}
