package com.smartpolice.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
@RequiredArgsConstructor
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        boolean allowed = true;

        if (path.contains("/api/auth/login") || path.contains("/api/auth/citizen-signup")) {
            allowed = rateLimitingService.tryConsumeLogin(clientIp);
        } else if (path.contains("/api/sos/trigger")) {
            allowed = rateLimitingService.tryConsumeSos(clientIp);
        } else if (path.contains("/api/ai/chat")) {
            allowed = rateLimitingService.tryConsumeAiChat(clientIp);
        } else if (path.startsWith("/api/public/")) {
            allowed = rateLimitingService.tryConsumeGeneral(clientIp);
        }

        if (!allowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("success", false);
            errorBody.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorBody.put("error", "Too Many Requests");
            errorBody.put("message", "Rate limit exceeded. Too many attempts from this IP. Please wait a moment before trying again.");
            errorBody.put("timestamp", System.currentTimeMillis());

            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
