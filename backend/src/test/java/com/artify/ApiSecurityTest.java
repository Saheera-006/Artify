package com.artify;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.artify.service.EvaluationService;
import java.time.Instant;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
    properties = {"artify.admin-uids=trusted-admin", "artify.firebase-project-id=demo-test"})
@AutoConfigureMockMvc
class ApiSecurityTest {
  @Autowired MockMvc mvc;
  @MockitoBean JwtDecoder decoder;
  @MockitoBean EvaluationService service;

  Jwt token(String uid, boolean admin) {
    return Jwt.withTokenValue("token")
        .header("alg", "RS256")
        .subject(uid)
        .issuedAt(Instant.now())
        .expiresAt(Instant.now().plusSeconds(3600))
        .claim("admin", admin)
        .build();
  }

  @Test
  void healthIsPublic() throws Exception {
    mvc.perform(get("/api/health"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));
  }

  @Test
  void missingTokenDenied() throws Exception {
    mvc.perform(post("/api/evaluate-design").contentType("application/json").content("{}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void forgedTokenDenied() throws Exception {
    when(decoder.decode("fake")).thenThrow(new BadJwtException("bad signature"));
    mvc.perform(
            post("/api/evaluate-design")
                .header("Authorization", "Bearer fake")
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isUnauthorized());
    verifyNoInteractions(service);
  }

  @Test
  void ordinaryFirebaseUserDenied() throws Exception {
    when(decoder.decode("user")).thenReturn(token("student", false));
    mvc.perform(
            post("/api/evaluate-design")
                .header("Authorization", "Bearer user")
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isForbidden());
    verifyNoInteractions(service);
  }

  @Test
  void explicitAdminUidAllowed() throws Exception {
    when(decoder.decode("admin")).thenReturn(token("trusted-admin", false));
    when(service.evaluate(any())).thenReturn(Map.of("evaluation", Map.of("totalScore", 90)));
    mvc.perform(
            post("/api/evaluate-design")
                .header("Authorization", "Bearer admin")
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.evaluation.totalScore").value(90));
  }

  @Test
  void signedAdminClaimAllowed() throws Exception {
    when(decoder.decode("admin")).thenReturn(token("another-admin", true));
    when(service.evaluate(any())).thenReturn(Map.of("evaluation", Map.of("totalScore", 75)));
    mvc.perform(
            post("/api/evaluate-design")
                .header("Authorization", "Bearer admin")
                .contentType("application/json")
                .content("{}"))
        .andExpect(status().isOk());
  }

  @Test
  void unapprovedOriginDenied() throws Exception {
    mvc.perform(
            options("/api/evaluate-design")
                .header("Origin", "https://untrusted.example")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden());
  }

  @Test
  void approvedOriginAllowed() throws Exception {
    mvc.perform(
            options("/api/evaluate-design")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isOk());
  }

  @Test
  void malformedJsonReturns400() throws Exception {
    when(decoder.decode("admin")).thenReturn(token("trusted-admin", false));
    mvc.perform(
            post("/api/evaluate-design")
                .header("Authorization", "Bearer admin")
                .contentType("application/json")
                .content("{"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void oversizedRequestRejected() throws Exception {
    when(decoder.decode("admin")).thenReturn(token("trusted-admin", false));
    mvc.perform(
            post("/api/evaluate-design")
                .servletPath("/api/evaluate-design")
                .header("Authorization", "Bearer admin")
                .contentType("application/json")
                .content(" ".repeat(1024 * 1024 + 1)))
        .andExpect(status().isPayloadTooLarge());
  }
}
