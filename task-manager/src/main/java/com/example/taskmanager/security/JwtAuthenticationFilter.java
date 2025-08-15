package com.example.taskmanager.security;

import com.example.taskmanager.entities.User;
import com.example.taskmanager.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    @Autowired
    private JwtUtil jwtUtil;
    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request, @org.springframework.lang.NonNull HttpServletResponse response, @org.springframework.lang.NonNull FilterChain filterChain)
            throws ServletException, IOException {
        logger.info("JwtAuthenticationFilter: Filter triggered for URI: {}", request.getRequestURI());
        String jwt = getJwtFromRequest(request);
        if (StringUtils.hasText(jwt)) {
            try {
                String username = jwtUtil.getUsernameFromToken(jwt);
                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userRepository.findByUsername(username).orElse(null);
                    if (user != null && jwtUtil.validateToken(jwt, username)) {
    logger.info("JWT Filter: Username from JWT: {}", username);
    logger.info("JWT Filter: Valid token for user {}", username);
                        Set<org.springframework.security.core.GrantedAuthority> authorities = user.getRoles().stream()
    .map(role -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role.getName()))
    .collect(java.util.stream.Collectors.toSet());
logger.info("JWT Filter: Setting authentication for user {} with authorities {}", user.getUsername(), authorities);
for (org.springframework.security.core.GrantedAuthority auth : authorities) {
    logger.info("JWT Filter: Authority present: {}", auth.getAuthority());
}
UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
    user, null, authorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }
            } catch (ExpiredJwtException ex) {
    logger.warn("JWT Filter: Expired JWT token: {}", ex.getMessage());
} catch (Exception ex) {
    logger.error("JWT Filter: Exception during JWT processing", ex);
}
        }
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
