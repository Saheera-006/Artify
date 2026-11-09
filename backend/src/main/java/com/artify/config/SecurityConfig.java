package com.artify.config;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  @Bean
  JwtDecoder jwtDecoder(@Value("${artify.firebase-project-id}") String project) {
    // No service-account secret is needed to verify Firebase's public signatures.
    NimbusJwtDecoder decoder =
        NimbusJwtDecoder.withJwkSetUri(
                "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
            .build();
    OAuth2TokenValidator<Jwt> audience =
        jwt ->
            !project.isBlank()
                    && jwt.getAudience().contains(project)
                    && jwt.getSubject() != null
                    && !jwt.getSubject().isBlank()
                    && jwt.getSubject().length() <= 128
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
    decoder.setJwtValidator(
        new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer("https://securetoken.google.com/" + project),
            audience));
    return decoder;
  }

  @Bean
  SecurityFilterChain security(
      HttpSecurity http,
      @Value("${artify.admin-uids}") String configuredUids,
      @Value("${artify.allowed-origins}") String origins)
      throws Exception {
    Set<String> admins =
        new HashSet<>(
            Arrays.stream(configuredUids.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList());
    // Bearer tokens only: no session cookie is used for backend authentication.
    http.csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .cors(
            c ->
                c.configurationSource(
                    request -> {
                      CorsConfiguration config = new CorsConfiguration();
                      config.setAllowedOrigins(
                          Arrays.stream(origins.split(",")).map(String::trim).toList());
                      config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
                      config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
                      return config;
                    }))
        .authorizeHttpRequests(
            a ->
                a.requestMatchers(HttpMethod.GET, "/api/health")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/evaluate-design")
                    .hasRole("ADMIN")
                    .anyRequest()
                    .denyAll())
        .oauth2ResourceServer(
            o ->
                o.jwt(
                        j ->
                            j.jwtAuthenticationConverter(
                                jwt -> {
                                  boolean admin =
                                      Boolean.TRUE.equals(jwt.getClaims().get("admin"))
                                          || admins.contains(jwt.getSubject());
                                  return new JwtAuthenticationToken(
                                      jwt,
                                      admin
                                          ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                                          : List.of());
                                }))
                    .authenticationEntryPoint(
                        (request, response, error) -> {
                          response.setStatus(401);
                          response.setContentType("application/json");
                          response
                              .getWriter()
                              .write("{\"error\":\"Invalid or missing Firebase login token.\"}");
                        }))
        .exceptionHandling(
            e ->
                e.accessDeniedHandler(
                    (request, response, error) -> {
                      response.setStatus(403);
                      response.setContentType("application/json");
                      response.getWriter().write("{\"error\":\"Admin access is required.\"}");
                    }));
    return http.build();
  }
}
